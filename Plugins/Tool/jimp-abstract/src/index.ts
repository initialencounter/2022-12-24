import { Context, Service } from 'koishi'
import type Jm from 'jimp'

declare module 'koishi' {
  interface Context {
    jimp: Jimpp
  }
}

abstract class Jimpp extends Service {
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
   * 调整图片大小
   * @param jm 
   * @param w 
   * @param h 
   * @param cb 
   * @returns 
   */
  abstract resize(jm: Jm, w: number, h: number, cb?: (err, img: Jm) => void): Jm
  /**
   * 裁剪图片
   * @param jm 
   */
  abstract crop(jm: Jm, x: number, y: number, w: number, h: number, cb?: (err, img: Jm) => void): Jm
  /**
   * 旋转图片
   * @param jm 
   * @param deg 
   * @param callback 
   * @returns 
   */
  abstract rotate(jm: Jm, deg: number, cb?: (err, img: Jm) => void): Jm
  /**
   * 
   * @param jm Jimp对象
   * @param path 保存的路径
   * @returns 
   */
  abstract writeAsync(jm: Jm, path: string): Promise<Jm>
  abstract loadFont(file: string): Promise<Font>
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

export default Jimpp