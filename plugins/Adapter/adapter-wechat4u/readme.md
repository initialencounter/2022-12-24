# adapter-wechat4u

[![npm](https://img.shields.io/npm/v/koishi-plugin-adapter-wechat4u?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-adapter-wechat4u)

adapter-wechat4u

## Feature

- 发送语音消息
- 手动实现唯一频道 Id, 唯一用户 Id

## 注意事项

## 常见问题

- 机器人显示成功登录，但无法收发消息，解决方法：重启插件重新登录
- 日志输出太多垃圾信息：解决方法：降低日志输出等级
- 新账号无法登录，解决方法：绑定银行卡
- 日志出现报错 `AssertionError [ERR_ASSERTION]: 1102 == 0`，解决方法：删除`data/wechat4u`的配置文件

# 更新日志

- v0.0.7
  - proposal: 修改 wechat4u-adapter 中 anchor 元素的处理 #53
- v0.0.6
  - 修复：element image->img; url->src 导致的无法发送图片
- v0.0.5
  - 新增：登录成功自动隐藏二维码
  - 新增：日志输出等级
  - 修复：登录信息丢失
  - 修复：获取不到用户名
- v0.0.3
  - 支持保存登录信息
