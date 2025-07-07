const axios = require('axios');
const BaseParser = require('../base');
const { config, isApiConfigured } = require('../../../config');
const { fixChineseEncoding } = require('../../../utils/textUtils');

class RapidApiParser extends BaseParser {
  constructor() {
    super('RapidAPI');
  }

  isAvailable() {
    return isApiConfigured('rapidapi');
  }

  async parse(originalUrl, videoId) {
    try {
      console.log('使用新版RapidAPI v3解析方法...');
      console.log('原始URL:', originalUrl);
      
      const encodedUrl = encodeURIComponent(originalUrl);
      const apiUrl = `${config.apis.rapidapi.url}?share_url=${encodedUrl}`;
      
      const response = await axios({
        method: 'GET',
        url: apiUrl,
        headers: {
          'x-rapidapi-key': config.apis.rapidapi.key,
          'x-rapidapi-host': config.apis.rapidapi.host,
          'Authorization': config.apis.rapidapi.auth,
          'Accept': 'application/json'
        },
        timeout: config.request.timeout,
        responseType: 'json'
      });
      
      console.log('RapidAPI v3响应:', JSON.stringify(response.data, null, 2));
      
      if (response.data && response.data.code === 200 && response.data.data) {
        const data = response.data.data;
        
        // 从新API结构获取视频URL - 使用bit_rate优先
        let videoUrl = '';
        if (data.aweme_detail && data.aweme_detail.video) {
          const video = data.aweme_detail.video;
          
          // 优先使用bit_rate高清视频
          if (video.bit_rate && video.bit_rate.length > 0) {
            const bitRateItem = video.bit_rate[0];
            if (bitRateItem.play_addr && bitRateItem.play_addr.url_list) {
              videoUrl = bitRateItem.play_addr.url_list[0];
            }
          }
          
          // 回退到标准play_addr
          if (!videoUrl && video.play_addr && video.play_addr.url_list) {
            videoUrl = video.play_addr.url_list[0];
          }
        }
        
        if (!videoUrl) {
          throw new Error('未找到有效的视频下载链接');
        }
        
        // 获取标题和作者信息
        const title = fixChineseEncoding(data.aweme_detail?.desc || '无标题');
        const author = data.aweme_detail?.author?.nickname || '未知作者';
        const cover = data.aweme_detail?.video?.cover?.url_list?.[0] || '';
        const duration = Math.floor((data.aweme_detail?.video?.duration || 0) / 1000);

        return this.normalizeResult({
          videoId: data.aweme_detail?.aweme_id || videoId,
          title: title,
          author: author,
          videoUrl: videoUrl,
          cover: cover,
          duration: duration
        }, videoId);
      }
      
      throw new Error('RapidAPI v3返回数据格式不正确: ' + JSON.stringify(response.data));
      
    } catch (error) {
      console.error('RapidAPI解析失败:', error.message);
      if (error.response) {
        console.error('错误状态:', error.response.status);
        console.error('错误详情:', error.response.data);
      }
      throw error;
    }
  }
}

module.exports = RapidApiParser;