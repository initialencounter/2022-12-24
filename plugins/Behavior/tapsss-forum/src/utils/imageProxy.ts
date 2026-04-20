const isDev = import.meta.env.DEV

const IMAGE_PROXY_BASE = isDev ? '/api/image-proxy' : '/image-proxy'

/**
 * 将远程图片 URL 转换为代理 URL（服务端缓存 + 浏览器长期缓存）
 * 本地 URL（以 / 开头或相对路径）不做转换
 */
export function proxyImageUrl(url: string | null | undefined): string {
  if (!url) return '/Z7.png'
  // 本地资源不做代理
  if (!url.startsWith('http://') && !url.startsWith('https://')) return url
  return `${IMAGE_PROXY_BASE}?url=${encodeURIComponent(url)}`
}
