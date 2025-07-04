const RapidApiParser = require('./strategies/rapidapi');
const MobileApiParser = require('./strategies/mobile');
const WebPageParser = require('./strategies/webpage');
const { extractVideoId, getRealUrl } = require('../../utils/urlUtils');
const { isValidDouyinUrl } = require('../../utils/validators');

class DouyinParser {
  constructor() {
    // 解析策略按优先级排序
    this.strategies = [
      new RapidApiParser(),
      new MobileApiParser(),
      new WebPageParser()
    ];
  }

  // 主解析方法
  async parse(shareUrl) {
    try {
      console.log('开始解析抖音链接:', shareUrl);
      
      // 验证URL
      if (!isValidDouyinUrl(shareUrl)) {
        throw new Error('请提供有效的抖音链接');
      }

      // 获取可用的解析策略
      const availableStrategies = this.strategies.filter(strategy => strategy.isAvailable());
      
      if (availableStrategies.length === 0) {
        throw new Error('没有可用的解析服务，请检查API配置');
      }

      // 对于RapidAPI，直接使用原始URL
      const rapidApiStrategy = availableStrategies.find(s => s.name === 'RapidAPI');
      if (rapidApiStrategy) {
        try {
          console.log('使用RapidAPI直接解析，跳过URL重定向步骤...');
          const result = await rapidApiStrategy.parse(shareUrl, 'direct_api_call');
          return result;
        } catch (error) {
          console.log('RapidAPI失败，尝试其他方案:', error.message);
        }
      }

      // 其他策略需要先获取真实URL和视频ID
      const realUrl = await getRealUrl(shareUrl);
      const videoId = extractVideoId(realUrl);
      
      console.log('真实URL:', realUrl);
      console.log('视频ID:', videoId);

      // 尝试其他解析策略
      const otherStrategies = availableStrategies.filter(s => s.name !== 'RapidAPI');
      
      let lastError;
      for (const strategy of otherStrategies) {
        try {
          console.log(`尝试使用 ${strategy.name} 解析...`);
          const result = await strategy.parse(realUrl, videoId);
          console.log(`${strategy.name} 解析成功`);
          return result;
        } catch (error) {
          lastError = error;
          console.log(`${strategy.name} 解析失败:`, error.message);
        }
      }

      throw lastError || new Error('所有解析策略都失败了');
      
    } catch (error) {
      console.error('解析失败:', error.message);
      throw error;
    }
  }

  // 获取可用的解析策略信息
  getAvailableStrategies() {
    return this.strategies.map(strategy => ({
      name: strategy.name,
      available: strategy.isAvailable()
    }));
  }
}

module.exports = DouyinParser;