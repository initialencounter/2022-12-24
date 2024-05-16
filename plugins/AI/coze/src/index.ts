import { Context, Schema } from 'koishi'
import { chat } from './api'
import { ChatHistory, ChatRespose } from './type'
import { getChatHistory } from './utils'

export const name = 'coze'

declare module 'koishi' {
  interface User { cozeConversationId: string }
}

export interface Config {
  baseURL: string
  token: string
  bot_id: string
}

export const Config: Schema<Config> = Schema.object({
  baseURL: Schema.string().role("link").default("https://api.coze.com/open_api"),
  token: Schema.string().role("secret").required(true),
  bot_id: Schema.string().required(true),
})

export function apply(ctx: Context, config: Config) {
  // write your plugin here
  let quester = ctx.http.extend({
    baseURL: config.baseURL,
    headers: {
      "Content-Type": "Application/json",
      Authorization: "Bearer " + config.token,
      Connection: "Keep-alive",
      Accept: "*/*",
    },
    timeout: 0
  })
  let history_global: ChatHistory = getChatHistory(ctx)

  ctx.command("coze [prompt:text]")
    .userFields(['cozeConversationId'])
    .option("history", "--history -h")
    .action(async ({ session, options }, prompt) => {
      if (!prompt) {
        prompt = await session.prompt(60000)
        if (!prompt) return
      }
      let history = []
      if (options.history) {
        history = history_global
      }
      let conversation_id = session.user?.cozeConversationId ?? null
      let res: ChatRespose = await chat(quester, history, config.bot_id, session.userId, prompt, conversation_id)
      session.user.cozeConversationId = res.conversation_id
      return res.messages[0].content
    })
}
