import { Context, Logger, Schema, Session, h } from 'koishi'
import Vits from '@initencounter/vits'
import { deleteModels, getModels, invoke, putModel } from './api'
import { ffmpegConvert } from './utils'
export const name = 'fish-speech'
export const logger = new Logger(name)

class FishSpeech extends Vits {
  static inject = {
    optional: ['ffmpeg']
  }
  models: string[]
  ready: boolean
  constructor(ctx: Context, config: FishSpeech.Config) {
    super(ctx)
    this.models = []
    this.ready = false
    if (config.auto_init) {
      ctx.on("ready", async () => { await this.initialize() })
    } else {
      this.ready = true
    }
    ctx.i18n.define('zh', require('./locales/zh'))
    ctx.command('fish-speech.say <input:text>', 'vits语音合成', { checkArgCount: true })
      .alias('say')
      .option('speaker', '-s <speaker:number>', { fallback: config.speaker_id })
      .action(async ({ session, options }, input) => {
        let msgId = await session.send(session.text('commands.say.messages.waiting'));
        // 判断是否需要撤回
        if (config.recall) {
          this.recall(session, msgId[0])
        }
        const result: Vits.Result = { input, speaker_id: 0 }
        return await this.say(result)
      })
    ctx.command('fish-speech.reload [name:string]', '重载模型', { checkArgCount: true })
      .action(async ({ session, options }, input) => {
        let msgId = await session.send(session.text('commands.say.messages.loading'));
        // 判断是否需要撤回
        if (config.recall) {
          this.recall(session, msgId[0])
        }
        await deleteModels(ctx.http, ctx.config.endpoint, input)
        logger.info("PUT 模型中")
        let res = await this.initialize(input)
        return `重载${res ? '成功' : '失败'}`
      })
  }
  // 撤回的方法
  async recall(session: Session, messageId: string) {
    new Promise(resolve => setTimeout(() => {
      session.bot.deleteMessage(session.channelId, messageId)
    }
      , this.ctx.config.recall_time));
  }
  /**
   * 
   * @param input 要转化的文本
   * @param speaker_id 音色id，可选
   * @returns 
   */
  async say(option: Vits.Result): Promise<h> {
    if (!this.ready) {
      return h.text(`${name} 初始化失败，请检查 API`)
    }
    const res = await invoke(this.ctx.http, option.input, this.ctx.config.endpoint, this.ctx.config.speaker, this.ctx.config.name)
    let mime = this.ctx.config.mime
    const buffer = await ffmpegConvert(this.ctx, res, mime)
    return h.audio(buffer, `audio/${mime}`)
  }
  async initialize(name: string = "default") {
    let models = await getModels(this.ctx.http, this.ctx.config.endpoint)
    if (models?.models?.length > 0) {
      return await this.initialized(models?.models)
    }
    await putModel(this.ctx.http, this.ctx.config, name)
    models = await getModels(this.ctx.http, this.ctx.config.endpoint)
    if (models?.models?.length > 0) {
      return await this.initialized(models?.models)
    }
    logger.warn("初始化失败，请检查 API")
    return false
  }
  async initialized(models: string[]) {
    this.models = models
    await invoke(this.ctx.http, '1', this.ctx.config.endpoint, null, this.ctx.config.name)
    this.ready = true
    logger.success(`初始化成功，加载模型 ${this.models.join(",")}`)
    return true
  }
}

namespace FishSpeech {
  export interface Config {
    speaker_id: number
    speaker:string
    endpoint: string
    llama_path: string
    vqgan_path: string
    device: 'cuda' | 'cpu'
    name: string
    tokenizer: string
    recall: boolean
    recall_time: number
    auto_init: boolean
    mime: 'mp3' | 'flac' | 'ac3'
  }

  export const Config: Schema<Config> = Schema.object({
    endpoint: Schema.string().role("url").default("http://127.0.0.1:7860").description("fish-speech 的 API"),
    llama_path: Schema.string().default('../text2semantic-400m-v0.2-4k.pth').description("llama_path 模型路径"),
    vqgan_path: Schema.string().default('../vqgan-v1.pth').description("llama_path 模型路径"),
    device: Schema.union([
      Schema.const('cuda').description('cuda'),
      Schema.const('cpu').description('cpu'),
    ]).default('cuda').description('推理的设备'),
    name: Schema.string().default('default').description('预设'),
    speaker_id: Schema.number().default(0).description('讲者ID'),
    speaker: Schema.string().default(null).description('讲者'),
    tokenizer: Schema.string().default('fishaudio/speech-lm-v1').description("tokenizer"),
    recall: Schema.boolean().default(true).description('会撤回思考中'),
    recall_time: Schema.number().default(5000).description('撤回的时间'),
    auto_init: Schema.boolean().default(false).description('自动初始化'),
    mime: Schema.union([
      Schema.const('mp3').description('mp3'),
      Schema.const('flac').description('flac'),
      Schema.const('ac3').description('ac3'),
    ]).default('mp3'),
  })
}

export default FishSpeech