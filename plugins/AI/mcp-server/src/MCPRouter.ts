import { Context } from "koishi";
import McpBot from "./mcpBot";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { setupMCPServer } from "./setupMCPServer";
import { Readable } from 'stream';
import { } from '@koishijs/plugin-server'

class MCPRouter {
  static inject = ['server']
  constructor(private ctx: Context, private config: McpBot.Config) {
    this.initialize()
  }
  async initialize() {
    await this.ctx.sleep(this.config.sleepTime);
    const transports = new Map<string, SSEServerTransport>();
    const mcpServer = await setupMCPServer(this.ctx, this.config);
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
  }
}

export default MCPRouter;