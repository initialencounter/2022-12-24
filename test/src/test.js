// import { WechatyBuilder } from 'wechaty';
// import qrcodeTerminal from 'qrcode-terminal';
// const wechaty = WechatyBuilder.build({
//     name: 'wechaty-chatgpt',
//     puppet: 'wechaty-puppet-wechat',
//     puppetOptions: {
//         uos: true,
//     },
// });
// wechaty
//     .on('scan', async (qrcode, status) => {
//         qrcodeTerminal.generate(qrcode); // 在console端显示二维码
//         const qrcodeImageUrl = ['https://api.qrserver.com/v1/create-qr-code/?data=', encodeURIComponent(qrcode)].join('');
//         console.log(qrcodeImageUrl);
//     })
//     .on('login', user => console.log(`User ${user} logged in`))
//     .on('logout', user => console.log(`User ${user} has logged out`))
//     .on('message', async message => {
//         const contact = message.talker();
//         const content = message.text();
//         const isText = message.type() === wechaty.Message.Type.Text;
//         console.log(message)
//         console.log(contact,content,isText)
//     });
// wechaty
//     .start()
//     .then(() => console.log('Start to log in wechat...'))
//     .catch(e => console.error(e));