const express = require('express');
const router = express.Router();
const DouyinParser = require('../services/parser');
const XiaohongshuParserService = require('../services/parser/xiaohongshu');
const DownloadService = require('../services/download');
const ImageProcessor = require('../services/imageProcessor');
const { updateApiConfig } = require('../config');
const { isValidDouyinUrl } = require('../utils/validators');
const { extractDouyinUrl, cleanShareText } = require('../utils/textUtils');

// 创建解析器实例
const parser = new DouyinParser();
const xiaohongshuParser = new XiaohongshuParserService();
const imageProcessor = new ImageProcessor();

// 解析视频API - 支持移动端和PC端链接格式
router.post('/parse', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: '请提供有效的抖音链接' });
    }
    
    // 从分享文本中提取抖音链接
    const extractedUrl = extractDouyinUrl(url) || cleanShareText(url);
    
    if (!extractedUrl) {
      return res.status(400).json({ error: '未能从文本中提取到有效的抖音链接' });
    }
    
    // 验证是否为抖音链接
    if (!isValidDouyinUrl(extractedUrl)) {
      return res.status(400).json({ error: '请提供有效的抖音链接' });
    }
    
    console.log('原始输入:', url);
    console.log('提取的链接:', extractedUrl);
    
    const videoInfo = await parser.parse(extractedUrl);
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

