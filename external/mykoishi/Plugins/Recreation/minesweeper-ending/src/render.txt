import { resolve } from "path";
import fs from 'fs';
import { PNG } from 'pngjs';
import Minefield from "./minesweeper";
import { MineConfig } from "./config"

const imgArr = {}
const NumImg = {}
let textColor = [0, 0, 0, 255]


/**
 * 初始化
 * @param config 
 */
export async function setTheme(config: MineConfig) {
    // 十六进制颜色转RGBA
    textColor = hexToRgba(config.colorForSerialNum)
    const themePath = resolve(__dirname, "theme", config.theme)
    const imageTypes = ['closed', 'flag', 'type0', 'type1', 'type2', 'type3', 'type4', 'type5', 'type6', 'type7', 'type8'];  // 扫雷的皮肤文件名
    for (var type of imageTypes) {
        imgArr[type] = await readImageAsArray(resolve(themePath, `${type}.png`))
    }
    for (var i = 0; i < 10; i++) {
        NumImg[i] = await readImageAsArray(resolve(__dirname, `text/text${i}.png`)) //扫雷方块的编号上的数字
    }
}
async function main() {
    textColor = hexToRgba("#fff000ff")
    const themePath = resolve(__dirname, "theme/", "wom")
    const imageTypes = ['closed', 'flag', 'type0', 'type1', 'type2', 'type3', 'type4', 'type5', 'type6', 'type7', 'type8'];
    for (var type of imageTypes) {
        imgArr[type] = await readImageAsArray(resolve(themePath, `${type}.png`))
    }
    for (var i = 0; i < 10; i++) {
        NumImg[i] = await readImageAsArray(resolve(__dirname, `text/text${i}.png`))
    }
    const m = new Minefield(9, 9, 20)
    m.openCell("6")
    console.time("mytime")

    const img = await renderX(m)
    fs.writeFileSync('test.png', Buffer.from(img))
    console.timeEnd("mytime")

}
// main()

/**
 * 在图片上添加数字
 * @param num 要添加的数字
 * @returns 
 */
async function addText(num: number) {
    const [s1, s2] = (num < 10 ? "0" + num : String(num)).split('')
    const [s1Img, s2Img] = [NumImg[s1], NumImg[s2]]  //在这里读取，渲染到方块上
    const big = deepCopyArray(imgArr['closed'])
    for (let i = 0; i < 34; i++) {
        for (let j = 0; j < 20; j++) {
            if (s1Img[i][j][0] != 255) {
                big[i + 29][j + 26] = textColor
            }
            if (s2Img[i][j][0] != 255) {
                big[i + 29][j + 48] = textColor
            }
        }
    }
    const width = 94
    const height = 94
    const png = new PNG({ width, height });
    // 将像素数据写入PNG对象
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // 获取像素索引
            const idx = (width * y + x) << 2;
            // 获取像素的RGBA值
            const [r, g, b, a] = big[y][x];
            // 将像素数据写入PNG对象
            png.data[idx] = r;
            png.data[idx + 1] = g;
            png.data[idx + 2] = b;
            png.data[idx + 3] = a;
        }
    }
    // png.pack().pipe(fs.createWriteStream('test.png'));
    return big
}


/**
 * 从文件中读取图片为数组
 * @param imagePath 图片路径
 * @returns 
 */
async function readImageAsArray(imagePath: string) {
    const imageStream = fs.createReadStream(imagePath);
    const png = imageStream.pipe(new PNG());

    await new Promise((resolve, reject) => {
        png.on('parsed', resolve).on('error', reject);
    });

    const width = png.width;
    const height = png.height;
    const pixels = new Array(height);

    for (let y = 0; y < height; y++) {
        pixels[y] = new Array(width);
        for (let x = 0; x < width; x++) {
            const idx = (width * y + x) << 2;
            const r = png.data[idx];
            const g = png.data[idx + 1];
            const b = png.data[idx + 2];
            const a = png.data[idx + 3];
            pixels[y][x] = [r, g, b, a];
        }
    }
    return pixels;
}


/**
 * 将图片数组转为Arraybuffer
 * @param pixels 
 * @param width 
 * @param height 
 * @returns 
 */
function writeArrayToImage(pixels: number[][][], width: number, height: number) {
    // 创建一个新的PNG对象
    const png = new PNG({ width, height });
    // 将像素数据写入PNG对象
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // 获取像素索引
            const idx = (width * y + x) << 2;
            // 获取像素的RGBA值
            const [r, g, b, a] = pixels[y][x];
            // 将像素数据写入PNG对象
            png.data[idx] = r;
            png.data[idx + 1] = g;
            png.data[idx + 2] = b;
            png.data[idx + 3] = a;
        }
    }
    // 创建一个 Uint8Array 来保存 PNG 数据
    const pngBuffer = new Uint8Array(PNG.sync.write(png));

    // 转换 Uint8Array 到 ArrayBuffer
    const arrayBuffer = pngBuffer.buffer;

    return arrayBuffer;
}


/**
 * 将图片数组横向拼接
 * @param arrayx 图片数组
 * @returns 
 */
function concatX(arrayx: number[][][][]) {
    const temp: number[][][] = []
    for (let i = 0; i < 94; i++) {
        const temp2: number[][] = []
        const subArrays = arrayx.map(subArray => subArray[i]);
        for (const subArray of subArrays) {
            temp2.push(...subArray)
        }
        temp.push(temp2)
    }
    return temp
}


/**
 * 渲染雷图
 * @param m 雷图对象
 * @returns Arraybuffer
 */
export async function renderX(m: Minefield) {
    let x: number = m.width
    const img: number[][][] = []
    let tmp: number[][][][] = []
    for (var i = 0; i < m.cells; i++) {
        const ii = m[String(i)]
        if (i % x == 0 && i != 0) {
            img.push(...concatX(tmp))
            tmp = []
        }
        if (ii["isOpen"]) {
            // 打开
            tmp.push(imgArr[`type${ii["mines"]}`])
        }
        else if (ii["isFlagged"]) {
            tmp.push(imgArr['flag'])
        }
        else {
            tmp.push(await addText(i))
        }
    }
    img.push(...concatX(tmp))
    const res = writeArrayToImage(img, img[0].length, img.length)
    return res
}


/**
 * 深拷贝数组
 * @param arr 
 * @returns 
 */
function deepCopyArray(arr: any[]) {
    if (!Array.isArray(arr)) {
        return arr;
    }
    const copy = [];
    for (let i = 0; i < arr.length; i++) {
        copy[i] = deepCopyArray(arr[i]);
    }
    return copy;
}


/**
 * 
 * @param hex 十六进制颜色代码
 * @returns RGBA
 */
function hexToRgba(hex: string) {
    // 去除可能包含的 # 符号
    hex = hex.replace(/^#/, '');

    // 将十六进制的颜色值分解成红色、绿色、蓝色和透明度部分
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const a = parseInt(hex.substring(6, 8), 16);
    // 返回 RGBA 颜色
    const rgba = [r, g, b, a]
    for (var i of rgba) {
        if (i > 255) {
            return [0, 0, 0, 255]
        }
    }
    return rgba
}
