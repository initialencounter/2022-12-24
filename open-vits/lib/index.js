"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.name = void 0;
const jsx_runtime_1 = require("@satorijs/element/jsx-runtime");
const koishi_1 = require("koishi");
exports.name = 'open-vits';
exports.logger = new koishi_1.Logger(exports.name);
class Vits extends koishi_1.Service {
    constructor(ctx, config) {
        super(ctx, 'vits', true);
        this.config = config;
        this.speaker = 3;
        ctx.i18n.define('zh', require('./locales/zh'));
        // 记录发送消息的messageid
        ctx.on('send', (session) => {
            this.temp_msg = session.messageId;
        });
        ctx.command('say <prompt:text>', 'vits语音合成')
            .option('speaker', '-s <speaker:number>', { fallback: config.speaker_id })
            .action(async ({ session, options }, prompt) => {
            // 判断speaker_id是否合法
            this.speaker = options.speaker ? options.speaker : config.speaker_id;
            this.speaker = (this.speaker < this.config.max_speakers && this.speaker > 0) ? this.speaker : 3;
            await session.send(config.waiting_text);
            // 判断是否需要撤回
            if (config.recall) {
                this.recall(session, this.temp_msg);
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
    async say(prompt, speaker_id = this.config.max_speakers) {
        if (prompt.length > this.config.max_length) {
            return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsx)("i18n", { path: ".too-long" }) });
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
        speaker_id: koishi_1.Schema.number().default(3).description('speaker_id'),
        max_length: koishi_1.Schema.number().default(256).description('最大长度'),
        waiting: koishi_1.Schema.boolean().default(true).description('消息反馈，会发送思考中...'),
        waiting_text: koishi_1.Schema.string().default('思考中...').description('等待时发送的文本'),
        recall: koishi_1.Schema.boolean().default(true).description('会撤回思考中'),
        recall_time: koishi_1.Schema.number().default(5000).description('撤回的时间'),
        max_speakers: koishi_1.Schema.number().default(3).description('max_speakers')
    });
})(Vits || (Vits = {}));
exports.default = Vits;
