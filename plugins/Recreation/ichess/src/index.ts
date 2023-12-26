import { Context, segment, Dict, Schema } from 'koishi'
import { } from 'koishi-plugin-puppeteer'
import { } from '@koishijs/plugin-help'
import { MoveResult, Ichess } from './type'
import { ChessState } from './chess'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { drawBoard } from './render'
import { parseInput } from './utils'


declare module 'koishi' {
  interface Channel {
    ichess: Ichess
  }
}

const states: Dict<ChessState> = {}


export const name = 'ichess'
export const inject = {
  required: ['puppeteer'],
  optional: ['database']
}

export interface Config {
  prefix: string
}

export const Config: Schema<Config> = Schema.object({
  prefix: Schema.string().default('i').description('棋谱前缀，【创建对局】 不会受影响')
})

export const usage = readFileSync(resolve(__dirname, '../readme.md')).toString('utf-8').split('更新日志')[0]

export function apply(ctx: Context, config: Config) {
  ctx.model.extend('channel', {
    // do not use shorthand because the initial value is `null`
    ichess: { type: 'json' },
  })

  ctx = ctx.guild()

  ctx.middleware(async (session, next) => {
    let position: string = session.content.replace(config.prefix, '')
    if (session.content.startsWith(config.prefix)) {
      if (position?.length > 1) {
        session.execute('ichess ' + position)
        return
      }
    }
    return next()
  })
  ctx.command('ichess [position]', '棋类游戏')
    .userFields(['name'])
    .channelFields(['ichess'])
    .alias('悔棋', { options: { repent: true } })
    .alias('国际象棋')
    .alias('停止下棋', { options: { stop: true } })
    .alias('查看棋盘', { options: { show: true } })
    .alias('查看pgn', { options: { pgn: true } })
    .option('repent', '悔棋')
    .option('show', '-v, --show, --view  显示棋盘')
    .option('stop', '-e, --stop, --end  停止游戏')
    .option('pgn', '-p 显示 pgn')
    .usage([
      '输入“国际象棋”开始对应的一局游戏。',
    ].join('\n'))
    .action(async ({ session, options }, position) => {
      const { cid, userId, channel = { ichess: null } } = session
      if (!states[cid]) {
        if (position || options.stop || options.repent) {
          return '没有正在进行的游戏。输入“国际象棋”开始对应的一局游戏。'
        }

        const state = new ChessState()
        state.p1 = userId
        state.player1 = { id: userId, name: session.username, avatar: session?.event?.member?.avatar ?? '' }
        states[cid] = state
        session.send(`${session.username} 发起了国际象棋, 输入指令 ichess 加入对局！`)
        const boardImg = await drawBoard(ctx, state, { res: 1 })
        return boardImg
      }

      if (options.stop) {
        channel.ichess = null
        delete states[cid]
        return '游戏已停止。'
      }

      const state = states[cid]

      if (options.show) {
        const boardImg = await drawBoard(ctx, state, { res: 1 })
        return boardImg
      }

      if (state.p2 && state.p1 !== userId && state.p2 !== userId) {
        return '游戏已经开始，无法加入。'
      }

      if (options.repent) {
        if (!state.next) return '对局尚未开始。'
        const last = state.p1 === state.next ? state.p2 : state.p1
        if (last !== userId) return '上一手棋不是你所下。'
        const res = await state.undo()
        if (res.res == MoveResult.illegal) {
          return `悔棋失败`
        } else {
          state.next = last
          channel.ichess = state.serial()
          return `${session.username} 进行了悔棋。`
        }
      }
      if (options.pgn) {
        return state.board.pgn()
      }
      if (!position && !state.p2) {
        if (userId == state.p1) {
          session.send(`${session.username} 发起了国际象棋, 输入指令 chess 加入对局！`)
          const boardImg = await drawBoard(ctx, state, { res: 1 })
          return boardImg
        }
        state.p2 = userId
        state.player2 = { id: userId, name: session.username, avatar: session?.event?.member?.avatar ?? '' }
        state.next = state.p1
        return `${session.username}加入了游戏，下一手轮到${segment.at(state.next) ?? state.next}。`
      }
      if (!position) {
        return `请输入棋谱`
      }

      if (state.p2 && userId !== state.next) return `当前是${state.next}的回合。`

      if (!state.p2 && userId !== state.p1) {
        state.p2 = userId
      }

      position = parseInput(position)

      let message = ''
      let result = state.update(position)


      switch (result.res) {
        case MoveResult.illegal:
          state.next = userId
          return '非法落子。'
        case MoveResult.skip:
          state.next = userId
          message += `下一手依然轮到 ${segment.at(userId)}。`
          break
        case MoveResult.end:
          channel.ichess = null
          delete states[cid]
          return message + `恭喜 ${segment.at(state.next)} 获胜！`
        case MoveResult.next:
          state.next = (userId === state.p1) ? state.p2 : state.p1
          message += `下一手轮到 ${segment.at(state.next) ?? state.next}。`
      }
      channel.ichess = state.serial()
      session.send(message)
      return await drawBoard(ctx, state, result)

    })

  ctx.inject(['database'], async (ctx) => {
    const channels = await ctx.database.getAssignedChannels(['id', 'ichess'])
    for (const { id, ichess } of channels) {
      if (ichess) {
        states[id] = new ChessState(ichess)
      }
    }
  })
}