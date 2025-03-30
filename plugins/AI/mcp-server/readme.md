# koishi-plugin-mcp-server

[![npm](https://img.shields.io/npm/v/koishi-plugin-mcp-server?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-mcp-server)

Convert koishi command to mcp tools

使用 http 请求调用 koishi 的命令

## TODO

- 将所有 koishi插件的命令通过 http 的方式命令转成 mcp-tool 供 AI 调用


## 请求示例

```shell
# 要执行的命令
command --options1 options1value --options2 options2value arg1 arg2
```

```shell
curl --location --request POST 'http://127.0.0.1:5140/mcp' \
--header 'Content-Type: application/json' \
--header 'Accept: */*' \
--header 'Host: 127.0.0.1:5140' \
--header 'Connection: keep-alive' \
--data-raw '{
    "command": "command",
    "args": ["arg1", "arg2"],
    "options": {
        "options1": "options1value",
        "options2": "options2value"
    }
}'
```
