"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = exports.getContent = exports.img2base64 = exports.prompt_parse = exports.findInfo = exports.isChinese = exports.Config = exports.name = void 0;
const koishi_1 = require("koishi");
exports.name = 'sd-taylor';
const headers = {
    "headers": { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64); AppleWebKit/537.36 (KHTML, like Gecko); Chrome/54.0.2840.99 Safari/537.36" }
};
const logger = new koishi_1.Logger(exports.name);
exports.Config = koishi_1.Schema.object({
    api_path: koishi_1.Schema.string().description('服务器地址').required(),
    min_auth: koishi_1.Schema.number().description('最低使用权限').default(1),
    cmd: koishi_1.Schema.string().default('tl').description('触发词'),
    step: koishi_1.Schema.number().default(20).description('采样步数0-100'),
    denoising_strength: koishi_1.Schema.number().default(0.5).description('改变强度0-1'),
    seed: koishi_1.Schema.number().default(-1).description('种子'),
    maxConcurrency: koishi_1.Schema.number().default(3).description('最大排队数'),
    negative_prompt: koishi_1.Schema.string().description('反向提示词').default('nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry'),
    defaut_prompt: koishi_1.Schema.string().default('masterpiece, best quality').description('默认提示词'),
    resolution: koishi_1.Schema.string().default('720x512').description('默认比例'),
    cfg_scale: koishi_1.Schema.number().default(15).description('相关性0-20'),
    output: koishi_1.Schema.union([
        koishi_1.Schema.const('minimal').description('只发送图片'),
        koishi_1.Schema.const('default').description('发送图片和关键信息'),
        koishi_1.Schema.const('verbose').description('发送全部信息'),
    ]).description('输出方式。').default('default')
});
function isChinese(s) {
    return /[\u4e00-\u9fa5]/.test(s);
}
exports.isChinese = isChinese;
function findInfo(s, ss) {
    const id1 = s.indexOf(ss + ': ');
    const sss = s.slice(id1, -1);
    const id3 = sss.indexOf(',');
    const id2 = sss.indexOf(' ');
    const res = sss.slice(id2 + 1, id3);
    return res;
}
exports.findInfo = findInfo;
function prompt_parse(s) {
    if (s.indexOf('<image file="') != -1) {
        const id1 = s.indexOf('<image file="');
        const id2 = s.indexOf('"/>');
        const imgstr = s.slice(id1, id2 + 3);
        const res = s.replace(imgstr, '');
        // console.log(s,id1,id2,imgstr)
        return res;
    }
    return s;
}
exports.prompt_parse = prompt_parse;
async function img2base64(ctx, img_url) {
    const buffer = await ctx.http.get(img_url, { responseType: 'arraybuffer', headers });
    const base64 = Buffer.from(buffer).toString('base64');
    return base64;
}
exports.img2base64 = img2base64;
function getContent(output, session, args, info, res_img, init_img) {
    if (output === 'minimal') {
        if (res_img == ' ') {
            return args;
        }
        else {
            return koishi_1.segment.image(res_img);
        }
    }
    const attrs = {
        userId: session.userId,
        nickname: session.author?.nickname || session.username,
    };
    const result = (0, koishi_1.segment)('figure');
    result.children.push((0, koishi_1.segment)('message', attrs, args));
    if (init_img != ' ') {
        result.children.push((0, koishi_1.segment)('message', attrs, '原图:'));
        result.children.push((0, koishi_1.segment)('message', attrs, koishi_1.segment.image(init_img)));
    }
    if (res_img != ' ') {
        result.children.push((0, koishi_1.segment)('message', attrs, '结果:'));
        result.children.push((0, koishi_1.segment)('message', attrs, koishi_1.segment.image(res_img)));
    }
    if (output === 'verbose') {
        result.children.push((0, koishi_1.segment)('message', attrs, `info = ${info}`));
    }
    return result;
}
exports.getContent = getContent;
function apply(ctx, config) {
    ctx.i18n.define('zh', require('./locales/zh'));
    const tasks = Object.create(null);
    const globalTasks = new Set();
    // {
    // }
    ctx.command('taylor <prompt:text>', { authority: config.min_auth })
        .alias(config.cmd)
        .option('step', '--st <step:number>', { fallback: config.step })
        .option('denoising_strength', '-d <denoising_strength:number>', { fallback: config.denoising_strength })
        .option('seed', '--sd <seed:number>', { fallback: config.seed })
        .option('negative_prompt', '-n <negative_prompt:string>', { fallback: config.negative_prompt })
        .option('resolution', '-r <resolution:string>', { fallback: config.resolution })
        .option('cfg_scale', '-c <cfg_scale:number>', { fallback: config.cfg_scale })
        .option('extras', '-e <extras:string>')
        .option('crop', '-C, --no-crop', { value: false, fallback: true })
        .option('upscaler', '-1 <upscaler>', { fallback: 'None' })
        .option('upscaler2', '-2 <upscaler2>', { fallback: 'None' })
        .option('visibility', '-v <visibility:number>', { fallback: 1 })
        .option('upscaleFirst', '-f', { fallback: false })
        .option('output', '-o', { type: ['minimal', 'default', 'verbose'], fallback: config.output })
        .action(async ({ session, options }, prompt) => {
        var _a;
        if (!prompt?.trim()) {
            return session.text('.no-args');
        }
        const prompt_text = prompt_parse(prompt);
        // console.log(prompt_text)
        const id = Math.random().toString(36).slice(2);
        if (config.maxConcurrency) {
            const store = tasks[_a = session.cid] || (tasks[_a] = new Set());
            if (store.size >= config.maxConcurrency) {
                return session.text('.concurrent-jobs');
            }
            else {
                store.add(id);
            }
        }
        if (options.step > 100) {
            return session.text('.bad-step');
        }
        globalTasks.add(id);
        const cleanUp = () => {
            tasks[session.cid]?.delete(id);
            globalTasks.delete(id);
        };
        var api;
        var img_url;
        const [width, height] = options.resolution.split('x').map(Number);
        // 设置参数
        const payload = {
            "steps": options.step,
            "width": width,
            "height": height,
            "seed": options.seed,
            "cfg_scale": options.cfg_scale,
            "negative_prompt": options.negative_prompt,
            "denoising_strength": options.denoising_strength,
            "prompt": prompt_text + ', ' + config.defaut_prompt
        };
        // 中文检查
        if (isChinese(prompt_text)) {
            return session.text('.latin-only');
        }
        //判断api
        if (session.content.indexOf('<image file="') == -1) { //------------------------------txt2img 文字绘图
            api = '/sdapi/v1/txt2img';
            payload["negative_prompt"] = options.negative_prompt;
            session.send(session.text('.waiting'));
            // 调用sdweb-ui的api
            // console.log(`${config.api_path}${api}`)
            try {
                const resp = await ctx.http.post(`${config.api_path}${api}`, payload, headers);
                const res_img = "data:image/png;base64," + resp.images[0];
                const args = session.text('.args', [prompt_text, width, height, options.step, findInfo(resp.info, 'Seed'), options.cfg_scale]);
                const info = resp.info;
                const init_img = ' ';
                cleanUp();
                return getContent(options.output, session, args, info, res_img, init_img);
            }
            catch (err) {
                logger.warn(err);
                cleanUp();
                return String(err);
            }
        }
        else { //---------------------------------------------------------------extra-single-image 图片超分辨率
            // url提取拼接
            var regexp = /url="[^,]+"/;
            img_url = session.content.match(regexp)[0].slice(5, -1);
            // 将图片url转化成base64数据
            if (!prompt_text) {
                if (options.extras) {
                    session.send(session.text('.waiting'));
                    const base64 = await img2base64(ctx, img_url);
                    const payload_extras = {
                        "image": "data:image/png;base64," + base64,
                        "resize_mode": 1,
                        "show_extras_results": true,
                        "upscaling_resize": 2,
                        "upscaling_resize_w": width,
                        "upscaling_resize_h": height,
                        "upscaling_crop": options.crop,
                        "upscaler_1": options.upscaler,
                        "upscaler_2": options.upscaler2,
                        "extras_upscaler_2_visibility": options.visibility,
                        "upscale_first": options.upscaleFirst,
                    };
                    // logger.warn(payload_extras)
                    try {
                        const resp = await ctx.http.post(`${config.api_path}/sdapi/v1/extra-single-image`, payload_extras);
                        const res_img = 'data:image/png;base64,' + resp.image;
                        const args = resp.html_info;
                        const info = ' ';
                        const init_img = 'data:image/png;base64,' + base64;
                        cleanUp();
                        return getContent(options.output, session, args, info, res_img, init_img);
                    }
                    catch (err) {
                        logger.warn(err);
                        cleanUp();
                        return String(err);
                    }
                }
                else { //----------------------------------------------------------------------interrogate 图片转文字
                    session.send(session.text('.interrogate'));
                    const base64 = await img2base64(ctx, img_url);
                    try {
                        const resp = await ctx.http.post(`${config.api_path}/sdapi/v1/interrogate`, { "image": "data:image/png;base64," + base64 });
                        const init_img = 'data:image/png;base64,' + base64;
                        const args = resp.caption;
                        const info = '';
                        const res_img = ' ';
                        cleanUp();
                        return getContent(options.output, session, args, info, res_img, init_img);
                    }
                    catch (err) {
                        logger.warn(err);
                        cleanUp();
                        return String(err);
                    }
                }
            }
            else { //-------------------------------------------------------------------------img2img 以图绘图
                api = '/sdapi/v1/img2img';
                session.send(session.text('.waiting'));
                const base64 = await img2base64(ctx, img_url);
                // 设置payload
                payload["init_images"] = ["data:image/png;base64," + base64];
                try {
                    const resp = await ctx.http.post(`${config.api_path}${api}`, payload, headers);
                    const args = session.text('.args', [prompt_text, width, height, options.step, findInfo(resp.info, 'Seed'), options.cfg_scale]);
                    const info = resp.info;
                    const init_img = "data:image/png;base64," + base64;
                    const res_img = 'data:image/png;base64,' + resp.images[0];
                    logger.warn(res_img);
                    cleanUp();
                    // return '1'
                    return getContent(options.output, session, args, info, res_img, init_img);
                }
                catch (err) {
                    logger.warn(err);
                    cleanUp();
                    return String(err);
                }
            }
        }
    });
}
exports.apply = apply;
