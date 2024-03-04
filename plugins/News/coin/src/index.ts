import { Context, Schema, contain } from 'koishi'
import { getCoinHolders } from './api'
import { coinAlias, coinHoldersAddr } from './type'
import { renderHolders } from './render'
import { readFileSync } from 'fs'
import { resolve } from 'path'
export const name = 'coin'

export interface Config { }
export const inject = {
  required: ['puppeteer']
}
export const Config: Schema<Config> = Schema.object({})
export const usage = `${readFileSync(resolve(__dirname, '../readme.md')).toString("utf-8").split("更新日志")[0]}`
export function apply(ctx: Context) {

  const coinMap = {};
  for (const [coin, alias] of Object.entries(coinAlias)) {
    coinMap[coin] = coin;
    for (const item of alias) {
      coinMap[item] = coin;
    }
  }

  // write your plugin here
  ctx.command("持币 [coin:string]").action(async ({ session, options }, prompt: string) => {
    console.log(coinMap,prompt)
    const res: coinHoldersAddr = await getCoinHolders(ctx.http, coinMap?.[prompt] ?? "bitcoin")
    return renderHolders(res)
  })
}