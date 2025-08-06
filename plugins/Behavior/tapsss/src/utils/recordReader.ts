import { promises as fs } from 'fs';
import { computeMD5 } from './md5';

async function readFourBytesAsInt(
  fileHandle: fs.FileHandle,
  builder: string[]
): Promise<number> {
  const buffer = Buffer.alloc(4);
  const { bytesRead } = await fileHandle.read(buffer, 0, 4, null);

  if (bytesRead < 4) {
    builder.push('0');
    return 0;
  }

  // 修正后的转换逻辑 - 直接使用带符号字节
  let value = 0;
  for (let i = 3; i >= 0; i--) {
    value = (value << 8) | buffer[i];
  }

  // 处理32位有符号整数
  value = value | 0; // 强制转换为32位有符号整数

  builder.push(value.toString());
  return value;
}

type ByteConversionOptions = {
  endianness?: 'BE' | 'LE';      // 字节序：大端(BE)或小端(LE)
  signed?: boolean;              // 是否作为有符号数处理
  asString?: boolean;            // 是否返回字符串
  encoding?: BufferEncoding;     // 字符串编码（默认utf8）
  bitLength?: 8 | 16 | 32 | 64; // 显式指定位长度
};

/**
 * 读取任意字节数的通用方法（考虑原始Java的带符号字节处理）
 * @param fileHandle 文件句柄
 * @param byteLength 要读取的字节数(1-8)
 * @param options 转换选项
 * @returns 根据选项返回Buffer、number或string
 */
async function readBytes(
  fileHandle: fs.FileHandle,
  byteLength: number,
  options: ByteConversionOptions = {}
): Promise<Buffer | number | string> {
  // 参数验证
  if (byteLength < 1 || byteLength > 8) {
    throw new Error('byteLength must be between 1 and 8');
  }

  const buffer = Buffer.alloc(byteLength);
  const { bytesRead } = await fileHandle.read(buffer, 0, byteLength, null);

  // 检查是否读取足够数据
  if (bytesRead < byteLength) {
    throw new Error(`Only read ${bytesRead} bytes, expected ${byteLength}`);
  }

  // 如果要求返回字符串
  if (options.asString) {
    return buffer.toString(options.encoding || 'utf8');
  }

  // 如果要求返回原始Buffer
  if (!options.signed && !options.endianness && !options.bitLength) {
    return buffer;
  }

  // 数值转换处理
  return convertBytesToNumber(buffer, {
    endianness: options.endianness || 'BE',
    signed: options.signed ?? true, // 默认按有符号处理，与Java行为一致
    bitLength: options.bitLength || (byteLength * 8) as any
  });
}

/**
 * 字节到数值的转换核心方法
 * 模拟Java的带符号字节处理行为
 */
function convertBytesToNumber(
  buffer: Buffer,
  options: {
    endianness: 'BE' | 'LE';
    signed: boolean;
    bitLength: 8 | 16 | 32 | 64;
  }
): number {
  const { endianness, signed, bitLength } = options;
  const byteLength = bitLength / 8;

  // 1个字节特殊处理
  if (byteLength === 1) {
    return signed ? buffer.readInt8(0) : buffer.readUInt8(0);
  }

  let value = 0;

  // 大端序处理（高位在前）
  if (endianness === 'BE') {
    for (let i = 0; i < byteLength; i++) {
      value = (value << 8) | (buffer[i] & 0xFF); // 模拟Java带符号字节处理
    }
  }
  // 小端序处理（低位在前）
  else {
    for (let i = byteLength - 1; i >= 0; i--) {
      value = (value << 8) | (buffer[i] & 0xFF); // 模拟Java带符号字节处理
    }
  }

  // 有符号数处理（模拟Java类型转换）
  if (signed) {
    switch (bitLength) {
      case 16:
        return (value << 16) >> 16; // 转为16位有符号
      case 32:
        return value | 0;           // 转为32位有符号
      case 64:
        return Number(BigInt.asIntN(64, BigInt(value))); // 64位需要BigInt
    }
  }

  return value >>> 0; // 无符号处理
}

async function readUtf8String(
  fileHandle: fs.FileHandle,
  builder: string[] | null,
  length: number
): Promise<string> {
  if (length <= 0) {
    throw new Error('Length must be positive');
  }

  const buffer = Buffer.alloc(length);
  const { bytesRead } = await fileHandle.read(buffer, 0, length, null);

  // 检查是否读取了足够的数据
  if (bytesRead < length) {
    throw new Error(`Failed to read ${length} bytes, only got ${bytesRead}`);
  }

  const str = buffer.toString('utf8');

  // 如果提供了builder，追加结果
  if (builder !== null) {
    builder.push(str);
  }

  return str;
}

