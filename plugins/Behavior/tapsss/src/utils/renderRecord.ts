import { DailyStarResponse } from "../types/response/DailyStar";
import { readFileSync } from "fs";
import CanvasService, { Image } from "@koishijs/canvas";
import path from "path";
import { TIMING_LEVELS_COLOR, TIMING_LEVELS_MAP, TIMING_LEVELS_TEXT_COLOR } from "./renderPost";

const isDev = process.env.NODE_ENV === 'development';
const resourcesPath = isDev ? path.resolve(__dirname, '../../assets') : path.resolve(__dirname, '../assets');
const defaultMineTheme: Buffer[] = []
for (let i = 0; i <= 9; i++) {
  defaultMineTheme[i] = readFileSync(path.resolve(resourcesPath, `theme/wom/type${i}.png`));
}

// 缓存加载的图片
let loadedMineThemeImages: Image[] = [];

export async function render(data: DailyStarResponse["data"], canvasService: CanvasService, avatar: Image): Promise<Buffer> {
  // 预加载图片
  await preloadImages(canvasService);
  const width = 800;
  const height = 950; // 减少总高度
  const canvas = await canvasService.createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 设置背景
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, height);

  // 绘制主容器背景
  ctx.beginPath();
  ctx.fillStyle = 'white';
  ctx.roundRect(40, 40, canvas.width - 80, height - 80, 20);
  ctx.fill();

  // 绘制用户信息和标题在同一行
  //@ts-ignore
  await drawHeader(ctx, 370, 60); // 标题放在用户信息右侧
  //@ts-ignore
  await drawUserInfo(ctx, data, avatar, 40, 60);

  // 绘制统计数据
  //@ts-ignore
  drawStats(ctx, data, 40, 180);

  // 绘制游戏信息
  //@ts-ignore
  await drawGameInfo(ctx, data, canvasService, 40, 510);

  return canvas.toBuffer('image/png');
}

async function preloadImages(canvasService: CanvasService) {
  // 只在第一次调用时加载图片
  if (loadedMineThemeImages.length === 0) {
    loadedMineThemeImages = [];
    for (let i = 0; i <= 9; i++) {
      loadedMineThemeImages[i] = await canvasService.loadImage(defaultMineTheme[i]);
    }
  }
}

async function drawHeader(ctx: CanvasRenderingContext2D, baseX: number, baseY: number) {
  const headerGradient = ctx.createLinearGradient(baseX, baseY, baseX + 350, baseY + 120);
  headerGradient.addColorStop(0.3, '#FA7299');
  headerGradient.addColorStop(0.6, '#FEB47B');
  ctx.beginPath();
  ctx.fillStyle = headerGradient;
  ctx.roundRect(70, baseY, 660, 110, 15);
  ctx.fill();

  // 标题
  ctx.fillStyle = 'white';
  ctx.font = 'bold 38px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🌟 今日之星 🌟', baseX + 175, baseY + 55);

  // 副标题
  ctx.font = '20px Arial, sans-serif';
  ctx.fillText('Daily Star Player', baseX + 175, baseY + 90);
}

async function drawUserInfo(ctx: CanvasRenderingContext2D, data: DailyStarResponse["data"], avatarImg: Image, baseX: number, baseY: number) {
  // 头像
  ctx.save();
  ctx.beginPath();
  ctx.arc(baseX + 90, baseY + 55, 40, 0, Math.PI * 2);
  ctx.clip();
  // @ts-ignore
  ctx.drawImage(avatarImg, baseX + 50, baseY + 15, 80, 80);
  ctx.restore();

  // 头像边框
  ctx.strokeStyle = '#4ECDC4';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(baseX + 90, baseY + 55, 40, 0, Math.PI * 2);
  ctx.stroke();

  // 用户详情
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(data.user.nickName, baseX + 150, baseY + 35);

  ctx.fillStyle = '#2c3e50';
  ctx.font = '16px Arial, sans-serif';
  ctx.fillText(`UID: ${data.user.uid}`, baseX + 150, baseY + 60);

  // 排名徽章
  const { timingLevel, timingRank } = data.user;
  // 绘制等级标签
  const levelIndex = timingLevel == -1 ? 0 : timingLevel;
  const levelText = TIMING_LEVELS_MAP[levelIndex];
  const levelColor = TIMING_LEVELS_COLOR[levelIndex];
  const textColor = TIMING_LEVELS_TEXT_COLOR[levelIndex] || '#FFFFFF';

  const rankText = timingRank == 1 ? '雷帝' : `${levelText} ${timingRank <= 300 ? timingRank : ''}`
  if (levelIndex < TIMING_LEVELS_MAP.length) {
    ctx.beginPath();
    ctx.fillStyle = levelColor;
    ctx.roundRect(baseX + 150, baseY + 71, 80, 25, 12);
    ctx.fill();
    ctx.fillStyle = textColor;
    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(rankText, baseX + 190, baseY + 90);
    ctx.textAlign = 'left';
  }
}

