# koishi-plugin-jgame

[![npm](https://img.shields.io/npm/v/koishi-plugin-jgame?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-jgame)

金铲铲/云顶战绩查询

# 配置方法

开启抓包工具 -> 登录掌盟 -> 抓取 `/go/auth/refresh_client_ticket` 响应体中的 `ct` 填入 `refreshTicket`
 -> 抓取 `/go/user_profile/query/user` 请求头中的 `cookie` 填入 `headers.cookie`

# 问题反馈 585269987

