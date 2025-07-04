const express = require('express');
const apiRoutes = require('./api');

const setupRoutes = (app) => {
  // API路由
  app.use('/api', apiRoutes);
  
  // 为后续小红书功能预留路由空间
  // app.use('/api/xiaohongshu', xiaohongshuRoutes);
  
  // 健康检查路由
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'douyin-downloader'
    });
  });
};

module.exports = setupRoutes;