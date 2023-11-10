import { Context } from 'koishi';
import { PluginGrid } from '.';

export async function render3(ctx1: Context, theme: string, pluginGrid: PluginGrid) {
    // console.time("mytime")
    let y = 10
    let bgImg:string = ctx1.config.background
    if(bgImg.startsWith('file:///')){
        bgImg = bgImg.replace('file:///','')
    }
    const bg = await ctx1.canvas.loadImage(bgImg)
    const [width, height]: number[] = [bg["width"], bg["height"]]
    const a = await ctx1.canvas.render(width, height, async (ctx) => {
        const pluginsPeerRow = Math.floor(width / 185)
        ctx.drawImage(bg, 0, 0)
        ctx.globalAlpha = 0.6;
        for (var [key, value] of Object.entries(pluginGrid)) {
            if (!value.length) {
                continue
            }
            ctx.fillStyle = theme
            ctx.font = '40px'
            ctx.textAlign = 'left'
            ctx.textBaseline = 'middle'
            ctx.fillStyle = '#000'
            ctx.fillText(
                category_map[key],
                10,
                y+20,
            )
            y += 70
            let x2 = 30
            for (var i = 0; i < value.length; i++) {
                if (i > 0 && i % pluginsPeerRow == 0) {
                    y += 70
                    x2 = 30
                }
                ctx.font = '30px'
                ctx.textBaseline = 'middle'
                ctx.fillStyle = '#000'
                ctx.fillText(
                    value[i][0].replace(/^./, (p) => p.toLocaleUpperCase()),
                    x2,
                    y,
                )
                ctx.font = '18px'
                ctx.textBaseline = 'middle'
                ctx.fillStyle = '#000'
                ctx.fillText(
                    value[i][1].replace(/^./, (p) => p.toLocaleUpperCase()),
                    x2,
                    y+30,
                )
                x2 += 185
            }
            y += 70
        }
    })
    // console.timeEnd("mytime")
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