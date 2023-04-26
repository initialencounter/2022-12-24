"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.name = void 0;
const koishi_1 = require("koishi");
exports.name = 'open-vits';
exports.logger = new koishi_1.Logger(exports.name);
class Vits extends koishi_1.Service {
    constructor(ctx, config) {
        super(ctx, 'vits', true);
        this.config = config;
        this.speaker_dict = {};
        ctx.i18n.define('zh', require('./locales/zh'));
        ctx.on('ready', async () => {
            this.speaker_list = (await this.ctx.http.get('http://api.t4wefan.pub:60254/voice/speakers'))['VITS'];
            this.max_speakers = this.speaker_list.length - 1;
            this.speaker_list.forEach((i, id) => {
                let speaker_name = Object.values(i)[0];
                const tail_id = Object.values(i)[0].indexOf('（');
                if (tail_id > -1) {
                    speaker_name = speaker_name.slice(0, tail_id);
                }
                this.speaker_dict[String(id)] = speaker_name;
            });
        });
        // 记录发送消息的messageid
        ctx.on('send', (session) => {
            this.temp_msg = session.messageId;
        });
        ctx.command('say <prompt:text>', 'vits语音合成')
            .option('speaker', '-s <speaker:string>', { fallback: config.speaker_id })
            .option('lang', '-l <lang:string>')
            .action(async ({ session, options }, prompt) => {
            await session.send((String(await ctx.http.get('https://drive.t4wefan.pub/d/blockly/open-vits/help/waiting.txt', { responseType: "text" })) + String(options.lang ? options.lang : 'zh')));
            // 判断是否需要撤回
            if (config.recall) {
                this.recall(session, this.temp_msg);
            }
            if (!prompt) {
                return (String((0, koishi_1.h)('at', { id: (session.userId) })) + String(await ctx.http.get('https://drive.t4wefan.pub/d/koishi/vits/help.txt', { responseType: "text" })));
            }
            if (prompt.length > config.max_length) {
                return String((0, koishi_1.h)('at', { id: (session.userId) })) + (String(await this.ctx.http.get('https://drive.t4wefan.pub/d/koishi/vits/error_too_long.txt', { responseType: "text" })));
            }
            // 判断speaker_id是否合法
            const reg = /^\d+(\d+)?$/;
            if ((!reg.test(options.speaker)) && Object.values(this.speaker_dict).indexOf(options.speaker) > -1) {
                this.speaker = Object.values(this.speaker_dict).indexOf(options.speaker);
            }
            else {
                this.speaker = options.speaker ? Number(options.speaker) : Number(config.speaker_id);
                this.speaker = (this.speaker < this.max_speakers && this.speaker > 0) ? this.speaker : 3;
            }
            const languageCodes = ['zh', 'en', 'fr', 'jp', 'ru', 'de'];
            if (options.lang) {
                if ((languageCodes.indexOf(options.lang) > -1) && config.translator && ctx.translator) {
                    const zhPromptMap = prompt.match(/[\u4e00-\u9fa5]+/g);
                    if (zhPromptMap?.length > 0) {
                        try {
                            const translatedMap = (await ctx.translator.translate({ input: zhPromptMap.join(','), target: options.lang })).toLocaleLowerCase().split(',');
                            zhPromptMap.forEach((t, i) => {
                                prompt = prompt.replace(t, translatedMap[i]).replace('，', ',');
                            });
                        }
                        catch (err) {
                            exports.logger.warn(err);
                        }
                    }
                }
            }
            return await this.say(prompt, this.speaker);
        });
    }
    // 撤回的方法
    async recall(session, messageId) {
        new Promise(resolve => setTimeout(() => {
            session.bot.deleteMessage(session.channelId, messageId);
        }, this.config.recall_time));
    }
    /**
     *
     * @param prompt 要转化的文本
     * @param speaker_id 音色id，可选
     * @returns
     */
    async say(prompt, speaker_id = this.speaker) {
        if (prompt.length > this.config.max_length) {
            return (String(await this.ctx.http.get('https://drive.t4wefan.pub/d/koishi/vits/error_too_long.txt', { responseType: "text" })));
        }
        try {
            const url = `${this.config.endpoint}/voice?text=${encodeURIComponent(prompt)}&id=${speaker_id}&format=ogg`;
            const response = await this.ctx.http.get(url, { responseType: 'arraybuffer' });
            return koishi_1.h.audio(response, 'audio/mpeg');
        }
        catch (e) {
            exports.logger.info(String(e));
            return String(e);
        }
    }
    ;
}
(function (Vits) {
    Vits.usage = `
## 注意事项
>对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-open-vits 概不负责。<br>
如果有更多文本内容想要修改，可以在<a style="color:blue" href="/locales">本地化</a>中修改 zh 内容</br>
后端搭建教程<a style="color:blue" href="https://github.com/Artrajz/vits-simple-api">vits-simple-api</a>
## 使用方法
* say 要转化的文本

## 问题反馈群: 
399899914
`;
    Vits.Config = koishi_1.Schema.object({
        endpoint: koishi_1.Schema.string().default('https://api.vits.t4wefan.pub').description('vits服务器地址'),
        speaker_id: koishi_1.Schema.string().default('3').description('speaker_id'),
        max_length: koishi_1.Schema.number().default(256).description('最大长度'),
        waiting: koishi_1.Schema.boolean().default(true).description('消息反馈，会发送思考中...'),
        recall: koishi_1.Schema.boolean().default(true).description('会撤回思考中'),
        recall_time: koishi_1.Schema.number().default(5000).description('撤回的时间'),
        translator: koishi_1.Schema.boolean().default(true).description('将启用翻译'),
    });
})(Vits || (Vits = {}));
exports.default = Vits;
