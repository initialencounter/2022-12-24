import { Context, Schema, Logger, Session, h, base64ToArrayBuffer } from 'koishi'
export const name = 'whisper-asr2'
import {} from '@initencounter/sst'
export const logger = new Logger(name)
class WhisperAsr{
  constructor(private ctx: Context, config: WhisperAsr.Config) {
    ctx.command('asr <url:string>', '语音url转文字')
      .alias('whisper')
      .option('lang', '-l <lang:string>', { fallback: config.language })
      .option('task', '-t <task:number>')
      .option('method', '-m <method:number>')
      .action(async ({ session, options }, input) => {
      })
  }
}
namespace WhisperAsr {
  export interface Config {
    endpoint: string
    auto_rcg: boolean
    method: string
    task: string
    language: string
    waiting: boolean
    recall: boolean
    recall_time: number
  }

  export const Config: Schema<Config> = Schema.object({
    endpoint: Schema.string().default('http://127.0.0.1:9000').description('whisper-asr服务器地址'),
    auto_rcg: Schema.boolean().default(false).description('自动语音转文字,作为服务启用时建议关闭'),

    method: Schema.union([
      Schema.const('openai-whisper').description('openai-whisper'),
      Schema.const('faster-whisper').description('faster-whisper'),
    ]).default('openai-whisper').description('模型?'),
    task: Schema.union([
      Schema.const('transcribe').description('transcribe'),
      Schema.const('translate').description('translate'),
    ]).default('transcribe').description('翻译还是translate'),
    language: Schema.union([
      Schema.const('zh').description('中文'),
      Schema.const('es').description('Español'),
      Schema.const('en').description('English'),
      Schema.const('hi').description('हिंदी'),
      Schema.const('ar').description('العربية'),
      Schema.const('bn').description('বাংলা'),
      Schema.const('pt').description('Português'),
      Schema.const('ru').description('русский'),
      Schema.const('ja').description('日本語'),
      Schema.const('pa').description('ਪੰਜਾਬੀ'),
      Schema.const('de').description('Deutsch'),
      Schema.const('jv').description('Basa Jawa'),
      Schema.const('ko').description('한국어'),
      Schema.const('te').description('తెలుగు'),
      Schema.const('mr').description('मराठी'),
      Schema.const('ta').description('தமிழ்'),
      Schema.const('vi').description('Tiếng Việt'),
      Schema.const('fr').description('Français'),
      Schema.const('ur').description('اردو'),
      Schema.const('it').description('Italiano'),
      Schema.const('tr').description('Türkçe'),
      Schema.const('th').description('ภาษาไทย'),
      Schema.const('gu').description('ગુજરાતી'),
      Schema.const('pl').description('Polski'),
      Schema.const('uk').description('Українська'),
      Schema.const('fa').description('فارسی'),
      Schema.const('hu').description('Magyar'),
      Schema.const('nl').description('Nederlands'),
      Schema.const('my').description('မြန်မာစာ'),
      Schema.const('az').description('Azərbaycan'),
      Schema.const('zu').description('IsiZulu'),
      Schema.const('el').description('Ελληνικά'),
      Schema.const('ro').description('Română'),
      Schema.const('sv').description('Svenska'),
      Schema.const('ha').description('Hausa'),
      Schema.const('am').description('አማርኛ'),
      Schema.const('sd').description('سنڌي'),
      Schema.const('yo').description('Yorùbá'),
      Schema.const('si').description('සිංහල'),
      Schema.const('km').description('ភាសាខ្មែរ'),
      Schema.const('ne').description('नेपाली'),
      Schema.const('ms').description('Bahasa Melayu'),
      Schema.const('ig').description('Asụsụ Igbo'),
      Schema.const('su').description('Basa Sunda'),
      Schema.const('uz').description('Oʻzbekcha'),
      Schema.const('bn').description('বাংলা'),
      Schema.const('kk').description('Қазақ тілі'),
      Schema.const('sw').description('Kiswahili'),
      Schema.const('eu').description('Euskara'),
      Schema.const('ceb').description('Sinugbuanong Binisayâ'),
      Schema.const('ny').description('Chichewa'),
      Schema.const('xh').description('IsiXhosa'),
      Schema.const('sn').description('ChiShona'),
      Schema.const('ht').description('Kreyòl ayisyen'),
      Schema.const('qu').description('Runasimi'),
      Schema.const('tg').description('тоҷикӣ'),
      Schema.const('hmn').description('Hmoob'),
      Schema.const('so').description('Af-Soomaali'),
      Schema.const('fy').description('Frysk'),
      Schema.const('mg').description('Malagasy'),
      Schema.const('co').description('Corsu'),
      Schema.const('tk').description('Türkmen'),
      Schema.const('st').description('Sesotho'),
      Schema.const('jw').description('Basa Jawa'),
      Schema.const('ga').description('Gaeilge'),
      Schema.const('sl').description('Slovenščina'),
      Schema.const('om').description('Oromoo'),
      Schema.const('mi').description('Te Reo Māori'),
      Schema.const('mt').description('Malti'),
      Schema.const('af').description('Afrikaans'),
      Schema.const('sq').description('Shqip'),
      Schema.const('hy').description('Հայերեն'),
      Schema.const('eu').description('Euskara'),
      Schema.const('be').description('Беларуская'),
      Schema.const('bs').description('Bosanski'),
      Schema.const('bg').description('Български'),
      Schema.const('ca').description('Català'),
      Schema.const('hr').description('Hrvatski'),
      Schema.const('cs').description('Čeština'),
      Schema.const('da').description('Dansk'),
      Schema.const('et').description('Eesti'),
      Schema.const('fo').description('Føroyskt'),
      Schema.const('fi').description('Suomi'),
      Schema.const('gl').description('Galego'),
      Schema.const('ka').description('ქართული'),
      Schema.const('el').description('Ελληνικά'),
      Schema.const('he').description('עברית'),
      Schema.const('is').description('Íslenska'),
      Schema.const('id').description('Indonesia'),
      Schema.const('ga').description('Gaeilge'),
      Schema.const('lv').description('Latviešu'),
      Schema.const('lt').description('Lietuvių'),
      Schema.const('lb').description('Lëtzebuergesch'),
      Schema.const('mk').description('Македонски'),
      Schema.const('ms').description('Bahasa Melayu'),
      Schema.const('mt').description('Malti'),
      Schema.const('no').description('Norsk'),
      Schema.const('nn').description('Norsk nynorsk'),
      Schema.const('fa').description('فارسی'),
      Schema.const('pl').description('Polski'),
      Schema.const('pt').description('Português'),
      Schema.const('ro').description('Română'),
      Schema.const('sr').description('Српски'),
      Schema.const('sk').description('Slovenčina'),
      Schema.const('sl').description('Slovenščina'),
      Schema.const('sv').description('Svenska'),
      Schema.const('th').description('ไทย'),
      Schema.const('tr').description('Türkçe'),
      Schema.const('uk').description('Українська'),
      Schema.const('vi').description('Tiếng Việt'),
    ]).default('zh').description('支持一百多种语言'),
    waiting: Schema.boolean().default(false).description('消息反馈，会发送思考中...'),
    recall: Schema.boolean().default(true).description('会撤回思考中'),
    recall_time: Schema.number().default(5000).description('撤回的时间'),
  })

}

export default WhisperAsr



