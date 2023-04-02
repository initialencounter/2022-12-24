"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.name = void 0;
const koishi_1 = require("koishi");
exports.name = 'arcadia';
exports.logger = new koishi_1.Logger(exports.name);
const crypto = __importStar(require("crypto"));
const waiting_text = [
    "轻舟已过万重山",
    "绘就一幅幅佳作",
    "画笔挥洒梦中场",
    "画卷绵延绘不尽",
    "手扶画笔意已浓",
    "清晨挥毫墨，独倚窗前思。",
    "笔走龙蛇意，丹青妙不已。",
    "长夜凝神笔，酝酿艺术潜。",
    "鳌首龙身鳞甲缀，舞动云霄展威仪。",
    "蜚蠊积羽翼，刻画成玲珑。",
    "瑶池藏八卦，神工巧无双。",
    "伏羲画图，神秘难穷透。",
    "方寸起宏图，天机妙不渝。",
    "绘图太古雅，山海凝真粹。",
    "璀璨华彩，莫及万物之灵动。",
    "山高水长绝壁间",
    "灵犀一指，艺术超脱"
];
class Arcadia extends koishi_1.Service {
    ;
    // steps_mode: number
    constructor(ctx, config) {
        super(ctx, 'arca', true);
        this.config = config;
        this.output_type = this.config.output_type;
        this.engine = this.config.engine;
        this.style = this.config.style;
        this.ratio = this.config.ratio;
        ctx.i18n.define('zh', require('./locales/zh'));
        ctx.command('arcadia <prompt:text>', '意间Ai绘画,关键词，长度限制为500，关键词的分割用英文逗号，不要用+号。\n    项目地址：https://github.com/initialencounter/mykoishi/blob/main/arcadia#readme.md\n    意间AI：http://open.yjai.art/openai-painting', {
            authority: this.config.authority,
            maxUsage: this.config.usage,
            usageName: 'ai'
        }).option('ratio', '-r <0是4 : 3, 1是3 : 4, 2是正方形, 3是16 : 9, 4是9 : 16:number>')
            .option('engine', '-e <stable_diffusion（通用） acgn_diffusion（动漫）新动漫引擎 ：anything_diffusio\n    3D建模风格：redshift_novelai_sd_merge_diffusion 艺术感强化引擎：mid_stable_diffusion\n    剪纸艺术引擎：paper_cut_engine 真实感照片引擎：photoreal_engine:string>')
            .option('style', '-s <风格字段,发送arca.style查看:string>')
            .option('guidence_scale', '-g <引导力:number>')
            .option('enable_face_enhance', '-f <面部强化:booleam>')
            .option('is_last_layer_skip', '-l <色彩强化:booleam>')
            .alias(this.config.cmd, 'arca', 'yjai').action(({ session, options }, prompt) => this.PostOpenApi(session, {
            apikey: this.config.apikey,
            prompt: prompt,
            engine: options.engine ? options.engine : this.config.engine,
            ratio: options.ratio ? options.ratio : this.ratio,
            style: options.style ? options.style : this.style,
            guidence_scale: this.config.guidence_scale,
            enable_face_enhance: options.enable_face_enhance ? options.enable_face_enhance : this.config.enable_face_enhance,
            is_last_layer_skip: options.is_last_layer_skip ? options.is_last_layer_skip : this.config.is_last_layer_skip,
            // steps_mode:this.config.steps_mode
        }));
        ctx.command('arca.show', '查寻任务').action(({ session }, prompt) => this.show_tasks(session, prompt));
        ctx.command('arca.style <type:string>', '切换arcadia的风格画家').action(async ({ session }, type) => this.switch_style(session, type));
        ctx.command('arca.engine <type:string>', '切换arcadia的绘画引擎').action(async ({ session }, type) => this.switch_engine(session, type));
        ctx.command('arca.score', '查寻积分').action(async ({ session }) => this.get_score(session));
        ctx.command('arca.all', '查寻10个任务').action(async ({ session }) => this.get_complete_tasks(session));
        ctx.command('arca.output', '查寻10个任务').action(async ({ session }, type) => this.switch_output(session, type));
    }
    async PostOpenApi(sesssion, payload) {
        sesssion.send(waiting_text[Math.floor((Math.random() * waiting_text.length))]);
        const now = `${Math.floor(Date.now() / 1000)}`;
        payload['timestamp'] = now;
        // 得到签名
        const sign = this.getSign(payload);
        const headers = {
            "sign": sign,
            "Content-Type": "application/x-www-form-urlencoded"
        };
        // 超时时间
        const timeout = 10 * 1000;
        const res = (await this.ctx.http.axios({
            url: this.config.api_path,
            method: 'POST',
            headers: headers,
            data: payload,
            timeout: timeout
        })).data;
        console.log(res);
        const Uuid = res.data.Uuid;
        if (!Uuid) {
            return sesssion.text('commands.arca.messages.err') + res.reason;
        }
        this.score = res.data.User.Score;
        let msg = await this.get_tasks(res.data.Uuid);
        let count = 0;
        while (!msg || count < 5) {
            msg = await this.get_tasks(res.data.Uuid);
            count++;
        }
        return this.getContent(this.output_type, sesssion.userId, [msg.data]);
    }
    async get_tasks(uuid) {
        const url = "http://api.yjai.art:8080/painting-open-api/site/show_task_detail";
        // 请求时的时间戳秒数
        const now = `${Math.floor(Date.now() / 1000)}`;
        const payload = {
            apikey: this.config.apikey,
            uuid: uuid,
            timestamp: now
        };
        const config = {
            method: 'POST',
            url: url,
            headers: {
                sign: this.getSign(payload),
                "Content-Type": "application/x-www-form-urlencoded"
            },
            data: payload
        };
        const res = await (await this.ctx.http.axios(config)).data;
        const image_path = res.data.ImagePath;
        console.log(res);
        if (!image_path) {
            return false;
        }
        return res;
    }
    async show_tasks(session, uuid) {
        const url = "http://api.yjai.art:8080/painting-open-api/site/show_task_detail";
        // 请求时的时间戳秒数
        const now = `${Math.floor(Date.now() / 1000)}`;
        const payload = {
            apikey: this.config.apikey,
            uuid: uuid,
            timestamp: now
        };
        const config = {
            method: 'POST',
            url: url,
            headers: {
                sign: this.getSign(payload),
                "Content-Type": "application/x-www-form-urlencoded"
            },
            data: payload
        };
        const res = await (await this.ctx.http.axios(config)).data;
        const image_path = res.data.ImagePath;
        console.log(res);
        if (!image_path) {
            return '未画好，请稍后发送 "show <uuid>" 查看';
        }
        return this.getContent('default', session.userId, [res.data]);
    }
    async switch_style(session, type) {
        const type_arr = [
            '新海诚',
            '水彩绘画',
            '真实感照片',
            '剪纸艺术',
            '保罗·塞尚',
            '村上隆',
            '穆夏',
            "毕加索",
            "梵高",
            '托马斯·科尔',
            '赛博朋克',
            '中国画',
            '蒸汽波',
            '莫奈',
            '二次元色彩大师',
            '经典动漫',
            '油画'
        ];
        if (!type) {
            let type_str = '\n';
            type_arr.forEach((i, id) => {
                type_str += String(id + 1) + ' ' + i + '\n';
            });
            session.send(session.text('commands.arca.messages.switch-style', [type_str]));
            const input = await session.prompt();
            if (!input || Number.isNaN(+input))
                return '请输入正确的序号。';
            const index = parseInt(input) - 1;
            if (0 > index && index > type_arr.length - 1)
                return '请输入正确的序号。';
            this.style = type_arr[index];
            return '风格画家切换成功: ' + this.style;
        }
        else {
            if (type_arr.includes(type)) {
                this.style = type;
                return '风格画家切换成功: ' + this.style;
            }
            else {
                let type_str = '\n';
                type_arr.forEach((i, id) => {
                    type_str += String(id + 1) + ' ' + i + '\n';
                });
                session.send(session.text('commands.arca.messages.switch-style', [type_str]));
                const input = await session.prompt();
                if (!input || Number.isNaN(+input))
                    return '请输入正确的序号。';
                const index = parseInt(input) - 1;
                if (0 > index && index > type_arr.length - 1)
                    return '请输入正确的序号。';
                this.style = type_arr[index];
                return '风格画家切换成功: ' + this.style;
            }
        }
    }
    async switch_engine(session, type) {
        const type_arr = [
            '彩色鸡尾酒',
            '通用',
            '动漫',
            '新动漫',
            '3D建模风格',
            '艺术感强化',
            '剪纸艺术',
        ];
        const type_dict = {
            '彩色鸡尾酒': 'colorfulcocktail_diffusion',
            '通用': 'stable_diffusion',
            '动漫': 'acgn_diffusion',
            '新动漫': 'anything_diffusion',
            '3D建模风格': 'redshift_novelai_sd_merge_diffusion',
            '艺术感强化': 'mid_diffusion',
            '剪纸艺术': 'paper_cut_engine',
        };
        if (!type) {
            let type_str = '\n';
            type_arr.forEach((i, id) => {
                type_str += String(id + 1) + ' ' + i + '\n';
            });
            session.send(session.text('commands.arca.messages.switch-engine', [type_str]));
            const input = await session.prompt();
            if (!input || Number.isNaN(+input))
                return '请输入正确的序号。';
            const index = parseInt(input) - 1;
            if (0 > index && index > type_arr.length - 1)
                return '请输入正确的序号。';
            this.engine = type_dict[type_arr[index]];
            return '绘画引擎切换成功: ' + type_arr[index];
        }
        else {
            if (type_arr.includes(type)) {
                this.engine = type_dict[type];
                return '绘画引擎切换成功: ' + type;
            }
            else {
                let type_str = '\n';
                type_arr.forEach((i, id) => {
                    type_str += String(id + 1) + ' ' + i + '\n';
                });
                session.send(session.text('commands.arca.messages.switch-engine', [type_str]));
                const input = await session.prompt();
                if (!input || Number.isNaN(+input))
                    return '请输入正确的序号。';
                const index = parseInt(input) - 1;
                if (0 > index && index > type_arr.length - 1)
                    return '请输入正确的序号。';
                this.engine = type_dict[type_arr[index]];
                return '绘画引擎切换成功: ' + type_arr[index];
            }
        }
    }
    async get_score(session) {
        const url = 'http://api.yjai.art:8080/painting-open-api/site/show_complete_tasks';
        const now = `${Math.floor(Date.now() / 1000)}`;
        const payload = {
            page: 1,
            page_size: 10,
            apikey: this.config.apikey,
            timestamp: now
        };
        const config = {
            method: 'POST',
            url: url,
            headers: {
                sign: this.getSign(payload),
                "Content-Type": "application/x-www-form-urlencoded"
            },
            data: payload
        };
        const res = await (await this.ctx.http.axios(config)).data;
        this.score = res.data.data[res.data.data.length - 1].User.Score;
        const score = this.score ? String(this.score) : '未知';
        return session.text('commands.arca.messages.total_available', [score]);
    }
    async get_complete_tasks(session) {
        const url = 'http://api.yjai.art:8080/painting-open-api/site/show_complete_tasks';
        const now = `${Math.floor(Date.now() / 1000)}`;
        const payload = {
            page: 1,
            page_size: 10,
            apikey: this.config.apikey,
            timestamp: now
        };
        const config = {
            method: 'POST',
            url: url,
            headers: {
                sign: this.getSign(payload),
                "Content-Type": "application/x-www-form-urlencoded"
            },
            data: payload
        };
        const res = await (await this.ctx.http.axios(config)).data;
        console.log(res.data);
        this.score = res.data.data[res.data.data.length - 1].User.Score;
        const msgs = [];
        for (var i of res.data.data) {
            msgs.push(i);
        }
        return this.getContent('any', session.userId, msgs);
    }
    async switch_output(session, type) {
        const type_arr = ['any', 'default', 'verbose', 'minimal'];
        if (!type) {
            let type_str = '\n';
            type_arr.forEach((i, id) => {
                type_str += String(id + 1) + ' ' + i + '\n';
            });
            session.send(session.text('commands.arca.messages.switch-output', [type_str]));
            const input = await session.prompt();
            if (!input || Number.isNaN(+input))
                return '请输入正确的序号。';
            const index = parseInt(input) - 1;
            if (0 > index && index > type_arr.length - 1)
                return '请输入正确的序号。';
            this.output_type = type_arr[index];
            return '输出模式切换成功: ' + this.output_type;
        }
        else {
            if (type_arr.includes(type)) {
                this.output_type = type;
                return '输出模式切换成功: ' + this.output_type;
            }
            else {
                let type_str = '\n';
                type_arr.forEach((i, id) => {
                    type_str += String(id + 1) + ' ' + i + '\n';
                });
                session.send(session.text('commands.arca.messages.switch-output', [type_str]));
                const input = await session.prompt();
                if (!input || Number.isNaN(+input))
                    return '请输入正确的序号。';
                const index = parseInt(input) - 1;
                if (0 > index && index > type_arr.length - 1)
                    return '请输入正确的序号。';
                this.output_type = type_arr[index];
                return '输出模式切换成功: ' + this.output_type;
            }
        }
    }
    async getContent(type, userId, msgs) {
        const attrs = {
            userId: userId,
            nickname: '意间AI'
        };
        const result = (0, koishi_1.segment)('figure');
        if (type == 'minimal') {
            return koishi_1.segment.image(msgs[0].ImagePath);
        }
        else if (type == 'default') {
            for (var msg of msgs) {
                result.children.push((0, koishi_1.segment)('message', attrs, `任务uuid:${msg.Uuid}\n图片地址:${msg.ImagePath}`));
                result.children.push((0, koishi_1.segment)('message', attrs, koishi_1.segment.image(msg.ImagePath)));
            }
            return result;
        }
        else if (type == 'verbose') {
            for (var msg of msgs) {
                result.children.push((0, koishi_1.segment)('message', attrs, JSON.stringify(msg)));
                result.children.push((0, koishi_1.segment)('message', attrs, koishi_1.segment.image(msg.ImagePath)));
            }
            return result;
        }
        else {
            for (var msg of msgs) {
                result.children.push((0, koishi_1.segment)('message', attrs, `任务uuid:${msg.Uuid}\n图片地址:${msg.ImagePath}`));
                result.children.push((0, koishi_1.segment)('message', attrs, koishi_1.segment.image(msg.ThumbImagePath)));
            }
            return result;
        }
    }
    getSign(payload) {
        payload['apisecret'] = this.config.apisecret;
        const keys = [];
        Object.keys(payload).forEach((key, _) => keys.push(key));
        keys.sort();
        const tmp = [];
        keys.forEach((key) => {
            tmp.push(`${key}=${payload[key]}`);
        });
        const sign = this.Md5V(tmp.join('&'));
        delete payload.apisecret;
        return sign;
    }
    Md5V(str) {
        const h = crypto.createHash('md5');
        h.update(str);
        return h.digest('hex');
    }
}
(function (Arcadia) {
    Arcadia.usage = `
##注意事项 
> 使用前请前往 <a style = "color:blue" href ="http://open.yjai.art/openai-painting"> yjart </a> 中获取apikey及apisecret<br>
对于部署者行为及所产生的任何纠纷， Koishi 及 <a style="color:blue" href="https:/ / github.com / initialencounter / mykoishi ">koishi-plugin-${exports.name}</a>概不负责。<br>
如果有更多文本内容想要修改，可以在<a style="color: blue " href=" / locales ">本地化</a>中修改 zh 内容</br>
发送arca.style,即可切换风格
`;
    Arcadia.Config = koishi_1.Schema.object({
        apikey: koishi_1.Schema.string().description('ApiKey').required(),
        apisecret: koishi_1.Schema.string().description('ApiSecret').required(),
        engine: koishi_1.Schema.union([
            koishi_1.Schema.const('colorfulcocktail_diffusion').description('彩色鸡尾酒'),
            koishi_1.Schema.const('stable_diffusion').description('通用'),
            koishi_1.Schema.const('acgn_diffusion').description('动漫'),
            koishi_1.Schema.const('anything_diffusion').description('新动漫'),
            koishi_1.Schema.const('redshift_novelai_sd_merge_diffusion').description('3D建模风格'),
            koishi_1.Schema.const('mid_stable_diffusion').description('艺术感强化'),
            koishi_1.Schema.const('paper_cut_engine').description('剪纸艺术'),
        ]).description('绘画引擎').default('colorfulcocktail_diffusion'),
        ratio: koishi_1.Schema.number().description('0是4 : 3, 1是3 : 4, 2是正方形, 3是16 : 9, 4是9 : 16。').default(3),
        style: koishi_1.Schema.union([
            koishi_1.Schema.const('新海诚').description('新海诚'),
            koishi_1.Schema.const('经典动漫').description('经典动漫'),
            koishi_1.Schema.const('油画').description('油画'),
            koishi_1.Schema.const('水彩绘画').description('水彩绘画'),
            koishi_1.Schema.const('中国画').description('中国画'),
            koishi_1.Schema.const('蒸汽波').description('蒸汽波'),
            koishi_1.Schema.const('莫奈').description('莫奈'),
            koishi_1.Schema.const('二次元色彩大师').description('二次元色彩大师'),
            koishi_1.Schema.const('真实感照片').description('真实感照片'),
            koishi_1.Schema.const('剪纸艺术').description('剪纸艺术'),
            koishi_1.Schema.const('赛博朋克').description('赛博朋克'),
            koishi_1.Schema.const('保罗·塞尚').description('保罗·塞尚'),
            koishi_1.Schema.const('托马斯·科尔').description('托马斯·科尔'),
            koishi_1.Schema.const('村上隆').description('村上隆'),
            koishi_1.Schema.const('穆夏').description('穆夏'),
            koishi_1.Schema.const('毕加索').description('毕加索')
        ]).description('style').default('新海诚'),
        guidence_scale: koishi_1.Schema.number().description('引导力，默认为7.5').default(7.5),
        // callback_url: Schema.string().description('callback_url'),
        // callback_type: Schema.string().description('callback_type').default('end'),
        enable_face_enhance: koishi_1.Schema.boolean().description('面部强化').default(true),
        is_last_layer_skip: koishi_1.Schema.boolean().description('色彩强化').default(true),
        // init_strength: Schema.number().description('init_strength').default(50),
        steps_mode: koishi_1.Schema.number().description('steps_mode').default(0),
        authority: koishi_1.Schema.number().description('最低使用权限').default(1),
        usage: koishi_1.Schema.number().description('使用次数').default(20),
        cmd: koishi_1.Schema.string().default('画画').description('触发指令'),
        output_type: koishi_1.Schema.union([
            koishi_1.Schema.const('minimal').description('只发送图片'),
            koishi_1.Schema.const('default').description('发送图片和关键信息'),
            koishi_1.Schema.const('verbose').description('发送全部信息'),
        ]).description('输出方式。').default('minimal'),
        api_path: koishi_1.Schema.string().description('服务器地址').default('http://api.yjai.art:8080/painting-open-api/site/put_task')
    });
})(Arcadia || (Arcadia = {}));
exports.default = Arcadia;
