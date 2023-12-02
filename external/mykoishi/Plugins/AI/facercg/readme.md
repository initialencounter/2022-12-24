<a name="readme-top"></a>

# koishi-plugin-facercg

[![npm](https://img.shields.io/npm/v/koishi-plugin-facercg?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-facercg)

框架：[koishi](https://koishi.chat)

颜值评分,[百度智能云](https://console.bce.baidu.com/ai/#/ai/face/overview/index)
[![npm](https://img.shields.io/npm/v/koishi-plugin-facercg?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-facercg)


##自建服务端教程

* 安装并配置conda


[全网最完美Conda安装及使用教程](https://zhuanlan.zhihu.com/p/506718223) --by 吕强强学生信


关闭自动启动虚拟环境
```
conda config --set auto_activate_base false
```

* 创建虚拟环境
```
conda create -n face python=3.10
```
* 启动虚拟环境
```
conda activate face

```
* 安装opencv-python
```
pip install opencv-python
```
* 安装dlib
```
conda install -c conda-forge dlib
```
* 安装 pillow
```
pip install pillow
```
* 安装 joblib
```
pip install joblib
```
* 安装 scikit-learn
```
pip install scikit-learn
```
* 安装 fastapi
```
pip install fastapi
```
* 安装 uvicorn
```
pip install uvicorn
```
* 安装 requests
```
pip install requests
```
* 克隆项目
```
git clone https://github.com/initialencounter/beauty-predict-server.git
```
* 下载模型

将[shape_predictor_68_face_landmarks.dat](https://github.com/initialencounter/beauty-predict-server/releases/download/model-file/shape_predictor_68_face_landmarks.dat)放到beauty-predict-server/model目录


将[features_ALL.txt](https://github.com/initialencounter/beauty-predict-server/releases/download/model-file/features_ALL.txt)放到beauty-predict-server/data目录

* 启动服务 
```
cd beauty-predict-server
uvicorn main:app --host '0.0.0.0' --port 8080 --reload
```

### 效果展示
![alt 结果](https://gchat.qpic.cn/gchatpic_new/3118087750/538771440-2665118274-30C4D603688BF100BAB5551750874A74/0?term=3&amp;is_origin=0)


<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

反馈群399899914

[作者b站](https://space.bilibili.com/225995995)

<p align="right">(<a href="#readme-top">back to top</a>)</p>