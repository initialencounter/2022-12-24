import { operations } from '@octokit/openapi-types'
import { createWriteStream, unlinkSync, writeFileSync } from 'fs'
import { mkdir } from 'fs/promises'
import AdmZip from 'adm-zip'
import axios from 'axios'
import zlib from 'zlib'
import tar from 'tar'

type ArtifactResult = operations['actions/list-workflow-run-artifacts']['responses'][200]['content']['application/json']


const downTist = [
    ['darwin', 'amd64'],
    ['darwin', 'arm64'],
    ['linux', 'amd64'],
    ['linux', 'arm64'],
    //   ['linux', 'arm'],
    //   ['linux', '386'],
    ['windows', 'amd64'],
    ['windows', 'arm64'],
    // ['windows', 'arm'],
    // ['windows', '386'],
]


function once<S extends unknown[], T>(callback: (...args: S) => Promise<T>) {
    let task: Promise<T> | null = null
    return (...args: S) => (task ??= callback(...args))
}


const getArtifacts = once(async (runId: number) => {
    const { data } = await axios.get<ArtifactResult>(`https://api.github.com/repos/Mrs4s/go-cqhttp/actions/runs/${runId}/artifacts`)
    return data.artifacts
})


async function downloadArtifact(cwd: string, platform: string, arch: string) {
    const artifacts = await getArtifacts(runId)
    const url = artifacts.find((artifact) => {
        return artifact.name === `${platform}_${arch}`
    })!.archive_download_url
    console.log(`downloading from ${url}`)
    const [{ data }] = await Promise.all([
        axios.get<ArrayBuffer>(url, {
            responseType: 'arraybuffer',
            headers: {
                Authorization: 'Bearer ' + '',
            },
        }),
        mkdir(cwd, { recursive: true }),
    ])
    const adm = new AdmZip(Buffer.from(data))
    const extension = platform === 'windows' ? '.exe' : ''
    const entry = adm.getEntry(`go-cqhttp_${platform}_${arch}${extension}`)
    if (platform === 'windows') {
        await compressZip(`${cwd}/go-cqhttp-${platform}-${arch}.zip`, entry!.getData())
    } else {
        await compressTar(`${cwd}/go-cqhttp-${platform}-${arch}.tar.gz`, entry!.getData())
    }
}
async function compressZip(filename: string, bufferData: Buffer) {
    const adm2 = new AdmZip()
    adm2.addFile(`go-cqhttp.exe`, bufferData)
    adm2.writeZip(filename)
}

async function compressTar(filename: string, bufferData: Buffer) {
    writeFileSync('go-cqhttp', bufferData)
    const tarStream = tar.c({ gzip: false }, ['go-cqhttp']);

    // 创建 tar.gz 文件并进行压缩
    const gzStream = createWriteStream(filename);
    tarStream.pipe(zlib.createGzip()).pipe(gzStream);
    gzStream.on('finish', () => {
        // 可选：删除临时文件
        unlinkSync('go-cqhttp');
    });
  }


// 调用示例
export const runId: number = 6457031884
const version = 'v1.1.1-dev-6ac7a8f'
mkdir(version)

async function main(){
for (var i of downTist) {
    let platform_const = i[0]
    let arch_const = i[1]
    await downloadArtifact(`./${version}`, platform_const, arch_const)

}}
main()
// downloadArtifact(__dirname, 'linux', 'arm64')