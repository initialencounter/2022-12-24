"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = exports.usage = exports.compute = exports.Config = exports.logger = exports.name = void 0;
const koishi_1 = require("koishi");
exports.name = 'stnb';
exports.logger = new koishi_1.Logger(exports.name);
exports.Config = koishi_1.Schema.object({
    cmd: koishi_1.Schema.string().default('斯坦牛逼').description('命令别名')
});
function compute(mode, time, bvs) {
    var cont = 435.001;
    if (mode == 1) {
        cont = 47.229;
    }
    if (mode == 2) {
        cont = 153.73;
    }
    const st = cont / ((time ** 1.7) / (time * bvs));
    return st.toFixed(3);
}
exports.compute = compute;
;
exports.usage = `
  ## 注意事项
  > 本插件参考自 <a href="https://github.com/putianyi889/mmmh-wiki">putianyi889 扫雷术语</a>
  仅供学习参考，请勿用于商业行为
  对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-stnb 概不负责。
  如果有更多文本内容想要修改，可以在<a href="/locales">本地化</a>中修改 zh 内容
  `;
function apply(ctx, config) {
    ctx.i18n.define('zh', require('./locales/zh'));
    ctx.command('stnb <prompt:text>')
        .alias(config.cmd)
        .action(async ({ session, options }, prompt) => {
        try {
            const time = parseInt(prompt.split(' ')[0]);
            const bvs = parseInt(prompt.split(' ')[1]);
            const mode = parseInt(prompt.split(' ')[2]);
            if (!bvs) {
                return session.text('.nobvs');
            }
            if (!time) {
                return session.text('.notime');
            }
            if (!mode) {
                return session.text('.nomode');
            }
            return compute(mode, time, bvs);
        }
        catch (err) {
            exports.logger.warn(err);
            return String(err);
        }
    });
}
exports.apply = apply;
