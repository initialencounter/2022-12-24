# [koishi-plugin-adapter-voce](https://github.com/initialencounter/mykoishi/tree/neat/plugins/Adapter/adapter-voce)

[![npm](https://img.shields.io/npm/v/koishi-plugin-adapter-voce?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-adapter-voce)

VoceChat 适配器

欢迎 [PR](https://github.com/initialencounter/mykoishi/pulls) !

# Feature

## 基础功能
- [x] 账号登录
- [x] 令牌登录
- [x] 更新令牌
- [x] webhook

## 支持发送的消息类型
- [x] 文本
- [x] 图片
- [x] 视频
- [x] 文件
- [x] 语音
- [x] at
- [x] 引用回复


# 内部 API 参考 [点我！](https://github.com/initialencounter/mykoishi/blob/neat/plugins/Adapter/adapter-voce/src/test.ts)
# [VoceChat 文档](https://doc.voce.chat/zh-cn/)

# 更新日志
- v1.0.0
    - feat: receive media
    - feat: send media
    - feat: delete message
    - feat: login
    - feat: impl API getUserAvatar 
    - feat: impl at msg 
    - feat: impl quote msg 
    - chore: change default endpoint
    - chore: drop config bot x-api-kry
- v0.0.1
    - 端上来了