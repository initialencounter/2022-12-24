import { Context, Schema, Logger, segment } from 'koishi'
import { promises } from 'fs'
export const name = 'lsp'
const logger = new Logger(name)
export interface Config {
  endpoint: string
  lsp_path: string
  type: string
  channel_list: string[]
}

export const usage = `
## 使用方法
使用前请参照卖阔落佬<a style="color:#00FFFF" href="https://github.com/MicroCBer/dressing-detect-server"> 搭建后端 </a>
<br>
你需要<a style="color:#00FFFF" href="https://github.com/MicroCBer/dressing-detect-server/releases/tag/0.0.1">下载</a>，预训练模型
搭建此后端并填写设置内的 backend
## 注意事项
本插件的后端在crossdressing-detect的后端做出了改动
<br>
后端更改

<p dir="auto">1.导入requests模块</p>
<div class="snippet-clipboard-content notranslate position-relative overflow-auto" data-snippet-clipboard-copy-content="pip install requests">
  <code>
  pip install requests
  </code>
</div>
<p dir="auto">2.在server.py添加</p>
<div class="snippet-clipboard-content notranslate position-relative overflow-auto" data-snippet-clipboard-copy-content="import requests">
  <code>
  import requests
  </code>
</div>
<p dir="auto">3.将路由'predict'下的</p>
<div class="snippet-clipboard-content notranslate position-relative overflow-auto" data-snippet-clipboard-copy-content="image = request.files.get(&quot;image&quot;).read()">
  <code>
  image = request.files.get("image").read()
  </code>
</div>
<p dir="auto">改为</p>
<div class="snippet-clipboard-content notranslate position-relative overflow-auto" data-snippet-clipboard-copy-content="url = request.json.get(&quot;image&quot;)
image = requests.get(url,headers={'responseType': 'arraybuffer'}">
  <code>
  url = request.json.get("image")
  </code>
  <br>
  <code>
  image = requests.get(url,headers={'responseType': 'arraybuffer'}
  </code>
</div>

`
export function checkSig(buffer: Buffer, offset: number, sig: Array<number | Array<number>>) {
  var len = sig.length;
  for (var i = 0; i < len; i++) {
    var b = buffer[i + offset],
      s = sig[i],
      m = false;

    if ('number' == typeof s) {
      m = s === b;
    }
    else {
      for (var k in s) {
        var o = s[k];
        if (o === b) {
          m = true;
        }
      }
    }

    if (!m) {
      return false;
    }
  }

  return true;
}
export function imageInfo(buffer: Buffer) {
  const pngSig: number[] = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const jpgSig: number[] = [0xff, 0xd8, 0xff];
  const gifSig: Array<number | Array<number>> = [0x47, 0x49, 0x46, 0x38, [0x37, 0x39], 0x61];
  const swfSig: (number | number[])[] = [[0x46, 0x43], 0x57, 0x53];

  if (checkSig(buffer, 0, pngSig)) return 'png';
  if (checkSig(buffer, 0, jpgSig)) return 'jpg';
  if (checkSig(buffer, 0, gifSig)) return 'gif';
  if (checkSig(buffer, 0, swfSig)) return 'swf';

  return false;
};

export const Config = Schema.object({
  endpoint: Schema.string().description('api服务器地址').required(),
  type: Schema.union([
    Schema.const('all' as const).description('全部都发'),
    Schema.const('rule' as const).description('只在指定群里发'),
  ]).default('rule').description('发不发“好耶 存了!”？'),
  channel_list: Schema.array(String).description('将在这些群发送“好耶 存了”').default(['3118087750', '#']),
  lsp_path: Schema.string().description('女装图片保存地址,默认在./crossdressing/').default('./crossdressing/')
})


export async function apply(ctx: Context, config: Config) {
  const path = config.lsp_path
  try {
    await promises.stat(path)
  }
  catch (err) {
    await promises.mkdir(path)
  }
  ctx.i18n.define('zh', require('./locales/zh'))
  ctx.middleware(async (session, next) => {
    if ((session.content).indexOf('url') == -1) {
      next()
    } else {
      // const regexp: RegExp = /url=[^,]+]/;
      // const url: string = session.content.match(regexp)[0].slice(4, -1)
      const image = segment.select(session.content, "image")[0];
      const url = image?.attrs?.url
      const res = await ctx.http.post(config.endpoint, {
        'image': url
      })
      if (res === "crossdressing") {
        let buffer: Buffer = await ctx.http.get(url, { responseType: 'arraybuffer', "headers": { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64); AppleWebKit/537.36 (KHTML, like Gecko); Chrome/54.0.2840.99 Safari/537.36" } })
        const fileName = session.guildId + "_" +
          session.author.userId + "_" +
          session.author.username + "_" +
          new Date().toLocaleString().replace(/[/,\s,:]/g, '-');
        const imagePath = path + fileName + "." + imageInfo(buffer);
        await promises.writeFile(imagePath, buffer)
        if (config.type == 'all') {
          session.send('好耶 存了！');
          next()
        } else {
          const channel_arr = [''].concat(config.channel_list)
          if (channel_arr.includes(session.channelId)) {
            session.send('好耶 存了！');
          }
          next();
        }
      }
    }
  })
}