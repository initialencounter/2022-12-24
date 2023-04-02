import { Context, Schema } from 'koishi';
export declare const name = "jrrp";
export interface Config {
}
export declare const Config: Schema<Config>;
export declare const log: (s: any) => void;
export declare const luck_simple: (num: number) => "大吉" | "吉" | "半吉" | "小吉" | "末小吉" | "末吉" | "凶";
export declare function setRandomNumber(s: string): number;
export declare function apply(ctx: Context): void;
