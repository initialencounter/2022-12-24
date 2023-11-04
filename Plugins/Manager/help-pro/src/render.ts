import type { } from '@koishijs/canvas'
import { Session, Element, Context, Dict } from 'koishi'
export async function render(
  commands: (string | number)[][],
  session: Session,
): Promise<Element> {
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
    ctx.fillStyle = '#000'
    ctx.fillText(
      '指令列表',
      width / 2,
      68 / 2 + 60,
    )

    let y = 92 + 20 * 2 + 80
    let x = 72 + 20 * 2
    let x2 = x + 620 + 770 + 140
    for (let i = 0; i < commands.length; i += 2) {
      ctx.fillStyle = await getRandomColor();
      ctx.fillRect(x, y, 600, 160)
      ctx.fillStyle = await getRandomColor();
      ctx.fillRect(x + 600 + 20, y, 770, 160)
      ctx.fillStyle = await getRandomColor();
      ctx.fillRect(x2, y, 600, 160)
      ctx.fillStyle = await getRandomColor();
      ctx.fillRect(x2 + 600 + 20, y, 770, 160)

      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 130px serif'
      ctx.textAlign = 'left'
      ctx.fillText((commands[i][0] as string), x + 40, y + 85)
      ctx.fillText(i + 1 < commands.length ? (commands[i + 1][0] as string): '', x2 + 40, y + 85)

      ctx.font = 'bold 80px serif'
      ctx.fillText(commands[i][1] as string, x + 600 + 20 + 40, y + 85)
      ctx.fillText(i + 1 < commands.length ? (commands[i + 1][1] as string) : '', x2 + 600 + 20 + 40, y + 85)
      y += 180
    }
  })
}

async function getRandomColor() {
  // 生成随机的十六进制颜色代码
  const randomColorRed = () => (Math.floor(Math.random() * 20) + 74).toString(16).padStart(2, '0');
  const randomColorGreen = () => (Math.floor(Math.random() * 100) + 59).toString(16).padStart(2, '0');
  const randomColorBlue = () => (Math.floor(Math.random() * 100) + 152).toString(16).padStart(2, '0');

  let color = `#${randomColorRed()}${randomColorGreen()}${randomColorBlue()}`;
  return color;
}
