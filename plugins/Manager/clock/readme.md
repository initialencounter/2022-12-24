# 闹钟

[![npm](https://img.shields.io/npm/v/koishi-plugin-clock?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-clock)

闹钟插件


### [Allowed fields](https://github.com/node-cron/node-cron)

\`\`\`
 # ┌────────────── second (optional)
 # │ ┌──────────── minute
 # │ │ ┌────────── hour
 # │ │ │ ┌──────── day of month
 # │ │ │ │ ┌────── month
 # │ │ │ │ │ ┌──── day of week
 # │ │ │ │ │ │
 # │ │ │ │ │ │
 # * * * * * *
\`\`\`

### Allowed values

|     field    |        value        |
|--------------|---------------------|
|    second    |         0-59        |
|    minute    |         0-59        |
|     hour     |         0-23        |
| day of month |         1-31        |
|     month    |     1-12 (or names) |
|  day of week |     0-7 (or names, 0 or 7 are sunday)  |

### 注意事项

### 示例
#### 在工作日 17:30 发送下班了
  - User: clock 0 30 17 * * 1,2,3,4,5
  - Koishi: 请输入提醒消息
  - User: 下班了


#### 在每天 00:00 发送晚安
  - User: clock 0 0 0 * * *
  - Koishi: 请输入提醒消息
  - User: 晚安


#### 在每天早上 8:00 发送早安
  - User: cloak 0 0 8 * * * 
  - Koishi: 请输入提醒消息
  - User: 早安
