# koishi-plugin-paddlespeech-finetune

[![npm](https://img.shields.io/npm/v/koishi-plugin-paddlespeech-finetune?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-paddlespeech-finetune)

将[PaddleSpeech克隆的声音](https://aistudio.baidu.com/aistudio/projectdetail/6406138?forkThirdPart=1)接入 Koishi

# 本地部署（参考自[向南](https://zhuanlan.zhihu.com/p/587765776)）

- 1.克隆本项目
    ```
    git clone https://github.com/initialencounter/PaddleSpeech
    ```
- 2.安装 PaddlePaddle
    >如何安装 paddlepaddle 请参考飞桨官网，按照自己的系统环境，安装对应版本即可
    - 使用 pip 安装 PaddlePaddle
        ```pip install paddlespeech --upgrade -i https://pypi.tuna.tsinghua.edu.cn/simple```

- 3.从Aistudio上下载训练好的模型
    将这两个文件下载，放到model目录
    ![alt 要下载的模型文件](./models.png)


- 4.启动[接口](./work/app.py)
    ```
    python app.py
    ```

- 5.安装 Koishi 插件 
    - 插件市场搜索 paddlespeech-finetune 
    或
    ```
    npm i koishi-plugin-paddlespeech-finetune
    ```
## 问题反馈
* QQ群：399899914<br>
* 小伙伴如果遇到问题或者有新的想法，欢迎到[这里](https://github.com/initialencounter/mykoishi/issues)反馈哦~
