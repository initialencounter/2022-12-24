import { Adapter, Context, Logger } from "koishi";
import McpBot from "./mcpBot";
import { } from '@koishijs/plugin-server'
import { createSession, generateTaskId, WebHookResponse } from "./utils";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { setupMCPServer } from "./setupMCPServer";
import { Readable } from 'stream';

declare module 'koishi' {
  interface Events {
    "mcp-result"(taskId: string, result: string): void
    "create-task"(data: WebHookResponse): Promise<string>
  }
}


class McpAdapter<C extends Context> extends Adapter<C, McpBot<C>> {
  static inject = ['server']
  logger: Logger;
  bot: McpBot<C>;
  constructor(ctx: C) {
    super(ctx);
    this.logger = new Logger('mcp-server')
  }
  async connect(bot: McpBot<C>): Promise<void> {
    this.bot = bot;
    this.initialize()
  }

  async disconnect(): Promise<void> {
    this.bot.offline()
  }

  async stop() {
    this.bot.offline()
  }

  async initialize() {
    this.ctx.on('create-task', async (data: WebHookResponse) => {
      return await this.createTask(data)
    })
    const transports = new Map<string, SSEServerTransport>();
    const mcpServer = await setupMCPServer(this.ctx)
    this.ctx.server.get('/sse', async (ctx) => {
      ctx.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      const transport = new SSEServerTransport('/messages', ctx.res);
      transports.set(transport.sessionId, transport);

      ctx.req.on("close", () => {
        this.ctx.logger.info('Client disconnected', transport.sessionId);
        transports.delete(transport.sessionId);
      });

      ctx.respond = false;
      await mcpServer.connect(transport);
      this.ctx.logger.info('Client connected', transport.sessionId);
    })
    this.ctx.server.post('/messages', async (ctx) => {
      const sessionId = ctx.query.sessionId as string;

      if (!sessionId) {
        ctx.status = 400;
        ctx.body = 'Session ID required';
        this.ctx.logger.info('Session ID required');
        return;
      }

      const transport = transports.get(sessionId);
      if (!transport) {
        ctx.status = 404;
        ctx.body = 'Transport not found';
        this.ctx.logger.info('Transport not found', sessionId);
        return;
      }

      try {
        ctx.respond = false;

        if (ctx.request.body && !ctx.req.readable) {

          const bodyData = JSON.stringify(ctx.request.body);
          const bodyStream = Readable.from(Buffer.from(bodyData));

          bodyStream['headers'] = ctx.req.headers;

          // @ts-ignore
          await transport.handlePostMessage(bodyStream, ctx.res);
        } else {
          await transport.handlePostMessage(ctx.req, ctx.res);
        }
      } catch (error) {
        console.error('Error handling post message:', error);
        if (!ctx.res.writableEnded) {
          ctx.res.statusCode = 500;
          ctx.res.end(JSON.stringify({ error: String(error) }));
        }
      }
    })
    this.ctx.server.post('/executor', async (ctx) => {
      const taskId = await this.createTask(ctx.request.body as WebHookResponse)
      ctx.body = taskId
      ctx.status = 200
    })
    this.bot.online()
  }

  async createTask(data: WebHookResponse) {
    if (!data.taskId) {
      data.taskId = generateTaskId()
    }
    const session = await createSession(this.bot, data)
    this.bot.dispatch(session)
    return data.taskId
  }
}

export default McpAdapter;
