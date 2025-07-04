const express = require('express');
const router = express.Router();
const DouyinParser = require('../services/parser');
const DownloadService = require('../services/download');
const { updateApiConfig } = require('../config');

// 创建解析器实例
const parser = new DouyinParser();

// 解析视频API
router.post('/parse', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: '请提供有效的抖音链接' });
    }
    
    // 验证是否为抖音链接
    if (!url.includes('douyin.com') && !url.includes('v.douyin.com')) {
      return res.status(400).json({ error: '请提供有效的抖音链接' });
    }
    
    const videoInfo = await parser.parse(url);
    res.json({
      success: true,
      data: videoInfo
    });
    
  } catch (error) {
    console.error('解析错误:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 配置管理API
router.post('/config', (req, res) => {
  try {
    const { rapidApiKey, rapidApiHost, juheKey, apiSpaceToken } = req.body;
    
    updateApiConfig({
      rapidApiKey,
      rapidApiHost,
      juheKey,
      apiSpaceToken
    });
    
    res.json({
      success: true,
      message: 'API配置已更新！现在可以正常使用付费解析服务了。'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '配置保存失败: ' + error.message
    });
  }
});

// 下载视频API
router.post('/download-video', (req, res) => {
  DownloadService.downloadVideo(req, res);
});

// 下载音频API
router.post('/download-audio', (req, res) => {
  DownloadService.downloadAudio(req, res);
});

// 获取可用解析策略API
router.get('/strategies', (req, res) => {
  const strategies = parser.getAvailableStrategies();
  res.json({
    success: true,
    data: strategies
  });
});

// 新增：获取下载性能报告API
router.get('/performance', (req, res) => {
  try {
    const report = DownloadService.getPerformanceReport();
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 新增：获取下载队列状态API
router.get('/queue-status', (req, res) => {
  try {
    const status = DownloadService.getQueueStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;