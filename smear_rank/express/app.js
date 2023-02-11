const express = require('express');               //express框架
const app = express();                            //生成express框架
const jsonFile = require('jsonfile');

//设置request的解释方式
app.use(express.json());
//设置public为静态的网页
app.use('/public', express.static('public'));

//监听端口8050
const server = app.listen(5140, '0.0.0.0', function () {
    const host = server.address().address
    const port = server.address().port
    console.log("服务器建立，访问地址为 http://%s:%s", host, port)
})

//响应：保存serverList到'./public/serverList.json'
app.post('/upload', function (req, res) {
    jsonFile.writeFile('./public/cache.json', req.body, function (err) {
        if (err) return res.send({ color: 'btn btn-danger', info: '列表保存失败' });
        res.send({ color: 'btn btn-info', info: '列表已保存' });
    });
})

app.get('/get', function (req, res) {
    jsonFile.readFile('./public/cache.json', function (err, jsonData) {
        if (err) return res.send({ color: 'btn btn-danger', info: '列表读取失败' });
        res.send(jsonData);
    });
})
