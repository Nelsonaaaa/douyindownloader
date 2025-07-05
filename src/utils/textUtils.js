// 修复中文编码问题
const fixChineseEncoding = (title) => {
  if (!title) return '无标题';
  
  try {
    // 尝试多种编码修复方法
    if (title.includes('å') || title.includes('è') || title.includes('ï¼')) {
      // 这是常见的UTF-8乱码，尝试修复
      title = Buffer.from(title, 'latin1').toString('utf8');
    }
    
    // 如果还是乱码，尝试另一种方法
    if (title.includes('å') || title.includes('è')) {
      title = decodeURIComponent(escape(title));
    }
    
    // 清理特殊字符，保留中文、英文、数字、常用符号
    title = title.replace(/[^\w\s\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\u30a0-\u30ff\-\#\@\!\?\.\,\(\)\[\]\{\}]/g, '');
    
  } catch (e) {
    console.log('标题解码失败，使用默认标题');
    title = '抖音视频';
  }
  
  // 限制标题长度
  if (title.length > 50) {
    title = title.substring(0, 50) + '...';
  }
  
  return title || '无标题';
};

// 生成安全的文件名
const generateSafeFilename = (title, extension = '') => {
  const cleanTitle = fixChineseEncoding(title)
    .substring(0, 50)
    .replace(/[^\w\s\u4e00-\u9fff-]/g, '') // 保留中文字符
    .replace(/\s+/g, '_');
  
  const timestamp = Date.now();
  return `${cleanTitle}_${timestamp}${extension}`;
};

// 从分享文本中提取抖音链接
const extractDouyinUrl = (shareText) => {
  if (!shareText) return null;
  
  // 移动端格式: 9.48 复制打开抖音，看看【作品】内容... https://v.douyin.com/xxx/ 其他文本
  // PC端格式: 4.30 N@w.sr 10/09 HVY:/ 内容 https://v.douyin.com/xxx/ 复制此链接...
  const douyinMatch = shareText.match(/(https?:\/\/v\.douyin\.com\/[^\s\/]+)/);
  
  if (douyinMatch) {
    return douyinMatch[1];
  }
  
  // 兼容其他douyin.com链接
  const generalMatch = shareText.match(/(https?:\/\/[^\s]*douyin\.com[^\s]*)/);
  if (generalMatch) {
    return generalMatch[1];
  }
  
  return null;
};

// 清理分享文本中的链接
const cleanShareText = (text) => {
  if (!text) return '';
  
  // 提取抖音链接
  const url = extractDouyinUrl(text);
  return url || text.trim();
};

module.exports = {
  fixChineseEncoding,
  generateSafeFilename,
  extractDouyinUrl,
  cleanShareText
};