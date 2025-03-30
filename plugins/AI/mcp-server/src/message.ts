import { Context, Messenger, Element } from "koishi";
import McpBot from "./mcpBot";
import { generateTaskId } from "./utils";

export class McpMessenger<C extends Context = Context> extends Messenger<C, McpBot<C>> {
  addResult(msgId: string) {
    if (!msgId) return
    const session = this.bot.session()
    this.results.push({ id: msgId })
    session.messageId = msgId
    session.app.emit(session, 'send', session)
  }
  async flush(): Promise<void> {
    const msgIds = generateTaskId()
    this.addResult(msgIds)
  }
  async visit(_element: Element): Promise<void> {
  }
}
