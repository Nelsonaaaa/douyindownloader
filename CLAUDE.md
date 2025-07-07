# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**抖音下载器（Douyin Downloader）** 是一个多平台媒体下载工具，支持抖音和小红书内容的无水印下载。项目采用策略模式设计，具有自动降级、智能重试等特性。

### 技术栈
- **后端**: Node.js + Express.js
- **前端**: 原生 HTML/CSS/JavaScript
- **核心库**: axios, cheerio, sharp, archiver
- **架构模式**: 策略模式、工厂模式

## 开发命令

```bash
# 安装依赖
npm install

# 开发模式（使用nodemon自动重启）
npm run dev

# 生产模式启动
npm start

# 服务管理（推荐用于生产环境）
./manage.sh start    # 启动服务
./manage.sh stop     # 停止服务
./manage.sh restart  # 重启服务
./manage.sh status   # 查看状态
./manage.sh log      # 查看日志
./manage.sh clean    # 清理服务进程和日志文件
```

## 重要配置 ⚠️

**端口配置统一**：
- package.json: 默认端口 3000  
- src/config/index.js: 默认端口 3003
- manage.sh: 端口 3003
- .env: PORT=3003

实际运行端口由 `src/config/index.js` 中的 `PORT` 环境变量或默认值决定（3003）。

## 核心架构

### 目录结构
```
/projects/douyindownloader/
├── public/                  # 前端静态资源
│   ├── index.html          # 主页面
│   ├── style.css           # 主样式
│   ├── universal-parser.js # 通用解析器前端逻辑
│   └── icons/              # 平台图标
├── src/
│   ├── config/             # 配置管理
│   │   └── index.js        # 统一配置（API密钥、端口等）
│   ├── routes/             # 路由层
│   │   ├── index.js        # 路由注册
│   │   └── api.js          # API路由实现
│   ├── services/           # 业务逻辑层
│   │   ├── parser/         # 解析器模块
│   │   │   ├── base.js     # 基础解析器类
│   │   │   ├── index.js    # 解析器工厂
│   │   │   └── strategies/ # 具体解析策略
│   │   │       ├── rapidapi.js    # RapidAPI策略
│   │   │       ├── mobile.js      # 移动端API策略
│   │   │       ├── webpage.js     # 网页解析策略
│   │   │       └── xiaohongshu.js # 小红书专用策略
│   │   ├── download.js     # 下载服务
│   │   └── imageProcessor.js # 图像处理服务
│   └── utils/              # 工具模块
│       ├── httpClient.js   # HTTP客户端封装
│       ├── userAgent.js    # User-Agent管理
│       ├── performanceMonitor.js # 性能监控
│       ├── smartStrategy.js # 智能重试策略
│       └── urlUtils.js     # URL处理工具
├── server.js               # 服务器入口
├── manage.sh               # 服务管理脚本
└── package.json            # 项目配置

```

### 解析器策略模式

项目使用策略模式实现多平台媒体解析，支持自动降级：

**解析器优先级**：
1. **RapidAPI解析** (`rapidapi.js`) - 最稳定的第三方API
2. **移动端API解析** (`mobile.js`) - 模拟移动端请求
3. **网页解析** (`webpage.js`) - 直接解析网页内容
4. **平台专用解析** (`xiaohongshu.js`) - 特定平台优化

当高优先级解析器失败时，自动切换到下一个策略。

### 核心功能特性

1. **智能平台识别**
   - 自动识别抖音/小红书链接
   - 支持多种URL格式
   - 智能提取视频ID

2. **高性能下载**
   - 流式下载，支持大文件
   - 智能重试机制
   - 并发控制，防止过载

3. **媒体处理**
   - 无水印视频下载
   - MP3音频提取
   - 图片批量下载（小红书）
   - ZIP打包功能

4. **错误处理**
   - 统一错误格式
   - 详细错误日志
   - 用户友好提示

## API端点说明

### 核心端点

- `POST /api/parse` - 通用链接解析
  ```json
  {
    "url": "https://v.douyin.com/xxxxx"
  }
  ```

- `POST /api/universal-parse` - 统一解析接口（推荐）
  ```json
  {
    "url": "分享链接",
    "options": {
      "preferredQuality": "high"
    }
  }
  ```

- `GET /api/download` - 文件下载代理
  - 参数: `url` (编码后的下载地址)
  - 参数: `filename` (可选，自定义文件名)

