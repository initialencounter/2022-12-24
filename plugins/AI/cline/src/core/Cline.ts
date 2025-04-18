import type { Anthropic } from "@anthropic-ai/sdk"
import fs from "fs/promises"
import * as path from "path"
import { findLastIndex } from "../shared/array"
import {
  ClineAsk,
  ClineAskUseMcpServer,
  ClineMessage,
  ClineSay,
} from "../shared/ExtensionMessage"
import { ClineAskResponse } from "../shared/WebviewMessage"
import { fileExistsAtPath, isDirectory } from "../utils/fs"
import { AssistantMessageContent, parseAssistantMessage, ToolParamName, ToolUseName } from "./assistant-message"
import { ClineIgnoreController, LOCK_TEXT_SYMBOL } from "./ignore/ClineIgnoreController"
import { formatResponse } from "./prompts/responses"
import { addUserInstructions, SYSTEM_PROMPT } from "./prompts/system"
import { DEFAULT_LANGUAGE_SETTINGS, getLanguageKey } from "../shared/Languages"
import { GlobalFileNames } from "../global-constants"
import { Logger, Session } from "koishi"
import { OpenAiCaller } from "../api/providers/openai"
import { ContextManager } from "./context-management/ContextManager"
import { McpHub } from "../services/mcp/McpHub"

const cwd = process.cwd()

type ToolResponse = string | Array<Anthropic.TextBlockParam | Anthropic.ImageBlockParam>

export class Cline {
  readonly taskId: string
  readonly apiProvider?: string
  customInstructions?: string
  apiConversationHistory: Anthropic.MessageParam[] = []
  clineMessages: ClineMessage[] = []
  private clineIgnoreController: ClineIgnoreController
  private consecutiveAutoApprovedRequestsCount: number = 0
  private consecutiveMistakeCount: number = 0
  private abort: boolean = false
  didFinishAbortingStream = false
  abandoned = false
  checkpointTrackerErrorMessage?: string
  conversationHistoryDeletedRange?: [number, number]
  isInitialized = false
  isAwaitingPlanResponse = false
  didRespondToPlanAskBySwitchingMode = false

  // streaming
  isWaitingForFirstChunk = false
  isStreaming = false
  private assistantMessageContent: AssistantMessageContent[] = []
  private userMessageContent: (Anthropic.TextBlockParam | Anthropic.ImageBlockParam)[] = []
  private didRejectTool = false
  private didAlreadyUseTool = false
  private contextManager: ContextManager
  private mcpHub: McpHub
  private api: OpenAiCaller
  private result: string
  private needContinue = false
  private session: Session
  logger = new Logger("Cline")
  constructor(
    mcphub: McpHub,
    api: OpenAiCaller,
  ) {
    this.mcpHub = mcphub
    this.clineIgnoreController = new ClineIgnoreController(cwd)
    this.clineIgnoreController.initialize().catch((error) => {
      console.error("Failed to initialize ClineIgnoreController:", error)
    })
    this.customInstructions = undefined
    this.contextManager = new ContextManager()
    this.api = api
    this.result = "请求失败，请查看日志"
  }

  // Task lifecycle

  async startTask(task: string, session: Session): Promise<void> {
    this.session = session
    // conversationHistory (for API) and clineMessages (for webview) need to be in sync
    // if the extension process were killed, then on restart the clineMessages might not be empty, so we need to set it to [] when we create a new Cline client (otherwise webview would show stale messages from previous session)
    this.clineMessages = []

    this.isInitialized = true
    this.apiConversationHistory = [{
      //@ts-ignore
      role: "system",
      content: await this.createSystemPrompt(),
    }, {
      role: "user",
      content: task,
    }]
    let attemptsCount = 0
    while (!this.abort) {
      if (attemptsCount > 10) break
      await this.recursivelyMakeClineRequests()
      attemptsCount++
      if (!this.needContinue) break
    }
    session.send(this.result)
  }
  private updateConversationHistory(msg: Anthropic.MessageParam[]) {
    this.apiConversationHistory.push(...msg)
  }
  // Checkpoints

