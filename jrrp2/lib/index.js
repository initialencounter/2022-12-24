"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = exports.setRandomNumber = exports.luck_simple = exports.log = exports.Config = exports.name = void 0;
const koishi_1 = require("koishi");
exports.name = 'jrrp';
exports.Config = koishi_1.Schema.object({});
const log = (s) => console.log(s);
exports.log = log;
const luck_simple = (num) => {
    if (num < 18) {
        return '大吉';
    }
    else if (num < 53) {
        return '吉';
    }
    else if (num < 58) {
        return '半吉';
    }
    else if (num < 62) {
        return '小吉';
    }
    else if (num < 65) {
        return '末小吉';
    }
    else if (num < 71) {
        return '末吉';
    }
    else {
        return '凶';
    }
};
exports.luck_simple = luck_simple;
function setRandomNumber(s) {
    //将字符串转为10进制数
    const buf = Buffer.from(s, 'utf-8');
    const decimal = buf.readInt8(0).toString(10);
    var num = parseInt(decimal);
    //以日期和userId字符串为种子，生成伪随机数
    while (1) {
        const date = new Date();
        const numb = Math.abs(Math.sin(num + date.getDate()));
        const rand_str = numb.toString().replace('.', '');
        if (rand_str.length > 3) {
            const rand_str_ = rand_str.slice(-3, -1);
            return parseInt(rand_str_);
        }
        num++;
    }
}
exports.setRandomNumber = setRandomNumber;
function apply(ctx) {
    ctx.i18n.define('zh', require('./locales/zh'));
    ctx.command('今日人品')
        .alias('jrrp')
        .action(({ session }) => {
        const luck_point = setRandomNumber(session.userId);
        const luck_text = (0, exports.luck_simple)(luck_point);
        return `<>
        <at id="${session.userId}"/>
        您今日的幸运指数是${luck_point}/100(越低越好)，为"${luck_text}"
      </>`;
    });
}
exports.apply = apply;
