import { Context, Schema, Logger, Element } from 'koishi';
export declare const name = "facercg";
export declare const div_items: (face_arr: Face_info[]) => Element[];
export declare const msg: (face_arr: Face_info[]) => Element[];
export declare const usage = "\n## \u6CE8\u610F\u4E8B\u9879\n> \u4F7F\u7528\u524D\u5728 <a href=\"https://console.bce.baidu.com/ai/#/ai/face/overview/index\">\u767E\u5EA6\u667A\u80FD\u4E91</a> \u4E2D\u83B7\u53D6apikey\u53CAsecret_key\n\u6216\u8005<a href=\"https://github.com/initialencounter/beauty-predict-server\">\u81EA\u5EFA\u670D\u52A1\u7AEF</a>\n> \u5BF9\u4E8E\u90E8\u7F72\u8005\u884C\u4E3A\u53CA\u6240\u4EA7\u751F\u7684\u4EFB\u4F55\u7EA0\u7EB7\nKoishi \u53CA koishi-plugin-facercg \u6982\u4E0D\u8D1F\u8D23\u3002\n\u5982\u679C\u6709\u66F4\u591A\u6587\u672C\u5185\u5BB9\u60F3\u8981\u4FEE\u6539\uFF0C\u53EF\u4EE5\u5728<a href=\"/locales\">\u672C\u5730\u5316</a>\u4E2D\u4FEE\u6539 zh \u5185\u5BB9\n## \u6548\u679C\u5C55\u793A\n<img src = 'https://github.com/initialencounter/mykoishi/raw/main/screenshot/3-2-1.jpg'>\n";
export declare const logger: Logger;
export interface Gender {
    type: string;
    probability: number;
}
export interface Location {
    left: number;
    top: number;
    width: number;
    height: number;
    rotation: number;
}
export interface Face_info {
    location: Location;
    beauty: number;
    gender: Gender;
}
export interface Result {
    face_num: number;
    face_list: Face_info[];
}
export interface Response {
    error_code: number;
    error_msg: string;
    log_id: number;
    timestamp: number;
    cached: number;
    result: Result;
}
export interface Config {
    type: string;
    key: string;
    secret_key: string;
    authority: number;
    endpoint: string;
    usage: number;
    cmd: string;
}
export declare const Config: Schema<Schemastery.ObjectS<{
    type: Schema<"BaiduApi" | "Pca", "BaiduApi" | "Pca">;
}> | Schemastery.ObjectS<{
    authority: Schema<number, number>;
    usage: Schema<number, number>;
    cmd: Schema<string, string>;
}> | Schemastery.ObjectS<{
    type: Schema<string, string>;
    key: Schema<string, string>;
    secret_key: Schema<string, string>;
}> | Schemastery.ObjectS<{
    type: Schema<string, string>;
    endpoint: Schema<string, string>;
}>, {
    type: "BaiduApi" | "Pca";
} & import("cosmokit").Dict<any, string> & {
    authority: number;
    usage: number;
    cmd: string;
} & (Schemastery.ObjectT<{
    type: Schema<string, string>;
    key: Schema<string, string>;
    secret_key: Schema<string, string>;
}> | Schemastery.ObjectT<{
    type: Schema<string, string>;
    endpoint: Schema<string, string>;
}>)>;
export declare function get_access_token(ctx: Context, config: Config): Promise<string>;
export declare function apply(ctx: Context, config: Config): Promise<void>;
