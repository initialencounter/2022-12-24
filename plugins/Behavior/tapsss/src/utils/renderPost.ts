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

const isDev = process.env.NODE_ENV === 'development';
const resourcesPath = isDev ? path.resolve(__dirname, '../../assets') : path.resolve(__dirname, '../assets');
const commentImageBuffer = readFileSync(path.resolve(resourcesPath, 'EQ.png'));
const goodImageBuffer = readFileSync(path.resolve(resourcesPath, 'vO.png'));
let goodImage: Image | null = null;
let commentImage: Image | null = null;

export async function renderPost(post: Datum, canvasService: CanvasService, imageCache: ImageCache): Promise<Buffer> {
  if (!goodImage) {
    goodImage = await canvasService.loadImage(goodImageBuffer);
  }
  if (!commentImage) {
    commentImage = await canvasService.loadImage(commentImageBuffer);
  }
  const { title, text, device, record, user: { avatar, nickName, timingLevel, timingRank, vip }, createTime, goodCount, commentCount, lastComment } = post;
  let height = 220 + 105 + 205;
  if (title) height += 53 + 33; // 如果有标题，增加额外空间
  if (isIncludedImage(text)) height += 326 + 20; // 如果有图片，增加额外空间
  if (record.id) height += 138 + 33; // 如果有记录，增加额外空间
  if (removeImagesAndLinksFromMarkdown(text)) height += (removeImagesAndLinksFromMarkdown(text).length > 24 ? 2 : 1) * 60; // 如果有正文内容，增加额外空间
  if (lastComment) height += Math.floor(lastComment.comment.length / 30) * 55 // 计算最新评论的高度，假设每30个字符占55px高度
  const canvas = await canvasService.createCanvas(1080, height);
  const ctx = canvas.getContext('2d');

  // 设置背景
  ctx.fillStyle = '#1B1B1B';
  ctx.fillRect(0, 0, 1080, height);

  // 绘制用户头像
  const avatarX = 39;
  const avatarY = 28;
  const avatarRadius = 52;
  const avatarImage = await imageCache.fetchImage(avatar);
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius, 0, 2 * Math.PI);
  ctx.clip();
  ctx.drawImage(avatarImage, avatarX, avatarY, avatarRadius * 2, avatarRadius * 2);
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
    console.log('rankTextWidth:', rankTextWidth, rankText, rankText.length);
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
  const timeY = avatarY + avatarRadius * 2 - 6;
  // 绘制时间和设备信息
  const timeStr = new Date(createTime).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  ctx.fillStyle = '#999';
  ctx.font = '26px Arial';
  ctx.fillText(`${timeStr}   📱${device}`, timeX, timeY);

  let yPos = timeY + 80;
  // 绘制帖子标题
  if (title) {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 40px Arial';
    //@ts-ignore
    const wrappedTitle = wrapText(ctx, title, 1002);
    wrappedTitle.forEach(line => {
      ctx.fillText(line, avatarX, yPos);
      yPos += 60;
    });
  }

  yPos += 23

  const showText = removeImagesAndLinksFromMarkdown(text).trim();
  // 绘制帖子正文内容
  if (showText) {
    ctx.fillStyle = '#E0E0E0';
    ctx.font = '40px Arial';
    const maxTextLength = 48; // 最大字符数
    const displayText = showText.length > maxTextLength ? showText.substring(0, maxTextLength) + '...' : showText;
    //@ts-ignore
    const wrappedText = wrapText(ctx, displayText, 1000);

    wrappedText.slice(0, 3).forEach(line => { // 最多显示3行
      ctx.fillText(line, 40, yPos);
      yPos += 60;
    });
    yPos += 10;
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

  let commentContentY = yPos + 20;
  // 绘制最新评论
  if (lastComment && lastComment.user) {
    const commentY = yPos + 40;

    const maxCommentLength = 60;
    const displayComment = lastComment.comment.length > maxCommentLength ?
      lastComment.comment.substring(0, maxCommentLength) + '...' : lastComment.comment;
    // @ts-ignore
    const wrappedComment = wrapText(ctx, displayComment, 1220);
    let lastCommentHeight = 120 + wrappedComment.length * 50;
    // 绘制评论背景
    ctx.fillStyle = '#2A2A2A';
    ctx.beginPath();
    ctx.roundRect(avatarX, commentY - 20, 1000, lastCommentHeight, 8);
    ctx.fill();

    // 绘制"最新评论"标题
    ctx.fillStyle = '#8D9E4B';
    ctx.font = '30px Arial';
    ctx.fillText('最新评论', 80, commentY + 30);

    // 绘制评论者头像
    const commentAvatarX = 960;
    const commentAvatarRadius = 30;
    const commentAvatarY = commentY - 10;
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

    // @ts-ignore

    commentContentY = commentY + 100;
    wrappedComment.slice(0, 2).forEach(line => { // 最多显示2行
      ctx.fillText(line, 80, commentContentY);
      commentContentY += 55;
    });
  }

  // 绘制底部互动信息
  const bottomY = commentContentY + 70;

  // 评论数
  ctx.fillStyle = '#9EA1A6';
  ctx.drawImage(commentImage, 260, bottomY - 50, 75, 75);
  // ctx.fillText('💬', 300, bottomY);
  ctx.font = '36px Arial';
  if (commentCount < 1000)
    ctx.fillText(commentCount.toString(), 350, bottomY);
  else
    // 如果评论数超过1000，显示为千位数
    ctx.fillText(`${(commentCount / 1000).toFixed(1)}k`, 350, bottomY);

  // 点赞数
  // ctx.fillText('👍', 600, bottomY);
  ctx.drawImage(goodImage, 580, bottomY - 55, 80, 80);
  ctx.font = '36px Arial';
  if (goodCount < 1000)
    ctx.fillText(goodCount.toString(), 665, bottomY);
  else
    // 如果点赞数超过1000，显示为千位数
    ctx.fillText(`${(goodCount / 1000).toFixed(1)}k`, 665, bottomY);

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
