// 验证是否为抖音链接
const isValidDouyinUrl = (url) => {
  return url.includes('douyin.com') || url.includes('v.douyin.com');
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