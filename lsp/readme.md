# koishi-plugin-lsp

[![npm](https://img.shields.io/npm/v/koishi-plugin-lsp?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-lsp)

抄袭自卖阔落的crossdressing-detect

QQ群399899914

[作者b站](https://space.bilibili.com/225995995)



后端更改

导入requests模块
```
pip install requests
```
在server.py 
添加
```
import requests
```
将路由'predict'下的
```
image = request.files.get("image").read()
```
改为
```
url = request.json.get("image")
image = requests.get(url,headers={'responseType': 'arraybuffer'}
```