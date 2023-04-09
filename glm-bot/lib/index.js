"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.name = void 0;
const koishi_1 = require("koishi");
exports.name = "glm-bot";
const logger = new koishi_1.Logger("glm-testbot");
class Glm {
    constructor(ctx, config) {
        this.ctx = ctx;
        this.config = config;
        this.memory_id = this.mathRandomInt(1, 1000000);
        this.chat_id = this.mathRandomInt(1, 1000000);
        this.sessions = {};
        ctx.command("glm", "向chatglm提问")
            .usage("进阶：输入'glm 重置记忆 '即可将记忆清零")
            .action(async ({ session }, ...args) => this.split_by_type(session, args));
        ctx.command("glmmtg <text:text>", "输入你想画的画面，发送给ChatGLM，让ChatGLM来帮你写tag")
            .usage(`请确保当前聊天环境存在rryth或novelai插件
     使用例子：glmmtg 阳光沙滩`)
            .action(async ({ session }, text) => this.glmmtg(session, text));
    }
    async split_by_type(session, args = null) {
        if (this.config.type == 'official') {
            return this.official(session, args);
        }
        else if (this.config.type == '秋叶版api') {
            return this.glm2(args[0]);
        }
        else if (this.config.type == 'usrid版api文件') {
            return this.glm_t4(session, args);
        }
    }
    async official(session, msg) {
        const history = this.get_session(session.userId);
        const resp = await this.ctx.http.post(this.config.endpoint, {
            msg: msg,
            id: session.userId
            // max_length: this.config.max_length,
            // top_p: this.config.top_p,
            // temperature: this.config.temperature
        });
        return resp.response;
    }
    get_session(session_userid) {
        if (!this.sessions[session_userid]) {
            this.sessions[session_userid] = [];
        }
        return this.sessions[session_userid];
    }
    async glm_t4(session, args) {
        if (args[0] == "重置记忆" || args[0] == "重置对话") {
            await session.send("已重置全局记忆");
            this.memory_id += 2;
        }
        else {
            const apiAddress = [
                this.config.myServerUrl,
                "msg=" + args[0],
                "&usrid=|public",
                "|channel_id=" + session.channelId,
                "|usr_id=" + session.userId,
                "|secret=" + this.memory_id,
            ].join("");
            return await this.ctx.http.get(apiAddress, { responseType: "text" });
        }
    }
    async glm2(msg) {
        const res = await this.ctx.http.post(this.config.publicUrl, {
            msg: msg,
        });
        return res;
    }
    async glmmtg(session, text) {
        const apiAddress = this.config.myServerUrl + "chatglm?msg=";
        const defaultText = "用尽可能多的英文标签详细的描述一幅画面，用碎片化的单词标签而不是句子去描述这幅画，描述词尽量丰富，每个单词之间用逗号分隔，例如在描述白发猫娘的时候，你应该用：white hair，cat girl，cat ears，cute，girl，beautiful，lovely等英文标签词汇。你现在要描述的是：";
        const userText = defaultText + text;
        const session_id = [
            "&source=blockly_public",
            "&usrid=|channel_id=",
            session.channelId,
            "|user_id=",
            session.userId,
            "|chat_id=",
            this.chat_id,
        ];
        try {
            const response = await this.ctx.http.get(apiAddress + userText + session_id);
            if (this.config.send_glmmtg_response) {
                await session.send(`${this.config.prefix} ${response}`);
            }
            await session.execute(`${this.config.prefix} "${response}"`);
            await this.ctx.http.get(apiAddress + "clear" + session_id, {
                responseType: "text",
            });
            console.log(response);
        }
        catch (error) {
            logger.error(error);
        }
    }
    mathRandomInt(a, b) {
        if (a > b) {
            var c = a;
            a = b;
            b = c;
        }
        return Math.floor(Math.random() * (b - a + 1) + a);
    }
}
(function (Glm) {
    Glm.usage = `
  chatglm对话插件，需要自己配置后端，也可以直接用其他人的api
  ### 配置说明
  - t4版服务器地址: 最多人用，自建需要安装[api.py](https://forum.koishi.xyz/t/topic/1089)文件
    - 地址示例：https://你的服务器地址/chatglm?
    - 提问词：glm
  - 秋叶版服务器地址: 适配秋叶一键包的api，有公网ip的可以用，有[教程](https://forum.koishi.xyz/t/topic/1075/)
    - 地址示例：https://公网ip/chat
    - 提问词：glms
  
    
  
  ### 问题反馈
  请到[论坛](https://forum.koishi.xyz/t/topic/1089)留言`;
    Glm.Config = koishi_1.Schema.intersect([
        koishi_1.Schema.object({
            type: koishi_1.Schema.union([
                koishi_1.Schema.const("official").description("官方API"),
                koishi_1.Schema.const("usrid版api文件").description("usrid版api文件"),
                koishi_1.Schema.const("秋叶版api").description("秋叶版api文件"),
            ])
                .default("usrid版api文件")
                .description("服务器地址选择"),
        }).description("基础设置"),
        koishi_1.Schema.union([
            koishi_1.Schema.object({
                type: koishi_1.Schema.const("official"),
                endpoint: koishi_1.Schema.string().description("API 服务器地址。").required(),
            }),
            koishi_1.Schema.object({
                type: koishi_1.Schema.const("usrid版api文件"),
                myServerUrl: koishi_1.Schema.string().description("API 服务器地址。").required(),
                send_glmmtg_response: koishi_1.Schema.boolean()
                    .description("使用glmmtg的时候是否会发送tag到会话框")
                    .default(false),
                prefix: koishi_1.Schema.string().description("跑图机器人的前缀").default("rr"),
            }),
            koishi_1.Schema.object({
                type: koishi_1.Schema.const("秋叶版api"),
                publicUrl: koishi_1.Schema.string().description("API 服务器地址。").required(),
            }),
            koishi_1.Schema.object({
                max_length: koishi_1.Schema.number().default(2048).description('请求长度'),
                top_p: koishi_1.Schema.number().default(0.7).description('top_p'),
                temperature: koishi_1.Schema.number().default(0.95).description('回复温度')
            })
        ]),
    ]);
})(Glm || (Glm = {}));
exports.default = Glm;
