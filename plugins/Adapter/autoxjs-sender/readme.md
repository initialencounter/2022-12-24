# koishi-plugin-autoxjs-sender

[![npm](https://img.shields.io/npm/v/koishi-plugin-autoxjs-sender?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-autoxjs-sender)

使用 [autoxjs](https://github.com/kkevsekk1/AutoX) 发送消息
# 使用方法
![demo](https://raw.githubusercontent.com/initialencounter/mykoishi/neat/plugins/Adapter/autoxjs-sender/demo.gif)

- 准备一台闲置的， 拥有 root 权限的安卓手机
- 安装 [autoxjs](https://github.com/kkevsekk1/AutoX)
- 修改 [client.js](https://raw.githubusercontent.com/initialencounter/mykoishi/master/autoxjs-server/lib/client.js) 脚本的 websocket 地址
- 启用本插件
- 为 Autoxjs 开启无障碍，授予 root 权限
- 运行 client.js

## 更新日志
- v1.4.0
    - 更新脚本，更加稳定，且不再需要 root 权限了
- v1.3.0
    - 新增自动备份 koishi.yml packaage.json