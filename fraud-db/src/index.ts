export const name = 'fraud-db'
import { Context, Schema, Logger, Session, Dict, h } from 'koishi'
import fs from 'fs/promises'
import { resolve } from "path";
import { pathToFileURL } from "url";
const logger = new Logger(name)
declare module 'koishi' {
  interface Tables {
    fraud: Fraud.Frauder
  }
}
class Fraud {
  message_box: Dict
  private constructor(private ctx: Context, private config: Fraud.Config) {
    this.message_box = {}
    ctx.i18n.define('zh', require('./locales/zh'))
    ctx.model.extend('fraud', {
      // 各字段类型
      id: 'unsigned',
      date: 'date',
      frauder: 'string',
      reporter: 'string',
      approver: 'string',
      desc: 'string',
      src: 'list',
    }, {
      primary: 'id', //设置 uid 为主键
      unique: ['frauder', 'id'], //设置 uid及id 为唯一键
      autoInc: true
    })
    ctx.before('attach-user', async ({ }, fields) => {
      fields.add('authority')
    })
    ctx.middleware(async (session, next) => {
      if (session.content.startsWith('添加云黑')) {
        const {user:{authority}}: Session<"authority"> = session as Session<"authority">
        if(authority<3){
          return '权限不足'
        }
        let fraud = session.content.replace('添加云黑', '')
        if (session.subtype == 'private') {
          return session.text('messages.register.failure', ['无法通过私聊添加']);
        }
        if (!fraud) {
          await session.send('请输入QQ')
          fraud = await session.prompt(600000)
        }
        if (!fraud) {
          return '添加失败，qq号无效'
        }
        const date = new Date()
        const params: Fraud.RegisterOPT = {
          date: date,
          frauder: fraud,
          reporter: `${(session.author?.nickname || session.username)}-${session.userId}`,
        }
        return this.register(session, params)
      } else if (session.content.startsWith('查云黑')) {
        let fraud = session.content.replace('查云黑', '')
        if (!fraud) {
          await session.send('请输入QQ')
          fraud = await session.prompt(600000)
        }
        if (!fraud) {
          return '查询失败，qq号无效'
        }
        return await this.search(fraud)
      }
      return next()
    })
    ctx.command('添加云黑 <Frauder:string>', { authority: 3 })
      .alias('yhadd')
      .action(async ({ session, options }, fraud) => {
        if (session.subtype == 'private') {
          return session.text('messages.register.failure', ['无法通过私聊添加']);
        }
        if (!fraud) {
          await session.send('请输入QQ')
          fraud = await session.prompt(600000)
        }
        if (!fraud) {
          return '添加失败，qq号无效'
        }
        const date = new Date()
        const params: Fraud.RegisterOPT = {
          date: date,
          frauder: fraud,
          reporter: `${(session.author?.nickname || session.username)}-${session.userId}`,
        }
        return this.register(session, params)
      })
    ctx.command('查云黑 <Frauder:string>', { checkArgCount: true })
      .alias('search')
      .action(async ({ session }, fraud) => {
        if (!fraud) {
          await session.send('请输入QQ')
          fraud = await session.prompt(600000)
        }
        if (!fraud) {
          return '添加失败'
        }
        return await this.search(fraud)

      })

  }
  formateTimeStamp(date: Date) {
    const year = date.getFullYear();

    const month = date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1;

    const day = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();

    const hour = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();

    const minute = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();

    const second = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();

    return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;

  }

  async search(qq: string) {
    const res = await this.ctx.database.get('fraud', { frauder: [qq] })
    if (res.length == 0) {
      return `此人不在本黑名单列表！
与其进行交易谨防被骗！
建议找担保！
建议找担保！
建议找担保！
如需举报圈狗，请私聊发送机器人。
为防止刷屏，查询同个QQ只能在5分钟之后进行！`
    }
    const time = new Date()
    const { date, frauder, reporter, approver, src, desc } = res[0]
    let images = `------APEX云黑系统------
当前时间：${this.formateTimeStamp(time)}
黑名单QQ：${frauder}
举报人QQ：${reporter}
举报时间：${this.formateTimeStamp(date)}
审核员：${approver}
原因：${desc}
图片：`
    for (var i of src) {
      images = images + h.image(i)
    }
    return images
  }

