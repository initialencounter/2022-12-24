import { Context, Session } from "koishi";
import StarRail from ".";
export const gacha = {
  1: '群星跃迁',
  2: '新手跃迁',
  11: '限定跃迁',
  12: '光锥跃迁'
} as const;


declare module 'koishi' {
  interface Tables {
    starrail: GachaLog.Database
  }
}
declare module 'koishi' {
  interface User {
    starrail_uid: string
  }
}


export class GachaLog {
  role: GachaLog.Role
  uid: string
  typeName: string
  all: GachaLog.Role[]
  data: GachaLog.Role[][]
  type: number
  constructor(private ctx: Context) {
    ctx.model.extend('user', {
      starrail_uid: 'string'
    })
    ctx.before('attach-user', async ({ }, fields) => {
      fields.add('id')
    })


    ctx.model.extend('starrail', {
      // 各字段类型
      id: 'integer',
      uid: 'string',  // 游戏Id
      uuid: 'list', // 用户Id
      link: 'string', // Gachalog url
    }, {
      primary: 'id', //设置 id 为主键
      unique: ['id', 'uid'], //设置 uid及id 为唯一键
      autoInc: true
    })
    ctx.command('bond <url:text>')
      .action(async ({ session }, url) => {
        if(!url){
          session.send('请输入url')
          url = await session.prompt()
        }
        if(!url) return
        url = url.replace(/&amp;/g, "&")
        this.data = (await this.fetchUigfRecords(url, false)).list 
        if (!this.data) {
          console.log('获取失败，链接无效或已过期，请重新抓取')
        }
        const text = this.data2text()
        const uid = this.data[0][0].uid
        const account: GachaLog.Database = (await this.ctx.database.get('starrail', { uid: [uid] }))[0];
        const session_user: Session<"id"> = session as Session<"id">
        // 更新数据库
        if (account) {
          await this.ctx.database.set('user',{id:[session_user.user.id]},{starrail_uid:uid})
          await this.ctx.database.set('starrail', { uid: [uid] }, { uuid: [...account.uuid, session.userId], link: url })
        } else {
          await this.ctx.database.create('starrail', { uid: uid, uuid: [session.userId], link: url })
        }
        return '绑定成功'+text
      })
    ctx.command('穹 <type:number>')
      .option('uuid', '-u <uuid:string>')
      .action(async ({ session, options }, type) => {
        this.type = type ? type : 11
        let link: string
        try {
          if (options.uuid) {
            link = (await this.ctx.database.get('starrail', { uid: [options.uuid] }))[0].link;
          } else {
            const session_user: Session<"id"> = session as Session<"id">
            const starrail_uid: string = (await ctx.database.get('user', { id: [session_user.user.id] }))[0].starrail_uid
            link = (await this.ctx.database.get('starrail', { uid: [starrail_uid] }))[0].link;
            if (!link) {
              return '未绑定url'
            }
          }
        } catch (e) {
          return '未绑定url'
        }
        this.data = (await this.fetchUigfRecords(link, false)).list
        if (!this.data) {
          console.log('获取失败，链接无效或已过期，请重新抓取')
        }
        const text = this.data2text()
        return text
      })


  }
  data2text() {
    this.uid = this.data[0][0].uid
    this.all = this.data[2]
    this.typeName = '限定'
    switch (this.type) {
      case 1:
        this.all = this.data[0]
        this.typeName = '常驻'
        break
      case 2:
        this.all = this.data[1]
        this.typeName = '新手'
        break
      case 11:
        this.all = this.data[2]
        this.typeName = '限定'
        break
      case 12:
        this.all = this.data[3]
        this.typeName = '武器'
        break
    }
    const ans: GachaLog.Analyse_Res = this.analyse()
    const res = this.randData(ans)

    const text = JSON.stringify(res)
    return text
  }
  createURL(
    link: string,
    type: string | number = 1,
    endId: number | string = 0,
    page: number = 1,
    size: number = 10,
    useProxy = false
  ) {
    const url = new URL(link);

    url.searchParams.set('size', String(size));
    url.searchParams.set('page', String(page));
    url.searchParams.set('gacha_type', String(type));
    url.searchParams.set('end_id', String(endId));
    if (useProxy) {
      const host = url.host;
      url.host = 'proxy.viki.moe';
      url.searchParams.set('proxy-host', host);
    }

    return url.href;
  }
  async fetchRecordsByGachaType(
    link: string,
    type: number | string,
    useProxy = false
  ) {
    let page = 1;

    console.log(`开始获取 第 ${page} 页...`);
    const data = await this.ctx.http.get(this.createURL(link, type, 0, page, 20, useProxy));
    // 使用axios发送GET请求，并获取响应的data字段

    // 接下来可以根据需要处理响应数据  
    const result = []

    if (!data.data?.list) {
      console.log('链接可能已失效，请重新抓取！')
    }

    result.push(...data.data.list)

    let endId = result[result.length - 1].id
    while (true) {
      page += 1
      await wait(200)
      console.log((`开始获取 第 ${page} 页...`))
      const data = await this.ctx.http.get(this.createURL(link, type, endId, page, 20, useProxy))
      if (!data?.data || data?.data?.list?.length === 0) {
        break
      }

      result.push(...data.data.list)
      endId = result[result.length - 1].id
    }

    return result
  }
  async fetchGachaRecords(link: string, useProxy = false) {
    const res = []

    for (const [type, name] of Object.entries(gacha)) {
      console.log(`开始获取 「${name}」 跃迁记录...`)
      const records = await this.fetchRecordsByGachaType(link, type, useProxy)
      res.push(records)
      console.log(`共获取到 ${records.length} 条 「${name}」 记录`)
    }

    return res
  }


