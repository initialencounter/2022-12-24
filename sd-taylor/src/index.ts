import { Context, Schema, Session, segment, Dict, Logger, h, trimSlash } from 'koishi'
import { } from 'koishi-plugin-davinci-003'
export const using = ['dvc']
export const name = 'sd-taylor'

const headers: object = {
  "headers": { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64); AppleWebKit/537.36 (KHTML, like Gecko); Chrome/54.0.2840.99 Safari/537.36" }
}
const logger = new Logger(name)

class Taylor {
  task: number
  output: string
  info: string
  constructor(private ctx: Context, private config: Taylor.Config) {
    this.task = 0
    this.output = config.output
    ctx.i18n.define('zh', require('./locales/zh'));
    ctx.command('tl <prompt:text>', 'Stable Diffusion API /txt2img', { authority: config.min_auth })
      .alias('taylor')
      .option('step', '--st <step:number>', { fallback: config.step })
      .option('denoising_strength', '-d <denoising_strength:number>', { fallback: config.denoising_strength })
      .option('seed', '--sd <seed:number>', { fallback: config.seed })
      .option('negative_prompt', '-n <negative_prompt:string>', { fallback: config.negative_prompt })
      .option('resolution', '-r <resolution:string>', { fallback: config.resolution })
      .option('cfg_scale', '-c <cfg_scale:number>', { fallback: config.cfg_scale })
      .option('output', '-o <output:string>', { fallback: config.output })
      .action(async ({ session, options }, prompt) => {
        prompt = await this.replace_lora(session, prompt)
        if (!prompt) return this.info
        const [width, height] = (options.resolution ? options.resolution : this.config.resolution).split('x').map(x => { return parseInt(x) })
        const payload: Taylor.Payload = {
          "steps": options.step ? options.step : config.step,
          "width": width,
          "height": height,
          "seed": options.seed ? options.seed : config.seed,
          "cfg_scale": options.cfg_scale ? options.cfg_scale : config.cfg_scale,
          "negative_prompt": options.negative_prompt ? options.negative_prompt : config.negative_prompt,
          "denoising_strength": options.denoising_strength ? options.denoising_strength : config.denoising_strength,
          "prompt": prompt + ', ' + config.defaut_prompt
        }
        if (['minimal', 'default', 'verbose'].includes(options.output)) {
          this.output = options.output ? options.output : this.output
        }
        return await this.txt2img(session, payload)
      })

    ctx.command('tl.txt', 'sd识图', { authority: config.min_auth })
      .option('model', '-m <model:string>', { fallback: config.model })
      .option('output', '-o <output:string>', { type: ['minimal', 'default', 'verbose'], fallback: config.output })
      .action(async ({ session, options }) => {
        this.output = options.output
        return h('quote', { id: session.messageId }) + await this.interrogate(session)
      })
    ctx.command('tl.img <prompt:text>', '以图绘图', { authority: config.min_auth })
      .option('step', '--st <step:number>', { fallback: config.step })
      .option('denoising_strength', '-d <denoising_strength:number>', { fallback: config.denoising_strength })
      .option('seed', '--sd <seed:number>', { fallback: config.seed })
      .option('negative_prompt', '-n <negative_prompt:string>', { fallback: config.negative_prompt })
      .option('resolution', '-r <resolution:string>', { fallback: config.resolution })
      .option('cfg_scale', '-c <cfg_scale:number>', { fallback: config.cfg_scale })
      .option('crop', '-C, --no-crop', { value: false, fallback: true })
      .option('upscaler', '-1 <upscaler>', { fallback: 'None' })
      .option('upscaler2', '-2 <upscaler2>', { fallback: 'None' })
      .option('visibility', '-v <visibility:number>', { fallback: 1 })
      .option('upscaleFirst', '-f', { fallback: false })
      .option('output', '-o <output:string>', { fallback: config.output })
      .action(async ({ session, options }, prompt) => {
        prompt = await this.replace_lora(session, prompt)
        if (!prompt) return this.info
        const [width, height] = (options.resolution ? options.resolution : this.config.resolution).split('x').map(x => { return parseInt(x) })
        const payload: Taylor.Payload = {
          "steps": options.step,
          "width": width,
          "height": height,
          "seed": options.seed,
          "cfg_scale": options.cfg_scale,
          "negative_prompt": options.negative_prompt,
          "denoising_strength": options.denoising_strength,
          "prompt": prompt + ', ' + config.defaut_prompt
        }
        if (['minimal', 'default', 'verbose'].includes(options.output)) {
          this.output = options.output ? options.output : this.output
        }
        return await this.img2img(session, payload)
      })
    ctx.command('tl.ext <prompt:text>', '图片超分辨率', { authority: config.min_auth })
      .option('step', '--st <step:number>', { fallback: config.step })
      .option('denoising_strength', '-d <denoising_strength:number>', { fallback: config.denoising_strength })
      .option('seed', '--sd <seed:number>', { fallback: config.seed })
      .option('negative_prompt', '-n <negative_prompt:string>', { fallback: config.negative_prompt })
      .option('resolution', '-r <resolution:string>', { fallback: config.resolution })
      .option('cfg_scale', '-c <cfg_scale:number>', { fallback: config.cfg_scale })
      .option('crop', '-C, --no-crop', { value: false, fallback: true })
      .option('upscaler', '-1 <upscaler>', { fallback: 'None' })
      .option('upscaler2', '-2 <upscaler2>', { fallback: 'None' })
      .option('visibility', '-v <visibility:number>', { fallback: 1 })
      .option('upscaleFirst', '-f', { fallback: false })
      .action(async ({ session, options }, prompt) => {
        prompt = await this.replace_lora(session, prompt)
        if (!prompt) return this.info
        const [width, height] = (options.resolution ? options.resolution : this.config.resolution).split('x').map(x => { return parseInt(x) })
        const payload: Taylor.Payload = {
          "steps": options.step,
          "width": width,
          "height": height,
          "seed": options.seed,
          "cfg_scale": options.cfg_scale,
          "negative_prompt": options.negative_prompt,
          "denoising_strength": options.denoising_strength,
          "prompt": prompt + ', ' + config.defaut_prompt
        }
        return await this.extras(session, payload, options)

      })
    // 抄袭自https://github.com/MirrorCY/sd-switch
    ctx.command('tl.switch', '切换模型，抄袭自https://github.com/MirrorCY/sd-switch')
      .alias('切换模型')
      .action(async ({ session }) => {
        const model: string = await this.switch_model_menu(session)
        session.send(session.text('commands.tl.messages.switching', [model]))
        if (model) {
          await this.ctx.http.axios(config.api_path + '/sdapi/v1/options', {
            method: 'POST',
            data: {
              sd_model_checkpoint: model
            }
          })
          const model_now = (await this.ctx.http.axios(trimSlash(this.config.api_path) + '/sdapi/v1/options')).data
          return session.text('commands.tl.messages.switch-success', [model_now.sd_model_checkpoint])
        } else {
          return this.info
        }

      })
    ctx.command('tl.lora', '查看lora').alias('lora')
      .action(async () => {
        return (await this.get_lora()).join('\n')
      })

  }
  async get_lora(): Promise<string[]> {
    const config:Dict = (await this.ctx.http.get(trimSlash(this.config.api_path) + '/config',{ responseType: 'json' }))
    const lora_arr = ['当前存在lora:']
    config.components.forEach((i) => {
      if (i.props.label == 'Lora' && i.props.show_label == true) {
        i?.props?.choices.forEach((j: string) => lora_arr.push(j))
        return lora_arr
      }
    })
    return lora_arr
  }
  async switch_model_menu(session: Session): Promise<string> {
    const type_arr: string[] = []
    let type_str: string = '\n请输入编号:\n'
    const model_now = (await this.ctx.http.axios(trimSlash(this.config.api_path) + '/sdapi/v1/options')).data.sd_model_checkpoint
    const res = await this.ctx.http.get(trimSlash(this.config.api_path) + '/sdapi/v1/sd-models')
    res.forEach((i, id) => {
      type_str += String(id + 1) + ' ' + i.model_name + '\n'
      type_arr.push(i.title)
    })

    session.send(h('quote', { id: session.messageId }) + session.text('commands.tl.messages.switch-output', [model_now]) + type_str)
    const input = await session.prompt()
    if (!input || Number.isNaN(+input)) {
      this.info = session.text('commands.tl.messages.menu-err')
      return ''
    }
    const index: number = parseInt(input) - 1
    if (0 > index && index > type_arr.length - 1) {
      this.info = session.text('commands.tl.messages.menu-err')
      return ''
    }
    return type_arr[index]
  }
  async replace_lora(session: Session, s: string): Promise<string> {
    if (!s.trim()) {
      await session.execute('help tl')
      return ''
    }
    if ((!this.ctx.dvc && this.config.gpt_translate) || (!this.ctx.dvc && this.config.gpt_turbo)) {
      this.info = session.text('commands.tl.messages.no-dvc')
      return ''
    }
    while (s.indexOf('&lt;') > -1) {
      s = s.replace('&lt;', '<')
    }
    while (s.indexOf('&gt;') > -1) {
      s = s.replace('&gt;', '>')
    }
    while (s.indexOf('，') > -1) {
      s = s.replace('，', ',')
    }
    while (s.indexOf('  ') > -1) {
      s = s.replace('  ', ' ')
    }
    // lora 检测
    const reg = /<[^>]*>/g;
    const matches = s.match(reg);
    let cleanedMatches: string[] = []
    if (matches) {
      cleanedMatches = matches.map(match => match.slice(0, match.length));
      s = s.replace(reg, "");
    }

    // 翻译
    if (this.isChinese(s) && this.config.gpt_translate) {
      s = await this.ctx.dvc.translate(session, '英语', s)
    }
    // GPT增强
    if (this.config.gpt_turbo) {
      s = await this.ctx.dvc.chat_with_gpt([{
        role: 'system',
        content: `用尽可能多的英文标签详细的描述一幅画面，
        用碎片化的单词标签而不是句子去描述这幅画，描述词尽量丰富，
        每个单词之间用逗号分隔，例如在描述白发猫娘的时候，
        你应该用: "white hair"、 "cat girl"、 "cat ears"、 "cute 
        girl"、 "beautiful"、"lovely"等英文标签词汇。你现在要描述的是:${s}`
      }])
    }
    return cleanedMatches.join(' ') + s
  }
  async txt2img(session: Session, payload: Taylor.Payload) {
    this.task += 1
    const path: string = this.config.controlnet ? '/controlnet/txt2img' : '/sdapi/v1/txt2img'
    session.send(session.text('commands.tl.messages.waiting'))
    const api: string = `${trimSlash(this.config.api_path)}${path}`
    logger.info((session.author?.nickname || session.username) + ' : ' + payload.prompt)
    try {
      const resp = await this.ctx.http.post(api, payload, headers)
      const res_img: string = "data:image/png;base64," + (resp.output ? resp.output[0] : resp.images[0])
      this.cleanUp()
      const parms: Taylor.Parameters = resp['parameters']

      return this.getContent(session, parms, res_img)
    }
    catch (err) {
      logger.warn(err)
      this.cleanUp()
      return String(err)
    }
  }
  async img2img(session: Session, payload: Taylor.Payload) {
    this.task += 1
    const path: string = this.config.controlnet ? '/controlnet/img2img' : '/sdapi/v1/img2img'
    const api: string = `${trimSlash(this.config.api_path)}${path}`

    const image = segment.select(session.content, "image")[0];
    const img_url: string = image?.attrs?.url
    logger.info((session.author?.nickname || session.username) + ' : ' + payload.prompt)
    logger.info(img_url)
    session.send(session.text('commands.tl.messages.waiting'))
    const base64: string = await this.img2base64(this.ctx, img_url)
    // 设置payload
    payload["init_images"] = ["data:image/png;base64," + base64]
    try {
      const resp = await this.ctx.http.post(api, payload, headers)
      const res_img: string = "data:image/png;base64," + (resp.output ? resp.output[0] : resp.images[0])
      this.cleanUp()
      const parms: Taylor.Parameters = resp['parameters']
      return this.getContent(session, parms, res_img)
    }
    catch (err) {
      logger.warn(err)
      this.cleanUp()
      return String(err)
    }
  }

