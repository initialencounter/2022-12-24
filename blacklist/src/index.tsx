import { Context, Schema, Session} from 'koishi'

export const log = console.log
export const name = 'blacklist'

declare module 'koishi' {
  interface Tables {
    blacklist: Blacklist
  }
}

export interface Blacklist {
  id: number
  uid: string
  violations: number
  eula: boolean
}

export interface Config {
  chance: string
  contraband: string
  max_viol: number
  ban_text1: string
  ban_text2: string
  protect_cmd: string
  invinc: number
  alias: string
  waitTime: number
  eula: string
  accept: string
}


export const Config: Schema<Config> = Schema.object({
  chance: Schema.string().description('给我一个机会,输入一个qq号,清空其违规次数,恢复权限;重载配置生效'),
  contraband: Schema.string().default('nsfw').description('违禁词，英文逗号隔开'),
  max_viol: Schema.number().default(3).description('最大违规次数'),
  ban_text1: Schema.string().default('违规一次，违规次数').description('警告'),
  ban_text2: Schema.string().default('违规达三次，已加入黑名单').description('审判'),
  protect_cmd: Schema.string().default('nai,novelai,rr,sai,rryth,stnb').description('仅检测以下命令中的违禁词'),
  invinc: Schema.number().default(5).description('允许瑟瑟最低权限'),
  alias: Schema.string().default('balcklist-EULA').description('《最终用户许可协议》别名，或其他自拟协议名称'),
  waitTime: Schema.number().min(30).max(300).step(1).default(60).description('等待回复时长，单位为 秒'),
  eula: Schema.string().role('textarea').description('协议内容'),
  accept: Schema.string().default('同意').description('认可协议关键字'),
})

export const audit = async (ctx: Context, config: Config, uid: string, session: Session) => {
  const viol_times: any[] = await ctx.database.get('blacklist', { uid: [uid] })
  const cid: string = viol_times[0].uid
  const ctimes: number = viol_times[0].violations
  const usr: any = await ctx.database.getUser('onebot', cid, ["id", "authority"])
  if (usr.authority < config.invinc) {      //判断用户是否拥有瑟瑟权限
    await ctx.database.set('blacklist', { uid: uid }, { violations: ctimes + 1 })
    session.send(session.text('commands.b-eula.messages.audit', [uid, config.ban_text1, ctimes + 1]))
  }
}

const sign = async (ctx: Context, session: Session, config: Config) => {
  const uid: string = session.userId
  const usr: any = await ctx.database.getUser('onebot', uid, ["id", "authority"])
  const exits: any[] = await ctx.database.get('blacklist', { uid: [uid] })
  if (exits[0].eula == true) {
    return session.text('commands.b-eula.messages.acceptedMessage', [config.alias])
  }
  session.send(session.text('commands.b-eula.messages.eulaMessage', [session.userId, config.alias, config.eula, config.accept]))
  const prompt: string = await session.prompt(config.waitTime * 1000)
  if (prompt) {
    if (prompt === config.accept) {
      await ctx.database.set('user', [usr.id], { authority: 1 })  //给予权限
      await ctx.database.set('blacklist', { uid: uid }, { eula:true}) 
      return session.text('commands.b-eula.messages.acceptedMessage', [config.alias])
    }
    session.send(session.text('commands.b-eula.messages.rape', [uid, config.ban_text2]))
    await ban(ctx,uid,config.invinc,usr)   //剥夺权限
    return session.text('commands.b-eula.messages.rejectMessage', [config.alias])
  }
  else {
    await ban(ctx,uid,config.invinc,usr)   //剥夺权限
    return session.text('commands.b-eula.messages.timeout')
  }
}

export const get_cmd = (ctx: Context, argv: Session<never, never>) => {
  const expect = ctx.$commander.available(argv).filter((name) => {
    return name
  })
  return expect
}

export const set_auth = async (ctx:Context,config:Config) => {
  const usr: any = await ctx.database.getUser('onebot', config.chance, ["id", "authority"])
  await ctx.database.set('user', [usr.id], { authority: 1 })
  await ctx.database.set('blacklist', { uid: config.chance }, { violations: 0 })
}

export const ban = async (ctx:Context,uid:string,mix_auth:number,usr:any) => {
  if (usr.id) {
    if (usr.authority < mix_auth) {
      await ctx.database.set('user', [usr.id], { authority: 0 })  //剥夺权限
    }
  }
}

export const last_call = async (ctx: Context, config: Config, session: Session) => {
  // log('call')
  const uid: string = session.userId
  const last: any[] = await ctx.database.get('blacklist', { uid: [uid] })
  const usr: any = await ctx.database.getUser('onebot', uid, ["id", "authority"])
  if (last[0].eula == true) {      //判断用户权限
    const ctime = last[0].violations
    if (ctime > 3) {  //在黑名单中，且违规次数大于3
      session.send(session.text('commands.b-eula.messages.rape', [uid, config.ban_text2]))
      await ban(ctx,uid,config.invinc,usr)   //剥夺权限
    }
  }
}


export function apply(ctx: Context, config: Config, session: Session) {
  const contraband_arr: string[] = config.contraband.split(',')
  var cmd_arr: string[] = config.protect_cmd.split(',')
  ctx.model.extend('blacklist', {
    // 各字段类型
    id: 'unsigned',
    uid: 'string',
    violations: 'integer',
    eula: 'boolean'
  }, {
    // 使用自增的主键值
    autoInc: true,
  })

  ctx.i18n.define('zh', require('./locales/zh'))
  if (config.chance){
    set_auth(ctx,config)
  }
  

  ctx.on('message', async (session) => {
    const uid: string = session.userId
    const exits: any[] = await ctx.database.get('blacklist', { uid: [uid] })
    const usr: any = await ctx.database.getUser('onebot', uid, ["id", "authority"])
    // log(usr)
    if (exits.length == 0) {//加入新用户
      ctx.database.create('blacklist', { uid: session.userId, violations: 0, eula: false })
      await ban(ctx,uid,config.invinc,usr)   //剥夺权限
    }
    if (session.content.indexOf(' ') == -1) { //判断是否含有prompt，prompt中必有空格
      return
    }
    // log(cmd_arr)
    for (var i in cmd_arr) {
      if (cmd_arr[i] == session.content) {    //判断是否含有命
        if (exits[0].eula == false) {       //判断是否同意最终协议
          const msg = await sign(ctx, session, config)
          session.send(msg)
          for (var i in contraband_arr) {     //判断是否含有违禁词
            if (session.content.includes(contraband_arr[i])) {
              await audit(ctx, config, uid, session)   //添加违规次数
            }
          }
          last_call(ctx, config, session)
          return
        }
      }
      if (session.content.split(' ')[0].includes(cmd_arr[i])) {    //判断是否含有命令
        if (exits[0].eula == false) {       //判断是否同意最终协议，在黑名单中代表同意了协议
          const msg = await sign(ctx, session, config)
          session.send(msg)
        }
        for (var i in contraband_arr) {     //判断是否含有违禁词
          if (session.content.includes(contraband_arr[i])) {
            await audit(ctx, config, uid, session)   //添加违规次数
          }
        }
      }
    }
    last_call(ctx, config, session)
  })

  ctx.middleware(async (session, next) => {  // 权限管理
    last_call(ctx, config, session)
    return next()
  })

  ctx.command('b-eula', { authority: 0 })      //签订协议
    .alias(config.alias)
    .action(async ({ session }) => {
      return await sign(ctx, session, config)
    })
}
