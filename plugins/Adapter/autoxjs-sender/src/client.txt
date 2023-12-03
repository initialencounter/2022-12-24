/*
 * @Author: initialencounter
 * @Date: 2023-07-01 22:04:50
 * @LastEditors: initialencounter
 * @LastEditTime: 2023-07-01 22:04:50
 * @FilePath: D:\dev\koishi-hmr\external\autoxjs-server\src\client.js
 * @Description: 请使用 AutoX.js 运行此脚本
 *
 * Copyright (c) 2023 by initialencounter, All Rights Reserved.
 */

// 图片保存的路径
const IMG_PATH = "/sdcard/Pictures/";
const ENDPOINT = "ws://127.0.0.1:32327";

importPackage(Packages["okhttp3"]); // 导入包
const client = new OkHttpClient.Builder().retryOnConnectionFailure(true).build();

let request = new Request.Builder().url(ENDPOINT).build(); // ws 地址，
client.dispatcher().cancelAll();// 清理一次
const heartbeatInterval = 5000; // 心跳间隔时间，单位：毫秒
let heartbeatTimer = null;
let heartbeatSign = 1;
let retryInterval = 10000;
// WebSocket监听器
const myListener = {
    onOpen: function (webSocket, response) {
        console.log("WebSocket连接已打开");
        heartbeatTimer = setInterval(() => {
            webSocket.send('heartbeat'); // 发送心跳包
        }, heartbeatInterval);
    },
    onMessage: function (webSocket, text) {
        if (text == "heartbeat") {
            heartbeatSign++;
            console.log(getTime() + text);
        } else {
            sendMsg(text);
        }
    },
    onClosing: function (webSocket, code, reason) {
        if (reason == "被动关闭") {
            heartbeatSign = 0
        }
        console.log("WebSocket连接即将关闭" + "\ncode:\n" + code + "\nreason:\n" + reason);
    },
    onFailure: function (webSocket, t, response) {
        console.log("WebSocket连接失败" + "\nreason:\n" + reason);
    }
};

// 创建WebSocket连接
let webSocket = client.newWebSocket(request, new WebSocketListener(myListener));

// 重连函数
function reconnect() {
    try {
        sleep(heartbeatInterval);
        console.log("正在尝试重新连接...");
        if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
        }
        heartbeatTimer = null;
        webSocket.cancel(); // 取消当前WebSocket连接
        request = new Request.Builder().url(ENDPOINT).build(); // ws 地址
        client.dispatcher().cancelAll();//清理一次
        webSocket = client.newWebSocket(request, new WebSocketListener(myListener));
    } catch (e) {
        console.log('未知错误' + e);
    }

}
// 定时器，防止主线程退出
let mainproc = setInterval(function () {
    if (heartbeatSign == 0) {
        console.log('跳过');
        clearInterval(mainproc);
    } else {
        const heartbeatTmp = heartbeatSign;
        sleep(retryInterval);
        if (heartbeatTmp == heartbeatSign) {
            console.log('主动重连')
            reconnect();
        }
    }

}, retryInterval);

// 发送消息
function sendMsg(msg) {
    try {
        let { content, guildId, id } = JSON.parse(msg);
        if (guildId == 0) {
            id = id.slice(8,);
        }
        device.wakeUp();
        sleep(200);
        const id1 = content.indexOf('<image url="') + 12;
        if (id1 > 11) {
            sendImage(saveImage(getUrl(id1, content)), id)
        } else {
            // 发送文本
            sendText(id, content);
        }
        back();
    }
    catch (e) {
        console.log("W:\n", e);
    }
}
// 选择联系人并发送消息，然后返回
function selectTarget(qid) {
    id('ik5').text('搜索').findOne(4000).click();
    id('ik5').text('搜索').findOne(3000).setText(qid);
    id('j64').text(`(${qid})`).findOne(2000).parent().click();
    id('dialogRightBtn').text('发送').findOne(2000).click();
    back();
    back();
}
// 发送图片
function sendImage(imgUrl, qid) {
    const intent = app.intent({
        action: "SEND",
        packageName: "com.tencent.mobileqq",
        className: "com.tencent.mobileqq.activity.JumpActivity",
    })
    intent.setType("image/*");
    intent.putExtra(Intent.EXTRA_STREAM, imgUrl);
    app.startActivity(intent);
    selectTarget(qid);
}

// 保存图片
function saveImage(url) {
    console.log('img-url:', url);
    const img = images.load(url);
    const filePath = IMG_PATH + getTime() + ".jpg";
    images.save(img, filePath, "jpg", 100);
    img.recycle();
    console.log("img-path", filePath);
    return filePath;
}

// 获取图片 url
function getUrl(id1, msg) {
    const id2 = msg.indexOf('"/>');
    const url = msg.slice(id1, id2);
    return url;
}

// 获取时间
function getTime() {
    const date = new Date();
    const date_str = date.toISOString();
    return date_str.replace(/:/g, '-').slice(0, 19);
}


// 发送文本
function sendText(qid, msg) {
    console.log(qid, ': ', msg);
    const intent = app.intent({
        action: "SEND",
        packageName: "com.tencent.mobileqq",
        className: "com.tencent.mobileqq.activity.JumpActivity",
    })
    intent.putExtra(Intent.EXTRA_TEXT, msg);
    intent.setType("text/plain");
    app.startActivity(intent);
    selectTarget(qid);
}