import { Context, segment, Dict, Schema } from 'koishi'
import { } from 'koishi-plugin-puppeteer'
import { } from '@koishijs/plugin-help'
import {  MoveResult, ChessPiece, chessHeader, ChessMap, Ichess } from './type'
import { ChessState } from './chess'


declare module 'koishi' {
  interface Channel {
    ichess: Ichess
  }
}

const states: Dict<ChessState> = {}


export const name = 'chess'
export const inject = {
  optional: ['puppeteer', 'database'],
}

export interface Config { }

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  ctx.model.extend('channel', {
    // do not use shorthand because the initial value is `null`
    ichess: { type: 'json' },
  })

  ctx = ctx.guild()

  ctx.command('chess [position]', '棋类游戏')
    .userFields(['name'])
    .channelFields(['ichess'])
    .alias('落子')
    .alias('悔棋', { options: { repent: true } })
    .alias('国际象棋', { options: { size: 8, rule: 'ichess' } })
    .alias('停止下棋', { options: { stop: true } })
    .alias('跳过回合', { options: { skip: true } })
    .alias('查看棋盘', { options: { show: true } })
    .option('skip', '跳过回合')
    .option('repent', '悔棋')
    .option('show', '-v, --show, --view  显示棋盘')
    .option('stop', '-e, --stop, --end  停止游戏')
    .option('imageMode', '-i  使用图片模式', { hidden: () => !ctx.puppeteer })
    .option('textMode', '-t  使用文本模式', { hidden: () => !ctx.puppeteer })
    .usage([
      '输入“国际象棋”开始对应的一局游戏。',
    ].join('\n'))
    .action(async ({ session, options }, position) => {
      const { cid, userId, channel = { chess: null } } = session
      if (!states[cid]) {
        if (position || options.stop || options.repent || options.skip) {
          return '没有正在进行的游戏。输入“国际象棋”开始对应的一局游戏。'
        }

        const state = new ChessState()
        state.p1 = userId
        states[cid] = state

        return state.draw(session, `${session.username} 发起了游戏！`)
      }

      if (options.stop) {
        delete states[cid]
        return '游戏已停止。'
      }

      const state = states[cid]

      if (options.show) return '这是一个棋盘'

      if (options.textMode) {
        state.imageMode = false
        return '已切换到文本模式。'
      } else if (options.imageMode) {
        state.imageMode = true
        return '已切换到图片模式。'
      }

      if (state.p2 && state.p1 !== userId && state.p2 !== userId) {
        return '游戏已经开始，无法加入。'
      }

      if (options.skip) {
        if (!state.next) return '对局尚未开始。'
        if (state.next !== userId) return '当前不是你的回合。'
        state.next = state.p1 === userId ? state.p2 : state.p1
      }

      if (options.repent) {
        if (!state.next) return '对局尚未开始。'
        const last = state.p1 === state.next ? state.p2 : state.p1
        if (last !== userId) return '上一手棋不是你所下。'
        state.next = last
        return `${session.username} 进行了悔棋。`
      }

      if (!position) return '请输入坐标。'

      if (state.p2 && userId !== state.next) return '当前不是你的回合。'

      let chessPiece: ChessPiece

      const rawChessPiece = position.slice(0, 1).toLowerCase();
      if (!chessHeader.has(rawChessPiece)) {
        return "未指定棋子，示例: pe4, pf3"
      }
      chessPiece = rawChessPiece as ChessPiece
      if (position.length !== 3) {
        return "坐标不合法"
      }

      console.log(chessPiece)
      const [x, y] = [
        ChessMap[position.slice(1, 2)] ?? parseInt(position.slice(1, 2)),
        ChessMap[position.slice(2, position.length)] ?? parseInt(position.slice(2, position.length))
      ]

      let message = ''
      if (state.next || userId === state.p1) {
        message = `${session.username} 落子于 ${position.toUpperCase()}，`
      } else {
        if (state.history.length === 1) {
          state.p2 = state.p1
          state.p1 = userId
        } else {
          state.p2 = userId
        }
        message = `${session.username} 加入了游戏并落子于 ${position.toUpperCase()}，`
      }

      const value = userId === state.p1 ? 1 : -1
      let result = state.update(x, y, value, chessPiece)


      switch (result) {
        case MoveResult.illegal:
          state.next = userId
          return '非法落子。'
        case MoveResult.skip:
          message += `下一手依然轮到 ${segment.at(userId)}。`
          break
        case MoveResult.p1Win:
          delete states[cid]
          return message + `恭喜 ${segment.at(state.p1)} 获胜！`
        case MoveResult.p2Win:
          delete states[cid]
          return message + `恭喜 ${segment.at(state.p2)} 获胜！`
        case MoveResult.draw:
          delete states[cid]
          return message + '本局游戏平局。'
        case undefined:
          // eslint-disable-next-line no-cond-assign
          if (state.next = userId === state.p1 ? state.p2 : state.p1) {
            message += `下一手轮到 ${segment.at(state.next)}。`
          } else {
            message = message.slice(0, -1) + '。'
          }
          break
        default:
          state.next = userId
          return `非法落子（${result}）。`
      }


      return state.draw(session, message, x, y)
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