import { Context, Session, Schema, segment, Dict, Service } from "koishi";
export declare const name = "glm-bot";
/**
 * glm 服务
 */
declare module 'koishi' {
    interface Context {
        glm: Glm;
    }
    interface Glm {
        chat(session: Session, prompt: string): Glm.Msg[];
    }
}
declare class Glm extends Service {
    private config;
    output_type: string;
    g_voice_name: string;
    key: number[];
    sessions: Dict;
    constructor(ctx: Context, config: Glm.Config);
    /**
     *
     * @param userId 用户QQ号
     * @param resp gpt返回的json
     * @returns 文字，图片或聊天记录
     */
    getContent(userId: string, resp: Glm.Msg[], messageId: string): Promise<string | segment>;
    encode(text: string): string;
    clear(session: Session): Promise<any>;
    chat(session: Session, prompt: string): Promise<Glm.Msg[]>;
    get_chat_session(sessionid: string): Glm.Msg[];
    fastapi(session: Session, prompt: string): Promise<string>;
    glm_t4(session: Session, prompt: string): Promise<string>;
    glmmtg(session: Session, text: string): Promise<void>;
}
declare namespace Glm {
    const usage = "\n  chatglm\u5BF9\u8BDD\u63D2\u4EF6\uFF0C\u9700\u8981\u81EA\u5DF1\u914D\u7F6E\u540E\u7AEF\uFF0C\u4E5F\u53EF\u4EE5\u76F4\u63A5\u7528\u5176\u4ED6\u4EBA\u7684api\n  ### \u914D\u7F6E\u8BF4\u660E\n  - t4\u63A5\u53E3: \u6700\u591A\u4EBA\u7528\uFF0C\u81EA\u5EFA\u9700\u8981\u5B89\u88C5[api.py](https://forum.koishi.xyz/t/topic/1089)\u6587\u4EF6\n    - \u5730\u5740\u793A\u4F8B\uFF1Ahttps://\u4F60\u7684\u670D\u52A1\u5668\u5730\u5740/chatglm?\n    - \u63D0\u95EE\u8BCD\uFF1Aglm\n  - FastAPI\u63A5\u53E3: \u6709\u516C\u7F51ip\u7684\u53EF\u4EE5\u7528\uFF0C\u6709[\u6559\u7A0B](https://forum.koishi.xyz/t/topic/1075/)\n    - \u5730\u5740\u793A\u4F8B\uFF1Ahttps://\u516C\u7F51ip/chat\n  \n  \n  ### \u95EE\u9898\u53CD\u9988\n  \u8BF7\u5230[\u8BBA\u575B](https://forum.koishi.xyz/t/topic/1089)\u7559\u8A00";
    interface Msg {
        role: string;
        content: string;
    }
    interface Config {
        type: string;
        myServerUrl: string;
        publicUrl: string;
        send_glmmtg_response: boolean;
        prefix: string;
        defaultText: string;
        output: string;
    }
    const Config: Schema<Schemastery.ObjectS<{
        type: Schema<string, string>;
        myServerUrl: Schema<string, string>;
    }> | Schemastery.ObjectS<{
        type: Schema<string, string>;
        publicUrl: Schema<string, string>;
    }> | Schemastery.ObjectS<{
        max_length: Schema<number, number>;
        top_p: Schema<number, number>;
        temperature: Schema<number, number>;
        send_glmmtg_response: Schema<boolean, boolean>;
        prefix: Schema<string, string>;
        defaultText: Schema<string, string>;
        output: Schema<string, string>;
    }> | Schemastery.ObjectS<{
        type: Schema<"秋叶版api" | "usrid版api文件", "秋叶版api" | "usrid版api文件">;
    }>, (Schemastery.ObjectT<{
        type: Schema<string, string>;
        myServerUrl: Schema<string, string>;
    }> | Schemastery.ObjectT<{
        type: Schema<string, string>;
        publicUrl: Schema<string, string>;
    }>) & {
        max_length: number;
        top_p: number;
        temperature: number;
        send_glmmtg_response: boolean;
        prefix: string;
        defaultText: string;
        output: string;
    } & Dict<any, string> & {
        type: "秋叶版api" | "usrid版api文件";
    }>;
}
export default Glm;
