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

module.exports = {
  fixChineseEncoding,
  generateSafeFilename
};