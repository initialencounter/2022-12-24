import { Context, Schema, Logger, segment, Session, Service, Dict } from 'koishi';
export declare const name = "arcadia";
export declare const logger: Logger;
declare module 'koishi' {
    interface Context {
        arca: Arcadia;
    }
    interface Arcadia {
    }
}
declare class Arcadia extends Service {
    private config;
    output_type: string;
    sessions: Dict;
    personality: string;
    sessions_cmd: Dict;
    reg: RegExp;
    access_token: string;
    ifgettoken: boolean;
    key: number[];
    aliasMap: any;
    charMap: any;
    g_voice_name: string;
    opt: Arcadia.Req;
    style: string;
    engine: string;
    ratio: number;
    guidence_scale: number;
    enable_face_enhance: boolean;
    is_last_layer_skip: boolean;
    score: number;
    constructor(ctx: Context, config: Arcadia.Config);
    PostOpenApi(sesssion: Session, payload: Arcadia.Req): Promise<string | segment>;
    get_tasks(uuid: string): Promise<false | Arcadia.Response>;
    show_tasks(session: Session, uuid: string): Promise<segment | "未画好，请稍后发送 \"show <uuid>\" 查看">;
    switch_style(session: Session, type: string): Promise<string>;
    switch_engine(session: Session, type: string): Promise<string>;
    get_score(session: Session): Promise<string>;
    get_complete_tasks(session: Session): Promise<segment>;
    switch_output(session: Session, type: string): Promise<string>;
    getContent(type: string, userId: string, msgs: Arcadia.Data_last[]): Promise<segment>;
    getSign(payload: Arcadia.Req): string;
    Md5V(str: string): string;
}
declare namespace Arcadia {
    const usage = "\n##\u6CE8\u610F\u4E8B\u9879 \n> \u4F7F\u7528\u524D\u8BF7\u524D\u5F80 <a style = \"color:blue\" href =\"http://open.yjai.art/openai-painting\"> yjart </a> \u4E2D\u83B7\u53D6apikey\u53CAapisecret<br>\n\u5BF9\u4E8E\u90E8\u7F72\u8005\u884C\u4E3A\u53CA\u6240\u4EA7\u751F\u7684\u4EFB\u4F55\u7EA0\u7EB7\uFF0C Koishi \u53CA <a style=\"color:blue\" href=\"https:/ / github.com / initialencounter / mykoishi \">koishi-plugin-arcadia</a>\u6982\u4E0D\u8D1F\u8D23\u3002<br>\n\u5982\u679C\u6709\u66F4\u591A\u6587\u672C\u5185\u5BB9\u60F3\u8981\u4FEE\u6539\uFF0C\u53EF\u4EE5\u5728<a style=\"color: blue \" href=\" / locales \">\u672C\u5730\u5316</a>\u4E2D\u4FEE\u6539 zh \u5185\u5BB9</br>\n\u53D1\u9001arca.style,\u5373\u53EF\u5207\u6362\u98CE\u683C\n";
    interface Req {
        uuid?: string;
        prompt?: string;
        apikey: string;
        apisecret?: string;
        engine?: string;
        ratio?: number;
        style?: any;
        guidence_scale?: number;
        callback_url?: string;
        callback_type?: string;
        enable_face_enhance?: boolean;
        is_last_layer_skip?: boolean;
        init_image?: string;
        init_strength?: number;
        steps_mode?: number;
        timestamp?: any;
    }
    interface Response {
        status: number;
        reason: string;
        data: any;
    }
    interface User {
        UserUuid: string;
        Name: string;
        ApiKey: string;
        Phone: string;
        Role: number;
        Score: number;
        VipLevel: number;
        TaskLimit: number;
        Qps: number;
        Money: number;
        InvoicedMoney: number;
        AccumulatedMoney: number;
        Status: number;
        Kind: number;
        Operator: any;
        CreateTime: string;
    }
    interface Data_last {
        Uuid: string;
        User: User;
        CreateTime: string;
        UpdateTime: string;
        TextPrompt: string;
        RatioType: number;
        QueueName: string;
        Progress: number;
        ImagePath: string;
        ThumbImagePath: string;
        Status: number;
        Style: string;
        Steps: number;
        Position: number;
        PerTaskTime: number;
        UseModel336: boolean;
        FirstPosition: number;
        ReportQueue: string;
        Engine: string;
        GuidenceScale: number;
        Score: number;
        CallbackUrl: string;
        CallbackType: string;
        UseObjectStorage: boolean;
        CheckSafeMessage: string;
        EnableFaceEnhance: boolean;
        IsLastLayerSkip: boolean;
        Seed: number;
        BaiduFilterImageId: string;
        InitImagePath: string;
        InitStrength: number;
        Online: number;
    }
    interface Config {
        api_path: string;
        apikey: string;
        apisecret?: string;
        engine?: string;
        ratio?: number;
        style?: string;
        guidence_scale?: number;
        enable_face_enhance?: boolean;
        is_last_layer_skip?: boolean;
        steps_mode?: number;
        timestamp?: any;
        authority: number;
        usage: number;
        cmd: string;
        output_type: string;
    }
    const Config: Schema<Config>;
}
export default Arcadia;
