
import { Context, Dict, Schema, Logger,Session } from 'koishi'
import { exec } from 'child_process'
export const name = 'loader'
const logger = new Logger(name)
const fs = require('fs').promises;
const yaml = require('js-yaml');


class Loader {
  mainfest: Loader.Mainfest
  new_dependencies: Dict
  koishi_yml: Dict
  exits_plugins: string[]
  update_plugin: Dict
  constructor(private ctx: Context, private config: Loader.Config) {
    ctx.i18n.define('zh', require('./locales/zh'));
    ctx.on('ready', async () => this.initialize())
    ctx.command('loader', '安装/更新插件市场所有插件', { authority: 5 })
      .action(async ({session}) => this.main(session))
  }
  async initialize() {
    const json_data: string = await fs.readFile('package.json', 'utf8');
    const yaml_data: Dict = await fs.readFile('koishi.yml', 'utf8');
    // 备份
    await fs.writeFile('./package.json.bak', json_data, 'utf8');
    await fs.writeFile('./koishi.yml.bak', yaml_data, 'utf8');
    this.mainfest = JSON.parse(json_data)
    this.koishi_yml = yaml.load(yaml_data)
    this.new_dependencies = JSON.parse(JSON.stringify(this.mainfest.dependencies))
    this.update_plugin = JSON.parse(JSON.stringify(this.mainfest.dependencies))
    this.exits_plugins = this.get_plugins(this.koishi_yml.plugins)
  }
  async main(session:Session) {
    let count_add = 0
    let count_update = 0
    const packages: Loader.Package[] = (await this.ctx.http.get('https://registry.koishi.chat/index.json'))['objects']
    for (var i of packages) {
      if (i.ignored) {
        continue
      }
      const full_name: string = i.package.name
      const name: string = full_name.replace(/(koishi-|^@koishijs\/)plugin-/, '')
      if (this.exits_plugins.includes(name)) {
        if (!(this.mainfest[full_name] == i.package.version)) {
          this.update_plugin[full_name] = i.package.version
          count_update++
        }
      } else {
        count_add++
        this.koishi_yml.plugins[`~${name}`] = {}
      }
      this.new_dependencies[full_name] = i.package.version
    }

    if(this.config.just_update){
      await this.modifyJsonFile(this.update_plugin)
      if (this.config.auto_install) {
        exec('npm i')
      }
      return session.text('commands.loader.messages.info',[0,count_update])
    }
    await this.modifyJsonFile()
    if (this.config.auto_install) {
      exec('npm i')
    }
    if (this.config.add_to_koishi_yml) {
      await this.writeYamlFile()
    }
    return session.text('commands.loader.messages.info',[count_add,count_update])

  }
  get_plugins(obj: Dict = this.koishi_yml) {
    if (!obj) {
      return null;
    }
    const keys: string[] = Object.keys(obj);
    const plugins: string[] = [];
    keys.forEach((i) => {
      if (i.startsWith('group:')) {
        const child_plugin = this.get_plugins(obj[i]);
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
  async writeYamlFile() {
    try {
      const yamlContent = yaml.dump(this.koishi_yml);
      await fs.writeFile('koishi.yml', yamlContent, 'utf8');
    } catch (error) {
      console.error('Error writing YAML file:', error);
    }
  }
  async modifyJsonFile(obj:Dict = this.new_dependencies) {
    try {
      this.mainfest.dependencies = obj;

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
### 配置说明
- backend: 自动备份koishi.yml和package.json
  - 备份的文件名称为koishi.yml.bak和package.json.bak
- just_update: 只更新已添加的插件
- add_to_koishi_yml: 自动添加到插件列表,不会启用，非常安全
- auto_install: 自动安装所有插件

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
    searchScore: number,
    ignored: boolean
  }
  export interface Config {
    add_to_koishi_yml: boolean
    just_update: boolean
    auto_install: boolean
    backend: boolean

  }

  export const Config: Schema<Config> = Schema.object({
    backend: Schema.boolean().default(true).description('自动备份文件'),
    just_update: Schema.boolean().default(false).description('只更新已添加的插件'),
    add_to_koishi_yml: Schema.boolean().default(true).description('自动添加到插件列表'),
    auto_install: Schema.boolean().default(false).description('自动安装所有插件')
  })
}
export default Loader
