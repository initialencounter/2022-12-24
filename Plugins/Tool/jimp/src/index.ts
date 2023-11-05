import { Context, Schema, Service } from 'koishi'
import Jm from 'jimp'

export const name = 'jimp'


declare module 'koishi' {
  interface Context {
    jimp: Jimpp
  }
}
class Jimpp extends Service {
  FONT_SANS_8_BLACK: string;
  FONT_SANS_10_BLACK: string;
  FONT_SANS_12_BLACK: string;
  FONT_SANS_14_BLACK: string;
  FONT_SANS_16_BLACK: string;
  FONT_SANS_32_BLACK: string;
  FONT_SANS_64_BLACK: string;
  FONT_SANS_128_BLACK: string;

  FONT_SANS_8_WHITE: string;
  FONT_SANS_16_WHITE: string;
  FONT_SANS_32_WHITE: string;
  FONT_SANS_64_WHITE: string;
  FONT_SANS_128_WHITE: string;

  AUTO: -1;
  // blend modes
  BLEND_SOURCE_OVER: string;
  BLEND_DESTINATION_OVER: string;
  BLEND_MULTIPLY: string;
  BLEND_ADD: string;
  BLEND_SCREEN: string;
  BLEND_OVERLAY: string;
  BLEND_DARKEN: string;
  BLEND_LIGHTEN: string;
  BLEND_HARDLIGHT: string;
  BLEND_DIFFERENCE: string;
  BLEND_EXCLUSION: string;
  // Align modes for cover, contain, bit masks
  HORIZONTAL_ALIGN_LEFT: 1;
  HORIZONTAL_ALIGN_CENTER: 2;
  HORIZONTAL_ALIGN_RIGHT: 4;
  VERTICAL_ALIGN_TOP: 8;
  VERTICAL_ALIGN_MIDDLE: 16;
  VERTICAL_ALIGN_BOTTOM: 32;
  // Edge Handling
  EDGE_EXTEND: 1;
  EDGE_WRAP: 2;
  EDGE_CROP: 3;

  MIME_BMP: "image/bmp";
  MIME_X_MS_BMP: "image/x-ms-bmp";
  MIME_GIF: "image/gif";
  MIME_JPEG: "image/jpeg";
  MIME_PNG: "image/png";
  MIME_TIFF: "image/tiff";

  PNG_FILTER_AUTO: -1;
  PNG_FILTER_NONE: 0;
  PNG_FILTER_SUB: 1;
  PNG_FILTER_UP: 2;
  PNG_FILTER_AVERAGE: 3;
  PNG_FILTER_PATH: 4;

  RESIZE_NEAREST_NEIGHBOR: "nearestNeighbor";
  RESIZE_BILINEAR: "bilinearInterpolation";
  RESIZE_BICUBIC: "bicubicInterpolation";
  RESIZE_HERMITE: "hermiteInterpolation";
  RESIZE_BEZIER: "bezierInterpolation";

