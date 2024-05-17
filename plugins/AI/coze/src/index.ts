import { Context, Schema, Session, Dict, segment } from 'koishi'
import { chat } from './api'
import { ChatHistory, ChatRespose } from './type'
import { getChatHistory } from './utils'
import { transform } from 'koishi-plugin-markdown'

export const inject = { required: ['database'] }

export const name = 'coze'

declare module 'koishi' {
    interface User { cozeConversationId: string }
}

export interface Config {
    baseURL: string
    token: string
    bot_id: string
    history: boolean
}

export const Config: Schema<Config> = Schema.object({
    baseURL: Schema.string().role("link").default("https://api.coze.com/open_api"),
    token: Schema.string().role("secret").required(true),
    bot_id: Schema.string().required(true),
    history: Schema.boolean().default(false)
})

// 定义一个 cozeConversationId 字段,用于存放物品列表
declare module 'koishi' {
    interface User {
        cozeConversationId: string
    }
}

/**
   * 
   * @param session 会话
   * @param prompt 会话内容
   * @param options 选项
   * @returns 
   */
async function sli(session: Session, prompt: string, options: Dict): Promise<string | segment | void> {
    // if (!prompt && !session.quote?.content) {
    //     return session.text('commands.dvc.messages.no-prompt')
    // }
    // this.output_type = options.output ? options.output : this.output_type

    // const session_id_string: string = session.userId
    // if (this.ctx.config.superusr.indexOf(session_id_string) == -1) {
    //     await session.execute(`dvc.count ${prompt}`)
    // } else {
    //     return this.dvc(session, prompt)
    // }
    // console.log(session, prompt, options);
    return session.execute(`coze ${prompt}`)

}

export function apply(ctx: Context, config: Config) {
    // write your plugin here

    let quester = ctx.http.extend({
        baseURL: config.baseURL,
        headers: {
            'Authorization': `Bearer ${config.token}`,
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'Host': 'api.coze.com',
            'Connection': 'keep-alive'
        },
        timeout: 0
    })

    ctx.model.extend('user', {
        cozeConversationId: 'string',
    })


    ctx.middleware(async (session, next) => {
        // 艾特触发
        if (session.elements[0]?.type == "at" && session.elements[0].attrs.id === session.bot.selfId) {
            let msg: string = ''
            for (let i of session.elements.slice(1,)) {
                if (i.type === 'text') {
                    msg += i?.attrs?.content
                }
            }
            console.log(`in at`);

            return sli(session, msg, {})
        }
        return next()
    })



    ctx.command("coze [prompt:text]")
        .userFields(['cozeConversationId'])
        // .option("history", "--history -h")
        .action(async ({ session, options }, prompt) => {
            if (!prompt) {
                prompt = await session.prompt(60000)
                if (!prompt) return
            }
            let history = []

            if (config.history) {
                history = getChatHistory(ctx)
                // history = history_global
            }

            console.log(prompt);

            let conversation_id = session.user?.cozeConversationId ?? null
            let res: ChatRespose = await chat(quester, history, config.bot_id, session.userId, prompt, conversation_id)
            console.log(res);
            if (res.code == 0) {
                session.user.cozeConversationId = res.conversation_id

                let answer = res.messages.find(item => item.type == 'answer')

                return transform(answer.content)
            } else {
                return res.msg
            }
        })
}
