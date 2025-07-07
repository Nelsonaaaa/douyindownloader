# 🎬 抖音下载器 (Douyin Downloader)

一个功能强大的多平台媒体下载工具，支持抖音和小红书内容的无水印下载。采用智能解析策略，提供极简的用户体验。

## ✨ 特性

- 🚀 **多平台支持** - 支持抖音、小红书等主流平台
- 💎 **无水印下载** - 获取原始高清视频，无平台水印
- 🎵 **音频提取** - 支持将视频转换为MP3音频
- 📦 **批量处理** - 小红书图片批量下载并打包
- 🔄 **智能降级** - 多种解析策略自动切换
- ⚡ **高性能** - 流式下载、智能重试、并发控制
- 🎨 **极简界面** - 简洁美观的用户界面

## 🖼️ 界面预览

<details>
<summary>点击查看界面截图</summary>

主界面采用极简设计，自动识别平台：
- 清爽的渐变背景
- 智能链接识别
- 实时状态反馈
- 响应式设计

</details>

## 🚀 快速开始

### 环境要求

- Node.js >= 14.0
- npm >= 6.0

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/yourusername/douyindownloader.git
cd douyindownloader

# 2. 安装依赖
npm install

# 3. 配置环境变量（可选）
cp .env.example .env
# 编辑 .env 文件，添加你的API密钥

# 4. 启动服务
npm start
```

访问 http://localhost:3003 即可使用。

### 使用服务管理脚本

```bash
# 后台启动服务
./manage.sh start

# 查看服务状态
./manage.sh status

# 停止服务
./manage.sh stop

# 查看日志
./manage.sh log
```

## 📖 使用方法

### 基本使用

1. **抖音视频下载**
   - 复制抖音分享链接
   - 粘贴到输入框
   - 选择下载视频或音频

2. **小红书内容下载**
   - 复制小红书笔记链接
   - 自动识别图片/视频类型
   - 图片支持批量打包下载

### API使用

```javascript
// 解析视频
fetch('http://localhost:3003/api/universal-parse', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://v.douyin.com/xxxxx'
  })
})
```

详细API文档请参考 [CLAUDE.md](./CLAUDE.md#api端点说明)

## 🔧 配置说明

### 环境变量

创建 `.env` 文件：

```bash
# API密钥（可选，用于高级解析）
RAPIDAPI_KEY=your_rapidapi_key

# 服务配置
PORT=3003
NODE_ENV=production
```

### 高级配置

- **解析策略优先级**：在 `src/config/index.js` 中调整
- **并发下载数**：修改 `download.js` 中的 `maxConcurrent`
- **缓存设置**：配置图片代理缓存时间

## 🏗️ 项目架构

```
├── public/              # 前端资源
├── src/
│   ├── config/         # 配置管理
│   ├── routes/         # API路由
│   ├── services/       # 业务逻辑
│   │   ├── parser/     # 解析器（策略模式）
│   │   └── download.js # 下载服务
│   └── utils/          # 工具函数
├── server.js           # 服务入口
└── manage.sh           # 管理脚本
```

## 🤝 贡献

欢迎提交 Issue 或 Pull Request！

### 开发指南

```bash
# 开发模式（自动重启）
npm run dev

# 代码规范
- 使用 2 空格缩进
- 使用 async/await
- 保持代码简洁
```

## 📄 许可证

[MIT License](LICENSE)

## ⚠️ 免责声明

- 本工具仅供学习交流使用
- 请勿用于商业用途
- 下载内容版权归原作者所有
- 使用本工具产生的任何后果由使用者承担

## 🙏 致谢

感谢所有贡献者和使用者的支持！

---

如有问题或建议，请提交 [Issue](https://github.com/yourusername/douyindownloader/issues)。