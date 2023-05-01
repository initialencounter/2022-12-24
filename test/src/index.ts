import { Context, Schema } from 'koishi'
import {} from '@koishijs/translator'
export const name = 'test'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export async function apply(ctx: Context) {
  // ctx.command('test').action(async()=>{
  //  const res = await ctx.translator.translate({input:'你好'})
  //  console.log(res)
  // })
}
