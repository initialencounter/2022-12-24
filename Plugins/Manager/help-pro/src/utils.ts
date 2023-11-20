import { PNG } from 'pngjs';
import crypto from 'crypto';
// import { createReadStream, writeFileSync } from 'fs';
// import { resolve } from 'path';


// (async () => {

// })()


/**
 * 生成圆角图片
 * @param width 宽度
 * @param height 高度
 * @param color 颜色
 * @param radius 圆角半径
 * @returns 
 */
export function createRounderRect(width: number, height: number, color: number[], radius: number) {
    // 创建一个新的 PNG 实例
    const png = new PNG({ width, height });


    // 将像素数据写入 PNG 实例
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (width * y + x) << 2;
            // 将 RGBA 值写入像素数据
            if (isPointInRoundedRect(x, y, width, height, radius)) {
                png.data[idx] = color[0];
                png.data[idx + 1] = color[1];
                png.data[idx + 2] = color[2];
                png.data[idx + 3] = color[3];
            } else {
                png.data[idx] = 0;
                png.data[idx + 1] = 0;
                png.data[idx + 2] = 0;
                png.data[idx + 3] = 0;
            }
        }
    }

    // 创建一个 Uint8Array 来保存 PNG 数据
    const pngArray = new Uint8Array(PNG.sync.write(png));

    // 转换 Uint8Array 到 ArrayBuffer
    const arrayBuffer = pngArray.buffer;

    return arrayBuffer;
}

function isPointInRoundedRect(x: number, y: number, width: number, height: number, borderRadius: number): boolean {
    // 在矩形外
    if (x > width || y > height) {
        return false
    }
    // 在四角内
    if (x > borderRadius && x + borderRadius < width || y > borderRadius && y + borderRadius < height) {
        return true
    }
    // 在四角

    // 检查左上角圆角区域
    if (Math.pow(x - borderRadius, 2) + Math.pow(y - borderRadius, 2) <= Math.pow(borderRadius, 2)) {
        return false;
    }

    // 检查右上角圆角区域
    if (Math.pow(x - (width - borderRadius), 2) + Math.pow(y - borderRadius, 2) <= Math.pow(borderRadius, 2)) {
        return true;
    }

    // 检查左下角圆角区域
    if (Math.pow(x - borderRadius, 2) + Math.pow(y - (height - borderRadius), 2) <= Math.pow(borderRadius, 2)) {
        return true;
    }

    // 检查右下角圆角区域
    if (Math.pow(x - (width - borderRadius), 2) + Math.pow(y - (height - borderRadius), 2) <= Math.pow(borderRadius, 2)) {
        return true;
    }

    return false;
}

export function calculateHash(obj: any) {
    // 将对象转换为字符串
    const objString = JSON.stringify(obj);

    // 创建哈希对象
    const hash = crypto.createHash('sha256');

    // 更新哈希对象的数据
    hash.update(objString);

    // 计算并返回哈希值的十六进制表示
    return hash.digest('hex');
}
