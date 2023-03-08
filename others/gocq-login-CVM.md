# CVM登录Go-CQhttp
<a name="readme-top"></a>
* 解决异地扫码网络环境异常问题
* 解决手头没有电脑的问题
## 工具
* Android Linux容器--[ZeroTermux](https://od.ixcmstudio.cn/repository/main/ZeroTermux/)

* 文件管理器--[质感文件](https://github.com/zhanghai/MaterialFiles/releases/download/v1.5.2/app-release.apk)用于文件移动

* SSH客户端--[JuccieSSH](https://juicessh.com/)

* Ftp工具--[Mt管理器](https://mt2.cn/)

* QQ扫码工具--[Tim](https://tim.qq.com/mobile/index.html?adtag=index)
<p align="right"><a href="#readme-top">back to top</a></p>
# 操作步骤
<a href="#a">1. 启动Linux容器</a><br>

<a href="#b">2. 安装gocq</a><br>

<a href="#c">3. 修改配置文件</a><br>

<a href="#d">4. 扫码登录</a><br>

<a href="#e">5. 上传配置文件到服务器</a><br>

<a href="#f">6. 启动服务器gocq</a><br>
<a name="a"></a>
# 具体操作
<p align="right"><a href="#readme-top">back to top</a></p>
## 1.启动Linux容器


(如未安装容器请前往 [ZeroTermux安装CentOS-哔哩哔哩](https://b23.tv/YpBL5Cs))
打开ZeroTermux输入：
<a name="b"></a>
```
./centos-arm64.sh
```
<p align="right"><a href="#readme-top">back to top</a></p>
## 2.安装gocq

1. 下载wget

```
yum install wget -y
```
2. 使用wget下载gocq-arm64

```
mkdir gocqhttp
cd gocqhttp
wget https://github.com/Mrs4s/go-cqhttp/releases/download/v1.0.0-rc3/go-cqhttp_linux_arm64.tar.gz
```
3. 下载tar
```
yum install tar -y
```
<a name="c"></a>
4. 使用tar解压下载的gocq-arm64
```
tar -xf go-cqhttp_linux_arm64.tar.gz
```
<p align="right"><a href="#readme-top">back to top</a></p>
## 3.修改配置文件

1. 生成配置文件config.yml和device.json（已有可跳过）
```
./go-cqhttp
```
选择所需协议

2. 修改config.yml

使用vi将config.yml里的uin: 123456改成uin: 要登录的QQ号
<a name="d"></a>
3. 修改device.json
使用vi将device.json里的 "protocol":5 改成 "protocol":2
<p align="right"><a href="#readme-top">back to top</a></p>
## 4.扫码登录


1. 回到Linux容器，启动gocq
```
./go-cqhttp
```
2. 查看二维码
<a name="e"></a>
打开质感文件->左边栏->访问Termux文件->进入/home/centos-arm64/root/gocqhttp目录，找到二维码，截图

3. 打开Tim登录QQ扫码

<p align="right"><a href="#readme-top">back to top</a></p>
## 5.上传配置文件到服务器


1.将session.token，device.json，congfig.json（可选）移动到内部存储

打开质感文件->左边栏->访问Termux文件->进入/home/centos-arm64/root/gocqhttp目录，
<a name="f"></a>
将session.token，device.json，congfig.json（可选）移动到内部存储

2. 使用Mt管理器ftp登录服务器，将session.token，device.json，congfig.json，上传至云服务器
<p align="right"><a href="#readme-top">back to top</a></p>
## 6.云服务器启动gocq

将session.token，device.json，congfig.json，与go-cqhttp可执行文件放到同一目录，切换到该目录
```
./go-cqhttp
```

<!-- CONTACT -->
## Contact

反馈群399899914

[作者b站](https://space.bilibili.com/225995995)

<p align="right"><a href="#readme-top">back to top</a></p>

