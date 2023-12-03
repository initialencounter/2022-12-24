<br />
<div align="center">
  <a href="https://github.com/initialencounter/mykoishi">
    <a href="https://koishi.chat/" target="_blank">
    <img  width="100rem" src="https://koishi.chat/logo.png">
    <div align="center"><div style="font-size: 8rem"><strong>Koishi 插件集</strong></div></div>
  </a>
  </a>
  <br>
<img alt="GitHub forks" src="https://img.shields.io/github/forks/initialencounter/mykoishi?style=social">
<img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/initialencounter/mykoishi?style=social">
<a href="https://wakatime.com/badge/user/1fad1c74-8ddd-4cac-bfa5-df629d13f085/project/2e8687b6-2874-4e88-8337-20eed806f673"><img src="https://wakatime.com/badge/user/1fad1c74-8ddd-4cac-bfa5-df629d13f085/project/2e8687b6-2874-4e88-8337-20eed806f673.svg" alt="wakatime"></a>
<a href="https://github.com/initialencounter/mykoishi/blob/master/LICENSE"><img src="https://img.shields.io/github/license/initialencounter/mykoishi" alt="License"></a>
<img src="https://img.shields.io/badge/NodeJs-20.8.0-blue" alt="Node Version"></a>
  <p align="center">
    <a href="https://github.com/initialencounter/mykoishi"><strong>Explore the docs »</strong></a>
     ·
    <a href="https://github.com/initialencounter/mykoishi"><strong>View Demo</strong></a>
    ·
    <a href="https://github.com/initialencounter/mykoishi/issues"><strong>Report Bug</strong></a>
    ·
    <a href="https://github.com/initialencounter/mykoishi/issues"><strong>Request Feature</strong></a>
  </p>

| 分类   | 名称    |
| :----: | :---- |
| 人工智能  | [☕ChatGPT](./Plugins/AI/davinci-003/readme.md)[☕颜值评分](./Plugins/AI/facercg/readme.md)[☕Stable Diffusion](./Plugins/AI/sd-taylor/readme.md) | 
|          | [☕意间 AI](./Plugins/AI/arcadia/readme.md)[☕知数云](./Plugins/AI/arcadia/readme.md) |
| 适配器 | [☕gocq-dev](./Plugins/Adapter/gocqhttp-dev/readme.md)[☕qsign](./Plugins/Adapter/qsign/readme.md)[☕autoxjs-sender](./Plugins/Adapter/autoxjs-sender/readme.md)|
| 拓展功能 | [☕mqtt](./Plugins/Extension/mqtt/readme.md) |
| 控制台 | [☕blockly 市场](./Plugins/Console/blockly-registry/readme.md) |
| 管理工具 | [☕闹钟](./Plugins/Manager/clock/readme.md)[☕loader](./Plugins/Manager/loader/readme.md)[☕blacklist](./Plugins/Manager/blacklist/readme.md) | 
|         | [☕进阶指令帮助](./Plugins/Manager/help-pro/readme.md) [☕机器人守护者](./Plugins/Manager/bot-guardian/readme.md) |
| 行为预设 | [☕群主插件](./Plugins/Behavior/specialtile/readme.md) |
| 资讯服务 | [☕兽云祭](./Plugins/News/furbot/readme.md)[☕fraud-db](./Plugins/News/fraud-db/readme.md)[☕瓷砖提醒](./Plugins/News/gh-tile/readme.md) |
| 实用工具 | [☕飞桨语音](./Plugins/Tool/paddlespeech/readme.md)[☕OpenAI 语音](./Plugins/Tool/whisper-asr/readme.md)[☕语音-克隆](./Plugins/Tool/paddlespeech-finetune/readme.md) |
|         | [☕百度TTS](./Plugins/Tool/baidu-tts/readme.md)[☕百度STT](./Plugins/Tool/baidu-sst/readme.md)[☕腾讯TTS](./Plugins/Tool/tencent-tts/readme.md) |
|         |  [☕腾讯STT](./Plugins/Tool/tc-sst/readme.md)[☕vits 服务](./Plugins/Tool/vits/readme.md)[☕sst 服务](./Plugins/Tool/sst/readme.md) |
| 娱乐玩法 | [☕数字华容道](./Plugins/Recreation/puzzle/readme.md)[☕魔方](./Plugins/Recreation/cube/readme.md)[☕对对联](./Plugins/Recreation/couplet/readme.md)[☕扫雷残局](./Plugins/Recreation/minesweeper-ending/readme.md) ||
| 游戏辅助 | [☕斯坦牛逼](./Plugins/Games/stnb/readme.md)[☕Steam 挂刀](./Plugins/Games/steam-trading/readme.md)[☕原神图鉴](./Plugins/Games/genshin-atlas/readme.md) |

</div>
## 在你的工作区引入此仓库

- 克隆本仓库到你的工作区

```shell
yarn clone initialencounter/mykoishi
```

- 修改根工作区的 tsconfig.json
```json
"koishi-plugin-*": [
  "external/mykoishi/plugins/Adapter/*/src",
  "external/mykoishi/plugins/AI/*/src",
  "external/mykoishi/plugins/Behavior/*/src",
  "external/mykoishi/plugins/Console/*/src",
  "external/mykoishi/plugins/Extension/*/src",
  "external/mykoishi/plugins/Games/*/src",
  "external/mykoishi/plugins/Manager/*/src",
  "external/mykoishi/plugins/News/*/src",
  "external/mykoishi/plugins/Recreation/*/src",
  "external/mykoishi/plugins/Tool/*/src"
],
"@initencounter/koishi-plugin-jimp": [
  "external/mykoishi/plugins/Extension/jimp/src",
],
"@initencounter/jimp": [
  "external/mykoishi/plugins/Extension/jimp-abstract/src",
],
"@initencounter/vits": [
  "external/mykoishi/plugins/Tool/vits/src",
],
"@initencounter/sst": [
  "external/mykoishi/plugins/Tool/sst/src",
],
```