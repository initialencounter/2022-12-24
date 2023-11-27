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
  ctx.on('ready',async ()=>{
    console.log(ctx.jimp.FONT_SANS_10_BLACK)
    const a = await ctx.jimp.read("C:\\Users\\29115\\dev\\ks\\Plugins\\News\\gh-tile\\src\\0.jpg")
    a.crop(20,20,20,20)
    a.writeAsync('C:\\Users\\29115\\dev\\ks\\test\\src\\0.jpg')
    console.log('done4')
  })
}