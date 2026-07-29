import { Schema } from 'koishi'
import { Config as markdownToImageServiceConfig} from 'koishi-plugin-markdown-to-image-service'
export interface ToolSwitches {
  readFiles: boolean
  search: boolean
  bash: boolean
  editor: boolean
  webFetch: boolean
  skills: boolean
}

export interface McpConfig {
  enabled: boolean
  settingsPath: string
}

export interface TriggerConfig {
  private: boolean
  mention: boolean
  nickname: string[]
  whisper: boolean
}

export interface RenderConfig {
  enabled: boolean
  threshold: number
  markdownToImageServiceConfig: markdownToImageServiceConfig
}

export type ProcessLevel = 'none' | 'tools' | 'verbose' | 'debug'

export interface Config {
  providerId: string
  apiKey: string
  baseUrl: string
  modelId: string
  cwd: string
  maxIterations: number
  customInstructions: string
  tools: ToolSwitches
  autoApprove: boolean
  processLevel: ProcessLevel
  mcp: McpConfig
  trigger: TriggerConfig
  render: RenderConfig
}

export const Config: Schema<Config> = Schema.object({
  providerId: Schema.string()
    .default('openai-compatible')
    .description('LLM Provider ID(@cline/llms 内置,如 openai-compatible / openai / anthropic)'),
  apiKey: Schema.string()
    .role('secret')
    .default('sk-')
    .description('API Key'),
  baseUrl: Schema.string()
    .default('https://api.deepseek.com/v1')
    .description('API Base URL'),
  modelId: Schema.string()
    .default('deepseek-chat')
    .description('模型名称'),
  cwd: Schema.string()
    .default('')
    .description('Agent 工作目录(留空则为 Koishi 进程工作目录),文件操作与命令执行均在此目录下进行'),
  maxIterations: Schema.number()
    .default(25)
    .description('单次任务最大迭代次数'),
  customInstructions: Schema.string()
    .role('textarea')
    .default('')
    .description('附加到系统提示词的自定义指令'),
  tools: Schema.object({
    readFiles: Schema.boolean().default(true).description('读取文件'),
    search: Schema.boolean().default(true).description('搜索代码库'),
    bash: Schema.boolean().default(true).description('执行命令'),
    editor: Schema.boolean().default(true).description('编辑/创建文件'),
    webFetch: Schema.boolean().default(true).description('抓取网页'),
    skills: Schema.boolean().default(false).description('Skills 调用'),
  }).description('内置工具开关'),
  autoApprove: Schema.boolean()
    .default(true)
    .description('自动批准所有工具调用(关闭后执行命令、写文件等危险操作需用户回复 y 确认)'),
  processLevel: Schema.union([
    Schema.const('none' as const).description('静默:仅发送最终结果'),
    Schema.const('tools' as const).description('简洁:工具调用与错误'),
    Schema.const('verbose' as const).description('详细:思考内容 + 工具调用'),
    Schema.const('debug' as const).description('调试:全部过程(含工具输出与推理)'),
  ])
    .default('tools')
    .description('过程反馈等级:将 Agent 的工作过程按详细程度反馈给用户'),
  mcp: Schema.object({
    enabled: Schema.boolean().default(true).description('启用 MCP 工具'),
    settingsPath: Schema.string()
      .default('')
      .description('MCP 配置文件路径(留空则为 <工作目录>/.mcp.json)'),
  }).description('MCP 设置'),
  trigger: Schema.object({
    private: Schema.boolean().default(true).description('私聊触发'),
    mention: Schema.boolean().default(true).description('@机器人触发'),
    nickname: Schema.array(Schema.string())
      .default([])
      .description('昵称触发:消息以列表中任一昵称开头时触发,例如 `["小助手"]`'),
    whisper: Schema.boolean().default(false).description('语音触发(需要加载 sst 服务插件)'),
  }).description('触发方式(指令 cline 始终可用)'),
  render: Schema.object({
    enabled: Schema.boolean()
      .default(true)
      .description('将长文本与任务结果渲染为 markdown 图片(需要加载 markdown-to-image 服务插件,未加载时回退为纯文本)'),
    threshold: Schema.number()
      .default(50)
      .description('超过该字数的文本将渲染为图片'),
    markdownToImageServiceConfig: markdownToImageServiceConfig,
  }).description('输出渲染'),
})
