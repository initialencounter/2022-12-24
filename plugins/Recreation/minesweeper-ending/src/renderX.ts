import { resolve } from "path";
import Minefield from "./minesweeper";
import { MineConfig } from "./config";
import fs, { writeFileSync } from "fs";
import { Context } from "koishi";
import CanvasService, { Image } from "@koishijs/canvas";

const imgArr: Record<string, Image> = {};
let fontColor = "white";

/**
 * 初始化
 * @param ctx
 * @param config
 */
export async function setTheme(ctx: Context, config: MineConfig) {
    const themePath = resolve(__dirname, "theme", config.theme);
    const imageTypes = ['closed', 'flag', 'type0', 'type1', 'type2', 'type3', 'type4', 'type5', 'type6', 'type7', 'type8'];  // 扫雷的皮肤文件名
    for (const type of imageTypes) {
        const buffer = fs.readFileSync(resolve(themePath, `${type}.png`));
        imgArr[type] = await ctx.canvas.loadImage(buffer);
    }
    fontColor = config.colorForSerialNum === "white" ? "white" : "black";
}

/**
 * 渲染雷图
 * @param m 雷图对象
 * @returns Arraybuffer
 */
export async function renderX(m: Minefield, ctx: Context) {
    let x: number = m.width;
    let y: number = m.height;
    const canvas = await ctx.canvas.createCanvas(x * 94, y * 94);
    const context = canvas.getContext("2d");

    context.font = "32px sans-serif";
    context.fillStyle = fontColor;

    for (var i = 0; i < m.cells; i++) {
        let [px, py] = [(i % x) * 94, Math.floor(i / x) * 94];
        const ii = m[String(i)];
        if (ii["isOpen"]) {
            context.drawImage(imgArr[`type${ii["mines"]}`], px, py, 94, 94);
        }
        else if (ii["isFlagged"]) {
            context.drawImage(imgArr["flag"], px, py, 94, 94);
        }
        else {
            context.drawImage(imgArr[`closed`], px, py, 94, 94);
            context.fillText(i < 10 ? "0" + i : String(i), px + 30, py + 62); // 调整了y坐标，因为canvas文本基线不同
        }
    }

    return await canvas.toBuffer("image/png");
}
