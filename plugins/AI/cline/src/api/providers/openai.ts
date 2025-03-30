import type { Anthropic } from "@anthropic-ai/sdk"
import { ApiHandlerOptions, ModelInfo, openAiModelInfoSaneDefaults } from "../../shared/api"
import { Context, HTTP } from "koishi"

export class OpenAiCaller {
  private pluginConfig: ApiHandlerOptions
  private http: Context["http"]
  constructor(ctx: Context, pluginConfig: ApiHandlerOptions) {
    this.pluginConfig = pluginConfig
    this.http = ctx.http.extend({
      baseURL: pluginConfig.openAiBaseUrl,
      headers: {
        Authorization: `Bearer ${pluginConfig.openAiApiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 0,
    })
  }

  async chat(message: Anthropic.Messages.MessageParam[]): Promise<string> {
    const config: HTTP.RequestConfig = {
      responseType: "stream",
      keepAlive: true,
      data: {
        stream: true,
        model: this.pluginConfig.apiModelId,
        messages: message,
      },
    };
    let data: ReadableStream;
    try {
      data = (await this.http<ReadableStream>("POST", '/v1/chat/completions', config)).data;
      let { contents, reasoning_content } = await this.readableStreamDecoder(data);
      reasoning_content = `<think>\n${reasoning_content.trim()}\n</think>\n\n`;
      contents = contents.replace(/<think>[\s\S]*?<\/think>/g, '')
      return contents.trim();
    } catch (e) {
      if (String(e).includes("Bad Request")) {
        console.dir(config.data.messages);
        return "Bad Request";
      }
      return "";
    }
  }

  async readableStreamDecoder(data: ReadableStream): Promise<{
    contents: string;
    reasoning_content: string;
  }> {
    const reader = data.getReader();
    const decoder = new TextDecoder("utf-8");
    let sses = "",
      contents = "",
      reasoning_content = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      const newString = decoder.decode(value, { stream: true });
      if (newString.startsWith("data:")) {
        try {
          for (let sse of sses.split("\n")) {
            let jsonStr = sse.slice(5).trim();
            if (!jsonStr) continue;
            const json = JSON.parse(jsonStr);
            const content = json?.choices?.[0]?.delta?.content;
            const reasoning = json?.choices?.[0]?.delta?.reasoning_content;
            if (reasoning) reasoning_content += reasoning;
            if (content) contents += content;
          }
          sses = newString;
        } catch (e) {
          sses += newString;
        }
      } else {
        sses += newString;
      }
    }
    return {
      contents,
      reasoning_content,
    };
  }

  getModel(): { id: string; info: ModelInfo } {
    return {
      id: this.pluginConfig.openAiModelId ?? "",
      info: this.pluginConfig.openAiModelInfo ?? openAiModelInfoSaneDefaults,
    }
  }
}
