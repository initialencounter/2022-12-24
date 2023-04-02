"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = exports.Config = exports.usage = exports.logger = exports.name = void 0;
const koishi_1 = require("koishi");
exports.name = 'couplet';
exports.logger = new koishi_1.Logger(exports.name);
const headers = {
    "headers": { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64); AppleWebKit/537.36 (KHTML, like Gecko); Chrome/54.0.2840.99 Safari/537.36" }
};
exports.usage = `
## 注意事项
><a href="https://seq2seq-couplet-model.rssbrain.com/v0.2/couplet/">seq2seq-couplet-model api</a>
本插件仅供学习参考，请勿用于商业行为
使用方法 示例：对对联 落霞与孤鹜齐飞
对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-couplet 概不负责。
如果有更多文本内容想要修改，可以在<a href="/locales">本地化</a>中修改 zh 内容
`;
exports.Config = koishi_1.Schema.object({
    authority: koishi_1.Schema.number().description('允许使用的最低权限').default(1),
    usage: koishi_1.Schema.number().description('每人每日可用次数').default(10),
    cmd: koishi_1.Schema.string().description('触发命令').default('cpl'),
    cpnum: koishi_1.Schema.number().description('对联生成条数').default(2)
});
async function apply(ctx, config) {
    ctx.i18n.define('zh', require('./locales/zh'));
    ctx.command('couplet <prompt:text>', 'AI对对联', {
        authority: config.authority,
        maxUsage: config.usage,
        usageName: 'couplet'
    })
        .alias(config.cmd)
        .action(async ({ session }, prompt) => {
        if (!prompt) {
            return session.text(".noargs");
        }
        session.send(session.text('.running'));
        const api_url = "https://seq2seq-couplet-model.rssbrain.com/v0.2/couplet/";
        try {
            const resp = await ctx.http.get(`${api_url}{state["${prompt}"]}`, headers); //获取对联
            const couplet_list = resp.output;
            var msg = `上联:\n➤${prompt}\n下联:\n`;
            for (var i = 1; i < config.cpnum + 1; i++) {
                var out_put = couplet_list[couplet_list.length - i];
                msg += '➤' + out_put + '\n';
            }
            return msg;
        }
        catch (err) {
            exports.logger.warn(err);
            return String(err);
        }
    });
}
exports.apply = apply;
