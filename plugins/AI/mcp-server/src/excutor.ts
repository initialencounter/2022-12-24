import { Context, Element, Logger } from "koishi";
import { TaskResult } from "./utils";

declare module 'koishi' {
  interface Events {
    "mcp-result"(taskId: string, result: string): void
  }
}

export const inject = ['server']
const logger = new Logger('mcp-server')
const TaskResult: Record<string, { result: any; timestamp: number }> = {};

export function apply(ctx: Context) {
  ctx.command("EhSH6624QAubdPQvZvPCW", "mcp 执行器", {hidden: true})
    .option("command", "-m <command:string>")
    .option("taskId", "-t <taskId:string>")
    .option("options", "-o <options:string>")
    .action(async ({ session, options }, ...args) => {
      const taskId = options.taskId;
      const command = options.command;
      const optionsString = options.options;
      const commandOptions = queryStringToOptions(optionsString);
      if (!taskId || !command) {
        return;
      }
      const executeCommand = `${command.trim()} ${args.join(' ').trim()} ${commandOptions.trim()}`
      logger.info(`MCP适配器代理执行命令: ${executeCommand}`)
      const result = await session.execute(executeCommand, true);
      ctx.emit("mcp-result", taskId, elementToText(result));
      TaskResult[taskId] = { result: elementToText(result), timestamp: Date.now() };
    });


  ctx.server.post("/get-mcp-result", async (ctx1) => {
    const taskId = ctx1.request.body.taskId;
    if (!taskId) {
      ctx1.status = 400;
      ctx1.body = "taskId is required";
    } else if (!TaskResult[taskId]) {
      ctx1.status = 404;
      ctx1.body = "Task not found";
    } else {
      ctx1.status = 200;
      ctx1.response.type = "application/text";
      ctx1.body = TaskResult[taskId].result;
    }
  });

  // 定时清理超过30分钟未被删除的任务
  setInterval(() => {
    const now = Date.now();
    for (const taskId in TaskResult) {
      if (now - TaskResult[taskId].timestamp > 30 * 60 * 1000) { // 30分钟
        delete TaskResult[taskId];
      }
    }
  }, 5 * 60 * 1000); // 每5分钟检查一次
}

function elementToText(element: Element[]) {
  let content = "";
  for (const e of element) {
    if (e.type === "text") {
      return content + "\n" + e.attrs.content;
    }
  }
  return content;
}


function queryStringToOptions(queryString: string) {
  const options = new URLSearchParams(queryString).entries();
  let result = ''
  for (const [key, value] of options) {
    result += `--${key} ${value} `
  }
  return result;
}