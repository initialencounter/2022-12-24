import { Context, Service } from 'koishi'
import type Jm from 'jimp'

declare module 'koishi' {
  interface Context {
    jimp: Jimp
  }
}

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

abstract class Jimp extends Service {
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
  }
  /**
   * 读取图片
   * @param path 路径
   */
  abstract read(path: string, cb?: (err, img: Jm) => void): Promise<Jm>
  /**
   * 加载字体
   * @param file 字体路径
   */
  abstract loadFont(file: string): Promise<Font>
  /**
   * 
   * @param r red
   * @param g green
   * @param b blue
   * @param a alpha
   * @param cb callback function
   */
  abstract rgbaToInt(r: number, g: number, b: number, a: number): number
  /**
   * 不知道干什么的方法
   * @param name 
   * @param test 
   * @param run 
   */
  abstract appendConstructorOption(name: string, test: (...args: any[]) => boolean, run: (this: Jm, resolve: (jimp?: Jm) => any, reject: (reason: Error) => any, ...args: any[]) => any): void
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
  abstract measureTextHeight(font: Font, text: any, maxWidth: number): number
  /**
   * 
   * @param font 字体
   * @param text 文本
   * @returns 
   */
  abstract measureText(font: Font, text: any): number
  /**
   * 
   * @param n 
   * @returns 
   */
  abstract limit255(n: number): number
  /**
   * 
   * @param i 要转为RGBA的数字
   * @returns 
   */
  abstract intToRGBA(i: number): RGBA
  /**
   * 
   * @param img1 图片1
   * @param img2 
   * @returns 
   */
  abstract distance(img1: Jm, img2: Jm): number
  /**
   * 
   * @param img1 图片1
   * @param img2 
   * @param threshold 相似度，阈值
   * @returns 
   */
  abstract diff(img1: Jm, img2: Jm, threshold?: number): DiffReturn<Jm>
  /**
   * 
   * @param cssColor css格式颜色
   * @returns 
   */
  abstract cssColorToHex(cssColor: string): number
  /** 
  * @param path 路径
  * @returns 
  */
  abstract create(path: string): Promise<Jm>
  /**
   * 
   * @param hash1 
   * @param hash2 
   * @returns 
   */
  abstract compareHashes(hash1: string, hash2: string): number
  /**
   * 
   * @param rgba1 
   * @param rgba2 
   * @returns 
   */
  abstract colorDiff(rgba1: RGB, rgba2: RGB): number
}

export default Jimp