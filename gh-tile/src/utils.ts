import { Context, Logger } from "koishi";
import fs from "fs";
const logger = new Logger("gh-tile")

// 获取今日瓷砖数，
export async function getTileNums(ctx: Context, username: string,date:string) {
    let html: string
    try {
        html = await ctx.http.get(`https://github.com/${username}`)
        fs.writeFileSync('text.html',html)
    } catch (e) {
        return false
    }
    // 构建正则表达式
    const reg = new RegExp(`(?<=class="ContributionCalendar-day" data-date="${date}" data-level=".*?"><span class="sr-only">)([\\s\\S]*?)(?=</span></td>)`, 'g')
    // 匹配瓷砖
    const dr = html.match(reg)
    if (!dr) {
        return false
    }
    // 数据清洗
    const num = dr[0].split(" ")[0]
    if(num?.startsWith("No")){
        return -1
    }
    return Number(num)

}

// console.log(getTileNums(new Context(),"XxLittleCxX","2023-09-02"))



export async function getContributions(ctx: Context, token: string, username: string) {
    const headers = {
      'Authorization': `bearer ${token}`,
    }
    const currentDate = new Date();
    // 获取 周几
    const currentWeek = currentDate.getDay();
  
    // 获取周末
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentWeek);
    const formattedStart = weekStart.toISOString();
  
    // 获取周日
    const weekEnd = new Date(currentDate);
    weekEnd.setDate(currentDate.getDate() + (6 - currentWeek)); // Start from the 1st day of last month
    const formattedEnd = weekEnd.toISOString();
  
    const body = {
      "query": `query {
            user(login: "${username}") {
              name
              contributionsCollection(from: "${formattedStart}" to: "${formattedEnd}") {
                contributionCalendar {
                  weeks {
                    contributionDays {
                      contributionCount
                      date
                      weekday
                    }
                    firstDay
                  }
                }
              }
            }
          }`
    }
    let response
    try {
      response = await ctx.http.post('https://api.github.com/graphql', body, { headers: headers });
      const data = response?.data;
      const nums = getContributionCount(data, new Date().getDay())
      return nums
    } catch (e) {
      logger.error(e)
      return false
    }
  }
  
  function getContributionCount(contributionData, currentWeek: number) {
    const todayContribution = contributionData?.["user"]?.["contributionsCollection"]?.["contributionCalendar"]?.["weeks"]?.[0]?.["contributionDays"]?.[currentWeek]?.["contributionCount"]
    if (todayContribution === 0) {
      return -1
    } else {
      return todayContribution
    }
  }

  export function setDailyAlarm(time: string, callback: CallableFunction) {
    const hour = Number(time.split("-")[0])
    const minute = Number(time.split("-")[1])
    if (isNaN(hour) || isNaN(minute)) {
      logger.error("瓷砖提醒设置失败！")
      return
    }
    const now = new Date();
    const alarmTime = new Date();
    alarmTime.setUTCHours(hour);
    alarmTime.setUTCMinutes(minute);
    alarmTime.setUTCSeconds(0);
    if (alarmTime <= now) {
      // 如果今天的时间已经过去了，就设置到明天的同一时间
      alarmTime.setUTCDate(alarmTime.getDate() + 1);
    }
    const timeUntilAlarm = alarmTime.getTime() - now.getTime();
    setTimeout(() => {
      setInterval(callback, 86400000);
      callback();
      // 设置每隔一天触发一次的定时器
    }, timeUntilAlarm);
    logger.info("瓷砖提醒设置成功！")
  }