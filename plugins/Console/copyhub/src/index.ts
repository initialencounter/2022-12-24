import { Context, Schema } from 'koishi'
import { resolve } from 'path'
import { } from '@koishijs/plugin-console'
import { writeFileSync } from 'fs'

export const name = 'copyhub'

declare module '@koishijs/plugin-console' {
  interface Events {
    'copyhub-set-data'(Data: Data): void
    'copyhub-get-data'(): {
      [key: string]: Data;
    }
    'copyhub-delete-data'(id: string): void
    'copyhub-add-data'(id: string, content: string): void
  }
}

export interface Data {
  type: 'text' | 'image' | 'file'
  content: Buffer | string
}

export const inject = {
  required: ['console', 'server'],
}
export interface Config { }

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  let data: {
    [key: string]: string;
  } = {}
  ctx.inject(['console'], (ctx) => {
    ctx.console.addEntry({
      dev: resolve(__dirname, '../client/index.ts'),
      prod: resolve(__dirname, '../dist'),
    })
  })
  ctx.server.get('/copyhub-get-data', (_ctx) => {
    // console.log('get data', data)
    return _ctx.body = data
  })
  ctx.console.addListener('copyhub-set-data', (data: Data) => {
    writeFileSync(resolve(__dirname, 'data.png'), Buffer.from(data.content as string, 'base64'))
  })
  ctx.console.addListener('copyhub-delete-data', (id: string) => {
    delete data[id]
  })
  ctx.console.addListener('copyhub-add-data', (id: string, content: string) => {
    data[id] = content
  })

}
