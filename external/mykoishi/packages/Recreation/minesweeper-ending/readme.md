# koishi-plugin-minesweeper-ending

[![npm](https://img.shields.io/npm/v/koishi-plugin-minesweeper-ending?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-minesweeper-ending)


## 🎈 介绍

koishi-plugin-minesweeper-ending 是一个基于 Koishi 框架的插件，实现了一个简单无猜扫雷残局。

### 规则

- 残局模式
1. 玩家在群里发送 `残局`将开启游戏
2. 使用 `打开` 或 `标记` 命令，打开BV或标记雷
3. 玩家需要将所有非雷方块打开或者将所有雷标记出来方终结比赛，终结比赛的玩家获得双倍积分
4. 胜利玩家将获得 `剩余BV*1` 积分奖励，未能一次性开出所有BV或标记出所有雷的玩家将扣除1积分
5. 标错或开错将触发冷却，一段时间内禁止玩家操作
6. 答不全的玩家获得一半的积分
- 挑战模式
1. 输入 `fight` 开启挑战， 玩家每天能挑战一次, 超过将扣除残局模式获得的积分
2. 输入 `挑战榜` 查看挑战模式排行榜, 排名第一的玩家将获得 `雷帝` 的头衔
## 🚀 特性

- 开始、停止、重新开始扫雷残局
- 获取扫雷最终答案
- 查看扫雷排行榜
- 设置扫雷难度 
- 切换扫雷皮肤
- 惩罚机制，标错或开错将受到禁言惩罚

## 🌠 后续计划

* 🤖 更好的竞技玩法体验

## 📦 安装

```
前往 Koishi 插件市场添加该插件即可
```

## ⚙️ 配置


- 玩法配置
  - `MinHintTime: 15000 // 揭晓答案的冷却时间，默认为 15000毫秒`
  - `DifficultyLevel: 0.5 // 残局的难易程度，0-1，0最简单，1最难，默认为 0.5`
  - `wrongSleep: 5000 //出错后的冷却时间` 
  - `EntryFee: 10 //挑战模式费用`
  - `InitFlag: true //开启后将在残局上随机标记`
  - `InitOpen: true //开启后将在残局上随机打开方块`

- 主题配置
  - 皮肤 theme: string
    - 插件自带了两种皮肤chcolate皮肤 和 wom皮肤
    - 玩家可以自定义皮肤 在模块目录 node_modules/koishi-plugin-minesweeper-ending/theme 目录下添加自定义的皮肤，图片要求： 94*94，目录结构保持一致即可
  - 字体颜色 colorForSerialNum: grey
  - 字体大小 FontSizeForSerialNum: 40，(单位px)
  - 背景颜色 BackGroundColor: white

## 🎮 使用

开箱即用

### 📝 命令

使用以下命令来玩扫雷游戏：

- `ed|残局`：开启一局扫雷残局
- `ed.s|打开`：开始扫雷游戏，需要一次性输入序号打开所有的空格
  - 序号必须是连续的，示例：破解 0412
  - 快捷指令，可以使用 s0412, 该指令等价于 破解 0412
- `ed.f|标记`: 输入雷的序号，将所有雷标记出来同样可以获得胜利
  - - 快捷指令，可以使用 f0412 , 该指令等价于 标记 0412
- `ed.flag`: 开启或关闭标记模式，可以使用 0412 代替 f0412 或 s0412, 取决于当前是否开启标记模式
- `ed.end|不玩了`：停止扫雷游戏，会清除当前的游戏状态
- `ed.l|揭晓`：获取扫雷所有的答案
- `ed.n|刷新残局`：刷新残局
- `ed.r|雷神殿|雷神榜`：查看扫雷排行榜，会显示前十名玩家的昵称和积分。成功破解积分+1*剩余bv；破解失败积分-1。

- `ed.fight`: 开启挑战
- `ed.挑战榜`: 查看挑战模式排行榜
- `ed.生涯`: 查看扫雷生涯：胜率、头衔、积分、局数

## 🙏 致谢

* [Koishi](https://koishi.chat/)：机器人框架
* [@zwolfrost/minesweeper.js](https://github.com/zWolfrost/minesweeper.js)：JS 扫雷引擎
* [minesweeper.online](https://minesweeper.online/): 扫雷皮肤来自于这个网站
* [koishi-plugin-minesweeper](https://github.com/araea/koishi-plugin-minesweeper): 直接抄了一个排行榜和 README

## 📄 License

MIT License © 2023

本插件遵循 MIT 协议。

希望你喜欢这个插件，并享受扫雷游戏的乐趣。😄
