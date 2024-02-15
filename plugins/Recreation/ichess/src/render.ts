import { Color, Move, PieceSymbol, Square } from 'chess.js'
import { } from 'koishi-plugin-puppeteer'
import { Context } from 'koishi'
import { ChessState } from './chess'
import { MoveResult, Theme } from './type'
import { Config } from '.'
import { writeFileSync } from 'fs'

const ChessMapR = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
function drawHTML(chessboard: {
    square: Square;
    type: PieceSymbol;
    color: Color;
}[][], from: string, to: string, r: boolean, theme: Theme) {
    let white_chess_color = (theme.white_chess ?? "#fff").replace("#","%23")
    let black_chess_color = (theme.black_chess ?? "none").replace("#","%23")
    // 遍历每一行
    let innerHTMLChess = ''
    if (r) {
        for (let i = 9; i > 1; i--) {
            // 遍历每一行中的每一个方格
            innerHTMLChess += `<div class="index-r square">${10 - i}</div>`
            for (let j = 9; j > 1; j--) {
                const square_className1 = `square ${(i + j) % 2 === 0 ? 'white' : 'black'}`;
                const pieceObj = chessboard[i - 2]?.[j - 2]
                let piece = ''
                let square_className = square_className1
                const square = ChessMapR[j-2] + (10-i)
                if (square === from) {
                    square_className = 'square yellow'
                }
                if (square === to) {
                    square_className = 'square yellow'
                }
                if (!pieceObj) {
                    piece = `<div class="${square_className}"></div>`
                }

                else {
                    piece = `<div class="${pieceObj.color}-${pieceObj.type} ${square_className}" ></div>`
                }
                // 如果方格中有棋子，将SVG添加到方格中
                innerHTMLChess += piece
            }
            innerHTMLChess += `<div class="index-r square"></div>`

        }
        innerHTMLChess += `<div class="index-c square"></div>
        <div class="index-c square">h</div>
        <div class="index-c square">g</div>
        <div class="index-c square">f</div>
        <div class="index-c square">e</div>
        <div class="index-c square">d</div>
        <div class="index-c square">c</div>
        <div class="index-c square">b</div>
        <div class="index-c square">a</div>
        <div class="index-c square"></div>`
    } else {
        for (let i = 1; i < 9; i++) {
            // 遍历每一行中的每一个方格
            innerHTMLChess += `<div class="index-r square">${9 - i}</div>`
            for (let j = 1; j < 9; j++) {
                const square_className1 = `square ${(i + j) % 2 === 0 ? 'white' : 'black'}`;
                const pieceObj = chessboard[i - 1]?.[j - 1]
                let piece = ''
                let square_className = square_className1
                const square = ChessMapR[j - 1] + (9 - i)
                if (square === from) {
                    square_className = 'square yellow'
                }
                if (square === to) {
                    square_className = 'square yellow'
                }
                if (!pieceObj) {
                    piece = `<div class="${square_className}"></div>`
                }

                else {
                    piece = `<div class="${pieceObj.color}-${pieceObj.type} ${square_className}" ></div>`
                }
                // 如果方格中有棋子，将SVG添加到方格中
                innerHTMLChess += piece
            }
            innerHTMLChess += `<div class="index-r square"></div>`

        }
        innerHTMLChess += `<div class="index-c square"></div>
        <div class="index-c square">a</div>
        <div class="index-c square">b</div>
        <div class="index-c square">c</div>
        <div class="index-c square">d</div>
        <div class="index-c square">e</div>
        <div class="index-c square">f</div>
        <div class="index-c square">g</div>
        <div class="index-c square">h</div>
        <div class="index-c square"></div>`
    }

    return `<!DOCTYPE html>
    <html lang="zh-CN" style="width: 462px;height: 450px">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            .w-p {
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cpath d='M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z' fill='${white_chess_color}' stroke='%23000' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")
            }
            
            .w-n {
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cg fill='none' fill-rule='evenodd' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21' fill='${white_chess_color}'/%3E%3Cpath d='M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3' fill='${white_chess_color}'/%3E%3Cpath d='M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0zm5.433-9.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5z' fill='%23000'/%3E%3C/g%3E%3C/svg%3E")
            }
            
            .w-b {
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cg fill='none' fill-rule='evenodd' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cg fill='${white_chess_color}' stroke-linecap='butt'%3E%3Cpath d='M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z'/%3E%3Cpath d='M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z'/%3E%3Cpath d='M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z'/%3E%3C/g%3E%3Cpath d='M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5' stroke-linejoin='miter'/%3E%3C/g%3E%3C/svg%3E")
            }
            
            .w-r {
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cg fill='${white_chess_color}' fill-rule='evenodd' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 39h27v-3H9v3zm3-3v-4h21v4H12zm-1-22V9h4v2h5V9h5v2h5V9h4v5' stroke-linecap='butt'/%3E%3Cpath d='M34 14l-3 3H14l-3-3'/%3E%3Cpath d='M31 17v12.5H14V17' stroke-linecap='butt' stroke-linejoin='miter'/%3E%3Cpath d='M31 29.5l1.5 2.5h-20l1.5-2.5'/%3E%3Cpath d='M11 14h23' fill='none' stroke-linejoin='miter'/%3E%3C/g%3E%3C/svg%3E")
            }
            
            .w-q {
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cg fill='${white_chess_color}' fill-rule='evenodd' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm16.5-4.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM16 8.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM33 9a2 2 0 1 1-4 0 2 2 0 1 1 4 0z'/%3E%3Cpath d='M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-14V25L7 14l2 12z' stroke-linecap='butt'/%3E%3Cpath d='M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z' stroke-linecap='butt'/%3E%3Cpath d='M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0' fill='none'/%3E%3C/g%3E%3C/svg%3E")
            }
            
            .w-k {
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cg fill='none' fill-rule='evenodd' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M22.5 11.63V6M20 8h5' stroke-linejoin='miter'/%3E%3Cpath d='M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5' fill='${white_chess_color}' stroke-linecap='butt' stroke-linejoin='miter'/%3E%3Cpath d='M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10V37z' fill='${white_chess_color}'/%3E%3Cpath d='M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0'/%3E%3C/g%3E%3C/svg%3E")
            }
            
            .b-p {
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cpath xmlns='http://www.w3.org/2000/svg' d='M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z' fill='${black_chess_color}' stroke='%23000' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")
            }
            
            .b-n {
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cg fill='none' fill-rule='evenodd' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21' fill='${black_chess_color}'/%3E%3Cpath d='M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3' fill='${black_chess_color}'/%3E%3Cpath d='M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0zm5.433-9.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5z' fill='%23ececec' stroke='%23ececec'/%3E%3Cpath d='M24.55 10.4l-.45 1.45.5.15c3.15 1 5.65 2.49 7.9 6.75S35.75 29.06 35.25 39l-.05.5h2.25l.05-.5c.5-10.06-.88-16.85-3.25-21.34-2.37-4.49-5.79-6.64-9.19-7.16l-.51-.1z' fill='%23ececec' stroke='none'/%3E%3C/g%3E%3C/svg%3E")
            }
            
            .b-b {
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cg fill='none' fill-rule='evenodd' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cg fill='${black_chess_color}' stroke-linecap='butt'%3E%3Cpath d='M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z'/%3E%3Cpath d='M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z'/%3E%3Cpath d='M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z'/%3E%3C/g%3E%3Cpath d='M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5' stroke='%23ececec' stroke-linejoin='miter'/%3E%3C/g%3E%3C/svg%3E")
            }
            
            .b-r {
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cg fill='${black_chess_color}' fill-rule='evenodd' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 39h27v-3H9v3zm3.5-7l1.5-2.5h17l1.5 2.5h-20zm-.5 4v-4h21v4H12z' stroke-linecap='butt'/%3E%3Cpath d='M14 29.5v-13h17v13H14z' stroke-linecap='butt' stroke-linejoin='miter'/%3E%3Cpath d='M14 16.5L11 14h23l-3 2.5H14zM11 14V9h4v2h5V9h5v2h5V9h4v5H11z' stroke-linecap='butt'/%3E%3Cpath d='M12 35.5h21m-20-4h19m-18-2h17m-17-13h17M11 14h23' fill='none' stroke='%23ececec' stroke-width='1' stroke-linejoin='miter'/%3E%3C/g%3E%3C/svg%3E")
            }
            
            .b-q {
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cg fill='${black_chess_color}' fill-rule='evenodd' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cg stroke='none'%3E%3Ccircle cx='6' cy='12' r='2.75'/%3E%3Ccircle cx='14' cy='9' r='2.75'/%3E%3Ccircle cx='22.5' cy='8' r='2.75'/%3E%3Ccircle cx='31' cy='9' r='2.75'/%3E%3Ccircle cx='39' cy='12' r='2.75'/%3E%3C/g%3E%3Cpath d='M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 6.5 13.5 9 26z' stroke-linecap='butt'/%3E%3Cpath d='M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z' stroke-linecap='butt'/%3E%3Cpath d='M11 38.5a35 35 1 0 0 23 0' fill='none' stroke-linecap='butt'/%3E%3Cpath d='M11 29a35 35 1 0 1 23 0m-21.5 2.5h20m-21 3a35 35 1 0 0 22 0m-23 3a35 35 1 0 0 24 0' fill='none' stroke='%23ececec'/%3E%3C/g%3E%3C/svg%3E")
            }
            
            .b-k {
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cg fill='none' fill-rule='evenodd' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M22.5 11.63V6' stroke-linejoin='miter'/%3E%3Cpath d='M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5' fill='${black_chess_color}' stroke-linecap='butt' stroke-linejoin='miter'/%3E%3Cpath d='M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10V37z' fill='${black_chess_color}'/%3E%3Cpath d='M20 8h5' stroke-linejoin='miter'/%3E%3Cpath d='M32 29.5s8.5-4 6.03-9.65C34.15 14 25 18 22.5 24.5l.01 2.1-.01-2.1C20 18 9.906 14 6.997 19.85c-2.497 5.65 4.853 9 4.853 9' stroke='%23ececec'/%3E%3Cpath d='M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0' stroke='%23ececec'/%3E%3C/g%3E%3C/svg%3E")
            }
            .chessboard {
                display: grid;
                grid-template-columns: repeat(10, 45px);
                grid-template-rows: repeat(10, 45px);
            }
    
            .square {
                width: 45px;
                height: 45px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
    
            .white {
                background-color: ${theme.white_grid};
            }
            
            .yellow {
                background-color: ${theme.hight_light};
            }
            .index-r {
                background-color: white;
                font-size: 20px;
            }
            .index-c {
                background-color: white;
                font-size: 20px;
            }
            .black {
                background-color: ${theme.black_grid};
            }
            .avatar {
                position: absolute;
                right: 20%;
                top: 20%;
            }
        </style>
    </head>
    
    <body>
        <div class="chessboard" id="chessboard-container">
            <div class="index-c square"></div>
            <div class="index-c square"></div>
            <div class="index-c square"></div>
            <div class="index-c square"></div>
            <div class="index-c square"></div>
            <div class="index-c square"></div>
            <div class="index-c square"></div>
            <div class="index-c square"></div>
            <div class="index-c square"></div>
            <div class="index-c square"></div>
            ${innerHTMLChess}
        </div>
        <div class="avatar" style="position: absolute; right: 20%; top: 20%">
            <img src="D:\\dev\\mykoishi\\plugins\\News\\gh-tile\\src\\0.jpg">
        </div>
    </body>
    
    </html>`
}


export async function drawBoard(ctx: Context, state: ChessState, result: { res: MoveResult, move?: Move }, config:Config ) {
    let html: string
    let r: boolean = false
    if (state.next === state.p2 && config.reserve_board) {
        r = true
    }
    if (!result.move) {
        html = drawHTML(state.board.board(), '', '', false, config.theme)
    }
    else {
        html = drawHTML(state.board.board(), result.move.from, result.move.to, r, config.theme)
    }
    writeFileSync('./test.html',html)
    return await ctx.puppeteer.render(html)
}
