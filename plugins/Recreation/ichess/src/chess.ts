import { Chess, Move } from 'chess.js'
import {Ichess, MoveResult, Player } from './type'



export class ChessState {
    serial(): Ichess {
        // 序列化
        return { p1: this.p1, p2: this.p2, next: this.next,pgn: this.board.pgn()}
    }
    p1: string
    p2: string
    player1: Player
    player2: Player
    next: string
    pgn: string = ''
    board: Chess
    update(chessMoveString: string): { res: MoveResult, ascii: string, move?: Move } {
        try {
            const move = this.board.move(chessMoveString)
            const res = this.board.ascii()
            if (!this.board.isGameOver()) {
                return { res: MoveResult.next, ascii: res, move }
            } else {
                return { res: MoveResult.end, ascii: res, move }
            }
        } catch (e) {
            return { res: MoveResult.illegal, ascii: e }
        }
    }

    async undo(){
        try {
            this.board.undo()
            const res = this.board.ascii()
            return { res: MoveResult.next, ascii: res}
        } catch (e) {
            return { res: MoveResult.illegal, ascii: e }
        }

    }

    constructor(ichess?: Ichess) {
        if (ichess && typeof ichess === 'object') {
            Object.assign(this, { ...ichess })

        }
        this.board = new Chess()
        if(this.pgn){
            this.board.loadPgn(this.pgn)
        }
    }
}
