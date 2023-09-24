# koishi-plugin-davinci-003

[![npm](https://img.shields.io/npm/v/koishi-plugin-davinci-003?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-davinci-003)


# 注意事项

> 使用前在 <a style="color:blue" href="https://beta.openai.com/account/api-keys">beta.openai.com</a> 中获取api-key<br>
如果需要语音输入，密钥可前往官网控制台 <a style="color:blue" href="https://console.cloud.tencent.com/cam/capi">腾讯云</a> 进行获取
如需使用内容审查,请前往<a style="color:blue" href="https://ai.baidu.com/solution/censoring?hmsr=aibanner&hmpl=censoring">百度智能云</a> 获取AK和SK</br>
对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-davinci-003 概不负责。<br>
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

- dvc \<prompt\>
  - -o 输出方式
  - -l 启用16k 
      
## 设置多个 key 的方法
1. 直接修改
2. 在配置文件修改
  打开koishi.yml  (可以使用 explorer 插件)
  修改配置项
    ```
    davinci-003:3seyqr:
        key:
        - sk-kashdkahsjdhkashkd*
        - sk-ItGRonJPTa6sp9QYhN*
        - sk-sgadtiasyn2ouoi1n*
    ```
## 添加人格的方法
* 在聊天中发送“dvc.添加人格”可以添加并自动保存人格
* [添加人格教程](https://forum.koishi.xyz/t/topic/2349/4)

# 问题反馈
QQ群：399899914<br>
小伙伴如果遇到问题或者有新的想法，欢迎到[这里](https://github.com/initialencounter/mykoishi/issues)反馈哦~




# 更新日志
- v6.2.0
    - 新增 k-on 独立入口
- v6.1.1
    - 添加添加人格的教程
- v6.1.0
    - 新增最大重试次数，当key报错重试时，会记录每个key的重试次数，当重试次数大于最大重试次数时，会停止，并从内存中删除key
- v6.0.1
    - 更改 key 的切换逻辑，报错后先查询余额 ,如果余额为 0，则从内存中删除 key, 如果还有余额，则暂时切换余额
- v6.0.0
    - 自动更换报错的 key
- v5.1.4-beta
    - 修复 stream 模式下的 prompt 失效
- v5.1.4-alpha
    - 新增流式输出，优化响应速度感受
- v5.1.4
    - 缩减体积
- v5.1.3
    - 菜单分段发送
- v5.1.1
    - 新增更新预设 -u 选项
- v5.1.0
    - 新增 403 个极品人格
- v5.0.2
    - 新增 gpt3.5-turbo-16k
- v4.0.7
    - 更灵活地添加人格(system||assistant||user)
- v4.0.6-beta
    - 更改超时时间为10分钟
- v4.0.6-alpha
    - 使用审核服务
- v4.0.6
    - 支持GPT-4了
    - 移除text-davinci-003等模型（或许早该这么做了
- v4.0.5
    - 修复400报错
- v4.0.4-alpha
    - 新增共用人设选项
- v4.0.4
    - 重写sst服务
    
- v4.0.3
    - 重写vits服务

- v4.0.2
    - 修复400报错
    
- v4.0.1
    - 语音输入做成服务,启用插件koishi-plugin-tc-sst[![npm](https://img.shields.io/npm/v/koishi-plugin-tc-sst?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-tc-sst)即可实现

- v4.0.0
    - 新增语音输入


- v3.1.5
    - 更新bot.selfid的获取方式


- v3.1.4
    - 更新bot.selfid的获取方式


- v3.1.3
    - 新增被提及触发指令选项

- v3.1.2

    - 新增消息撤回
    - 接入vits语音服务

- v3.1.1

    - 修复无限触发block

- v3.1.0

    - 新增block全指令屏蔽
    - 修复重置会话400错误

- v3.0.7


    - 修复重置会话400错误

- v3.0.6
    - 修复指令残留


- v3.0.5
    - 修复400错误
    - 优化代码结构


- v3.0.4
    - 新增删除人格


- v3.0.3

    - 更换切换人格的方式
    - 优化代码结构


- v3.0.2
    - 修复会话过长导致的400报错
    - 新增过滤器
    - 新增引用模式开关

- v3.0.1
    - 修复会话过长导致的400报错

- v3.0.0
    - 修复私聊接收消息不完整
    - 修复切换人格识别
    - 添加预设人格数量
    - 添加明日香、艾莉希雅等人格

- v2.0.0

    - 兼容配置文件,修复删除python后端导致炸掉koishi的bug
- v1.6.0

    - 新增翻译服务
- v1.5.9

    - 新增引用回复
- v1.5.8
    - 修复无法识别空格的bug
    - 增加了GPT生成图片

- v1.5.7
    - 增加了切换模式的局内开关

- v1.5.6
    - 移除了python后端，采用js
添加反向代理选项

- v1.5.5
    - 更换反代地址

- v1.5.1
    - 将人格管理做成了子命令

- v1.5.1
    - 修复js推荐模式思考中，优化回话管理，限制10条回话
    - .clear权限由2下调为1
    - 修复图片模式显示异常
    - 移除图片模式背景图，加速回复

- v1.4.9
    - 删除里lib里面的图片
    - dvc.clear权限由5下调为2

- v1.4.8
    - 修复超级用户无法接收消息的问题。

- v1.4.7
    - 修复无法发送空格
    - 修复调用限制无效
    - 优化图片模式，加快了回复速度

- v1.4.6
    - 新增艾特触发，私聊触发
    - 新增模式选择菜单
- v1.4.5
    - 新增语音模式,仅支持原神语音（抄袭自genshin-voice
    - 新增输出模式切换指令
- v1.4.4
    - 优化审核的逻辑，加速审核
- v1.4.3
    - 修复未填写AK和SK情况下，不合规的bug
- v1.4.2 
    - 实现了dvc服务，其他插件可以使用以下服务
    - chat_with_gpt: 单次对话
    - get_credit: 查询余额
    - censor_request: 百度智能云审核服务
    ```
    import {} from 'koishi-plugin-davinci-003'
    ```
    ```
    ctx.command('call').action(async ({session})=>{
        const msg:Msg = {role:'user',content:'你好，这是一次测试，你只需回复ok'}
        console.log(await ctx.dvc.get_credit(session))
        console.log(await ctx.dvc.chat_with_gpt([msg]))
        console.log(await ctx.dvc.censor_request('脏话测试'))
    })
    ```
- v1.4.1 
    - 优化代码结构
    - 新增节俭模式

- v1.4.0 
    - 修复api_key写死的致命错误

- v1.3.9 
    - 后端移植到客户端
    - 无需自建后端了

- v1.3.8
    - 新增内容审查

- v1.3.7
    - 新增gpt生成图片（需要自建后端）
    - 新增人格管理 发送 “dvc 切换人格”即可

- v1.3.0
    - 新增gpt3.5-turbo（需自建后端）

- v1.2.5
    - 更换davinci-003的流量，可以走koishi代理


# 感谢
反代默认使用的是<a class="panel-cover__title panel-title"><a href="https://github.com/Yidadaa/ChatGPT-Next-Web">Yidadaa佬</a>的，感谢！