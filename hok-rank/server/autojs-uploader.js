function main() {
    app.launch("com.tencent.gamehelper.smoba")
    sleep(1000)
    className("android.widget.RadioButton").text("战绩").findOne().click()
    sleep(5000)
    Tap(750, 1200) //这里不适配所有设备，请修改
    
    const time = new Date()
    const all_rank = {
        'update_time': time.getFullYear() + '年' + time.getMonth() + '月' + time.getDate() + '日' + time.getHours() + '时' + time.getMinutes() + '分'
    }
    all_rank['rank_IOS'] = get()
    
    Tap(150, 300)
    sleep(500)
    Tap(550,1730)
    sleep(500)
    Tap(1010, 1510)
    sleep(2000)

    all_rank['rank_Android'] = get()
    back()
    home()
    http.postJson('http://116.205.167.54:5140/upload-hok/', all_rank);
    console.log('done')
}

function get() {
    let count = 1
    const rank = []
    const tar = accessibilityFocused(false).checked(false).indexInParent(1).className("android.widget.ListView").clickable(false).depth(20).packageName("com.tencent.gamehelper.smoba").row(-1).rowCount(3).rowSpan(-1).visibleToUser(true).findOne()
    tar.children().forEach(child => {
        const temp = []
        temp.push(count)
        count++
        child.children().slice(1, 4).forEach(child1 => {
            temp.push(child1.text())
        })
        rank.push(temp)


    })
    const tar1 = accessibilityFocused(false).className("android.widget.ListView").clickable(false).column(-1).columnSpan(-1).contextClickable(false).depth(20).indexInParent(2).longClickable(false).row(-1).rowCount(17).rowSpan(-1).findOne()
    tar1.children().forEach(child => {
        child.children().forEach(child1 => {
            const temp = []
            temp.push(count)
            count++
            child1.children().slice(2, 5).forEach(child2 => {

                temp.push(child2.text())
            })
            rank.push(temp)
        })

    })
    return rank
}
log('巅峰榜等待中...')
sleep(150000)
while (1) {
    main()
    sleep(300000)
}
