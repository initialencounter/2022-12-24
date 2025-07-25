import { Schema } from "koishi";

export interface Headers {
  [key: string]: string | undefined;
  device: string;
  version: string;
  channel: string;
  language: string;
  token?: string;
  uid?: string;
  'time-stamp'?: string;
  'api-key'?: string;
  'Content-Type'?: string;
  'Content-Length'?: string;
  Host: string;
  Connection: string;
  'Accept-Encoding': string;
  'User-Agent': string;
};
export interface APIServiceConfig {
  headers: Headers
  decryptSecretKey: string;
  encryptSecretKey: string;
}
export const APIServiceConfig: Schema<APIServiceConfig> = Schema.object({
  headers: Schema.object({
    device: Schema.string().default('OPD2413').description('设备型号'),
    version: Schema.string().default('30610').description('联萌版本号'),
    channel: Schema.string().default('App'),
    language: Schema.string().default('zh').description('语言'),
    token: Schema.string().default('').description('账号登录 token'),
    uid: Schema.string().default('').description('联萌账号 uid'),
    Host: Schema.string().default('minesweeper.natapp1.cc').description('联萌服务器域名'),
    Connection: Schema.string().default('Keep-Alive'),
    'Accept-Encoding': Schema.string().default('gzip'),
    'User-Agent': Schema.string().default('okhttp/4.7.2'),
  }).description('请求头信息'),
  decryptSecretKey: Schema.string().required(true).description('联萌解密密钥'),
  encryptSecretKey: Schema.string().required(true).description('联萌加密密钥'),
});
