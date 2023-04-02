"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = exports.draw_img = exports.quickSort = exports.add_scroe = exports.game = exports.replace_n = exports.find_color = exports.theme = exports.Config = exports.log = exports.usage = exports.name = void 0;
const jsx_runtime_1 = require("@satorijs/element/jsx-runtime");
const koishi_1 = require("koishi");
const puzzle_1 = require("./puzzle");
exports.name = 'puzzle';
exports.usage = `
## 注意事项
> 原游戏 <a href="http://tapsss.com">扫雷联萌</a>
本插件仅供学习参考，请勿用于商业行为
对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-puzzle 概不负责。
如果有更多文本内容想要修改，可以在<a href="/locales">本地化</a>中修改 zh 内容
`;
exports.log = console.log;
exports.Config = koishi_1.Schema.object({
    maxConcurrency: koishi_1.Schema.number().default(3).description('最大排队数'),
    size: koishi_1.Schema.number().default(50).description('图片大小')
});
exports.theme = [['#707070', '#707070', '#707070', '#707070', '#707070'],
    ['#444444', '#00C91A', '#00C91A', '#00C91A', '#00C91A'],
    ['#444444', '#008314', '#006FFF', '#006FFF', '#006FFF'],
    ['#444444', '#008314', '#001EE1', '#FF0000', '#FF0000'],
    ['#444444', '#008314', '#001EE1', '#BB0000', '#ED9512']];
