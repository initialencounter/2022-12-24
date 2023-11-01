# koishi-plugin-steam-trading

[![npm](https://img.shields.io/npm/v/koishi-plugin-steam-trading?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-steam-trading)

steam挂刀行情,实际上是一个网页截图插件


## 注意事项
数据来源 [iflow.work](http://www.iflow.work)

本插件仅供学习参考，请勿用于商业行为

对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-steam-trading 概不负责。

## 使用方法

[挂刀行情] 请发送 `trad buff ['buff', 'igxe', 'c5', 'uupy']`

[行情分析] 请发送 `trad.行情分析`

[网页截图] 请发送 `trad.行情分析+网址`

# 更新日志

- v1.3.0
    - 删除文字版输出
    - 将 puppeteer 改为必须依赖
- v1.2.6
    - 缩减体积
- v1.2.5
    - 将sharp更换为pngjs
- v1.2.3
    - 修复了一些小瑕疵
- v1.2.2
    - 增加平台局内参数
    - 增加行情分析
    - 弃用cheerio


# 感谢

[EricZhu-42](https://github.com/EricZhu-42/SteamTradingSiteTracker)