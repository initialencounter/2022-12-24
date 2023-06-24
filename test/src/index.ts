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
      Schema.const('openai-whisper' as string).description('openai-whisper'),
      Schema.const('faster-whisper' as string).description('faster-whisper'),
    ]).default('openai-whisper' as string).description('模型?'),
    task: Schema.union([
      Schema.const('transcribe' as string).description('transcribe'),
      Schema.const('translate' as string).description('translate'),
    ]).default('transcribe' as string).description('翻译还是translate'),
    language: Schema.union([
      Schema.const('zh' as string).description('中文'),
      Schema.const('es' as string).description('Español'),
      Schema.const('en' as string).description('English'),
      Schema.const('hi' as string).description('हिंदी'),
      Schema.const('ar' as string).description('العربية'),
      Schema.const('bn' as string).description('বাংলা'),
      Schema.const('pt' as string).description('Português'),
      Schema.const('ru' as string).description('русский'),
      Schema.const('ja' as string).description('日本語'),
      Schema.const('pa' as string).description('ਪੰਜਾਬੀ'),
      Schema.const('de' as string).description('Deutsch'),
      Schema.const('jv' as string).description('Basa Jawa'),
      Schema.const('ko' as string).description('한국어'),
      Schema.const('te' as string).description('తెలుగు'),
      Schema.const('mr' as string).description('मराठी'),
      Schema.const('ta' as string).description('தமிழ்'),
      Schema.const('vi' as string).description('Tiếng Việt'),
      Schema.const('fr' as string).description('Français'),
      Schema.const('ur' as string).description('اردو'),
      Schema.const('it' as string).description('Italiano'),
      Schema.const('tr' as string).description('Türkçe'),
      Schema.const('th' as string).description('ภาษาไทย'),
      Schema.const('gu' as string).description('ગુજરાતી'),
      Schema.const('pl' as string).description('Polski'),
      Schema.const('uk' as string).description('Українська'),
      Schema.const('fa' as string).description('فارسی'),
      Schema.const('hu' as string).description('Magyar'),
      Schema.const('nl' as string).description('Nederlands'),
      Schema.const('my' as string).description('မြန်မာစာ'),
      Schema.const('az' as string).description('Azərbaycan'),
      Schema.const('zu' as string).description('IsiZulu'),
      Schema.const('el' as string).description('Ελληνικά'),
      Schema.const('ro' as string).description('Română'),
      Schema.const('sv' as string).description('Svenska'),
      Schema.const('ha' as string).description('Hausa'),
      Schema.const('am' as string).description('አማርኛ'),
      Schema.const('sd' as string).description('سنڌي'),
      Schema.const('yo' as string).description('Yorùbá'),
      Schema.const('si' as string).description('සිංහල'),
      Schema.const('km' as string).description('ភាសាខ្មែរ'),
      Schema.const('ne' as string).description('नेपाली'),
      Schema.const('ms' as string).description('Bahasa Melayu'),
      Schema.const('ig' as string).description('Asụsụ Igbo'),
      Schema.const('su' as string).description('Basa Sunda'),
      Schema.const('uz' as string).description('Oʻzbekcha'),
      Schema.const('bn' as string).description('বাংলা'),
      Schema.const('kk' as string).description('Қазақ тілі'),
      Schema.const('sw' as string).description('Kiswahili'),
      Schema.const('eu' as string).description('Euskara'),
      Schema.const('ceb' as string).description('Sinugbuanong Binisayâ'),
      Schema.const('ny' as string).description('Chichewa'),
      Schema.const('xh' as string).description('IsiXhosa'),
      Schema.const('sn' as string).description('ChiShona'),
      Schema.const('ht' as string).description('Kreyòl ayisyen'),
      Schema.const('qu' as string).description('Runasimi'),
      Schema.const('tg' as string).description('тоҷикӣ'),
      Schema.const('hmn' as string).description('Hmoob'),
      Schema.const('so' as string).description('Af-Soomaali'),
      Schema.const('fy' as string).description('Frysk'),
      Schema.const('mg' as string).description('Malagasy'),
      Schema.const('co' as string).description('Corsu'),
      Schema.const('tk' as string).description('Türkmen'),
      Schema.const('st' as string).description('Sesotho'),
      Schema.const('jw' as string).description('Basa Jawa'),
      Schema.const('ga' as string).description('Gaeilge'),
      Schema.const('sl' as string).description('Slovenščina'),
      Schema.const('om' as string).description('Oromoo'),
      Schema.const('mi' as string).description('Te Reo Māori'),
      Schema.const('mt' as string).description('Malti'),
      Schema.const('af' as string).description('Afrikaans'),
      Schema.const('sq' as string).description('Shqip'),
      Schema.const('hy' as string).description('Հայերեն'),
      Schema.const('eu' as string).description('Euskara'),
      Schema.const('be' as string).description('Беларуская'),
      Schema.const('bs' as string).description('Bosanski'),
      Schema.const('bg' as string).description('Български'),
      Schema.const('ca' as string).description('Català'),
      Schema.const('hr' as string).description('Hrvatski'),
      Schema.const('cs' as string).description('Čeština'),
      Schema.const('da' as string).description('Dansk'),
      Schema.const('et' as string).description('Eesti'),
      Schema.const('fo' as string).description('Føroyskt'),
      Schema.const('fi' as string).description('Suomi'),
      Schema.const('gl' as string).description('Galego'),
      Schema.const('ka' as string).description('ქართული'),
      Schema.const('el' as string).description('Ελληνικά'),
      Schema.const('he' as string).description('עברית'),
      Schema.const('is' as string).description('Íslenska'),
      Schema.const('id' as string).description('Indonesia'),
      Schema.const('ga' as string).description('Gaeilge'),
      Schema.const('lv' as string).description('Latviešu'),
      Schema.const('lt' as string).description('Lietuvių'),
      Schema.const('lb' as string).description('Lëtzebuergesch'),
      Schema.const('mk' as string).description('Македонски'),
      Schema.const('ms' as string).description('Bahasa Melayu'),
      Schema.const('mt' as string).description('Malti'),
      Schema.const('no' as string).description('Norsk'),
      Schema.const('nn' as string).description('Norsk nynorsk'),
      Schema.const('fa' as string).description('فارسی'),
      Schema.const('pl' as string).description('Polski'),
      Schema.const('pt' as string).description('Português'),
      Schema.const('ro' as string).description('Română'),
      Schema.const('sr' as string).description('Српски'),
      Schema.const('sk' as string).description('Slovenčina'),
      Schema.const('sl' as string).description('Slovenščina'),
      Schema.const('sv' as string).description('Svenska'),
      Schema.const('th' as string).description('ไทย'),
      Schema.const('tr' as string).description('Türkçe'),
      Schema.const('uk' as string).description('Українська'),
      Schema.const('vi' as string).description('Tiếng Việt'),
    ]).default('zh' as string).description('支持一百多种语言'),
    waiting: Schema.boolean().default(false).description('消息反馈，会发送思考中...'),
    recall: Schema.boolean().default(true).description('会撤回思考中'),
    recall_time: Schema.number().default(5000).description('撤回的时间'),
  })

}

export default WhisperAsr



