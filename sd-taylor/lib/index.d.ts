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
    extras(session: Session, payload: Taylor.Payload): Promise<string>;
    isChinese(s: string): boolean;
    findInfo(s: string, ss: string): string;
    getContent(session: Session, parms: Taylor.Parameters, image?: string): segment;
    prompt_parse(s: string): string;
    cleanUp(): void;
    img2base64(ctx: Context, img_url: string): Promise<string>;
}
declare namespace Taylor {
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
    }
    const Config: Schema<Config>;
}
export default Taylor;
