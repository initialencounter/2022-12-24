import { Context, Logger } from "koishi";

import Translator from "@koishijs/translator";

export const name = "open-translate";

export const usage = "免费的翻译服务，支持中英互译。";
const logger = new Logger(name)
class OpenTranslator extends Translator {
  constructor(ctx: Context, config: Translator.Config) {
    super(ctx, config)
    ctx.command('translate <text:text>')
      .userFields(['locale'])
      .channelFields(['locale'])
      .option('form', '-f <lang>')
      .option('to', '-l <lang>')
      .action(async ({ options, session }, input) => {
        if (!input) return session.text('.expect-input')
        const source = options.form
        const target = options.to
        const result: Translator.Result = { input, source, target, detail: true }
        result.output = await this.translate(result)
        return session.text('.output', result)
      })
  }
  static usage = `免费的翻译服务`;
  async translate(options: Translator.Result): Promise<string> {
    const data: OpenTranslator.Request = {
      text: encodeURIComponent(options.input), // 待翻译的文本
      from: encodeURIComponent(options.source || "Chinese"), // 源语言，默认为中文
      to: encodeURIComponent(options.target || "English"), // 目标语言，默认为英文
    };
    try {
      const resp = await this.ctx.http.get(
        `https://api.translate.t4wefan.pub/translate?text=${data.text}&from=${data.from}&to=${data.to}`,
      );
      return resp;
    }
    catch (e) {
      logger.error(String(e))
    }
  }
}
namespace OpenTranslator {
  export interface Request {
    text: string
    from: string
    to: string
  }
}
export default OpenTranslator; // 导出 OpenTranslator 翻译器类