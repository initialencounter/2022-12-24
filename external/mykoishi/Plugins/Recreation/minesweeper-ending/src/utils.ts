import { Context, Keys, Logger, Session, h } from 'koishi'
import Minefield from "./minesweeper";
import { MinesweeperRank } from '.';
export const name = 'minesweeper-ending'
const logger = new Logger(name)
export interface GameInfo {
    userId: string
    username: string
    score: number
    ChallengeScore: number
    openNums: number
    games: number
    wins: number
}

/**
 * 无猜暴力求解
 * @param m 
 * @param cell 
 * @returns 
 */
export function findNoGuess(m: Minefield, cell: string) {
    // 直到找到无猜
    while (!m.isSolvableFrom(cell)) {
        m = new Minefield(m.width, m.height, m.mines)
    }
    m.openCell(cell)
    // 游戏已结束
    if (!m.isGoingOn()) {
        return findNoGuess(m, cell)
    }
    return m
}


/**
 * 数据库操作，抄自[koishi-plugin-minesweeper](https://github.com/araea/koishi-plugin-minesweeper)
 * @param ctx 
 * @param userId 
 * @param userName 
 * @param score 
 */

export async function updateRank(ctx: Context, info: GameInfo) {
    const rankInfo = await ctx.model.get('minesweeper_ending_rank', { userId: info.userId })
    if (rankInfo.length === 0) {
        await ctx.model.create('minesweeper_ending_rank',
            {
                userName: info.username,
                score: info.score,
                openNums: info.openNums,
                ChallengeScore: info.ChallengeScore,
                games: info.games,
                wins: info.wins
            })
    } else {
        const oldInfo = rankInfo[0]
        await ctx.model.set('minesweeper_ending_rank', { userId: info.userId },
            {
                userName: info.username,
                score: info.score + oldInfo.score,
                openNums: info.openNums + oldInfo.openNums,
                ChallengeScore: info.ChallengeScore + oldInfo.ChallengeScore,
                games: info.games + oldInfo.games,
                wins: info.wins + oldInfo.wins
            }
        )
    }
}

/**
 * 设置挑战模式分数
 * @param ctx 
 * @param userId 
 * @param userName 
 * @param score 
 */

export async function updateChallengeRank(session: Session, ctx: Context, userId: string, userName: string, score: number) {
    // 获取游戏信息
    const rank: MinesweeperRank[] = await ctx.model.get('minesweeper_ending_rank', {})
    // 根据score属性进行降序排序
    const tmp: MinesweeperRank[] = []
    for (var i of rank) {
        if (i.ChallengeScore != 0) {
            tmp.push(i)
        }
    }
    tmp.sort((a, b) => a.ChallengeScore - b.ChallengeScore)
    let title = ''
    if (tmp?.[0]?.userId !== userId && tmp?.[0]?.ChallengeScore > score) {
        session.send(h.at(tmp?.[0]?.userId) + "新的雷帝诞生了")
        await ctx.model.set('minesweeper_ending_rank', { title: "雷帝" }, { title: "" })
        title = "雷帝"
    }
    const rankInfo = await ctx.model.get('minesweeper_ending_rank', { userId: userId })
    if (rankInfo.length === 0) {
        await ctx.model.create('minesweeper_ending_rank', { userId: userId, userName: userName, ChallengeScore: score })
    } else {
        if (rankInfo[0].ChallengeScore == 0) {
            await ctx.model.set('minesweeper_ending_rank', { userId: userId }, { userName: userName, ChallengeScore: score, title: title })
        } else {
            const ds = rankInfo[0].ChallengeScore - score
            if (ds > 0) {
                session.send(`恭喜你，进步了 ${ds}s`)
                await ctx.model.set('minesweeper_ending_rank', { userId: userId }, { userName: userName, ChallengeScore: score, title: title })
            }
        }

    }
}



/**
 * 根据雷图的行和列计算出合适的雷数
 * @param x 行
 * @param y 列
 * @returns 雷数
 */
export function getMineNums(x: number, y: number): number {
    const cells = x * y
    const mineNums = cells * 0.40
    return Math.floor(mineNums)
}



/**
 * 睡眠函数
 * @param ms 等待时间
 * @returns 
 */
export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
* 获取所有数据
* @param ctx 
* @param userId 
* @returns 
*/
export async function getProfiles(ctx: Context, userId: string): Promise<Pick<MinesweeperRank, Keys<MinesweeperRank, any>>> {
    const rankInfo = await ctx.model.get('minesweeper_ending_rank', { userId: userId })
    return rankInfo[0]
}

/**
 * 更新 雷 和 空的池子
 * @param m Minefield
 * @returns Minefield
 */
export function makePool(m: Minefield) {
    m["keyPool"] = []
    m["dgPool"] = []
    for (var i: number = 0; i < m["cells"]; i++) {
        const s = String(i)
        const cellRecent = m[s]
        if (cellRecent["isMine"]) {
            if (!cellRecent["isFlagged"]) {
                m["dgPool"].push(s)
            }
        } else {
            if (!cellRecent["isOpen"]) {
                m["keyPool"].push(s)
            }
        }

    }
    return m
}

/**
 * 渲染
 * @param ctx 
 * @param info 
 * @returns 
 */
export async function renderProfiles(ctx: Context, info: Pick<MinesweeperRank, Keys<MinesweeperRank, any>>) {
    if (!info) {
        return "不在数据库喵~"
    }
    let title = info.title
    if (!title) {
        title = "新手"
        const challengeScore = info.ChallengeScore
        if (challengeScore < 150000) {
            title = "探险家"
        } else if (challengeScore < 100000) {
            title = "炸弹专家"
        } else if (challengeScore < 40000) {
            title = "雷界传奇"
        } else if (challengeScore < 30000) {
            title = "扫雷王"
        } else if (challengeScore < 20000) {
            title = "雷神"
        } else if (challengeScore < 18000) {
            title = "老祖"
        }
    }
    return`${info.userName}\n
头衔：${title}\n
标记模式：${info.isFlag ? "标记" : "无标记"}\n
积分: ${info.score}\n
挑战: ${info.ChallengeScore / 1000}s\n
局数: ${info.games}\n
胜率: ${(info.wins / info.games) * 100}%\n
开启方块: ${info.openNums}\n
`+h.image(`http://q1.qlogo.cn/g?b=qq&nk=${info.userId}&s=100`)
}