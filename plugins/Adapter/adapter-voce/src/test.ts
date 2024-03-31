import { readFileSync } from "fs";
import { Context, h } from "koishi";



export default class TestFn {
    constructor(ctx: Context) {
        ctx.middleware((session, next) => {
            console.log(session.content)
            console.log(session.event.message.elements)
            return next()
        })
        ctx.command('test').action(async ({ session }) => {
            // 测试语音
            let buffer1: Buffer = readFileSync('../../Downloads\\audio.wav')
            session.send(h.video(buffer1, 'audio/wav'))
            // 测试视频
            let buffer2: Buffer = readFileSync('../../Downloads\\BMjAyMDA5MTgxOTIzMDBfNTMwNTI4NThfMzYyNDA3Nzc3OTBfMV8z_b_B93bf113be100dc1c98b6b572f8ee19e1.mp4')
            session.send(h.video(buffer2, 'video/mp4'))
            // 测试撤回消息
            const res = await session.send('应该被撤回消息')
            await ctx.sleep(500)
            session.bot.deleteMessage(session.channelId, res[0])
            // 测试 at
            await session.send(h.at(1) + '测试 at')
            // 测试 reply
            await session.send(h.quote(160) + '测试 reply')
        })
        ctx.command('test1').action(async ({ session }) => {
            // 测试语音
            let buffer1: Buffer = readFileSync('../../Downloads\\audio.wav')
            session.send(h.video(buffer1, 'audio/wav'))
        })
        ctx.command('test1').action(async ({ session }) => {
            // 测试视频
            let buffer2: Buffer = readFileSync('../../Downloads\\BMjAyMDA5MTgxOTIzMDBfNTMwNTI4NThfMzYyNDA3Nzc3OTBfMV8z_b_B93bf113be100dc1c98b6b572f8ee19e1.mp4')
            session.send(h.video(buffer2, 'video/mp4'))
        })
        ctx.command('test1').action(async ({ session }) => {
            // 测试撤回消息
            const res = await session.send('应该被撤回消息')
            await ctx.sleep(500)
            session.bot.deleteMessage(session.channelId, res[0])
        })
        ctx.command('test3').action(async ({ session }) => {
            // 测试编辑消息
            const res1 = await session.send('即将编辑test3')
            await ctx.sleep(500)
            session.bot.editMessage(session.channelId, String(Number(res1[0]) - 1), 'test3+已被编辑')
        })
        ctx.command('test4').action(async ({ session }) => {
            // 测试 at
            await session.send(h.at(1) + '测试 at')
        })
        ctx.command('test5').action(async ({ session }) => {
            // 测试 reply
            await session.send(h.quote(160) + '测试 reply')
        })
        ctx.command('test6').action(async ({ session }) => {
            // 测试 markdown
            await session.bot.internal.sendMessage('1', `# 这是一个 Markwon
  - [aaaaaaaaa](https://github.com/initialencounter/mykoishi)
  - bbbbbbb
  - cccc`, 'text/markdown')
        })

    }
}