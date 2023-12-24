import { chessHeader } from './type'


export function parseInput(moveString: string): string {
    let chessString = moveString.slice(0,1)
    if(!chessHeader.has(chessString)){
        return moveString
    }
    return chessString.toUpperCase()+moveString.slice(1,moveString.length)
}