/*
 * @Author: initialencounter
 * @Date: 2023-07-01 23:21:55
 * @FilePath: D:\dev\koishi-hmr\external\autoxjs-server\src\index.ts
 * @Description:
 *
 * Copyright (c) 2023 by initialencounter, All Rights Reserved.
 */



import { Context, Schema, Dict, Logger } from 'koishi'
import WebSocket from 'ws'
const fs = require('fs').promises;
export const name = 'autoxjs-sender'
export const logger = new Logger(name)

class AutoX {
  constructor(private ctx: Context, private config: AutoX.Config) {
    ctx.on('ready', async () => {
      const json_data: string = await fs.readFile('package.json', 'utf8');
      const yaml_data: string = await fs.readFile('koishi.yml', 'utf8');
      // 备份
      await fs.writeFile('./package.json.bak', json_data, 'utf8');
      await fs.writeFile('./koishi.yml.bak', yaml_data, 'utf8');
    })

    ctx.command('close_client', '关闭客户端连接').action(({ session }) => {
      logger.info('用户关闭了ws')
      session.send('close_client')
    })
    if (config.type == 'server') {
      const ws = new WebSocket.Server({ port: config.port, host: "0.0.0.0" })
      ws.on('connection', ws_client => {
        const heartbeatInterval = config.heartbeatInterval; // 心跳间隔时间，单位：毫秒
        let heartbeatTimer = null;
        let connected = true
        heartbeatTimer = setInterval(() => {
          if (ws_client.readyState === WebSocket.OPEN) {
            ws_client.send('heartbeat'); // 发送心跳包
          } else {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
          }
        }, heartbeatInterval);
        // 监听 send
        ctx.before('send', async (session) => {
          const { platform, id } = await session.getChannel()
          if (session.content == "close_client") {
            ws_client.close(1000, '被动关闭')
            connected = false
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
          }
          if (connected && platform == 'onebot' && session.content.length < 3000) {
            const msg = {
              content: session.content,
              chanelId: session.channelId,
              id: id
            }
            ws_client.send(JSON.stringify(msg), (err) => {
              if (err) {
                logger.info('未知错误' + err)
              }
            })
            session.content = ''
          }

        })
        ws_client.on('close', (code, reason) => {
          logger.info(`连接关闭:\ncode:${code},reason:${reason}`)
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        })
        ws_client.on('error', err => {
          logger.info('未知错误' + err)
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        })
        ws_client.on('message', (data) => {
          logger.info(this.getTime() + data.toString('utf-8'))
        })
      })
    } else {
      const wss = ctx.http.ws(config.endpoint)
      const heartbeatInterval = config.heartbeatInterval; // 心跳间隔时间，单位：毫秒
      let heartbeatTimer = null;
      let connected = true
      heartbeatTimer = setInterval(() => {
        if (wss.readyState === WebSocket.OPEN) {
          wss.send('heartbeat'); // 发送心跳包
        } else {
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }
      }, heartbeatInterval);
      ctx.before('send', async (session) => {
        const { platform, id } = await session.getChannel()
        if (session.content == "close_client") {
          wss.close(1000, '被动关闭')
          connected = false
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }
        if (connected && platform == 'onebot' && session.content.length < 3000) {
          const msg = {
            content: session.content,
            chanelId: session.channelId,
            id: id
          }
          wss.send(JSON.stringify(msg))
          session.content = ''
        }
      })
    }
  }
  getTime() {
    const date = new Date();
    const date_str = date.toISOString();
    return date_str.replace(/:/g, '-').slice(0, 19);
  }
}
namespace AutoX {
  export const usage = `
# 使用方法

- 准备一台闲置的， 拥有 root 权限的安卓手机
- 安装 [autoxjs](https://github.com/kkevsekk1/AutoX)
- 修改 [client.js](https://raw.githubusercontent.com/initialencounter/2022-12-24/master/autoxjs-server/lib/client.js) 脚本的 websocket 地址
- 启用本插件
- 为 Autoxjs 开启无障碍，授予 root 权限
- 运行 client.js
`
  export interface Config {
    type: string
    port: number
    heartbeatInterval: number
    endpoint: string
  }

  export const Config: Schema<Dict> = Schema.intersect([
    Schema.object({
      type: Schema.union([
        Schema.const('server' as string).description('Koishi 做 ws 服务端'),
        Schema.const('client' as string).description('Koishi 做 ws 客户端, 暂无 AutoX.js的脚本')
      ]).default('server' as string).description('模式选择')
    }),
    Schema.union([
      Schema.object({
        type: Schema.const('server' as string),
        port: Schema.number().default(32327).description('websocket 服务端口'),
        heartbeatInterval: Schema.number().default(5000).description('心跳时间间隔')
      }).description('服务端模式'),
      Schema.object({
        type: Schema.const('client' as string),
        endpoint: Schema.string().default('ws://127.0.0.1:32327').description('autoxjs ws 地址')
      }).description('客户端模式')
    ])
  ])
}

export default AutoX
