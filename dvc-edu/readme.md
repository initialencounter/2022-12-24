# koishi-plugin-dvc-edu

[![npm](https://img.shields.io/npm/v/koishi-plugin-dvc-edu?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-dvc-edu)

GPT插件教育版，人工智能在教学中的辅助作用探究


# 注意事项

> 使用前在 <a style="color:blue" href="https://beta.openai.com/account/api-keys">beta.openai.com</a> 中获取api-key<br>
如果需要语音输入，密钥可前往官网控制台 <a style="color:blue" href="https://console.cloud.tencent.com/cam/capi">腾讯云</a> 进行获取
如需使用内容审查,请前往<a style="color:blue" href="https://ai.baidu.com/solution/censoring?hmsr=aibanner&hmpl=censoring">百度智能云</a> 获取AK和SK</br>
对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-dvc-edu 概不负责。<br>
如果有更多文本内容想要修改，可以在<a style="color:blue" href="/locales">本地化</a>中修改 zh 内容</br>
# 使用方法
### 指令如下：
| 功能 | 指令 |
|  ----  | ----  |
| 重置会话 | dvc.重置会话 |
| 添加人格 | dvc.添加人格 |
| 清空所有回话 | dvc.clear |
| 切换人格 | dvc.切换人格 |
| 查询余额 | dvc.credit |
| 切换输出模式 | dvc.output |


### 若出现400报错dvc.clear

## 添加人格的方法
* 在聊天中发送“dvc.添加人格”可以添加并自动保存人格

# 问题反馈
QQ群：399899914<br>
小伙伴如果遇到问题或者有新的想法，欢迎到[这里](https://github.com/initialencounter/mykoishi/issues)反馈哦~



# 更新日志
- v1.0.7
    - 设置超时时间为10分钟，更灵活地添加人格(system||assistant||user)
- v1.0.6
    - 支持GPT-4了
- v1.0.5
    - 修复400报错
- v1.0.4
    - 重写sst服务
- v1.0.3
    - 重写vits服务
- v1.0.2
    - 修复400报错
- v1.0.1
    - 修复无法识别语音的bug
- v1.0.0
    - 新增语音输入
- v0.1.0
    - 更新bot.selfid的获取方式
- v0.0.9
    - 更新bot.selfid的获取方式

- v0.0.8
    - 接入vits语音服务

- v0.0.6
    - 修复无限触发block

- v0.0.5
    - 新增block全指令屏蔽
    - 修复重置会话400错误

- v0.0.4
    - 修复重置会话400错误

- v0.0.3
    - 优化代码结构
    - 修复会话过长

- v0.0.2

    - 修复私聊无法触发
    - 修复会话过长