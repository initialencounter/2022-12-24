import { Context, Schema } from 'koishi'

export const name = 'starrail'
import {GachaLog} from './analyse'
import {Atlas} from './atlas'


class StarRail {
  constructor(ctx: Context, config: StarRail.Config) {
    const atlas = new Atlas(ctx,config)
    const gachalog = new GachaLog(ctx)
  }
}

namespace StarRail {
    export interface Config {
        prefix: string
        src_path: string
        engine: boolean
        repo: string
    }
    export const Config = Schema.intersect([
        Schema.object({
            prefix: Schema.string().default('#').description('匹配命令的前缀字符'),

        }).description('基础设置'),
        Schema.object({
            engine: Schema.boolean().default(true).description('是否使用在线引擎'),
            src_path: Schema.string().default('../../../star-rail-atlas').description('资源文件的路径'),
            repo: Schema.string().default('https://gitee.com/Nwflower/star-rail-atlas/raw/master').description('gitee在线资源的地址'),
        }).description('进阶设置')
    ])
}

export default StarRail