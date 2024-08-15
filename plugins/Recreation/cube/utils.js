import { readFileSync } from 'fs';

function isMusl() {
  try {
    const lddPath = require('child_process').execSync('which ldd').toString().trim()
    return readFileSync(lddPath, 'utf8').includes('musl')
  } catch (e) {
    return true
  }
}

export function getNativeBinding(platform, arch) {
  switch (platform) {
    case 'android':
      switch (arch) {
        case 'arm64':
          return ['cube.android-arm64.node', '@initencounter/cube-android-arm64']
        default:
          throw new Error(`Unsupported architecture on Android ${arch}`)
      }
    case 'win32':
      switch (arch) {
        case 'x64':
          return ['cube.win32-x64-msvc.node', '@initencounter/cube-win32-x64-msvc']
        case 'arm64':
          return ['cube.win32-arm64-msvc.node', '@initencounter/cube-win32-arm64-msvc']
        default:
          throw new Error(`Unsupported architecture on Windows: ${arch}`)
      }
    case 'darwin':
      switch (arch) {
        case 'x64':
          return ['cube.darwin-x64.node', '@initencounter/cube-darwin-x64']
        case 'arm64':
          return ['cube.darwin-arm64.node', '@initencounter/cube-darwin-arm64']
        default:
          throw new Error(`Unsupported architecture on macOS: ${arch}`)
      }
    case 'linux':
      if (isMusl()) {
        switch (arch) {
          case 'x64':
            return ['cube.linux-x64-musl.node', '@initencounter/cube-linux-x64-musl']
          default:
            throw new Error(`Unsupported architecture on Linux: ${arch}`)
        }
      } else {
        switch (arch) {
          case 'x64':
            return ['cube.linux-x64-gnu.node', '@initencounter/cube-linux-x64-gnu']
          case 'arm64':
            return ['cube.linux-arm64-gnu.node', '@initencounter/cube-linux-arm64-gnu']
          default:
            throw new Error(`Unsupported architecture on Linux: ${arch}`)
        }
      }
    default:
      throw new Error(`Unsupported OS: ${platform}, architecture: ${arch}`)
  }
}
