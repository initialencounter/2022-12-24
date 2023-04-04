import { Context, Schema, Session, segment } from 'koishi';
export declare const name = "sd-taylor";
declare class Taylor {
    private ctx;
    private config;
    task: number;
    output: string;
    constructor(ctx: Context, config: Taylor.Config);
    txt2img(session: Session, payload: Taylor.Payload): Promise<string | segment>;
    img2img(session: Session, payload: Taylor.Payload): Promise<string | segment>;
    interrogate(session: Session): Promise<string>;
    extras(session: Session, payload: Taylor.Payload, options: any): Promise<string | segment>;
    isChinese(s: string): boolean;
    findInfo(s: string, ss: string): string;
    getContent(session: Session, parms: Taylor.Parameters, image?: string): segment;
    cleanUp(): void;
    img2base64(ctx: Context, img_url: string): Promise<string>;
}
declare namespace Taylor {
    const usage = "\n## \u6CE8\u610F\u4E8B\u9879\n> \n\u5982\u9700\u4F7F\u7528gpt\u8BC6\u56FE\u6216gpt\u7FFB\u8BD1\uFF0C\u8BF7\u542F\u7528\u66F4\u65B0davinci-003\u63D2\u4EF6\u81F3v1.6.0,\u5E76\u542F\u7528\n\u5BF9\u4E8E\u90E8\u7F72\u8005\u884C\u4E3A\u53CA\u6240\u4EA7\u751F\u7684\u4EFB\u4F55\u7EA0\u7EB7\uFF0C Koishi \u53CA koishi-plugin-sd-taylor \u6982\u4E0D\u8D1F\u8D23\u3002<br>\n\u5982\u679C\u6709\u66F4\u591A\u6587\u672C\u5185\u5BB9\u60F3\u8981\u4FEE\u6539\uFF0C\u53EF\u4EE5\u5728<a style=\"color:blue\" href=\"/locales\">\u672C\u5730\u5316</a>\u4E2D\u4FEE\u6539 zh \u5185\u5BB9</br>\n## \u4F7F\u7528\u65B9\u6CD5\ngpt\u8BC6\u56FE: tl.dvc \u95EE\u9898+\u56FE\u7247\n\u95EE\u9898\u53CD\u9988\u7FA4:399899914\n";
    interface Parameters {
        enable_hr?: boolean;
        denoising_strength: number;
        firstphase_width?: number;
        firstphase_height?: number;
        hr_scale?: number;
        hr_upscaler?: any;
        hr_second_pass_steps?: number;
        hr_resize_x?: number;
        hr_resize_y?: number;
        prompt: string;
        styles: any;
        seed: number;
        subseed: number;
        subseed_strength: number;
        seed_resize_from_h: number;
        seed_resize_from_w: number;
        sampler_name: any;
        batch_size: number;
        n_iter: number;
        steps: number;
        cfg_scale: number;
        width: number;
        height: number;
        restore_faces: boolean;
        tiling: boolean;
        do_not_save_samples: boolean;
        do_not_save_grid: false;
        negative_prompt: string;
        eta: any;
        s_churn: number;
        s_tmax: any;
        s_tmin: number;
        s_noise: number;
        override_settings: any;
        override_settings_restore_afterwards: true;
        script_args: any[];
        sampler_index: string;
        script_name: any;
        send_images: boolean;
        save_images: boolean;
        alwayson_scripts: any;
        init_images?: any;
        resize_mode?: number;
        image_cfg_scale?: any;
        mask?: any;
        mask_blur?: number;
        inpainting_fill?: number;
        inpaint_full_res?: true;
        inpaint_full_res_padding?: number;
        inpainting_mask_invert?: number;
        initial_noise_multiplier?: any;
        include_init_images?: false;
    }
    interface Payload {
        steps?: number;
        width?: number;
        height?: number;
        seed?: number;
        cfg_scale?: number;
        negative_prompt?: string;
        denoising_strength?: number;
        prompt: string;
        upscaling_crop?: boolean;
    }
    interface Config {
        api_path: string;
        min_auth: number;
        step: number;
        denoising_strength: number;
        seed: number;
        maxConcurrency: number;
        negative_prompt: string;
        defaut_prompt: string;
        resolution: string;
        cfg_scale: number;
        output: string;
        model: string;
        gpt_translate: boolean;
    }
    const Config: Schema<Config>;
}
export default Taylor;
