import { Context, Schema } from 'koishi'
import iconv from 'iconv-lite';
import xpath from 'xpath';
const dom = require('xmldom').DOMParser;

export const name = 'saolei'

export interface Config { }

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
    ctx.command('stnb.雷网 <id:number>', '查看雷网帖子', { checkArgCount: true }).action(async ({ }, id) => {
        const res: Buffer = await ctx.http.get(`http://saolei.wang/BBS/Title.asp?Id=${id}`, { responseType: "arraybuffer" })
        const buf = iconv.decode(res, 'gb2312');
        const html = buf.toString()
        const doc = new dom().parseFromString(html, 'text/xml');
        const titles = xpath.select("//table/tr/td/span[@class='High']", doc)[0]["childNodes"]["0"].data
        const content = xpath.select("//tr[@bgcolor='#333333']/td[@valign='top']/table/tr/td", doc)[0]["childNodes"]["0"].data
        const author = xpath.select("//table/tr/td/a[@title='点击查看个人信息']", doc)[0]["childNodes"]["0"].data
        const msg = titles + '\n' + author + '\n' + content
        return msg
    })
    ctx.command('stnb.雷网用户 <id:number>', '查看雷网用户',{checkArgCount:true}).action(async({},id)=>{
        const res: Buffer = await ctx.http.get(`http://saolei.wang/Player/Info.asp?Id=${id}`, { responseType: "arraybuffer" })
        const buf = iconv.decode(res, 'gb2312');
        const html = buf.toString()
        const doc = new dom().parseFromString(html, 'text/xml');
        const pop = xpath.select("/html/body/table/tr/td/table/tr/td/span", doc)
        const score = xpath.select("/html/body/table/tr/td[@class='Text']/a", doc)
        const info = xpath.select("/html/body/table/tr/td[@class='Text']/span", doc)
        const word = []
        const scores = []
        info.forEach((i)=>{
            word.push(i?.["childNodes"]?.['0']?.data)
        })
        score.forEach((i)=>{
            scores.push(i?.["childNodes"]?.['0']?.data)
        })
        let msg = `${word[0]} | ${word[1]}${word[2]}
${word.slice(3,7).join('')}\n
初级：${scores[0]} | ${scores[1]}
中级：${scores[2]} | ${scores[3]}
高级：${scores[4]} | ${scores[5]}
总计: ${word[7]} | ${word[8]}\n
综合人气：${pop[0]?.["childNodes"]?.['0']?.data}
本日人气：${pop[1]?.["childNodes"]?.['0']?.data}
        `
        return msg

    })
}
