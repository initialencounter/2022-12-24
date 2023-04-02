"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = exports.Config = exports.Rule = exports.usage = exports.name = void 0;
const jsx_runtime_1 = require("@satorijs/element/jsx-runtime");
const koishi_1 = require("koishi");
exports.name = 'mswar-active-rank';
exports.usage = `
## 注意事项
> 建议使用前玩一局[扫雷联萌](http://tapsss.com)
作者服务器经常掉线，支持<a href=https://github.com/initialencounter/mykoishi/smear_rank">自建服务器</a>
本插件只用于体现 Koishi 部署者意志”。
对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-mswar-active-rank 概不负责。
如果有更多文本内容想要修改，可以在<a href="/locales">本地化</a>中修改 zh 内容
`;
exports.Rule = koishi_1.Schema.object({
    platform: koishi_1.Schema.string().description('平台名称。').required(),
    channelId: koishi_1.Schema.string().description('频道 ID。').required(),
    guildId: koishi_1.Schema.string().description('群组 ID。'),
    selfId: koishi_1.Schema.string().description('机器人 ID。'),
});
exports.Config = koishi_1.Schema.object({
    api_hostname: koishi_1.Schema.string().description('自建服务器地址').default('http://116.205.167.54:5140'),
    rules: koishi_1.Schema.array(exports.Rule).description('推送规则。'),
    interval: koishi_1.Schema.number().default(koishi_1.Time.minute * 30).description('轮询间隔 (毫秒)。'),
    background_img: koishi_1.Schema.string().default('https://img0.baidu.com/it/u=2013803511,2814800709&fm=253&fmt=auto&app=138&f=JPEG?w=889&h=500').description('背景图片url,http开头:'),
    border: koishi_1.Schema.string().default('&').description('边界')
});
function apply(ctx, config) {
    const url = `${config.api_hostname}/get`;
    var bgd_img = config.background_img;
    const v = new RegExp('^(?!mailto:)(?:(?:http|https|ftp)://|//)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$', 'i');
    if (!v.test(config.background_img)) {
        bgd_img = 'https://img0.baidu.com/it/u=2013803511,2814800709&fm=253&fmt=auto&app=138&f=JPEG?w=889&h=500';
    }
    ctx.command('扫雷活跃榜').alias('ms-ac').action(async () => {
        const json_res = await ctx.http.get(url);
        const today_rank_ms = json_res.mine_rank['今日']['高级'];
        const today_rank_pz = json_res.puzzle_rank['今日']['4x4'];
        const item1 = [(0, jsx_runtime_1.jsx)("div", { children: "\u626B\u96F7\u8054\u840Ctapsss.com" }), (0, jsx_runtime_1.jsx)("div", { children: "\u626B\u96F7\u9AD8\u7EA7\u65E5\u699C" }), (0, jsx_runtime_1.jsx)("br", {})];
        today_rank_ms.forEach((i, id) => {
            item1.push((0, jsx_runtime_1.jsxs)("div", { children: [i[0], ". ", i[1], " ", i[3]] }));
        });
        const item2 = [(0, jsx_runtime_1.jsx)("div", { children: json_res.update_time }), (0, jsx_runtime_1.jsx)("div", { children: "15p\u65E5\u699C" }), (0, jsx_runtime_1.jsx)("br", {})];
        today_rank_pz.forEach((i, id) => {
            item2.push((0, jsx_runtime_1.jsxs)("div", { children: ["|", config.border, "|", i[0], ". ", i[1], " ", i[3]] }));
        });
        return (0, jsx_runtime_1.jsxs)("html", { children: [(0, jsx_runtime_1.jsx)("img", { src: bgd_img, style: 'width:400px;height:550px' }), (0, jsx_runtime_1.jsx)("div", { style: 'position: absolute;top:20px;left:20px;width:200px;', children: item1 }), (0, jsx_runtime_1.jsx)("div", { style: 'position: absolute;top:20px;left:220px;width:200px;', children: item2 })] });
    });
    ctx.on('ready', async () => {
        ctx.setInterval(async () => {
            const json_res = await ctx.http.get(url);
            const today_rank_ms = json_res.mine_rank['今日']['高级'];
            const today_rank_pz = json_res.puzzle_rank['今日']['4x4'];
            const item1 = [(0, jsx_runtime_1.jsx)("div", { children: "\u626B\u96F7\u8054\u840Ctapsss.com" }), (0, jsx_runtime_1.jsx)("div", { children: "\u626B\u96F7\u9AD8\u7EA7\u65E5\u699C" }), (0, jsx_runtime_1.jsx)("br", {})];
            today_rank_ms.forEach((i, id) => {
                item1.push((0, jsx_runtime_1.jsxs)("div", { children: [i[0], ". ", i[1], " ", i[3]] }));
            });
            const item2 = [(0, jsx_runtime_1.jsxs)("div", { children: ["|", config.border, "|", json_res.update_time] }), (0, jsx_runtime_1.jsxs)("div", { children: ["|", config.border, "|15p\u65E5\u699C"] }), (0, jsx_runtime_1.jsx)("br", {})];
            today_rank_pz.forEach((i, id) => {
                item2.push((0, jsx_runtime_1.jsxs)("div", { children: ["|", config.border, "|", i[0], ". ", i[1], " ", i[3]] }));
            });
            for (let { channelId, platform, selfId, guildId } of config.rules) {
                if (!selfId) {
                    const channel = await ctx.database.getChannel(platform, channelId, ['assignee', 'guildId']);
                    if (!channel || !channel.assignee)
                        return;
                    selfId = channel.assignee;
                    guildId = channel.guildId;
                }
                const bot = ctx.bots[`${platform}:${selfId}`];
                bot?.sendMessage(channelId, (0, jsx_runtime_1.jsxs)("html", { children: [(0, jsx_runtime_1.jsx)("img", { src: bgd_img, style: 'width:400px;height:550px' }), (0, jsx_runtime_1.jsx)("div", { style: 'position: absolute;top:20px;left:20px;width:200px;', children: item1 }), (0, jsx_runtime_1.jsx)("div", { style: 'position: absolute;top:20px;left:220px;width:200px;', children: item2 })] }), guildId);
            }
        }, config.interval);
    });
}
exports.apply = apply;
