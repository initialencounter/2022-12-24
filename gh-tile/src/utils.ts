import { Context, Logger } from "koishi";
import fs from "fs";
const logger = new Logger("gh-tile")

// 获取今日瓷砖数，
export async function getTileNums(ctx: Context, username: string, date: string) {
  let html: string
  try {
    html = await ctx.http.get(`https://github.com/${username}`)
    // fs.writeFileSync('text.html',html)
  } catch (e) {
    return false
  }
  date = (date.split('-').map((i) => {
    if (parseInt(i) < 10) {
      return "0" + i.replace('0','')
    } else {
      return i
    }
  })).join('-')
  // 构建正则表达式
  const reg = new RegExp(`(?<=class="ContributionCalendar-day" data-date="${date}" data-level=".*?"><span class="sr-only">)([\\s\\S]*?)(?=</span></td>)`, 'g')
  // 匹配瓷砖
  const dr = html.match(reg)
  // console.log(dr)
  if (!dr) {
    return false
  }
  // 数据清洗
  const num = dr[0].split(" ")[0]
  if (num?.startsWith("No")) {
    return -1
  }
  return Number(num)

}


getTileNums(new Context(), 'aimerneige','2023-09-1')
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

