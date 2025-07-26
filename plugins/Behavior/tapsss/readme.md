# koishi-plugin-tapsss

[![npm](https://img.shields.io/npm/v/koishi-plugin-tapsss?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-tapsss)

扫雷联萌专属插件

# 配置插件

必须使用 skia-canvas 提供的 canvas 服务, 不能使用 puppeteer 提供的 canvas 服务.

# Docker 安装字体

```shell
# 更新包管理器
apk update

# 安装基础字体包
apk add fontconfig ttf-dejavu

# 安装中文字体支持
apk add font-noto-cjk

# 可选：安装更多字体
apk add ttf-liberation ttf-opensans

# 安装 Noto Color Emoji 字体
apk add font-noto-emoji

# 重建字体缓存
fc-cache -fv
```

```Dockerfile
FROM koishijs/koishi:latest

RUN apk add --no-cache fontconfig ttf-dejavu ttf-liberation ttf-opensans font-noto-emoji
```
