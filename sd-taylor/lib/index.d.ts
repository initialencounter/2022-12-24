import { Context, Schema } from 'koishi';
export declare const name = "sd-taylor";
export interface Config {
    api_path: string;
    min_auth: number;
    cmd: string;
    step: number;
    denoising_strength: number;
    seed: number;
    maxConcurrency: number;
    negative_prompt: string;
    defaut_prompt: string;
    resolution: string;
    cfg_scale: number;
    output: string;
}
export declare const Config: Schema<Config>;
export declare function isChinese(s: any): boolean;
export declare function findInfo(s: any, ss: any): string;
export declare function prompt_parse(s: any): any;
export declare function img2base64(ctx: any, img_url: any): Promise<string>;
export declare function getContent(output: any, session: any, args: any, info: any, res_img: any, init_img: any): any;
export declare function apply(ctx: Context, config: Config): void;
