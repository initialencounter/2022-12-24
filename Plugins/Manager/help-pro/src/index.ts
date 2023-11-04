import { readFileSync } from 'fs'
import { Argv, Command, Computed, Context, FieldCollector, h, Schema, Session, Dict } from 'koishi'
import { } from 'koishi-plugin-puppeteer'
import { resolve } from 'path'
import { render } from './render'


type DailyField = typeof dailyFields[number]
const dailyFields = [
  'command', 'dialogue', 'botSend', 'botReceive', 'group',
] as const

declare module 'koishi' {
  interface Events {
    'help/command'(output: string[], command: Command, session: Session<never, never>): void
    'help/option'(output: string, option: Argv.OptionVariant, command: Command, session: Session<never, never>): string
  }
  interface Tables {
    stats_daily: Record<DailyField, Dict<number>> & { time: Date }
  }

  namespace Command {
    interface Config {
      /** hide all options by default */
      hideOptions?: boolean
      /** hide command */
      hidden?: Computed<boolean>
      /** localization params */
      params?: object
    }
  }

  namespace Argv {
    interface OptionConfig {
      /** hide option */
      hidden?: Computed<boolean>
      /** localization params */
      params?: object
    }
  }
}

interface HelpOptions {
  showHidden?: boolean
}

export interface Config {
  shortcut?: boolean
  options?: boolean
  imageHelp?: boolean
}

export const Config: Schema<Config> = Schema.object({
  shortcut: Schema.boolean().default(true).description('是否启用快捷调用。'),
  options: Schema.boolean().default(true).description('是否为每个指令添加 `-h, --help` 选项。'),
  imageHelp: Schema.boolean().default(false).description('是否渲染指令列表。'),
})

function executeHelp(session: Session<never, never>, name: string) {
  if (!session.app.$commander.get('help')) return
  return session.execute({
    name: 'help',
    args: [name],
  })
}

export const name = 'help-pro'
export const inject = {
  optional: ['puppeteer']
}
export const usage = `${readFileSync(resolve(__dirname, '../readme.md')).toString('utf-8')}`

