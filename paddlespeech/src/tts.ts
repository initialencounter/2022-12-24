import { Context, Session, Schema, Logger, h, trimSlash, base64ToArrayBuffer } from 'koishi'
import Vits from '@initencounter/vits'
export const name = 'paddlespeech-tts'
export const logger = new Logger(name)

class PaddleSpeechTts extends Vits {
    access_token: string
    temp_msg: string
    speaker: number
    max_length: number
    constructor(ctx: Context, private config: PaddleSpeechTts.Config) {
        super(ctx)
        this.max_length = this.config.max_length
        ctx.i18n.define('zh', require('./locales/zh'));
        ctx.command('say [input:text]', '百度智能云语音合成')
            .option('speaker', '-s <speaker:number>', { fallback: config.speaker_id })
            .action(async ({ session, options }, input) => {
                input = input?input:'您好，欢迎使用百度飞桨语音合成服务。'
                this.speaker = options.speaker
                if (this.config.waiting) {
                    const msgid = (await session.bot.sendMessage(session.channelId, h('quote', { id: session.messageId }) + session.text('commands.asr.messages.thinking'), session.guildId))[0]
                    if (this.config.recall) {
                        await this.recall(session, msgid)
                    }
                }
                const result: Vits.Result = { input, speaker_id: this.speaker  }
                return await this.say(result)
            })
    }
    /**
       * 
       * @param input 要转化的文本
       * @param speaker_id 音色id，可选
       * @returns 
       */
    async say(option: Vits.Result): Promise<h> {
        let { input, speaker_id } = option
        if (!speaker_id) {
            speaker_id = this.speaker
        }
        if (input.length > this.max_length) {
            return h('字数过长');
        }
        const body: PaddleSpeechTts.Request = {
            text: input,
            spk_id: this.speaker,
            speed: this.config.speed,
            volume: 1,
            simple_rate: 8000,
            save_path: '/root/test.wav'
        }
        const payload = {
            method: 'POST',
            url: trimSlash(this.config.endpoint + '/paddlespeech/tts'),
            data: body
        }
        try {
            const response: PaddleSpeechTts.Result = (await this.ctx.http.axios(payload)).data
            return h.audio(base64ToArrayBuffer(response.result.audio), 'audio/wav')
        } catch (e) {
            logger.info(String(e))
            return h(String(e))
        }

    };
    async recall(session: Session, messageId: string) {
        new Promise(resolve => setTimeout(() => {
            session.bot.deleteMessage(session.channelId, messageId)
        }
            , this.config.recall_time));
    }


}
namespace PaddleSpeechTts {
    export const usage = `
## 使用说明
启用前请前往 <a style="color:blue" href="https://console.bce.baidu.com/ai/#/ai/speech/overview/resource/getFree">领取</a>并创建应用
<a style="color:blue" href="https://console.bce.baidu.com/ai/#/ai/speech/app/list">领取</a> 进行获取密钥
只适配了QQ平台,其他平台兼容性未知
`
    export interface Result {
        success: true,
        code: number
        message: {
            description: string
        },
        result: {
            lang: string
            spk_id: number
            speed: number
            volume: number
            sample_rate: number
            duration: number
            save_path: string
            audio: string
        }
    }
    export interface Request {
        text: string,
        spk_id: number
        speed: number
        volume: number
        simple_rate: number
        save_path: string
    }
    export interface Config {
        endpoint: string
        waiting: boolean
        recall: boolean
        recall_time: number
        speaker_id: number
        speed: number
        max_length: number
    }
    export const Config: Schema<Config> = Schema.object({
        endpoint: Schema.string().default('http:127.0.0.1:8888').description('飞桨服务器地址'),
        waiting: Schema.boolean().default(true).description('消息反馈，会发送计算中...'),
        recall: Schema.boolean().default(true).description('会撤回计算中'),
        recall_time: Schema.number().default(5000).description('撤回的时间'),
        speaker_id: Schema.number().default(0).description('标准音色'),
        speed: Schema.number().default(1).description('语速'),
        max_length: Schema.number().default(1024).description('字数限制'),
    })

}

export default PaddleSpeechTts



