import type { } from '@koishijs/canvas'
import { Element } from 'koishi'
import { PluginGrid } from '.'
export async function render(
  commands: (string | number)[][],
  theme: string,
  backgroundImage: string
): Promise<Element> {
  let y = 100
  const items = []
  const step = Math.floor(255/commands.length)
  let bgc = theme
  let [red,green,blue] = parseColor(theme)
  let [ro, go, bo] = [true, true, true]
  for (let i = 0; i < commands.length; i++) {
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
    const text_color = calculateColorBrightness(red, green, blue) < 126 ? "#FFFFFF" : "#000000"
    const tmp = []
    const item_style0 = `width:${400}px;height:${80}px;border-radius: 1rem 1rem 1rem 1rem`
    const item_style1 = `width:${150}px;height:${60}px;background: rgba(${red}, ${green}, ${blue}, 255);border-radius: 1rem 1rem 1rem 1rem;position: relative;left:20px;font-weight: 1000;top:70px;padding:5px;opacity:0.6`
    const item_style2 = `width:${300}px;height:${60}px;border-radius: 1rem 1rem 1rem 1rem;position: relative;left:200px;padding:5px;opacity:0.6`
    const text_style = `text-align: center;font: small-caps bold 30px/1 sans-serif;position: relative;top:10px;color:${text_color}`
    const text_style2 = `text-align: center;font-size: 30px;position: relative;top:10px;color:${text_color}`

    tmp.push(<div style={item_style1}><div style={text_style}>{commands[i][0]}</div></div>)
    tmp.push(<div style={item_style2}><div style={text_style2}>{commands?.[i][1] == '' ? '该指令无描述' : commands[i]?.[1]}</div></div>)
    items.push(<div style={item_style0}>{tmp}</div>)
    y += 45
  }
  const bg_style = `width: ${500}px;height: ${120}px;display:grid;grid-template-columns: 550px 550px;border-radius: 1rem 1rem 1rem 1rem;padding:5px`
  const bg = <div style={bg_style}>{items}</div>
  const title_style = `width:${200}px;height:${40}px;text-align: center;font: small-caps bold 40px/1 sans-serif;border-radius: 1rem 1rem 1rem 1rem;align-self: center;padding:15px;position: relative;left:20px;top:40px;opacity:0.6`
  const title = <div style={title_style}>指令列表</div>

  const html_style = `width:${1100}px;height:${y}px;background:${theme};align-items: center;background-image:url(${backgroundImage});background-size: cover;background-repeat: no-repeat;`
  return <html>
    <div style={html_style}>
      <div>{title}</div>
      {bg}
    </div>
  </html>
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

export async function render2(
  pluginGrid: PluginGrid,
  theme: string,
  backgroundImage: string,
): Promise<Element> {
  const theme_color = parseColor(theme)
  const imgs: Element[] = []
  let y = 0
  let postId=1
  for (var [keys, commands] of Object.entries(pluginGrid)) {
    if (!commands.length) {
      continue
    }
    // Set background color to white
    const items = []
    const bgc = await getRandomColor(theme_color)
    let _y = 0
    y += 140
    for (let i = 0; i < commands.length; i += 3) {
      const item_style1 = `width:${350}px;height:${120}px;background:${bgc};text-align: center;font-size: 70px;border-radius: 2rem 2rem 2rem 2rem;`
      const item_style2 = `text-align: center;font-size:25px;position:relative;top:0px`
      items.push(<div style={item_style1}>{commands[i][0]}<div style={item_style2}>{commands[i]?.[1] == '' ? '该指令无描述' : commands[i]?.[1]}</div></div>)
      if (i + 1 < commands.length) {
        items.push(<div style={item_style1}>{commands[i + 1][0]}<div style={item_style2}>{commands?.[i + 1][1] == '' ? '该指令无描述' : commands[i + 1]?.[1]}</div></div>)
      }
      if (i + 2 < commands.length) {
        items.push(<div style={item_style1}>{commands[i + 2][0]}<div style={item_style2}>{commands[i + 2]?.[1] == '' ? '该指令无描述' : commands[i + 2]?.[1]}</div></div>)
      }
      _y += 140
      y += 170

    }
    const items_style = `width: ${1200}px;height: ${_y + 120}px;background:${await getRandomColor(theme_color)};position: relative;left:40px;top:40px;border-radius: 2rem 2rem 2rem 2rem;padding:20px;opacity:0.6`
    const item_style = `width:${400}px;height:${80}px;text-align: center;font: small-caps bold 80px/1 sans-serif;border-radius: 2rem 2rem 2rem 2rem;align-self: center;padding:30px;`
    const bg_style = `width: ${1000}px;height: ${_y}px;display:grid;grid-template-columns: 370px 370px 370px;border-radius: 2rem 2rem 2rem 2rem;padding:10px;`
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
  const html_style = `width:${1300}px;height:${y + 220}px;align-items: center;;background-image:url(${backgroundImage});background-size: cover;background-repeat: no-repeat`
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
  meme: '趣味交互',
  media: '资讯服务',
  unknown: '未知'
}


function calculateColorBrightness(r: number, g: number, b: number) {
  // 计算亮度
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness;
}