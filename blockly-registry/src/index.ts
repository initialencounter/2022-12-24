import { Context, Logger, Schema } from 'koishi'
import { } from '@koishijs/plugin-console'
import { BlocklyDocument } from 'koishi-plugin-blockly'
import { resolve } from 'path'
declare module '@koishijs/plugin-console' {
  interface Events {
    'blockly-registry/upload'(plugin_id: number, desc: string, version: string): Promise<string>
    'blockly-registry/install'(plugin_name: string, plugin_version: string): Promise<string>
    'blockly-registry/query'(): Promise<BlocklyRegistry.BlocklyDocument[]>
    'blockly-registry/query-cloud'(): Promise<Packages[]>
    'blockly-registry/query-version'(plugin_name:string): Promise<string[]>
    'blockly-registry/cloud-text'():Promise<string>
    'blockly-registry/init'():Promise<(Packages[]|string|BlocklyRegistry.BlocklyDocument[])[]>
  }
}
declare module "koishi-plugin-blockly" {
  interface BlocklyDocument {
    id: number
    uuid: string
    name: string
    body: string
    code: string
    enabled: boolean
    edited: boolean
    author?: string
    desc?: string
    version?: string
    isuploaded?: boolean
  }
}

export interface Packages {
  name: string;
  version: string;
  desc: string;
  author: string;
  isinstalled: boolean;
}
export const using = ['console', 'blockly'] as const
export const name = 'blockly-registry'
export const logger = new Logger(name)
const INDEX_PATH = '/index'
const VERSION_PATH = '/versions'
const CODE_PATH = '/files'
const TEXT_PATH = '/usage'
const UPLOAD_PATH = '/upload'
class BlocklyRegistry {
  cloud_plugins: Packages[]
  local_plugins: BlocklyRegistry.BlocklyDocument[]
  cloud_text: string
  constructor(private ctx: Context, private config: BlocklyRegistry.Config) {
    this.cloud_text = '🐟云端文字还没准备好呢，请点击右上角刷新按钮🐟'
    ctx.on('ready', async () => this.initialized(true))
    ctx.model.extend('blockly', {
      id: 'integer',
      name: 'string',
      body: 'text',
      code: 'text',
      enabled: 'boolean',
      edited: 'boolean',
      uuid: 'string',
      author: 'string',
      desc: 'string',
      version: 'string',
      isuploaded: 'boolean'
    })
    ctx.using(['console'], (ctx) => {
      ctx.console.addEntry({
        dev: resolve(__dirname, '../client/index.ts'),
        prod: resolve(__dirname, '../dist'),
      })
    })
    ctx.console.addListener('blockly-registry/upload', async (plugin_id: number, desc: string, version: string) => {
      console.log('blockly-registry/upload',desc,version)
      return (await this.upload(plugin_id, desc, version))
    })
    ctx.console.addListener('blockly-registry/install', async (plugin_name: string, plugin_version: string) => {
      console.log('blockly-registry/install')
      return (await this.install(plugin_name, plugin_version))
    })
    ctx.console.addListener('blockly-registry/query', async () => {
      console.log('blockly-registry/query')
      return this.local_plugins
    })
    ctx.console.addListener('blockly-registry/query-cloud', async () => {
      console.log('blockly-registry/query-cloud')
      return this.cloud_plugins
    })

    ctx.console.addListener('blockly-registry/query-version',async(plugin_name:string)=>{
      console.log('blockly-registry/query-version')
      return (await this.get_plugin_version(plugin_name))
    })
    ctx.console.addListener('blockly-registry/cloud-text',async()=>{
      console.log('blockly-registry/cloud-text')
      return this.cloud_text
    })
    ctx.console.addListener('blockly-registry/init',async()=>{
      console.log('blockly-registry/cloud-init')
      await this.initialized()
      return [this.local_plugins, this.cloud_plugins, this.cloud_text]
    })

  }
  async get_plugin_version(plugin_name:string): Promise<string[]>{
    return (await this.ctx.http.get(this.config.registry+VERSION_PATH+'/'+plugin_name)).data
  }
  async pull_plugin(): Promise<Packages[]> {
    // const cloud_plugins = [
    //   { name: "gpt", version: "1.0.0", desc: "123131[121](http://123.com)", author: "xxx <2911583893@qq.com>", isinstalled: false },
    //   { name: "glm", version: "0.0.1", desc: "123131", author: "init <3118087750>", isinstalled: true },
    //   { name: "vits", version: "0.0.1", desc: "123131", author: "shigame", isinstalled: false },
    //   { name: "setu", version: "0.0.1", desc: "123131", author: "xxx", isinstalled: true },
    //   { name: "st", version: "0.0.1", desc: "123131", author: "atm", isinstalled: false },
    //   { name: "test", version: "0.0.1", desc: "123131", author: "xxx", isinstalled: true },
    //   { name: "test", version: "0.0.1", desc: "123131", author: "xxx", isinstalled: false },
    //   { name: "test", version: "0.0.1", desc: "123131", author: "xxx", isinstalled: false },
    //   { name: "test", version: "0.0.1", desc: "123131", author: "xxx", isinstalled: false },
    //   { name: "test", version: "0.0.1", desc: "123131", author: "xxx", isinstalled: false },
    //   { name: "test", version: "0.0.1", desc: "123131", author: "xxx", isinstalled: false },
    //   { name: "test", version: "0.0.1", desc: "123131", author: "xxx", isinstalled: false },
    //   { name: "test", version: "0.0.1", desc: "123131", author: "xxx", isinstalled: false },
    //   { name: "test", version: "0.0.1", desc: "123131", author: "xxx", isinstalled: false },
    //   { name: "test", version: "0.0.1", desc: "123131", author: "xxx", isinstalled: false },
    //   { name: "121", version: "0.0.1", desc: "123131", author: "xxx", isinstalled: false },
    //   { name: "test", version: "0.0.1", desc: "123131", author: "xxx", isinstalled: false },
    // ];
    // return cloud_plugins
    const cloud_plugins = (await this.ctx.http.axios(this.config.registry+INDEX_PATH)).data
    return cloud_plugins['index']
  }
  async query_plugin(): Promise<BlocklyRegistry.BlocklyDocument[]> {
    const local_plugin: BlocklyRegistry.BlocklyDocument[] = (await this.ctx.database.get('blockly', { id: { $gt: 0, $lte: 9999 } }))
    return local_plugin
  }
  sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  async get_cloud_text():Promise<string>{
    return (await this.ctx.http.axios({
      method: 'GET',
      url: this.config.registry+TEXT_PATH
    })).data
  }
  async initialized(wait:boolean=false) {
    const cloud_plugins_name: string[] = []
    const local_plugins_name: string[] = []
    this.cloud_text = await this.get_cloud_text()
    if(wait) await this.sleep(5000)
    this.cloud_plugins = await this.pull_plugin()
    this.local_plugins = await this.query_plugin()
    for (var i of this.cloud_plugins) {
      cloud_plugins_name.push(i.name)
    }
    for (var j of this.local_plugins) {
      local_plugins_name.push(j.name)
    }
    for (var k in this.cloud_plugins) {
      if (local_plugins_name.includes(this.cloud_plugins[k].name)) {
        this.cloud_plugins[k].isinstalled = true
      }
    }
    for (var l in this.local_plugins) {
      if (cloud_plugins_name.includes(this.local_plugins[l].name)) {
        this.local_plugins[l].isuploaded = true
      }
    }
  }


