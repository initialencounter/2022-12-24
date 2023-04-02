"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = exports.get_access_token = exports.Config = exports.logger = exports.usage = exports.msg = exports.div_items = exports.name = void 0;
const jsx_runtime_1 = require("@satorijs/element/jsx-runtime");
const koishi_1 = require("koishi");
exports.name = 'facercg';
const headers = {
    "headers": { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64); AppleWebKit/537.36 (KHTML, like Gecko); Chrome/54.0.2840.99 Safari/537.36" }
};
const payload = {
    "image_type": "BASE64",
    "face_field": "gender,beauty",
    "max_face_num": 120,
};
const div_items = (face_arr) => {
    const style_arr = [];
    for (var i in face_arr) {
        var location = face_arr[i].location;
        var style_str = `transform: rotate(${location.rotation}deg);position: absolute;font-size: 10px;width: ${location.width}px;height: ${location.height}px;left: ${location.left}px;top: ${location.top}px;rotation: ${location.rotation}deg;background: transparent;border: 1px solid green`;
        style_arr.push(style_str);
    }
    const res = style_arr.map((style, id) => (0, jsx_runtime_1.jsxs)("div", { style: style, children: ["face", id] }));
    return res;
};
exports.div_items = div_items;
const msg = (face_arr) => {
    const msg_arr = [];
    for (var i in face_arr) {
        var gender = face_arr[i].gender;
        var beauty = face_arr[i].beauty;
        msg_arr.push(`第${i}张脸,颜值:${beauty} 性别:${gender.type}｜概率:${gender.probability}`);
    }
    const res = msg_arr.map((text, id) => (0, jsx_runtime_1.jsx)("p", { children: text }));
    return res;
};
exports.msg = msg;
exports.usage = `
## 注意事项
> 使用前在 <a href="https://console.bce.baidu.com/ai/#/ai/face/overview/index">百度智能云</a> 中获取apikey及secret_key
或者<a href="https://github.com/initialencounter/beauty-predict-server">自建服务端</a>
> 对于部署者行为及所产生的任何纠纷
Koishi 及 koishi-plugin-facercg 概不负责。
如果有更多文本内容想要修改，可以在<a href="/locales">本地化</a>中修改 zh 内容
## 效果展示
<img src = 'https://github.com/initialencounter/mykoishi/raw/main/screenshot/3-2-1.jpg'>
`;
exports.logger = new koishi_1.Logger(exports.name);
exports.Config = koishi_1.Schema.intersect([
    koishi_1.Schema.object({
        type: koishi_1.Schema.union([
            koishi_1.Schema.const('BaiduApi').description('百度api'),
            koishi_1.Schema.const('Pca').description('随机森林'),
        ]).default('BaiduApi').description('后端选择'),
    }).description('基础设置'),
    koishi_1.Schema.union([
        koishi_1.Schema.object({
            type: koishi_1.Schema.const('BaiduApi'),
            key: koishi_1.Schema.string().description('api_key').required(),
            secret_key: koishi_1.Schema.string().description('secret_key').required(),
        }),
        koishi_1.Schema.object({
            type: koishi_1.Schema.const('Pca'),
            endpoint: koishi_1.Schema.string().description('API 服务器地址。').required(),
        })
    ]),
    koishi_1.Schema.object({
        authority: koishi_1.Schema.number().description('允许使用的最低权限').default(3),
        usage: koishi_1.Schema.number().description('每人每日可用次数').default(10),
        cmd: koishi_1.Schema.string().description('触发命令').default('face')
    }).description('进阶设置')
]);
async function get_access_token(ctx, config) {
    const token_url = "https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials";
    const access_token = await (await ctx.http.axios(`${token_url}&client_id=${config.key}&&client_secret=${config.secret_key}`, headers)).data["access_token"];
    return access_token;
}
exports.get_access_token = get_access_token;
async function apply(ctx, config) {
    let access_token;
    if (config.type == 'BaiduApi') {
        access_token = await get_access_token(ctx, config); //获取token
    }
    const api_url = "https://aip.baidubce.com/rest/2.0/face/v3/detect";
    ctx.i18n.define('zh', require('./locales/zh'));
    ctx.command('facercg <prompt:text>', {
        authority: config.authority,
        maxUsage: config.usage,
        usageName: 'face'
    })
        .alias(config.cmd)
        .action(async ({ session }) => {
        session.send(session.text('.running'));
        if (session.content.indexOf('url=') == -1) {
            return session.text('.noimg');
        }
        const image = koishi_1.segment.select(session.content, "image")[0];
        const img_url = image?.attrs?.url;
        let resp;
        try {
            if (config.type == 'BaiduApi') {
                const buffer = await ctx.http.get(img_url, { responseType: 'arraybuffer', headers });
                const base64 = Buffer.from(buffer).toString('base64');
                payload["image"] = base64;
                resp = await ctx.http.post(`${api_url}?access_token=${access_token}`, payload, headers); //获取颜值评分
            }
            else {
                resp = await ctx.http.post(config.endpoint, {
                    'type': 'url',
                    'data': img_url
                });
            }
        }
        catch (err) {
            exports.logger.warn(err);
            return String(err);
        }
        if (resp["error_msg"] == "pic not has face") {
            return session.text('.noface'); //没有找到face
        }
        if (resp["error_msg"] != "SUCCESS") {
            exports.logger.warn(`错误信息: ${resp["error_msg"]}`);
            return `错误信息: ${resp["error_msg"]}`;
        }
        const face_arr = resp["result"]["face_list"];
        const div_items_ = (0, exports.div_items)(face_arr); //框出face
        const text_msg = (0, exports.msg)(face_arr); //文字消息
        //判断是否启用puppeteer
        if (ctx.puppeteer) {
            return (0, jsx_runtime_1.jsxs)("html", { children: [(0, jsx_runtime_1.jsx)("img", { src: img_url }), div_items_, (0, jsx_runtime_1.jsx)("p", { children: text_msg })] });
        }
        else {
            return text_msg;
        }
    });
}
exports.apply = apply;