function drawStats(ctx: CanvasRenderingContext2D, data: DailyStarResponse["data"], baseX: number, baseY: number) {
  const containerWidth = 660;
  const containerHeight = 280;

  // 主容器背景
  ctx.beginPath();
  ctx.fillStyle = '#f8f9fa';
  ctx.roundRect(baseX + 30, baseY, containerWidth, containerHeight, 15);
  ctx.fill();

  // 标题区域
  const titleGradient = ctx.createLinearGradient(baseX + 30, baseY, baseX + 690, baseY + 50);
  titleGradient.addColorStop(0, '#667eea');
  titleGradient.addColorStop(1, '#764ba2');
  ctx.beginPath();
  ctx.fillStyle = titleGradient;
  ctx.roundRect(baseX + 30, baseY, containerWidth, 50, [15, 15, 0, 0]);
  ctx.fill();

  // 标题文字
  ctx.fillStyle = 'white';
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('📊 成绩', baseX + 360, baseY + 30);

  // 内容区域背景
  const boardGradient = ctx.createLinearGradient(baseX + 30, baseY + 50, baseX + 690, baseY + 230);
  boardGradient.addColorStop(0, '#7cffdcff');
  boardGradient.addColorStop(1, '#a24b88ff');
  ctx.beginPath();
  ctx.fillStyle = boardGradient;
  ctx.roundRect(baseX + 30, baseY + 50, containerWidth, 250, [0, 0, 15, 15]);
  ctx.fill();

  const stats = [
    { label: '用时', value: `${(data.time / 1000).toFixed(3)}s`, color: '#F7DC6F', icon: '⏰' },
    { label: '3BV/s', value: data.bvs.toString(), color: '#4ECDC4', icon: '⚡' },
    { label: '3BV', value: data.bv.toString(), color: '#FF6B6B', icon: '🎯' },
    { label: '效率', value: (data.bv / data.tap).toFixed(3), color: '#FFEAA7', icon: '📈' },
    { label: '实际点击', value: data.tap.toString(), color: '#45B7D1', icon: '👆' },
    { label: '有效点击', value: data.effectiveTap.toString(), color: '#96CEB4', icon: '✅' },
    { label: 'CES', value: (data.effectiveTap / (data.time / 1000)).toFixed(3), color: '#98D8C8', icon: '⏱️' },
    { label: 'STNB', value: compute(3, data.time / 1000, data.bvs), color: '#DDA0DD', icon: '🏆' },
  ];

  // 主要统计数据 - 大卡片（前4个）
  const mainCardWidth = 130;
  const mainCardHeight = 80;
  const mainGap = 20;

  for (let i = 0; i < 4; i++) {
    const stat = stats[i];
    const x = baseX + 60 + i * (mainCardWidth + mainGap);
    const y = baseY + 70;

    // 卡片阴影
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.roundRect(x + 2, y + 2, mainCardWidth, mainCardHeight, 12);
    ctx.fill();

    // 卡片背景
    ctx.beginPath();
    ctx.fillStyle = 'white';
    ctx.roundRect(x, y, mainCardWidth, mainCardHeight, 12);
    ctx.fill();

    // 左侧彩色条
    ctx.beginPath();
    ctx.fillStyle = stat.color;
    ctx.roundRect(x, y, 6, mainCardHeight, [12, 0, 0, 12]);
    ctx.fill();

    // 图标
    ctx.fillStyle = stat.color;
    ctx.font = '20px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(stat.icon, x + 15, y + 30);

    // 标签
    ctx.fillStyle = '#7f8c8d';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText(stat.label, x + 45, y + 20);

    // 值
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(stat.value, x + mainCardWidth - 10, y + 50);
  }

  // 次要统计数据 - 小卡片（后4个）
  const subCardWidth = 120;
  const subCardHeight = 70;
  const subGap = 30;

  for (let i = 4; i < 8; i++) {
    const stat = stats[i];
    const x = baseX + 90 + (i - 4) * (subCardWidth + subGap);
    const y = baseY + 170;

    // 卡片背景
    ctx.beginPath();
    ctx.fillStyle = 'white';
    ctx.roundRect(x, y, subCardWidth, subCardHeight, 10);
    ctx.fill();

    // 顶部彩色条
    ctx.beginPath();
    ctx.fillStyle = stat.color;
    ctx.roundRect(x, y, subCardWidth, 4, [10, 10, 0, 0]);
    ctx.fill();

    // 图标和标签
    ctx.fillStyle = stat.color;
    ctx.font = '16px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(stat.icon, x + 10, y + 25);

    ctx.fillStyle = '#7f8c8d';
    ctx.font = '11px Arial, sans-serif';
    ctx.fillText(stat.label, x + 35, y + 25);

    // 值
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(stat.value, x + subCardWidth / 2, y + 55);
  }

  // 底部排名信息
  const rankY = baseY + 260;
  const rankBadgeWidth = 120;
  const rankBadgeHeight = 25;

  // 录像排名徽章
  ctx.beginPath();
  const rankGradient = ctx.createLinearGradient(baseX + 55, rankY, baseX + 175, rankY);
  rankGradient.addColorStop(0, '#FF6B6B');
  rankGradient.addColorStop(1, '#FF8E53');
  ctx.fillStyle = rankGradient;
  ctx.roundRect(baseX + 55, rankY, rankBadgeWidth, rankBadgeHeight, 12);
  ctx.fill();

  ctx.fillStyle = 'white';
  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`录像排名 #${data.rank}`, baseX + 115, rankY + 17);

  // 超越玩家徽章
  ctx.beginPath();
  const percentGradient = ctx.createLinearGradient(baseX + 210, rankY, baseX + 350, rankY);
  percentGradient.addColorStop(0, '#4ECDC4');
  percentGradient.addColorStop(1, '#44A08D');
  ctx.fillStyle = percentGradient;
  ctx.roundRect(baseX + 210, rankY, rankBadgeWidth + 20, rankBadgeHeight, 12);
  ctx.fill();

  ctx.fillStyle = 'white';
  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`超越 ${(data.rankPercent * 100).toFixed(1)}% 玩家`, baseX + 270, rankY + 17);
}

