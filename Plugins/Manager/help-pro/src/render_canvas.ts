import { Context } from 'koishi';
import { SikaCanvas } from "koishi-plugin-canvas";
import fs from 'fs'
const pluginGrid = {
    game: [
        ['pz', '数字华容道', 3],
        ['couplet', 'AI对对联', 0],
        ['cube', '三阶魔方', 0],
        ['ed', '', 0]
    ],
    manage: [
        ['help-pro', '显示帮助信息', 7],
        ['echo', '发送消息', 4],
        ['clock', '添加闹钟', 0],
        ['command', '指令管理', 0],
        ['loader', '更新所有插件', 0],
        ['shutdown', '关闭或重启 Kois...', 0],
        ['timer', '定时器信息', 0],
        ['usage', '调用次数信息', 0]
    ],
    tool: [],
    extension: [],
    ai: [['facercg', '人脸识别,百度api...', 0]],
    preset: [],
    storage: [['备份db', '', 0], ['恢复db', '', 0]],
    adapter: [],
    image: [],
    console: [
        ['clear', '清空聊天记录', 27],
        ['info', '查看运行状态', 0],
        ['plugin', '插件管理', 0]
    ],
    gametool: [
        ['trad', 'Steam挂刀行情', 3],
        ['stnb', '扫雷stnb计算~', 0],
        ['ys', '', 0]
    ],
    meme: [['thursday', '随机输出 KFC 疯...', 0]],
    media: [['fur', '随机毛图', 3]],
    other: [],
    unknow: []
};

// (async () => {

// })()

export async function render3(ctx1: Context, theme: string) {
    console.time("mytime")
    let x = 10, y = 10
    const bg = await ctx1.canvas.loadImage('C:\\Users\\29115\\dev\\ks\\Plugins\\Manager\\help-pro\\1.png')
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
            ctx.font = 'bold 40px sans-serif'
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
                ctx.font = 'bold 30px sans-serif'
                // ctx.textAlign = 'center'
                // ctx.textBaseline = 'middle'
                ctx.fillStyle = '#000'
                ctx.fillText(
                    value[i][0].replace(/^./, (p) => p.toLocaleUpperCase()),
                    x2,
                    y,
                )
                x2 += 185
            }
            y += 70
        }
    })
    console.timeEnd("mytime")
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