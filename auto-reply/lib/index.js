"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = exports.Config = exports.log = exports.name = exports.add_data = exports.rule_update = exports.len = void 0;
const koishi_1 = require("koishi");
const len = async (ctx) => {
    const data = await ctx.database.get('auto_reply', {}, ['id']);
    const len = data.length;
    return len;
};
exports.len = len;
const rule_update = async (ctx) => {
    let arr = [];
    const data_len = await (0, exports.len)(ctx);
    for (var idx = 1; idx < data_len + 1; idx++) {
        var rule_fild = await ctx.database.get('auto_reply', { id: [idx] }, ["rules"]);
        var rule = String(rule_fild[0].rules);
        if (rule) {
            arr.push(rule);
        }
    }
    return arr;
};
exports.rule_update = rule_update;
const add_data = async (ctx, session, prompt, split_str) => {
    try {
        const que = prompt.split(split_str)[0];
        const ans = prompt.split(split_str)[1];
        const data_len = await (0, exports.len)(ctx);
        const rules_arr = await (0, exports.rule_update)(ctx);
        if (rules_arr.includes(que)) {
            return '规则重复';
        }
        await ctx.database.create('auto_reply', { rules: que, reply: ans, lastCall: new Date(), add_user: session.userId });
        return 'success to add';
    }
    catch (err) {
        (0, exports.log)(err);
        return String(err);
    }
};
exports.add_data = add_data;
exports.name = 'auto-reply';
const log = (s) => { console.log(s); };
exports.log = log;
exports.Config = koishi_1.Schema.object({
    split_str: koishi_1.Schema.string().default('#').description('规则的分隔符'),
    min_authority: koishi_1.Schema.number().default(1).description('添加回复规则的最低权限,ps:权限在控制台-数据库中修改权限'),
    cmd: koishi_1.Schema.string().default('set').description('添加规则的触发命令')
});
async function apply(ctx, config) {
    ctx.i18n.define('zh', require('./locales/zh'));
    // 初始化数据库
    ctx.model.extend('auto_reply', {
        // 各字段类型
        id: 'unsigned',
        rules: 'text',
        reply: 'text',
        lastCall: 'timestamp',
        add_user: 'string',
    }, {
        // 使用自增的主键值
        autoInc: true,
    });
    ctx.middleware(async (session, next) => {
        const rules_arr = await (0, exports.rule_update)(ctx);
        // log(rules_arr)
        for (var i in rules_arr) {
            if (rules_arr[i].indexOf(String(session.content)) != -1) {
                var ans_json = await ctx.database.get('auto_reply', { rules: [session.content] }, ['reply']);
                var ans = ans_json[0].reply;
                return ans;
            }
        }
        return next();
    });
    //添加规则
    ctx.command('ar <rule:string>', { authority: config.min_authority })
        .alias(config.cmd)
        .action(async ({ session }, prompt) => {
        //判断规则是否合法
        (0, exports.log)(session.content);
        if (session.content.indexOf(config.split_str) == -1) {
            return session.text('.bad-rule', [config.split_str]);
        }
        const add_msg = await (0, exports.add_data)(ctx, session, prompt, config.split_str);
        //判断规则是否添加成功
        if (add_msg == 'success to add') {
            return session.text('.success');
        }
        else {
            return session.text('.failure', [add_msg]);
        }
    });
}
exports.apply = apply;
