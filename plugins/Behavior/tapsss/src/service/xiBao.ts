import { Context, h, Service } from "koishi";
import { XiBaoConfig } from "../types/xibao";
import { } from "@koishijs/canvas"
import { readFileSync } from 'fs'
import path from 'path'

const isDev = process.env.NODE_ENV === 'development';
const resourcesPath = isDev ? path.resolve(__dirname, '../../assets') : path.resolve(__dirname, '../assets');

const img = readFileSync(path.resolve(resourcesPath, 'xiBao.jpg'))

declare module 'koishi' {
  interface Context {
    xiBao: XiBao;
  }
}

class XiBao extends Service {
  static inject = ['canvas'];
  private readonly pluginConfig: XiBaoConfig;

  constructor(ctx: Context, config: XiBaoConfig) {
    super(ctx, 'xiBao');
    this.pluginConfig = config;
    ctx.logger('[Tapsss] xiBao').warn('XiBao 服务已启动，使用的图片资源路径:', resourcesPath);
  }


  async render(text: string) {
    const config = this.pluginConfig;
    return await this.canvas({
      text,
      fontFamily: config.xiBao.fontFamily,
      fontColor: '#ff0a0a',
      strokeColor: '#ffde00',
      maxFontSize: config.xiBao.maxFontSize / 2,
      minFontSize: config.xiBao.minFontSize,
      offsetWidth: config.xiBao.offsetWidth,
      img,
    })
  }

  async canvas(params: {
    text: string,
    fontFamily: string,
    fontColor: string,
    strokeColor: string,
    maxFontSize: number,
    minFontSize: number,
    offsetWidth: number,
    img: Buffer,
  }): Promise<h> {
    const bgImage = await this.ctx.canvas.loadImage(params.img)

    // 使用图片的实际尺寸创建canvas
    const canvas = await this.ctx.canvas.createCanvas(bgImage.naturalWidth || 1024, bgImage.naturalHeight || 768)
    const ctx = canvas.getContext('2d')

    ctx.drawImage(bgImage, 0, 0)

    // 绘制文本
    //@ts-ignore
    this.drawText(ctx, params)

    return h.image(await canvas.toBuffer('image/png'), 'image/png')
  }

  private drawText(ctx: CanvasRenderingContext2D, params: {
    text: string,
    fontFamily: string,
    fontColor: string,
    strokeColor: string,
    maxFontSize: number,
    minFontSize: number,
    offsetWidth: number
  }) {
    const lines = params.text.split('\n')
    let fontSize = params.maxFontSize

    // 设置字体样式
    ctx.textAlign = 'center'
    ctx.font = `600 ${fontSize}px ${params.fontFamily}`

    // 自适应字体大小
    while (fontSize > params.minFontSize) {
      const maxLineWidth = Math.max(...lines.map(line => ctx.measureText(line).width))
      if (maxLineWidth <= params.offsetWidth) {
        break
      }
      fontSize--
      ctx.font = `600 ${fontSize}px ${params.fontFamily}`
    }

    // 计算文本总高度
    const lineHeight = fontSize * 1.2
    const totalHeight = lines.length * lineHeight
    const startY = (ctx.canvas.height - totalHeight) / 2 + lineHeight / 2

    // 绘制每行文本
    lines.forEach((line, index) => {
      const y = startY + index * lineHeight
      const x = ctx.canvas.width / 2

      // 绘制描边
      ctx.strokeStyle = params.strokeColor
      ctx.lineWidth = 2.5
      ctx.strokeText(line, x, y)

      // 绘制填充文本
      ctx.fillStyle = params.fontColor
      ctx.fillText(line, x, y)
    })
  }

}


export default XiBao;
