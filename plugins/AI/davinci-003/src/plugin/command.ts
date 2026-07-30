import { Context, Logger, Session } from 'koishi'
import { } from '../service/chat'
import { } from '../service/session'
import { } from '../service/personality'
import { } from '../service/renderer'
import { DvcPluginConfig } from '../types/config'
import { Msg } from '../types/message'
import { switch_menu, switch_menu_grid } from '../utils'
import { OUTPUT_TYPES } from '../service/renderer'

const logger = new Logger('davinci-003')

class DvcCommand {
  static inject = ['dvc', 'dvcSession', 'dvcPersonality', 'dvcRenderer']

  private readonly pluginConfig: DvcPluginConfig

  constructor(private ctx: Context, config: DvcPluginConfig) {
    this.pluginConfig = config
    const { behavior } = config

    //主要逻辑
    ctx
      .command('dvc <text:text>', {
        authority: behavior.authority,
        usageName: 'dvc',
        maxUsage: behavior.usage,
      })
      .alias(...behavior.alias)
      .userFields(['usage'])
      .action(async ({ session }, ...prompt) => {
        return ctx.dvc.dvc(session!, prompt.join(' '))
      })

    //清空所有会话及人格
    ctx
      .command('dvc.clear', '清空所有会话及人格', {
        authority: 1,
      })
      .action(({ session }) => {
        return this.clear(session!)
      })

    if (!behavior.onlyOnePersonality) {
      //切换现有人格
      ctx
        .command('dvc.切换人格 <prompt:text>', '切换为现有的人格', {
          authority: 1,
        })
        .alias('dvc.人格切换', '切换人格')
        .action(async ({ session }, prompt) => {
          return this.switch_personality(session!, prompt)
        })
      //设置人格
      ctx
        .command('dvc.添加人格 <prompt:text>', '更改AI的人格,并重置会话', {
          authority: 1,
        })
        .action(({ session }, prompt) => {
          session!.send(
            '添加人格失败？看这里！\n https://forum.koishi.xyz/t/topic/2349/4',
          )
          return this.add_personality(session!, prompt)
        })
      //删除人格
      ctx
        .command('dvc.删除人格 <prompt:text>', '删除AI的人格,并重置会话', {
          authority: 1,
        })
        .action(({ session }, prompt) => {
          return this.rm_personality(session!, prompt)
        })
    }

    //删除会话,只保留人格
    ctx
      .command('dvc.重置会话', '重置会话', {
        authority: 1,
      })
      .alias('重置会话')
      .action(({ session }) => {
        ctx.dvcSession.reset(session!.userId!)
        return '重置成功'
      })

    //切换dvc的输出方式
    ctx
      .command('dvc.output <type:string>', '切换dvc的输出方式')
      .action(({ session }, type) => {
        return this.switch_output(session!, type)
      })

    ctx
      .command('dvc.翻译 <prompt:text>', 'AI翻译', { usageName: 'dvc' })
      .option('lang', '-l <lang:t=string>', { fallback: behavior.lang })
      .action(async ({ options }, prompt) => {
        return await ctx.dvc.translate(options!.lang, prompt)
      })

    ctx
      .command('dvc.update', '一键加载 400 条极品预设', { authority: 4 })
      .alias('dvc.更新预设')
      .option('displace', '-d')
      .action(async ({ session, options }) => {
        const prompts_latest_ = await ctx.dvcPersonality.fetchRemotePresets()
        if (options!.displace) {
          await session!.send('该选项将会导致人格丢失，其否继续[Y/n]?')
          const confirm = await session!.prompt(60000)
          if (!confirm) return
          if (confirm.toLowerCase() !== 'y') return session!.send('取消切换')
          ctx.dvcPersonality.displacePresets(prompts_latest_)
        } else {
          ctx.dvcPersonality.mergePresets(prompts_latest_)
        }
        return session!.execute('切换人格')
      })

    ctx
      .command('dvc.cat', '显示一个对话')
      .alias('dvc.会话人格')
      .option('all', '-a --all 显示所有字数')
      .option('personality', '-p <personality:string> 指定人格昵称')
      .option('id', '-i <id:number> 指定会话ID，默认为 0')
      .action(async ({ session, options }) => {
        if (options?.personality)
          return JSON.stringify(
            ctx.dvcPersonality.get(options?.personality ?? '预设人格'),
          )
        const sid = options!.id ?? 0
        let text = (
          ctx.dvcSession.sessions[session!.userId!]?.[sid] ??
          ctx.dvcPersonality.getDefault()[0]
        ).content
        if (!options!.all && text.length > 200)
          text = text.slice(0, 200) + '...'
        return text
      })
  }

