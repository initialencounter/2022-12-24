import { createDecipheriv, createCipheriv } from 'crypto';




/**
 * AES ECB 模式加密 (PKCS7Padding，兼容Java的PKCS5Padding)
 * @param plaintext 待加密的明文
 * @param key 密钥 (字符串)
 * @returns 加密后的十六进制字符串
 */
export function aesEcbEncrypt(
  plaintext: string,
  key: string
): string {
  // 确保密钥是 Buffer
  const keyBuffer = Buffer.from(key, 'utf8');

  // 检查密钥长度 (AES 需要 16/24/32 字节)
  if (![16, 24, 32].includes(keyBuffer.length)) {
    throw new Error('Invalid key length. Key must be 16, 24 or 32 bytes.');
  }

  // 将明文转换为 Buffer
  const plaintextBuffer = Buffer.from(plaintext, 'utf8');

  // 创建加密器 - ECB 模式，启用自动填充 (PKCS7Padding，兼容PKCS5Padding)
  const cipher = createCipheriv(`aes-${keyBuffer.length * 8}-ecb`, keyBuffer, null);
  cipher.setAutoPadding(true); // 启用自动填充

  // 加密数据
  const encrypted = Buffer.concat([
    cipher.update(plaintextBuffer),
    cipher.final()
  ]);

  // 返回十六进制字符串
  return encrypted.toString('hex').toLocaleUpperCase();
}

/**
 * AES ECB 模式解密 (NoPadding)
 * @param encryptedData 加密的数据 (十六进制字符串)
 * @param key 密钥 (字符串)
 * @returns 解密后的原始 Buffer
 */
function aesEcbDecryptNoPadding(
  encryptedData: string,
  key: string
): Buffer {
  // 确保密钥是 Buffer
  const keyBuffer = Buffer.from(key, 'utf8');

  // 检查密钥长度 (AES 需要 16/24/32 字节)
  if (![16, 24, 32].includes(keyBuffer.length)) {
    throw new Error('Invalid key length. Key must be 16, 24 or 32 bytes.');
  }

  // 将十六进制字符串转换为 Buffer
  const encryptedBuffer = Buffer.from(encryptedData, 'hex');

  // 检查数据长度 (必须是 16 字节的整数倍)
  if (encryptedBuffer.length % 16 !== 0) {
    throw new Error(
      `Invalid data length (${encryptedBuffer.length} bytes). ` +
      `Data length must be a multiple of 16 bytes.`
    );
  }

  // 创建解密器 - ECB 模式，禁用自动填充
  const decipher = createDecipheriv(`aes-${keyBuffer.length * 8}-ecb`, keyBuffer, null);
  decipher.setAutoPadding(false);

  // 解密数据
  const decrypted = Buffer.concat([
    decipher.update(encryptedBuffer),
    decipher.final()
  ]);

  return decrypted;
}

/**
 * 智能AES ECB解密 - 自动处理填充和数据偏移
 * @param encryptedData 加密的数据 (十六进制字符串)
 * @param key 密钥 (字符串)
 * @returns 解密后的JSON字符串
 */
function smartAesEcbDecrypt(
  encryptedData: string,
  key: string
): string {
  // 使用NoPadding模式解密
  const rawBuffer = aesEcbDecryptNoPadding(encryptedData, key);

  // 转换为字符串
  const str = rawBuffer.toString('utf8');

  // 找到JSON开始位置
  const jsonStart = str.indexOf('{"') >= 0 ? str.indexOf('{"') : str.indexOf('[{');
  if (jsonStart < 0) {
    throw new Error('No JSON data found in decrypted content');
  }

  // 提取JSON部分
  let jsonStr = str.substring(jsonStart);

  // 移除末尾的null字节和其他无效字符
  jsonStr = jsonStr.replace(/\0+$/, ''); // 移除末尾null字节
  jsonStr = jsonStr.replace(/[^\x20-\x7E\u4e00-\u9fa5{}[\]":,.\-\d]/g, ''); // 只保留有效字符

  // 智能提取完整的JSON结构
  let validJson = '';
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    validJson += char;

    if (!escaped && char === '"') {
      inString = !inString;
    } else if (!inString) {
      if (char === '{') braceCount++;
      else if (char === '}') braceCount--;
      else if (char === '[') bracketCount++;
      else if (char === ']') bracketCount--;
    }

    escaped = !escaped && char === '\\';

    // 如果JSON结构完整，尝试解析
    if (braceCount === 0 && bracketCount === 0 && validJson.length > 10) {
      try {
        JSON.parse(validJson); // 验证JSON有效性
        return validJson;
      } catch (e) {
        // 继续尝试
      }
    }
  }

  // 如果没有找到完整结构，返回清理后的字符串
  throw new Error('Failed to extract valid JSON from decrypted content');
}


/**
 * 智能提取JSON - 直接从Buffer中提取，避免UTF-8编码问题
 * @param encryptedData 加密的数据 (十六进制字符串)
 * @param key 密钥 (字符串)
 * @returns 解密后的JSON字符串
 */
export function extractJsonFromEncrypted(
  encryptedData: string,
  key: string
): string {
  // 获取原始解密Buffer
  const rawBuffer = aesEcbDecryptNoPadding(encryptedData, key);

  // 在Buffer中查找JSON起始位置 (寻找 '{"' 或 '[{' 的字节模式)
  let jsonStartByte = -1;

  // 查找 '{"' (0x7B 0x22)
  for (let i = 0; i < rawBuffer.length - 1; i++) {
    if (rawBuffer[i] === 0x7B && rawBuffer[i + 1] === 0x22) {
      jsonStartByte = i;
      break;
    }
  }

  // 如果没找到 '{"'，查找 '[{' (0x5B 0x7B)
  if (jsonStartByte === -1) {
    for (let i = 0; i < rawBuffer.length - 1; i++) {
      if (rawBuffer[i] === 0x5B && rawBuffer[i + 1] === 0x7B) {
        jsonStartByte = i;
        break;
      }
    }
  }

  if (jsonStartByte === -1) {
    throw new Error('No JSON data found in decrypted content');
  }

  // 从JSON起始位置提取Buffer
  const jsonBuffer = rawBuffer.subarray(jsonStartByte);

  // 找到JSON结束位置（移除尾部的null字节）
  let endByte = jsonBuffer.length;
  while (endByte > 0 && jsonBuffer[endByte - 1] === 0x00) {
    endByte--;
  }

  // 提取有效的JSON Buffer并转换为字符串
  const validJsonBuffer = jsonBuffer.subarray(0, endByte);
  const jsonStr = validJsonBuffer.toString('utf8');

  // 验证JSON有效性
  try {
    JSON.parse(jsonStr);
    return jsonStr;
  } catch (e) {
    // 如果直接解析失败，尝试智能提取完整结构
    return extractCompleteJson(jsonStr);
  }
}

/**
 * 提取完整的JSON结构
 */
function extractCompleteJson(jsonStr: string): string {
  let validJson = '';
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    validJson += char;

    if (!escaped && char === '"') {
      inString = !inString;
    } else if (!inString) {
      if (char === '{') braceCount++;
      else if (char === '}') braceCount--;
      else if (char === '[') bracketCount++;
      else if (char === ']') bracketCount--;
    }

    escaped = !escaped && char === '\\';

    // 如果JSON结构完整，尝试解析
    if (braceCount === 0 && bracketCount === 0 && validJson.length > 10) {
      try {
        JSON.parse(validJson);
        return validJson;
      } catch (e) {
        // 继续尝试
      }
    }
  }

  throw new Error('Failed to extract complete JSON structure');
}
