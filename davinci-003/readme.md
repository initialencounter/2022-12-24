# 注意事项

> 使用前在 <a style="color:blue" href="https://beta.openai.com/account/api-keys">beta.openai.com</a> 中获取api-key<br>
如需使用内容审查,请前往<a style="color:blue" href="https://ai.baidu.com/solution/censoring?hmsr=aibanner&hmpl=censoring">百度智能云</a> 获取AK和SK</br>
对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-davinci-003 概不负责。<br>
如果有更多文本内容想要修改，可以在<a style="color:blue" href="/locales">本地化</a>中修改 zh 内容</br>
若出现TypeError: expected { type?: "gpt3.5-unit" } | { type?: "gpt3.5-js" }报错
请修改koishi.yml将davinci-003字段删除<br>

## 添加人格的方法
* 在聊天中发送“dvc.设置人格 xxx”可以自动保存人格
* 在koishi根目录找到davinci-003-data.json文件,修改里面的人格即可
问题反馈群:399899914

## 感谢
> 逻辑端参考自<a href="https://lucent.blog/#blog" title="前往 Lucent's Blog 的主页" class="blog-button"><img src="https://img-1251540275.cos.ap-shanghai.myqcloud.com/blog/IMG_1140(20200328-104456)_1591776646572.JPG" width="25" alt="Lucent's Blog logo" class="panel-cover__logo logo logo1"></a>
<a class="panel-cover__title panel-title"><a href="https://lucent.blog/#blog" title="link to homepage for Lucent's Blog" class="blog-button">Lucent's Blog(呆呆木）</a></a><br>
反代使用的也是呆呆木的！再次感谢！<br>

# koishi-plugin-davinci-003

[![npm](https://img.shields.io/npm/v/koishi-plugin-davinci-003?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-davinci-003)

# 更新日志
## v3.0.2
>
修复会话过长导致的400报错
新增过滤器

## v3.0.1
>
修复会话过长导致的400报错

## v3.0.0
>
修复私聊接收消息不完整
修复切换人格识别
添加预设人格数量
添加明日香、艾莉希雅等人格

## v2.0.0
>
兼容配置文件,修复删除python后端导致炸掉koishi的bug
## v1.6.0
>
新增翻译服务
## v1.5.9
>
新增引用回复
## v1.5.8
>
修复无法识别空格的bug
增加了GPT生成图片

## v1.5.7
>

增加了切换模式的局内开关

## v1.5.6
>
移除了python后端，采用js
添加反向代理选项

## v1.5.5
>
更换反代地址

## v1.5.1
>
将人格管理做成了子命令

## v1.5.1
>
修复js推荐模式思考中，优化回话管理，限制10条回话
dvc.clear权限由2下调为1
修复图片模式显示异常
移除图片模式背景图，加速回复

## v1.4.9
>
删除里lib里面的图片，dvc.clear权限由5下调为2

## v1.4.8
>
修复超级用户无法接收消息的问题。

## v1.4.7
>
修复无法发送空格
修复调用限制无效
优化图片模式，加快了回复速度

## v1.4.6
>
新增艾特触发，私聊触发
新增模式选择菜单
## v1.4.5
>
新增语音模式,仅支持原神语音（抄袭自genshin-voice
新增输出模式切换指令
## v1.4.4
>
优化审核的逻辑，加速审核
## v1.4.3
>
修复未填写AK和SK情况下，不合规的bug
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

