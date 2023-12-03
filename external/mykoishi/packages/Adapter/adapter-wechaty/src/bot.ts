/*
 * @Author: initialencounter
 * @Date: 2023-11-28 00:12:39
 * @FilePath: C:\Users\29115\dev\wechaty-satori-sdk\packages\adapter-wechaty\src\bot.ts
 * @Description:
 *
 * Copyright (c) 2023 by initialencounter, All Rights Reserved.
 */


import { Bot, Context, Logger, Schema } from 'koishi'
import WechatyAdapter from './adapter'
// import { SendOptions } from '@satorijs/protocol'
import { WechatyBuilder } from 'wechaty'
import { WechatyInterface } from 'wechaty/impls'
import { WechatyMessenger } from './message'

// const logger = new Logger('wechaty')


class WechatyBot<C extends Context = Context, T extends WechatyBot.Config = WechatyBot.Config> extends Bot<C, T> {
    static MessageEncoder = WechatyMessenger
    internal: WechatyInterface
    constructor(ctx: C, config: T) {
        super(ctx, config, 'wechaty')
        this.platform = 'wechaty'
        this.selfId = config.selfId
        this.internal = WechatyBuilder.build()
        ctx.plugin(WechatyAdapter, this)
    }
}
namespace WechatyBot {
    export interface Config {
        selfId?: string
    }

    export const Config = Schema.object({
        selfId: Schema.string().description('机器人的id, 如果有多个wechaty适配器, 请保持 selfId 的唯一性').default('wxid_s1sgf8v3ixaqnf')
    })
}

export default WechatyBot