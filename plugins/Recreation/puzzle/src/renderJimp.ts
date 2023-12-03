import { Context } from "koishi";
import { } from "@initencounter/jimp"
import Jimp from "jimp";

export const theme = [['#000000', '#707070', '#707070', '#707070', '#707070',],
['#707070', '#444444', '#00C91A', '#00C91A', '#00C91A',],
['#00C91A', '#444444', '#008314', '#006FFF', '#006FFF',],
['#006FFF', '#444444', '#008314', '#001EE1', '#FF0000',],
['#FF0000', '#444444', '#008314', '#001EE1', '#BB0000',]]


let imgArr = {}


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
                bg.blit(imgArr["5-0"], j * 94, i * 94)
            } else {
                bg.blit(imgArr[`${mode}-${k[i][j]}`], j * 94, i * 94)
            }

        }
    }
    return await bg.getBufferAsync(ctx.jimp.MIME_PNG);
}