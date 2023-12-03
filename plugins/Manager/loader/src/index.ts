
import { Context, Dict, Schema, Logger, Session } from 'koishi'
import { exec } from 'child_process'
export const name = 'loader'
const logger = new Logger(name)
const fs = require('fs').promises;
import {load as yaml_load} from './js-yaml/yaml'

class Loader {
  mainfest: Loader.Mainfest
  installed_plugin: Dict
  added_plugin: string[]
  update_plugin: string[]
  constructor(private ctx: Context, private config: Loader.Config) {
    ctx.i18n.define('zh', require('./locales/zh'));
    ctx.on('ready', async () => await this.initialize())
    ctx.command('loader', '更新所有插件', { authority: 5 })
      .action(async ({ session }) => await this.main(session))
  }
  private async initialize(): Promise<void> {
    const json_data: string = await fs.readFile('package.json', 'utf8');
    const yaml_data: string = await fs.readFile('koishi.yml', 'utf8');
    // 备份
    await fs.writeFile('./package.json.bak', json_data, 'utf8');
    await fs.writeFile('./koishi.yml.bak', yaml_data, 'utf8');
    // 解析插件
    this.mainfest = await JSON.parse(json_data)
    this.added_plugin = await this.get_plugins((await yaml_load(yaml_data,{})).plugins)
    this.installed_plugin = await JSON.parse(JSON.stringify(this.mainfest.dependencies))
    // 只安装 koishi.yml 内的插件
    if(this.config.just_added){
      this.update_plugin = this.added_plugin
    }else{
      this.update_plugin = Object.keys(this.installed_plugin)
    }
  }
  private async main(session: Session): Promise<string> {
    session.send(session.text('commands.loader.messages.waiting'))
    const packages: Loader.Package[] = (await this.ctx.http.get('https://registry.koishi.chat/index.json'))['objects']
    const update_list: string[] = []
    for (var i of packages) {
      if (i.ignored) {
        continue
      }
        if(i.insecure){
          continue
      }
      if(i.category == 'adapter'){
          continue
      }
      if (i.ignored) {
          continue;
      }
      if(i.installSize>5242880){
          continue
      }
      if(i.rating<3){
          continue
      }
      if(i.package.name.includes('chat')){
          continue
      }
      const full_name: string = i.package.name
      const name: string = full_name.replace(/(koishi-|^@koishijs\/)plugin-/, '')
      if ((this.update_plugin.includes(name) || this.update_plugin.includes(full_name)) && !(this.installed_plugin[full_name]==i.package.version)) {
        update_list.push(`${name}: ${this.installed_plugin[full_name]} --> ${i.package.version}`)
        this.installed_plugin[full_name] = i.package.version
      }
    }
    await this.modifyJsonFile()
    if (this.config.auto_install) {
      exec('npm i')
    }
    let msg: string = session.text('commands.loader.messages.info', [update_list.length])+'\n'
    if(this.config.update_list){
      msg += update_list.join('\n')
    }
    return msg

  }
  private async get_plugins(obj: Dict): Promise<string[]> {
    if (!obj) {
      return null;
    }
    const keys: string[] = Object.keys(obj);
    const plugins: string[] = [];
    keys.forEach(async (i) => {
      if (i.startsWith('group:')) {
        const child_plugin = await this.get_plugins(obj[i]);
        child_plugin.forEach((i) => {
          plugins.push(i);
        });
      } else {
        if (i.indexOf(':') == -1) {
          i = i
        } else {
          i = i.slice(0, i.indexOf(':'))
        }
        if (i.startsWith('~')) {
          i = i.replace('~', '')
        }
        plugins.push(i);
      }
    });
    return plugins;
  }
  private async modifyJsonFile():Promise<void> {
    try {
      this.mainfest.dependencies = this.installed_plugin;

      // 将 JSON 对象转换回字符串
      const updatedJson = JSON.stringify(this.mainfest, null, 2);

      // 将修改后的内容写回文件
      await fs.writeFile('package.json', updatedJson, 'utf8');
      logger.info('JSON 文件已成功更新');
    } catch (err) {
      logger.error('处理文件时出错:', err);
    }
  }

}
namespace Loader {
  export const usage = `
### 注意事项
- 如用于开发环境,请先关闭just_added选项!!!

### 配置说明
- backend: 自动备份koishi.yml和package.json
  - 备份的文件名称为koishi.yml.bak和package.json.bak
- auto_install: 自动安装所有插件，默认关闭，非常安全
- updata_list: 更新时会发送更新清单
- just_added: 只更新已添加的插件（koishi.yml内的插件）,开发环境可以关闭此项，以免影响开发环境

### 使用说明
- 发送loader即可更新package.json内的插件版本
- 如果未开启自动安装，则需要手动安装
  - 手动安装命令 npm i|yarn
  - 可使用spawn的exec命令 示例 exec npm i

### 问题反馈
QQ群：399899914<br>
小伙伴如果遇到问题或者有新的想法，欢迎到[这里](https://github.com/initialencounter/mykoishi/issues)反馈哦~`

  export interface Mainfest {
    name: string
    version: string
    private: boolean,
    files: string[]
    license: string
    workspaces: string[]
    scripts: Dict
    devDependencies: Dict
    dependencies: Dict
  }
  export interface Package {
    package: {
      name: string
      scope: string
      version: string
      description: string
      keywords: string[]
      date: string
      links: {
        npm: string
      },
      publisher: { username: string, email: string },
      maintainers: [{ username: string, email: string }]
    },
    score: { final: number, detail: { quality: number, popularity: number, maintenance: number } },
    searchScore: number
    ignored: boolean
    insecure: boolean
    category: string
    createdAt: string
    updatedAt: string
    rating: number
    portable: boolean
    downloads: {
        lastMonth: number
    },
    installSize: number
    publishSize: number
  }
  export interface Config {
    update_list: boolean
    auto_install: boolean
    backend: boolean
    just_added: boolean

  }

  export const Config: Schema<Config> = Schema.object({
    backend: Schema.boolean().default(true).description('自动备份文件'),
    just_added: Schema.boolean().default(true).description('只安装已添加的插件（koishi.yml内的插件),开发环境下建议关闭,否则会改变开发环境'),
    auto_install: Schema.boolean().default(false).description('自动安装所有插件'),
    update_list: Schema.boolean().default(true).description('发送更新清单'),
  })
}
export default Loader
