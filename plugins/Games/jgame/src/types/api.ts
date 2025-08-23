import { Schema } from "koishi";

export interface JGameAPIHeaders {
  authority: string,
  cookie: string,
  "user-agent": string,
}

export interface JGameAPIConfig {
  headers: JGameAPIHeaders;
  baseURL: string;
  refreshTicket: string;
  timeout: number;
}

export const JGameAPIConfig: Schema<JGameAPIConfig> = Schema.object({
  headers: Schema.object({
    authority: Schema.string().default('mlol.qt.qq.com'),
    cookie: Schema.string().default(''),
    'user-agent': Schema.string().default('QTL/11.3.0.11530 Channel/3  Mozilla/5.0 (Linux; Android 9; tencent_game_emulator Build/PQ3A.190605.06171036; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/91.0.4472.114 Safari/537.36')
  }).description('JGame API 请求头配置'),
  baseURL: Schema.string().default('https://mlol.qt.qq.com'),
  refreshTicket: Schema.string().default(''),
  timeout: Schema.number().default(5000).description('请求超时时间（毫秒）')
}).description('JGame API 配置');
