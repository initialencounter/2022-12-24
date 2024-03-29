import { Adapter, Context, Quester } from 'koishi'
import VoceBot from './bot'
import { } from '@koishijs/plugin-server'
import { createSession } from './utils'

export default class VoceAdapter<C extends Context> extends Adapter<C, VoceBot<C>> {
    static inject = ['server']

    bot: VoceBot<C>
    constructor(ctx: C, private config: VoceBot.Config) {
        super(ctx)

        ctx.on('ready', () => {

        })
    }
    async connect(bot: VoceBot<C>) {
        this.bot = bot
        this.initialize()
    }
    async disconnect(bot: VoceBot<C>): Promise<void> {
        this.bot.offline()
    }
    async stop(bot: VoceBot<C>) {
        this.bot.offline()
    }

    async initialize() {
        this.ctx.server.post(this.bot.config.path, async (ctx) => {
            const session = await createSession(this.bot, ctx.request.body)
            this.bot.dispatch(session)
            ctx.status = 200
            ctx.body = 'ok'
        })
        this.ctx.server.get(this.bot.config.path, async (ctx) => {
            ctx.status = 200
            ctx.body = 'ok'
        })
        this.bot.online()
    }
}

export class Internal {
    constructor(private http: Quester) { }
    async sendGroupMsg(gid: number | string, content: string): Promise<number> {
        return await this.http.post(`/send_to_group/${gid}`,content)
    }
}
