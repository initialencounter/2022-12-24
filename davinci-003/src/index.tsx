import { Context, Schema, Logger, segment, Element, Computed } from 'koishi';
import fs from 'fs'
import { } from '@koishijs/plugin-rate-limit';
import { } from 'koishi-plugin-puppeteer';
export const name = 'davinci-003';
export const logger = new Logger(name);
export interface Msg {
  role: string
  content: string
}
export interface Resp {
  msg: Array<Msg>
  id: number
}
export interface Payload {
  engine: string
  prompt: string
  temperature: number
  max_tokens: number
  top_p: number
  frequency_penalty: number
  presence_penalty: number
}

export interface Config {
  AK: string
  SK: string
  type: string
  endpoint: string
  alias: string[]
  key: string
  temperature: number
  max_tokens: number
  authority: number
  waiting: boolean
  usage?: Computed<number>
  mode: string
  output: string
  selfid: string
  reg: string
  superusr: string[]
  minInterval?: Computed<number>
  resolution?: string
  preset: string
}
export const usage = `
## 注意事项
> 使用前在 <a style="color:yellow" href="https://beta.openai.com/account/api-keys">beta.openai.com</a> 中获取api-key<br>
如需使用内容审查,请前往<a style="color:yellow" href="https://ai.baidu.com/solution/censoring?hmsr=aibanner&hmpl=censoring">百度智能云</a> 获取AK和SK</br>
后端模式下，无需代理，服务端需要同步更新至3月8日2点后的版本，否则会报错<br>
由于 OpenAi被墙,使用davinci模式时需要在<a style="color:yellow" href="/plugins/">全局设置</a>最底下->请求设置->代理服务器地址<br>自建GPT-3.5turbo后端无需代理
<a style="color:yellow" href="https://github.com/initialencounter/mykoishi/blob/main/davinci-003#readme.md">自建GPT-3.5turbo后端教程</a><br>
对于部署者行为及所产生的任何纠纷， Koishi 及 <a style="color:yellow" href="https://github.com/initialencounter/mykoishi">koishi-plugin-davinci-003</a>概不负责。<br>
如果有更多文本内容想要修改，可以在<a style="color:yellow" href="/locales">本地化</a>中修改 zh 内容</br>
GPT-3.5turbo后端参考自<a style="color:yellow" href="https://lucent.blog">Lucent佬</a><br>
`

export const Config = Schema.intersect([
  Schema.object({
    type: Schema.union([
      Schema.const('gpt3.5' as const).description('GPT-3.5turbo,默认地址为http://127.0.0.1:32336/chat'),
      Schema.const('gpt3.5-js' as const).description('GPT-3.5turbo-js无需后端及代理，有上下文人格功能'),
      Schema.const('davinci-003' as const).description('davici无需后端，需要代理，无上下文功能'),
    ] as const).default('gpt3.5-js').description('模型选择'),
  }).description('基础设置'),
  Schema.union([
    Schema.object({
      type: Schema.const('gpt3.5-js'),
      preset: Schema.string().description('预设人格').default("你是提瓦特大陆最优秀的旅行向导，名字叫“派蒙”,爱好是美食，我是来自异世界旅行者。你将为我的旅程提供向导。"),
    }),
    Schema.object({
      type: Schema.const('gpt3.5'),
      endpoint: Schema.string().description('API 服务器地址。').required(),
      preset: Schema.string().description('预设人格').default("你是提瓦特大陆最优秀的旅行向导，名字叫“派蒙”,爱好是美食，我是来自异世界旅行者。你将为我的旅程提供向导。"),
    }),
    Schema.object({
      type: Schema.const('davinci-003'),
      temperature: Schema.number().description('偏题程度').default(0),
      mode: Schema.union([
        Schema.const('text-davinci-003').description('语言相关text-davinci-003'),
        Schema.const('text-curie-001').description('语言相关text-curie-001'),
        Schema.const('text-babbage-001').description('语言相关text-babbage-001'),
        Schema.const('text-ada-001').description('语言相关text-ada-001'),
        Schema.const('code-cushman-001').description('代码相关code-cushman-001'),
        Schema.const('code-davinci-003').description('代码相关code-davinci-003')
      ]).description('模型选择').default('text-davinci-003')
    })
  ]),
  Schema.object({
    AK: Schema.string().description('百度智能云内容审核AK'),
    SK: Schema.string().description('内容审核SK防止api-key被封'),
    selfid: Schema.string().description('聊天记录头像的QQ号').default('3118087750'),
    key: Schema.string().description('api_key').required(),
    reg: Schema.string().default('名字[是|叫]“[^,]+”').description('匹配人格的正则表达式'),
    waiting: Schema.boolean().default(true).description('消息反馈，会发送思考中...'),
    max_tokens: Schema.number().description('请求长度').default(1024),
    authority: Schema.number().description('允许使用的最低权限').default(1),
    superusr: Schema.array(String).default(['3118087750', '@Eve']).description('可以无限调用的用户,使用特殊指令super'),
    usage: Schema.computed(Schema.number()).description('每人每日可用次数').default(100),
    minInterval: Schema.computed(Schema.number()).default(5000).description('连续调用的最小间隔,单位毫秒。'),
    alias: Schema.array(String).default(['davinci', '达芬奇', 'ai']).description('触发命令;别名'),
    resolution: Schema.union([
      Schema.const('256x256').description('256x256'),
      Schema.const('512x512').description('512x512'),
      Schema.const('1024x1024').description('1024x1024')
    ]).default('1024x1024').description('生成图像的默认比例'),
    output: Schema.union([
      Schema.const('minimal').description('只发送文字消息'),
      Schema.const('default').description('以聊天记录形式发送'),
      Schema.const('verbose').description('将对话转成图片'),
    ]).description('输出方式。').default('default')
  }).description('进阶设置')
])



