const axios = require('axios');
const BaseParser = require('../base');
const { config } = require('../../../config');
const { generateMobileApiParams } = require('../../../utils/generators');
const { removeWatermark } = require('../../../utils/urlUtils');

class MobileApiParser extends BaseParser {
  constructor() {
    super('MobileAPI');
  }

  async parse(url, videoId) {
    try {
      console.log('使用移动端API解析方法...');
      
      const apiUrl = 'https://www.iesdouyin.com/aweme/v1/web/aweme/detail/';
      const { params, headers } = generateMobileApiParams(videoId);
      
      const response = await axios({
        method: 'GET',
        url: apiUrl,
        params: params,
        timeout: config.request.timeout,
        headers: headers
      });
      
      const data = response.data;
      if (!data.aweme_detail) {
        throw new Error('API返回数据格式错误');
      }
      
      const aweme = data.aweme_detail;
      if (!aweme.video) {
        throw new Error('未找到视频信息');
      }
      
      // 构造无水印视频地址 - 优先使用高清bit_rate
      let videoUrl = '';
      
      // 优先尝试从bit_rate数组获取高清视频
      if (aweme.video.bit_rate && aweme.video.bit_rate.length > 0) {
        const bitRateItem = aweme.video.bit_rate[0];
        if (bitRateItem.play_addr && bitRateItem.play_addr.url_list) {
          videoUrl = bitRateItem.play_addr.url_list[0];
          console.log('使用高清bit_rate视频URL:', videoUrl);
        }
      }
      
      // 如果bit_rate不可用，回退到原有方法
      if (!videoUrl && aweme.video.play_addr && aweme.video.play_addr.url_list) {
        videoUrl = aweme.video.play_addr.url_list[0];
        console.log('使用标准play_addr视频URL:', videoUrl);
      }
      
      if (videoUrl) {
        videoUrl = removeWatermark(videoUrl);
      } else {
        throw new Error('无法获取视频地址');
      }
      
      return this.normalizeResult({
        videoId: videoId,
        title: aweme.desc || '无标题',
        author: aweme.author?.nickname || '未知作者',
        videoUrl: videoUrl,
        cover: aweme.video.cover?.url_list?.[0] || '',
        duration: Math.floor((aweme.video.duration || 0) / 1000)
      }, videoId);
      
    } catch (error) {
      console.error('移动端API解析失败:', error.message);
      throw error;
    }
  }
}

module.exports = MobileApiParser;