  shouldAutoApproveTool(_toolName: ToolUseName): boolean {
    return true
  }

  async recursivelyMakeClineRequests() {
    if (this.abort) {
      throw new Error("Cline instance aborted")
    }
    // get previous api req's index to check token usage and determine if we need to truncate conversation history
    const previousApiReqIndex = findLastIndex(this.clineMessages, (m) => m.say === "api_req_started")

    try {
      const assistantMessage = await this.attemptApiRequest(previousApiReqIndex) // yields only if the first chunk is successful, otherwise will allow the user to retry the request (most likely due to rate limit error, which gets thrown on the first chunk)
      // parse raw assistant message into content blocks
      this.apiConversationHistory.push({
        role: "assistant",
        content: assistantMessage,
      })
      this.assistantMessageContent = parseAssistantMessage(assistantMessage)
      // present content to user
      await this.presentAssistantMessage()
    } finally {
      this.isStreaming = false
    }
  }

  async createSystemPrompt(): Promise<string> {
    let systemPrompt = SYSTEM_PROMPT(cwd, false, this.mcpHub)
    let settingsCustomInstructions = this.customInstructions?.trim()
    const preferredLanguage = getLanguageKey(undefined)
    const preferredLanguageInstructions =
      preferredLanguage && preferredLanguage !== DEFAULT_LANGUAGE_SETTINGS
        ? `# Preferred Language\n\nSpeak in ${preferredLanguage}.`
        : ""
    const clineRulesFilePath = path.resolve(cwd, GlobalFileNames.clineRules)
    let clineRulesFileInstructions: string | undefined
    if (await fileExistsAtPath(clineRulesFilePath)) {
      if (await isDirectory(clineRulesFilePath)) {
        try {
          // Read all files in the .clinerules/ directory.
          const ruleFiles = await fs
            .readdir(clineRulesFilePath, { withFileTypes: true, recursive: true })
            .then((files) => files.filter((file) => file.isFile()))
            .then((files) => files.map((file) => path.resolve(file.parentPath, file.name)))
          const ruleFileContent = await Promise.all(
            ruleFiles.map(async (file) => {
              const ruleFilePath = path.resolve(clineRulesFilePath, file)
              const ruleFilePathRelative = path.relative(cwd, ruleFilePath)
              return `${ruleFilePathRelative}\n` + (await fs.readFile(ruleFilePath, "utf8")).trim()
            }),
          ).then((contents) => contents.join("\n\n"))
          clineRulesFileInstructions = `# .clinerules/\n\nThe following is provided by a root-level .clinerules/ directory where the user has specified instructions for this working directory (${cwd.replace(/\\/g, '/')})\n\n${ruleFileContent}`
        } catch {
          console.error(`Failed to read .clinerules directory at ${clineRulesFilePath}`)
        }
      } else {
        try {
          const ruleFileContent = (await fs.readFile(clineRulesFilePath, "utf8")).trim()
          if (ruleFileContent) {
            clineRulesFileInstructions = `# .clinerules\n\nThe following is provided by a root-level .clinerules file where the user has specified instructions for this working directory (${cwd.replace(/\\/g, '/')})\n\n${ruleFileContent}`
          }
        } catch {
          console.error(`Failed to read .clinerules file at ${clineRulesFilePath}`)
        }
      }
    }

    const clineIgnoreContent = this.clineIgnoreController.clineIgnoreContent
    let clineIgnoreInstructions: string | undefined
    if (clineIgnoreContent) {
      clineIgnoreInstructions = `# .clineignore\n\n(The following is provided by a root-level .clineignore file where the user has specified files and directories that should not be accessed. When using list_files, you'll notice a ${LOCK_TEXT_SYMBOL} next to files that are blocked. Attempting to access the file's contents e.g. through read_file will result in an error.)\n\n${clineIgnoreContent}\n.clineignore`
    }

    if (
      settingsCustomInstructions ||
      clineRulesFileInstructions ||
      clineIgnoreInstructions ||
      preferredLanguageInstructions
    ) {
      // altering the system prompt mid-task will break the prompt cache, but in the grand scheme this will not change often so it's better to not pollute user messages with it the way we have to with <potentially relevant details>
      systemPrompt += addUserInstructions(
        settingsCustomInstructions,
        clineRulesFileInstructions,
        clineIgnoreInstructions,
        preferredLanguageInstructions,
      )
    }
    return systemPrompt
  }
  async attemptApiRequest(previousApiReqIndex: number): Promise<string> {
    // Wait for MCP servers to be connected before generating system prompt


    const contextManagementMetadata = this.contextManager.getNewContextMessagesAndMetadata(
      this.apiConversationHistory,
      this.clineMessages,
      this.conversationHistoryDeletedRange,
      previousApiReqIndex,
    )

    if (contextManagementMetadata.updatedConversationHistoryDeletedRange) {
      this.conversationHistoryDeletedRange = contextManagementMetadata.conversationHistoryDeletedRange
    }
    const result = await this.api.chat(contextManagementMetadata.truncatedConversationHistory)
    return result
  }
  async ask(
    type: ClineAsk,
    text?: string,
  ): Promise<{
    response: ClineAskResponse
    text?: string
    images?: string[]
  }> {
    this.logger.info("Asking", type, text)
    await this.session.send(`Cline wants to use $type: ${type}, $text: ${text}, do you agree[Y/n]?`)
    const continu = await this.session.prompt(150000)
    if (continu.toUpperCase().startsWith("Y")) {
      return {
        response: "yesButtonClicked",
      }
    }
    return {
      response: "noButtonClicked",
    }
  }

