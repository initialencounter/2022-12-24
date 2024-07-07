import type { } from 'koishi-plugin-puppeteer'
import { Context, Element, h } from 'koishi'
import { PluginGrid } from '.'
import { resolve } from 'path'
export async function render_list(
    ctx1: Context,
    commands: (string | number)[][],
    theme: string
): Promise<Element> {
  let page = await ctx1.puppeteer.page()
  let jsonComands = JSON.stringify(commands)
  await page.setViewport({ width: 1920 * 2, height: 1080 * 2 })
  await page.goto(resolve(ctx1.root.baseDir, 'data/help-pro/static/index.html'))
  await page.evaluate(`setElement(${jsonComands})`)
  let element = await page.$('#page')
  return h.image(await element.screenshot({encoding: 'binary',}), 'image/png')
}
function parseColor(color: string) {
  color = color.slice(5, -1)
  return color.split(', ').map((v) => { return parseInt(v) })
}
async function getRandomColor(theme_color: number[]) {
  // 生成随机的十六进制颜色代码
  const randomColor = (source: number) => {
    const cnum = Math.floor(Math.random() * 70) + source
    const cumm2 = cnum < 0 ? 0 : (cnum > 255 ? 255 : cnum)
    return cumm2.toString(16).padStart(2, '0');
  }
  let color = `#${randomColor(theme_color[0])}${randomColor(theme_color[1])}${randomColor(theme_color[2])}`;
  return color;
}

export async function render_categroy(
    ctx1: Context, theme: string, pluginGrid: PluginGrid
): Promise<Element> {
  const theme_color = parseColor(theme)
  const imgs: Element[] = []
  let y = 0
  let postId=1
  let [red,green,blue] = parseColor(theme)
  const step = Math.floor(255/Object.keys(pluginGrid).length)
  let bgc = theme
  let [ro, go] = [true, true]
  for (var [keys, commands] of Object.entries(pluginGrid)) {
    if (!commands.length) {
      continue
    }
    // Set background color to white
    const items = []
    let _y = 0
    y += 70
    if (red > 0 && ro) {
      red += step
      if (red > 255) {
        red = 255
        ro = false
      }
    } else if (go) {
      green += step
      if (green > 255) {
        green = 255
        go = false
      }
    } else {
      blue += step
      if (blue > 255) {
        blue = 255
        if(!ro){
          ro = true
        }
        if (!ro && !go) {
          red = parseInt(bgc.slice(1, 3), 16);
          green = parseInt(bgc.slice(3, 5), 16);
          blue = parseInt(bgc.slice(5, 7), 16);
        }
      }
    }
    for (let i = 0; i < commands.length; i += 4) {
      const item_style1 = `width:${175}px;height:${60}px;background:${await getRandomColor(theme_color)};text-align: center;border-radius: 1rem 1rem 1rem 1rem;;font-size: `
      const item_style2 = `text-align: center;font-size:18px;position:relative;top:0px`
      items.push(<div style={item_style1+(isChinese(commands[i][0])?'25px':'30px')}>{commands[i][0]}<div style={item_style2}>{commands[i]?.[1] == '' ? 'n/a' : commands[i]?.[1]}</div></div>)
      if (i + 1 < commands.length) {
        items.push(<div style={item_style1+(isChinese(commands[i + 1][0])?'25px':'30px')}>{commands[i + 1][0]}<div style={item_style2}>{commands?.[i + 1][1] == '' ? 'n/a' : commands[i + 1]?.[1]}</div></div>)
      }
      if (i + 2 < commands.length) {
        items.push(<div style={item_style1+(isChinese(commands[i + 2][0])?'25px':'30px')}>{commands[i + 2][0]}<div style={item_style2}>{commands[i + 2]?.[1] == '' ? 'n/a' : commands[i + 2]?.[1]}</div></div>)
      }
      if (i + 3 < commands.length) {
        items.push(<div style={item_style1+(isChinese(commands[i + 3][0])?'25px':'30px')}>{commands[i + 3][0]}<div style={item_style2}>{commands[i + 3]?.[1] == '' ? 'n/a' : commands[i + 3]?.[1]}</div></div>)
      }
      _y += 70
      y += 85

    }
    const items_style = `width: ${750}px;height: ${_y + 60}px;background:rgba(${red}, ${green}, ${blue}, 255);position: relative;left:20px;top:20px;border-radius: 1rem 1rem 1rem 1rem;padding:10px;opacity:0.6`
    const item_style = `width:${400}px;height:${80}px;text-align: center;font: small-caps bold 40px/1 sans-serif;border-radius: 1rem 1rem 1rem 1rem;align-self: center;padding:15px;position: relative;left: -100px;top: -10px;`
    const bg_style = `width: ${750}px;height: ${_y}px;display:grid;grid-template-columns: 185px 185px 185px 185px;border-radius: 1rem 1rem 1rem 1rem;padding:5px;position: relative;top:-55px;`
    postId ++
    const bg =
      <div>
        <div style={items_style}>
          <div style={item_style}>{category_map[keys]}</div>
          <div style={bg_style}>{items}</div>
        </div>
        <br></br>
      </div>
    imgs.push(bg)
  }
  const html_style = `width:${800}px;height:${y + 110}px;align-items: center;;background-image:url(${ctx1.config.background});background-size: cover;background-repeat: no-repeat`
  return <html>
    <div style={html_style}>{imgs}</div>
  </html>

}

const category_map = {
    game: '娱乐玩法',
    manage: '管理工具',
    tool: '实用工具',
    extension: '拓展服务',
    ai: '人工智能',
    preset: '行为预设',
    storage: '存储服务',
    adapter: '适配器',
    image: '图片服务',
    console: '控制台',
    gametool: '游戏辅助',
    life: "生活指南",
    meme: '趣味交互',
    media: '资讯服务',
    other: "其他",
    unknow: '未知',
}
function isChinese(s: string): boolean {
  return /[\u4e00-\u9fa5]/.test(s);
}

function calculateColorBrightness(r: number, g: number, b: number) {
  // 计算亮度
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness;
}