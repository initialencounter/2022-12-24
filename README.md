<div align="center">
  <a href="https://github.com/initialencounter/mykoishi">
    <a href="https://koishi.chat/" target="_blank">
    <img  width="100rem" src="https://koishi.chat/logo.png">
    <h2><div style="font-size: 8rem"><strong>。</strong></div></h2>
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

|   分类   | 名称    |
| :------: | :---- |
| 人工智能  | [☕ChatGPT](./plugins/AI/davinci-003/readme.md)[☕AI 颜值打分](./plugins/AI/facercg/readme.md)[☕Stable Diffusion](./plugins/AI/sd-taylor/readme.md)[☕意间绘画](./plugins/AI/arcadia/readme.md)[☕知数云](./plugins/AI/arcadia/readme.md) |
| 适配器 | [☕autoxjs-sender](./plugins/Adapter/autoxjs-sender/readme.md)[☕adapter-wechat4u](./plugins/Adapter/adapter-wechat4u/readme.md)[☕adapter-voce](./plugins/Adapter/adapter-voce/readme.md)|
| 拓展功能 | [☕mqtt](./plugins/Extension/mqtt/readme.md) |
| 管理工具 | [☕闹钟](./plugins/Manager/clock/readme.md)[☕进阶指令帮助](./plugins/Manager/help-pro/readme.md) |
| 行为预设 | [☕群主插件](./plugins/Behavior/specialtile/readme.md) |
| 资讯服务 | [☕兽云祭](./plugins/News/furbot/readme.md)[☕瓷砖提醒](./plugins/News/gh-tile/readme.md) |
| 实用工具 | [☕fish-speech](./plugins/Tool/fish-speech/readme.md)[☕飞桨语音](./plugins/Tool/paddlespeech/readme.md)[☕OpenAI语音](./plugins/Tool/whisper-asr/readme.md)[☕百度TTS](./plugins/Tool/baidu-tts/readme.md)[☕百度STT](./plugins/Tool/baidu-sst/readme.md)[☕腾讯TTS](./plugins/Tool/tencent-tts/readme.md)[☕腾讯STT](./plugins/Tool/tc-sst/readme.md)[☕vits服务](./plugins/Tool/vits/readme.md)[☕sst服务](./plugins/Tool/sst/readme.md) |
| 娱乐玩法 | [☕数字华容道](./plugins/Recreation/puzzle/readme.md)[☕魔方](./plugins/Recreation/cube/readme.md)[☕对对联](./plugins/Recreation/couplet/readme.md)[☕扫雷残局](./plugins/Recreation/minesweeper-ending/readme.md)[☕国际象棋](./plugins/Recreation/ichess/readme.md) ||
| 游戏辅助 | [☕斯坦牛逼](./plugins/Games/stnb/readme.md)[☕Steam 挂刀](./plugins/Games/steam-trading/readme.md)[☕原神图鉴](./plugins/Games/genshin-atlas/readme.md) |

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
