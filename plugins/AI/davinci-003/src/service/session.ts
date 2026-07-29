import { Context, Dict, Service } from 'koishi'
import { Msg } from '../types/message'
import { } from './personality'

declare module 'koishi' {
  interface Context {
    dvcSession: DvcSession
  }
}

/** 单一上下文模式下使用的固定会话 ID */
export const SHARED_SESSION_ID =
  'e2b5e6a3b58f06b914e5ede4d5737afb93afd0cc03f25d66e778bb733e589228'

class DvcSession extends Service {
  static inject = ['dvcPersonality']

  /** 会话上下文：sessionId -> 消息列表 */
  sessions: Dict<Msg[]> = {}

  constructor(ctx: Context) {
    super(ctx, 'dvcSession', true)
  }

  /**
   * 获取会话上下文，不存在时以默认人格初始化
   * @param sessionid 会话 ID（通常是用户 QQ 号）
   */
  getChatSession(sessionid: string): Msg[] {
    if (Object.keys(this.sessions).indexOf(sessionid) == -1)
      this.sessions[sessionid] = [...this.ctx.dvcPersonality.getDefault()]
    return this.sessions[sessionid]
  }

  /** 将会话设置为指定人格 */
  setPersonality(sessionid: string, name: string) {
    this.sessions[sessionid] = this.ctx.dvcPersonality.get(name) ?? []
  }

  /** 重置会话，保留人格（system 消息） */
  reset(sessionid: string) {
    let session_json: Msg[] = this.getChatSession(sessionid)
    this.sessions[sessionid] = [
      { role: 'system', content: session_json[0].content },
    ]
  }

  /** 重置为内置默认人格 */
  resetToDefault(sessionid: string) {
    this.sessions[sessionid] = [
      { role: 'system', content: '你是我的全能AI助理' },
    ]
  }

  /** 裁剪上下文，防止超出长度限制 */
  trim(session_of_id: Msg[]) {
    while (JSON.stringify(session_of_id).length > 10000) {
      session_of_id.splice(1, 1)
      if (session_of_id.length <= 1) break
    }
  }

  /** 清空所有会话 */
  clearAll() {
    this.sessions = {}
  }
}

export default DvcSession
