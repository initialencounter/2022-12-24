import { Datum } from "../types/postList";
import CanvasService, { Image } from "@koishijs/canvas";
import ImageCache from "../service/imageCache";
import path from "path";
import { readFileSync } from "fs";

export const TIMING_LEVELS_MAP = [
  '雷帝', 'E', 'D',
  'C', 'B', 'A',
  'S', 'SS', 'SSS',
  '☆', '☆☆'
]
export const TIMING_LEVELS_COLOR = [
  '#DC281E', '#A3AFC2',
  '#607D8B', '#8BCA34',
  '#2196F3', '#673AB7',
  '#FF5722', '#FFBF00',
  '#FB7299', '#DC281E',
  '#DC281E'
]
export const TIMING_LEVELS_TEXT_COLOR = [
  '#FFFF00', '#FFFFFF',
  '#FFFFFF', '#FFFFFF',
  '#FFFFFF', '#FFFFFF',
  '#FFFFFF', '#FFFFFF',
  '#FFFFFF', '#FFFFFF',
  '#FFFFFF',
]

export const recordBgColor = ['#2A2124', '#202329', '#252525', '#292219', '#28261B'];
export const recordTextColor = ['#FB7299', '#5D9CEC', '#F15021', '#F18400', '#EEBF1D'];
const isDev = process.env.NODE_ENV === 'development';
const resourcesPath = isDev ? path.resolve(__dirname, '../../assets') : path.resolve(__dirname, '../assets');
const commentImageBuffer = readFileSync(path.resolve(resourcesPath, 'EQ.png'));
const goodImageBuffer = readFileSync(path.resolve(resourcesPath, 'vO.png'));
const recordIconsBuffer: Buffer[] = [null];
for (let i = 0; i < 5; i++) {
  const iconPath = path.resolve(resourcesPath, `icon/${i}.png`);
  recordIconsBuffer[i] = readFileSync(iconPath)
}
let recordIcons: Image[] | null = null;
let goodImage: Image | null = null;
let commentImage: Image | null = null;