async function drawGameInfo(ctx: CanvasRenderingContext2D, data: DailyStarResponse["data"], canvasService: CanvasService, baseX: number, baseY: number) {
  // 游戏信息背景
  ctx.beginPath();
  ctx.fillStyle = '#b6ccd2ff';
  ctx.roundRect(baseX + 30, baseY, 660, 380, 15);
  ctx.fill();

  // 绘制地图
  await drawMineMap(ctx, data.map, data.row, data.column, baseX + 60, baseY + 30);
}

async function drawMineMap(ctx: CanvasRenderingContext2D, mapString: string, row: number, column: number, offsetX: number, offsetY: number) {
  const rows = mapString.split('-')
  if (row > column) {
    // 地图是纵向的，需要转换为横向
    const list: string[][] = [];
    for (let i = 0; i < column; i++) {
      const tmpList: string[] = []
      for (let j = 0; j < row; j++) {
        tmpList.push('');
      }
      list.push(tmpList);
    }
    for (let c = 0; c < column; c++) {
      for (let r = 0; r < row; r++) {
        list[c][r] = rows[r][Math.abs(column - 1 - c)];
      }
    }
    mapString = list.map(row => row.join('')).join('-');
    const tmp = row;
    row = column;
    column = tmp; // 更新列数
  }
  mapString = mapString.replace(/-/g, ''); // 移除连字符
  const cellSize = 20;

  // 地图背景
  ctx.beginPath();
  ctx.fillStyle = '#adb5bd';
  ctx.roundRect(offsetX, offsetY, column * cellSize, row * cellSize, 4);
  ctx.fill();

  let index = 0;
  for (let r = 0; r < row; r++) {
    for (let c = 0; c < column; c++) {
      const cell = mapString[index] || '0';
      const cellValue = cell === '9' ? 9 : parseInt(cell);

      try {
        // 使用预加载的图片
        const cellImg = loadedMineThemeImages[cellValue];
        // @ts-ignore
        ctx.drawImage(cellImg, offsetX + c * cellSize, offsetY + r * cellSize, cellSize, cellSize);
      } catch (error) {
        // 如果图片加载失败，绘制默认方块
        ctx.fillStyle = cellValue === 9 ? '#ff0000' : '#cccccc';
        ctx.fillRect(offsetX + c * cellSize, offsetY + r * cellSize, cellSize, cellSize);
      }

      index++;
    }
  }

  // 绘制地图边框
  ctx.strokeStyle = '#808080';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(offsetX, offsetY, column * cellSize, row * cellSize, 4);
  ctx.stroke();
}

function compute(mode: number, time: number, bvs: number) {
  var cont: number = 435.001
  if (mode == 1) {
    cont = 47.229
  }
  if (mode == 2) {
    cont = 153.73
  }
  const st: number = cont / ((time ** 1.7) / (time * bvs))
  return st.toFixed(3)
}


// import { gunzipSync } from 'zlib';
// import { Buffer } from 'buffer';

// function decompressBase64GzipNode(base64String: string): string {
//     const buffer = Buffer.from(base64String, 'base64');
//     const decompressed = gunzipSync(buffer);
//     return decompressed.toString('utf8');
// }


// async function exampleUsage() {
//     try {
//         // 假设这是一个 Base64 编码的 Gzip 字符串
//         const compressedBase64 = 'data.data.handle';

//         const decompressed = decompressBase64GzipNode(compressedBase64);
//         console.log("解压结果:", decompressed);
//     } catch (error) {
//         console.error("解压过程中出错:", error);
//     }
// }
//         const decompressed = decompressBase64GzipNode(compressedBase64);
//         console.log("解压结果:", decompressed);
//     } catch (error) {
//         console.error("解压过程中出错:", error);
//     }
// }
//     }
// }

