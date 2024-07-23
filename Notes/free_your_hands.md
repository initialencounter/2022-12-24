# 前言

>在我们更新插件的时候经常需要点击很多次
而且需要登录到控制台
因此我写了这个loader[![npm](https://img.shields.io/npm/v/koishi-plugin-loader?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-loader)
结合shutdown[![npm](https://img.shields.io/npm/v/koishi-plugin-shutdown?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-shutdown)
以及spawn[![npm](https://img.shields.io/npm/v/koishi-plugin-spawn?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-spawn)
在聊天中更新你的插件


## 插件配置
### loader
![image|690x154](upload://gTUrzuNqgNei4bJdkj3VekiJVyp.png)


- backend: 自动备份koishi.yml和package.json
![image|316x180](upload://q3FnSAIYFzkjsNrb1QWDngcnIe.png)


- 备份的文件名称为koishi.yml.bak和package.json.bak

- auto_install: 自动安装所有插件，默认关闭，非常安全

### shutdown和spawn
默认配置启用即可


## 使用步骤

- 发送loader即可更新package.json内的插件版本
![image|690x356](upload://w5Y9FVnrhH1VZp6g9tX9atxe5rq.png)
- 如果未开启自动安装，则需要手动安装

- 手动安装命令 npm i | yarn

- 可使用spawn的exec命令 示例:```exec npm i```

![image|690x368](upload://iRV4MB1Y3gtuoz1CIZrGTXyQ3ZK.png)
![image|690x460](upload://hpIk5tMwSmjmCHdOVKcNquBwGoA.png)

- 更新完成之后可以使用shutdown插件```shutdown -r now```重启koishi
![image|690x463](upload://cYpV6R60k2Vpk7X4KgbMUgk3kYI.png)

## 问题反馈

QQ群：399899914<br>

小伙伴如果遇到问题或者有新的想法，欢迎到[这里](https://github.com/initialencounter/2022-12-24/issues)反馈哦~