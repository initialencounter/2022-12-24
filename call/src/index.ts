import { Context, Schema, Dict } from 'koishi'
import net from 'net'
export const name = 'call'

export interface Config { }

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  // write your plugin here
  ctx.command('call <msg:text>').action(async ({ session},msg) => {
    return (await ctx.http.axios({
      method: 'POST',
      url:'http://127.0.0.1:11142/chat',
      data:{
        "msg": msg,
        "uid": session.userId
      }
      
    })).data

    console.log('ok')
    
  })
}
