import { resolve } from "path";
import Minefield from "./minesweeper";
import { MineConfig } from "./config"
import fs from "fs"
import Jimp from '@initencounter/jimp';
import { Context } from "koishi";


const imgArr = {}
let FONT


/**
 * 初始化
 * @param ctx 
 * @param config 
 */
export async function setTheme(ctx: Context, config: MineConfig) {
    const themePath = resolve(__dirname, "theme", config.theme)
    const imageTypes = ['closed', 'flag', 'type0', 'type1', 'type2', 'type3', 'type4', 'type5', 'type6', 'type7', 'type8'];  // 扫雷的皮肤文件名
    for (var type of imageTypes) {
        imgArr[type] = await ctx.jimp.read(resolve(themePath, `${type}.png`))
    }
    if (config.colorForSerialNum === "white") {
        FONT = await ctx.jimp.loadFont(ctx.jimp.FONT_SANS_32_WHITE)
    } else {
        FONT = await ctx.jimp.loadFont(ctx.jimp.FONT_SANS_32_BLACK)
    }
}
async function main() {
    const ctx = new Context()
    ctx.plugin(Jimp)
    const themePath = resolve(__dirname, "theme/", "wom")
    const imageTypes = ['closed', 'flag', 'type0', 'type1', 'type2', 'type3', 'type4', 'type5', 'type6', 'type7', 'type8'];
    for (var type of imageTypes) {
        imgArr[type] = await ctx.jimp.read(resolve(themePath, `${type}.png`))
    }
    if ("white") {
        FONT = await ctx.jimp.loadFont(ctx.jimp.FONT_SANS_32_WHITE)
    } else {
        FONT = await ctx.jimp.loadFont(ctx.jimp.FONT_SANS_32_BLACK)
    }
    const m = new Minefield(9, 9, 20)
    m.openCell("6")
    // console.time("mytime")
    const img = await renderX(m, ctx)
    // console.timeEnd("mytime")
    fs.writeFileSync('test.png', Buffer.from(img))
}
// main()



/**
 * 渲染雷图
 * @param m 雷图对象
 * @returns Arraybuffer
 */
export async function renderX(m: Minefield, ctx: Context) {
    let x: number = m.width
    let y: number = m.height
    const bigImage = ctx.jimp.newJimp(x * 94, y * 94)
    for (var i = 0; i < m.cells; i++) {
        let [px, py] = [(i % x) * 94, Math.floor(i / y) * 94]
        const ii = m[String(i)]
        if (ii["isOpen"]) {
            bigImage.blit(imgArr[`type${ii["mines"]}`], px, py)
        }
        else if (ii["isFlagged"]) {
            bigImage.blit(imgArr["flag"], px, py)
        }
        else {
            bigImage.blit(imgArr[`closed`], px, py)
            bigImage.print(FONT, px + 30, py + 30, i < 10 ? "0" + i : String(i),);
        }
    }

    // await bigImage.writeAsync("test/test.png");
    const res = await bigImage.getBufferAsync(ctx.jimp.MIME_PNG);
    return res
}