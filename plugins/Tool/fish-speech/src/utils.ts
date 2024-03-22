
import { Context } from 'koishi';
import { spawn } from 'child_process'
import { mkdirSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { } from 'koishi-plugin-ffmpeg'

export async function ffmpegConvert(ctx: Context, res: ArrayBuffer) {
    const executable = ctx?.ffmpeg?.executable ?? "ffmpeg"
    let tmpDir = resolve(process.cwd(), "data/fish-speech/")
    mkdirSync(tmpDir, { recursive: true })
    const child = spawn(executable, ["-i", "-", "-codec:a", "libmp3lame", `${tmpDir}/tmp.mp3`], { stdio: ['pipe', 'pipe', 'ignore'] });
    child.stdin.write(Buffer.from(res));
    child.stdin.end();
    return new Promise<Buffer>((resolve, reject) => {
        child.stdout.on('end', () => resolve(readFileSync(`${tmpDir}/tmp.mp3`)))
        child.stdout.on('error', reject)
    })
}