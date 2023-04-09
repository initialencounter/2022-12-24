import { Context, Session, Schema, Dict } from "koishi";
export declare const name = "glm-bot";
declare class Glm {
    private ctx;
    private config;
    memory_id: number;
    chat_id: number;
    sessions: Dict;
    constructor(ctx: Context, config: Glm.Config);
    split_by_type(session: Session, args?: any): Promise<any>;
    official(session: Session, msg: string): Promise<string>;
    get_session(session_userid: string): string[];
    glm_t4(session: Session, args: string[]): Promise<any>;
    glm2(msg: any): Promise<any>;
    glmmtg(session: Session, text: string): Promise<void>;
    mathRandomInt(a: any, b: any): number;
}
declare namespace Glm {
    const usage = "\n  chatglm\u5BF9\u8BDD\u63D2\u4EF6\uFF0C\u9700\u8981\u81EA\u5DF1\u914D\u7F6E\u540E\u7AEF\uFF0C\u4E5F\u53EF\u4EE5\u76F4\u63A5\u7528\u5176\u4ED6\u4EBA\u7684api\n  ### \u914D\u7F6E\u8BF4\u660E\n  - t4\u7248\u670D\u52A1\u5668\u5730\u5740: \u6700\u591A\u4EBA\u7528\uFF0C\u81EA\u5EFA\u9700\u8981\u5B89\u88C5[api.py](https://forum.koishi.xyz/t/topic/1089)\u6587\u4EF6\n    - \u5730\u5740\u793A\u4F8B\uFF1Ahttps://\u4F60\u7684\u670D\u52A1\u5668\u5730\u5740/chatglm?\n    - \u63D0\u95EE\u8BCD\uFF1Aglm\n  - \u79CB\u53F6\u7248\u670D\u52A1\u5668\u5730\u5740: \u9002\u914D\u79CB\u53F6\u4E00\u952E\u5305\u7684api\uFF0C\u6709\u516C\u7F51ip\u7684\u53EF\u4EE5\u7528\uFF0C\u6709[\u6559\u7A0B](https://forum.koishi.xyz/t/topic/1075/)\n    - \u5730\u5740\u793A\u4F8B\uFF1Ahttps://\u516C\u7F51ip/chat\n    - \u63D0\u95EE\u8BCD\uFF1Aglms\n  \n    \n  \n  ### \u95EE\u9898\u53CD\u9988\n  \u8BF7\u5230[\u8BBA\u575B](https://forum.koishi.xyz/t/topic/1089)\u7559\u8A00";
    interface Response_official {
        response: string;
        history: string[];
        status: number;
        time: number;
    }
    interface Config {
        type: string;
        myServerUrl: string;
        publicUrl: string;
        send_glmmtg_response: boolean;
        prefix: string;
        endpoint: string;
        max_length: number;
        top_p: number;
        temperature: number;
    }
    const Config: Schema<Schemastery.ObjectS<{
        type: Schema<"official" | "秋叶版api" | "usrid版api文件", "official" | "秋叶版api" | "usrid版api文件">;
    }> | Schemastery.ObjectS<{
        type: Schema<string, string>;
        endpoint: Schema<string, string>;
    }> | Schemastery.ObjectS<{
        type: Schema<string, string>;
        myServerUrl: Schema<string, string>;
        send_glmmtg_response: Schema<boolean, boolean>;
        prefix: Schema<string, string>;
    }> | Schemastery.ObjectS<{
        type: Schema<string, string>;
        publicUrl: Schema<string, string>;
    }> | Schemastery.ObjectS<{
        max_length: Schema<number, number>;
        top_p: Schema<number, number>;
        temperature: Schema<number, number>;
    }>, {
        type: "official" | "秋叶版api" | "usrid版api文件";
    } & Dict<any, string> & (Schemastery.ObjectT<{
        type: Schema<string, string>;
        endpoint: Schema<string, string>;
    }> | Schemastery.ObjectT<{
        type: Schema<string, string>;
        myServerUrl: Schema<string, string>;
        send_glmmtg_response: Schema<boolean, boolean>;
        prefix: Schema<string, string>;
    }> | Schemastery.ObjectT<{
        type: Schema<string, string>;
        publicUrl: Schema<string, string>;
    }> | Schemastery.ObjectT<{
        max_length: Schema<number, number>;
        top_p: Schema<number, number>;
        temperature: Schema<number, number>;
    }>)>;
}
export default Glm;