export async function renderPost(post: Datum, canvasService: CanvasService, imageCache: ImageCache): Promise<Buffer> {
  if (!goodImage) {
    goodImage = await canvasService.loadImage(goodImageBuffer);
  }
  if (!commentImage) {
    commentImage = await canvasService.loadImage(commentImageBuffer);
  }
  if (!recordIcons) {
    recordIcons = await Promise.all(recordIconsBuffer.map(buffer => canvasService.loadImage(buffer)));
  }
  const { title, text, device, record, puzzleRecord, schulteRecord, tzfeRecord, nonoRecord, recordType, user: { avatar, nickName, timingLevel, timingRank, vip }, createTime, goodCount, commentCount, lastComment } = post;
  let height = 130 + 100; // 初始高度，包含头像和点赞评论
  if (title) height += 60 + 23; // 如果有标题，增加额外空间
  const tag = findHashWrappedStrings(text);
  if (tag.length > 0) height += (tag.join(' ').length > 24 ? 2 : 1) * 45 + 26; // 如果有标签，增加额外空间
  if (isIncludedImage(text)) height += 326 + 20; // 如果有图片，增加额外空间
  if (record.id) height += 138 + 33; // 如果有记录，增加额外空间
  const showText = removeHashWrappedStrings(removeImagesAndLinksFromMarkdown(text)).trim();
  if (showText) height += (showText.length > 24 ? 2 : 1) * 60 + 33; // 如果有正文内容，增加额外空间
  if (lastComment) height += 23 + 120 + ((Math.floor(lastComment.comment.length / 28) > 1) ? 110 : 55) // 计算最新评论的高度，假设每30个字符占55px高度
  const canvas = await canvasService.createCanvas(1080, height);
  const ctx = canvas.getContext('2d');

  // 设置背景
  ctx.fillStyle = '#1B1B1B';
  ctx.fillRect(0, 0, 1080, height);

  // 绘制用户头像
  const avatarX = 39;
  let yPos = 28;
  const avatarRadius = 52;
  const avatarImage = await imageCache.fetchImage(avatar);
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarRadius, yPos + avatarRadius, avatarRadius, 0, 2 * Math.PI);
  ctx.clip();
  ctx.drawImage(avatarImage, avatarX, yPos, avatarRadius * 2, avatarRadius * 2);
  ctx.restore();


  const nickNameX = 172
  const nickNameY = 70;
  // 绘制用户昵称 - 与头像顶部对齐
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 36px Arial';
  ctx.fillText(nickName, nickNameX, nickNameY);

  // 计算昵称宽度，用于动态调整等级标签位置
  const nicknameWidth = ctx.measureText(nickName).width;

  if (timingRank !== 0) {
    // 绘制等级标签
    const levelIndex = timingLevel == -1 ? 0 : timingLevel;
    const levelText = TIMING_LEVELS_MAP[levelIndex];
    const levelColor = TIMING_LEVELS_COLOR[levelIndex];
    const textColor = TIMING_LEVELS_TEXT_COLOR[levelIndex] || '#FFFFFF';

    const rankText = timingRank === 1 ? '雷帝' : `${levelText}${timingRank <= 300 ? ' ' + timingRank : ''}`
    const rankTextWidth = 40 + (rankText.length - 1) * 11;
    if (levelIndex < TIMING_LEVELS_MAP.length) {
      const labelX = 30 + nicknameWidth + nickNameX;
      const labelHeight = 25;
      ctx.beginPath();
      ctx.fillStyle = levelColor;
      ctx.roundRect(labelX, nickNameY - labelHeight, rankTextWidth, labelHeight, 4);
      ctx.fill();
      ctx.fillStyle = textColor;
      ctx.font = '18px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(rankText, labelX + 10, nickNameY - 6);
    }
  }

  const timeX = nickNameX
  yPos += avatarRadius * 2 - 6;
  // 绘制时间和设备信息
  const timeStr = new Date(createTime).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  ctx.fillStyle = '#999';
  ctx.font = '26px Arial';
  ctx.fillText(`${timeStr}   📱${device}`, timeX, yPos);

  yPos += 13

  // 绘制帖子标题
  if (title) {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 40px Arial';
    yPos += 60;
    //@ts-ignore
    ctx.fillText(title.slice(0, 28), avatarX, yPos);
    yPos += 23
  }


  if (tag.length > 0) {
    // 绘制标签
    yPos += 13
    ctx.fillStyle = '#FA7299';
    ctx.font = '40px Arial';
    const tagText = tag.join(' ');
    // @ts-ignore
    const wrappedTag = wrapText(ctx, tagText, 1002);
    wrappedTag.slice(0, 3).forEach(line => { // 最多显示3行
      yPos += 45;
      ctx.fillText(line, 40, yPos);
    });
    yPos += 13
  }

  // 绘制帖子正文内容
  if (showText) {
    ctx.fillStyle = '#E0E0E0';
    ctx.font = '40px Arial';
    const maxTextLength = 48; // 最大字符数
    const displayText = showText.length > maxTextLength ? showText.substring(0, maxTextLength) + '...' : showText;
    //@ts-ignore
    const wrappedText = wrapText(ctx, displayText, 1000);

    wrappedText.slice(0, 3).forEach(line => { // 最多显示3行
      yPos += 60;
      ctx.fillText(line, 40, yPos);
    });
    yPos += 33;
  }

  // 绘制帖子内容（image）
  if (isIncludedImage(text)) {
    let imageX = avatarX;
    const imgUrl = extractImageLinksFromMarkdown(text).slice(0, 3)
    for (let i = 0; i < imgUrl.length; i++) {
      const image = await imageCache.fetchImage(imgUrl[i]);

      // 保存当前绘图状态
      ctx.save();

      // 创建圆角矩形路径
      ctx.beginPath();
      ctx.roundRect(imageX, yPos, 326, 326, 12);
      ctx.clip();

      // 绘制图片
      ctx.drawImage(image, imageX, yPos, 326, 326);

      // 恢复绘图状态
      ctx.restore();

      imageX += 336; // 每张图片之间的间隔
    }
    yPos += 326 + 20;
  }

  if (record.id) {
    const icon = recordIcons[recordType];
    const bgColor = recordBgColor[recordType];
    const textColor = recordTextColor[recordType];
    ctx.beginPath();
    ctx.fillStyle = bgColor;
    ctx.roundRect(avatarX, yPos, 1002, 138, 10);
    ctx.fill();

    const iconX = avatarX + 65;
    const iconY = yPos + 41;

    ctx.textAlign = 'center'
    ctx.fillStyle = textColor;
    const font = 'bold 30px Arial';
    const labelFont = '24px Arial'
    const textY = yPos + 58;
    const labelY = textY + 46;
    const textX = 67 + 270;

    if (recordType !== 4) {
      ctx.drawImage(icon, iconX, iconY, 56, 56);

      ctx.font = labelFont;
      ctx.fillText('难度', textX, labelY);
      ctx.fillText('时间', textX + 270, labelY);
    }

    switch (recordType) {
      case 0: // 扫雷
        ctx.font = font;
        ctx.fillText(computeType(record.row, record.column, record.mine), textX, textY);
        ctx.fillText(String(record.time), textX + 270, textY);
        ctx.fillText(String(record.bvs), textX + 270 + 270, textY);

        ctx.font = labelFont;
        ctx.fillText('3BV/s', textX + 270 + 270, labelY);
        break;
      case 1: // 数字华容道
        ctx.font = font;
        ctx.fillText(`${puzzleRecord.row}x${puzzleRecord.column}`, textX, textY);
        ctx.fillText(String(puzzleRecord.time), textX + 270, textY);
        ctx.fillText(String(puzzleRecord.step), textX + 270 + 270, textY);

        ctx.font = labelFont;
        ctx.fillText('步数', textX + 270 + 270, labelY);
        break;
      case 2: // 2048
        ctx.font = font;
        ctx.fillText(`${tzfeRecord.row}x${tzfeRecord.column}`, textX, textY);
        ctx.fillText(String(tzfeRecord.time), textX + 270, textY);
        ctx.fillText(String(tzfeRecord.score), textX + 270 + 270, textY);

        ctx.font = labelFont;
        ctx.fillText('分数', textX + 270 + 270, labelY);
        break;
      case 3: // 舒尔特方格
        ctx.font = font;
        ctx.fillText(`${schulteRecord.row}x${schulteRecord.column}`, textX, textY);
        ctx.fillText(String(schulteRecord.time), textX + 270, textY);
        ctx.fillText(String(schulteRecord.row * schulteRecord.column - schulteRecord.tapCorrect), textX + 270 + 270, textY);

        ctx.font = labelFont;
        ctx.fillText('错误', textX + 270 + 270, labelY);
        break;
      case 4: // 数织
        const nonoIconX = 140
        const nonoTextX = 67 + 378
        ctx.drawImage(icon, nonoIconX, iconY, 56, 56);

        ctx.font = font;
        ctx.fillText(`${computeNonoType(nonoRecord.mine)}`, nonoTextX, textY);
        ctx.fillText(String(nonoRecord.time / 1000), nonoTextX + 378, textY);
        ctx.font = labelFont;
        ctx.fillText('难度', nonoTextX, labelY);
        ctx.fillText('时间', nonoTextX + 378, labelY);
        break;
    }
    ctx.textAlign = 'left';
    yPos += 138 + 33; // 增加记录区域的高度
  }

  // 绘制最新评论
  if (lastComment && lastComment.user) {
    // @ts-ignore
    const wrappedComment = wrapText(ctx, lastComment.comment, 720);
    let lastCommentHeight = 120 + (wrappedComment.length > 1 ? 110 : 55);
    // 绘制评论背景
    ctx.fillStyle = '#2A2A2A';
    ctx.beginPath();
    ctx.roundRect(avatarX, yPos, 1000, lastCommentHeight, 8);
    ctx.fill();

    // 绘制"最新评论"标题
    ctx.fillStyle = '#8D9E4B';
    ctx.font = '30px Arial';
    ctx.fillText('最新评论', 80, yPos + 55);

    // 绘制评论者头像
    const commentAvatarX = 960;
    const commentAvatarRadius = 30;
    const commentAvatarY = yPos + 15;
    const commentAvatarImage = await imageCache.fetchImage(lastComment.user.avatar);
    ctx.save();
    ctx.beginPath();
    ctx.arc(commentAvatarX + commentAvatarRadius, commentAvatarY + commentAvatarRadius, commentAvatarRadius, 0, 2 * Math.PI);
    ctx.clip();
    ctx.drawImage(commentAvatarImage, commentAvatarX, commentAvatarY, commentAvatarRadius * 2, commentAvatarRadius * 2);
    ctx.restore();


    // 绘制评论者昵称 - 与头像顶部对齐
    const lastCommentNickNameLength = ctx.measureText(lastComment.user.nickName).width;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px Arial';
    ctx.fillText(lastComment.user.nickName, commentAvatarX - 70 - lastCommentNickNameLength * 0.5, commentAvatarY + 25);

    // 绘制评论时间
    const commentTimeStr = new Date(lastComment.createTime).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    ctx.fillStyle = '#999';
    ctx.font = '20px Arial';
    ctx.fillText(commentTimeStr, commentAvatarX - 70 - lastCommentNickNameLength * 0.5, commentAvatarY + 55);

    // 绘制评论内容
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '30px Arial';
    yPos += 75;
    for (let i = 0; i < 2; i++) {
      yPos += 55;
      if (i === 1) {
        ctx.fillText(wrappedComment[i].slice(0, 28) + '...', 80, yPos);
        break;
      }
      ctx.fillText(wrappedComment[i], 80, yPos);
    }
    yPos += 50
  }

  // 绘制底部互动信息
  const bottomY = yPos + 70;

  // 评论数
  ctx.fillStyle = '#9EA1A6';
  ctx.drawImage(commentImage, 280, bottomY - 50, 75, 75);
  // ctx.fillText('💬', 300, bottomY);
  ctx.font = '36px Arial';
  if (commentCount < 1000)
    ctx.fillText(commentCount.toString(), 370, bottomY);
  else
    // 如果评论数超过1000，显示为千位数
    ctx.fillText(`${(commentCount / 1000).toFixed(1)}k`, 350, bottomY);

  // 点赞数
  // ctx.fillText('👍', 600, bottomY);
  ctx.drawImage(goodImage, 590, bottomY - 55, 80, 80);
  ctx.font = '36px Arial';
  if (goodCount < 1000)
    ctx.fillText(goodCount.toString(), 675, bottomY);
  else
    // 如果点赞数超过1000，显示为千位数
    ctx.fillText(`${(goodCount / 1000).toFixed(1)}k`, 675, bottomY);

  return canvas.toBuffer('image/png');
}

