import { Context, Schema, h } from 'koishi'
import Vits from '@initencounter/vits'
export const name = 'fish-speech'



export function apply(ctx: Context, config: FishSpeech.Config) {
  // 初始化，加载模型
  ctx.http.put(config.endpoint, {
    device: config.use_cuda,
    llama: {
      config_name: "text2semantic_finetune",
      checkpoint_path: config.llama_path,
      precision: "bfloat16",
      tokenizer: config.tokenizer,
      compile: true
    },
    vqgan: {
      config_name: "vqgan_pretrain",
      checkpoint_path: config.vqgan_path
    }
  })
}
class FishSpeech extends Vits{
  constructor(ctx: Context, config: FishSpeech.Config) {
    super(ctx)
    // 初始化，加载模型
    ctx.http.put(config.endpoint, {
      device: config.use_cuda,
      llama: {
        config_name: "text2semantic_finetune",
        checkpoint_path: config.llama_path,
        precision: "bfloat16",
        tokenizer: config.tokenizer,
        compile: true
      },
      vqgan: {
        config_name: "vqgan_pretrain",
        checkpoint_path: config.vqgan_path
      }
    })
  }

  /**
   * 
   * @param input 要转化的文本
   * @param speaker_id 音色id，可选
   * @returns 
   */
  async say(option: Vits.Result): Promise<h> {
    const res = await this.ctx.http.post(
      `http://${this.ctx.config.endpoint}/v1/models/default/invoke`,
      {
          "text": option.input,
          "prompt_text": null,
          "prompt_tokens": null,
          "max_new_tokens": 0,
          "top_k": null,
          "top_p": 0.5,
          "repetition_penalty": 1.5,
          "temperature": 0.7,
          "order": "zh,jp,en",
          "use_g2p": true,
          "seed": null,
          "speaker": option.speaker_id,
      }
    )
    return h.audio(res)
  }
}

namespace FishSpeech {
  export interface Config {
    endpoint: string
    llama_path: string
    vqgan_path: string
    use_cuda: boolean
    tokenizer: string
  }
  
  export const Config: Schema<Config> = Schema.object({
    endpoint: Schema.string().role("url").default("http://127.0.0.1:7860").description("fish-speech 的 API"),
    llama_path: Schema.string().default('../text2semantic-400m-v0.2-4k.pth').description("llama_path 模型路径"),
    vqgan_path: Schema.string().default('../vqgan-v1.pth').description("llama_path 模型路径"),
    use_cuda: Schema.boolean().default(true).description("使用 CUDA 加速推理"),
    tokenizer: Schema.string().default('fishaudio/speech-lm-v1').description("tokenizer"),
  })
}

export default FishSpeech