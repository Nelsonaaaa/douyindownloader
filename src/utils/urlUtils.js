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

module.exports = {
  extractVideoId,
  getRealUrl,
  extractVideoIdFromUrl,
  removeWatermark
};