  /**
   * 清空所有会话
   * @param session 当前会话
   * @returns 返回清空的消息
   */
  clear(session: Session): string {
    this.ctx.dvcSession.clearAll()
    return session.text('commands.dvc.messages.clean')
  }

  /**
   * 切换人格
   * @param session 会话
   * @param prompt 人格昵称
   * @returns 人格切换状态
   */
  async switch_personality(session: Session, prompt: string): Promise<string> {
    const nick_names: string[] = this.ctx.dvcPersonality.names
    // 参数合法
    if (prompt && nick_names.indexOf(prompt) > -1)
      return this.set_personality(session, prompt)
    const input = await switch_menu_grid(session, nick_names, '人格')
    if (!input) return session.text('commands.dvc.messages.menu-err')
    return this.set_personality(session, input[0])
  }

  /**
   * 设置人格
   * @param session 会话
   * @param nick_name 人格昵称
   * @returns 字符
   */
  set_personality(session: Session, nick_name: string): string {
    this.ctx.dvcSession.setPersonality(session.userId!, nick_name)
    return '人格设置成功: ' + nick_name
  }

  /**
   * 添加人格（交互式）
   * @param session 会话
   * @param nick_name 人格昵称
   */
  async add_personality(session: Session, nick_name: string): Promise<string> {
    if (!nick_name) {
      session.send('请输入人格昵称(输入q退出)')
      nick_name = await session.prompt(60000)
      if (!nick_name || nick_name == 'q')
        session.text('commands.dvc.messages.set-personality')
    }
    let input_key: string
    let input_value: string
    const personality_session: Msg[] = []
    while (true) {
      session.send('请输入role(system||assistant||user)(输入q退出，e结束)')
      input_key = await session.prompt(60000)
      if (input_key == 'q' || !input_key)
        return session.text('commands.dvc.messages.set-personality')
      if (input_key == 'e') break
      if (['system', 'assistant', 'user'].indexOf(input_key) == -1)
        return session.text('commands.dvc.messages.set-personality-role')
      session.send('请输入内容(输入q退出)')
      input_value = await session.prompt(60000)
      if (input_value == 'q' || !input_value)
        return session.text('commands.dvc.messages.set-personality')
      personality_session.push({ role: input_key, content: input_value })
    }
    this.ctx.dvcPersonality.add(nick_name, personality_session)
    return this.set_personality(session, nick_name)
  }

  /**
   * 删除人格逻辑
   * @param session 会话
   * @param nick_name 人格昵称
   */
  async rm_personality(session: Session, nick_name?: string) {
    const nick_names: string[] = this.ctx.dvcPersonality.names
    if (nick_names.length == 1) return '再删下去就报错了'
    // 参数合法
    if (nick_name && nick_names.indexOf(nick_name) > -1)
      return this.personality_rm(session, [nick_name])
    const input = await switch_menu_grid(session, nick_names, '人格')
    if (!input) return session.text('commands.dvc.messages.menu-err')
    return this.personality_rm(session, input)
  }

  /**
   * 删除人格
   * @param session 会话
   * @param nick_name 人格名称
   * @returns 字符串
   */
  personality_rm(session: Session, nick_name: string[]): string {
    this.ctx.dvcPersonality.remove(nick_name)
    this.ctx.dvcSession.resetToDefault(session.userId ?? '')
    return '人格删除成功'
  }

  /**
   * 切换输出模式
   * @param session 会话
   * @param type 输出类型,字符串
   * @returns Promise<string>
   */
  async switch_output(session: Session, type: string): Promise<string> {
    if (type && this.ctx.dvcRenderer.setOutput(type)) {
      return session.text('commands.dvc.messages.switch-success', [type])
    }
    const input = await switch_menu(session, OUTPUT_TYPES, '输出模式')
    if (!input) return session.text('commands.dvc.messages.menu-err')
    this.ctx.dvcRenderer.setOutput(input)
    return session.text('commands.dvc.messages.switch-success', [
      '输出模式',
      input,
    ])
  }
}

export default DvcCommand
