import { Context, Schema, h, Session, Logger, Dict } from 'koishi';
import Vits from '@initencounter/vits';
export declare const using: string[];
export declare const name: string;
export declare const logger: Logger;
declare class OpenVits extends Vits {
    temp_msg: string;
    speaker: number;
    speaker_list: Dict[];
    max_speakers: number;
    speaker_dict: Dict;
    recall_time: number;
    max_length: number;
    endpoint: string;
    constructor(ctx: Context, config: OpenVits.Config);
    recall(session: Session, messageId: string): Promise<void>;
    /**
     *
     * @param input 要转化的文本
     * @param speaker_id 音色id，可选
     * @returns
     */
    say(option: OpenVits.Result): Promise<h>;
}
declare namespace OpenVits {
    const usage = "\n## \u6CE8\u610F\u4E8B\u9879\n>\u5BF9\u4E8E\u90E8\u7F72\u8005\u884C\u4E3A\u53CA\u6240\u4EA7\u751F\u7684\u4EFB\u4F55\u7EA0\u7EB7\uFF0C Koishi \u53CA koishi-plugin-open-vits \u6982\u4E0D\u8D1F\u8D23\u3002<br>\n\u5982\u679C\u6709\u66F4\u591A\u6587\u672C\u5185\u5BB9\u60F3\u8981\u4FEE\u6539\uFF0C\u53EF\u4EE5\u5728<a style=\"color:blue\" href=\"/locales\">\u672C\u5730\u5316</a>\u4E2D\u4FEE\u6539 zh \u5185\u5BB9</br>\n\u540E\u7AEF\u642D\u5EFA\u6559\u7A0B<a style=\"color:blue\" href=\"https://github.com/Artrajz/vits-simple-api\">vits-simple-api</a>\n## \u4F7F\u7528\u65B9\u6CD5\n* say \u8981\u8F6C\u5316\u7684\u6587\u672C\n\n## \u95EE\u9898\u53CD\u9988\u7FA4: \n399899914\n";
    interface Result {
        input: string;
        speaker_id?: number;
        output?: h;
    }
    interface Config {
        endpoint: string;
        max_length: number;
        waiting: boolean;
        recall: boolean;
        recall_time: number;
        speaker_id: string;
        translator: boolean;
    }
    const Config: Schema<Schemastery.ObjectS<{
        endpoint: Schema<string, string>;
        speaker_id: Schema<string, string>;
        max_length: Schema<number, number>;
        waiting: Schema<boolean, boolean>;
        recall: Schema<boolean, boolean>;
        recall_time: Schema<number, number>;
        translator: Schema<boolean, boolean>;
    }>, Schemastery.ObjectT<{
        endpoint: Schema<string, string>;
        speaker_id: Schema<string, string>;
        max_length: Schema<number, number>;
        waiting: Schema<boolean, boolean>;
        recall: Schema<boolean, boolean>;
        recall_time: Schema<number, number>;
        translator: Schema<boolean, boolean>;
    }>>;
}
export default OpenVits;
