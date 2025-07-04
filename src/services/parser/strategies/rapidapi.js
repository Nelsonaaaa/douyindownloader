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
      console.log('使用RapidAPI官方解析方法...');
      console.log('原始URL:', originalUrl);
      
      const encodedUrl = encodeURIComponent(originalUrl);
      const apiUrl = `${config.apis.rapidapi.url}?url=${encodedUrl}`;
      
      const response = await axios({
        method: 'GET',
        url: apiUrl,
        headers: {
          'X-RapidAPI-Key': config.apis.rapidapi.key,
          'X-RapidAPI-Host': config.apis.rapidapi.host,
          'Accept': 'application/json',
          'Accept-Charset': 'utf-8'
        },
        timeout: config.request.timeout,
        responseType: 'json',
        responseEncoding: 'utf8'
      });
      
      console.log('RapidAPI响应:', JSON.stringify(response.data, null, 2));
      
      if (response.data && response.data.status === 'success' && response.data.data) {
        const data = response.data.data;
        
        // 获取下载链接
        let downloadLinks = data.download_links || [];
        
        const videoUrl = this.selectBestVideoLink(downloadLinks);
        if (!videoUrl) {
          throw new Error('未找到有效的视频下载链接');
        }
        
        // 修复标题编码
        const title = fixChineseEncoding(data.title);
        
        // 获取音频链接
        const audioUrl = this.selectAudioLink(downloadLinks);

        return this.normalizeResult({
          videoId: data.tiktok_id || videoId,
          title: title,
          author: response.data.author || '未知作者',
          videoUrl: videoUrl,
          cover: data.thumbnail || '',
          duration: 0,
          downloadLinks: downloadLinks,
          normalVideoUrl: videoUrl,
          audioUrl: audioUrl
        }, videoId);
      }
      
      throw new Error('RapidAPI返回数据格式不正确: ' + JSON.stringify(response.data));
      
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