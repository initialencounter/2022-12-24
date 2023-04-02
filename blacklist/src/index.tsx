import { Context, Schema, Session,Argv } from 'koishi'
import { } from 'koishi-plugin-eula'

export const using = ['eula']

declare module 'koishi' {
    interface Tables {
        countlist: Countlsit
    }
}

export interface Countlsit {
    uid: number
    count: number
    eula: boolean
}

export const log = console.log
class Blacklist {
    public readonly name = 'blacklist'
    constructor(private ctx: Context, private config: Blacklist.Config) {
        ctx.model.extend('countlist', {
            uid: 'unsigned',
            count: 'integer(2)', //限制长度为 2 位，节省内存空间
            eula: 'boolean'
        }, {
            primary: 'uid', //设置 uid 为主键
            unique: ['uid'], //设置 uid 为唯一键
            foreign: {
                uid: ['user', 'id'], //将 uid 与 user 表的 id 绑定
                eula: ['blacklist', 'eula']
            }
        })
        ctx.i18n.define('zh', require('./locales/zh'))
        ctx.before('attach-user', async ({}, fields) => {
            fields.add('authority')
            fields.add('id')
        })

        // ctx.before('command/execute',({session})=>this.mian_proce(session))
        ctx.on('eula/update', (session:Session,eula: boolean) => {
            this.mian_proce(session)
            //more core
        })
        ctx.command('release <value:string>', { authority: 4, checkUnknown: true })
            .alias('rls')
            .action(async ({ session }, prompt) => this.release(session, prompt))
    }
    private async mian_proce(session) {
        const session_auth: Session<"id"> = session as Session<"id">
        const uid = session_auth.user.id
        const contraband_arr: string[] = this.config.contraband.split(',')
        // const init_count: any[] = await this.ctx.database.get("countlist", { uid: [uid] },)
        // 协议相关
        // 违禁词
        for (var i in contraband_arr) {     //判断是否含有违禁词
            if (session.content.includes(contraband_arr[i])) {
                const msg = await this.audit(session, uid)   //添加违规次数
                if (msg) {
                    return msg
                } else {
                    session.send(session.text('commands.b-eula.messages.pass-text', [this.config.pass_text]))

                }
            }
        }

    }


    // 违规次数统计
    private async audit(session: Session, uid: number) {    //黑名单相关
        const viol_times: any[] = await this.ctx.database.get('countlist', [uid])
        if (viol_times.length < 1) {
            return
        }
        const ctimes: number = viol_times[0].count + 1
        const session_auth: Session<'authority'> = session as Session<'authority'>


        if (session_auth.user.authority < this.config.invinc) {      //判断用户是否拥有瑟瑟权限
            await this.ctx.database.set('countlist', { uid: [uid] }, { count: ctimes })
            if (ctimes > this.config.max_viol) {
                session_auth.user.authority = 0
                return `<>
                    ${this.config.ban_text2}, (${ctimes}/${this.config.max_viol}),
                    <at id="${session.userId}"/>
                    </>`
            } else {
                return `<>
                ${this.config.ban_text1}(${ctimes}/${this.config.max_viol}),
                <at id="${session.userId}"/>
                </>`
            }
        } else {
            return false
        }

    }
    // 释放
    private async release(session: Session, prompt: string) {
        const satrt_at: number = prompt.indexOf('<at id="')
        if (satrt_at == -1) {
            return session.text('commands.b-eula.messages.user-expected')
        }
        const end_at = prompt.indexOf('"/>')
        const qqacct: string = prompt.slice(satrt_at + 8, end_at)
        const qqid: any = await this.ctx.database.getUser('onebot', qqacct, ["id"])
        if (qqid.id) {
            await this.ctx.database.set('countlist', { uid: [qqid.id] }, { count: 0 })
            const viol_times: any[] = await this.ctx.database.get('countlist', [qqid.id])
            await this.ctx.database.set('user', qqid, { authority: 1 })
            return session.text('commands.b-eula.messages.released')
        } else {
            return session.text('commands.b-eula.messages.user-expected')
        }
    }

}

namespace Blacklist {


    export const usage = `
## 注意事项
> 建议使用前在 <a href="/database/user">dataview</a> 中修改自己权限等级为 2 及以上
本插件只用于体现 Koishi 部署者意志，即：“部署者仅对同意了《最终用户协议》的最终用户提供服务”。
对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-eula 概不负责。
如果有更多文本内容想要修改，可以在<a href="/locales">本地化</a>中修改 zh 内容
`

    export interface Config {
        contraband: string
        max_viol: number
        ban_text1: string
        ban_text2: string
        invinc: number
        pass_text: string
    }
    export const Config: Schema<Config> = Schema.object({
        contraband: Schema.string().default('nsfw').description('违禁词，英文逗号隔开'),
        max_viol: Schema.number().default(2).description('最大违规次数'),
        ban_text1: Schema.string().default('违规').description('警告'),
        ban_text2: Schema.string().default('已加入黑名单').description('审判'),
        invinc: Schema.number().default(5).description('允许瑟瑟最低权限'),
        pass_text: Schema.string().default('不可以瑟瑟！').description('允许瑟瑟时发送的消息')
    })
}

export default Blacklist


