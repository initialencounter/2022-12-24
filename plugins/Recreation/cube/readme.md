# 魔方

[![npm](https://img.shields.io/npm/v/koishi-plugin-cube?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-cube)

三阶魔方

## 命令

| 方法     | 命令     |
| -------- | -------- |
| 开始游戏 | cb\|cube |

## 描述

三阶魔方

## 使用方法

- 操作魔法
  - cb + ['F', 'f', 'B', 'b', 'L', 'l', 'R', 'r', 'U', 'u', 'D', 'd'] 大写代表顺时针旋转，小写代表逆时针旋转
- 新建魔法
  - cb
- 自定义魔法
  - cb.def 魔方数据
- 撤销操作
  - cb.back
- 魔方排行榜
  - cb.rank
- py 交易 修改群友权限
  - cb.bind+一次性 key
  - 在配置项设置一次性 key，交易对象发给机器人，

## 注意事项

本插件只用于体现 Koishi 部署者意志

对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-cube 概不负责。

如果有更多文本内容想要修改，可以在[本地化](/locales)中修改 zh 内容
