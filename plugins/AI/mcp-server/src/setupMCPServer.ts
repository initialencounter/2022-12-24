import { McpServer, ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { } from "@koishijs/plugin-server"
import { z } from "zod";
import { Command, Computed, Context, h, Session } from "koishi";
import { generateTaskId, WebHookResponse } from "./utils";
import McpBot from "./mcpBot";

declare module 'koishi' {
  interface Events {
    "mcp-result"(taskId: string, result: string): void
    "create-task"(data: WebHookResponse): Promise<string>
  }
  namespace Command {
    interface Config {
      /** hide all options by default */
      hideOptions?: boolean
      /** hide command */
      hidden?: Computed<boolean>
      /** localization params */
      params?: object
    }
  }
}

interface MCPTool {
  name: string,
  description: string,
  paramsSchema: z.ZodRawShape,
  cb: ToolCallback<z.ZodRawShape>
}
type Transform<T> = (source: string, session: Session) => T;
interface Domain {
  el: h[];
  elements: h[];
  string: string;
  number: number;
  boolean: boolean;
  text: string;
  rawtext: string;
  user: string;
  channel: string;
  integer: number;
  posint: number;
  natural: number;
  bigint: bigint;
  date: Date;
  img: JSX.IntrinsicElements['img'];
  image: JSX.IntrinsicElements['img'];
  audio: JSX.IntrinsicElements['audio'];
  video: JSX.IntrinsicElements['video'];
  file: JSX.IntrinsicElements['file'];
}
type DomainType = keyof Domain;
interface DomainConfig<T = any> {
  transform?: Transform<T>;
  greedy?: boolean;
  numeric?: boolean;
}
type Type = DomainType | RegExp | readonly string[] | Transform<any> | DomainConfig<any>;
interface Options {
  name?: string;
  type?: Type;
  fallback?: any;
  variadic?: boolean;
  required?: boolean;
}

function commandToMCPTool(ctx: Context, command: Command, commandAdditionDescription: Record<string, string>): MCPTool {
  const name = command.name
  let description = ''
  if (commandAdditionDescription[name]) {
    description = commandAdditionDescription[name]
  } else {
    description = ctx.i18n.get(`commands.${name}.description`, ['zh-CN'])['zh-CN'] ?? ''
  }
  const args = command._arguments
  const options: Options[] = Object.values(command._options).map((opt) => {
    if (!('hidden' in opt) || !opt.hidden) return opt
  })
  const paramsSchema: z.ZodRawShape = {
    args: z.string().array().describe(`Sample input format:\n${JSON.stringify(args)}`),
    options: z.string().describe(`Sample input format:\n${JSON.stringify(options)}`),
  }

  const cb = async ({ args, options }) => {
    let optionsObj = {}
    try { optionsObj = JSON.parse(options) } catch (e) { }

    const taskId = generateTaskId()

    return await new Promise((resolve, reject) => {
      const dispose = ctx.on('mcp-result', (taskId1: string, result: string) => {
        if (taskId === taskId1) {
          dispose()
          resolve({
            content: [
              {
                type: "text",
                text: result,
              },
            ],
          });
        }
      })
      ctx.emit("create-task", {
        command: name,
        args: args,
        options: optionsObj,
        taskId: taskId,
      })
      setTimeout(() => {
        dispose()
        reject(new Error('timeout'))
      }, 30 * 60 * 1000)
    });
  }
  //@ts-ignore
  return { name, description, paramsSchema, cb }

}
export async function setupMCPServer(ctx: Context, config: McpBot.Config) {
  const commandAdditionDescriptionMap = {}
  for (const commandDesc of config.commandAdditionDescription) {
    commandAdditionDescriptionMap[commandDesc.name] = commandDesc.description
  }
  const server = new McpServer({
    name: "koishi-mcp",
    version: "1.0.0",
    description: `Koishi MCP Server\n\n
# This mcp tool from this koishi-mcp service only contains two parameters, namely args and options. Please strictly follow the following rules to determine the values of the parameters

## args:

Please enter the corresponding combination of command parameters according to the JSON format description of the following command-line parameters. Requirement:

- Only output the actual available combinations of command parameters

- Each parameter can be used alone or in combination

- Follow the standard command-line syntax norms

- No explanation is needed. Just output the possible combinations directly

## options:

Please input the corresponding JSON format command option output based on the provided command option definitions for the JavaScript object array format. It is required to strictly follow the structure of the input data for conversion.

Input format description:

Each option object contains the following key fields:

- name: Option name (as the key for outputting JSON)

- type: Option type (determines the type of the output value)

Other fields (such as syntax, etc.) can be ignored

Output requirements:

- Only include the option of type: 'boolean'

- All Boolean options output true by default

- The field name is consistent with the input "name" field

- Output in standard JSON format`,
  });
  const $ = ctx.$commander
  const commands = $._commandList.filter(cmd => !cmd.config?.hidden)
  for (const command of commands) {
    const { name, description, paramsSchema, cb } = commandToMCPTool(ctx, command, commandAdditionDescriptionMap)
    server.tool(name, description, paramsSchema, cb)
  }

  return server;
}
