import { Context } from "koishi";
import { Face_info } from "./type";

export async function render(ctx: Context, imageBuffer: ArrayBuffer, faceList: Face_info[]) {
  // @ts-ignore
  const img = await ctx.canvas.loadImage(imageBuffer);

  const originWidth = img.naturalWidth || img.width;
  const originHeight = img.naturalHeight || img.height;

  // 如果原图过大，可以限制最大尺寸以节省内存（例如最大宽度/高度为 1200）
  const MAX_SIZE = 1200;
  const scale = Math.min(1, MAX_SIZE / originWidth, MAX_SIZE / originHeight);

  const canvasWidth = originWidth * scale;
  const canvasHeight = originHeight * scale;

  // @ts-ignore
  const canvas = await ctx.canvas.createCanvas(canvasWidth, canvasHeight);
  const context = canvas.getContext("2d");

  // Draw the original image scaled to canvas
  context.drawImage(img, 0, 0, canvasWidth, canvasHeight);

  // Set styling for YOLO-like bounding boxes
  const lineWidth = Math.max(2, Math.floor(canvasWidth / 200));
  context.lineWidth = lineWidth;

  const fontSize = Math.max(14, Math.floor(canvasWidth / 30));
  context.font = `bold ${fontSize}px sans-serif`;

  for (const face of faceList) {
    let { left, top, width, height, rotation } = face.location;
    const beauty = face.beauty;
    const text = `Beauty: ${beauty}`;

    // 坐标根据图片原始尺寸缩放到实际 canvas 尺寸
    left *= scale;
    top *= scale;
    width *= scale;
    height *= scale;

    context.save();

    // Handle rotation if needed (Baidu API rotation is in degrees from vertical)
    if (rotation !== 0) {
      context.translate(left + width / 2, top + height / 2);
      context.rotate((rotation * Math.PI) / 180);
      context.translate(-(left + width / 2), -(top + height / 2));
    }

    // Draw bounding box
    context.strokeStyle = "#00FF00"; // Green color similar to standard detections
    context.strokeRect(left, top, width, height);

    // Calculate text background size
    const textMetrics = context.measureText(text);
    const textWidth = textMetrics.width;
    const textHeight = fontSize; // Approximate height

    // Draw background box for text
    context.fillStyle = "#00FF00";
    context.fillRect(left - lineWidth / 2, top - textHeight - 8, textWidth + 8, textHeight + 8);

    // Draw text
    context.fillStyle = "#000000";
    context.fillText(text, left - lineWidth / 2 + 4, top - 4);

    context.restore();
  }

  return await canvas.toBuffer("image/png");
}
