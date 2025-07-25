import { createHash } from 'crypto';

export function computeMD5(str: string, salt: string = ""): string {
  if (!str) {
    return "";
  }

  try {
    const hash = createHash('md5');
    hash.update(str + salt);
    return hash.digest('hex');
  } catch (error) {
    console.error("MD5 计算失败:", error);
    return "";
  }
}
