import { Context, Logger, Schema } from 'koishi'
import { } from '@koishijs/plugin-console'
import { resolve } from 'path'
import { } from 'koishi-plugin-blockly'
declare module '@koishijs/plugin-console' {
  interface Events {
    'blockly-registry/upload'(plugin_id: number, desc: string, version: string): Promise<string>
    'blockly-registry/install'(plugin_name: string, plugin_version: string): Promise<string>
    'blockly-registry/query'(): Promise<BlocklyRegistry.BlocklyDocument[]>
    'blockly-registry/query-cloud'(): Promise<Packages[]>
    'blockly-registry/query-version'(plugin_name: string): Promise<string[]>
    'blockly-registry/cloud-text'(): Promise<string>
    'blockly-registry/init'(): Promise<(Packages[] | string | BlocklyRegistry.BlocklyDocument[])[]>
  }
}
declare module "koishi" {
  interface Tables {
    blockly: BlocklyDocument
  }
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
    invalid_name?: boolean
    latest?: boolean
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
      isuploaded: 'boolean',
      invalid_name: 'boolean',
      latest: 'boolean'
    })
    ctx.using(['console'], (ctx) => {
      ctx.console.addEntry({
        dev: resolve(__dirname, '../client/index.ts'),
        prod: resolve(__dirname, '../dist'),
      })
    })
    ctx.console.addListener('blockly-registry/upload', async (plugin_id: number, desc: string, version: string) => {
      logger.info('blockly-registry/upload', desc, version)
      return (await this.upload(plugin_id, desc, version))
    })
    ctx.console.addListener('blockly-registry/install', async (plugin_name: string, plugin_version: string) => {
      logger.info('blockly-registry/install')
      return (await this.install(plugin_name, plugin_version))
    })
    ctx.console.addListener('blockly-registry/query', async () => {
      logger.info('blockly-registry/query')
      return this.local_plugins
    })
    ctx.console.addListener('blockly-registry/query-cloud', async () => {
      logger.info('blockly-registry/query-cloud')
      return this.cloud_plugins
    })

    ctx.console.addListener('blockly-registry/query-version', async (plugin_name: string) => {
      logger.info('blockly-registry/query-version')
      return (await this.get_plugin_version(plugin_name))
    })
    ctx.console.addListener('blockly-registry/cloud-text', async () => {
      logger.info('blockly-registry/cloud-text')
      return this.cloud_text
    })
    ctx.console.addListener('blockly-registry/init', async () => {
      logger.info('blockly-registry/cloud-init')
      await this.initialized()
      return [this.local_plugins, this.cloud_plugins, this.cloud_text]
    })

  }
  async get_plugin_version(plugin_name: string): Promise<string[]> {
    try {
      const versions = (await this.ctx.http.get(this.config.registry + VERSION_PATH + '/' + plugin_name))
      return versions
    } catch (e) {
      logger.error(`${plugin_name}版本获取失败，请联系管理员`)
      return []
    }

  }
  async pull_plugin(): Promise<Packages[]> {
    try {
      const cloud_plugins = (await this.ctx.http.axios(this.config.registry + INDEX_PATH)).data
      return cloud_plugins['index']
    } catch (e) {
      logger.error('插件查询失败！')
      return []
    }
  }
  async query_plugin(): Promise<BlocklyRegistry.BlocklyDocument[]> {
    try {
      const local_plugin: BlocklyRegistry.BlocklyDocument[] = (await this.ctx.database.get('blockly', { id: { $gt: 0, $lte: 9999 } }))
      return local_plugin
    } catch (e) {
      logger.error('数据库读取错误,请刷新页面')
      return []
    }
  }
  sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  async get_cloud_text(): Promise<string> {
    try {
      return (await this.ctx.http.axios({
        method: 'GET',
        url: this.config.registry + TEXT_PATH
      })).data
    } catch (e) {
      logger.error(e + '镜像连接失败，请联系镜像站长')
      return '镜像连接失败，请联系镜像站长'
    }

  }
  async initialized() {
    const cloud_plugins_name: string[] = []
    const local_plugins_name: string[] = []
    this.local_plugins = await this.query_plugin()
    this.cloud_text = await this.get_cloud_text()
    this.cloud_plugins = await this.pull_plugin()
    for (var i of this.cloud_plugins) {
      cloud_plugins_name.push(i.name)
    }
    for (var j of this.local_plugins) {
      local_plugins_name.push(j.name)
    }
    for (var k in this.cloud_plugins) {
      if (local_plugins_name.includes(this.cloud_plugins[k].name)) {
        const lc_plugin = await this.ctx.database.get('blockly', { name: [this.cloud_plugins[k].name] })
        if (lc_plugin[0]?.isuploaded) {
          this.ctx.database.set('blockly', { name: [local_plugins_name[k]] }, { author: this.config.author, invalid_name: true })
        }
        let latest = false
        if (lc_plugin[0].version == this.cloud_plugins[k].version) {
          latest = true
        }
        for (var l in this.local_plugins) {
          if (this.local_plugins[l].name == this.cloud_plugins[k].name) {
            this.local_plugins[l].latest = latest
          }
        }
        this.ctx.database.set('blockly', { name: [local_plugins_name[k]] }, { latest: latest })
        this.cloud_plugins[k].isinstalled = true
      }
    }
  }


  async upload(plugin_id: number, desc: string, version: string): Promise<string> {
    const plugin: BlocklyRegistry.BlocklyDocument[] = await this.ctx.database.get('blockly', [plugin_id])
    if (plugin.length < 1) {
      return '上传失败,插件不存在'
    }
    this.ctx.database.set('blockly', [plugin_id], { author: this.config.author, desc: desc, version: version, isuploaded: true })
    logger.info(`上传插件：${plugin[0].name}； 版本：${version}`)
    try {
      const payload: BlocklyRegistry.UploadParms = {
        token: this.config.token,
        token_id: this.config.contact,
        name: plugin[0].name,
        desc: desc,
        version: version,
        code: plugin[0].code,
        body: plugin[0].body,
        author: this.config.author
      }
      const res = (await this.ctx.http.axios({
        method: 'POST',
        url: this.config.registry + UPLOAD_PATH,
        data: payload
      })).data
      if (res?.status == 'ok') return '上传成功'
      return 'error上传失败' + res.info
    } catch (e) {
      logger.error(e)
      //上传失败
      return 'error上传失败' + e
    }
  }
  async install(plugin_name: string, plugin_version: string): Promise<string> {
    logger.info('安装', plugin_name, plugin_version)
    try {
      const exit_plugins = await this.ctx.database.get('blockly', { name: [plugin_name] })
      if (exit_plugins[0]?.version == plugin_version) {
        return `改插件当前版本已经是${plugin_version},无需修改`
      }
      const plugin: BlocklyRegistry.BlocklyDocument = await this.download_source_code(plugin_name, plugin_version)
      await this.ctx.database.create("blockly", {
        name: plugin.name,
        body: plugin.body,
        code: plugin.code,
        enabled: this.config.start_now,
        edited: false,
        uuid: 'external',
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
    return (await this.ctx.http.axios(this.config.registry + CODE_PATH + '/' + plugin_name + '/' + plugin_version)).data
  }
}
namespace BlocklyRegistry {
  export const usage = `
测试版，暂未开放下载功能
前往私信 qq 机器人 xxx 获取 token<br>
上传插件请前往 blockly-registry 页面

## 注意事项：

>感谢您对我们搭建的blockly镜像插件的关注和使用。在使用本插件之前，请仔细阅读并理解本免责声明的内容。
本插件的发布和使用完全基于用户自愿。我们提供这个镜像插件的目的是为了方便用户分享和下载blockly的插件。
本插件是由我们独立搭建和维护的，与blockly官方组织无关。因此，任何由于使用本插件而引起的纠纷、损失或问题，均与blockly官方无关。
尽管我们努力确保本插件的安全性和稳定性，但无法保证本插件完全没有错误或缺陷。使用本插件的用户应自行承担风险，并对使用本插件可能带来的任何问题负全部责任。
本插件可能会依赖于其他第三方组件、库或工具。对于这些第三方资源的使用和效果，我们无法控制或承担责任。
我们保留随时中止、暂停或终止本插件的权利，而无需提前通知。这可能是出于技术原因、安全问题或其他因素考虑。
我们鼓励用户在使用本插件之前备份所有相关数据和文件，以防止任何数据丢失或损坏。
请注意，本免责声明可能随时更改或更新。建议您定期查看以获取最新版本。
通过使用本插件，即表示您已阅读、理解并同意遵守以上免责声明中所述的条款和条件。如果您不同意这些条款和条件，请不要使用本插件。
如有任何疑问或意见，请联系我们，我们将尽力为您提供帮助。
谢谢！
`
  export interface UploadParms {
    token: string
    token_id: string
    name: string
    desc: string
    version: string
    code: string
    body: string
    author: string
  }
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
    invalid_name?: boolean;
    latest?: boolean
  }
  export const Config: Schema<Config> = Schema.object({
    token: Schema.string().description('上传 blockly 代码的 token (用于鉴权)'),
    author: Schema.string().description('作者 格式: 昵称 < qq 号或者邮箱>,示例: "InitEncunnter <3118087750>"'),
    contact: Schema.string().description(' qq 号(用于鉴权,用户不可见)'),
    registry: Schema.string().description('插件源码镜像源').default('https://market.blockly.t4wefan.pub'),
    start_now: Schema.boolean().default(false).description('启用后将在安装插件后立即启用'),
  })
}

export default BlocklyRegistry