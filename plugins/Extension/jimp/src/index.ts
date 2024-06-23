import { Context, Schema } from 'koishi'
import Jimpp from 'jimp'
import Jm from '@initencounter/jimp';
import { resolve } from 'path';
import { readFileSync } from 'fs';
export const name = 'jimp'
class Jimp extends Jm {
  constructor(ctx: Context) {
    super(ctx)
    this.FONT_SANS_8_BLACK = Jimpp.FONT_SANS_8_BLACK
    this.FONT_SANS_10_BLACK = Jimpp.FONT_SANS_10_BLACK
    this.FONT_SANS_12_BLACK = Jimpp.FONT_SANS_12_BLACK
    this.FONT_SANS_14_BLACK = Jimpp.FONT_SANS_14_BLACK
    this.FONT_SANS_16_BLACK = Jimpp.FONT_SANS_16_BLACK
    this.FONT_SANS_32_BLACK = Jimpp.FONT_SANS_32_BLACK
    this.FONT_SANS_128_BLACK = Jimpp.FONT_SANS_128_BLACK

    this.FONT_SANS_8_WHITE = Jimpp.FONT_SANS_8_WHITE
    this.FONT_SANS_16_WHITE = Jimpp.FONT_SANS_16_WHITE
    this.FONT_SANS_32_WHITE = Jimpp.FONT_SANS_32_WHITE
    this.FONT_SANS_64_WHITE = Jimpp.FONT_SANS_64_WHITE
    this.FONT_SANS_128_WHITE = Jimpp.FONT_SANS_128_WHITE

    this.AUTO = Jimpp.AUTO
    this.BLEND_SOURCE_OVER = Jimpp.BLEND_SOURCE_OVER
    this.BLEND_DESTINATION_OVER = Jimpp.BLEND_DESTINATION_OVER
    this.BLEND_MULTIPLY = Jimpp.BLEND_MULTIPLY
    this.BLEND_ADD = Jimpp.BLEND_ADD
    this.BLEND_SCREEN = Jimpp.BLEND_SCREEN
    this.BLEND_OVERLAY = Jimpp.BLEND_OVERLAY
    this.BLEND_DARKEN = Jimpp.BLEND_DARKEN
    this.BLEND_LIGHTEN = Jimpp.BLEND_LIGHTEN
    this.BLEND_HARDLIGHT = Jimpp.BLEND_HARDLIGHT
    this.BLEND_DIFFERENCE = Jimpp.BLEND_DIFFERENCE
    this.BLEND_EXCLUSION = Jimpp.BLEND_EXCLUSION
    this.HORIZONTAL_ALIGN_LEFT = Jimpp.HORIZONTAL_ALIGN_LEFT
    this.HORIZONTAL_ALIGN_CENTER = Jimpp.HORIZONTAL_ALIGN_CENTER
    this.HORIZONTAL_ALIGN_RIGHT = Jimpp.HORIZONTAL_ALIGN_RIGHT
    this.VERTICAL_ALIGN_TOP = Jimpp.VERTICAL_ALIGN_TOP
    this.VERTICAL_ALIGN_MIDDLE = Jimpp.VERTICAL_ALIGN_MIDDLE
    this.VERTICAL_ALIGN_BOTTOM = Jimpp.VERTICAL_ALIGN_BOTTOM

    this.EDGE_EXTEND = Jimpp.EDGE_EXTEND
    this.EDGE_WRAP = Jimpp.EDGE_WRAP
    this.EDGE_CROP = Jimpp.EDGE_CROP

    this.MIME_BMP = Jimpp.MIME_BMP
    this.MIME_X_MS_BMP = Jimpp.MIME_X_MS_BMP
    this.MIME_GIF = Jimpp.MIME_GIF
    this.MIME_JPEG = Jimpp.MIME_JPEG
    this.MIME_PNG = Jimpp.MIME_PNG
    this.MIME_TIFF = Jimpp.MIME_TIFF

    this.PNG_FILTER_AUTO = Jimpp.PNG_FILTER_AUTO
    this.PNG_FILTER_AVERAGE = Jimpp.PNG_FILTER_AVERAGE
    this.PNG_FILTER_NONE = Jimpp.PNG_FILTER_NONE
    this.PNG_FILTER_PATH = Jimpp.PNG_FILTER_PATH
    this.PNG_FILTER_SUB = Jimpp.PNG_FILTER_SUB
    this.PNG_FILTER_UP = Jimpp.PNG_FILTER_UP

    this.RESIZE_NEAREST_NEIGHBOR = Jimpp.RESIZE_NEAREST_NEIGHBOR
    this.RESIZE_BILINEAR = Jimpp.RESIZE_BILINEAR
    this.RESIZE_BICUBIC = Jimpp.RESIZE_BICUBIC
    this.RESIZE_HERMITE = Jimpp.RESIZE_HERMITE
    this.RESIZE_BEZIER = Jimpp.RESIZE_BEZIER
    // 中文字体
    this.PingFang_24_BLACK = resolve(__dirname, 'PingFang_24_BLACK_CHINESE3500/PingFang_24_BLACK.fnt')
  }
  /**
   * 实例化 Jimp
   * @param args 
   * @returns Jimp
   */
  newJimp(...args: any[]): Jimpp {
    return new Jimpp(...args)
  }
  /**
   * 读取图片
   * @param path 路径
   */
  read(path: string, cb?: (err: Error | null, img?: Jimpp) => void): Promise<Jimpp>;
  read(data: Buffer, cb?: (err: Error | null, img?: Jimpp) => void): Promise<Jimpp>;
  read(image: Jimp, cb?: (err: Error | null, img?: Jimpp) => void): Promise<Jimpp>;
  read(width: number, height: number, background: number, cb?: (err: Error | null, img?: Jimpp) => void): Promise<Jimpp>
  async read(...args: any[]): Promise<Jimpp> {
    if (typeof args[0] === 'string') {
      const path = args[0];
      const cb = args[1];
      if (cb) {
        return await Jimpp.read(path, cb)
      }
      return await Jimpp.read(path)
    } else if (Buffer.isBuffer(args[0])) {
      const data = args[0];
      const cb = args[1];
      if (cb) {
        return await Jimpp.read(data, cb)
      }
      return await Jimpp.read(data)
    } else if (args[0] instanceof Jimpp) {
      const image = args[0];
      const cb = args[1];
      if (cb) {
        return await Jimpp.read(image, cb)
      }
      return await Jimpp.read(image)
    } else {
      const width = args[0];
      const height = args[1];
      const background = args[2];
      const cb = args[3];
      if (cb) {
        return await Jimpp.read(width, height, background, cb)
      }
      return await Jimpp.read(width, height, background)
    }
  }