  async fetchUigfRecords(link: string, useProxy = false) {
    const list = await this.fetchGachaRecords(link, useProxy)
    const uid = list?.[0]?.[0]?.uid

    if (!uid) {
      return null
    }
    const info = {
      uid,
      lang: 'zh-CN',
      export_timestamp: timestamp(),
      export_app: pkg?.name,
      export_app_version: `v${pkg?.version}`,
      uigf_version: 'v2.3'
    }

    return { info, list } as const
  }
  get_Data() {

  }
  // 参考自云崽
  /** 统计计算记录 */
  analyse(): GachaLog.Analyse_Res {
    let fiveLog = []
    let fourLog = []
    let fiveNum = 0
    let fourNum = 0
    let fiveLogNum = 0
    let fourLogNum = 0
    let noFiveNum = 0
    let noFourNum = 0
    let wai = 0 // 歪
    let weaponNum = 0
    let weaponFourNum = 0
    let allNum = this.all.length
    let bigNum = 0
    for (let val of this.all) {

      this.role = val
      if (val.rank_type == '4') {
        fourNum++
        if (noFourNum == 0) {
          noFourNum = fourLogNum
        }
        fourLogNum = 0
        if (fourLog[val.name]) {
          fourLog[val.name]++
        } else {
          fourLog[val.name] = 1
        }
        if (val.item_type == '光锥') {
          weaponFourNum++
        }
      }
      fourLogNum++

      if (val.rank_type == '5') {
        fiveNum++
        if (fiveLog.length > 0) {
          fiveLog[fiveLog.length - 1].num = fiveLogNum
        } else {
          noFiveNum = fiveLogNum
        }
        fiveLogNum = 0
        let isUp = false
        // 歪了多少个
        if (val.item_type == '角色') {
          if (this.checkIsUp()) {
            isUp = true
          } else {
            wai++
          }
        } else {
          weaponNum++
        }

        fiveLog.push({
          name: val.name,
          abbrName: val.name,
          item_type: val.item_type,
          num: 0,
          isUp
        })
      }
      fiveLogNum++
    }
    if (fiveLog.length > 0) {
      fiveLog[fiveLog.length - 1].num = fiveLogNum

      // 删除未知五星
      for (let i in fiveLog) {
        if (fiveLog[i].name == '未知') {
          allNum = allNum - fiveLog[i].num
          fiveLog.splice(fiveLog[i], 1)
          fiveNum--
        } else {
          // 上一个五星是不是常驻
          let lastKey = Number(i) + 1
          if (fiveLog[lastKey] && !fiveLog[lastKey].isUp) {
            fiveLog[i].minimum = true
            bigNum++
          } else {
            fiveLog[i].minimum = false
          }
        }
      }
    } else {
      // 没有五星
      noFiveNum = allNum
    }

    // 四星最多
    let four = []
    for (let i in fourLog) {
      four.push({
        name: i,
        num: fourLog[i]
      })
    }
    four = four.sort((a, b) => { return b.num - a.num })

    if (four.length <= 0) {
      four.push({ name: '无', num: 0 })
    }

    let fiveAvg = 0
    let fourAvg = 0
    if (fiveNum > 0) {
      fiveAvg = Number(((allNum - noFiveNum) / fiveNum).toFixed(2))
    }
    if (fourNum > 0) {
      fourAvg = Number(((allNum - noFourNum) / fourNum).toFixed(2))
    }
    // 有效抽卡
    let isvalidNum = 0

    if (fiveNum > 0 && fiveNum > wai) {
      if (fiveLog.length > 0 && !fiveLog[0].isUp) {
        isvalidNum = (allNum - noFiveNum - fiveLog[0].num) / (fiveNum - wai)
      } else {
        isvalidNum = (allNum - noFiveNum) / (fiveNum - wai)
      }
      isvalidNum = Number(isvalidNum.toFixed(2))
    }

    let upYs: string | number = isvalidNum * 160
    if (upYs >= 10000) {
      upYs = (upYs / 10000).toFixed(2) + 'w'
    } else {
      upYs = upYs.toFixed(0)
    }

    // 小保底不歪概率
    let noWaiRate: string | number = 0
    if (fiveNum > 0) {
      noWaiRate = (fiveNum - bigNum - wai) / (fiveNum - bigNum)
      noWaiRate = (noWaiRate * 100).toFixed(1)
    }
    let firstTime = this.all[this.all.length - 1].time.substring(0, 16)
    let lastTime = this.all[0].time.substring(0, 16)
    return {
      allNum,
      noFiveNum,
      noFourNum,
      fiveNum,
      fourNum,
      fiveAvg,
      fourAvg,
      wai,
      isvalidNum,
      maxFour: four[0],
      weaponNum,
      weaponFourNum,
      firstTime,
      lastTime,
      fiveLog,
      upYs,
      noWaiRate
    }
  }

