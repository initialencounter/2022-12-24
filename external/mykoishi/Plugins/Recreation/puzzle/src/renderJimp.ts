import { Context } from "koishi";
import { } from "@initencounter/jimp"
import type Jimp from "jimp";

export const theme = [['#000000', '#707070', '#707070', '#707070', '#707070',],
['#707070', '#444444', '#00C91A', '#00C91A', '#00C91A',],
['#00C91A', '#444444', '#008314', '#006FFF', '#006FFF',],
['#006FFF', '#444444', '#008314', '#001EE1', '#FF0000',],
['#FF0000', '#444444', '#008314', '#001EE1', '#BB0000',]]


let imgArr: ImgArr = {}
interface ImgArr {
    "3-0"?: Jimp
    "3-1"?: Jimp
    "3-2"?: Jimp
    "3-3"?: Jimp
    "3-4"?: Jimp
    "3-5"?: Jimp
    "3-6"?: Jimp
    "3-7"?: Jimp
    "3-8"?: Jimp
    "4-0"?: Jimp
    "4-1"?: Jimp
    "4-2"?: Jimp
    "4-3"?: Jimp
    "4-4"?: Jimp
    "4-5"?: Jimp
    "4-6"?: Jimp
    "4-7"?: Jimp
    "4-8"?: Jimp
    "4-9"?: Jimp
    "4-10"?: Jimp
    "4-11"?: Jimp
    "4-12"?: Jimp
    "4-13"?: Jimp
    "4-14"?: Jimp
    "4-15"?: Jimp
    "5-0"?: Jimp
    "5-1"?: Jimp
    "5-2"?: Jimp
    "5-3"?: Jimp
    "5-4"?: Jimp
    "5-5"?: Jimp
    "5-6"?: Jimp
    "5-7"?: Jimp
    "5-8"?: Jimp
    "5-9"?: Jimp
    "5-10"?: Jimp
    "5-11"?: Jimp
    "5-12"?: Jimp
    "5-13"?: Jimp
    "5-14"?: Jimp
    "5-15"?: Jimp
    "5-16"?: Jimp
    "5-17"?: Jimp
    "5-18"?: Jimp
    "5-19"?: Jimp
    "5-21"?: Jimp
    "5-22"?: Jimp
    "5-23"?: Jimp
    "5-24"?: Jimp
}

/**
 * 初始化
 * @param config 
 */
export async function setTheme(ctx: Context) {
    const FONT = await ctx.jimp.loadFont(ctx.jimp.FONT_SANS_64_WHITE)
    // 十六进制颜色转RGBA
    for (var j = 3; j < 6; j++) {
        for (var i = 0; i < j * j; i++) {
            const color = find_color(i, j)
            const bg = ctx.jimp.newJimp(94, 94, color)
            if( i == 0){
            }
            else if (i < 10) {
                bg.print(FONT, 30, 15, String(i))

            } else {
                bg.print(FONT, 10, 15, String(i))

            }
            imgArr[`${j}-${i}`] = bg
        }
    }
}



/**
 * 获取背景颜色
 * @param num 数字
 * @param mode 模式
 * @returns 
 */
function find_color(num: number, mode: number) {
    const y = num % mode
    const x = Math.floor(num / mode)
    return theme[x][y]

}


/**
 * 渲染雷图
 * @param m 雷图对象
 * @returns Arraybuffer
 */
export async function renderX(ctx: Context, k): Promise<Buffer> {
    const mode = k.length
    const bg = ctx.jimp.newJimp(mode * 94, mode * 94)
    for (let i = 0; i < mode; i++) {
        for (let j = 0; j < mode; j++) {
            if (k[i][j] == 0) {
                bg.blit(imgArr['5-0'], j * 94, i * 94)
            } else {
                bg.blit(imgArr[`${mode}-${k[i][j]}`], j * 94, i * 94)
            }

        }
    }
    return await bg.getBufferAsync(ctx.jimp.MIME_PNG);
}