import CanvasService, { Image } from "@koishijs/canvas";
import ImageCache from "../service/jgameImageCache";
import { CanvasRenderingContext2D } from "@koishijs/canvas";
import path from "path";
import { readFileSync } from "fs";
import { ExploitList, PieceList, TFTBattleListResponse } from "../types/response/TFTBattleList";
import { TFTBasicInfoResponse } from "../types/response/TFTBasicInfo";
import { TFTBattleStatEntryResponse } from "../types/response/TFTBattleStatEntry";

const isDev = process.env.NODE_ENV === 'development';
const resourcesPath = isDev ? path.resolve(__dirname, '../../assets') : path.resolve(__dirname, '../assets');
const HONOR_SILK_BLOOD_BUFFER = readFileSync(path.resolve(resourcesPath, 'honor_jk_win_silk_blood.png'));
const HONOR_TOP4_BUFFER = readFileSync(path.resolve(resourcesPath, 'honor_jk_top4.png'));
const HONOR_TOP_BUFFER = readFileSync(path.resolve(resourcesPath, 'honor_tft_top.png'));

let honorTopImage: Image | null = null;
let honorTop4Image: Image | null = null;
let honorSilkBloodImage: Image | null = null;

export async function renderTFT(data: TFTBattleListResponse, canvasService: CanvasService, imageCache: ImageCache, basicInfo: TFTBasicInfoResponse, battleStatEntry: TFTBattleStatEntryResponse): Promise<Buffer> {
  if (!honorTopImage) {
    honorTopImage = await canvasService.loadImage(HONOR_TOP_BUFFER);
  }
  if (!honorTop4Image) {
    honorTop4Image = await canvasService.loadImage(HONOR_TOP4_BUFFER);
  }
  if (!honorSilkBloodImage) {
    honorSilkBloodImage = await canvasService.loadImage(HONOR_SILK_BLOOD_BUFFER);
  }
  const battles = data.data.exploit_list || [];
  const width = 1050;
  const battleListY = 120 + 360; // 调整用户信息区域空间
  let height = battleListY; // 调整用户信息区域空间
  const cardHeight = 170; // 每个战斗卡片高度
  height += battles.length * cardHeight;
  for (const battle of battles) {
    if (battle.specific_user_exploit.piece_list.length > 10) {
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
  await drawHeader(ctx);

  const userInfoY = 120;
  // 绘制用户信息区域
  await drawUserInfo(ctx, userInfoY, basicInfo, battleStatEntry, imageCache);


  // 绘制统计信息
  const statsY = 390; // 调整统计信息位置
  await drawStats(ctx, battles, statsY); // 120

  // 绘制战斗记录列表
  let currentY = statsY + 100; // 从统计信息下方开始绘制
  for (const battle of battles) {
    await drawBattleCard(ctx, canvasService, battle, currentY, imageCache);
    if (battle.specific_user_exploit.piece_list.length > 10) {
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
async function drawHeader(ctx: CanvasRenderingContext2D): Promise<void> {
  // 绘制头部背景
  const headerGradient = ctx.createLinearGradient(0, 40, 0, 140);
  headerGradient.addColorStop(0, 'rgba(255,255,255,0.08)');
  headerGradient.addColorStop(1, 'rgba(255,255,255,0.05)');

  // 绘制标题
  ctx.fillStyle = '#4c8cff';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🏆 云顶记录', 525, 90);
}

// 绘制用户信息区域
async function drawUserInfo(ctx: CanvasRenderingContext2D, userInfoY: number, basicInfo: TFTBasicInfoResponse, battleStatEntry: TFTBattleStatEntryResponse, imageCache: ImageCache): Promise<void> {
  const userInfo = basicInfo.data;
  const statsInfo = battleStatEntry.data;

  // 绘制用户信息背景
  const userInfoBg = ctx.createLinearGradient(0, 120, 0, 340);
  userInfoBg.addColorStop(0, 'rgba(255,255,255,0.05)');
  userInfoBg.addColorStop(1, 'rgba(255,255,255,0.02)');
  ctx.fillStyle = userInfoBg;
  ctx.beginPath();
  ctx.roundRect(30, userInfoY, 990, 250, 15); // 调整高度
  ctx.fill();

  // 绘制边框
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 绘制用户头像
  const avatarImage = await imageCache.fetchImage(userInfo.icon_url);
  ctx.save();
  ctx.beginPath();
  ctx.arc(120, userInfoY + 80, 50, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(avatarImage, 70, userInfoY + 30, 100, 100);
  ctx.restore();

  // 头像边框
  ctx.strokeStyle = '#4c8cff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(120, userInfoY + 80, 50, 0, Math.PI * 2);
  ctx.stroke();

  // 绘制用户昵称
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(userInfo.nickname, 200, userInfoY + 55);

  // 绘制服务器信息
  ctx.fillStyle = '#aaa';
  ctx.font = '16px Arial';
  ctx.fillText(`${userInfo.area_name} | Lv${userInfo.level} | ${userInfo.tier}`, 200, userInfoY + 80);

  let rankX = 500
  let rankTxetBias = 280
  // 绘制段位图标
  if (statsInfo.game_rank?.rank_url) {
    const rankImage = await imageCache.fetchImage(statsInfo.game_rank.rank_url);
    ctx.drawImage(rankImage, rankX, userInfoY, 240, 240);
  }

  // 绘制段位信息
  ctx.fillStyle = '#4c8cff';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(statsInfo.game_rank?.full_rank_title || userInfo.tier, rankX + rankTxetBias, 240);

  // 绘制进度条区域
  const totalGames = statsInfo.stat?.total || 0;
  const top1Count = statsInfo.stat?.top1 || 0;
  const top4Count = statsInfo.stat?.top4 || 0;
  const winRate = totalGames > 0 ? (top1Count / totalGames * 100) : 0;
  const topFourRate = totalGames > 0 ? (top4Count / totalGames * 100) : 0;

  // 绘制总战绩统计
  ctx.fillStyle = '#fff';
  ctx.font = '24px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`共${totalGames}场`, rankX + rankTxetBias, userInfoY + 160);  // 绘制成就徽章

  // 合并进度条
  const progressBarX = 50;
  const progressBarY = userInfoY + 190;
  const progressBarWidth = 420;
  const progressBarHeight = 16; // 增加高度以便更好地显示

  // 进度条标签
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('胜率统计', progressBarX, progressBarY - 8);

  // 右侧显示百分比
  ctx.textAlign = 'right';
  ctx.fillText(`前四率 ${topFourRate.toFixed(1)}%  第一名率 ${winRate.toFixed(1)}%`, progressBarX + progressBarWidth, progressBarY + 38);

  // 绘制进度条背景
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.roundRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight, 15);
  ctx.fill();

  // 先绘制前四率（底层，蓝色）
  const topFourRateFillWidth = (topFourRate / 100) * progressBarWidth;
  const topFourRateGradient = ctx.createLinearGradient(progressBarX, progressBarY, progressBarX + topFourRateFillWidth, progressBarY);
  topFourRateGradient.addColorStop(0, '#4c8cff');
  topFourRateGradient.addColorStop(1, '#6aa3ff');
  ctx.fillStyle = topFourRateGradient;
  ctx.beginPath();
  ctx.roundRect(progressBarX, progressBarY, topFourRateFillWidth, progressBarHeight, 15);
  ctx.fill();

  // 再绘制第一名率（覆盖层，金色）
  const winRateFillWidth = (winRate / 100) * progressBarWidth;
  const winRateGradient = ctx.createLinearGradient(progressBarX, progressBarY, progressBarX + winRateFillWidth, progressBarY);
  winRateGradient.addColorStop(0, '#FFD700');
  winRateGradient.addColorStop(1, '#FFA500');
  ctx.fillStyle = winRateGradient;
  ctx.beginPath();
  ctx.roundRect(progressBarX, progressBarY, winRateFillWidth, progressBarHeight, 15);
  ctx.fill();

  // 绘制进度条边框
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight, 15);
  ctx.stroke();

  // 添加图例
  const legendY = progressBarY + progressBarHeight + 10;

  // 前四率图例
  ctx.fillStyle = '#6aa3ff';
  ctx.beginPath();
  ctx.roundRect(progressBarX, legendY, 15, 15, 3);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('前四率', progressBarX + 25, legendY + 12);

  // 第一名率图例
  ctx.fillStyle = '#FFA500';
  ctx.beginPath();
  ctx.roundRect(progressBarX + 100, legendY, 15, 15, 3);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '12px Arial';
  ctx.fillText('第一名率', progressBarX + 125, legendY + 12);

  // 绘制徽章统计
  if (statsInfo.badge_list && statsInfo.badge_list.length > 0) {
    let badgeStatsX = 520; // 调整到右侧，与进度条平行
    const badgeStatsY = userInfoY + 130; // 调整高度

    for (const badge of statsInfo.badge_list) {
      let continued = 0
      if (badge.badge_id === 1201) {
        ctx.drawImage(honorTopImage, badgeStatsX, badgeStatsY, 80, 80); // 稍微缩小
        continued = 1
      } else if (badge.badge_id === 1202) {
        ctx.drawImage(honorTop4Image, badgeStatsX, badgeStatsY, 80, 80);
        continued = 1
      } else if (badge.badge_id === 1207) {
        ctx.drawImage(honorSilkBloodImage, badgeStatsX, badgeStatsY, 80, 80);
        continued = 1
      }
      if (continued) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(badge.count + '次', badgeStatsX + 40, badgeStatsY + 68);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(badge.name, badgeStatsX + 40, badgeStatsY + 100);
        badgeStatsX += 160; // 缩小间距
      }
    }
  }
}

// 绘制统计信息
async function drawStats(ctx: CanvasRenderingContext2D, battles: ExploitList[], startY: number = 120): Promise<void> {
  const totalGames = battles.length;
  const firstPlaces = battles.filter(b => b.specific_user_exploit.ranking === 1).length;
  const topFour = battles.filter(b => b.specific_user_exploit.ranking <= 4).length;
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
async function drawBattleCard(ctx: CanvasRenderingContext2D, canvasService: CanvasService, battle: ExploitList, y: number, imageCache: ImageCache): Promise<void> {
  const user = battle.specific_user_exploit;
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
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(battle.game_match_type_name, 980, y + 40);

  ctx.fillStyle = '#aaa';
  ctx.font = '18px Arial';
  ctx.fillText(formatTime(battle.end_time), 980, y + 70);

  // if (battle.tag_url) {
  //   const tagImage = await imageCache.fetchImage(battle.tag_url);
  //   ctx.drawImage(tagImage, 835, y + 90, 144, 40);
  // }

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
    const image = await imageCache.fetchImage(piece.picture);
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
      if (!piece.equips) break;
      if (j < piece.equips.length) {
        // 有装备 - 绘制占位框
        const equipImage = await imageCache.fetchImage(piece.equips[j].equip_img);
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