async function readFloatFromStream(
  fileHandle: fs.FileHandle,
  builder: string[]
): Promise<number> {
  const buffer = Buffer.alloc(4);
  const { bytesRead } = await fileHandle.read(buffer, 0, 4, null);

  // 检查是否读取成功
  if (bytesRead < 4) {
    builder.push(buffer.toString('hex')); // 相当于Java的Arrays.toString()
    return 0.0;
  }

  // 小端序读取32位整数(因为原始代码是从高索引到低索引)
  const intValue = buffer.readInt32LE(0);

  // 将32位整数转换为浮点数
  const floatValue = intToFloat(intValue);

  builder.push(intValue.toString());
  return floatValue;
}

function intToFloat(i: number): number {
  const buffer = Buffer.alloc(4);
  buffer.writeInt32LE(i, 0);
  return buffer.readFloatLE(0);
}

async function readLongFromStream(
  fileHandle: fs.FileHandle,
  builder: string[]
): Promise<bigint> {
  const buffer = Buffer.alloc(8);
  const { bytesRead } = await fileHandle.read(buffer, 0, 8, null);

  // 检查是否读取成功
  if (bytesRead < 8) {
    builder.push('0');
    return BigInt(0);
  }

  // 大端序读取64位整数(因为原始代码是按顺序从0到7处理字节)
  let longValue = BigInt(0);
  for (let i = 0; i < 8; i++) {
    // 由于 UByte.f36682b 是 -1 (0xFFFFFFFF)，相当于不做任何掩码操作
    longValue = (longValue << BigInt(8)) | BigInt(buffer[i]);
  }

  builder.push(longValue.toString());
  return longValue;
}

// 使用示例
async function main() {
  try {
    const builder: string[] = [];
    const fileHandle = await fs.open('高级-44868.msr', 'r');

    const value1 = await readFourBytesAsInt(fileHandle, builder);
    const id = await readFourBytesAsInt(fileHandle, builder);
    console.log('读取的ID:', id);

    const value3 = await readFourBytesAsInt(fileHandle, builder)
    if (value1 > 3 && value3 > 0) {
      const localId = await readUtf8String(fileHandle, builder, value3)
      console.log('读取的本地ID:', localId);
    }


    const numberList = []
    for (let i = 0; i < 8; i++) {
      const tapTimeValue = await readFourBytesAsInt(fileHandle, builder);
      numberList.push(tapTimeValue);
    }
    const [type, mode, finished, row, column, mine, bv, solvedBv] = numberList;
    console.log('读取的类型:', type,)
    console.log('模式:', mode,)
    console.log('完成:', finished,)
    console.log('行:', row,)
    console.log('列:', column,)
    console.log('地雷:', mine,)
    console.log('bv:', bv,)
    console.log('已解决bv:', solvedBv);

    const bvs = await readFloatFromStream(fileHandle, builder);
    console.log('读取的bvs:', bvs);
    const tap = await readFourBytesAsInt(fileHandle, builder);
    console.log('读取的tap:', tap);
    const effectiveTap = await readFourBytesAsInt(fileHandle, builder);
    console.log('读取的有效tap:', effectiveTap);
    const estimatedTime = await readLongFromStream(fileHandle, builder);
    console.log('读取的预计时间:', estimatedTime.toString());
    const time = await readLongFromStream(fileHandle, builder);
    console.log('读取的时间:', time.toString());
    const [themeId, postID, upload] = [
      await readFourBytesAsInt(fileHandle, builder),
      await readFourBytesAsInt(fileHandle, builder),
      await readFourBytesAsInt(fileHandle, builder) == 1];
    console.log('主题ID:', themeId);
    console.log('帖子ID:', postID);
    console.log('上传:', upload);

    const creatTime = await readLongFromStream(fileHandle, builder);
    console.log('创建时间:', creatTime.toString());

    const mapLength = await readFourBytesAsInt(fileHandle, builder);
    const map = await readUtf8String(fileHandle, builder, mapLength);
    console.log('读取的地图:', map);

    const mapStatusLength = await readFourBytesAsInt(fileHandle, builder);
    if (value1 > 1 && mapStatusLength > 0) {
      const mapStatus = await readUtf8String(fileHandle, builder, mapStatusLength);
      console.log('读取的地图状态:', mapStatus);
    }

    const value4 = await readFourBytesAsInt(fileHandle, builder);
    const arrayList = []
    let step = 1;
    for (let j = 0; j < value4; j++) {
      const [action, column, row, time] = [
        await readFourBytesAsInt(fileHandle, builder),
        await readFourBytesAsInt(fileHandle, builder) + 1,
        await readFourBytesAsInt(fileHandle, builder) + 1,
        Number(await readLongFromStream(fileHandle, builder)) / 1000,]
      if (action === 1) {
        // console.log(`${step} ${time}    [${column}, ${row}]`);
        arrayList.push({
          column,
          row,
          time,
        })
        step++;
      }

    }

    if (value1 > 2) {
      const md5 = await readUtf8String(fileHandle, null, 32);
      if (computeMD5(builder.join('') + 'msr') !== md5) {
        console.error('MD5校验失败，文件可能已损坏或被篡改');
        fileHandle.close();
        return null;
      } else {
        console.log('MD5校验成功');
      }
    }


    await fileHandle.close();
  } catch (error) {
    console.error('文件操作出错:', error);
  }
}

main();
