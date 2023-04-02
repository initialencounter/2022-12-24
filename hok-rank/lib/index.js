"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = exports.Config = exports.Rule = exports.usage = exports.name = void 0;
const jsx_runtime_1 = require("@satorijs/element/jsx-runtime");
const koishi_1 = require("koishi");
exports.name = 'hok-rank';
exports.usage = `
## 注意事项
作者服务器经常掉线，支持<a href=https://github.com/initialencounter/mykoishi/hok-rank">自建服务器</a>
本插件只用于体现 Koishi 部署者意志”。
对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-hok-rank 概不负责。
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
    var bgd_img = config.background_img;
    const v = new RegExp('^(?!mailto:)(?:(?:http|https|ftp)://|//)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$', 'i');
    if (!v.test(config.background_img)) {
        bgd_img = 'https://img0.baidu.com/it/u=2013803511,2814800709&fm=253&fmt=auto&app=138&f=JPEG?w=889&h=500';
    }
    ctx.command('巅峰赛').alias('巅峰榜', 'hok-rank').action(async () => {
        const json_res = await ctx.http.get(`${config.api_hostname}/get-hok`);
        const rank_IOS = json_res.rank_IOS;
        const rank_Android = json_res.rank_Android;
        const item1 = [(0, jsx_runtime_1.jsx)("div", { children: json_res.update_time }), (0, jsx_runtime_1.jsx)("div", { children: "\u738B\u8005\u8363\u8000IOS-qq\u533A\u5DC5\u5CF0\u699C" }), (0, jsx_runtime_1.jsx)("br", {})];
        console.log(rank_IOS);
        rank_IOS.forEach((i, id) => {
            item1.push((0, jsx_runtime_1.jsxs)("div", { children: [i[0], ". \u3010", i[3].split(' ')[0], "\u3011^", i[3].split(' ')[1], " ", i[2].split('|')[0]] }));
        });
        const item2 = [(0, jsx_runtime_1.jsx)("div", { children: "\u738B\u8005\u8363\u8000Android-qq\u533A\u5DC5\u5CF0\u699C" }), (0, jsx_runtime_1.jsx)("br", {})];
        rank_Android.forEach((i, id) => {
            item2.push((0, jsx_runtime_1.jsxs)("div", { children: [i[0], ". \u3010", i[3].split(' ')[0], "\u3011^", i[3].split(' ')[1], " ", i[2].split('|')[0]] }));
        });
        return (0, jsx_runtime_1.jsxs)("html", { children: [(0, jsx_runtime_1.jsx)("img", { src: bgd_img, style: 'width:600px;height:550px' }), (0, jsx_runtime_1.jsx)("div", { style: 'position: absolute;top:20px;left:20px;width:280px;', children: item1 }), (0, jsx_runtime_1.jsx)("div", { style: 'position: absolute;top:20px;left:300px;width:280px;', children: item2 })] });
    });
    ctx.on('ready', async () => {
        ctx.setInterval(async () => {
            const json_res = await ctx.http.get(`${config.api_hostname}/get-hok`);
            const rank_IOS = json_res.rank_IOS;
            const rank_Android = json_res.rank_Android;
            const item1 = [(0, jsx_runtime_1.jsx)("div", { children: json_res.update_time }), (0, jsx_runtime_1.jsx)("div", { children: "\u738B\u8005\u8363\u8000IOS-qq\u533A\u5DC5\u5CF0\u699C" }), (0, jsx_runtime_1.jsx)("br", {})];
            console.log(rank_IOS);
            rank_IOS.forEach((i, id) => {
                item1.push((0, jsx_runtime_1.jsxs)("div", { children: [i[0], ". \u3010", i[3].split(' ')[0], "\u3011^", i[3].split(' ')[1], " ", i[2].split('|')[0]] }));
            });
            const item2 = [(0, jsx_runtime_1.jsx)("div", { children: "\u738B\u8005\u8363\u8000Android-qq\u533A\u5DC5\u5CF0\u699C" }), (0, jsx_runtime_1.jsx)("br", {})];
            rank_Android.forEach((i, id) => {
                item2.push((0, jsx_runtime_1.jsxs)("div", { children: [i[0], ". \u3010", i[3].split(' ')[0], "\u3011^", i[3].split(' ')[1], " ", i[2].split('|')[0]] }));
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
                bot?.sendMessage(channelId, (0, jsx_runtime_1.jsxs)("html", { children: [(0, jsx_runtime_1.jsx)("img", { src: bgd_img, style: 'width:600px;height:550px' }), (0, jsx_runtime_1.jsx)("div", { style: 'position: absolute;top:20px;left:20px;width:280px;', children: item1 }), (0, jsx_runtime_1.jsx)("div", { style: 'position: absolute;top:20px;left:300px;width:280px;', children: item2 })] }), guildId);
            }
        }, config.interval);
    });
}
exports.apply = apply;