  async say(type: ClineSay, text?: string): Promise<undefined> {
    this.session.send(`Cline Saying type:\n${type}, text:\n${text}`)
    this.logger.info("Saying", type, text)
  }
  async presentAssistantMessage() {
    this.needContinue = false
    if (this.abort) {
      throw new Error("Cline instance aborted")
    }
    for (const block of this.assistantMessageContent) {
      await this.blockHandle(block)
    }
  }

  async blockHandle(block: AssistantMessageContent) {
    switch (block.type) {
      case "text": {
        this.result = block.content
        if (this.didRejectTool || this.didAlreadyUseTool) {
          break
        }
        let content = block.content
        if (content) {
          // (have to do this for partial and complete since sending content in thinking tags to markdown renderer will automatically be removed)
          // Remove end substrings of <thinking or </thinking (below xml parsing is only for opening tags)
          // (this is done with the xml parsing below now, but keeping here for reference)
          // content = content.replace(/<\/?t(?:h(?:i(?:n(?:k(?:i(?:n(?:g)?)?)?)?)?)?)?$/, "")
          // Remove all instances of <thinking> (with optional line break after) and </thinking> (with optional line break before)
          // - Needs to be separate since we dont want to remove the line break before the first tag
          // - Needs to happen before the xml parsing below
          content = content.replace(/<thinking>\s?/g, "")
          content = content.replace(/\s?<\/thinking>/g, "")
          // Remove partial XML tag at the very end of the content (for tool use and thinking tags)
          // (prevents scrollview from jumping when tags are automatically removed)
          const lastOpenBracketIndex = content.lastIndexOf("<")
          if (lastOpenBracketIndex !== -1) {
            const possibleTag = content.slice(lastOpenBracketIndex)
            // Check if there's a '>' after the last '<' (i.e., if the tag is complete) (complete thinking and tool tags will have been removed by now)
            const hasCloseBracket = possibleTag.includes(">")
            if (!hasCloseBracket) {
              // Extract the potential tag name
              let tagContent: string
              if (possibleTag.startsWith("</")) {
                tagContent = possibleTag.slice(2).trim()
              } else {
                tagContent = possibleTag.slice(1).trim()
              }
              // Check if tagContent is likely an incomplete tag name (letters and underscores only)
              const isLikelyTagName = /^[a-zA-Z_]+$/.test(tagContent)
              // Preemptively remove < or </ to keep from these artifacts showing up in chat (also handles closing thinking tags)
              const isOpeningOrClosing = possibleTag === "<" || possibleTag === "</"
              // If the tag is incomplete and at the end, remove it from the content
              if (isOpeningOrClosing || isLikelyTagName) {
                content = content.slice(0, lastOpenBracketIndex).trim()
              }
            }
          }
        }

        if (!block.partial) {
          // Some models add code block artifacts (around the tool calls) which show up at the end of text content
          // matches ``` with at least one char after the last backtick, at the end of the string
          const match = content?.trimEnd().match(/```[a-zA-Z0-9_-]+$/)
          if (match) {
            const matchLength = match[0].length
            content = content.trimEnd().slice(0, -matchLength)
          }
        }
        await this.say("text", content)
        break
      }
      case "tool_use":
        const toolDescription = () => {
          switch (block.name) {
            case "execute_command":
              return `[${block.name} for '${block.params.command}']`
            case "read_file":
              return `[${block.name} for '${block.params.path}']`
            case "write_to_file":
              return `[${block.name} for '${block.params.path}']`
            case "replace_in_file":
              return `[${block.name} for '${block.params.path}']`
            case "search_files":
              return `[${block.name} for '${block.params.regex}'${block.params.file_pattern ? ` in '${block.params.file_pattern}'` : ""
                }]`
            case "list_files":
              return `[${block.name} for '${block.params.path}']`
            case "list_code_definition_names":
              return `[${block.name} for '${block.params.path}']`
            case "browser_action":
              return `[${block.name} for '${block.params.action}']`
            case "use_mcp_tool":
              return `[${block.name} for '${block.params.server_name}']`
            case "access_mcp_resource":
              return `[${block.name} for '${block.params.server_name}']`
            case "ask_followup_question":
              return `[${block.name} for '${block.params.question}']`
            case "plan_mode_respond":
              return `[${block.name}]`
            case "attempt_completion":
              return `[${block.name}]`
          }
        }

        const pushToolResult = (content: ToolResponse) => {
          this.userMessageContent.push({
            type: "text",
            text: `${toolDescription()} Result:`,
          })
          if (typeof content === "string") {
            this.userMessageContent.push({
              type: "text",
              text: content || "(tool did not return anything)",
            })
          } else {
            this.userMessageContent.push(...content)
          }
          // once a tool result has been collected, ignore all other tool uses since we should only ever present one tool result per message
          this.didAlreadyUseTool = true
        }

        // The user can approve, reject, or provide feedback (rejection). However the user may also send a message along with an approval, in which case we add a separate user message with this feedback.
        const pushAdditionalToolFeedback = (feedback?: string, images?: string[]) => {
          if (!feedback && !images) {
            return
          }
          const content = formatResponse.toolResult(
            `The user provided the following feedback:\n<feedback>\n${feedback}\n</feedback>`,
            images,
          )
          if (typeof content === "string") {
            this.userMessageContent.push({
              type: "text",
              text: content,
            })
          } else {
            this.userMessageContent.push(...content)
          }
        }

        const askApproval = async (type: ClineAsk, partialMessage?: string) => {
          const { response, text, images } = await this.ask(type, partialMessage)
          if (response !== "yesButtonClicked") {
            // User pressed reject button or responded with a message, which we treat as a rejection
            pushToolResult(formatResponse.toolDenied())
            if (text || images?.length) {
              pushAdditionalToolFeedback(text, images)
              await this.say("user_feedback", text)
            }
            this.didRejectTool = true // Prevent further tool uses in this message
            return false
          } else {
            // User hit the approve button, and may have provided feedback
            if (text || images?.length) {
              pushAdditionalToolFeedback(text, images)
              await this.say("user_feedback", text)
            }
            return true
          }
        }

        const handleError = async (action: string, error: Error) => {
          if (this.abandoned) {
            return
          }
          const errorString = `Error ${action}: ${JSON.stringify(error)}`
          await this.say(
            "error",
            `Error ${action}:\n${error.message ?? JSON.stringify(error, null, 2)}`,
          )
          // this.toolResults.push({
          // 	type: "tool_result",
          // 	tool_use_id: toolUseId,
          // 	content: await this.formatToolError(errorString),
          // })
          pushToolResult(formatResponse.toolError(errorString))
        }

        // If block is partial, remove partial closing tag so its not presented to user
        const removeClosingTag = (tag: ToolParamName, text?: string) => {
          if (!block.partial) {
            return text || ""
          }
          if (!text) {
            return ""
          }
          // This regex dynamically constructs a pattern to match the closing tag:
          // - Optionally matches whitespace before the tag
          // - Matches '<' or '</' optionally followed by any subset of characters from the tag name
          const tagRegex = new RegExp(
            `\\s?<\/?${tag
              .split("")
              .map((char) => `(?:${char})?`)
              .join("")}$`,
            "g",
          )
          return text.replace(tagRegex, "")
        }

        switch (block.name) {
          case "attempt_completion": {
            this.needContinue = false
            this.result = block.params.result
            break
          }
          case "use_mcp_tool": {
            this.needContinue = true
            const server_name: string | undefined = block.params.server_name
            const tool_name: string | undefined = block.params.tool_name
            const mcp_arguments: string | undefined = block.params.arguments
            try {
              if (block.partial) {
                const partialMessage = JSON.stringify({
                  type: "use_mcp_tool",
                  serverName: removeClosingTag("server_name", server_name),
                  toolName: removeClosingTag("tool_name", tool_name),
                  arguments: removeClosingTag("arguments", mcp_arguments),
                } satisfies ClineAskUseMcpServer)

                if (this.shouldAutoApproveTool(block.name)) {
                  await this.say("use_mcp_server", partialMessage)
                } else {
                  await this.ask("use_mcp_server", partialMessage).catch(() => { })
                }

                break
              } else {
                if (!server_name) {
                  this.consecutiveMistakeCount++

                  break
                }
                if (!tool_name) {
                  this.consecutiveMistakeCount++

                  break
                }
                let parsedArguments: Record<string, unknown> | undefined
                if (mcp_arguments) {
                  try {
                    parsedArguments = JSON.parse(mcp_arguments)
                  } catch (error) {
                    this.consecutiveMistakeCount++
                    await this.say(
                      "error",
                      `Cline tried to use ${tool_name} with an invalid JSON argument. Retrying...`,
                    )
                    pushToolResult(
                      formatResponse.toolError(
                        formatResponse.invalidMcpToolArgumentError(server_name, tool_name),
                      ),
                    )
                    break
                  }
                }
                this.consecutiveMistakeCount = 0
                const completeMessage = JSON.stringify({
                  type: "use_mcp_tool",
                  serverName: server_name,
                  toolName: tool_name,
                  arguments: mcp_arguments,
                } satisfies ClineAskUseMcpServer)

                const isToolAutoApproved = true

                if (this.shouldAutoApproveTool(block.name) && isToolAutoApproved) {
                  await this.say("use_mcp_server", completeMessage)
                  this.consecutiveAutoApprovedRequestsCount++
                } else {
                  const didApprove = await askApproval("use_mcp_server", completeMessage)
                  if (!didApprove) {
                    break
                  }
                }

                // now execute the tool
                await this.say("mcp_server_request_started") // same as browser_action_result
                const toolResult = await this.mcpHub?.callTool(server_name, tool_name, parsedArguments)
                // TODO: add progress indicator and ability to parse images and non-text responses
                const toolResultPretty =
                  (toolResult?.isError ? "Error:\n" : "") +
                  toolResult?.content
                    .map((item) => {
                      if (item.type === "text") {
                        return item.text
                      }
                      if (item.type === "resource") {
                        const { blob, ...rest } = item.resource
                        return JSON.stringify(rest, null, 2)
                      }
                      return ""
                    })
                    .filter(Boolean)
                    .join("\n\n") || "(No response)"
                await this.say("mcp_server_response", toolResultPretty)
                pushToolResult(formatResponse.toolResult(toolResultPretty))
                this.updateConversationHistory([{
                  role: "user",
                  content: toolResultPretty,
                }])
                break
              }
            } catch (error) {
              await handleError("executing MCP tool", error)
              break
            }
          }
        }
        break
    }
  }
}
