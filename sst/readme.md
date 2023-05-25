# @initencounter/sst

[![npm](https://img.shields.io/npm/v/@initencounter/sst?style=flat-square)](https://www.npmjs.com/package/@initencounter/sst)

Sst语音识别服务

## 实现该服务
```
imort { Context, Session, h } form 'koishi'
import Sst from '@initencounter/sst'
class Xxx extends Sst {
    constructor(ctx: Context) {
    super(ctx)
    }
    async audio2text(session: Session): Promise<string> { }
}
```

## 调用服务
```
imort { Context, Session } form 'koishi'
import { } from '@initencounter/sst'
ctx.sst.audio2text(session: Session)
```

## 示例插件
| NPM | REPO |
| --- | --- |
| [Baidu-SST](https://www.npmjs.com/package/koishi-plugin-baidu-sst) | [百度智能云语音识别](https://github.com/initialencounter/mykoishi/tree/master/baidu-sst) |
| [TC-SST](https://www.npmjs.com/package/koishi-plugin-tc-sst) | [腾讯云语音识别](https://github.com/initialencounter/mykoishi/tree/master/tc-sst) |
| [Whisper-ASR](https://www.npmjs.com/package/koishi-plugin-whisper-asr) | [OpenAI语音识别](https://github.com/initialencounter/mykoishi/tree/master/whisper-asr) |