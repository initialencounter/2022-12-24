import { Context } from 'koishi';
import { PluginGrid } from '.';
import { Image } from '@koishijs/canvas';
import { PNG } from 'pngjs';
import { createRounderRect } from './utils'

interface Themes {
    textColor: string,
    pluginsPeerRow1: number,
    pluginsPeerRow2: number,
    width: number,
    height: number,
    bg: Image,
    bg2: Image,
}

export async function render_list(
    ctx1: Context,
    commands: (string | number)[][],
    theme: string) {

    // 改变主题颜色
    const themes = await initTheme(ctx1, theme)

    let [x, y] = [50, 30]

    const a = await ctx1.canvas.render(themes.width, themes.height, async (ctx) => {

        ctx.drawImage(themes.bg, 0, 0)
        ctx.fillStyle = theme
        ctx.font = '60px'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = "#000"
        ctx.fillText(
            '指令列表：',
            themes.width / 2,
            y + 50,
        )
        ctx.textAlign = 'left'
        y += 150
        for (var i = 0; i < commands.length; i++) {
            if (i > 0 && i % themes.pluginsPeerRow1 == 0) {
                y += 90
                x = 50
            }
            // 渲染指令描述
            ctx.globalAlpha = 0.4
            ctx.drawImage(themes.bg2, x - 20, y - 20)
            ctx.globalAlpha = 1
            ctx.font = '30px'
            if (isChinese(commands[i][0] as string)) {
                ctx.font = '25px'
            }
            ctx.textBaseline = 'middle'
            ctx.fillStyle = themes.textColor
            ctx.fillText(
                commands[i][0] as string,
                x,
                y,
            )
            // 渲染指令描述
            ctx.font = '18px'
            if (isChinese(commands[i][1] as string)) {
                ctx.font = '16px'
            }
            ctx.textBaseline = 'middle'
            ctx.fillStyle = themes.textColor
            ctx.fillText(
                commands[i][1] == '' ? 'n/a' : commands[i][1] as string,
                x,
                y + 30,
            )
            x += 250
        }
        y += 80

    })
    return a
}
export async function render_categroy(ctx1: Context, theme: string, pluginGrid: PluginGrid) {
    // 改变主题颜色
    const themes = await initTheme(ctx1, theme)
    let y = 10
    const a = await ctx1.canvas.render(themes.width, themes.height, async (ctx) => {
        ctx.drawImage(themes.bg, 0, 0)
        for (var [key, value] of Object.entries(pluginGrid)) {
            if (!value.length) {
                continue
            }
            // 渲染分类名称
            ctx.fillStyle = theme
            ctx.font = '35px'
            ctx.textAlign = 'left'
            ctx.textBaseline = 'middle'
            ctx.fillStyle = "#000"
            ctx.fillText(
                category_map[key],
                30,
                y + 20,
            )
            y += 70
            let x2 = 30
            for (var i = 0; i < value.length; i++) {
                if (i > 0 && i % themes.pluginsPeerRow2 == 0) {
                    y += 80
                    x2 = 30
                }
                // 渲染指令
                ctx.globalAlpha = 0.5
                ctx.drawImage(themes.bg2, x2 - 20, y - 20)
                ctx.globalAlpha = 1
                ctx.font = '30px'
                if (isChinese(value[i][0])) {
                    ctx.font = '25px'
                }
                ctx.textBaseline = 'middle'
                ctx.textAlign = 'center'
                ctx.fillStyle = themes.textColor
                ctx.fillText(
                    value[i][0],
                    x2 + 65,
                    y,
                )
                // 渲染指令描述
                ctx.font = '20px'
                if (isChinese(value[i][1])) {
                    ctx.font = '18px'
                }
                ctx.textBaseline = 'middle'
                ctx.textAlign = 'center'
                ctx.fillStyle = themes.textColor
                ctx.fillText(
                    value[i][1] == '' ? 'n/a' : value[i][1],
                    x2 + 65,
                    y + 33,
                )
                x2 += 185
            }
            y += 55
        }
    })
    return a
}
const category_map = {
    game: '娱乐玩法',
    manage: '管理工具',
    tool: '实用工具',
    extension: '拓展服务',
    ai: '人工智能',
    preset: '行为预设',
    storage: '存储服务',
    adapter: '适配器',
    image: '图片服务',
    console: '控制台',
    gametool: '游戏辅助',
    meme: '趣味交互',
    media: '资讯服务',
    other: "其他",
    unknow: '未知',
}

/**
 * 判断字符串是否是中文
 * @param s 
 * @returns 
 */
function isChinese(s: string): boolean {
    return /[\u4e00-\u9fa5]/.test(s);
}

function calculateColorBrightness(r: number, g: number, b: number) {
    // 计算亮度
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness;
}

// 解析 rgba 字符串
function parseColor(color: string) {
    color = color.slice(5, -1)
    return color.split(', ').map((v) => { return parseInt(v) })
}

/**
 * 将图片数组转为Arraybuffer
 * @param pixels 
 * @param width 
 * @param height 
 * @returns 
 */
function writeArrayToImage(pixels: number[][][]) {
    // 创建一个新的PNG对象
    const width = pixels[0].length
    const height = pixels.length
    const png = new PNG({ width, height });
    // 将像素数据写入PNG对象
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // 获取像素索引
            const idx = (width * y + x) << 2;
            // 获取像素的RGBA值
            const [r, g, b, a] = pixels[y][x];
            // 将像素数据写入PNG对象  
            png.data[idx] = r;
            png.data[idx + 1] = g;
            png.data[idx + 2] = b;
            png.data[idx + 3] = a;
        }
    }
    // 创建一个 Uint8Array 来保存 PNG 数据
    const pngBuffer = new Uint8Array(PNG.sync.write(png));

    // 转换 Uint8Array 到 ArrayBuffer
    const arrayBuffer = pngBuffer.buffer;

    return arrayBuffer;
}

/**
 * 加载主题
 * @param ctx 
 * @param theme 
 */
async function initTheme(ctx: Context, theme: string) {
    let themes: Themes = {
        textColor: "#000",
        pluginsPeerRow1: 3,
        pluginsPeerRow2: 4,
        width: 1200,
        height: 1200,
        bg: undefined,
        bg2: undefined
    }
    const color2 = parseColor(theme);
    const imgBuffer = createRounderRect(170, 70, color2, 15);
    themes.textColor = calculateColorBrightness(color2[0], color2[1], color2[2]) < 126 ? "#FFFFFF" : "#000000";

    const imgUrl = ctx.config.background
    themes.bg2 = await ctx.canvas.loadImage(imgBuffer);
    themes.bg = await ctx.canvas.loadImage(imgUrl.replace('file:///', ''));
    themes.width = themes.bg["width"];
    themes.height = themes.bg["height"];
    themes.pluginsPeerRow2 = Math.floor(themes.width / 185)
    themes.pluginsPeerRow1 = Math.floor(themes.width / 250)
    return themes
}