// 文本换行辅助函数
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split('');
  const lines: string[] = [];
  let currentLine = '';

  for (const char of words) {
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine !== '') {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function isIncludedImage(text: string): boolean {
  return text.includes('![](http');
}

function extractImageLinksFromMarkdown(markdownText: string): string[] {
  // Markdown 图片语法正则表达式
  // 匹配 ![alt text](url) 和 <img src="url"> 格式
  const imageRegex = /!\[.*?\]\((.*?)\)|<img[^>]+src="([^">]+)"/g;

  const links: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = imageRegex.exec(markdownText)) !== null) {
    // 第一个捕获组是 ![]() 格式的链接
    // 第二个捕获组是 <img> 标签格式的链接
    const link = match[1] || match[2];
    if (link) {
      links.push(link);
    }
  }

  return links;
}

function removeImagesAndLinksFromMarkdown(markdownText: string): string {
  // 去除图片：![alt](url) 和 <img> 标签
  let result = markdownText.replace(/!\[.*?\]\(.*?\)/g, '');
  result = result.replace(/<img[^>]*>/g, '');

  // 去除超链接：[text](url) 和 <a> 标签
  result = result.replace(/\[(.*?)\]\(.*?\)/g, '$1'); // 保留链接文本
  result = result.replace(/<a\b[^>]*>(.*?)<\/a>/g, '$1'); // 保留链接文本

  return result;
}

