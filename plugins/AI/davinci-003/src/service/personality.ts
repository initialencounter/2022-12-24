import { Context, Dict, Logger, Service } from 'koishi'
import fs from 'fs'
import { Msg } from '../types/message'

const logger = new Logger('davinci-003')

declare module 'koishi' {
  interface Context {
    dvcPersonality: DvcPersonality
  }
}

const PERSONALITY_PATH = './personality.json'

class DvcPersonality extends Service {
  /** 人格数据：昵称 -> 消息列表 */
  personalities: Dict<Msg[]>

  constructor(ctx: Context) {
    super(ctx, 'dvcPersonality', true)
    try {
      this.personalities = JSON.parse(
        fs.readFileSync(PERSONALITY_PATH, 'utf-8'),
      )
    } catch (e) {
      this.personalities = {
        预设人格: [{ role: 'system', content: '你是我的全能AI助理' }],
      }
      this.save()
    }
  }

  /** 所有人格昵称（原 sessions_cmd） */
  get names(): string[] {
    return Object.keys(this.personalities)
  }

  /** 默认人格的消息列表（原 session_config） */
  getDefault(): Msg[] {
    return Object.values(this.personalities)[0]
  }

  get(name: string): Msg[] | undefined {
    return this.personalities[name]
  }

  has(name: string): boolean {
    return name in this.personalities
  }

  add(name: string, personality: Msg[]) {
    this.personalities[name] = personality
    this.save()
  }

  /** 删除人格，返回是否成功（最后一个人格不可删除） */
  remove(names: string[]): boolean {
    if (this.names.length <= 1) return false
    for (const name of names) {
      delete this.personalities[name]
    }
    this.save()
    return true
  }

  /** 从远程拉取预设人格 */
  async fetchRemotePresets(): Promise<Dict<Msg[]>> {
    const prompts_latest = await this.ctx.http.get(
      'https://gitee.com/initencunter/ChatPrompts/raw/master/safe',
      {
        responseType: 'text',
      },
    )
    return JSON.parse(
      Buffer.from(prompts_latest, 'base64').toString('utf-8'),
    )
  }

  /** 合并远程预设 */
  mergePresets(presets: Dict<Msg[]>) {
    for (const key of Object.keys(presets)) {
      this.personalities[key] = presets[key]
    }
    this.save()
    logger.info('更新预设成功')
  }

  /** 覆盖全部人格 */
  displacePresets(presets: Dict<Msg[]>) {
    this.personalities = presets
    this.save()
    logger.info('更新预设成功')
  }

  save() {
    fs.writeFileSync(
      PERSONALITY_PATH,
      JSON.stringify(this.personalities, null, 2),
    )
  }
}

export default DvcPersonality