  /**
   * 调整图片大小
   * @param Jimpp 
   * @param w 
   * @param h 
   * @param cb 
   * @returns 
   */
  resize(Jimpp: Jimpp, w: number, h: number, cb?: (err, img: Jimpp) => void): Jimpp {
    if (cb) {
      return Jimpp.resize(w, h, cb)
    }
    return Jimpp.resize(w, h)
  }
  /**
   * 裁剪图片
   * @param Jimpp 
   */
  crop(Jimpp: Jimpp, x: number, y: number, w: number, h: number, cb?: (err, img: Jimpp) => void): Jimpp {
    if (cb) {
      return Jimpp.crop(x, y, w, h, cb)
    }
    return Jimpp.crop(x, y, w, h)
  }
  /**
   * 旋转图片
   * @param Jimpp 
   * @param deg 
   * @param callback 
   * @returns 
   */
  rotate(Jimpp: Jimpp, deg: number, cb?: (err, img: Jimpp) => void): Jimpp {
    if (cb) {
      Jimpp.rotate(deg, cb)
    }
    return Jimpp.rotate(deg)
  }
  /**
   * 
   * @param Jimpp Jimp对象
   * @param path 保存的路径
   * @returns 
   */
  async writeAsync(Jimpp: Jimpp, path: string): Promise<Jimpp> {
    return await Jimpp.writeAsync(path)
  }
  /**
   * 
   * @param file 要加载的字体路径
   * @returns 
   */
  async loadFont(file: string): Promise<Font> {
    return await Jimpp.loadFont(file)
  }
  /**
   * 
   * @param r red
   * @param g green
   * @param b blue
   * @param a alpha
   * @param cb callback function
   */
  rgbaToInt(r: number, g: number, b: number, a: number): number {
    return Jimpp.rgbaToInt(r, g, b, a)
  }
  appendConstructorOption(name: string, test: (...args: any[]) => boolean, run: (this: Jimpp, resolve: (jimp?: Jimpp) => any, reject: (reason: Error) => any, ...args: any[]) => any): void {
    return Jimpp.appendConstructorOption(name, test, run)
  }
  /**
   * 
   * @param font 
   * @param text 
   * @param maxWidth 
   * @returns 
   */
  /**
   * 
   * @param font 字体
   * @param text 文本
   * @param maxWidth 宽带
   * @returns 
   */
  measureTextHeight(font: Font, text: any, maxWidth: number): number { return Jimpp.measureTextHeight(font, text, maxWidth) }
  /**
   * 
   * @param font 字体
   * @param text 文本
   * @returns 
   */
  measureText(font: Font, text: any): number { return Jimpp.measureText(font, text) }
  /**
   * 
   * @param n 
   * @returns 
   */
  limit255(n: number): number { return Jimpp.limit255(n) }
  /**
   * 
   * @param i 要转为RGBA的数字
   * @returns 
   */
  intToRGBA(i: number): RGBA { return Jimpp.intToRGBA(i) }
  /**
   * 
   * @param img1 图片1
   * @param img2 
   * @returns 
   */
  distance(img1: Jimpp, img2: Jimpp): number { return Jimpp.distance(img1, img2) }
  /**
   * 
   * @param img1 图片1
   * @param img2 
   * @param threshold 相似度，阈值
   * @returns 
   */
  diff(img1: Jimpp, img2: Jimpp, threshold?: number): DiffReturn<Jimpp> { return Jimpp.diff(img1, img2, threshold) }
  /**
   * 
   * @param cssColor css格式颜色
   * @returns 
   */
  cssColorToHex(cssColor: string): number { return Jimpp.cssColorToHex(cssColor) }
  /**
   * 
   * @param path 路径
   * @returns 
   */
  create(path: string): Promise<Jimpp> { return Jimpp.create(path) }
  /**
   * 
   * @param hash1 
   * @param hash2 
   * @returns 
   */
  compareHashes(hash1: string, hash2: string): number { return Jimpp.compareHashes(hash1, hash2) }
  /**
   * 
   * @param rgba1 
   * @param rgba2 
   * @returns 
   */
  colorDiff(rgba1: RGB, rgba2: RGB): number { return Jimpp.colorDiff(rgba1, rgba2) }
}
namespace Jimp {
  export const usage = readFileSync(resolve(__dirname, '../readme.md')).toString('utf-8')
  export interface Config { }
  export const Config: Schema<Config> = Schema.object({})
}

export default Jimp

export interface Font {
  chars: {
    [char: string]: FontChar;
  };
  kernings: {
    [firstString: string]: {
      [secondString: string]: number;
    };
  };
  pages: string[];
  common: FontCommon;
  info: FontInfo;
}
export interface FontChar {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  xoffset: number;
  yoffset: number;
  xadvance: number;
  page: number;
  chnl: number;
}
export interface FontInfo {
  face: string;
  size: number;
  bold: number;
  italic: number;
  charset: string;
  unicode: number;
  stretchH: number;
  smooth: number;
  aa: number;
  padding: [number, number, number, number];
  spacing: [number, number];
}

export interface FontCommon {
  lineHeight: number;
  base: number;
  scaleW: number;
  scaleH: number;
  pages: number;
  packed: number;
  alphaChnl: number;
  redChnl: number;
  greenChnl: number;
  blueChnl: number;
}
export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}
interface DiffReturn<This> {
  percent: number;
  image: This;
}
export interface RGB {
  r: number;
  g: number;
  b: number;
}