export function apply(ctx: Context, config: Config) {
  ctx.i18n.define('zh-CN', require('./locales/zh-CN'))
  ctx.model.extend('stats_daily', {
    time: 'date',
    ...Object.fromEntries(dailyFields.map((key) => [key, 'json'])),
  }, { primary: 'time' })


  function enableHelp(command: Command) {
    command[Context.current] = ctx
    command.option('help', '-h', {
      hidden: true,
      // @ts-ignore
      notUsage: true,
      descPath: 'commands.help.options.help',
    })
  }

  ctx.schema.extend('command', Schema.object({
    hideOptions: Schema.boolean().description('是否隐藏所有选项。').default(false).hidden(),
    hidden: Schema.computed(Schema.boolean()).description('在帮助菜单中隐藏指令。').default(false),
    params: Schema.any().description('帮助信息的本地化参数。').hidden(),
  }), 900)

  ctx.schema.extend('command-option', Schema.object({
    hidden: Schema.computed(Schema.boolean()).description('在帮助菜单中隐藏选项。').default(false),
    params: Schema.any().description('帮助信息的本地化参数。').hidden(),
  }), 900)

  if (config.options !== false) {
    ctx.$commander._commandList.forEach(enableHelp)
    ctx.on('command-added', enableHelp)
  }

  ctx.before('command/execute', (argv) => {
    const { command, options, session } = argv
    if (options['help'] && command._options.help) {
      return executeHelp(session, command.name)
    }

    if (command['_actions'].length) return
    return executeHelp(session, command.name)
  })

  const $ = ctx.$commander
  function findCommand(target: string, session: Session<never, never>) {
    const command = $.resolve(target)
    if (command?.ctx.filter(session)) return command

    // shortcuts
    const data = ctx.i18n
      .find('commands.(name).shortcuts.(variant)', target)
      .map(item => ({ ...item, command: $.resolve(item.data.name) }))
      .filter(item => item.command?.match(session))
    const perfect = data.filter(item => item.similarity === 1)
    if (!perfect.length) return data
    return perfect[0].command
  }

  const createCollector = <T extends 'user' | 'channel'>(key: T): FieldCollector<T> => (argv, fields) => {
    const { args: [target], session } = argv
    const result = findCommand(target, session)
    if (!Array.isArray(result)) {
      session.collect(key, { ...argv, command: result, args: [], options: { help: true } }, fields)
      return
    }
    for (const { command } of result) {
      session.collect(key, { ...argv, command, args: [], options: { help: true } }, fields)
    }
  }

  async function inferCommand(target: string, session: Session) {
    const result = findCommand(target, session)
    if (!Array.isArray(result)) return result

    const expect = $.available(session).filter((name) => {
      return name && session.app.i18n.compare(name, target)
    })
    for (const item of result) {
      if (expect.includes(item.data.name)) continue
      expect.push(item.data.name)
    }
    const cache = new Map<string, Promise<boolean>>()
    const name = await session.suggest({
      expect,
      prefix: session.text('.not-found'),
      suffix: session.text('internal.suggest-command'),
      filter: (name) => {
        name = $.resolve(name)!.name
        return ctx.permissions.test(`command.${name}`, session, cache)
      },
    })
    return $.resolve(name)
  }

  const cmd = ctx.command('help [command:string]', { authority: 0, ...config })
    .userFields(['authority'])
    .userFields(createCollector('user'))
    .channelFields(createCollector('channel'))
    .option('showHidden', '-H')
    .action(async ({ session, options }, target) => {
      if (!target) {
        const commands = $._commandList.filter(cmd => cmd.parent === null)
        const output = formatCommands('.global-prolog', session, commands, options)
        // Todo
        if (ctx.puppeteer && config.imageHelp) {
          return await renderImage(ctx,commands, session)
        }

        console.dir(output)
        return output.filter(Boolean).join('\n')
      }

      const command = await inferCommand(target, session)
      if (!command) return
      const permissions = [`command.${command.name}`]
      if (!await ctx.permissions.test(permissions, session as any)) {
        return session.text('internal.low-authority')
      }
      return showHelp(command, session, options)
    })

  if (config.shortcut !== false) cmd.shortcut('help', { i18n: true, fuzzy: true })
}

function* getCommands(session: Session<'authority'>, commands: Command[], showHidden = false): Generator<Command> {
  for (const command of commands) {
    if (!showHidden && session.resolve(command.config.hidden)) continue
    if (command.match(session)) {
      yield command
    } else {
      yield* getCommands(session, command.children, showHidden)
    }
  }
}

function formatCommands(path: string, session: Session<'authority'>, children: Command[], options: HelpOptions) {
  const commands = Array
    .from(getCommands(session, children, options.showHidden))
    .sort((a, b) => a.displayName > b.displayName ? 1 : -1)
  if (!commands.length) return []

  const prefix = session.resolve(session.app.config.prefix)[0] ?? ''
  const output = commands.map(({ name, displayName, config }) => {
    const desc = session.text([`commands.${name}.description`, ''], config.params)
    let output = session.text('.display-prefix') + prefix + displayName;
    output += session.text('.display-mid') + lenLessThanXText(desc,8);
    return output
  })
  const hints: string[] = []
  const hintText = hints.length
    ? session.text('general.paren', [hints.join(session.text('general.comma'))])
    : ''
  output.unshift(session.text(path, [hintText]))
  return output
}
/**
 * 省略长度大于8的字符
 * @param input 
 * @returns 
 */
function lenLessThanXText(input: string,X:number) {
  if (input.length < X) {
    return input
  } else {
    return input.slice(0, X) + '...'
  }
}
/**
 * 渲染help
 * @returns 
 */
async function renderImage(ctx:Context, cmds: Command[], session: Session<'authority'>) {
  const cmdStats = await getCommandsStats(ctx)
  const cmdArray = formatCommandsArray(session,cmds,{})
  const sortedCmds = sortCommands(cmdArray,cmdStats)
  console.dir(sortedCmds)
  return await render(sortedCmds, session)
}

