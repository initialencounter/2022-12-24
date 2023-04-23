# koishi-plugin-loader

[![npm](https://img.shields.io/npm/v/koishi-plugin-loader?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-loader)


### 配置说明
- backend: 自动备份koishi.yml和package.json
  - 备份的文件名称为koishi.yml.bak和package.json.bak
- auto_install: 自动安装所有插件，默认关闭，非常安全

### 使用说明
- 发送loader即可更新package.json内的插件版本
- 如果为开启自动安装，则需要手动安装
  - 手动安装命令 npm i|yarn
  - 可使用spawn的exec命令 示例 exec npm i

### 问题反馈
QQ群：399899914<br>
小伙伴如果遇到问题或者有新的想法，欢迎到[这里](https://github.com/initialencounter/mykoishi/issues)反馈哦~