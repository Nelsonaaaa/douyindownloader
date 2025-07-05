// 验证是否为抖音链接 - 支持移动端和PC端格式
const isValidDouyinUrl = (url) => {
  const douyinPatterns = [
    /https?:\/\/v\.douyin\.com\/[^\s\/]+/,           // v.douyin.com短链接
    /https?:\/\/www\.douyin\.com\/video\/\d+/,       // 完整抖音链接
    /https?:\/\/www\.iesdouyin\.com\/share\/video/,  // 分享链接
    /douyin\.com/,                                   // 通用douyin.com检查
    /v\.douyin\.com/                                 // v.douyin.com检查
  ];
  
  return douyinPatterns.some(pattern => pattern.test(url));
};

// 验证是否为小红书链接（为后续功能预留）
const isValidXiaohongshuUrl = (url) => {
  return url.includes('xiaohongshu.com') || url.includes('xhslink.com');
};

// 根据URL判断平台类型
const getPlatformType = (url) => {
  if (isValidDouyinUrl(url)) {
    return 'douyin';
  }
  if (isValidXiaohongshuUrl(url)) {
    return 'xiaohongshu';
  }
  return 'unknown';
};

// 验证解析结果是否有效
const isValidParseResult = (result) => {
  return result && 
         result.videoId && 
         result.title && 
         (result.videoUrl || (result.downloadLinks && result.downloadLinks.length > 0));
};

module.exports = {
  isValidDouyinUrl,
  isValidXiaohongshuUrl,
  getPlatformType,
  isValidParseResult
};