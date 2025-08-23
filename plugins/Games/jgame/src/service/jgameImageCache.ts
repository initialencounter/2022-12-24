import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "fs";
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
    const format = path.extname(url).split('?')[0] || '.jpeg'; // 默认使用 .jpeg 格式
    return `${hash}${format}`;
  }

  // 获取缓存文件路径
  getCacheFilePath(url: string): string {
    return path.resolve(this.cacheDir, this.generateCacheFileName(url));
  }

  // 验证图片数据是否有效
  private isValidImageBuffer(buffer: Buffer): boolean {
    if (!buffer || buffer.length === 0) {
      return false;
    }

    // 检查常见图片格式的文件头
    const header = buffer.subarray(0, 16);

    // PNG 文件头: 89 50 4E 47 0D 0A 1A 0A
    if (header.length >= 8 &&
      header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47 &&
      header[4] === 0x0D && header[5] === 0x0A && header[6] === 0x1A && header[7] === 0x0A) {
      return true;
    }

    // JPEG 文件头: FF D8 FF
    if (header.length >= 3 && header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
      return true;
    }

    // GIF 文件头: 47 49 46 38 (GIF8)
    if (header.length >= 4 && header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x38) {
      return true;
    }

    // WebP 文件头: 52 49 46 46 ... 57 45 42 50 (RIFF...WEBP)
    if (header.length >= 12 &&
      header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 &&
      header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50) {
      return true;
    }

    return false;
  }

  async fetchImage(url: string): Promise<Image> {
    if (!url) return this.loadedDefaultImage;

    if (['https://game.gtimg.cn/images/lol/act/img/tft/equip/2009.png',
      'https://game.gtimg.cn/images/lol/act/img/tft/equip/manazane.png',
      'https://game.gtimg.cn/images/lol/act/img/tft/equip/80_79.png',
      'https://game.gtimg.cn/images/lol/act/img/tft/equip/shengdunshiyue.png',
    ].includes(url)) {
      return this.loadedDefaultImage;
    }
    try {
      const cacheFilePath = this.getCacheFilePath(url);

      // 检查缓存是否存在
      if (existsSync(cacheFilePath)) {
        try {
          const cachedBuffer = readFileSync(cacheFilePath);

          // 验证缓存数据是否有效
          if (cachedBuffer && cachedBuffer.length > 0 && this.isValidImageBuffer(cachedBuffer)) {
            return await this.ctx.canvas.loadImage(cachedBuffer);
          } else {
            this.logger.warn(`Cached image file ${cacheFilePath} is empty, invalid, or not a valid image format, removing and will refetch`);
            try {
              unlinkSync(cacheFilePath);
            } catch (unlinkError) {
              this.logger.warn(`Failed to remove invalid cache file ${cacheFilePath}:`, unlinkError);
            }
          }
        } catch (cacheError) {
          this.logger.warn(`Failed to load cached image from ${cacheFilePath}, removing and will refetch:`, cacheError);
          // 删除损坏的缓存文件
          try {
            unlinkSync(cacheFilePath);
          } catch (unlinkError) {
            this.logger.warn(`Failed to remove corrupted cache file ${cacheFilePath}:`, unlinkError);
          }
        }
      }

      // 下载图片
      const response = await fetch(url);
      if (!response.ok) {
        this.logger.error(`Failed to fetch image from ${url}, status: ${response.status} ${response.statusText}`);
        return this.loadedDefaultImage;
      }

      // 检查响应的内容类型
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.startsWith('image/')) {
        this.logger.error(`URL ${url} returned non-image content type: ${contentType}`);
        return this.loadedDefaultImage;
      }

      const buffer = await response.arrayBuffer();
      const bufferData = Buffer.from(buffer);

      // 验证下载的数据是否有效
      if (!bufferData || bufferData.length === 0 || !this.isValidImageBuffer(bufferData)) {
        this.logger.error(`Downloaded image from ${url} is empty, invalid, or not a valid image format`);
        return this.loadedDefaultImage;
      }

      // 保存到缓存
      try {
        writeFileSync(cacheFilePath, bufferData);
      } catch (cacheWriteError) {
        this.logger.warn(`Failed to cache image to ${cacheFilePath}:`, cacheWriteError);
        // 缓存失败不影响功能，继续使用下载的图片
      }

      try {
        return await this.ctx.canvas.loadImage(bufferData);
      } catch (loadError) {
        this.logger.error(`Failed to load image from downloaded data for ${url}:`, loadError);
        return this.loadedDefaultImage;
      }
    } catch (error) {
      this.logger.error(`Error fetching image from ${url}:`, error);
      return this.loadedDefaultImage;
    }
  }
}

export default ImageCache;
