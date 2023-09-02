import { Context } from "koishi";


// 获取今日瓷砖数，
export async function getTileNums(ctx: Context, username: string,date:string) {
    let html: string
    try {
        html = await ctx.http.get(`https://github.com/${username}`)
    } catch (e) {
        return false
    }
    // 构建正则表达式
    const reg = new RegExp(`(?<=class="ContributionCalendar-day" data-date="${date}" data-level="1"><span class="sr-only">)([\\s\\S]*?)(?=</span></td>)`, 'g')
    // 匹配瓷砖
    const dr = html.match(reg)
    if (!dr) {
        return false
    }
    // 数据清洗
    const num = Number(dr[0].split(" ")[0])
    if (isNaN(num)) {
        return false
    }
    return num

}