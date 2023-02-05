import { Context, Schema } from 'koishi'

export const name = 'mswar-active-rank'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  ctx.command('扫雷活跃榜').alias('ms-ac').action(async()=>{
    const res:string = await ctx.http.get('http://116.205.167.54:5140/get')
    const json_res =  JSON.parse(res)
    const today_rank_ms = json_res.mine_rank['今日']['高级']
    const today_rank_pz = json_res.puzzle_rank['今日']['4x4']
    console.log(today_rank_ms)
    console.log(today_rank_pz)
    const item:any[] = [<div>{json_res.update_time}</div>]
    today_rank_ms.forEach((i,id)=>{
      item.push(<div>{i[0]} {i[1]} {i[3]}</div>)
    })
    return <html>
      {item}
    </html>
  })
}
