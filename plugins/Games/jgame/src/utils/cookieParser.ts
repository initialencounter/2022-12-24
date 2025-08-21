export class CookieParser {
  /**
   * 获取 cookie 值（最佳实践）
   */
  static getCookieValue(cookieString: string, key: string): string | null {
    // 参数验证
    if (typeof cookieString !== 'string' || typeof key !== 'string') {
      return null;
    }

    if (!cookieString || !key) {
      return null;
    }

    // 使用正则表达式提高性能
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|;\\s*)${escapedKey}=([^;]*)`);
    const match = cookieString.match(regex);

    if (!match) {
      return null;
    }

    try {
      return decodeURIComponent(match[2]);
    } catch {
      // 如果解码失败，返回原始值
      return match[2];
    }
  }

  /**
   * 获取多个 cookie 值
   */
  static getMultipleCookieValues(
    cookieString: string,
    keys: string[]
  ): Record<string, string | null> {
    const result: Record<string, string | null> = {};

    for (const key of keys) {
      result[key] = this.getCookieValue(cookieString, key);
    }

    return result;
  }
}
