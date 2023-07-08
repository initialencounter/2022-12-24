import { Context, Schema } from 'koishi'
import iconv from 'iconv-lite';
import xpath from 'xpath';
const dom = require('xmldom').DOMParser;

export const name = 'saolei'

export interface Config { }

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
    ctx.command('雷网 <id:number>', '查看雷网帖子', { checkArgCount: true }).action(async ({ }, id) => {
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
}
