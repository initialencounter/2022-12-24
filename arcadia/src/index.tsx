import {
    Context, Schema, Logger, segment, Element, Session, Service, Dict, h
}
    from 'koishi';
import { } from '@koishijs/plugin-rate-limit';
import { } from 'koishi-plugin-puppeteer';
import { } from '@koishijs/plugin-rate-limit';
export const name = 'arcadia';
export const logger = new Logger(name);
import * as crypto from 'crypto';


declare module 'koishi' {
    interface Context {
        arcadia: Arcadia
    }
    interface Arcadia {

    }

}

class Arcadia extends Service {
    output_type: string;;
    sessions: Dict;
    personality: string;
    sessions_cmd: Dict;
    reg: RegExp;
    access_token: string;
    ifgettoken: boolean;
    key: number[];
    aliasMap: any;
    charMap: any;
    g_voice_name: string;
    opt: Arcadia.Req
    constructor(ctx: Context, private config: Arcadia.Config) {
        super(ctx, 'arcadia', true)
        this.opt = {
            apikey: this.config.apikey,
            prompt: '测试',
            engine: this.config.engine,
            // ratio: this.config.ratio,
            style: '新海诚',
            guidence_scale: this.config.guidence_scale,
            // callback_url:this.config.callback_url,
            // callback_type:this.config.callback_type,
            // enable_face_enhance:this.config.enable_face_enhance,
            // is_last_layer_skip:this.config.is_last_layer_skip,
            // init_strength:this.config.init_strength,
            // steps_mode:this.config.steps_mode
        }
        ctx.command('show', '查看任务').action(({ session }, prompt) => this.show_complete_tasks(session, prompt))
        ctx.command('arcadia <prompt:text>', '意间Ai绘画', {
            authority: this.config.authority,
            maxUsage: this.config.usage,
            usageName: 'ai'
        }).alias(this.config.cmd,'arca','yjai').action(({ session }, prompt) => this.PostOpenApi(session, prompt))
        ctx.command('arcadia.style <type:string>', '切换arcadia的风格画家').action(async ({ session }, type) => this.switch_style(session, type));

    }
    async PostOpenApi(sesssion: Session, prompt: string) {
        const now: string = `${Math.floor(Date.now() / 1000)}`;
        this.opt['timestamp'] = now
        this.opt["prompt"] = prompt
        // 得到签名
        const sign = this.getSign();
        const headers: Record<string, string> = {
            "sign": sign,
            "Content-Type": "application/x-www-form-urlencoded"
        };
        // 超时时间
        const timeout: number = 10 * 1000;
        const res: string = (await this.ctx.http.axios({
            url: this.config.api_path,
            method: 'POST',
            headers: headers,
            data: this.opt,
            timeout: timeout
        })).data.data.Uuid
        if (!res) {
            return '未知错误'
        }
        sesssion.send(`任务uuid: ${res}`)
        let image: string | segment = await this.show_complete_tasks(sesssion, res)
        let count: number = 0
        while (image == '未画好，请稍后发送 "show <uuid>" 查看' || count < 5) {
            image = await this.show_complete_tasks(sesssion, res)
            count++
        }
        return image
    }

    async show_complete_tasks(session: Session, uuid: string) {
        const url = "http://api.yjai.art:8080/painting-open-api/site/show_task_detail";
        // 请求时的时间戳秒数
        const now: string = `${Math.floor(Date.now() / 1000)}`;
        this.opt = {
            apikey: this.config.apikey,
            uuid: uuid,
            timestamp: now
        }
        const config = {
            method: 'POST',
            url: url,
            headers: {
                sign: this.getSign(),
                "Content-Type": "application/x-www-form-urlencoded"
            },
            data: this.opt
        }
        const image_path: string = await (await this.ctx.http.axios(config)).data.data.ImagePath;
        if (!image_path) {
            return '未画好，请稍后发送 "show <uuid>" 查看'
        }
        session.send(`图片地址: ${image_path}`)
        return segment.image(image_path)
    }
    async switch_style(session: Session, type: string) {
        const type_arr: string[] = [
            '新海诚',
            // '经典动漫',
            // '油画',
            '水彩绘画',
            // '中国画',
            // '蒸汽波',
            // '莫奈',
            // '二次元色彩大师',
            '真实感照片',
            '剪纸艺术',
            // '赛博朋克',
            '保罗·塞尚',
            // '托马斯·科尔',
            // '莫比乌斯',
            '村上隆',
            '穆夏',
            "毕加索",
            // "梵高",
        ]
        if (!type) {
            let type_str: string = '\n'
            type_arr.forEach((i, id) => {
                type_str += String(id + 1) + ' ' + i + '\n'
            })
            session.send(session.text('commands.dvc.messages.switch-output', [type_str]))
            const input = await session.prompt()
            if (!input || Number.isNaN(+input)) return '请输入正确的序号。'
            const index: number = parseInt(input) - 1
            if (0 > index && index > type_arr.length - 1) return '请输入正确的序号。'
            this.opt['style'] = type_arr[index]
            return '风格画家切换成功: ' + this.opt['style']
        } else {
            if (type_arr.includes(type)) {
                this.opt['style'] = type
                return '风格画家切换成功: ' + this.opt['style']
            } else {
                let type_str: string = '\n'
                type_arr.forEach((i, id) => {
                    type_str += String(id + 1) + ' ' + i + '\n'
                })
                session.send(session.text('commands.dvc.messages.switch-output', [type_str]))
                const input = await session.prompt()
                if (!input || Number.isNaN(+input)) return '请输入正确的序号。'
                const index: number = parseInt(input) - 1

                if (0 > index && index > type_arr.length - 1) return '请输入正确的序号。'
                this.opt['style'] = type_arr[index]
                return '风格画家切换成功: ' + this.opt['style']
            }
        }

    }
    getSign() {
        this.opt['apisecret'] = this.config.apisecret;
        const keys = [];
        Object.keys(this.opt).forEach((key, _) => keys.push(key));
        keys.sort();
        const tmp = [];
        keys.forEach((key) => {
            tmp.push(`${key}=${this.opt[key]}`);
        });
        const sign = this.Md5V(tmp.join('&'));
        delete this.opt.apisecret;
        return sign;
    }

