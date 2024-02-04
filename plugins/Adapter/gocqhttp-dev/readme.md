# koishi-plugin-gocqhttp-dev

# 此插件已废弃

[登录教程](https://www.bilibili.com/video/BV15H4y1f7nu), 视频从1:44开始

# 以下是最新版本的readme：
 
[![npm](https://img.shields.io/npm/v/koishi-plugin-gocqhttp-dev?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-gocqhttp-dev)

适配 [gocqhttp-dev](https://github.com/Mrs4s/go-cqhttp/tree/dev) 启动器

本插件魔改自[koishi-plugin-gocqhttp](https://github.com/koishijs/koishi-plugin-gocqhttp)

本插件与gocqhttp不可同时运行, 启用前请先停止gocqhttp

[部署 SignServer 点我](https://github.com/fuqiuluo/unidbg-fetch-qsign/wiki)

协议版本抄自[MrXiaoM/qsign](https://github.com/MrXiaoM/qsign)

目前支持以下功能：

- [x] 扫描二维码登录
- [x] 手机短信验证码
- [x] captcha 图片
- [x] 滑条验证
- [x] 手动输入ticket
- [x] 配置签名服务器
- [x] 检测qsignServer, 减少冻结风险
- [x] 监听多个服务，可用于对接其他框架，如 [Nonebot](https://nonebot.dev/),[Zerobot-plugin](https://github.com/FloatTech/ZeroBot-Plugin)等
- [ ] 设置登录设备


## 使用方法

要使用此插件，需要完成这些配置：
1. 启动 qsign, 有两种方法
  - 方法一，内置qsign: 安装@yunkuangao/qsign，并启用
  - 方法二，外置qsign：[部署 SignServer 点我](https://github.com/fuqiuluo/unidbg-fetch-qsign/wiki)
2. 启用本插件
3. 前往[adapter-onebot](https://github.com/koishijs/koishi-plugin-adapter-onebot), 填写qq账号和密码，勾选启用自动创建 gocqhttp 子进程，启用 adapter-onebot


## 问题反馈
* QQ群：399899914<br>
* 小伙伴如果遇到问题或者有新的想法，欢迎到[这里](https://github.com/initialencounter/mykoishi/issues)反馈哦~

## 更新日志
- v1.2.0
  - 将 onebot 更换为社区版本
- v1.1.1-dev-0.2.0
  - 将心跳检测，监听服务配置项移动至 onebot 页面
  - 还原日志输出, 若要显示所有日志输出可以拉高日志等级
  - 删除 http 监听
  - 删除配置项：getTicketManual
  - 将 ticket 链接显示在 onebot 配置页面

- v1.1.1-dev-0.4.0
  - 新增自适应协议版本，目前支持的协议版本有 8.9.58，8.9.63，8.9.68，8.9.70，8.9.73
  - 支持配置多个签名服务, 最多支持5个，超过的部分会被忽略
  - 更改心跳检测逻辑，当所有签名服务挂了才会退出 gocqhttp 子进程
  - 新增协议检测，确保所有签名服务的协议版本和 gocqhttp 的协议版本一致，当某个签名服务的协议版本发生改变时也会退出 go-cqhttp 子进程
  - 新增内置qsign联动，当启用内置qsign(@yunkuangao/qsign)时，以及开启qsignInlay选项时，会等待qsign服务启动
  - 将 `监听多个服务` 的配置页面移动到 onebot 配置页面
  - 新增 `自动注册实例` 选项，若 qsign 开启了自动注册实例, 建议关闭此项
  - 更改 gocqhttp 默认安装版本为

- v1.1.1-dev-0.4.3
  - 修复heartBearQsign, 导致qsignServer挂掉的

- v1.1.1-dev-0.4.4
  - 修改 `usage` 为最新的readme

- v1.1.1-dev-0.4.5
  - 修改 css

- v1.1.1-dev-0.5.0
  - 同步最新的 master 分支 [action](https://github.com/Mrs4s/go-cqhttp/actions/runs/6457031884)

- v1.1.1-dev-0.5.1
  - 修复重启后才能启动 gocqhttp 的 bug, 读取不到bot.selfId, 原因未知