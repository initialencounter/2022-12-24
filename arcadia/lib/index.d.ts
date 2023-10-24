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
    const usage: string;
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
