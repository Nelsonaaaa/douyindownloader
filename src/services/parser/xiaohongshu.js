const XiaohongshuParser = require('./strategies/xiaohongshu');
const { isValidXiaohongshuUrl } = require('../../utils/validators');

class XiaohongshuParserService {
  constructor() {
    this.parser = new XiaohongshuParser();
  }

  // 主解析方法
  async parse(shareText) {
    try {
      console.log('开始解析小红书内容:', shareText);
      
      // 验证是否为小红书链接
      if (!this.isValidShareText(shareText)) {
        throw new Error('请提供有效的小红书分享文本');
      }

      // 检查解析器是否可用
      if (!this.parser.isAvailable()) {
        throw new Error('小红书解析服务暂时不可用，请检查API配置');
      }

      // 执行解析
      const result = await this.parser.parse(shareText);
      
      console.log('小红书解析成功:', result.title);
      return result;
      
    } catch (error) {
      console.error('小红书解析失败:', error.message);
      throw error;
    }
  }

  // 验证分享文本
  isValidShareText(shareText) {
    if (!shareText || typeof shareText !== 'string') {
      return false;
    }
    
    // 检查是否包含小红书相关关键词
    const keywords = [
      'xiaohongshu.com',
      'xhslink.com', 
      '小红书',
      'discovery/item'
    ];
    
    return keywords.some(keyword => shareText.includes(keyword));
  }

  // 从分享文本中提取URL
  extractUrlFromShareText(shareText) {
    const urlMatch = shareText.match(/(https?:\/\/[^\s]+)/);
    return urlMatch ? urlMatch[1] : null;
  }

  // 获取解析器状态
  getStatus() {
    return {
      name: 'Xiaohongshu Parser',
      available: this.parser.isAvailable(),
      version: '1.0.0'
    };
  }
}

module.exports = XiaohongshuParserService;