// 新增：获取单个下载进度的HTTP轮询接口（备用方案）
router.get('/download-status/:downloadId', (req, res) => {
  try {
    const { downloadId } = req.params;
    
    // 从性能监控器获取下载状态
    const performanceReport = DownloadService.getPerformanceReport();
    const downloadInfo = performanceReport.downloads ? 
      performanceReport.downloads.find(d => d.downloadId === downloadId) : null;
    
    if (!downloadInfo) {
      return res.status(404).json({
        success: false,
        error: '下载任务不存在或已完成'
      });
    }
    
    res.json({
      success: true,
      data: {
        downloadId: downloadId,
        status: downloadInfo.status || 'unknown',
        progress: downloadInfo.progress || {},
        startTime: downloadInfo.startTime,
        duration: downloadInfo.duration
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== 统一智能解析API =====

// 统一智能解析入口 - 支持抖音和小红书
router.post('/universal-parse', async (req, res) => {
  try {
    const { input, platform } = req.body;
    
    if (!input || typeof input !== 'string') {
      return res.status(400).json({
        success: false,
        error: '请提供有效的输入内容'
      });
    }
    
    console.log('统一解析请求:', { input: input.substring(0, 100) + '...', platform });
    
    // 1. 智能平台检测
    const detectedPlatform = platform || detectPlatform(input);
    console.log('检测到平台:', detectedPlatform);
    
    // 2. 智能链接提取
    const extractedUrl = extractUrlByPlatform(input, detectedPlatform);
    console.log('提取的链接:', extractedUrl);
    
    // 3. 平台特定解析
    let result;
    if (detectedPlatform === 'douyin') {
      result = await parser.parse(extractedUrl);
    } else if (detectedPlatform === 'xiaohongshu') {
      result = await xiaohongshuParser.parse(input); // 小红书需要完整分享文本
    } else {
      throw new Error('不支持的平台或格式');
    }
    
    // 4. 统一格式返回
    const response = formatUniversalResponse(result, detectedPlatform);
    res.json(response);
    
  } catch (error) {
    console.error('统一解析错误:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      platform: null
    });
  }
});

// 平台检测函数
function detectPlatform(input) {
  const patterns = {
    douyin: [
      /v\.douyin\.com/i,
      /douyin\.com/i,
      /抖音/i,
      /看看.*作品/i,
      /复制打开抖音/i,
      /iesdouyin\.com/i
    ],
    xiaohongshu: [
      /xiaohongshu\.com/i,
      /xhslink/i,
      /小红书/i,
      /发现好内容/i,
      /发现美好，马上出发/i
    ]
  };

  for (const [platform, regexes] of Object.entries(patterns)) {
    if (regexes.some(regex => regex.test(input))) {
      return platform;
    }
  }
  
  throw new Error('不支持的平台，目前支持抖音和小红书');
}

// 按平台提取链接
function extractUrlByPlatform(input, platform) {
  // 首先使用统一的链接提取工具
  const { extractUrl } = require('../utils/urlUtils');
  const extractedUrl = extractUrl(input);
  
  // 验证提取的URL是否符合指定平台
  if (platform === 'douyin') {
    const douyinPatterns = [
      /v\.douyin\.com/i,
      /www\.douyin\.com/i,
      /www\.iesdouyin\.com/i
    ];
    if (douyinPatterns.some(pattern => pattern.test(extractedUrl))) {
      return extractedUrl;
    }
    
    // 回退到原有抖音提取方法
    const douyinUrl = extractDouyinUrl(input) || cleanShareText(input);
    if (douyinUrl) {
      return douyinUrl;
    }
  } else if (platform === 'xiaohongshu') {
    const xiaohongshuPatterns = [
      /xiaohongshu\.com/i,
      /xhslink\.com/i
    ];
    if (xiaohongshuPatterns.some(pattern => pattern.test(extractedUrl))) {
      return extractedUrl;
    }
  }

  throw new Error(`未在输入内容中找到有效的${platform === 'douyin' ? '抖音' : '小红书'}链接`);
}

// 统一响应格式化
function formatUniversalResponse(data, platform) {
  const baseResponse = {
    success: true,
    platform: platform,
    timestamp: Date.now()
  };

  if (platform === 'douyin') {
    return {
      ...baseResponse,
      data: {
        type: 'video',
        title: data.title || '无标题',
        author: {
          name: data.author || '未知作者',
          avatar: data.authorAvatar || null
        },
        thumbnail: data.cover || null,
        downloadUrls: {
          video: data.normalVideoUrl || data.videoUrl || null,
          videoHd: data.hdVideoUrl || null,
          audio: data.audioUrl || null
        },
        metadata: {
          duration: data.duration || null,
          platform: 'douyin'
        },
        rawData: data // 保留原始数据用于兼容性
      }
    };
  } else if (platform === 'xiaohongshu') {
    return {
      ...baseResponse,
      data: {
        type: 'video', // 仅支持视频类型
        title: data.title || '无标题',
        description: data.description || null,
        author: {
          name: data.author || '未知作者',
          avatar: data.authorAvatar || null
        },
        thumbnail: data.cover || null,
        downloadUrls: {
          video: data.videoUrl || null,
          audio: data.audioUrl || null
        },
        metadata: {
          tags: data.tags || [],
          stats: data.stats || {},
          platform: 'xiaohongshu'
        },
        rawData: data // 保留原始数据用于兼容性
      }
    };
  }

  return baseResponse;
}

// ===== 小红书相关API =====

// 小红书内容解析API（仅支持视频）
router.post('/xiaohongshu/parse', async (req, res) => {
  try {
    const { shareText } = req.body;
    
    if (!shareText) {
      return res.status(400).json({ error: '请提供小红书分享文本' });
    }
    
    const contentInfo = await xiaohongshuParser.parse(shareText);
    
    // 仅返回视频内容，过滤掉图文
    if (contentInfo.type !== 'video' && !contentInfo.videoUrl) {
      return res.status(400).json({ 
        error: '暂不支持小红书图文内容，仅支持视频下载' 
      });
    }
    
    res.json({
      success: true,
      data: contentInfo
    });
    
  } catch (error) {
    console.error('小红书解析错误:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 小红书视频下载API
router.post('/xiaohongshu/download-video', async (req, res) => {
  try {
    const { videoUrl, title } = req.body;
    
    if (!videoUrl) {
      return res.status(400).json({ error: '未找到视频下载链接' });
    }
    
    console.log('开始下载小红书视频:', videoUrl.substring(0, 100) + '...');
    
    // 使用已有的下载服务
    req.body.downloadUrl = videoUrl;
    await DownloadService.downloadVideo(req, res);
    
  } catch (error) {
    console.error('小红书视频下载失败:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: '视频下载失败: ' + error.message });
    }
  }
});

// 小红书笔记导出API
router.post('/xiaohongshu/export-note', (req, res) => {
  try {
    const { title, description, author, stats, tags } = req.body;
    
    if (!title && !description) {
      return res.status(400).json({ error: '没有可导出的笔记内容' });
    }
    
    // 生成笔记内容
    let noteContent = '=== 小红书笔记内容 ===\n\n';
    
    if (title) {
      noteContent += `标题: ${title}\n\n`;
    }
    
    if (author) {
      noteContent += `作者: ${author}\n\n`;
    }
    
    if (description) {
      noteContent += `内容:\n${description}\n\n`;
    }
    
    if (stats) {
      noteContent += '互动数据:\n';
      if (stats.likeCount) noteContent += `👍 点赞: ${stats.likeCount}\n`;
      if (stats.commentCount) noteContent += `💬 评论: ${stats.commentCount}\n`;
      if (stats.collectCount) noteContent += `⭐ 收藏: ${stats.collectCount}\n`;
      if (stats.shareCount) noteContent += `📤 分享: ${stats.shareCount}\n`;
      noteContent += '\n';
    }
    
    if (tags && tags.length > 0) {
      noteContent += `标签: ${tags.map(tag => `#${tag}`).join(' ')}\n\n`;
    }
    
    noteContent += `导出时间: ${new Date().toLocaleString()}\n`;
    noteContent += '\n--- 由觅安小红书助手导出 ---';
    
    // 生成文件名
    const filename = `xiaohongshu_note_${Date.now()}.txt`;
    
    // 设置响应头
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    
    // 发送文件内容
    res.send(noteContent);
    
  } catch (error) {
    console.error('笔记导出失败:', error.message);
    res.status(500).json({ error: '笔记导出失败: ' + error.message });
  }
});

// 小红书解析器状态API
router.get('/xiaohongshu/status', (req, res) => {
  try {
    const status = xiaohongshuParser.getStatus();
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

// 图片代理API - 解决防盗链问题
router.get('/xiaohongshu/proxy-image/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: '缺少图片URL参数' });
    }
    
    console.log('代理图片请求:', imageId, url);
    
    // 检查缓存目录
    const fs = require('fs');
    const path = require('path');
    const crypto = require('crypto');
    
    const tempDir = path.join(__dirname, '../../temp-images');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // 生成缓存文件名
    const urlHash = crypto.createHash('md5').update(url).digest('hex');
    const fileName = `${imageId}_${urlHash}.jpg`;
    const filePath = path.join(tempDir, fileName);
    
    // 如果文件已存在，直接返回
    if (fs.existsSync(filePath)) {
      console.log('返回缓存图片:', fileName);
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.sendFile(filePath);
    }
    
    // 下载图片
    const axios = require('axios');
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.xiaohongshu.com/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
      },
      timeout: 10000
    });
    
    // 保存到临时文件
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    console.log('图片下载完成:', fileName);
    
    // 返回图片
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.sendFile(filePath);
    
  } catch (error) {
    console.error('图片代理失败:', error.message);
    res.status(500).json({ error: '图片加载失败: ' + error.message });
  }
});

module.exports = router;