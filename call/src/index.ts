import { Context, Schema, Dict } from 'koishi'
import net from 'net'
export const name = 'call'

export interface Config { }

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  // write your plugin here
  ctx.command('call').action(async ({ }) => {
    console.log('ok')
    
  })
}
