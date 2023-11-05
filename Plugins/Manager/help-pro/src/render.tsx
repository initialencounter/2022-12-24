import type { } from '@koishijs/canvas'
import { Session, Element, Context, Dict } from 'koishi'
import { PluginGrid } from '.'
export async function render(
  commands: (string | number)[][],
  session: Session,
  theme:string
): Promise<Element> {
  const theme_color = parseColor(theme)
  const width = 14 * 220 + 5 * (commands.length + 1)
  const height = commands.length * 105 + 5 * (commands.length + 1)
  return await session.app.canvas.render(width, height, async (ctx) => {
    // Set background color to white
    ctx.fillStyle = '#594991'
    ctx.fillRect(0, 0, width, height)
    // Draw centered header
    ctx.font = 'bold 146px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = theme
    ctx.fillText(
      '指令列表',
      width / 2,
      68 / 2 + 60,
    )

    let y = 92 + 20 * 2 + 80
    let x = 72 + 20 * 2
    let x2 = x + 620 + 770 + 140
    for (let i = 0; i < commands.length; i += 2) {
      ctx.fillStyle = await getRandomColor(theme_color);
      ctx.fillRect(x, y, 600, 160)
      ctx.fillStyle = await getRandomColor(theme_color);
      ctx.fillRect(x + 600 + 20, y, 770, 160)
      ctx.fillStyle = await getRandomColor(theme_color);
      ctx.fillRect(x2, y, 600, 160)
      ctx.fillStyle = await getRandomColor(theme_color);
      ctx.fillRect(x2 + 600 + 20, y, 770, 160)

      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 130px serif'
      ctx.textAlign = 'left'
      ctx.fillText((commands[i][0] as string), x + 40, y + 85)
      ctx.fillText(i + 1 < commands.length ? (commands[i + 1][0] as string) : '', x2 + 40, y + 85)

      ctx.font = 'bold 80px serif'
      ctx.fillText(commands[i][1] as string, x + 600 + 20 + 40, y + 85)
      ctx.fillText(i + 1 < commands.length ? (commands[i + 1][1] as string) : '', x2 + 600 + 20 + 40, y + 85)
      y += 180
    }
  })
}
function parseColor(color:string){
  color = color.slice(5,-1)
  return color.split(', ').map((v)=>{return parseInt(v)})
}
async function getRandomColor(theme_color:number[]) {
  // 生成随机的十六进制颜色代码
  const randomColorRed = () => (Math.floor(Math.random() * 20) + theme_color[0]).toString(16).padStart(2, '0');
  const randomColorGreen = () => (Math.floor(Math.random() * 100) + theme_color[1]).toString(16).padStart(2, '0');
  const randomColorBlue = () => (Math.floor(Math.random() * 100) + theme_color[2]).toString(16).padStart(2, '0');

  let color = `#${randomColorRed()}${randomColorGreen()}${randomColorBlue()}`;
  return color;
}
async function getRandomColor2(theme_color:number[]) {
  // 生成随机的十六进制颜色代码
  const randomColorRed = () => (Math.floor(Math.random() * 50) + theme_color[0]).toString(16).padStart(2, '0');
  const randomColorGreen = () => (Math.floor(Math.random() * 50) + theme_color[1]).toString(16).padStart(2, '0');
  const randomColorBlue = () => (Math.floor(Math.random() * 50) + theme_color[2]).toString(16).padStart(2, '0');

  let color = `#${randomColorRed()}${randomColorGreen()}${randomColorBlue()}`;
  return color;
}

export async function render2(
  pluginGrid: PluginGrid,
  theme: string,
): Promise<Element> {
  const theme_color = parseColor(theme)
  const imgs: Element[] = []
  let y = 0
  for (var [keys, commands] of Object.entries(pluginGrid)) {
    if (!commands.length) {
      continue
    }

    // Set background color to white
    const items = []
    const bgc = await getRandomColor2(theme_color)
    let _y = 0
    y += 140
    for (let i = 0; i < commands.length; i += 3) {

      const item_style1 = `width:${350}px;height:${120}px;background:${bgc};text-align: center;font-size: 70px;border-radius: 2rem 2rem 2rem 2rem`
      const item_style2 = `text-align: center;font-size:25px;position:relative;top:0px`
      items.push(<div style={item_style1}>{commands[i][0]}<div style={item_style2}>{commands[i][1]}</div></div>)
      if (i + 1 < commands.length) {
        items.push(<div style={item_style1}>{commands[i + 1][0]}<div style={item_style2}>{commands[i + 1][1]}</div></div>)
      }
      if (i + 2 < commands.length) {
        items.push(<div style={item_style1}>{commands[i + 2][0]}<div style={item_style2}>{commands[i + 2][1]}</div></div>)
      }

      _y += 140
      y += 170

    }
    const items_style = `width: ${1200}px;height: ${_y + 120}px;background:${await getRandomColor2(theme_color)};position: relative;left:40px;top:40px;border-radius: 2rem 2rem 2rem 2rem;padding:20px`
    const item_style = `width:${400}px;height:${80}px;text-align: center;font: small-caps bold 80px/1 sans-serif;border-radius: 2rem 2rem 2rem 2rem;align-self: center;padding:30px`
    const bg_style = `width: ${1000}px;height: ${_y}px;display:grid;grid-template-columns: 370px 370px 370px;border-radius: 2rem 2rem 2rem 2rem;padding:10px`

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
  const html_style = `width:${1300}px;height:${y + 220}px;background:#32ca8e;align-items: center;`
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