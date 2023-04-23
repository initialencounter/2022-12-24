# koishi对接mysql
## 前言
虽然不建议将需要持久化的数据保存在容器中，但是自己平时做个小项目玩玩还是没什么问题的。

## docker部署
参考自[Hustocking](https://www.cnblogs.com/hhsk/p/16746208.html)
### 安装docker，网上有很多教程，问chatgpt也可以

### 拉取docker镜像
```
docker pull mysql
```

### 启动容器
```
docker run -d --name mysql01 -p 3306:3306 -v /home/hsk/box_container/mysql01/conf.d/:/etc/mysql/conf.d -v /home/hsk/box_container/mysql01/mysql/:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=123456 mysql
```

### 创建数据库
#### 进入容器内部
```
docker exec -it mysql01 /bin/bash
```
#### 登录mysql
```
mysql -hlocalhost -uroot -p123456
```
#### 创建数据库
```
create database koishi;
```

## 配置database-mysql
* 停止其他提供数据库服务的插件
- host填写云服务器的公网ip
- password填写为我们启动容器时设置的密码123456
* 启用database-mysql插件

