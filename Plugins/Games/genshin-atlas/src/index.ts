import { Context, Schema, Session, h, Dict } from 'koishi'
export const name = 'genshin-atlas'
import { resolve } from "path";
import { pathToFileURL } from "url";
import { readFileSync, writeFileSync } from 'fs';
import axios from 'axios';
import { DataService } from '@koishijs/plugin-console'

const localUsage = readFileSync(resolve(__dirname, "../readme.md"))

export const cloudUsage = async () => {
  const { name } = require(resolve(__dirname, "../package.json"))
  try {
    const info = await axios.get(`https://www.npmmirror.com/api/info?pkgName=${name}`)
    const version = info.data.data["dist-tags"].latest
    const md = await axios.get(`https://registry.npmmirror.com/${name}/${version}/files/README.md`)
    return md.data
  } catch (e) {
    return localUsage
  }
}

declare module '@koishijs/plugin-console' {
  namespace Console {
    interface Services {
      'genshinatlas': GenshinAtlas
    }
  }
}

class GenshinAtlas extends DataService<GenshinAtlas.Data> {
  path_dict: Dict
  name_list: string[]
  constructor(ctx: Context, private config: GenshinAtlas.Config) {
    super(ctx, 'genshinatlas')
    ctx.using(['console'], (ctx) => {
      ctx.console.addEntry({
        dev: resolve(__dirname, '../client/index.ts'),
        prod: resolve(__dirname, '../dist'),
      })
    })
    ctx.i18n.define('zh', require('./locales/zh'))
    ctx.on('ready', async () => {
      this.path_dict = require(resolve(__dirname, 'path.json'))
    })
    let keys = ['material', 'specialty', 'up', 'enemy', 'effect', 'card', 'weapon', 'food', 'material for role', 'form', 'artifact'];
    let alias = [
      this.config.alias.material ?? ['副本'],
      this.config.alias.specialty ?? ['突破材料', '特殊材料'],
      this.config.alias.up ?? ['up'],
      this.config.alias.enemy ?? ['怪', '原魔'],
      this.config.alias.effect ?? ['效果', 'buff'],
      this.config.alias.card ?? ['卡片', '七圣召唤'],
      this.config.alias.weapon ?? ['武器'],
      this.config.alias.food ?? ['食物', '菜'],
      this.config.alias["material for role"] ?? ['角色材料'],
      this.config.alias.form ?? ['遗物表'],
      this.config.alias.artifact ?? ['圣遗物']
    ]
    ctx.middleware((session, next) => {
      const target = this.getTarget(session.content);
      if (target == '') return next();
      for (let i = 0; i < keys.length; i++) {
        for (let j = 0; j < alias[i].length; j++) {
          if (target.startsWith(alias[i][j])) {
            const pathName = this.rmSpace(target.replace(alias[i][j], ''))
            const path = this.path_dict[keys[i]][pathName]
            let img_url: string
            if (config.engine) {
              img_url = this.config.repo + path
            } else {
              img_url = pathToFileURL(resolve(this.config.src_path + path)).href
            }
            return h.image(img_url);
          }
        }
      }
    })
    ctx.command('ys.atlas', '更新原神图鉴索引').alias('更新原神图鉴索引').action(({ session }) => this.updatePath(session))
  }
  async updatePath(session: Session) {
    const res = await this.ctx.http.get('https://ghproxy.com/https://raw.githubusercontent.com/Nwflower/genshin-atlas/master/path.json', { responseType: 'arraybuffer' })
    writeFileSync(resolve(__dirname, 'path.json'), res)
    return session.text('commands.update.messages.success')
  }

  async get() {
    const md = { type: "md" as const, content: (await cloudUsage()).toString() }
    return md
  }
  getTarget(cmd: string): string {
    if (!(cmd.startsWith(this.config.prefix))) return ""
    const name = cmd.replace(this.config.prefix, '')
    return name ?? ''
  }
  rmSpace(source: string): string {
    return source.trim()
  }
}
namespace GenshinAtlas {
  namespace Data {
    export type DataType = 'str' | 'bool' | 'md'
  }

  export interface Data {
    type: Data.DataType
    content: string
  }

  export interface Config {
    prefix: string
    src_path: string
    engine: boolean
    repo: string
    alias: {
      material: string[]
      specialty: string[]
      up: string[]
      enemy: string[]
      effect: string[]
      card: string[]
      weapon: string[]
      food: string[]
      'material for role': string[]
      form: string[]
      artifact: string[]
    }
  }
  export const Alias = Schema.object({
    material: Schema.array(String).default(['副本']).description('副本'),
    specialty: Schema.array(String).default(['突破材料', '特殊材料']).description('突破材料'),
    up: Schema.array(String).default(['up']).description('up'),
    enemy: Schema.array(String).default(['怪', '原魔']).description('原魔'),
    effect: Schema.array(String).default(['效果', 'buff']).description('buff'),
    card: Schema.array(String).default(['卡片', '七圣召唤']).description('卡片'),
    weapon: Schema.array(String).default(['武器']).description('武器'),
    food: Schema.array(String).default(['食物', '菜']).description('食物'),
    'material for role': Schema.array(String).default(['角色材料']).description("角色材料"),
    form: Schema.array(String).default(['遗物表']).description("遗物表"),
    artifact: Schema.array(String).default(['圣遗物']).description("圣遗物"),
  })
  export const Config: Schema<Config> =
    Schema.object({
      prefix: Schema.string().default('#').description('匹配命令的前缀字符'),
      engine: Schema.boolean().default(true).description('是否使用在线引擎'),
      src_path: Schema.string().default('genshin-atlas').description('资源文件的路径'),
      repo: Schema.string().default('https://gitee.com/IKUN-HUANG/genshin-atlas/raw/master').description('gitee在线资源的地址'),
      alias: Alias
    }).description('进阶设置')

}
export default GenshinAtlas