  checkIsUp() {
    if (['克拉拉', '杰帕德', '瓦尔特', '布洛妮娅', '白露', '姬子'].includes(this.role.name)) {
      return false
    }
    // if (this.role.name == '刻晴') {
    //   let start = new Date('2021-02-17 18:00:00').getTime()
    //   let end = new Date('2021-03-02 15:59:59').getTime()
    //   let logTime = new Date(this.role.time).getTime()

    //   if (logTime < start || logTime > end) {
    //     return false
    //   } else {
    //     return true
    //   }
    // }

    return true
  }

  /** 渲染数据 */
  randData(data: GachaLog.Analyse_Res) {
    let line = []
    if (this.type == 11) {
      line = [[
        { lable: '未出五星', num: data.noFiveNum, unit: '抽' },
        { lable: '五星', num: data.fiveNum, unit: '个' },
        { lable: '五星平均', num: data.fiveAvg, unit: '抽' },
        { lable: '小保底不歪', num: data.noWaiRate + '%', unit: '' }
      ], [
        { lable: '未出四星', num: data.noFourNum, unit: '抽' },
        { lable: '五星常驻', num: data.wai, unit: '个' },
        { lable: 'UP平均', num: data.isvalidNum, unit: '抽' },
        { lable: 'UP花费原石', num: data.upYs, unit: '' }
      ]]
    }
    // 常驻池
    if (this.type == 1) {
      line = [[
        { lable: '未出五星', num: data.noFiveNum, unit: '抽' },
        { lable: '五星', num: data.fiveNum, unit: '个' },
        { lable: '五星平均', num: data.fiveAvg, unit: '抽' },
        { lable: '五星武器', num: data.weaponNum, unit: '个' }
      ], [
        { lable: '未出四星', num: data.noFourNum, unit: '抽' },
        { lable: '四星', num: data.fourNum, unit: '个' },
        { lable: '四星平均', num: data.fourAvg, unit: '抽' },
        { lable: '四星最多', num: data.maxFour.num, unit: data.maxFour.name }
      ]]
    }
    // 武器池
    if (this.type == 12) {
      line = [[
        { lable: '未出五星', num: data.noFiveNum, unit: '抽' },
        { lable: '五星', num: data.fiveNum, unit: '个' },
        { lable: '五星平均', num: data.fiveAvg, unit: '抽' },
        { lable: '四星武器', num: data.weaponFourNum, unit: '个' }
      ], [
        { lable: '未出四星', num: data.noFourNum, unit: '抽' },
        { lable: '四星', num: data.fourNum, unit: '个' },
        { lable: '四星平均', num: data.fourAvg, unit: '抽' },
        { lable: '四星最多', num: data.maxFour.num, unit: data.maxFour.name }
      ]]
    }

    return {
      saveId: this.uid,
      uid: this.uid,
      type: this.type,
      typeName: this.typeName,
      allNum: data.allNum,
      firstTime: data.firstTime,
      lastTime: data.lastTime,
      fiveLog: data.fiveLog,
      line
    }
  }
}

namespace GachaLog {
  export interface Database {
    id: number
    uid: string
    uuid?: string[]
    link?: string
  }
  export interface Role {
    uid: string
    gacha_id: string
    gacha_type: string
    item_id: string
    count: string
    time: string
    name: string
    lang: string
    item_type: string
    rank_type: string
    id: string
  }
  export interface Analyse_Res {
    allNum: number
    noFiveNum: number
    noFourNum: number
    fiveNum: number
    fourNum: number
    fiveAvg: number
    fourAvg: number
    wai: number
    isvalidNum: number
    maxFour: { name: string, num: number }
    weaponNum: number
    weaponFourNum: number
    firstTime: string
    lastTime: string
    fiveLog: any[]
    upYs: string
    noWaiRate: string | number
  }
}




// API 参考自 https://github.com/vikiboss/star-rail-gacha-export
const pkg = require('../package.json')
export function timestamp(type?: 'unix'): number {
  return type === 'unix' ? Date.now() / 1000 : Date.now();
}
export function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

