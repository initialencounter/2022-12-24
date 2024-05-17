import { Context } from "koishi"
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs"
import { resolve } from "path";
import { ChatHistory } from "./type";
import { logger } from ".";

export function getChatHistory(ctx: Context): ChatHistory {
    let history = []
    let history_dir = resolve(ctx.baseDir, 'data/coze')
    if (!existsSync(history_dir)) {
        mkdirSync(history_dir, { recursive: true })
    }
    let history_path = resolve(ctx.baseDir, 'data/coze/history.json')
    try {
        history = JSON.parse(readFileSync(history_path, 'utf-8'));
    } catch (e) {
        writeFileSync(resolve(history_dir, '请将coze的history.json放在这里.txt'), '')
        logger.warn(e);
    }
    return history as ChatHistory
}