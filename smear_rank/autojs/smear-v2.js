let MLKitOCR = $plugins.load('org.autojs.autojspro.plugin.mlkit.ocr');
threads.start(() => {
    sleep(200)
    text('立即开始').click()
})
requestScreenCapture();


function get_texts() {
    let ocr = new MLKitOCR();
    sleep(5000)
    let capture = captureScreen();
    let result = ocr.detect(capture);

    var texts = []
    for (var i of result) {
        var left = i.bounds.left
        var top = i.bounds.top
        var right = i.bounds.right
        var bottom = i.bounds.bottom
        var w = right - left
        var h = bottom - top
        var text = i.text
        texts.push([text, left, top, w, h])
    }
    ocr.release()
    return texts
}

function finish() {
    threads.start(() => {
        sleep(60000)
        console.log('运行结束')
        engines.stopAll()
    })
}

const date = ['今日'] //,'本周','本月'
const mine_mode_arr = ['高级'] //'中级', '初级'
const puzzle_mode_arr = [2]
const mine_rank = {
    '今日': {},
    '本周': {},
    '本月': {}
}
const puzzle_rank = {
    '今日': {},
    '本周': {},
    '本月': {}
}
const puzzle_tranform = {
    2: '4x4'
}
const time = new Date()
const all_rank = {
    'update_time': time.getFullYear() + '年' + '2月' + time.getDate() + '日' + time.getHours() + '时' + time.getMinutes() + '分'
}
const get_mine_rank = () => {
    //获取rank
    console.log('get mine rank')
    var rank = {
        '高级': [],
        '中级': [],
        '初级': []
    }
    //unlock()
    mine_mode_arr.forEach((i) => {
        rank[i] = get_texts()
    })
    //console.log(rank)
    return rank
}

const get_puzzle_rank = () => {
    console.log('get puzzle rank')
    //获取华容道榜单
    var rank = {
        '4x4': []
    }
    //unlock()
    puzzle_mode_arr.forEach((mode) => {
        var mode_t = String(puzzle_tranform[mode])
        rank[mode_t] = get_texts()
    })
    //console.log(rank)
    return rank
}




// 打开目标页面

// 解锁屏幕
function unlock() {
    if (!device.isScreenOn()) {
        device.wakeUp();
        sleep(500);
        swipe(500, 2000, 500, 1000, 210);
        sleep(500)
    }

}

threads.start(() => {
    while (1) {
        if (id("fail_retry_card").exists()) {
            console.log('11')
            id("fail_retry_card").click()
        }
    }
})


function main() {
    unlock()
    console.log('runing app')
    shell("am start " + app.intentToShell({
        packageName: "com.star.minesweeping",
        className: "com.star.minesweeping.ui.activity.rank.minesweeper.RankTimingDayActivity"
    }), true);
    sleep(1000)
    date.forEach((i) => {
        unlock()
        sleep(500)
        id("tv_tab_title").className("android.widget.TextView").text(i).findOne().parent().click()
        sleep(500)
        var rank = get_mine_rank()
        mine_rank[i] = rank
    })
    Back()
    sleep(1000)
    shell("am start " + app.intentToShell({
        packageName: "com.star.minesweeping",
        className: "com.star.minesweeping.ui.activity.rank.puzzle.RankPuzzleDayActivity"
    }), true);
    date.forEach((i) => {
        unlock()
        sleep(500)
        id("tv_tab_title").className("android.widget.TextView").text(i).findOne().parent().click()
        sleep(500)
        var rank = get_puzzle_rank()
        puzzle_rank[i] = rank
    })

    all_rank['mine_rank'] = mine_rank
    all_rank['puzzle_rank'] = puzzle_rank
    console.log('send data')
    const res = http.postJson('http://116.205.167.54:5140/upload', all_rank);
    console.log(res.data);
    Back()
    Home()
    //Power()
}
while (1) {
    main()
    sleep(300000)
}