export async function apply(ctx: Context, config: Config) {
  try {
    fs.accessSync('./davinci-003-data.json', fs.constants.F_OK);
  } catch (e) {
    fs.writeFileSync('./davinci-003-data.json', '{"派蒙":"你是提瓦特大陆最优秀的旅行向导，名字叫“派蒙”,爱好是美食，我是来自异世界旅行者。你将为我的旅程提供向导。"}');
  }
  try {
    JSON.parse(fs.readFileSync('./davinci-003-data.json').toString())
  } catch (e) {
    fs.writeFileSync('./davinci-003-data.json', '{}');
  }
  let personality = JSON.parse(fs.readFileSync('./davinci-003-data.json').toString())
  const session_config = {
    'msg': [
      { "role": "system", "content": config.preset }
    ]
  }
  const sessions = {}
  let access_token = ''

  function getContent(userId: string, resp: Resp) {
    if (config.output == 'minimal') {
      return resp.msg[resp.msg.length - 1].content
    } else if (config.output == 'default') {
      const result = segment('figure')
      for (var msg of resp.msg) {
        if (msg.role == 'user') {
          result.children.push(
            segment('message', {
              userId: userId,
              nickname: msg.role,
            }, msg.content))
          continue
        }
        if (msg.role == 'assistant') {
          result.children.push(
            segment('message', {
              userId: config.selfid,
              nickname: msg.role,
            }, msg.content))
        } else {
          result.children.push(
            segment('message', {
              userId: userId,
              nickname: msg.role,
            }, msg.content))
        }
      }
      return result
    } else {
      const elements: Array<Element> = []
      for (var msg of resp.msg) {
        if (msg.role == 'user') {
          elements.push(<div style="color:#723b8d;font-size: 15px;background:transparent;weidth=600px;height:50px,">{msg.role}:{msg.content}</div>)
          continue
        }
        if (msg.role == 'assistant') {
          elements.push(<div style="color:#3b8d4f;font-size: 15px;background:transparent;weidth=600px;height:50px,">{msg.role}:{msg.content}</div>)
        } else {
          elements.push(<div style="color:#723b8d;font-size: 20px;background:transparent;weidth=400px">gpt3.5人格设定:{msg.content}</div>)
        }
      }
      return <html>
        <img style="-webkit-user-select: none; display: block; margin: auto; padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); cursor: zoom-in;" src="https://api.dujin.org/bing/m.php" width="600" height="1100"></img>
        <div style='position: absolute;top:20px;left:20px;width:695px;'>
          <p style="color:#723b8d;font-size: 80px">chatgpt3.5-turbo</p>
          {elements}
          <ftooter>create by koishi-plugin-davinci-003__v1.3.5</ftooter>
        </div>

      </html>
    }
  }

  const deepClone = function (obj) {
    // ————————————————
    // 版权声明：本文为CSDN博主「前端路还长」的原创文章，遵循CC 4.0 BY-SA版权协议，转载请附上原文出处链接及本声明。
    // 原文链接：https://blog.csdn.net/liuyibo0314/article/details/126246181
    let _tmp = JSON.stringify(obj);//将对象转换为json字符串形式
    let result = JSON.parse(_tmp);//将转换而来的字符串转换为原生js对象
    return result;
  };

  if (config.AK && config.SK) {
    try {
      let options = {
        'method': 'POST',
        'url': 'https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=' + config.AK + '&client_secret=' + config.SK
      }
      const resp = await ctx.http.axios(options)
      access_token = resp.data.access_token
    }
    catch (e) {
      logger.warn(e.toString())
    }
  }

  async function chat_with_gpt(message: Msg[]) {
    const url: string = "https://chat-gpt.aurorax.cloud/v1/chat/completions"
    try {
      const response = await ctx.http.axios(
        {
          method: 'post',
          url: 'https://chat-gpt.aurorax.cloud/v1/chat/completions',
          headers: {
            Authorization: `Bearer ${config.key}`,
            'Content-Type': 'application/json'
          },
          data: {
            model: 'gpt-3.5-turbo',
            temperature: config.temperature,
            max_tokens: config.max_tokens,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
            messages: message
          }
        })
      return response.data.choices[0].message.content
    }
    catch (error) {
      logger.warn(error)
      return { "msg": [{ "role": "", "content": String(error) }], "id": 1 }
    }
  }
  function get_chat_session(sessionid) {
    if (Object.keys(sessions).indexOf(sessionid) == -1) {
      const _config = deepClone(session_config)
      _config['id'] = sessionid
      sessions[sessionid] = _config
    }
    return sessions[sessionid]
  }
  async function chat(msg, sessionid,usrId) {


    ///逻辑段参考自<a style="color:yellow" href="https://lucent.blog">Lucent佬</a><br></br>
    try {
      if (msg == '') {
        return '您好，我是人工智能助手，如果您有任何问题，请随时告诉我，我将尽力回答。\n如果您需要重置我们的会话，请回复`重置会话`'
      }
      // 获得对话session
      let session = get_chat_session(sessionid)
      if ('重置会话' == msg.slice(0, 4)) {
        // 清除对话内容但保留人设
        session = { "msg": [{ "role": "system", "content": session['msg'][0] }], "id": 1 }
        return '会话已重置'
      }
      if ('重置人格' == msg.slice(0, 4)) {
        // 清空对话内容并恢复预设人设
        session['msg'] = [
          { "role": "system", "content": config.preset }
        ]
        return '人格重置成功'
      }
      if ('设置人格' == msg.slice(0, 4)) {
        // 清空对话并设置人设
        session['msg'] = [
          { "role": "system", "content": msg.slice(0, 4) }
        ]
        return '人格设置成功'
      }
      // 设置本次对话内容
      session['msg'].push({ "role": "user", "content": msg })
      // 与ChatGPT交互获得对话内容

      let message: string = await chat_with_gpt(session['msg'])

      // 查看是否出错
      if (message.indexOf("This model's maximum context length is 4096 token") > -1) {
        if (session['msg'].length < 2) {
          return '文本过长'
        }
        // 出错就清理一条
        session['msg'] = [session['msg'].slice(0, 1).concat(session['msg'].slice(2, session['msg']).length - 1)]
        // 重新交互

        message = await chat(msg, sessionid,usrId)
      }
      // 记录上下文
      session['msg'].push({ "role": "assistant", "content": message })
      console.log("会话ID: " + sessionid)
      console.log("ChatGPT返回内容: ")
      console.log(message)
      return getContent(usrId,session)
    }
    catch (error) {
      logger.warn(error)
      return { "msg": [{ "role": "sys", "content": String(error) }], "id": 1 }
    }
  }
  async function request(text: string, token) {
    const option = {
      'method': 'POST',
      'url': 'https://aip.baidubce.com/rest/2.0/solution/v1/text_censor/v2/user_defined?access_token=' + token,
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      data: {
        'text': text
      }
    }

    const resp = await ctx.http.axios(option)
    return resp.data.conclusion

  }

  const reg = new RegExp(config.reg)
  if (!ctx.puppeteer && config.output == 'verbose') {
    logger.warn('未启用puppter,将无法发送图片')
  }
  const sessions_cmd = {}
  const openai = new OpenAI(config.key, ctx);
  let num: number = 1;
  while (config.alias.length < 5) {
    config.alias.push(`davinci${num}`);
    num++;
  }
  ctx.i18n.define('zh', require('./locales/zh'))
  ctx.before('attach-user', async ({ }, fields) => {
    fields.add('id')
  })
  ctx.middleware(async (session, next) => {
    const session_id_string: string = session.userId
    if (Object.keys(sessions_cmd).indexOf(session_id_string) == -1) {
      return next()
    }
    Object.keys(sessions_cmd).forEach((i, _id) => {
      if (i == session_id_string && (session.content.indexOf(sessions_cmd[i]) == 0)) {
        if (session.content.length == i.length) {
          session.execute('dvc.su')
          return next()
        } else {
          session.execute(`dvc.su ${session.content.replace(sessions_cmd[i], '')}`)
          return next()
        }
      }
    })
    return next()
  })
  ctx.command('dvc.su <prompt:text>').alias('suai')
    .action(async ({ session }, prompt) => {
      const session_id_string: string = session.userId
      if (!prompt) {
        return session.text('commands.dvc.messages.no-prompt')
      }
      let censor = '合规'
      if (access_token != '') {
        censor = await request(prompt, access_token)
      }
      if (censor != '合规') {
        return session.text('commands.dvc.messages.censor')
      }
      if (config.superusr.indexOf(session_id_string) == -1) {
        session.execute(`dvc ${prompt}`)
        return
      }
      if (config.waiting) {
        session.send(session.text('commands.dvc.messages.thinking'))
      }
      if (config.type == 'gpt3.5-js') {
        let msg = prompt
        if (prompt.slice(0, 4) == '设置人格') {

          let nick_name = '小猪'
          try {
            nick_name = prompt.match(reg)[0].slice(4, -1)
          }
          catch (err) {
            logger.warn('未设置Ai的昵称，可忽略')
          }
          if (Object.keys(sessions_cmd).indexOf(session_id_string) > -1) {
            Object.keys(sessions_cmd).forEach((i, id) => {
              if (i.indexOf(session_id_string) == -1) {
                sessions_cmd[id] = session_id_string + nick_name
              }
            })
          } else {
            sessions_cmd[session_id_string] = nick_name
          }
          if (!(nick_name == '小猪')) {
            personality[String(nick_name)] = prompt.slice(4, prompt.length)
            try {
              fs.writeFileSync('./davinci-003-data.json', JSON.stringify(personality));
            } catch (e) {
              logger.warn(e);
            }
          }
        } else if (prompt.slice(0, 4) == '切换人格') {
          if (prompt.length == 4) {
            if (Object.keys(personality).length == 0) {
              return session.text('commands.dvc.messages.switch-errr')
            }
            if (Object.keys(personality).length > 1) {
              let nickname_str = '\n'
              Object.keys(personality).forEach((i, id) => {
                nickname_str += String(id + 1) + ' ' + i + '\n'
              })
              session.send(session.text('commands.dvc.messages.switch', [nickname_str]))
              const input = await session.prompt()

              if (!input || Number.isNaN(+input)) return '请输入正确的序号。'
              const index = +input - 1
              if (!Object.keys(personality)[index]) return '请输入正确的序号。'
              msg = '设置人格' + personality[Object.keys(personality)[index]]
              sessions_cmd[session_id_string] = Object.keys(personality)[index]
            } else {
              msg = '设置人格' + personality[Object.keys(personality)[0]]
              sessions_cmd[session_id_string] = Object.keys(personality)[0]

            }
          } else {
            const input = prompt.slice(4, prompt.length)
            if (!input || Number.isNaN(+input)) return '请输入正确的序号。'
            const index = +input - 1
            if (!Object.keys(personality)[index]) return '请输入正确的序号。'
            if (personality[Object.keys(personality)[index]]) {
              msg = '设置人格' + personality[Object.keys(personality)[index]]
              sessions_cmd[session_id_string] = Object.keys(personality)[index]
            }
          }
        }
        try {
          const resp = await chat(msg, session_id_string,session.userId)
          return resp
        }
        catch (err) {
          logger.warn(err);
          return `${session.text('commands.dvc.messages.err')}${String(err)}`
        }

      }
      else if (config.type == 'gpt3.5') {
        let msg = prompt
        if (prompt.slice(0, 4) == '设置人格') {

          let nick_name = '小猪'
          try {
            nick_name = prompt.match(reg)[0].slice(4, -1)
          }
          catch (err) {
            logger.warn('未设置Ai的昵称，可忽略')
          }
          if (Object.keys(sessions_cmd).indexOf(session_id_string) > -1) {
            Object.keys(sessions_cmd).forEach((i, id) => {
              if (i.indexOf(session_id_string) == -1) {
                sessions_cmd[id] = session_id_string + nick_name
              }
            })
          } else {
            sessions_cmd[session_id_string] = nick_name
          }
          if (!(nick_name == '小猪')) {
            personality[String(nick_name)] = prompt.slice(4, prompt.length)
            try {
              fs.writeFileSync('./davinci-003-data.json', JSON.stringify(personality));
            } catch (e) {
              logger.warn(e);
            }
          }
        } else if (prompt.slice(0, 4) == '切换人格') {
          if (prompt.length == 4) {
            if (Object.keys(personality).length == 0) {
              return session.text('commands.dvc.messages.switch-errr')
            }
            if (Object.keys(personality).length > 1) {
              let nickname_str = '\n'
              Object.keys(personality).forEach((i, id) => {
                nickname_str += String(id + 1) + ' ' + i + '\n'
              })
              session.send(session.text('commands.dvc.messages.switch', [nickname_str]))
              const input = await session.prompt()

              if (!input || Number.isNaN(+input)) return '请输入正确的序号。'
              const index = +input - 1
              if (!Object.keys(personality)[index]) return '请输入正确的序号。'
              msg = '设置人格' + personality[Object.keys(personality)[index]]
              sessions_cmd[session_id_string] = Object.keys(personality)[index]
            } else {
              msg = '设置人格' + personality[Object.keys(personality)[0]]
              sessions_cmd[session_id_string] = Object.keys(personality)[0]

            }
          } else {
            const input = prompt.slice(4, prompt.length)
            if (!input || Number.isNaN(+input)) return '请输入正确的序号。'
            const index = +input - 1
            if (!Object.keys(personality)[index]) return '请输入正确的序号。'
            if (personality[Object.keys(personality)[index]]) {
              msg = '设置人格' + personality[Object.keys(personality)[index]]
              sessions_cmd[session_id_string] = Object.keys(personality)[index]
            }
          }

        }
        try {
          const resp: Resp = await ctx.http.post(config.endpoint, {
            'msg': msg,
            'id': session_id_string,
            'api_key': config.key
          })
          return getContent(session.userId, resp)
        }
        catch (err) {
          logger.warn(err);
          return `${session.text('commands.dvc.messages.err')}${String(err)}`
        }

      }
      const opts: Payload = {
        engine: config.mode,
        prompt: prompt,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      }
      try {
        const text: string = await openai.complete(opts);
        const resp: Resp = { 'msg': [{ "role": "user", "content": prompt }, { "role": "assistant", "content": text }], 'id': 0 }
        return getContent(session.userId, resp)
      }
      catch (err) {
        logger.warn(err);
        return `${session.text('commands.dvc.messages.err')}${String(err)}`
      }
    })
  ctx.command('dvc <prompt:text>', {
    authority: config.authority,
    maxUsage: config.usage,
    minInterval: config.minInterval,
    usageName: 'ai'
  })
    .alias(config.alias[0], config.alias[1], config.alias[2], config.alias[3], config.alias[4])
    .action(async ({ session }, prompt) => {
      const session_id_string: string = session.userId
      let censor = '合规'
      if (access_token != '') {
        censor = await request(prompt, access_token)
      }
      if (censor != '合规') {
        return session.text('commands.dvc.messages.censor')
      }
      if (session.content.length > config.max_tokens) {
        return session.text('commands.dvc.messages.toolong')
      }
      if (!prompt) {
        return session.text('commands.dvc.messages.no-prompt')
      }
      if (config.waiting) {
        session.send(session.text('commands.dvc.messages.thinking'))
      }
      if (config.type == 'gpt3.5-js') {
        let msg = prompt
        if (prompt.slice(0, 4) == '设置人格') {

          let nick_name = '小猪'
          try {
            nick_name = prompt.match(reg)[0].slice(4, -1)
          }
          catch (err) {
            logger.warn('未设置Ai的昵称，可忽略')
          }
          if (Object.keys(sessions_cmd).indexOf(session_id_string) > -1) {
            Object.keys(sessions_cmd).forEach((i, id) => {
              if (i.indexOf(session_id_string) == -1) {
                sessions_cmd[id] = session_id_string + nick_name
              }
            })
          } else {
            sessions_cmd[session_id_string] = nick_name
          }
          if (!(nick_name == '小猪')) {
            personality[String(nick_name)] = prompt.slice(4, prompt.length)
            try {
              fs.writeFileSync('./davinci-003-data.json', JSON.stringify(personality));
            } catch (e) {
              logger.warn(e);
            }
          }
        } else if (prompt.slice(0, 4) == '切换人格') {
          if (prompt.length == 4) {
            if (Object.keys(personality).length == 0) {
              return session.text('commands.dvc.messages.switch-errr')
            }
            if (Object.keys(personality).length > 1) {
              let nickname_str = '\n'
              Object.keys(personality).forEach((i, id) => {
                nickname_str += String(id + 1) + ' ' + i + '\n'
              })
              session.send(session.text('commands.dvc.messages.switch', [nickname_str]))
              const input = await session.prompt()

              if (!input || Number.isNaN(+input)) return '请输入正确的序号。'
              const index = +input - 1
              if (!Object.keys(personality)[index]) return '请输入正确的序号。'
              msg = '设置人格' + personality[Object.keys(personality)[index]]
              sessions_cmd[session_id_string] = Object.keys(personality)[index]
            } else {
              msg = '设置人格' + personality[Object.keys(personality)[0]]
              sessions_cmd[session_id_string] = Object.keys(personality)[0]

            }
          } else {
            const input = prompt.slice(4, prompt.length)
            if (!input || Number.isNaN(+input)) return '请输入正确的序号。'
            const index = +input - 1
            if (!Object.keys(personality)[index]) return '请输入正确的序号。'
            if (personality[Object.keys(personality)[index]]) {
              msg = '设置人格' + personality[Object.keys(personality)[index]]
              sessions_cmd[session_id_string] = Object.keys(personality)[index]
            }
          }

        }
        try {
          const resp = await chat(msg, session_id_string,session.userId)
          return resp
        }
        catch (err) {
          logger.warn(err);
          return `${session.text('commands.dvc.messages.err')}${String(err)}`
        }

      }
      else if (config.type == 'gpt3.5') {
        let msg = prompt
        if (prompt.slice(0, 4) == '设置人格') {
          let nick_name = '小猪'
          try {
            nick_name = prompt.match(reg)[0].slice(4, -1)
          }
          catch (err) {
            logger.warn('未设置Ai的昵称，可忽略')
          }
          if (Object.keys(sessions_cmd).indexOf(session_id_string) > -1) {
            Object.keys(sessions_cmd).forEach((i, id) => {
              if (i.indexOf(session_id_string) == -1) {
                sessions_cmd[id] = session_id_string + nick_name
              }
            })
          } else {
            sessions_cmd[session_id_string] = nick_name
          }
          if (!(nick_name == '小猪')) {
            personality[String(nick_name)] = prompt.slice(4, prompt.length)
            try {
              fs.writeFileSync('./davinci-003-data.json', JSON.stringify(personality));
            } catch (e) {
              logger.warn(e);
            }
          }

        } else if (prompt.slice(0, 4) == '切换人格') {
          if (prompt.length == 4) {
            if (Object.keys(personality).length == 0) {
              return session.text('commands.dvc.messages.switch-errr')
            }
            if (Object.keys(personality).length > 1) {
              let nickname_str = '\n'
              Object.keys(personality).forEach((i, id) => {
                nickname_str += String(id + 1) + ' ' + i + '\n'
              })
              session.send(session.text('commands.dvc.messages.switch', [nickname_str]))
              const input = await session.prompt()

              if (!input || Number.isNaN(+input)) return '请输入正确的序号。'
              const index = +input - 1
              if (!Object.keys(personality)[index]) return '请输入正确的序号。'
              msg = '设置人格' + personality[Object.keys(personality)[index]]
              sessions_cmd[session_id_string] = Object.keys(personality)[index]
            } else {
              msg = '设置人格' + personality[Object.keys(personality)[0]]
              sessions_cmd[session_id_string] = Object.keys(personality)[0]

            }
          } else {
            const input = prompt.slice(4, prompt.length)
            if (!input || Number.isNaN(+input)) return '请输入正确的序号。'
            const index = +input - 1
            if (!Object.keys(personality)[index]) return '请输入正确的序号。'
            if (personality[Object.keys(personality)[index]]) {
              msg = '设置人格' + personality[Object.keys(personality)[index]]
              sessions_cmd[session_id_string] = Object.keys(personality)[index]
            }
          }

        }
        try {
          const resp: Resp = await ctx.http.post(config.endpoint, {
            'msg': msg,
            'id': session_id_string,
            'api_key': config.key
          })
          return getContent(session.userId, resp)
        }
        catch (err) {
          logger.warn(err);
          return `${session.text('commands.dvc.messages.err')}${String(err)}`
        }

      }
      const opts: Payload = {
        engine: config.mode,
        prompt: prompt,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      }
      try {
        const text: string = await openai.complete(opts);
        const resp: Resp = { 'msg': [{ "role": "user", "content": prompt }, { "role": "assistant", "content": text }], 'id': 0 }
        return getContent(session.userId, resp)
      }
      catch (err) {
        logger.warn(err);
        return `${session.text('commands.dvc.messages.err')}${String(err)}`
      }
    })
  ctx.command('dvc.img', {
    authority: config.authority,
    maxUsage: config.usage,
    minInterval: config.minInterval,
    usageName: 'ai'
  }).action(async ({ session }, prompt) => {
    let censor = '合规'
    if (access_token != '') {
      censor = await request(prompt, access_token)
    }
    if (censor != '合规') {
      return session.text('commands.dvc.messages.censor')
    }
    try {
      const resp: Resp = await ctx.http.post(config.endpoint.replace('chat', 'img'), {
        'msg': prompt,
        'id': config.resolution,
        'api_key': config.key
      })

      return segment.image(resp.msg[0].content)
    }
    catch (err) {
      logger.warn(err);
      return `${session.text('commands.dvc.messages.err')}${String(err)}`
    }
  })
  ctx.command('dvc.credit').action(async ({ session }) => {
    session.send(session.text('commands.dvc.messages.get'))
    try {
      const url = "https://chat-gpt.aurorax.cloud/dashboard/billing/credit_grants"
      const res = await ctx.http.get(url, {
        headers: {
          "Authorization": "Bearer " + config.key
        }
      })
      return session.text('commands.dvc.messages.total_available', [res["total_available"]])
    }
    catch (err) {
      logger.warn(err);
      return `${session.text('commands.dvc.messages.err')}${String(err)}`
    }
  })
}


class OpenAI {
  _api_key: string
  ctx: Context
  constructor(api_key: string, ctx: Context,) {
    this._api_key = api_key;
    this.ctx = ctx;
  }
  async _send_request(url: string, method: string, opts: Payload) {
    let camelToUnderscore = (key: string) => {
      let result = key.replace(/([A-Z])/g, " $1");
      return result.split(' ').join('_').toLowerCase();
    };
    const data = {};
    for (const key in opts) {
      data[camelToUnderscore(key)] = opts[key];
    }

    const response = await this.ctx.http.axios({
      url,
      headers: {
        'Authorization': `Bearer ${this._api_key}`,
        'Content-Type': 'application/json'
      },
      data: Object.keys(data).length ? data : '',
      method,
    });
    return response.data.choices[0].text;
  }

  async complete(opts: Payload) {
    const url = `https://chat-gpt.aurorax.cloud/v1/engines/${opts.engine}/completions`;
    delete opts.engine;
    return await this._send_request(url, 'post', opts);
  }
}