import { Context } from 'koishi'
import mock from '@koishijs/plugin-mock'
import * as tile from 'koishi-plugin-gh-tile'
import memory from '@koishijs/plugin-database-memory'
import * as inspect from '@koishijs/plugin-inspect'

const app = new Context()
app.plugin(mock)
app.plugin(memory)
app.plugin(tile)
app.plugin(inspect)

const client = app.mock.client('3118087750', '399899914')
const client_not_bind = app.mock.client('not_bind','399899914')

before(async () => {
    await app.start()
    await app.mock.initUser('3118087750', 1)

    await app.database.create('github_tile', {
        username: "initialencounter",
        enable: true,
        userId: "3118087750",
        rules: {
            "selfId": "514",
            "platform": "mock",
            "guildId": "399899914",
            "channelId": "399899914"
        }
    })
    await app.database.create('github_tile', {
        username: "initencounter",
        enable: true,
        userId: "null",
        rules: {
            "selfId": "514",
            "platform": "mock",
            "guildId": "399899914",
            "channelId": "399899914"
        }
    })
    await app.database.create('github_tile', {
        username: "aaa",
        enable: true,
        userId: "zeroTile",
        rules: {
            "selfId": "514",
            "platform": "mock",
            "guildId": "399899914",
            "channelId": "399899914"
        }
    })
    await app.database.create('github_tile', {
        username: "shigma",
        enable: true,
        userId: "2837314711",
        rules: {
            "selfId": "514",
            "platform": "mock",
            "guildId": "399899914",
            "channelId": "399899914"
        }
    });

})

after(() => app.stop())

it('tile', async () => {
    console.dir(await client.receive('inspect'));
    
    // await client.shouldReply('tile')
    // await client.shouldReply('tile -u initencounter',"获取瓷砖失败")
    // await client.shouldReply('tile -u aaa -d 2023-10-31', "aaa 在 2023-10-31 贴了 0 块瓷砖")
    await client_not_bind.shouldReply('tile', "未绑定GitHub，发送tile.bind绑定")
})

it('bind', async ()=>{
    await client_not_bind.shouldReply('tile.bind',"请输入GitHub 用户名：")
    await client_not_bind.receive("initialencounter")
    await client_not_bind.shouldReply("tile.switch","用户initialencounter 关闭瓷砖提醒")
    await client_not_bind.shouldReply("tile.switch","用户initialencounter 开启瓷砖提醒")
})

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
