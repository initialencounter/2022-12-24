import { Context, HTTP, Logger, Service, trimSlash } from 'koishi'
import { APIConfig, BehaviorConfig } from '../types/config'
import { ChatResult, ModelUsage, Msg } from '../types/message'

const logger = new Logger('davinci-003')

declare module 'koishi' {
  interface Context {
    chatAPI: ChatAPI
  }
}

export type ChatAPIConfig = APIConfig & Pick<BehaviorConfig, 'temperature' | 'enableReasoningContent'>

class ChatAPI extends Service {
  private key_number: number = 0
  private readonly pluginConfig: ChatAPIConfig

  constructor(ctx: Context, config: ChatAPIConfig) {
    super(ctx, 'chatAPI', true)
    this.pluginConfig = config
    console.log("enableContext", this.pluginConfig)
  }

  /**
   * 带重试的聊天请求
   * @param session_of_id 发送给 chatgpt 的消息列表
   */
  async chat(session_of_id: Msg[]): Promise<ChatResult> {
    let try_times = 0
    while (try_times < this.pluginConfig.maxRetryTimes) {
      const res = await this.chat_with_gpt(session_of_id)
      if (res.output !== '') return res
      try_times++
      await this.ctx.sleep(500)
    }
    return { output: '请求错误，请查看日志', usage: {} }
  }

  /**
   * @param message 发送给chatgpt的json列表
   * @returns 将返回文字处理成json
   */
  async chat_with_gpt(message: Msg[]): Promise<ChatResult> {
    let url = trimSlash(
      `${this.pluginConfig.baseURL ?? 'https://api.openai.com'}/v1/chat/completions`,
    )
    const payload = {
      stream: true,
      model: this.pluginConfig.appointModel,
      temperature: this.pluginConfig.temperature,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      messages: message,
    }
    const config: HTTP.RequestConfig = {
      timeout: 0,
      responseType: 'stream',
      keepAlive: true,
      headers: {
        Authorization: `Bearer ${this.pluginConfig.key[this.key_number]}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      data: payload,
    }
    let data: ReadableStream
    try {
      data = (await this.ctx.http<ReadableStream>('POST', url, config)).data
      let { contents, reasoning_content, usage } =
        await this.readableStreamDecoder(data)
      reasoning_content = `<think>\n${reasoning_content.trim()}\n</think>\n\n`
      if (!this.pluginConfig.enableReasoningContent) {
        reasoning_content = ''
        contents = contents.replace(/<think>[\s\S]*?<\/think>/g, '')
      }
      return { output: `${reasoning_content}${contents.trim()}`, usage }
    } catch (e: any) {
      if (String(e).includes('Bad Request')) {
        console.dir(config.data.messages)
        return { output: 'Bad Request', usage: {} }
      }
      this.switch_key(e)
      return { output: '', usage: {} }
    }
  }

  async readableStreamDecoder(data: ReadableStream): Promise<{
    contents: string
    reasoning_content: string
    usage: ModelUsage
  }> {
    const reader = data.getReader()
    const decoder = new TextDecoder('utf-8')
    let sses = '',
      contents = '',
      reasoning_content = ''
    let usage: ModelUsage = {}
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      const newString = decoder.decode(value, { stream: true })
      if (newString.startsWith('data:')) {
        try {
          for (let sse of sses.split('\n')) {
            let jsonStr = sse.slice(5).trim()
            if (!jsonStr) continue
            const json = JSON.parse(jsonStr)
            const content = json?.choices?.[0]?.delta?.content
            const reasoning = json?.choices?.[0]?.delta?.reasoning_content
            usage = json?.usage
            if (reasoning) reasoning_content += reasoning
            if (content) contents += content
          }
          sses = newString
        } catch (e) {
          sses += newString
        }
      } else {
        sses += newString
      }
    }
    return {
      contents,
      reasoning_content,
      usage,
    }
  }

  /**
   * 切换下一个 key
   */
  key_number_pp() {
    this.key_number++
    // 数组越界
    if (this.key_number === this.pluginConfig.key.length) this.key_number = 0
  }

  /**
   * 当前 key 报错时切换 key
   * @param e Error
   */
  async switch_key(e: Error) {
    logger.info(
      `key${this.key_number + 1}. ${this.pluginConfig.key[
        this.key_number
      ].slice(0, 10)}*** 报错：${String(e)}`,
    )
    this.key_number_pp()
  }
}

export default ChatAPI
