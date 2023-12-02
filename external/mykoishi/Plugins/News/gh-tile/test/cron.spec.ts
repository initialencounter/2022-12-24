import { Context } from 'koishi'
import * as tile from 'koishi-plugin-gh-tile'
import memory from '@koishijs/plugin-database-memory'
import * as inspect from '@koishijs/plugin-inspect'
import { exit } from 'process'
import { getTileNums } from 'koishi-plugin-gh-tile/lib/utils'
const app = new Context()

app.plugin(memory);
app.plugin(tile);
app.plugin(inspect);


(async () => {
    await app.start()
    // const t = await getTileNums(app,'initialencounter','2025-01-06')
    // console.log('tile',t)
    // exit()
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
    await app.database.create('github_tile', {
        username: "shigma",
        enable: true,
        userId: "2837314711",
        rules: {
            "selfId": "514",
            "platform": "mock",
            "guildId": "111",
            "channelId": "111"
        }
    });

    const rankInfo = await app.database.get('github_tile', { enable: { $eq: true } })
    tile.alertList.push(...rankInfo)
    await tile.alertCallbackFunctionasync(app);
    exit()
})()
