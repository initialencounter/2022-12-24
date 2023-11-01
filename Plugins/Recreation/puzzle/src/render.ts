import { resolve } from "path";
import fs from 'fs';
import { PNG } from 'pngjs';
import Pz from './index';

export const theme = [['#000000FF', '#707070FF', '#707070FF', '#707070FF', '#707070FF',],
['#707070FF', '#444444FF', '#00C91AFF', '#00C91AFF', '#00C91AFF',],
['#00C91AFF', '#444444FF', '#008314FF', '#006FFFFF', '#006FFFFF',],
['#006FFFFF', '#444444FF', '#008314FF', '#001EE1FF', '#FF0000FF',],
['#FF0000FF', '#444444FF', '#008314FF', '#001EE1FF', '#BB0000FF',]]


const imgArr = {}
const NumImg = {}
let textColor = [0, 0, 0, 255]

/**
 * 初始化
 * @param config 
 */
export async function setTheme(config: Pz.Config) {
    // 十六进制颜色转RGBA
    textColor = hexToRgba(config.colorForSerialNum)
    for (var j = 3; j < 6; j++) {
        for (var i = 0; i < j * j; i++) {
            const color = hexToRgba(find_color(i, j))
            const tmp1 = []
            for (var x = 0; x < 94; x++) {
                const arr = new Array(94)
                arr.fill(color)
                tmp1.push(arr)
            }
            imgArr[`${j}-${i}`] = tmp1
        }
    }
    // return
    for (var i = 0; i < 10; i++) {
        NumImg[i] = await readImageAsArray(resolve(__dirname, `text/text${i}.png`))
    }
}



async function main() {
    for (var j = 3; j < 6; j++) {
        for (var i = 0; i < j * j; i++) {
            const color = hexToRgba(find_color(i, j))
            const tmp1 = []
            for (var x = 0; x < 94; x++) {
                const arr = new Array(94)
                arr.fill(color)
                tmp1.push(arr)
            }
            imgArr[`${j}-${i}`] = tmp1
        }
    }
    // return
    for (var i = 0; i < 10; i++) {
        NumImg[i] = await readImageAsArray(resolve(__dirname, `text/text${i}.png`))
    }
    const tset = [[1, 2, 3], [4, 5, 6], [7, 8, 0]]

    console.time("mytime")

    const img = renderX(tset)
    fs.writeFileSync('test.png', Buffer.from(img))
    console.timeEnd("mytime")

}
// main()


/**
 * 获取背景颜色
 * @param num 数字
 * @param mode 模式
 * @returns 
 */
function find_color(num: number, mode: number) {
    const y = num % mode
    const x = Math.floor(num / mode)
    // console.log(num,mode)
    return theme[x][y]

}


/**
 * 在图片上添加数字
 * @param num 要添加的数字
 * @returns 
 */
function addText(num: number, mode: number) {
    const [s1, s2] = [Math.floor(num/10),num%10]
    const [s1Img, s2Img] = [NumImg[s1], NumImg[s2]]  //在这里读取，渲染到方块上
    const big = imgArr[`${mode}-${num}`]
    // console.log(big,`${mode}-${num+1}`)
    for (let i = 0; i < 34; i++) {
        for (let j = 0; j < 20; j++) {
            if(s1>0){
                if (s1Img[i][j][0] != 255) {
                    big[i + 29][j + 26] = textColor
                }
                if (s2Img[i][j][0] != 255) {
                    big[i + 29][j + 48] = textColor
                }
            }else{
                if (s2Img[i][j][0] != 255) {
                    big[i + 29][j + 38] = textColor
                }
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
function writeArrayToImage(pixels: number[][][], width: number, height: number):ArrayBuffer {
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

    return arrayBuffer as ArrayBuffer;
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
export function renderX(k):ArrayBuffer {
    let x: number = k.length
    const img: number[][][] = []

    for (var kk of k) {
        let tmp: number[][][][] = []
        for (var i of kk) {
            if (i == 0) {
                tmp.push(imgArr['5-0'])
            } else {
                tmp.push(addText(i, x))
            }

        }
        img.push(...concatX(tmp))
    }
    const res = writeArrayToImage(img, img[0].length, img.length)
    return res
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
