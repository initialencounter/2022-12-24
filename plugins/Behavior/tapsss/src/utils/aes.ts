import { createCipheriv, createDecipheriv } from 'crypto';


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
  if (!plaintext) return '';
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
  let jsonStartByte = 0;


  // 从JSON起始位置提取Buffer
  const jsonBuffer = rawBuffer.subarray(jsonStartByte);

  // 找到JSON结束位置（移除尾部的null字节）
  let endByte = jsonBuffer.length;
  while (endByte > 0 && jsonBuffer[endByte - 1] === 0x00) {
    endByte--;
  }

  // 提取有效的JSON Buffer并转换为字符串
  const validJsonBuffer = jsonBuffer.subarray(0, endByte);
  let jsonStr = validJsonBuffer.toString('utf8');

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr.slice(i, i + 4);
    if (char === 'rl":') {
      jsonStr = '{"url":' + jsonStr.slice(i + 4);
      break;
    }
  }

  // 清理字符串 - 移除可能的问题字符
  jsonStr = jsonStr
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // 移除控制字符
  // .replace(/\0/g, '') // 移除null字符
  // .replace('/\\u000[a-f]/g', '')
  // .replace('/\\u000\d/g', '')

  return jsonStr;
}
