importPackage(Packages["okhttp3"]); //导入包
var client = new OkHttpClient.Builder().retryOnConnectionFailure(true).build();
var request = new Request.Builder().url("ws://121.37.247.122:32327").build(); //vscode  插件的ip地址，
client.dispatcher().cancelAll();//清理一次


// 发送私信
function sendPrivateMsg(qq, msg) {
    // 设置剪切板
    setClip(msg);
    // 打开发送消息的界面
    app.startActivity({
        action: "android.intent.action.VIEW",
        data: "mqq://im/chat?chat_type=wpa&version=1&src_type=web&uin=" + qq,
        packageName: "com.tencent.mobileqq",
    });
    sleep(300);
    // 点击输入框
    id("input").findOne(3000).click();
    sleep(300);
    // 打开剪切板
    click(550, 1400);
    sleep(200);
    // 粘贴文本
    click(256, 1582);
    sleep(200);
    // 发送消息
    text("发送").findOne(2000).click();
    sleep(300);
    // 返回
    back();
    back();
}

// 发送群消息
function sendGroupMsg(qq, msg) {
    setClip(msg);
    app.startActivity({
        action: "android.intent.action.VIEW",
        data: "mqqapi://card/show_pslcard?src_type=internal&version=1&card_type=group&uin=" + qq,
        packageName: "com.tencent.mobileqq",
    });
    sleep(200);
    id("aek").findOne(3000).click();
    sleep(300);
    id("input").findOne(3000).click();
    sleep(300);
    click(550, 1400);
    sleep(200);
    click(256, 1582);
    sleep(200);
    text("发送").findOne(2000).click();
    sleep(300);
    back();
    back();
}

myListener = {
    onOpen: function (webSocket, response) {
        print("连接到服务端");
        webSocket.send('xiaomi8');
    },
    onMessage: function (webSocket, msg) { //msg可能是字符串，也可能是byte数组，取决于服务器送的内容
        msg = JSON.parse(msg);
        print(msg);
        if (msg.guildId != 0) {
            sendGroupMsg(msg.guildId, msg.content);
        } else {
            sendPrivateMsg((msg.id).slice(8,), msg.content);
        }
    }
}

var webSocket = client.newWebSocket(request, new WebSocketListener(myListener)); //创建链接

setInterval(() => { // 防止主线程退出

}, 1000);
