const fs = require('fs');
const path = require('path');

// 获取仓库中所有的README文件
function getAllReadmeFiles(gitDir, ignores) {

    // 遍历目录，查找README文件
    const readmeFiles = [];
    function checkIgnore(directory) {
        let abDir = path.resolve(directory)
        for (let ignoreDir of ignores) {
            if (abDir === path.resolve(ignoreDir)) {
                console.log("ignore: ", ignoreDir)
                return true
            }
        }
        return false
    }
    function traverseDirectory(directory) {
        const files = fs.readdirSync(directory);
        for (let file of files) {
            const filePath = path.join(directory, file);
            console.log(filePath)
            if (checkIgnore(filePath, ignores)) {
                continue
            }
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                if (!filePath.includes("node_modules")) {
                    traverseDirectory(filePath);
                }
            } else if (filePath.endsWith('tsconfig.tsbuildinfo')) {
                fs.unlink(filePath,(err)=>{
                    if(err){
                        console.error("unlinkFailed: "+filePath)
                    }else{
                        console.log("unlink Success: "+filePath)
                    }
                })
            }
        };
    }
    traverseDirectory(gitDir);
}

getAllReadmeFiles('../mykoishi/plugins', ["../mykoishi/plugins/Adapter/adapter-kritor"]);
