import { Context, Schema } from 'koishi'
import {} from 'koishi-plugin-mqtt'
export const name = 'test'
export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  ctx.command('call').action(async()=>{
    await ctx.mqtt.publish('123',{topic:'koishi/mqtt'})
  })
  ctx.command('call3').action(async({session})=>{
  })
}
