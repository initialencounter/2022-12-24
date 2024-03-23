
import { Context } from 'koishi';
import { spawn } from 'child_process'
import { } from 'koishi-plugin-ffmpeg'


const codec = {
    mp3: 'libmp3lame',
    flac: 'flac',
    ac3: 'ac3',
}
export async function ffmpegConvert(ctx: Context, res: ArrayBuffer, mime: string = 'mp3') {
    const executable = ctx?.ffmpeg?.executable ?? "ffmpeg"
    const child = spawn(executable, ["-i", "-", "-c:a", codec[mime], '-f', 's16le', '-'], { stdio: ['pipe'] });
    child.stdin.write(Buffer.from(res));
    child.stdin.end();
    return new Promise<Buffer>((resolve, reject) => {
        let buffer = []
        child.stdout.on('data', data => buffer.push(data))
        child.stdout.on('end', () => resolve(Buffer.concat(buffer)))
        child.stdout.on('error', reject)
    })
}