    Md5V(str: string): string {
        const h = crypto.createHash('md5');
        h.update(str);
        return h.digest('hex');
    }

}
namespace Arcadia {
    export const usage = `
##注意事项 
> 使用前在 < a style = "color:blue" href = "http://open.yjai.art/openai-painting" > yjart </a> 中获取apikey及apisecret<br>
对于部署者行为及所产生的任何纠纷， Koishi 及 <a style="color:blue" href="https:/ / github.com / initialencounter / mykoishi ">koishi-plugin-${name}</a>概不负责。<br>
如果有更多文本内容想要修改，可以在<a style="color: blue " href=" / locales ">本地化</a>中修改 zh 内容</br>
发送arcadia.style,即可切换风格
`

    export interface Req {
        uuid?: string;
        prompt?: string;
        apikey: string;
        apisecret?: string;
        engine?: string;
        ratio?: number;
        style?: any;
        guidence_scale?: number;
        callback_url?: string;
        callback_type?: string;
        enable_face_enhance?: boolean;
        is_last_layer_skip?: boolean;
        init_image?: string;
        init_strength?: number;
        steps_mode?: number;
        timestamp?: any;

    }

    export interface Response {
        Status: number;
        Reason: string;
        Data: any;
    }
    export interface Config {
        api_path: string
        apikey: string;
        apisecret?: string;
        engine?: string;
        // ratio?: number
        style?: string
        guidence_scale?: number
        // callback_url?: string
        // callback_type?: string
        // enable_face_enhance?: boolean
        // is_last_layer_skip?: boolean
        // init_image?: string
        // init_strength?: number
        // steps_mode?: number
        timestamp?: any
        authority: number
        usage: number
        cmd: string
        // step: number
        // denoising_strength: number
        // seed: number
        // maxConcurrency: number
        // negative_prompt: string
        // defaut_prompt: string
        // resolution: string
        // cfg_scale: number
        // output: string


    }

    export const Config: Schema<Config> = Schema.object({
        api_path: Schema.string().description('服务器地址').default('http://api.yjai.art:8080/painting-open-api/site/put_task'),
        apikey: Schema.string().description('ApiKey').required(),
        apisecret: Schema.string().description('ApiSecret').required(),
        engine: Schema.string().description('绘画引擎').default('stable_diffusion'),
        // ratio: Schema.number().description('ratio').default(0),
        style: Schema.union([
            Schema.const('新海诚').description('新海诚'),
            // Schema.const('经典动漫').description('经典动漫'),
            // Schema.const('油画').description('油画'),
            Schema.const('水彩绘画').description('水彩绘画'),
            // Schema.const('中国画').description('中国画'),
            // Schema.const('蒸汽波').description('蒸汽波'),
            // Schema.const('莫奈').description('莫奈'),
            // Schema.const('二次元色彩大师').description('二次元色彩大师'),
            Schema.const('真实感照片').description('真实感照片'),
            Schema.const('剪纸艺术').description('剪纸艺术'),
            // Schema.const('赛博朋克').description('赛博朋克'),
            Schema.const('保罗·塞尚').description('保罗·塞尚'),
            // Schema.const('托马斯·科尔').description('托马斯·科尔'),
            // Schema.const('莫比乌斯').description('莫比乌斯'),
            Schema.const('村上隆').description('村上隆'),
            Schema.const('穆夏').description('穆夏'),
            Schema.const('毕加索').description('毕加索')
        ]).description('style').default('新海诚'),
        guidence_scale: Schema.number().description('guidence_scale').default(10),
        // callback_url: Schema.string().description('callback_url'),
        // callback_type: Schema.string().description('callback_type').default('end'),
        // enable_face_enhance: Schema.boolean().description('enable_face_enhance').default(false),
        // is_last_layer_skip: Schema.boolean().description('is_last_layer_skip').default(false),
        // init_strength: Schema.number().description('init_strength').default(50),
        // steps_mode: Schema.number().description('steps_mode').default(0),
        authority: Schema.number().description('最低使用权限').default(1),
        usage: Schema.number().description('使用次数').default(20),
        cmd: Schema.string().default('画画').description('触发指令'),
        // step: Schema.number().default(20).description('采样步数0-100'),
        // denoising_strength: Schema.number().default(0.5).description('改变强度0-1'),
        // seed: Schema.number().default(-1).description('种子'),
        // maxConcurrency: Schema.number().default(3).description('最大排队数'),
        // negative_prompt: Schema.string().description('反向提示词').default('nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry'),
        // defaut_prompt: Schema.string().default('masterpiece, best quality').description('默认提示词'),
        // resolution: Schema.string().default('720x512').description('默认比例'),
        // cfg_scale: Schema.number().default(15).description('相关性0-20'),
        // output: Schema.union([
        //     Schema.const('minimal').description('只发送图片'),
        //     Schema.const('default').description('发送图片和关键信息'),
        //     Schema.const('verbose').description('发送全部信息'),
        // ]).description('输出方式。').default('default')

    })


}

export default Arcadia