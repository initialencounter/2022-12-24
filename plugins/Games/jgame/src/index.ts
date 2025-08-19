import { Context, Schema } from 'koishi'
import ImageCache from './service/jgameImageCache'
import BattleList from './plugin/batterList'
import JGameAPI from './service/api'
import { JGameAPIConfig } from './types/api'
import { readFileSync } from 'fs'
import { resolve } from 'path'
export const name = 'jgame'

const localUsage = readFileSync(resolve(__dirname, "../readme.md"))
  .toString("utf-8")
export const usage = localUsage

export interface Config {
  api: JGameAPIConfig
}

export const Config: Schema<Config> = Schema.object({
  api: JGameAPIConfig
})

export async function apply(ctx: Context, config: Config) {
  ctx.plugin(ImageCache)
  ctx.plugin(JGameAPI, config.api)
  ctx.plugin(BattleList)
}
