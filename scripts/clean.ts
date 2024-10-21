import fs from 'fs';
import path from 'path';

function deleteTsBuildInfoFiles(dir: string): void {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            deleteTsBuildInfoFiles(filePath);
        } else if (file === 'tsconfig.tsbuildinfo') {
            fs.unlinkSync(filePath);
            console.log(`Deleted: ${filePath}`);
        }
    });
}

const targetDirectory = process.cwd(); // 可以根据实际情况修改目标目录
deleteTsBuildInfoFiles(targetDirectory);
