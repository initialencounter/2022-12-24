import { Context, Schema } from 'koishi'
import Jimpp from '@initencounter/koishi-plugin-jimp'
import { resolve } from 'path'
export const name = 'test'

export interface Config {
  value: string[]
}
export const inject = {
  required: ['jimp']
}
export const Config: Schema<Config> = Schema.object({
  value: Schema.union([
    Schema.array(String),
    Schema.transform(String, value => [value]),
  ]).default([]),
})

export function apply(ctx: Context,config:Config) {
}