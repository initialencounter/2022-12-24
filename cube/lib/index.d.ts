import { Context, Schema } from 'koishi';
import { Cube } from './cube';
declare module 'koishi' {
    interface Tables {
        cube_score: CubeScore;
    }
}
export interface CubeScore {
    uid: number;
    gid: string;
    score: number;
}
export declare function quickSort(arr: CubeScore[]): any;
declare class CubeActivity {
    private ctx;
    private config;
    readonly name = "cube";
    cube_dict: object;
    color: object;
    mix_list: string[];
    constructor(ctx: Context, config: CubeActivity.Config);
    main_proc(session: any, prompt: string, options: any): Promise<any>;
    add_scroe(uid: number, gid: string): Promise<void>;
    draw_cube(cube: Cube): any;
}
declare namespace CubeActivity {
    const usage = "\n## \u6CE8\u610F\u4E8B\u9879\n> \u5EFA\u8BAE\u4F7F\u7528\u524D\u5728\u5728\u63D2\u4EF6\u7BA1\u7406\u52A0\u8F7Dpuppteeter\u670D\u52A1,\u5426\u5219\u65E0\u6CD5\u53D1\u9001\u56FE\u7247\n\n> \u672C\u63D2\u4EF6\u53EA\u7528\u4E8E\u4F53\u73B0 Koishi \u90E8\u7F72\u8005\u610F\u5FD7\n\n> \u5BF9\u4E8E\u90E8\u7F72\u8005\u884C\u4E3A\u53CA\u6240\u4EA7\u751F\u7684\u4EFB\u4F55\u7EA0\u7EB7\uFF0C Koishi \u53CA koishi-plugin-cube \u6982\u4E0D\u8D1F\u8D23\u3002\n\n> \u5982\u679C\u6709\u66F4\u591A\u6587\u672C\u5185\u5BB9\u60F3\u8981\u4FEE\u6539\uFF0C\u53EF\u4EE5\u5728<a href=\"/locales\">\u672C\u5730\u5316</a>\u4E2D\u4FEE\u6539 zh \u5185\u5BB9\n\n## \u4F7F\u7528\u65B9\u6CD5\n> \u53D1\u9001['U', 'U_', 'D', 'D_', 'R', 'R_', 'L', 'L_', 'F', 'F_', 'B', 'B_']\u5185\u7684\u5B57\u7B26\n\n> \u4E0D\u533A\u5206\u5927\u5C0F\u5199\uFF0C\u7A7A\u683C\u9694\u5F00\n\n> U\u4EE3\u8868\u9B54\u65B9\u4E0A\u9762\u987A\u65F6\u9488\u626D\u4E00\u6B21, U_\u4EE3\u8868\u9B54\u65B9\u4E0A\u9762\u9006\u65F6\u9488\u626D\u4E00\u6B21\n\n> \u793A\u4F8B:\u524D\u9762\u987A\u65F6\u9488\u626D\u4E00\u6B21\uFF0C\u5DE6\u9762\u9006\u65F6\u9488\u626D\u4E00\u6B21\uFF1A \"cb F r_\"\n";
    interface Config {
    }
    const Config: Schema<Config>;
}
export default CubeActivity;