  async interrogate(session: Session) {
    this.task += 1
    await session.send(session.text('commands.tl.messages.interrogate'))
    const path: string = '/sdapi/v1/interrogate'
    const image = segment.select(session.content, "image")[0];
    const img_url: string = image?.attrs?.url
    logger.info((session.author?.nickname || session.username) + ' : ' + 'Interrogate')
    logger.info(img_url)
    const base64: string = await this.img2base64(this.ctx, img_url)
    try {
      const resp: string = (await this.ctx.http.post(`${trimSlash(this.config.api_path)}${path}`, { "image": "data:image/png;base64," + base64 }))
      this.cleanUp()
      return resp
    }
    catch (err) {
      logger.warn(err)
      this.cleanUp()
      return String(err)
    }
  }
  async extras(session: Session, payload: Taylor.Payload, options: any) {
    this.task += 1
    session.send(session.text('commands.tl.messages.waiting'))
    const path: string = '/sdapi/v1/extra-single-image'
    const image = segment.select(session.content, "image")[0];
    const img_url: string = image?.attrs?.url
    logger.info((session.author?.nickname || session.username) + ' : ' + 'Extras')
    logger.info(img_url)
    const base64: string = await this.img2base64(this.ctx, img_url)
    const payload_extras = {
      "image": "data:image/png;base64," + base64,
      "resize_mode": 1,
      "show_extras_results": true,
      "upscaling_resize": 2,
      "upscaling_resize_w": 1080,
      "upscaling_resize_h": 780,
      "upscaling_crop": options.crop,
      "upscaler_1": options.upscaler,
      "upscaler_2": options.upscaler2,
      "extras_upscaler_2_visibility": options.visibility,
      "upscale_first": options.upscaleFirst,

    }
    try {
      const resp = await this.ctx.http.post(`${trimSlash(this.config.api_path)}${path}`, payload_extras)
      const res_img = 'data:image/png;base64,' + resp.image
      return segment.image(res_img)
    }
    catch (err) {
      logger.warn(err)
      this.cleanUp()
      return String(err)
    }
  }
  isChinese(s: string): boolean {
    return /[\u4e00-\u9fa5]/.test(s);
  }
  findInfo(s: string, ss: string): string {
    const id1: number = s.indexOf(ss + ': ')
    const sss: string = s.slice(id1, -1)
    const id3: number = sss.indexOf(',')
    const id2: number = sss.indexOf(' ')
    const res: string = sss.slice(id2 + 1, id3)
    return res
  }
  getContent(session: Session, parms: Taylor.Parameters, image?: string) {
    if (this.output === 'minimal' && image) {
      return segment.image(image)
    }
    const attrs: Dict = {
      userId: session.userId,
      nickname: session.author?.nickname || session.username,
    }
    const parms_default = `描述词: ${parms.prompt}\n去噪强度:${parms.denoising_strength}\n种子:   ${parms.seed}\n描述词服从度:${parms.cfg_scale}\步数:   ${parms.steps}`
    const result = segment('figure')
    result.children.push(segment('message', attrs, parms_default))

    if (this.output === 'verbose') {
      result.children.push(segment('message', attrs, `info = ${JSON.stringify(parms)}`))
    }
    result.children.push(segment.image(image, attrs))

    return result
  }
  cleanUp() {
    this.task -= 1
  }
  async img2base64(ctx: Context, img_url: string) {
    const buffer = await ctx.http.get(img_url, { responseType: 'arraybuffer', headers })
    const base64 = Buffer.from(buffer).toString('base64')
    return base64
  }
}
namespace Taylor {
  export const usage = `
## 注意事项
> 
[stabe_diffusion](https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/API)绘图插件,支持controlnet,lora,AI-Tag增强
如需使用GPT翻译，请启用davinci-003插件
对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-sd-taylor 概不负责。<br>
如果有更多文本内容想要修改，可以在<a style="color:blue" href="/locales">本地化</a>中修改 zh 内容</br>
## 目录结构
### 已经做好了的
- [x] 文字绘图
- [x] 以图绘图
- [x] 图片超分辨率
- [x] 识图
- [x] 切换模型
- [x] lora查看
- [x] controlnet


### 指令如下：
| 功能 | 指令 |
|  ----  | ----  |
| 文字绘图 | tl 描述 |
| 以图绘图 | tl.img 原图 描述？ |
| 超分辨率 | tl.ext 原图 |
| 识图 | tl.txt 图片 |
| 切换模型 | tl.switch|
| lora查看 | tl.lora |


问题反馈群:399899914
`
  export interface Parameters {
    enable_hr?: boolean
    denoising_strength: number
    firstphase_width?: number
    firstphase_height?: number
    hr_scale?: number
    hr_upscaler?: any
    hr_second_pass_steps?: number
    hr_resize_x?: number
    hr_resize_y?: number
    prompt: string
    styles: any
    seed: number
    subseed: number
    subseed_strength: number
    seed_resize_from_h: number
    seed_resize_from_w: number
    sampler_name: any
    batch_size: number
    n_iter: number
    steps: number
    cfg_scale: number
    width: number
    height: number
    restore_faces: boolean
    tiling: boolean
    do_not_save_samples: boolean
    do_not_save_grid: false,
    negative_prompt: string
    eta: any
    s_churn: number
    s_tmax: any
    s_tmin: number
    s_noise: number
    override_settings: any
    override_settings_restore_afterwards: true,
    script_args: any[]
    sampler_index: string
    script_name: any
    send_images: boolean
    save_images: boolean
    alwayson_scripts: any
    //img2img
    init_images?: any
    resize_mode?: number
    image_cfg_scale?: any
    mask?: any
    mask_blur?: number
    inpainting_fill?: number
    inpaint_full_res?: true,
    inpaint_full_res_padding?: number
    inpainting_mask_invert?: number
    initial_noise_multiplier?: any
    include_init_images?: false,

