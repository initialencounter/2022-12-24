const fs = require('fs');
const path = require('path');

// 修改仓库中所有的tsconfig.json文件
function getAllReadmeFiles(gitDir, ignores) {

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
            if (checkIgnore(filePath, ignores)) {
                continue
            }
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                if (!filePath.includes("node_modules")) {
                    traverseDirectory(filePath);
                }
            } else if (filePath.endsWith('tsconfig.json')) {
                fs.writeFile(filePath,`{
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "lib",
    "target": "es2022",
    "module": "esnext",
    "declaration": true,
    "composite": true,
    "incremental": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "emitDeclarationOnly": true,
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "jsxImportSource": "@satorijs/element",
    "types": [
      "node",
      "yml-register/types"
    ]
  },
  "include": [
    "src"
  ]
}
`,(err)=>{
                    if(!err){
                        console.log(filePath,"修改成功！")
                    }
                  })
            }
        };
    }
    traverseDirectory(gitDir);
}

getAllReadmeFiles('../mykoishi/plugins', []);
