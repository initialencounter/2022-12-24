# koishi-plugin-whisper-asr

[![npm](https://img.shields.io/npm/v/koishi-plugin-whisper-asr?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-whisper-asr)

[openai whisper-asr](https://github.com/ahmetoner/whisper-asr-webservice) 语音识别服务,支持一百多种语言+翻译


## 使用说明
自建后端教程[whisper-asr-webservice](https://github.com/ahmetoner/whisper-asr-webservice)
如需接入微信，则要使用特定版本的wechaty适配器,并且修改后端源码，将app/webservice.py替换成本项目提供的webservice.py

插件仓库[插件仓库](https://github.com/initialencounter/koishi-plugin-whisper-asr)

## 使用方法
* 直接发送语音即可转化或翻译为文本
* asr 要转化/或翻译的语言url
    - lang: 语言
    - task: 是否切换为translate
    - method: 是否切换为faster-whisper
## 问题反馈群: 
399899914


## 更新日志
- v1.0.2
    - 上传webservice.py
- v1.0.0
    - 适配微信语音消息
## 感谢
* [ahmetoner](https://github.com/ahmetoner)

