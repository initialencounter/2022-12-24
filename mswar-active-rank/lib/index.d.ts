import { Context, Schema } from 'koishi';
export declare const name = "mswar-active-rank";
export declare const usage = "\n## \u6CE8\u610F\u4E8B\u9879\n> \u5EFA\u8BAE\u4F7F\u7528\u524D\u73A9\u4E00\u5C40[\u626B\u96F7\u8054\u840C](http://tapsss.com)\n\u4F5C\u8005\u670D\u52A1\u5668\u7ECF\u5E38\u6389\u7EBF\uFF0C\u652F\u6301<a href=https://github.com/initialencounter/mykoishi/smear_rank\">\u81EA\u5EFA\u670D\u52A1\u5668</a>\n\u672C\u63D2\u4EF6\u53EA\u7528\u4E8E\u4F53\u73B0 Koishi \u90E8\u7F72\u8005\u610F\u5FD7\u201D\u3002\n\u5BF9\u4E8E\u90E8\u7F72\u8005\u884C\u4E3A\u53CA\u6240\u4EA7\u751F\u7684\u4EFB\u4F55\u7EA0\u7EB7\uFF0C Koishi \u53CA koishi-plugin-mswar-active-rank \u6982\u4E0D\u8D1F\u8D23\u3002\n\u5982\u679C\u6709\u66F4\u591A\u6587\u672C\u5185\u5BB9\u60F3\u8981\u4FEE\u6539\uFF0C\u53EF\u4EE5\u5728<a href=\"/locales\">\u672C\u5730\u5316</a>\u4E2D\u4FEE\u6539 zh \u5185\u5BB9\n";
export interface Rank {
    update_time: string;
    mine_rank: any;
    puzzle_rank: any;
}
export interface Rule {
    platform: string;
    channelId: string;
    selfId?: string;
    guildId?: string;
}
export declare const Rule: Schema<Rule>;
export interface Config {
    api_hostname: string;
    rules: Rule[];
    interval: number;
    background_img: string;
    border: string;
}
export declare const Config: Schema<Config>;
export declare function apply(ctx: Context, config: Config): void;
