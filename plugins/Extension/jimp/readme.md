# jimp

[![npm](https://img.shields.io/npm/v/@initencounter/koishi-plugin-jimp?style=flat-square)](https://www.npmjs.com/package/@initencounter/koishi-plugin-jimp)

jimp service
## 使用方法

### 1. 导入类型
```typescript
import Jimp from '@initencounter/jimp';
```

### 2. 使用 Jimp 贴图
```typescript
// 实例化 Jimp
let img1 = ctx.jimp.newJimp(x, y)

// 加载本地图片
let img2 = ctx.jimp.read('img2.png')

// 在 img 的（x, y）位置处贴上图片
img1.blit(img2, px, py)

// 获取 img1 的 PNG 格式的 Buffer 字符串
let img1_buffer = bigImage.getBufferAsync(ctx.jimp.MIME_PNG)

// 发送图片
session.send(h.image(img1_buffer, 'image/png'))
```

## 使用了此服务的插件:

- [koishi-plugin-minesweeper-ending](https://github.com/initialencounter/mykoishi/tree/master/Plugins/Recreation/minesweeper-ending#readme)
- [koishi-plugin-puzzle](https://github.com/initialencounter/mykoishi/tree/master/Plugins/Recreation/puzzle#readme.md)