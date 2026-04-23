import { createCipheriv, createDecipheriv, createHash } from 'crypto';


/**
 * AES ECB 模式加密 (PKCS7Padding，兼容Java的PKCS5Padding)
 * @param plaintext 待加密的明文
 * @param key 密钥 (字符串)
 * @returns 加密后的十六进制字符串
 */
export function aesEcbEncrypt(
  plaintext: string,
  key: string,
  salt: string = ''
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

  if (salt) {
    const encryptedHex = encrypted.toString('hex');
    const saltedData = encryptedHex + salt;
    const md5Hash = createHash('md5').update(saltedData).digest('hex');
    return md5Hash + encryptedHex;
  }

  // 返回十六进制字符串
  return encrypted.toString('hex');
}

/**
 * AES ECB 模式解密 (NoPadding)
 * @param encryptedData 加密的数据 (十六进制字符串)
 * @param key 密钥 (字符串)
 * @returns 解密后的原始 Buffer
 */
export function aesEcbDecrypt(
  encryptedData: string,
  key: string
): string {
  // 确保密钥是 Buffer
  const keyBuffer = Buffer.from(key, 'utf8');

  // 检查密钥长度 (AES 需要 16/24/32 字节)
  if (![16, 24, 32].includes(keyBuffer.length)) {
    throw new Error('Invalid key length. Key must be 16, 24 or 32 bytes.');
  }

  // 将十六进制字符串转换为 Buffer
  const encryptedBuffer = Buffer.from(
    encryptedData.slice(32), // 去掉前32个字符 (加盐部分)
    'hex');

  // 检查数据长度 (必须是 16 字节的整数倍)
  if (encryptedBuffer.length % 16 !== 0) {
    throw new Error(
      `Invalid data length (${encryptedBuffer.length} bytes). ` +
      `Data length must be a multiple of 16 bytes.`
    );
  }

  // 创建解密器 - ECB 模式
  const decipher = createDecipheriv(`aes-${keyBuffer.length * 8}-ecb`, keyBuffer, null);

  // 解密数据
  const decrypted = Buffer.concat([
    decipher.update(encryptedBuffer),
    decipher.final()
  ]);

  return decrypted.toString('utf8')
}
