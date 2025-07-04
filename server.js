const express = require('express');
const cors = require('cors');
const path = require('path');
const { config } = require('./src/config');
const setupRoutes = require('./src/routes');

const app = express();
const PORT = config.server.port;

// 中间件
app.use(cors());
app.use(express.json({ charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf-8' }));
app.use(express.static('public'));

// 设置路由
setupRoutes(app);

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  res.status(500).json({
    success: false,
    error: '服务器内部错误'
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`抖音下载器服务器运行在 http://localhost:${PORT}`);
  console.log('支持的功能:');
  console.log('- 抖音视频解析与下载');
  console.log('- 无水印高清视频下载');
  console.log('- MP3音频提取下载');
  console.log('- 视频在线预览');
});