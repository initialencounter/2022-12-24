# 扫雷社区论坛 - 只读版本

这是一个基于Vue 3的只读论坛应用，用于浏览扫雷社区的游戏帖子和评论。数据从闭源的游戏服务器获取。

## 功能特性

- 📱 响应式设计，支持移动端和桌面端
- 🔍 帖子搜索功能
- 📄 帖子列表浏览（最新、热门、关注）
- 👁️ 帖子详情查看
- 💬 评论浏览
- 🎮 游戏记录展示
- 🏷️ 标签系统

## 技术栈

- Vue 3 + TypeScript
- Vue Router
- Vite
- Pinia (状态管理)

## 项目结构

```
src/
├── components/          # 可复用组件
│   ├── NavBar.vue      # 导航栏
│   └── PostCard.vue    # 帖子卡片
├── views/              # 页面组件
│   ├── HomeView.vue    # 首页
│   ├── PostDetailView.vue # 帖子详情页
│   └── SearchView.vue  # 搜索页
├── api/                # API接口
│   └── index.ts        # API调用封装
├── types/              # TypeScript类型定义
├── utils/              # 工具函数
├── router/             # 路由配置
└── App.vue             # 根组件
```

## 安装和运行

### 1. 安装依赖
```bash
npm install
```

### 2. 开发模式运行
```bash
npm run dev
```

应用将在 http://localhost:5173 启动。

### 3. 构建生产版本
```bash
npm run build
```

## API配置

应用需要后端代理来访问游戏服务器API。默认配置假设后端运行在 `http://localhost:3000`。

如果需要修改API地址，请更新 `vite.config.ts` 中的代理配置：

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://your-backend-server:port',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  }
}
```

## 注意事项

1. 这是一个只读论坛，用户无法发布新帖子或评论
2. 所有数据从游戏服务器实时获取
3. 应用需要有效的后端代理才能正常工作
4. 请确保后端服务器正确处理API请求的加密和认证

## 开发说明

- 使用Vue 3 Composition API
- 使用TypeScript进行类型安全开发
- 组件采用单文件组件(SFC)格式
- 样式使用Scoped CSS

## 许可证

本项目仅供学习和演示使用。