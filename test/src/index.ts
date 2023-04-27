import { Context, Schema } from 'koishi'
import {} from 'koishi-service-vits'
export const name = 'test'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export async function apply(ctx: Context) {
  ctx.command('test').action(async()=>{
    return await ctx.vits.say({input:'你好'})
  })
  //console.log( ))
}
