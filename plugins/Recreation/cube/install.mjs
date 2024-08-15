import { existsSync, mkdirSync } from 'fs';
import envPaths from 'env-paths';
import { join } from 'path';
import { extract } from 'tar'
import get from 'get-registry'
import axios from 'axios'
import { getNativeBinding } from './utils.js'

const version = '0.2.2'
const { platform, arch } = process





// Fork from https://github.com/koishijs/node-gocqhttp/blob/master/src/install.ts
export async function download(basename, moduleName, version, cwd) {
  const registry = (await get()).replace(/\/$/, '')
  mkdirSync(cwd, { recursive: true })
  const url = `${registry}/${moduleName}/-/${moduleName.replace('@initencounter/', '')}-${version}.tgz`
  const { data: readable } = await axios.get(url, { responseType: 'stream' })

  const writable = extract({ cwd, newer: true, strip: 1 }, ['package/' + basename])
  await new Promise((resolve, reject) => {
    writable.on('close', resolve)
    writable.on('error', reject)
    readable.on('error', reject)
    readable.pipe(writable)
  })
}

let [name, moduleName] = getNativeBinding(platform, arch)
let storingDir = join(envPaths('initencounter_cube').data, version)
let storingPath = join(storingDir, name)


if (!existsSync(storingPath)) {
  download(name, moduleName, version, storingDir)
}