- `GET /api/image-proxy` - 图片代理（带缓存）
  - 参数: `url` (图片地址)

### 响应格式

成功响应：
```json
{
  "success": true,
  "data": {
    "platform": "douyin",
    "type": "video",
    "urls": {...},
    "info": {...}
  }
}
```

错误响应：
```json
{
  "success": false,
  "error": "错误描述"
}
```

## 环境变量配置

创建 `.env` 文件配置以下变量：

```bash
# API配置
RAPIDAPI_KEY=your_rapidapi_key
DOUYIN_RAPIDAPI_HOST=tiktok-douyin-xiaohongshu-weibo-instagram-api.p.rapidapi.com
XIAOHONGSHU_RAPIDAPI_HOST=tiktok-douyin-xiaohongshu-weibo-instagram-api.p.rapidapi.com

# 备用API（可选）
JUHE_API_KEY=your_juhe_key
APISPACE_TOKEN=your_apispace_token

# 服务器配置
PORT=3003
NODE_ENV=production
```

## 开发指南

### 添加新平台支持

1. **创建解析策略**
   ```javascript
   // src/services/parser/strategies/newplatform.js
   const BaseParser = require('../base');
   
   class NewPlatformParser extends BaseParser {
     async parse(url) {
       // 实现解析逻辑
     }
   }
   ```

2. **注册到工厂**
   ```javascript
   // src/services/parser/index.js
   registerParser('newplatform', NewPlatformParser);
   ```

3. **配置平台信息**
   ```javascript
   // src/config/index.js
   platforms: {
     newplatform: {
       domains: ['newplatform.com'],
       name: '新平台'
     }
   }
   ```

### 性能优化建议

1. **缓存策略**
   - 图片代理自带缓存
   - 可考虑添加Redis缓存解析结果

2. **并发控制**
   - 下载队列已实现
   - 可调整 `maxConcurrent` 参数

3. **错误重试**
   - SmartRetryStrategy 自动处理
   - 可自定义重试策略

### 调试技巧

1. **查看详细日志**
   ```bash
   NODE_ENV=development npm run dev
   ```

2. **监控性能**
   - 查看 `performanceMonitor.js` 输出
   - 使用 Chrome DevTools 分析前端

3. **测试解析器**
   ```javascript
   // 直接测试某个解析器
   const parser = new RapidApiParser();
   const result = await parser.parse(url);
   ```

## 部署建议

### 简单部署（推荐）

1. **使用manage.sh**
   ```bash
   # 后台启动
   ./manage.sh start
   
   # 查看状态
   ./manage.sh status
   ```

2. **使用PM2（可选）**
   ```bash
   pm2 start server.js --name douyin-downloader
   pm2 save
   pm2 startup
   ```

### 生产环境配置

1. **设置环境变量**
   ```bash
   export NODE_ENV=production
   export PORT=3003
   ```

2. **配置反向代理（Nginx）**
   ```nginx
   location / {
     proxy_pass http://localhost:3003;
     proxy_http_version 1.1;
     proxy_set_header Upgrade $http_upgrade;
     proxy_set_header Connection 'upgrade';
     proxy_set_header Host $host;
     proxy_cache_bypass $http_upgrade;
   }
   ```

3. **定期清理临时文件**
   ```bash
   # 添加到crontab
   0 2 * * * rm -rf /projects/douyindownloader/temp-images/*
   ```

## 常见问题

### Q: 解析失败怎么办？
A: 检查以下项：
1. API密钥是否配置正确
2. 网络连接是否正常
3. 查看日志了解具体错误
4. 尝试使用备用解析策略

### Q: 如何提高下载速度？
A: 
1. 增加并发下载数（修改 `maxConcurrent`）
2. 使用更快的网络
3. 启用图片缓存

### Q: 支持批量下载吗？
A: 目前不直接支持，但可以：
1. 前端实现批量提交
2. 后端添加任务队列

## 贡献指南

1. **代码风格**
   - 使用2空格缩进
   - 异步操作使用 async/await
   - 错误必须被捕获和处理

2. **提交规范**
   - feat: 新功能
   - fix: 修复bug
   - docs: 文档更新
   - refactor: 代码重构

3. **测试要求**
   - 新功能需要测试
   - 修改需要回归测试

## 许可证

MIT License

---

**注意**: 本工具仅供学习交流使用，请勿用于商业用途。下载内容版权归原作者所有。