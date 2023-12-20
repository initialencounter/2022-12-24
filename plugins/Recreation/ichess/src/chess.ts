import type * as puppeteer from 'koishi-plugin-puppeteer'
import { Context, Session } from 'koishi'
import { Chess } from 'chess.js'
import { ChessPiece, Ichess, MoveResult } from './type'



export class ChessState {
    p1: string
    p2: string
    next: string
    history: string = ""
    imageMode: boolean
    board: Chess
    update: (this: ChessState, x: number, y: number, value: 1 | -1, chessPieces?: ChessPiece) => MoveResult | string

    constructor(ichess?:Ichess) {
        if (ichess && typeof ichess === 'object') {
            Object.assign(this, { ...ichess });

        }
        this.board = new Chess(this.history)
    }


    drawSvg(x?: number, y?: number) {

    }

    drawText(x?: number, y?: number) {

    }

    async draw(session: Session, message = '', x?: number, y?: number) {
        if (message) message += '\n'
        if (this.imageMode && session.app.puppeteer) {
            message += this.drawSvg(x, y)
        } else {
            message += this.drawText(x, y)
        }
        await session.send(message)
    }
}
