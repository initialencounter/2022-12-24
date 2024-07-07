import crypto from 'crypto';
// import { createReadStream, writeFileSync } from 'fs';
// import { resolve } from 'path';


// (async () => {

// })()

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
