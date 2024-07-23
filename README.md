![2022-12-24](https://socialify.git.ci/initialencounter/2022-12-24/image?font=Jost&forks=1&issues=1&language=1&name=1&owner=1&pattern=Brick%20Wall&pulls=1&stargazers=1&theme=Dark)

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
yarn clone initialencounter/2022-12-24
```

- 修改根工作区的 tsconfig.json
```json
"koishi-plugin-*": [
  "external/2022-12-24/plugins/Adapter/*/src",
  "external/2022-12-24/plugins/AI/*/src",
  "external/2022-12-24/plugins/Behavior/*/src",
  "external/2022-12-24/plugins/Console/*/src",
  "external/2022-12-24/plugins/Extension/*/src",
  "external/2022-12-24/plugins/Games/*/src",
  "external/2022-12-24/plugins/Manager/*/src",
  "external/2022-12-24/plugins/News/*/src",
  "external/2022-12-24/plugins/Recreation/*/src",
  "external/2022-12-24/plugins/Tool/*/src"
],
"@initencounter/koishi-plugin-jimp": [
  "external/2022-12-24/plugins/Extension/jimp/src",
],
"@initencounter/jimp": [
  "external/2022-12-24/plugins/Extension/jimp-abstract/src",
],
"@initencounter/vits": [
  "external/2022-12-24/plugins/Tool/vits/src",
],
"@initencounter/sst": [
  "external/2022-12-24/plugins/Tool/sst/src",
],
```
