import { Context, Schema } from 'koishi';
export declare const using: string[];
declare module 'koishi' {
    interface Tables {
        countlist: Countlsit;
    }
}
export interface Countlsit {
    uid: number;
    count: number;
    eula: boolean;
}
export declare const log: {
    (...data: any[]): void;
    (message?: any, ...optionalParams: any[]): void;
};
declare class Blacklist {
    private ctx;
    private config;
    readonly name = "blacklist";
    constructor(ctx: Context, config: Blacklist.Config);
    private mian_proce;
    private audit;
    private release;
}
declare namespace Blacklist {
    const usage = "\n## \u6CE8\u610F\u4E8B\u9879\n> \u5EFA\u8BAE\u4F7F\u7528\u524D\u5728 <a href=\"/database/user\">dataview</a> \u4E2D\u4FEE\u6539\u81EA\u5DF1\u6743\u9650\u7B49\u7EA7\u4E3A 2 \u53CA\u4EE5\u4E0A\n\u672C\u63D2\u4EF6\u53EA\u7528\u4E8E\u4F53\u73B0 Koishi \u90E8\u7F72\u8005\u610F\u5FD7\uFF0C\u5373\uFF1A\u201C\u90E8\u7F72\u8005\u4EC5\u5BF9\u540C\u610F\u4E86\u300A\u6700\u7EC8\u7528\u6237\u534F\u8BAE\u300B\u7684\u6700\u7EC8\u7528\u6237\u63D0\u4F9B\u670D\u52A1\u201D\u3002\n\u5BF9\u4E8E\u90E8\u7F72\u8005\u884C\u4E3A\u53CA\u6240\u4EA7\u751F\u7684\u4EFB\u4F55\u7EA0\u7EB7\uFF0C Koishi \u53CA koishi-plugin-eula \u6982\u4E0D\u8D1F\u8D23\u3002\n\u5982\u679C\u6709\u66F4\u591A\u6587\u672C\u5185\u5BB9\u60F3\u8981\u4FEE\u6539\uFF0C\u53EF\u4EE5\u5728<a href=\"/locales\">\u672C\u5730\u5316</a>\u4E2D\u4FEE\u6539 zh \u5185\u5BB9\n";
    interface Config {
        contraband: string;
        max_viol: number;
        ban_text1: string;
        ban_text2: string;
        invinc: number;
        pass_text: string;
    }
    const Config: Schema<Config>;
}
export default Blacklist;
