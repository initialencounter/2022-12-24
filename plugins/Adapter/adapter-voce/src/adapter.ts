import { Adapter, Context, Quester, Universal } from 'koishi'
import VoceBot from './bot'
import { } from '@koishijs/plugin-server'
import { createSession } from './utils'
import { MediaPath, TokenRefeshConfig, UploadResponse } from './type'

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

        // 登录获取令牌
        if (this.bot.config.loginMethod === 'token') {
            this.bot.tokenRefeshConfig = { token: this.bot.config.admin_token, refresh_token: this.bot.config.admin_refresh_token }
        } else {
            try {
                this.bot.tokenRefeshConfig = await this.bot.adminInternal.tokenLogin(this.bot.config.admin_email, this.bot.config.admin_passwd)
            } catch (e) {
                this.bot.logger.error('连接失败，请检查邮箱和密码是否填写正确')
                return this.bot.offline(e)
            }

        }
        this.bot.adminInternal.http.config.headers["X-API-Key"] = this.bot.tokenRefeshConfig.token
        this.bot.internal.http.config.headers["x-api-key"] = await this.bot.adminInternal.getBotApiKey(this.bot.config.botUid)
        // 自动更新令牌
        this.bot.ctx.setInterval(async () => {
            try {
                this.bot.tokenRefeshConfig = await this.bot.adminInternal.tokenRenew(this.bot.tokenRefeshConfig)
                this.bot.adminInternal.http.config.headers["X-API-Key"] = this.bot.tokenRefeshConfig.token
            } catch (e) {
                this.bot.logger.warn('更新令牌失败!')
            }
        }, 300000)

        // 获取头像
        const user: Universal.User = {
            id: this.bot.selfId,
            name: this.bot.selfId,
            avatar: this.bot.adminInternal.getUserAvatar(this.bot.config.botUid)
        }
        this.bot.user = user

        // webhook
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
export class AdminInternal {
    constructor(public http: Quester) { }

    async deleteMessage(messageId: string, tokenRefeshConfig: TokenRefeshConfig) {
        if (!tokenRefeshConfig) {
            return
        }
        await this.http.delete(`/api/message/${messageId}`)
    }

    /**
     * 账户密码登录获取令牌和更新令牌
     * @param email 
     * @param passwd 
     * @returns 
     */
    async tokenLogin(email: string, passwd: string): Promise<TokenRefeshConfig> {
        let { refresh_token, token } = await this.http.post('/api/token/login', {
            "credential": {
                "email": email,
                "password": passwd,
                "type": "password"
            },
            "device": "web",
            "device_token": null
        })
        return { refresh_token: refresh_token, token: token }
    }

    /**
     * 更新令牌
     * @param tokenRefeshConfig 
     * @returns 
     */
    async tokenRenew(tokenRefeshConfig: TokenRefeshConfig): Promise<TokenRefeshConfig> {
        return await this.http.post('/api/token/renew', tokenRefeshConfig)
    }

    /**
     * 获取机器人的令牌
     * @param uid 
     * @returns 
     */
    async getBotApiKey(uid: number): Promise<string> {
        let res = await this.http.get(`/api/admin/user/bot-api-key/${uid}`)
        return res[0].key
    }

    /**
     * 获取用户头像URL
     */
    getUserAvatar(uid: number): string {
        return `${this.http.config.baseURL}/api/resource/avatar?uid=${uid}`
    }
}
export class Internal {
    constructor(public http: Quester) { }

    /**
     * 发送群消息
     * @param gid 群id
     * @param content 内容
     * @param contentType 
     * @returns 
     */
    async sendGroupMsg(gid: number | string, content: string | MediaPath, contentType: string): Promise<number> {
        return await this.http.post(`/api/bot/send_to_group/${gid}`, content, {
            headers: {
                "Content-Type": contentType
            }
        })
    }

    /**
     * 发送私信
     * @param uid 
     * @param content 
     * @param contentType 
     * @returns 
     */
    async sendPrivateMsg(uid: number | string, content: string | MediaPath, contentType: string): Promise<number> {
        return await this.http.post(`/api/bot/send_to_user/${uid}`, content, {
            headers: {
                "Content-Type": contentType
            }
        })
    }

    /**
     * 发送消息
     * @param channelId 
     * @param content 
     * @param contentType 
     * @returns 
     */
    async sendMessage(channelId: string, content: string | MediaPath, contentType: string): Promise<string[]> {
        let path = '/api/bot/send_to_group'
        if (channelId.startsWith('private:')) {
            path = '/api/bot/send_to_user'
            channelId = channelId.replace('private:', '')
        }
        let http = new Quester()
        let res = await http.post(`http://127.0.0.1:3000${path}/${channelId}`, content, {
            headers: {
                'X-API-Key': this.http.config.headers["x-api-key"],
                "Content-Type": contentType
            }
        })
        return [String(res)]
    }

    /**
     * 下载文件
     * @param file_path 
     * @returns 
     */
    async getResource(file_path: string): Promise<ArrayBuffer> {
        return await this.http.get(`/api/resource/file?file_path=${file_path}&thumbnail=false&download=false`, {
            responseType: "arraybuffer"
        })
    }

    /**
     * 准备上传文件，获取文件ID
     * @param fileName 
     * @param mime 
     * @returns 
     */
    async filePrepare(fileName: string, mime: string): Promise<string> {
        return (await this.http('/api/bot/file/prepare', {
            method: 'POST',
            data: {
                "content_type": mime,
                "filename": fileName
            },
        })).data
    }

    /**
     * 上传文件
     * @param file_id 
     * @param buffer 
     * @returns 
     */
    async fileUpload(file_id: string, buffer: Buffer) {
        let form = new FormData();
        let blob = new Blob([buffer])
        form.append('file_id', file_id);
        form.append('chunk_data', blob);
        form.append('chunk_is_last', 'true');
        let res: UploadResponse = (await this.http.post('/api/bot/file/upload', form))
        return res
    }

}
