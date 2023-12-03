import { Context, Logger, trimSlash } from "koishi";
import fs from "fs";
const logger = new Logger("gh-tile")

// 获取今日瓷砖数，
export async function getTileNums(ctx: Context, username: string, date: string, cookie:string, forwardServer: string) {
  let html: string
  try {
    html = await ctx.http.get(`${trimSlash(forwardServer)}/${username}&cookie=${cookie}`)
    // fs.writeFileSync('text.html', html)
  } catch (e) {
    return false
  }
  date = (date.split('-').map((i) => {
    if (parseInt(i) < 10) {
      return "0" + i.replace('0', '')
    } else {
      return i
    }
  })).join('-')
  // html = fs.readFileSync('text.html').toString('utf-8')
  // 匹配瓷砖
  const num = getMatch(html, date)
  // 数据清洗
  if (num?.startsWith("No")||!num) {
    return -1
  }
  return Number(num)

}
export function getMatch(s: string, date: string) {
  const start = s.indexOf(`data-date="${date}"`)
  let tmpString = s.slice(start)
  const tiler = " on "+formatDate(date)
  const end = tmpString.indexOf(tiler)
  tmpString = tmpString.slice(0, end)
  const start2 = tmpString.lastIndexOf('>')
  const end2 = tmpString.lastIndexOf(' contribution')
  const tile = tmpString.slice(start2+1,end2)
  return tile
}
function formatDate(inputDate:string) {
  // 将输入日期字符串分割成月份和日期
  const [_,month, day] = inputDate.split('-');
  // 将月份数字转换为对应的月份名
  const months = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ];
  const monthName = months[parseInt(month, 10) - 1];

  // 返回格式化后的日期字符串
  return `${monthName} ${parseInt(day, 10)}`;
}

export async function getContributions(ctx: Context, token: string, username: string, data: string) {
  const headers = {
    'Authorization': `bearer ${token}`,
  }
  const currentDate = new Date();
  if (data) {
    const [year, month, day]: number[] = data.split('-').map((s) => { return parseInt(s) })
    currentDate.setUTCFullYear(year);
    currentDate.setUTCMonth(month - 1);
    currentDate.setUTCDate(day)
  }
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
    const nums = getContributionCount(data, currentWeek)
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

