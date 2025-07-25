import { Context, HTTP, Service } from "koishi";
import { computeMD5 } from "../utils/md5";
import { aesEcbEncrypt, extractJsonFromEncrypted } from "../utils/aes";
import { Headers, HttpServiceConfig } from "../types/httpService";

declare module 'koishi' {
  interface Context {
    httpService: HttpService;
  }
}

class HttpService extends Service {
  headers: Headers;
  uid: string;
  token: string;
  decryptSecretKey: string
  encryptSecretKey: string

  constructor(ctx: Context, config: HttpServiceConfig) {
    super(ctx, 'httpService');
    this.uid = config.headers.uid || '';
    this.token = config.headers.token || '';
    this.decryptSecretKey = config.decryptSecretKey;
    this.encryptSecretKey = config.encryptSecretKey;
    this.headers = ctx.config.headers;
  }

  makeApiKey(
    body: string,
    timeStamp: string = Date.now().toString(),
  ): string {
    return computeMD5(this.uid + this.token + timeStamp + computeMD5(body) + "api");
  }

  encryptBody(body: string): string {
    return aesEcbEncrypt(body, this.encryptSecretKey);
  }

  async executeRequest<T>(path: string, method: HTTP.Method, params: Record<string, any>): Promise<T> {
    const data = new URLSearchParams(params).toString();
    const body = this.encryptBody(data);
    const timeStamp = Date.now().toString();
    // const timeStamp = '1752668107525'; // 获取当前时间戳
    const apiKey = this.makeApiKey(body, timeStamp);
    const headers = this.headers;
    headers['time-stamp'] = timeStamp;
    headers['api-key'] = apiKey;
    headers['Content-Length'] = body.length.toString(); // 获取字符串长度
    headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8';

    try {
      const response = await fetch(`http://${headers['Host']}${path}`,
        {
          method,
          headers,
          body
        });
      const cipher = await response.text();
      const jsonStr = extractJsonFromEncrypted(cipher, this.decryptSecretKey) as string;
      const json = JSON.parse(jsonStr);
      if (path === '/Minesweeper/post/comment/good') {
        console.log('评论点赞返回:', json);
      }
      return json as T;
    } catch (error) {
      this.ctx.logger('GameNews').error('获取游戏资讯失败:', error);
      throw error;
    }
  }

}

export default HttpService;
