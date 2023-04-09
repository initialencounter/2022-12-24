"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.name = void 0;
const jsx_runtime_1 = require("@satorijs/element/jsx-runtime");
const koishi_1 = require("koishi");
exports.name = "glm-bot";
const logger = new koishi_1.Logger(exports.name);
class Glm extends koishi_1.Service {
    constructor(ctx, config) {
        super(ctx, "glm", true);
        this.config = config;
        this.output_type = config.output;
        this.g_voice_name = '甘雨';
        this.sessions = {};
        this.key = [5, 188, 209, 154, 2, 90, 41, 129, 174, 177, 125, 55, 77, 165, 40, 97];
        ctx.command('glm.clear', '清除会话').action(async ({ session }) => this.clear(session));
        ctx.command("glm <prompt:text>", "向chatglm提问")
            .usage("进阶：输入'glm 重置记忆 '即可将记忆清零")
            .action(async ({ session }, prmpt) => {
            const history = await this.chat(session, prmpt);
            return await this.getContent(session.userId, history, session.userId);
        });
        ctx.command("glmmtg <text:text>", "输入你想画的画面，发送给ChatGLM，让ChatGLM来帮你写tag")
            .usage(`请确保当前聊天环境存在rryth或novelai插件
     使用例子：glmmtg 阳光沙滩`)
            .action(async ({ session }, text) => this.glmmtg(session, text));
    }
    /**
     *
     * @param userId 用户QQ号
     * @param resp gpt返回的json
     * @returns 文字，图片或聊天记录
     */
    async getContent(userId, resp, messageId) {
        if (this.output_type == 'voice') {
            const data = await this.ctx.http.get(`https://ai-api.baimianxiao.cn/api/${this.encode(this.g_voice_name)}/${this.encode(resp[resp.length - 1].content)}/0.4/0.6/1.12/${this.encode(Math.floor(Date.now() / 1000).toString())}.ai`, { responseType: 'arraybuffer' });
            return koishi_1.h.audio(data, 'audio/x-wav');
        }
        if (this.output_type == "quote") {
            return (0, koishi_1.h)('quote', { id: messageId }) + resp[resp.length - 1].content;
        }
        if (this.output_type == 'minimal') {
            return resp[resp.length - 1].content;
        }
        else if (this.output_type == 'figure') {
            const result = (0, koishi_1.segment)('figure');
            for (var msg of resp) {
                if (msg.role == 'user') {
                    result.children.push((0, koishi_1.segment)('message', {
                        userId: userId,
                        nickname: msg.role,
                    }, msg.content));
                    continue;
                }
                if (msg.role == 'assistant') {
                    result.children.push((0, koishi_1.segment)('message', {
                        userId: userId,
                        nickname: msg.role,
                    }, msg.content));
                }
                else {
                    result.children.push((0, koishi_1.segment)('message', {
                        userId: userId,
                        nickname: msg.role,
                    }, msg.content));
                }
            }
            return result;
        }
        else {
            const elements = [];
            for (var msg of resp) {
                if (msg.role == 'user') {
                    elements.push((0, jsx_runtime_1.jsxs)("div", { style: "color:#ff9900;font-size: 25px;background:transparent;width=500px;height:50px,", children: ["\u7528\u6237:", msg.content] }));
                    continue;
                }
                if (msg.role == 'assistant') {
                    elements.push((0, jsx_runtime_1.jsxs)("div", { style: "color:black;font-size: 25px;background:transparent;width=500px;height:50px,", children: ["AI:", msg.content] }));
                }
                else {
                    elements.push((0, jsx_runtime_1.jsxs)("div", { style: "color:#723b8d;font-size: 25px;background:transparent;width=400px", children: ["\u4EBA\u683C\u8BBE\u5B9A:", msg.content] }));
                }
            }
            return (0, jsx_runtime_1.jsxs)("html", { children: [(0, jsx_runtime_1.jsx)("img", { style: "-webkit-user-select: none; display: block; margin: auto; padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); cursor: zoom-in;", src: '', width: "600", height: "1000" }), (0, jsx_runtime_1.jsxs)("div", { style: 'position: absolute;top:20px;left:20px;width:600px;', children: [(0, jsx_runtime_1.jsx)("p", { style: "color:#723b8d", children: "ChatGLM" }), elements] }), (0, jsx_runtime_1.jsx)("div", { style: 'position: absolute;top:10px;', children: "create by koishi-plugin-glm-bot_v1.0.2" })] });
        }
    }
    encode(text) {
        return Buffer.from(text).map((n, i) => n + (15 % (this.key[i % this.key.length] + i))).toString('hex');
    }
    async clear(session) {
        if (this.config.type == '秋叶版api') {
            return await this.ctx.http.post(this.config.publicUrl.replace('chat', 'clear'), { "uid": session.userId });
        }
        else if (this.config.type == 'usrid版api文件') {
            const apiAddress = [
                this.config.myServerUrl,
                "?msg=clear",
                "&usrid=" + session.userId,
                "&source=koishi-plugin-glm-bot",
            ].join("");
            return await this.ctx.http.get(apiAddress, { responseType: "text" });
        }
    }
    async chat(session, prompt) {
        logger.info(session.username + ": " + prompt);
        let res_text;
        if (this.config.type == '秋叶版api') {
            res_text = await this.fastapi(session, prompt);
        }
        else if (this.config.type == 'usrid版api文件') {
            res_text = await this.glm_t4(session, prompt);
        }
        const history = this.get_chat_session(session.userId);
        logger.info("GLM: " + res_text);
        history.push({ role: 'user', content: prompt }, { role: 'assistant', content: res_text });
        this.sessions[session.userId] = history;
        return history;
    }
    get_chat_session(sessionid) {
        if (Object.keys(this.sessions).indexOf(sessionid) == -1) {
            this.sessions[sessionid] = [];
        }
        return this.sessions[sessionid];
    }
    async fastapi(session, prompt) {
        try {
            const resp = await this.ctx.http.post(this.config.publicUrl, {
                msg: prompt,
                uid: session.userId
            });
            return resp;
        }
        catch (e) {
            logger.error(String(e));
            return String(e);
        }
    }
    async glm_t4(session, prompt) {
        try {
            const apiAddress = [
                this.config.myServerUrl,
                "?msg=" + prompt,
                "&usrid=" + session.userId,
                "&source=koishi-plugin-glm-bot",
            ].join("");
            const resp = await this.ctx.http.get(apiAddress, { responseType: "text" });
            return resp;
        }
        catch (e) {
            logger.error(String(e));
            return String(e);
        }
    }
    async glmmtg(session, text) {
        const defaultText = this.config.defaultText;
        const userText = defaultText + text;
        try {
            let response;
            if (this.config.type == '秋叶版api') {
                response = await this.fastapi(session, userText);
            }
            else if (this.config.type == 'usrid版api文件') {
                response = await this.glm_t4(session, userText);
            }
            logger.info(`glmmtg:${response}`);
            await this.clear(session);
            if (this.config.send_glmmtg_response) {
                await session.send(`${this.config.prefix} ${response}`);
            }
            await session.execute(`${this.config.prefix} "${response}"`);
        }
        catch (error) {
            logger.error(error);
        }
    }
}
(function (Glm) {
    Glm.usage = `
  chatglm对话插件，需要自己配置后端，也可以直接用其他人的api
  ### 配置说明
  - t4接口: 最多人用，自建需要安装[api.py](https://forum.koishi.xyz/t/topic/1089)文件
    - 地址示例：https://你的服务器地址/chatglm?
    - 提问词：glm
  - FastAPI接口: 有公网ip的可以用，有[教程](https://forum.koishi.xyz/t/topic/1075/)
    - 地址示例：https://公网ip/chat
  
  
  ### 问题反馈
  请到[论坛](https://forum.koishi.xyz/t/topic/1089)留言`;
    Glm.Config = koishi_1.Schema.intersect([
        koishi_1.Schema.object({
            type: koishi_1.Schema.union([
                koishi_1.Schema.const("usrid版api文件").description("t4wefan的接口"),
                koishi_1.Schema.const("秋叶版api").description("FastAPI接口"),
            ])
                .description("服务器地址选择"),
        }),
        koishi_1.Schema.union([
            koishi_1.Schema.object({
                type: koishi_1.Schema.const("usrid版api文件"),
                myServerUrl: koishi_1.Schema.string().description("t4wefan版api地址。").required(),
            }),
            koishi_1.Schema.object({
                type: koishi_1.Schema.const("秋叶版api"),
                publicUrl: koishi_1.Schema.string().description("秋叶版api服务器地址。").required(),
            }),
        ]).description('基础设置'),
        koishi_1.Schema.object({
            max_length: koishi_1.Schema.number().default(2048).description('请求长度'),
            top_p: koishi_1.Schema.number().default(0.7).description('top_p'),
            temperature: koishi_1.Schema.number().default(0.95).description('回复温度'),
            send_glmmtg_response: koishi_1.Schema.boolean()
                .description("使用glmmtg的时候是否会发送tag到会话框")
                .default(false),
            prefix: koishi_1.Schema.string().description("跑图机器人的前缀").default("rr"),
            defaultText: koishi_1.Schema.string().default(`用尽可能多的英文标签详细的描述一幅画面，
      用碎片化的单词标签而不是句子去描述这幅画，描述词尽量丰富，
      每个单词之间用逗号分隔，例如在描述白发猫娘的时候，
      你应该用: "white hair"、 "cat girl"、 "cat ears"、 "cute 
      girl"、 "beautiful"、"lovely"等英文标签词汇。你现在要描述的是:`).description('默认话术'),
            output: koishi_1.Schema.union([
                koishi_1.Schema.const('minimal').description('只发送文字消息'),
                koishi_1.Schema.const('quote').description('引用消息'),
                koishi_1.Schema.const('figure').description('以聊天记录形式发送'),
                koishi_1.Schema.const('image').description('将对话转成图片'),
                koishi_1.Schema.const('voice').description('发送语音')
            ]).description('输出方式。').default('minimal'),
        }).description('进阶设置')
    ]);
})(Glm || (Glm = {}));
exports.default = Glm;