const find_color = (num, mode) => {
    var cr_num = 0;
    for (let i = 0; i < mode; i++) { // 生成数组
        for (let j = 0; j < mode; j++) {
            if (num == cr_num) {
                return exports.theme[i][j];
            }
            cr_num++;
        }
    }
};
exports.find_color = find_color;
const replace_n = (s) => {
    if (s.indexOf('\n') == -1) {
        return s;
    }
    else {
        var ss = s.replace('\n', ' ');
        return (0, exports.replace_n)(ss);
    }
};
exports.replace_n = replace_n;
const globalTasks = {};
const drctn_list = ['U', 'D', 'L', 'R'];
const game = async (gid, opration, uid, ctx) => {
    const ktk = globalTasks[gid];
    const upper_str = opration.toUpperCase();
    const str_list = upper_str.split('');
    let op_str = '';
    str_list.forEach((i) => {
        if (drctn_list.includes(i)) {
            op_str += i;
        }
    });
    const ststus = ktk.move_sqnc(op_str);
    if (ststus) {
        const game_msg = `已还原,执行操作${op_str},\n用时${ktk.duration()}`;
        await (0, exports.add_scroe)(ctx, gid, uid, ktk.mode);
        const game_data = [].concat(ktk.klotsk);
        delete globalTasks[gid];
        return [game_msg, game_data];
    }
    else {
        return [`执行操作${op_str},\n用时${ktk.duration()}`, ktk.klotsk];
    }
};
exports.game = game;
const add_scroe = async (ctx, gid, uid, mode) => {
    const pass_score = await ctx.database.get('puzzle', ["id", "score"]);
    if (pass_score.length = 0) {
        await ctx.database.create('puzzle', { gid: gid, uid: uid, mode: mode, score: 1 });
    }
    else {
        await ctx.database.set('puzzle', [pass_score[0]["id"]], { score: pass_score[0]["score"] + 1 });
    }
};
exports.add_scroe = add_scroe;
function quickSort(arr) {
    //基础结束条件：数组长度为1时，不用再作比较，直接返回
    if (arr.length < 2)
        return arr;
    let pivot = arr[0].score; //基准值
    let left = [];
    let right = [];
    for (let i = 1; i < arr.length; i++) {
        if (arr[i].score > pivot) {
            left.push(arr[i]);
        }
        else {
            right.push(arr[i]);
        }
    }
    return quickSort(left).concat([arr[0]]).concat(quickSort(right));
}
exports.quickSort = quickSort;
const draw_img = (ctx, data, size, msg) => {
    if (ctx.puppeteer) {
        const style_arr = [];
        const ofs = 8;
        for (let i = 0; i < data.length; i++) { // 生成数组
            for (let j = 0; j < data.length; j++) {
                var style_str = `position: absolute;font-size: ${size / 1.7}px;text-align: center;width: ${size}px;height: ${size}px;left: ${j * size + ofs}px;top: ${i * size + ofs}px;background: ${(0, exports.find_color)(data[i][j], data.length)}`;
                style_arr.push([style_str, data[i][j]]);
            }
        }
        const res = style_arr.map((style) => (0, jsx_runtime_1.jsx)("div", { style: style[0], children: style[1] }));
        res.push((0, jsx_runtime_1.jsx)("p", { style: `position: absolute;text-align: center;font-size: ${size / 3}px;width: ${size * data.length}px;height: ${size / 4}px;left: ${ofs}px;top: ${data.length * size + ofs}px`, children: msg }));
        return res;
    }
    else {
        var msg_str = '';
        for (let i = 0; i < data.length; i++) { //未安装ppt时
            for (let j = 0; j < data.length; j++) {
                msg_str += data[i][j] + ' ';
            }
            msg_str += '\n';
        }
        msg_str += msg;
        return (0, jsx_runtime_1.jsx)("p", { children: msg_str });
    }
};
exports.draw_img = draw_img;
function apply(ctx, config) {
    ctx.i18n.define('zh', require('./locales/zh'));
    ctx.model.extend('puzzle', {
        // 各字段类型
        id: 'unsigned',
        gid: 'string',
        uid: 'string',
        mode: 'integer',
        score: 'integer'
    }, {
        // 使用自增的主键值
        autoInc: true,
    });
    ctx.command('def <prompt:text>') //自定义画puzzle
        .option('size', '-s <size:number>')
        .action(({ session, options }, prompt) => {
        const size = options.size ? options.size : config.size;
        if (prompt) {
            const def_data = prompt;
            const filt_data = (0, exports.replace_n)(def_data);
            const filt_arr = filt_data.split(' ');
            const def_mode = Math.sqrt(filt_arr.length);
            if (def_mode > 5) {
                return session.text('.bad-mode');
            }
            const def_koi = [];
            var count = 0;
            for (let i = 0; i < def_mode; i++) { // 生成数组
                var temp = [];
                for (let j = 0; j < def_mode; j++) {
                    temp.push(parseInt(filt_arr[count]));
                    count++;
                }
                def_koi.push(temp);
            }
            const game_img = (0, exports.draw_img)(ctx, def_koi, size, prompt.slice(0, 12) + '\n' + prompt.slice(12, -1));
            return (0, jsx_runtime_1.jsxs)("html", { children: [(0, jsx_runtime_1.jsx)("div", { style: {
                            width: def_mode * size + 'px',
                            height: def_mode * size + 100 + 'px',
                            background: 'transparent',
                        } }), game_img] });
        }
    });
    ctx.command('puzzle <prompt:string>')
        .alias('pz')
        .option('mode', '-m <mode:number>')
        .option('opt', '-o <opt:string>')
        .option('size', '-s <size:number>')
        .option('rank', '-r <rank:number>')
        .action(async ({ session, options }, prompt) => {
        const gid = session.channelId;
        const uid = session.userId;
        if (options.rank) {
            const rank_arr = await ctx.database.get('puzzle', { mode: [options.rank] }, ["uid", "score"]);
            const sorted_arr = quickSort(rank_arr);
            const rank_div = [];
            for (var i in sorted_arr) {
                var itm = sorted_arr[i];
                rank_div.push((0, jsx_runtime_1.jsx)("div", { style: "font-size:40px;width:200px;height:50px", children: `${itm.uid}:${itm.score}` }));
            }
            rank_div.push((0, jsx_runtime_1.jsx)("div", { style: "font-size:20px;width:200px;height:50px", children: "----------------------" }));
            rank_div.push((0, jsx_runtime_1.jsx)("div", { style: "font-size:20px;width:200px;height:50px", children: `${options.rank}x${options.rank}排行榜` }));
            return (0, jsx_runtime_1.jsxs)("html", { children: [(0, jsx_runtime_1.jsx)("div", { style: {
                            width: 200 + 'px',
                            height: (rank_arr.length + 1) * 50 + 30 + 'px',
                            background: "transparent",
                        } }), rank_div] });
        }
        if (options.mode > 5) {
            return session.text('.bad-mode');
        }
        if (options.opt == 'stop') {
            if (Object.keys(globalTasks).includes(gid)) {
                delete globalTasks[gid];
                return session.text('.gameover');
            }
            else {
                return session.text('.notFound');
            }
        }
        if (Object.keys(globalTasks).includes(gid)) {
            const game_info = await (0, exports.game)(gid, prompt ? prompt : '', uid, ctx);
            const game_img = (0, exports.draw_img)(ctx, game_info[1], options.size ? options.size : config.size, game_info[0]);
            var rec_klotsk = globalTasks[gid];
            return (0, jsx_runtime_1.jsxs)("html", { children: [(0, jsx_runtime_1.jsx)("div", { style: {
                            width: rec_klotsk.mode * config.size + 'px',
                            height: rec_klotsk.mode * config.size + 60 + 'px',
                            background: 'transparent',
                        } }), game_img] });
        }
        else {
            if (config.maxConcurrency) {
                if (Object.keys(globalTasks).length >= config.maxConcurrency) {
                    return session.text('.concurrent-jobs');
                }
                else {
                    const new_klotsk = new puzzle_1.Klotsk(options.mode ? options.mode : 5);
                    globalTasks[gid] = new_klotsk;
                    const game_info = await (0, exports.game)(gid, prompt ? prompt : '', uid, ctx);
                    const game_img = (0, exports.draw_img)(ctx, game_info[1], options.size ? options.size : config.size, game_info[0]);
                    return (0, jsx_runtime_1.jsxs)("html", { children: [(0, jsx_runtime_1.jsx)("div", { style: {
                                    width: new_klotsk.mode * config.size + 'px',
                                    height: new_klotsk.mode * config.size + 60 + 'px',
                                    background: "transparent",
                                } }), game_img] });
                }
            }
        }
    });
}
exports.apply = apply;
