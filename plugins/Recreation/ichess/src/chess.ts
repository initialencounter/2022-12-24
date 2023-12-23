import type * as puppeteer from 'koishi-plugin-puppeteer'
import { Context, Session } from 'koishi'
import { Chess } from 'chess.js'
import { ChessMoveString, ChessPiece, Ichess, MoveResult } from './type'



export class ChessState {
    serial():Ichess {
        return { p1: this.p1, p2: this.p2, next: this.next, history: this.history, imageMode: this.imageMode }
    }
    p1: string
    p2: string
    next: string
    history: string = ""
    imageMode: boolean
    board: Chess
    update(chessPieces: ChessMoveString):{res:MoveResult,boardString:string}{
        this.board.move(chessPieces)
        return {res:MoveResult.draw,boardString:''}
    }

    constructor(ichess?: Ichess) {
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
