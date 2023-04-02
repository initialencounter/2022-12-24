"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = exports.Config = exports.usage = exports.name = void 0;
const jsx_runtime_1 = require("@satorijs/element/jsx-runtime");
const koishi_1 = require("koishi");
const cheerios = require('cheerio');
exports.name = "steam-trading";
const logger = new koishi_1.Logger(exports.name);
exports.usage = `
## 注意事项
> 使用前在 <a href="http://www.iflow.work">iflow.work</a> 中获取cookie
本插件仅供学习参考，请勿用于商业行为
对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-steam-trading 概不负责。
如果有更多文本内容想要修改，可以在<a href="/locales">本地化</a>中修改 zh 内容
`;
exports.Config = koishi_1.Schema.object({
    Hm_lpvt_a5301d501cd73accbee89775308fdd5e: koishi_1.Schema.number().description('cookie,默认123123124,可选').default(123123124),
    text_len: koishi_1.Schema.number().default(15).description('显示条目数量'),
    ifimg: koishi_1.Schema.boolean().default(true).description('是否以图片格式发送'),
    buff: koishi_1.Schema.boolean().default(true).description('buff'),
    igxe: koishi_1.Schema.boolean().default(true).description('igxe'),
    c5: koishi_1.Schema.boolean().default(false).description('c5'),
    uupy: koishi_1.Schema.boolean().default(false).description('uuyp'),
    game: koishi_1.Schema.union([
        koishi_1.Schema.const('csgo-dota2').description('全部'),
        koishi_1.Schema.const('dota2').description('仅看dota2'),
        koishi_1.Schema.const('csgo-data2').description('仅看csgo'),
    ]).description('游戏').default('csgo-dota2'),
    order: koishi_1.Schema.union([
        koishi_1.Schema.const('buy').description('最优求购'),
        koishi_1.Schema.const('safe_buy').description('稳定求购'),
        koishi_1.Schema.const('sell').description('最优寄售'),
    ]).description('排序依据').default('safe_buy'),
    min_price: koishi_1.Schema.number().description('最低价格').default(1.0),
    max_price: koishi_1.Schema.number().description('最高价格').default(5000.0),
    min_volume: koishi_1.Schema.number().description('最低成交量').default(2),
    buy: koishi_1.Schema.boolean().default(false).description('最优求购比例'),
    safe_buy: koishi_1.Schema.boolean().default(true).description('稳定求购比例'),
    sell: koishi_1.Schema.boolean().default(true).description('寄售比例'),
});
function apply(ctx, config) {
    const buff = config.buff ? 'buff-' : '';
    const igxe = config.igxe ? 'igxe-' : '';
    const c5 = config.c5 ? 'c5-' : '';
    const uupy = config.uupy ? 'uupy-' : '';
    var platform = buff + igxe + c5 + uupy;
    if (platform.length < 3) {
        platform = 'buff-';
    }
    platform = platform.slice(0, -1);
    console.log(platform);
    ctx.i18n.define('zh', require('./locales/zh'));
    ctx.command("trad").alias('steam-trading')
        .action(async ({ session }) => {
        try {
            const url = `https://www.iflow.work/steam?platform=${platform}&game=${config.game}&order=${config.order}&pagenum=1&min_price=${config.min_price}&max_price=${config.max_price}&min_volume=${config.min_volume}`;
            const res_html = await ctx.http.get(url, { data: { 'Hm_lpvt_a5301d501cd73accbee89775308fdd5e': config.Hm_lpvt_a5301d501cd73accbee89775308fdd5e } });
            const res = get_body(res_html, config.text_len);
            const tr_items = [];
            let res_text = 'Steam 挂刀行情http://www.iflow.work\n';
            for (var i in res) {
                const buy_text = config.buy ? `最优求购比例: ${res[i][5]}` : '';
                const safe_buy_text = config.safe_buy ? `稳定求购比例: ${res[i][6]}` : '';
                const sell_text = config.sell ? `寄售比例: ${res[i][4]}` : '';
                const tr_item = (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("p", { children: [res[i][0], ". ", res[i][1]] }), (0, jsx_runtime_1.jsxs)("div", { children: ["\u65E5\u6210\u4EA4\u91CF: ", res[i][2], "  \u5E73\u53F0\u6700\u4F4E\u552E\u4EF7: ", res[i][3], " ", sell_text, " ", buy_text, " ", safe_buy_text] })] });
                res_text += `${res[i][0]}. ${res[i][1]}日成交量: ${res[i][2]}  平台最低售价: ${res[i][3]} ${sell_text} ${buy_text} ${safe_buy_text}\n\n`;
                tr_items.push(tr_item);
            }
            if (config.ifimg) {
                if (!ctx.puppeteer) {
                    session.send(session.text('commands.trad.messages.no-pptr'));
                    return res_text;
                }
                return (0, jsx_runtime_1.jsxs)("html", { children: [(0, jsx_runtime_1.jsx)("p", { children: 'Steam 挂刀行情http://www.iflow.work' }), (0, jsx_runtime_1.jsx)("tbody", { children: tr_items })] });
            }
            else {
                return res_text;
            }
        }
        catch (err) {
            logger.warn(err);
            return String(err);
        }
    });
}
exports.apply = apply;
function get_body(html_str, text_len) {
    const $ = cheerios.load(html_str);
    const tbody = $('tbody').html();
    const table_arr = tbody.split('data-id');
    const res_arr = [];
    table_arr.slice(1, text_len + 1).forEach((i, id) => {
        const td1_start = i.search('<td') + 4;
        const td1_end = i.search('</td>');
        const td1_text = i.slice(td1_start, td1_end);
        const td1_after = i.slice(td1_end + 5, -1);
        const td2_start = td1_after.search('.png">') + 6;
        const td2_end = td1_after.search('</td>');
        const td2_text = td1_after.slice(td2_start, td2_end - 10);
        const td2_after = td1_after.slice(td2_end + 5, -1);
        const td3_start = td2_after.search('<td') + 4;
        const td3_end = td2_after.search('</td>');
        const td3_text = td2_after.slice(td3_start, td3_end);
        const td3_after = td2_after.slice(td3_end + 5, -1);
        const td4_start = td3_after.search('<td') + 4;
        const td4_end = td3_after.search('</td>');
        const td4_text = td3_after.slice(td4_start, td4_end);
        const td4_after = td3_after.slice(td4_end + 5, -1);
        const td5_start = td4_after.search('>') + 1;
        const td5_end = td4_after.search('</td>');
        const td5_text = td4_after.slice(td5_start, td5_end);
        const td5_after = td4_after.slice(td5_end + 5, -1);
        const td6_start = td5_after.search('>') + 1;
        const td6_end = td5_after.search('</td>');
        const td6_text = td5_after.slice(td6_start, td6_end);
        const td6_after = td5_after.slice(td6_end + 5, -1);
        const td7_start = td6_after.search('>') + 1;
        const td7_end = td6_after.search('</td>');
        const td7_text = td6_after.slice(td7_start, td7_end);
        const td7_after = td6_after.slice(td7_end + 5, -1);
        res_arr.push([td1_text, td2_text, td3_text, td4_text, td5_text, td6_text, td7_text]);
    });
    return res_arr;
}
