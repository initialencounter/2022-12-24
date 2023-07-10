import { Context, Schema } from 'koishi'

export const name = 'test'

export interface Config {
  value: string[]
}

export const Config: Schema<Config> = Schema.object({
  value: Schema.union([
    Schema.array(String),
    Schema.transform(String, value => [value]),
  ]).default([]),
})

export function apply(ctx: Context,config:Config) {
  console.log(config.value)
}
