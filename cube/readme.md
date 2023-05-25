# koishi-plugin-cube

[![npm](https://img.shields.io/npm/v/koishi-plugin-cube?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-cube)

三阶魔方
![alt 示例7](https://raw.githubusercontent.com/initialencounter/mykoishi/master/screenshot/7.jpg)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

![alt 示例](https://raw.githubusercontent.com/initialencounter/mykoishi/master/screenshot/7-1.jpg)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

![alt 示例](https://raw.githubusercontent.com/initialencounter/mykoishi/master/screenshot/7-2.jpg)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

![alt 示例](https://raw.githubusercontent.com/initialencounter/mykoishi/master/screenshot/7-3.jpg)


## 命令
|  方法  | 命令  |
|  ----  | ----  |
| 开始游戏  | cb\|cube|

## 描述
三阶魔方
[nonebot-plugin-cube](https://github.com/initialencounter/nonebot-plugin-cube)重写版

## 使用方法
- 操作魔法
  - cb +【f,b,u,d,l,r】不区分大小写，在字母前加入【非方向字符】代表顺时针旋转
- 新建魔法
  - cb
- 自定义魔法
  - cb.def 魔方数据
- 撤销操作
  - cb.back
- 魔方排行榜
  - cb.rank
- py交易 修改群友权限
  - cb.bind+一次性key 
  - 在配置项设置一次性key，交易对象发给机器人，

## 注意事项
>建议使用前在在插件管理加载puppteeter服务,否则无法发送图片\n
本插件只用于体现 Koishi 部署者意志\n
对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-cube 概不负责。\n
如果有更多文本内容想要修改，可以在<a href="/locales">本地化</a>中修改 zh 内容

### 示例
![alt 示例7](https://github.com/initialencounter/mykoishi/blob/master/screenshot/cube0.png)
![alt 示例7-1](https://github.com/initialencounter/mykoishi/blob/master/screenshot/cube1.png)
![alt 示例7-2](https://github.com/initialencounter/mykoishi/blob/master/screenshot/cube2.png)
![alt 示例7-3](https://github.com/initialencounter/mykoishi/blob/master/screenshot/cube3.png)

### 感谢
## cube.js参考b站--[神闪避的雪亲王](https://space.bilibili.com/16355723)