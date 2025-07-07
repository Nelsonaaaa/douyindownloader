const axios = require('axios');
const { getRandomUserAgent } = require('./userAgent');

// 提取视频ID
const extractVideoId = (url) => {
  const patterns = [
    /video\/(\d+)/,
    /\/(\d+)\?/,
    /\/(\d+)$/,
    /modal_id=(\d+)/,
    /aweme_id=(\d+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  throw new Error('无法从URL提取视频ID');
};

// 获取真实URL（处理重定向）
const getRealUrl = async (shareUrl) => {
  try {
    const response = await axios({
      method: 'GET',
      url: shareUrl,
      maxRedirects: 10,
      timeout: 10000,
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': '*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Cache-Control': 'no-cache'
      },
      validateStatus: () => true
    });
    
    return response.request.res.responseUrl || response.config.url;
  } catch (error) {
    throw new Error('获取真实URL失败: ' + error.message);
  }
};

// 从URL提取视频ID的备用方法
const extractVideoIdFromUrl = (url) => {
  const patterns = [
    /video\/(\d+)/,
    /\/(\d+)\?/,
    /\/(\d+)$/,
    /modal_id=(\d+)/,
    /aweme_id=(\d+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return 'unknown_' + Date.now();
};

// 去除水印URL处理
const removeWatermark = (videoUrl) => {
  return videoUrl
    .replace('playwm', 'play')
    .replace('watermark=1', 'watermark=0')
    .replace('/playwm/', '/play/')
    .replace('&watermark=1', '&watermark=0');
};

// 从分享文本中提取纯URL
const extractUrl = (shareText) => {
  console.log('开始提取URL，原始输入:', shareText);
  
  // 抖音URL匹配模式
  const douyinPatterns = [
    /https?:\/\/v\.douyin\.com\/[A-Za-z0-9\-_]+/g,
    /https?:\/\/www\.iesdouyin\.com\/[^\\s]+/g,
    /https?:\/\/www\.douyin\.com\/[^\\s]+/g
  ];
  
  // 小红书URL匹配模式  
  const xiaohongshuPatterns = [
    /https?:\/\/xhslink\.com\/[A-Za-z0-9]+/g,
    /https?:\/\/www\.xiaohongshu\.com\/[^\\s]+/g
  ];
  
  const allPatterns = [...douyinPatterns, ...xiaohongshuPatterns];
  
  for (const pattern of allPatterns) {
    const matches = shareText.match(pattern);
    if (matches && matches.length > 0) {
      const url = matches[0];
      console.log('提取到URL:', url);
      return url;
    }
  }
  
  // 如果没有匹配到完整URL，检查是否本身就是URL
  const urlPattern = /^https?:\/\/[^\s]+/;
  if (urlPattern.test(shareText.trim())) {
    console.log('输入本身就是URL:', shareText.trim());
    return shareText.trim();
  }
  
  console.log('未找到有效URL，返回原始输入');
  return shareText;
};

module.exports = {
  extractVideoId,
  getRealUrl,
  extractVideoIdFromUrl,
  removeWatermark,
  extractUrl
};