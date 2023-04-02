import { Context, Schema, Session } from 'koishi';
declare module 'koishi' {
    interface Tables {
        auto_reply: Schedule;
    }
}
export interface Schedule {
    id: number;
    rules: string;
    reply: any;
    lastCall: Date;
    add_user: string;
}
export declare const len: (ctx: Context) => Promise<number>;
export declare const rule_update: (ctx: Context) => Promise<string[]>;
export declare const add_data: (ctx: Context, session: Session, prompt: string, split_str: any) => Promise<string>;
export declare const name = "auto-reply";
export declare const log: (s: any) => void;
export interface Config {
    split_str: string;
    min_authority: number;
    cmd: string;
}
export declare const Config: Schema<Config>;
export declare function apply(ctx: Context, config: Config): Promise<void>;
