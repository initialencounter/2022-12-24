const date = ['今日','本周','本月']
const mine_mode_arr = ['高级', '中级', '初级']
const puzzle_mode_arr = [2]
const mine_rank = { '今日': {}, '本周': {}, '本月': {} }
const puzzle_rank = { '今日': {}, '本周': {}, '本月': {} }
const puzzle_tranform = { 2: '4x4' }
const time = new Date()
const all_rank = {'update_time': time.getFullYear()+'年'+time.getMonth()+'月'+time.getDate()+'日'+time.getHours()+'时'+time.getMinutes()+'分'}
const get_mine_rank = () => {
    //获取扫雷榜单
    var rank = { '高级': [], '中级': [], '初级': [] }
    mine_mode_arr.forEach((i) => {
        id("filter_level_layout").findOne().click()
        sleep(500)
        id("item_text").text(i).findOne().click()
        sleep(5000)
        id("recyclerView").className("androidx.recyclerview.widget.RecyclerView").scrollable(true).findOne().children().forEach(child => {
            var target0 = child.findOne(id("rank_tv")).text();
            var target2 = child.findOne(id("nameView")).text();
            var target3 = child.findOne(id("value_tv")).text();
            try {
                rank[i].push([target0, target2, , target3])
            } catch (err) {
                console.warn(String(err))
            }
        });
    })
    console.log(rank)
    return rank
}

const get_puzzle_rank = () => {
    //获取华容道榜单
    var rank = { '4x4': [] }
    puzzle_mode_arr.forEach((mode) => {
        id("filter_level_layout").clickable(true).findOne().click()
        sleep(500)
        id("button").drawingOrder(mode).findOne().click()
        sleep(5000)
        id("recyclerView").className("androidx.recyclerview.widget.RecyclerView").scrollable(true).findOne().children().forEach(child => {
            var target0 = child.findOne(id("rank_tv")).text();
            var target2 = child.findOne(id("nameView")).text();
            var target3 = child.findOne(id("value_tv")).text();
            var mode_t = String(puzzle_tranform[mode])
            try {
                rank[mode_t].push([target0, target2, , target3])
            } catch (err) {
                console.warn(String(err))
            }
        });
    })
    console.log(rank)
    return rank
}


// 打开目标页面

// 解锁屏幕
function unlock()
{
    if(!device.isScreenOn())
    {
        device.wakeUp();
        sleep(500);
        swipe(500,2000,500,1000,210);
        sleep(500)
        // var password = "00000"  //这里输入你手机的密码
        // for(var i = 0; i < password.length; i++)
        // {
        //     var p = text(password[i].toString()).findOne().bounds();
        //     click(p.centerX(), p.centerY());
        //     sleep(100);
        // }
    }
}

unlock()


shell("am start " + app.intentToShell({
    packageName: "com.star.minesweeping",
    className: "com.star.minesweeping.ui.activity.rank.minesweeper.RankTimingDayActivity"
}), true);
sleep(1000)
date.forEach((i) => {
    sleep(500)
    id("tv_tab_title").className("android.widget.TextView").text(i).findOne().parent().click()
    sleep(500)
    var rank = get_mine_rank()
    mine_rank[i] = rank
})
sleep(1000)
shell("am start " + app.intentToShell({
    packageName: "com.star.minesweeping",
    className: "com.star.minesweeping.ui.activity.rank.puzzle.RankPuzzleDayActivity"
}), true);
date.forEach((i) => {
    sleep(500)
    id("tv_tab_title").className("android.widget.TextView").text(i).findOne().parent().click()
    sleep(500)
    var rank = get_puzzle_rank()
    puzzle_rank[i] = rank
})

all_rank['mine_rank'] =mine_rank
all_rank['puzzle_rank'] =puzzle_rank
console.log(all_rank)
var res = http.get('http://116.205.167.54:5140/upload/'+JSON.stringify(all_rank));
console.log('//////')
console.log(res)



// var res = http.get('http://116.205.167.54:5140/get');
// console.log(res)
// var res = http.get('http://www.baidu.com');
// console.log(res)
