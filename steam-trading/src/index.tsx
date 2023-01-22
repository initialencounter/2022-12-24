import { Context, Schema, Logger } from "koishi";
const cheerios = require('cheerio')
import { } from 'koishi-plugin-puppeteer'
export const name = "steam-trading";
const logger = new Logger(name);
export const usage = `
## 注意事项
> 使用前在 <a href="http://www.iflow.work">iflow.work</a> 中获取cookie
本插件仅供学习参考，请勿用于商业行为
对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-steam-trading 概不负责。
如果有更多文本内容想要修改，可以在<a href="/locales">本地化</a>中修改 zh 内容
`
export interface Config {
  Hm_lpvt_a5301d501cd73accbee89775308fdd5e: number
  text_len: number
  ifimg: boolean
}

export const Config: Schema<Config> = Schema.object({
  Hm_lpvt_a5301d501cd73accbee89775308fdd5e: Schema.number().required(true).description('cookie'),
  text_len: Schema.number().default(15).description('显示条目数量'),
  ifimg: Schema.boolean().default(true).description('是否以图片格式发送')
});

export function apply(ctx: Context, config: Config) {
  ctx.i18n.define('zh', require('./locales/zh'))
  ctx.command("trad").alias('steam-trading')
    .action(async ({ session }) => {
      try {
        const res_html: string = await ctx.http.get('http://www.iflow.work', { data: { 'Hm_lpvt_a5301d501cd73accbee89775308fdd5e': config.Hm_lpvt_a5301d501cd73accbee89775308fdd5e } })
        const res: string[][] = get_body(res_html, config.text_len)
        const tr_items: any[] = []
        let res_text = 'Steam 挂刀行情http://www.iflow.work\n'
        for (var i in res) {
          const tr_item = <div><p>{res[i][0]}. {res[i][1]}</p><div>日成交量: {res[i][2]}  平台最低售价: {res[i][3]} 寄售比例: {res[i][4]}</div></div>
          res_text += `${res[i][0]}. ${res[i][1]}日成交量: ${res[i][2]}  平台最低售价: ${res[i][3]} 寄售比例: ${res[i][4]}\n\n`
          tr_items.push(tr_item)
        }
        if (config.ifimg) {
          if (!ctx.puppeteer) {
            session.send(session.text('commands.trad.messages.no-pptr'))
            return res_text
          }
          return <html>
            <p>{'Steam 挂刀行情http://www.iflow.work'}</p>
            <tbody >
              {tr_items}
            </tbody>
          </html>
        } else {
          return res_text
        }
      }
      catch (err) {
        logger.warn(err)
        return String(err)
      }
    });
}

function get_body(html_str: string, text_len: number) {
  const $ = cheerios.load(html_str)
  const tbody: string = $('tbody').html()
  const table_arr = tbody.split('data-id')
  const res_arr = []
  table_arr.slice(1, text_len).forEach((i, id) => {
    const td1_start: number = i.search('<td') + 4
    const td1_end: number = i.search('</td>')
    const td1_text: string = i.slice(td1_start, td1_end)
    const td1_after: string = i.slice(td1_end + 5, -1)

    const td2_start: number = td1_after.search('.png">') + 6
    const td2_end: number = td1_after.search('</td>')
    const td2_text: string = td1_after.slice(td2_start, td2_end - 10)
    const td2_after: string = td1_after.slice(td2_end + 5, -1)

    const td3_start: number = td2_after.search('<td') + 4
    const td3_end: number = td2_after.search('</td>')
    const td3_text: string = td2_after.slice(td3_start, td3_end)
    const td3_after: string = td2_after.slice(td3_end + 5, -1)

    const td4_start: number = td3_after.search('<td') + 4
    const td4_end: number = td3_after.search('</td>')
    const td4_text: string = td3_after.slice(td4_start, td4_end)
    const td4_after: string = td3_after.slice(td4_end + 5, -1)

    const td5_start: number = td4_after.search('>') + 1
    const td5_end: number = td4_after.search('</td>')
    const td5_text: string = td4_after.slice(td5_start, td5_end)

    res_arr.push([td1_text, td2_text, td3_text, td4_text, td5_text])
  });
  return res_arr
}
