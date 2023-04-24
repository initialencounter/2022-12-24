# koishi-plugin-loader
[![npm](https://img.shields.io/npm/v/koishi-plugin-loader?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-loader)


## 前言
在我们更新插件的时候经常需要点击很多次
而且需要登录到控制台
因此我写了这个插件更新器
只需要发送loader
即可将package.json的插件版本同步至插件市场的最新版本
再根据自己的需求，升级插件


## 配置说明
- backend: 自动备份koishi.yml和package.json
  - 备份的文件名称为koishi.yml.bak和package.json.bak
- auto_install: 自动安装所有插件，默认关闭，非常安全
- updata_list: 更新时会发送更新清单
- just_added: 只更新已添加的插件（koishi.yml内的插件）,开发环境可以关闭此项，以免影响开发环境

## 使用说明
- 发送loader即可更新package.json内的插件版本
- 如果未开启自动安装，则需要手动安装
  - 手动安装命令 npm i|yarn
  - 可使用spawn的exec命令 示例 exec npm i

## 问题反馈
QQ群：399899914<br>
小伙伴如果遇到问题或者有新的想法，欢迎到[这里](https://github.com/initialencounter/mykoishi/issues)反馈哦~

## 更新日志
- v1.0.0
  - 修复更新数量错误的bug
  - 新增更新清单
  - 重写js-ymal,大幅度缩小插件体积