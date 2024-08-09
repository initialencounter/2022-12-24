# sst 抽象

[![npm](https://img.shields.io/npm/v/@initencounter/sst?style=flat-square)](https://www.npmjs.com/package/@initencounter/sst)

Sst 语音识别服务

## 实现该服务

```typescript
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

```typescript
imort { Context, Session } form 'koishi'
import { } from '@initencounter/sst'
ctx.sst.audio2text(session: Session)
```

## 示例插件

| NPM                                                                    | REPO                                                                                       |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [Baidu-SST](https://www.npmjs.com/package/koishi-plugin-baidu-sst)     | [百度智能云语音识别](https://github.com/initialencounter/2022-12-24/tree/master/baidu-sst) |
| [TC-SST](https://www.npmjs.com/package/koishi-plugin-tc-sst)           | [腾讯云语音识别](https://github.com/initialencounter/2022-12-24/tree/master/tc-sst)        |
| [Whisper-ASR](https://www.npmjs.com/package/koishi-plugin-whisper-asr) | [OpenAI 语音识别](https://github.com/initialencounter/2022-12-24/tree/master/whisper-asr)  |