  /**
   * 注册账号
   * @param session 会话
   * @param option 注册参数
   * @returns msg
   */

  async register(session: Session, option: Fraud.RegisterOPT): Promise<void> {
    const res = await this.ctx.database.get('fraud', { frauder: [option.frauder] })
    if (res.length > 0) {
      session.send('记录已存在')
      return
    }
    await session.send('请输入原因:')
    option.desc = await session.prompt(600000)
    if (!option.desc) {
      option.desc = '无'
    }
    const image_list = []
    let count: number = 1
    while (count > 0) {
      await session.send('请输入证据/截图\n输入句号结束添加:')
      let img = await session.prompt(600000)
      console.log(img)
      if (img == '.' || img == '。') {
        count = -1
        continue
      }
      const img_url = img.match(/url="[^>]+"/)[0].slice(5, -1)
      if (img && img_url) {
        image_list.push(img_url)
      } else {
        session.send('无效的图片')
      }
    }
    if (this.config.approver_enable) {
      await session.send('请输入审核人:')
      option.approver = await session.prompt(600000)
    }
    if (!option.approver) {
      option.approver = '无'
    }
    session.send('添加成功')
    option.src = await this.download(image_list, option.frauder)
    const { date, frauder, reporter, approver, src, desc } = option
    this.ctx.database.create('fraud', { date: date, frauder: frauder, reporter: reporter, approver: approver, src: src, desc: desc })
  }

  //
  async download(picture: string[], frauder: string) {
    let img_url: string[] = []
    if (picture.length == 0) {
      return []
    }
    let count: number = 0
    for (var i of picture) {
      try {
        const response = await this.makeGetRequest_buffer(i);
        const fs_path = resolve(this.config.src_path + `/${frauder}-${count}.jpg`)
        await fs.writeFile(`${fs_path}`, response.data)
        count++
        const local_img_url: string = pathToFileURL(fs_path).href
        img_url.push(local_img_url)
      } catch (e) {
        logger.error(e);
      }
    }
    return img_url
  }


  async makeGetRequest_buffer(url: string) {
    return (await this.ctx.http.axios({
      method: 'get',
      url,
      responseType: 'arraybuffer'
    }));
  }
}

namespace Fraud {
  export const usage = `
查云黑，目前该项目已经投入试运行. .

## 机器人功能
### 已经做好了的
- [x] 添加云黑
- [x] 查云黑



## 使用说明

命令示例：
- 添加云黑
    - 添加云黑 + QQ
- 查询云黑
    - 查云黑 + QQ


### 问题反馈
* QQ群：399899914<br>
* 小伙伴如果遇到问题或者有新的想法，欢迎到[这里](https://github.com/initialencounter/mykoishi/issues)反馈哦~

### 支持

如果你支持本项目，可以给个[star](https://github.com/initialencounter/mykoishi)，你的支持不会获得额外内容，但会提高本项目的更新积极性

本机器人目前仅供学习交流使用。

您不应以任何形式使用本仓库进行盈利性活动。

对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-fraud-db 概不负责。

  `
  export interface RegisterOPT {
    date: Date
    frauder: string
    reporter: string
    approver?: string
    desc?: string
    src?: string[]
  }

  export interface Hearders {
    'Content-Type'?: string
    cookie?: string[]
  }
  export interface Frauder {
    id?: number
    date: Date
    frauder: string
    reporter: string
    approver?: string
    desc?: string
    src?: string[]
  }
  export interface Config {
    approver_enable: boolean
    src_path: string
    add_fraud: string[]
  }

  export const Config: Schema<Config> = Schema.object({
    add_fraud: Schema.array(String).default(['加云黑', '黑名单']).description('添加云黑的触发命令'),
    approver_enable: Schema.boolean().default(false).description('是否需要审核人'),
    src_path: Schema.string().default('fraud-db').description('证据图片存储路径,需先创建该文件夹')
  })

}

export default Fraud;
