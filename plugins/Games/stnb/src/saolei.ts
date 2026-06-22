import { Context, Schema } from 'koishi'
import iconv from 'iconv-lite';
import * as cheerio from 'cheerio';

export const name = 'saolei'

export interface Config { }

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
    ctx.command('stnb.雷网 <id:number>', '查看雷网帖子', { checkArgCount: true }).action(async ({ }, id) => {
        const res: ArrayBuffer = await ctx.http.get(`http://saolei.wang/BBS/Title.asp?Id=${id}`, { responseType: "arraybuffer" })
        const buf = iconv.decode(Buffer.from(res), 'gb2312');
        const html = buf.toString()
        const $ = cheerio.load(html);
        const title = $('span.High').first().text()
        const content = $('tr[bgcolor="#333333"] td[valign="top"] table tr td').first().text()
        const author = $('a[title="点击查看个人信息"]').first().text()
        const msg = title + '\n' + author + '\n' + content
        return msg
    })
    ctx.command('stnb.雷网用户 <id:number>', '查看雷网用户',{checkArgCount:true}).action(async({},id)=>{
        const res: ArrayBuffer = await ctx.http.get(`http://saolei.wang/Player/Info.asp?Id=${id}`, { responseType: "arraybuffer" })
        const buf = iconv.decode(Buffer.from(res), 'gb2312');
        const html = buf.toString()
        const $ = cheerio.load(html);
        const pop = $('body > table > tr > td > table > tr > td > span')
        const scores = $('td.Text > a')
        const info = $('td.Text > span')
        const word: string[] = []
        const scoreList: string[] = []
        info.each((_, el) => {
            word.push($(el).text())
        })
        scores.each((_, el) => {
            scoreList.push($(el).text())
        })
        let msg = `${word[0]} | ${word[1]}${word[2]}
${word.slice(3,7).join('')}\n
初级：${scoreList[0]} | ${scoreList[1]}
中级：${scoreList[2]} | ${scoreList[3]}
高级：${scoreList[4]} | ${scoreList[5]}
总计: ${word[7]} | ${word[8]}\n
综合人气：${pop.eq(0).text()}
本日人气：${pop.eq(1).text()}
        `
        return msg

    })
}
