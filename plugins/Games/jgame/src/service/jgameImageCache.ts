import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { Context, Service } from "koishi";
import path, { resolve } from "path";
import { Image } from "@koishijs/canvas";
import { createHash } from "crypto";

declare module 'koishi' {
  interface Context {
    jgameImageCache: ImageCache;
  }
}

function computeMD5(str: string, salt: string = ""): string {
  if (!str) {
    return "";
  }

  try {
    const hash = createHash('md5');
    hash.update(str + salt);
    return hash.digest('hex');
  } catch (error) {
    console.error("MD5 计算失败:", error);
    return "error";
  }
}


const isDev = process.env.NODE_ENV === 'development';
const resourcesPath = isDev ? path.resolve(__dirname, '../../assets') : path.resolve(__dirname, '../assets');
const defaultImage = readFileSync(path.resolve(resourcesPath, 'Z7.png'));


class ImageCache extends Service {
  static inject = ['canvas'];
  logger = this.ctx.logger('Tapsss ImageCache');
  cacheDir: string;
  loadedDefaultImage: Image
  constructor(ctx: Context) {
    super(ctx, 'jgameImageCache');
    this.cacheDir = resolve(ctx.root.baseDir, 'data/tapsss/imageCache');
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true })
    }
    ctx.on('ready', async () => {
      this.loadedDefaultImage = await this.ctx.canvas.loadImage(defaultImage);
    });
    this.logger.warn('ImageCache 服务已启动，缓存目录:', this.cacheDir);
  }


  // 生成缓存文件名
  generateCacheFileName(url: string): string {
    const hash = computeMD5(url);
    return `${hash}.jpeg`;
  }

  // 获取缓存文件路径
  getCacheFilePath(url: string): string {
    return path.resolve(this.cacheDir, this.generateCacheFileName(url));
  }

  async fetchImage(url: string): Promise<Image> {
    if (!url) return this.loadedDefaultImage;

    try {
      const cacheFilePath = this.getCacheFilePath(url);

      // 检查缓存是否存在
      if (existsSync(cacheFilePath)) {
        try {
          const cachedBuffer = readFileSync(cacheFilePath);
          return await this.ctx.canvas.loadImage(cachedBuffer);
        } catch (cacheError) {
          this.logger.warn(`Failed to load cached image from ${cacheFilePath}, will refetch:`, cacheError);
          // 缓存文件损坏，继续下载新的
        }
      }

      // 下载图片
      const response = await fetch(url);
      if (!response.ok) {
        this.logger.error(`Failed to fetch image from ${url}`);
        return this.loadedDefaultImage;
      }

      const buffer = await response.arrayBuffer();
      const bufferData = Buffer.from(buffer);

      // 保存到缓存
      try {
        writeFileSync(cacheFilePath, bufferData);
      } catch (cacheWriteError) {
        this.logger.warn(`Failed to cache image to ${cacheFilePath}:`, cacheWriteError);
        // 缓存失败不影响功能，继续使用下载的图片
      }

      return await this.ctx.canvas.loadImage(bufferData);
    } catch (error) {
      this.logger.error(`Error fetching image from ${url}:`, error);
      return this.loadedDefaultImage;
    }
  }
}

export default ImageCache;
