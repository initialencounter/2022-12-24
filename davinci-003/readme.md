# koishi-plugin-davinci-003

[![npm](https://img.shields.io/npm/v/koishi-plugin-davinci-003?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-davinci-003)

# 注意事项
> 使用前在 <a style="color:yellow" href="https://beta.openai.com/account/api-keys">beta.openai.com</a> 中获取api-key<br>
如需使用内容审查,请前往<a style="color:yellow" href="https://ai.baidu.com/solution/censoring?hmsr=aibanner&hmpl=censoring">百度智能云</a> 获取AK和SK</br>
后端模式下，无需代理，服务端需要同步更新至3月8日2点后的版本，否则会报错<br>
<a style="color:yellow" href="https://github.com/initialencounter/mykoishi/blob/main/davinci-003#readme.md">GPT-3.5turbo自建后端教程</a><br>
对于部署者行为及所产生的任何纠纷， Koishi 及 <a style="color:yellow" href="https://github.com/initialencounter/mykoishi">koishi-plugin-davinci-003</a>概不负责。<br>
如果有更多文本内容想要修改，可以在<a style="color:yellow" href="/locales">本地化</a>中修改 zh 内容</br>
GPT-3.5turbo后端参考自<a style="color:yellow" href="https://lucent.blog">Lucent佬(呆呆木)</a><br>
反代api使用的是lucent佬(呆呆木)的，再次感谢！

# 更新日志
## v1.4.2 
>
实现了dvc服务，其他插件可以使用以下服务
chat_with_gpt: 单次对话
get_credit: 查询余额
censor_request: 百度智能云审核服务
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

## v1.4.1 
>
优化代码结构
新增节俭模式

## v1.4.0 
>
修复api_key写死的致命错误

## v1.3.9 
>
后端移植到客户端
无需自建后端了

## v1.3.8
>
新增内容审查

## v1.3.7
>
新增gpt生成图片（需要自建后端）
新增人格管理 发送 “dvc 切换人格”即可

## v1.3.0
>
新增gpt3.5-turbo（需自建后端）

## v1.2.5
>
更换davinci-003的流量，可以走koishi代理


# 后端搭建
## 参考自<a href="https://lucent.blog/?p=118">Lucent</a>，感谢Lucent佬的慷慨

api_key已封装成请求体，只需在客户端填写，服务端无需填写


* 下载server目录

* 双击安装依赖.bat

* 双击启动服务.bat