/**
 * 移除字符串中所有被 # 包裹的部分
 * @param input 输入字符串
 * @returns 处理后的字符串，所有被 # 包裹的部分已被移除
 */
function removeHashWrappedStrings(input: string): string {
  // 使用正则表达式替换被 # 包裹的字符串为空
  // 正则解释：
  // # 匹配 # 字符
  // [^#]+ 匹配一个或多个非 # 字符
  // # 匹配结束的 # 字符
  // g 表示全局匹配
  return input.replace(/#[^#]+#/g, '');
}

/**
 * 匹配所有被 # 包裹的字符串
 * @param input 输入字符串
 * @returns 匹配到的所有被 # 包裹的字符串数组
 */
function findHashWrappedStrings(input: string): string[] {
  // 使用正则表达式匹配被 # 包裹的字符串
  // 正则解释：
  // # 匹配 # 字符
  // ([^#]+) 匹配一个或多个非 # 字符（捕获组）
  // # 匹配结束的 # 字符
  // g 表示全局匹配
  const regex = /#([^#]+)#/g;

  const matches: string[] = [];
  let match;

  // 使用循环获取所有匹配项
  while ((match = regex.exec(input)) !== null) {
    // match[1] 是第一个捕获组，即 # 之间的内容
    matches.push(`#${match[1]}#`);
  }

  return matches;
}

function computeType(row: number, column: number, mine: number): string {
  if (row * column === 480 && mine === 99) return "高级";
  if (row === 16 && column === 16 && mine === 40) return "中级";
  if (row === 8 && column === 8 && mine === 10) return "初级";
  return `${row}x${column}x${mine}`;
}

function computeNonoType(mine: number): string {
  if (mine === 27) return `初级`;
  if (mine === 64) return `中级`;
  if (mine === 90) return `高级`;
  if (mine === 148) return `专家`;
}
