import CanvasService, { Image } from "@koishijs/canvas";
import { BattleList, BattleListElement, PieceList } from "../types/index";
import ImageCache from "../service/jgameImageCache";
import { CanvasRenderingContext2D } from "@koishijs/canvas";

export async function render(data: BattleList, canvasService: CanvasService, imageCache: ImageCache): Promise<Buffer> {
  const battles = data.data.battle_list || [];
  const width = 1050;
  let height = 250; // 增加头部空间
  const cardHeight = 170; // 每个战斗卡片高度
  height += battles.length * cardHeight;
  for (const battle of battles) {
    if (battle.specific_user_battle.piece_list.length > 10) {
      height += 130; // 每行10个棋子，超过部分增加高度
    }
  }
  const canvas = await canvasService.createCanvas(width, height);
  const ctx: CanvasRenderingContext2D = canvas.getContext('2d');

  // 设置背景 - 参考 joc.js 中的渐变背景
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#1e1e2e');
  gradient.addColorStop(1, '#0f0f1a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, height);

  // 绘制标题区域
  await drawHeader(ctx, canvasService, battles);

  // 绘制统计信息
  await drawStats(ctx, battles);

  // 绘制战斗记录列表
  let currentY = 250;
  for (const battle of battles) {
    await drawBattleCard(ctx, canvasService, battle, currentY, imageCache);
    if (battle.specific_user_battle.piece_list.length > 10) {
      currentY += 130; // 每行10个棋子，超过部分增加高度
    }
    currentY += cardHeight;
  }

  return canvas.toBuffer('image/png');
}

// 格式化时间
function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString().slice(0, 19);
}

// 获取排名颜色
function getRankingColor(ranking: number): string {
  const COLORS = ['#DCA521', '#7996B2', '#AA6E56', '#95A3AD']
  if (ranking <= 4) return COLORS[ranking - 1]; // 银色
  return '#FFFFFF00'; // 透明
}

// 绘制标题区域
async function drawHeader(ctx: CanvasRenderingContext2D, canvasService: CanvasService, battles: BattleListElement[]): Promise<void> {
  // 绘制头部背景
  const headerGradient = ctx.createLinearGradient(0, 40, 0, 140);
  headerGradient.addColorStop(0, 'rgba(255,255,255,0.08)');
  headerGradient.addColorStop(1, 'rgba(255,255,255,0.05)');

  // 绘制标题
  ctx.fillStyle = '#4c8cff';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🏆 铲铲记录', 525, 90);
}

// 绘制统计信息
async function drawStats(ctx: CanvasRenderingContext2D, battles: BattleListElement[]): Promise<void> {
  const totalGames = battles.length;
  const firstPlaces = battles.filter(b => b.specific_user_battle.ranking === 1).length;
  const topFour = battles.filter(b => b.specific_user_battle.ranking <= 4).length;
  const topFourRate = totalGames > 0 ? (topFour / totalGames * 100).toFixed(1) : '0';

  const stats = [
    { label: '总对局数', value: totalGames.toString() },
    { label: '吃鸡次数', value: firstPlaces.toString() },
    { label: '前四次数', value: topFour.toString() },
    { label: '前四率', value: `${topFourRate}%` }
  ];

  const cardWidth = 200;
  const cardHeight = 95;
  const gap = 42.5;
  const startX = 30 + gap;
  const startY = 120;

  stats.forEach((stat, index) => {
    const x = startX + index * (cardWidth + gap);

    // 绘制统计卡片背景
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.roundRect(x, startY, cardWidth, cardHeight, 12);
    ctx.fill();

    // 绘制边框
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 绘制数值
    ctx.fillStyle = '#4c8cff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(stat.value, x + cardWidth / 2, startY + 45);

    // 绘制标签
    ctx.fillStyle = '#ccc';
    ctx.font = '18px Arial';
    ctx.fillText(stat.label, x + cardWidth / 2, startY + 75);
  });
}

// 绘制单个战斗卡片
async function drawBattleCard(ctx: CanvasRenderingContext2D, canvasService: CanvasService, battle: BattleListElement, y: number, imageCache: ImageCache): Promise<void> {
  const user = battle.specific_user_battle;
  const pieces = user.piece_list.filter(p => p.hero_name);

  // 绘制排名
  const rankX = 45;
  const rankY = y + 28;
  const rankIconSize = 60;
  let rankingText = `#${user.ranking}`;
  let rankingTextColor = '#A1ADB6';
  if (user.ranking < 5) {
    const rankingColor = getRankingColor(user.ranking);
    drawShieldPentagon(ctx, rankingColor, rankX, rankY, rankIconSize, rankIconSize);
    rankingText = user.ranking.toString()
    rankingTextColor = '#fff';
  }
  ctx.fillStyle = rankingTextColor;
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(rankingText, rankX + rankIconSize / 2, rankY + 25 + rankIconSize / 2);


  // 绘制战斗信息
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(battle.game_match_type_name, 980, y + 40);

  ctx.fillStyle = '#aaa';
  ctx.font = '14px Arial';
  ctx.fillText(`(${battle.set_name})`, 980, y + 65);
  ctx.fillText(formatTime(battle.end_time), 980, y + 85);

  if (battle.tag_url) {
    const tagImage = await imageCache.fetchImage(battle.tag_url);
    ctx.drawImage(tagImage, 835, y + 90, 144, 40);
  }

  // 绘制棋子
  await drawPieces(ctx, pieces, 120, y + 20, imageCache);
}

// 绘制棋子网格
async function drawPieces(ctx: CanvasRenderingContext2D, pieces: PieceList[], startX: number, startY: number, imageCache: ImageCache): Promise<void> {
  const pieceWidth = 60;
  const pieceHeight = 100;
  const gap = 8;
  const maxPerRow = 10;

  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i];
    const row = Math.floor(i / maxPerRow);
    const col = i % maxPerRow;
    const x = startX + col * (pieceWidth + gap);
    const y = startY + row * (pieceHeight + gap + 20);

    // 绘制英雄头像
    const image = await imageCache.fetchImage(piece.full_picture);
    ctx.drawImage(image, x + 16, y + 8, 60, 60);

    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 绘制星级
    if (piece.star_num > 1) {
      ctx.fillStyle = piece.star_num == 3 ? '#FFD700' : '#C0C0C0'; // 金色或银色
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('★'.repeat(piece.star_num), x + 46, y + 3);
    }

    // 绘制英雄名称
    ctx.fillStyle = piece.price_color || '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    const heroName = piece.hero_name.length > 8 ? piece.hero_name.substring(0, 7) + '...' : piece.hero_name;
    ctx.fillText(heroName, x + 45, y + 85);

    // 绘制装备栏
    for (let j = 0; j < 3; j++) {
      const equipX = x + 16 + j * 22;
      const equipY = y + 90;

      if (j < piece.equip_list.length) {
        // 有装备 - 绘制占位框
        const equipImage = await imageCache.fetchImage(piece.equip_list[j].full_picture);
        ctx.drawImage(equipImage, equipX, equipY, 18, 18);
      }
    }
  }
}

function drawShieldPentagon(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, width: number, height: number) {
  ctx.beginPath();

  // 顶部尖点
  ctx.moveTo(x + width, y);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x + width * 0.5, y + height * 1.4);
  ctx.lineTo(x, y + height);
  ctx.lineTo(x, y);
  ctx.lineTo(x + width, y);

  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  // 明确确保没有描边
}