  async upload(plugin_id: number, desc: string, version: string): Promise<string> {
    const plugin: BlocklyRegistry.BlocklyDocument[] = await this.ctx.database.get('blockly', [plugin_id])
    if (plugin.length < 1) {
      return '上传失败,插件不存在'
    }
    logger.info('上传', plugin[0].name)
    try {
      const res = (await this.ctx.http.axios({
        method: 'POST',
        url: this.config.registry+UPLOAD_PATH,
        data: {
          token: this.config.token,
          token_id: this.config.contact,
          name: plugin[0].name,
          desc: desc,
          version: version,
          code: plugin[0].code,
          body: plugin[0].body,
          author: this.config.author
        }
      })).data
      if(res?.status=='ok')return '上传成功'
      return 'error上传失败'+res.info
    } catch (e) {
      logger.error(e)
      //上传失败
      return 'error上传失败'+e
    }
  }
  async install(plugin_name: string, plugin_version: string): Promise<string> {
    logger.info('安装', plugin_name,plugin_version)
    try {
      const exit_plugins = await this.ctx.database.get('blockly', { name: [plugin_name] })
      if(exit_plugins[0]?.version == plugin_version ){
        return `改插件当前版本已经是${plugin_version},无需修改`
      }
      const plugin: BlocklyRegistry.BlocklyDocument = await this.download_source_code(plugin_name, plugin_version)
      await this.ctx.database.create("blockly", {
        name: plugin.name,
        body: plugin.body,
        code: plugin.code,
        enabled: this.config.start_now,
        edited: false, uuid: '0.0.1',
        version: plugin.version,
        desc: plugin.desc,
        author: plugin.author
      })  
      await this.ctx.blockly.reload(this.config.start_now)
      //成功
      return '安装成功,请前往blockly页面查看'
    } catch (e) {
      //失败
      logger.error(e)
      return `error安装失败${e}`
    }

  }
  async download_source_code(plugin_name: string, plugin_version: string) {
    return (await this.ctx.http.axios(this.config.registry + CODE_PATH + plugin_name + plugin_version)).data
  }
}
namespace BlocklyRegistry {
  export const usage = `
前往私信 qq 机器人 xxx 获取 token<br>
上传插件请前往 blockly-registry 页面
`
  export interface Config {
    token: string;
    author: string;
    contact: string;
    registry: string;
    start_now: boolean;
  }
  export interface BlocklyDocument {
    id?: number;
    uuid?: string;
    name: string;
    body: string;
    code: string;
    enabled?: boolean;
    edited?: boolean;
    author?: string;
    desc?: string;
    version?: string;
    isuploaded?: boolean;
  }
  export const Config: Schema<Config> = Schema.object({
    token: Schema.string().description('上传 blockly 代码的 token (用于鉴权)'),
    author: Schema.string().description('作者 格式: 昵称 < qq 号或者邮箱>,示例: "initialencounter 2911583893"'),
    contact: Schema.string().description(' qq 号(用于鉴权,用户不可见)'),
    registry: Schema.string().description('插件源码镜像源'),
    start_now: Schema.boolean().default(false).description('启用后将在安装插件后立即启用'),
  })
}

export default BlocklyRegistry