    //


  }
  export interface Payload {
    steps?: number
    width?: number
    height?: number
    seed?: number
    cfg_scale?: number
    negative_prompt?: string
    denoising_strength?: number
    prompt: string
    upscaling_crop?: boolean

  }
  export interface Config {
    api_path: string
    min_auth: number
    step: number
    denoising_strength: number
    seed: number
    maxConcurrency: number
    negative_prompt: string
    defaut_prompt: string
    resolution: string
    cfg_scale: number
    output: string
    model: string
    gpt_translate: boolean
    controlnet: boolean
    latin_only: boolean
    gpt_turbo: boolean
  }
  export const Config: Schema<Config> = Schema.object({
    api_path: Schema.string().description('服务器地址').required(),
    gpt_translate: Schema.boolean().description('是否启用gpt翻译').default(true),
    gpt_turbo: Schema.boolean().description('GPT增强').default(true),
    min_auth: Schema.number().description('最低使用权限').default(1),
    step: Schema.number().default(20).description('采样步数0-100'),
    denoising_strength: Schema.number().default(0.5).description('改变强度0-1'),
    seed: Schema.number().default(-1).description('种子'),
    maxConcurrency: Schema.number().default(3).description('最大排队数'),
    negative_prompt: Schema.string().description('反向提示词').default('nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry'),
    defaut_prompt: Schema.string().default('masterpiece, best quality').description('默认提示词'),
    resolution: Schema.string().default('720x512').description('默认比例'),
    cfg_scale: Schema.number().default(15).description('相关性0-20'),
    model: Schema.string().default('clip').description('识图的模型'),
    output: Schema.union([
      Schema.const('minimal').description('只发送图片'),
      Schema.const('default').description('发送图片和关键信息'),
      Schema.const('verbose').description('发送全部信息'),
    ]).description('输出方式。').default('default'),
    controlnet: Schema.boolean().description('是否启用controlnet,需要安装controlnet拓展').default(false),
    latin_only: Schema.boolean().description('只接受英文').default(false),

  })

}


export default Taylor