  constructor(ctx: Context) {
    super(ctx, 'jimp', true)
    this.FONT_SANS_8_BLACK = Jm.FONT_SANS_8_BLACK
    this.FONT_SANS_10_BLACK = Jm.FONT_SANS_10_BLACK
    this.FONT_SANS_12_BLACK = Jm.FONT_SANS_12_BLACK
    this.FONT_SANS_14_BLACK = Jm.FONT_SANS_14_BLACK
    this.FONT_SANS_16_BLACK = Jm.FONT_SANS_16_BLACK
    this.FONT_SANS_32_BLACK = Jm.FONT_SANS_32_BLACK
    this.FONT_SANS_128_BLACK = Jm.FONT_SANS_128_BLACK

    this.FONT_SANS_8_WHITE = Jm.FONT_SANS_8_WHITE
    this.FONT_SANS_16_WHITE = Jm.FONT_SANS_16_WHITE
    this.FONT_SANS_32_WHITE = Jm.FONT_SANS_32_WHITE
    this.FONT_SANS_64_WHITE = Jm.FONT_SANS_64_WHITE
    this.FONT_SANS_128_WHITE = Jm.FONT_SANS_128_WHITE

    this.AUTO = Jm.AUTO
    this.BLEND_SOURCE_OVER = Jm.BLEND_SOURCE_OVER
    this.BLEND_DESTINATION_OVER = Jm.BLEND_DESTINATION_OVER
    this.BLEND_MULTIPLY = Jm.BLEND_MULTIPLY
    this.BLEND_ADD = Jm.BLEND_ADD
    this.BLEND_SCREEN = Jm.BLEND_SCREEN
    this.BLEND_OVERLAY = Jm.BLEND_OVERLAY
    this.BLEND_DARKEN = Jm.BLEND_DARKEN
    this.BLEND_LIGHTEN = Jm.BLEND_LIGHTEN
    this.BLEND_HARDLIGHT = Jm.BLEND_HARDLIGHT
    this.BLEND_DIFFERENCE = Jm.BLEND_DIFFERENCE
    this.BLEND_EXCLUSION = Jm.BLEND_EXCLUSION
    this.HORIZONTAL_ALIGN_LEFT = Jm.HORIZONTAL_ALIGN_LEFT
    this.HORIZONTAL_ALIGN_CENTER = Jm.HORIZONTAL_ALIGN_CENTER
    this.HORIZONTAL_ALIGN_RIGHT = Jm.HORIZONTAL_ALIGN_RIGHT
    this.VERTICAL_ALIGN_TOP = Jm.VERTICAL_ALIGN_TOP
    this.VERTICAL_ALIGN_MIDDLE = Jm.VERTICAL_ALIGN_MIDDLE
    this.VERTICAL_ALIGN_BOTTOM = Jm.VERTICAL_ALIGN_BOTTOM

    this.EDGE_EXTEND = Jm.EDGE_EXTEND
    this.EDGE_WRAP = Jm.EDGE_WRAP
    this.EDGE_CROP = Jm.EDGE_CROP

    this.MIME_BMP = Jm.MIME_BMP
    this.MIME_X_MS_BMP = Jm.MIME_X_MS_BMP
    this.MIME_GIF = Jm.MIME_GIF
    this.MIME_JPEG = Jm.MIME_JPEG
    this.MIME_PNG = Jm.MIME_PNG
    this.MIME_TIFF = Jm.MIME_TIFF

    this.PNG_FILTER_AUTO = Jm.PNG_FILTER_AUTO
    this.PNG_FILTER_AVERAGE = Jm.PNG_FILTER_AVERAGE
    this.PNG_FILTER_NONE = Jm.PNG_FILTER_NONE
    this.PNG_FILTER_PATH = Jm.PNG_FILTER_PATH
    this.PNG_FILTER_SUB = Jm.PNG_FILTER_SUB
    this.PNG_FILTER_UP = Jm.PNG_FILTER_UP

    this.RESIZE_NEAREST_NEIGHBOR = Jm.RESIZE_NEAREST_NEIGHBOR
    this.RESIZE_BILINEAR = Jm.RESIZE_BILINEAR
    this.RESIZE_BICUBIC = Jm.RESIZE_BICUBIC
    this.RESIZE_HERMITE = Jm.RESIZE_HERMITE
    this.RESIZE_BEZIER = Jm.RESIZE_BEZIER
  }
  test() {
    return 'test'
  }
  /**
   * 读取图片
   * @param path 路径
   */
  async read(path: string, cb?: (err, img: Jm) => void): Promise<Jm> {
    if (cb) {
      await Jm.read(path, cb)
    }
    return await Jm.read(path)
  }
  /**
   * 调整图片大小
   * @param jm 
   * @param w 
   * @param h 
   * @param cb 
   * @returns 
   */
  resize(jm: Jm, w: number, h: number, cb?: (err, img: Jm) => void): Jm {
    if (cb) {
      return jm.resize(w, h, cb)
    }
    return jm.resize(w, h)
  }
  /**
   * 裁剪图片
   * @param jm 
   */
  crop(jm: Jm, x: number, y: number, w: number, h: number, cb?: (err, img: Jm) => void): Jm {
    if (cb) {
      return jm.crop(x, y, w, h, cb)
    }
    return jm.crop(x, y, w, h)
  }
  /**
   * 旋转图片
   * @param jm 
   * @param deg 
   * @param callback 
   * @returns 
   */
  rotate(jm: Jm, deg: number, cb?: (err, img: Jm) => void): Jm {
    if (cb) {
      jm.rotate(deg, cb)
    }
    return jm.rotate(deg)
  }
  /**
   * 
   * @param jm Jimp对象
   * @param path 保存的路径
   * @returns 
   */
  async writeAsync(jm: Jm, path: string): Promise<Jm> {
    return await jm.writeAsync(path)
  }
  async loadFont(file: string) {
    return await Jm.loadFont(file)
  }
}
namespace Jimpp {
  export interface Config { }

  export const Config: Schema<Config> = Schema.object({})
}

export default Jimpp