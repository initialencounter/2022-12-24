import { Context, Schema } from "koishi";
export declare const usage = "\n## \u6CE8\u610F\u4E8B\u9879\n> \u4F7F\u7528\u524D\u5728 <a href=\"http://www.iflow.work\">iflow.work</a> \u4E2D\u83B7\u53D6cookie\n\u672C\u63D2\u4EF6\u4EC5\u4F9B\u5B66\u4E60\u53C2\u8003\uFF0C\u8BF7\u52FF\u7528\u4E8E\u5546\u4E1A\u884C\u4E3A\n\u5BF9\u4E8E\u90E8\u7F72\u8005\u884C\u4E3A\u53CA\u6240\u4EA7\u751F\u7684\u4EFB\u4F55\u7EA0\u7EB7\uFF0C Koishi \u53CA koishi-plugin-steam-trading \u6982\u4E0D\u8D1F\u8D23\u3002\n\u5982\u679C\u6709\u66F4\u591A\u6587\u672C\u5185\u5BB9\u60F3\u8981\u4FEE\u6539\uFF0C\u53EF\u4EE5\u5728<a href=\"/locales\">\u672C\u5730\u5316</a>\u4E2D\u4FEE\u6539 zh \u5185\u5BB9<br>\n\n## \u4F7F\u7528\u65B9\u6CD5\n[\u6302\u5200\u884C\u60C5] \u8BF7\u53D1\u9001 trad buff ['buff', 'igxe', 'c5', 'uupy'] <br>\n[\u884C\u60C5\u5206\u6790] \u8BF7\u53D1\u9001 \u884C\u60C5\u5206\u6790 <br>\n[\u7F51\u9875\u622A\u56FE] \u8BF7\u53D1\u9001 \u884C\u60C5\u5206\u6790+\u7F51\u5740\n";
export interface Config {
    Hm_lpvt_a5301d501cd73accbee89775308fdd5e: number;
    text_len: number;
    ifimg: boolean;
    order: string;
    game: string;
    min_price: number;
    max_price: number;
    min_volume: number;
    buff: boolean;
    igxe: boolean;
    c5: boolean;
    uupy: boolean;
    buy: boolean;
    safe_buy: boolean;
    sell: boolean;
    loadTimeout?: number;
    idleTimeout?: number;
    maxSize?: number;
    protocols?: string[];
}
export declare const Config: Schema<Config>;
export declare function apply(ctx: Context, config: Config): void;