function getOptionVisibility(option: Argv.OptionConfig, session: Session<'authority'>) {
  if (session.user && option.authority > session.user.authority) return false
  return !session.resolve(option.hidden)
}

function getOptions(command: Command, session: Session<'authority'>, config: HelpOptions) {
  if (command.config.hideOptions && !config.showHidden) return []
  const options = config.showHidden
    ? Object.values(command._options)
    : Object.values(command._options).filter(option => getOptionVisibility(option, session))
  if (!options.length) return []

  const output: string[] = []
  Object.values(command._options).forEach((option) => {
    function pushOption(option: Argv.OptionVariant, name: string) {
      if (!config.showHidden && !getOptionVisibility(option, session)) return
      let line = `${h.escape(option.syntax)}`
      const description = session.text(option.descPath ?? [`commands.${command.name}.options.${name}`, ''], option.params)
      if (description) line += '  ' + description
      line = command.ctx.chain('help/option', line, option, command, session)
      output.push('    ' + line)
    }

    if (!('value' in option)) pushOption(option, option.name)
    for (const value in option.variants) {
      pushOption(option.variants[value], `${option.name}.${value}`)
    }
  })

  if (!output.length) return []
  output.unshift(session.text('.available-options'))
  return output
}

async function showHelp(command: Command, session: Session<'authority'>, config: HelpOptions) {
  const output = [session.text('.command-title', [command.displayName + command.declaration])]

  const description = session.text([`commands.${command.name}.description`, ''], command.config.params)
  if (description) output.push(description)

  if (session.app.database) {
    const argv: Argv = { command, args: [], options: { help: true } }
    const userFields = session.collect('user', argv)
    await session.observeUser(userFields)
    if (!session.isDirect) {
      const channelFields = session.collect('channel', argv)
      await session.observeChannel(channelFields)
    }
  }

  if (Object.keys(command._aliases).length > 1) {
    output.push(session.text('.command-aliases', [Array.from(Object.keys(command._aliases).slice(1)).join('，')]))
  }

  session.app.emit(session, 'help/command', output, command, session)

  if (command._usage) {
    output.push(typeof command._usage === 'string' ? command._usage : await command._usage(session))
  } else {
    const text = session.text([`commands.${command.name}.usage`, ''], command.config.params)
    if (text) output.push(text)
  }

  output.push(...getOptions(command, session, config))

  if (command._examples.length) {
    output.push(session.text('.command-examples'), ...command._examples.map(example => '    ' + example))
  } else {
    const text = session.text([`commands.${command.name}.examples`, ''], command.config.params)
    if (text) output.push(...text.split('\n').map(line => '    ' + line))
  }

  output.push(...formatCommands('.subcommand-prolog', session, command.children, config))
  return output.filter(Boolean).join('\n')
}


async function getCommandsStats(ctx: Context) {
  const commandStats = (await ctx.database.get('stats_daily', {}, ['command']))
  const record = commandStats.slice(0, 7).reduce((acc, curr) => {
    for (const [key, value] of Object.entries(curr.command)) {
      acc[key] = (acc[key] || 0) + value;
    }
    return acc;
  }, {});
  return record
}

function sortCommands(prev: (string | number)[][], frequencyCommands: Dict) {
  console.dir(frequencyCommands)
  for (var i = 0; i < prev.length; i++) {
    
    prev[i][2] = frequencyCommands[prev[i][0]] ?? 0
  }
  const sorted = prev.sort((a, b) => {
    return (b[2] as number) - (a[2] as number)
  })
  return sorted
}

function formatCommandsArray(session: Session<'authority'>, children: Command[], options: HelpOptions) {
  const commands = Array
    .from(getCommands(session, children, options.showHidden))
    .sort((a, b) => a.displayName > b.displayName ? 1 : -1)
  if (!commands.length) return []

  const prefix = session.resolve(session.app.config.prefix)[0] ?? ''
  const output = commands.map(({ name, displayName, config }) => {
    const desc = session.text([`commands.${name}.description`, ''], config.params)
    let output = prefix + displayName;
    return [output,lenLessThanXText(desc, 16),0]
  })
  return output
}