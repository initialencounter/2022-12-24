import { Context, Schema, Dict, Logger } from 'koishi'
import WebSocket from 'ws'
export const name = 'autoxjs-sender'
export const logger = new Logger(name)

class AutoX{
  constructor(private ctx:Context,private config:AutoX.Config){
    if (config.type == 'server') {
      const ws = new WebSocket.Server({ port: config.port ,host:"0.0.0.0"})
      ws.on('connection', ws_client => {
        logger.info('接受连接')
        ctx.before('send', async (session) => {
          const {platform,guildId,id} = await session.getChannel()
          if(platform == 'onebot'){
            const msg = {
              content: session.content,
              guildId: guildId||0,
              id: id
            }
            ws_client.send(JSON.stringify(msg),(err)=>{
              if(err){
                logger.info('未知错误'+err)
              }
            })
            session.content = ''
          }
          
        })
        ws_client.on('close',(code,reason) => {
          logger.info(`连接关闭:\ncode:${code},reason:${reason}`)
        })
        ws_client.on('error',err=>{
          logger.info('未知错误'+err)
        })
        ws_client.on('message',(data)=>{
          logger.info(data.toString('utf-8'))
        })
      })
    } else {
      const wss = ctx.http.ws(config.endpoint)
      ctx.before('send', async (session) => {
        const {platform,guildId,id} = await session.getChannel()
        if(platform == 'onebot'){
          const msg = {
            content: session.content,
            guildId: guildId||0,
            id: id
          }
          wss.send(JSON.stringify(msg))
          session.content = ''
        }
      })
    }
  
  }
}
namespace AutoX{
  export const usage = `
# 使用方法

- 准备一台闲置的， 拥有 root 权限的安卓手机
- 安装 [autoxjs](https://github.com/kkevsekk1/AutoX)
- 修改 client.js 脚本的参数如 
    - websocket 地址，
    - 点击位置的坐标，不同手机屏幕分辨率不一样
    直至可以顺利发送群消息和私信
- 启用本插件
- 运行 client.js
`
  export interface Config {
    type: string
    port: number
    endpoint: string
  }
  
  export const Config: Schema<Dict> = Schema.intersect([
    Schema.object({
      type: Schema.union([
        Schema.const('server' as string).description('Koishi 做 ws 服务端'),
        Schema.const('client' as string).description('Koishi 做 ws 客户端')
      ]).default('server' as string).description('模式选择')
    }),
    Schema.union([
      Schema.object({
        type: Schema.const('server' as string),
        port: Schema.number().default(32327).description('websocket 服务端口')
      }).description('服务端模式'),
      Schema.object({
        type: Schema.const('client' as string),
        endpoint: Schema.string().default('ws://127.0.0.1:32327').description('autoxjs ws 地址')
      }).description('客户端模式')
    ])
  ])
}

export default AutoX

