const axios = require('axios');
const cheerio = require('cheerio');
const BaseParser = require('../base');
const { config } = require('../../../config');
const { getRandomUserAgent } = require('../../../utils/userAgent');
const { removeWatermark } = require('../../../utils/urlUtils');

class WebPageParser extends BaseParser {
  constructor() {
    super('WebPage');
  }

  async parse(realUrl, videoId) {
    try {
      console.log('使用网页爬取解析方法...');
      
      const response = await axios({
        method: 'GET',
        url: realUrl,
        timeout: config.request.timeout,
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9',
          'Cache-Control': 'no-cache'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // 查找页面中的JSON数据
      const scripts = $('script');
      let videoData = null;
      
      scripts.each((i, script) => {
        const scriptText = $(script).html();
        if (scriptText && scriptText.includes('aweme_detail')) {
          try {
            // 提取JSON数据
            const jsonMatch = scriptText.match(/window\._ROUTER_DATA\s*=\s*({.*?});/);
            if (jsonMatch) {
              const data = JSON.parse(jsonMatch[1]);
              if (data.loaderData && data.loaderData.video_detail) {
                videoData = data.loaderData.video_detail.aweme_detail;
              }
            }
          } catch (e) {
            // 继续尝试其他script
          }
        }
      });
      
      if (!videoData || !videoData.video) {
        throw new Error('网页中未找到视频数据');
      }
      
      // 优先尝试从bit_rate数组获取高清视频
      let videoUrl = '';
      
      if (videoData.video.bit_rate && videoData.video.bit_rate.length > 0) {
        const bitRateItem = videoData.video.bit_rate[0];
        if (bitRateItem.play_addr && bitRateItem.play_addr.url_list) {
          videoUrl = bitRateItem.play_addr.url_list[0];
          console.log('使用高清bit_rate视频URL:', videoUrl);
        }
      }
      
      // 如果bit_rate不可用，回退到原有方法
      if (!videoUrl && videoData.video.play_addr && videoData.video.play_addr.url_list) {
        videoUrl = videoData.video.play_addr.url_list[0];
        console.log('使用标准play_addr视频URL:', videoUrl);
      }
      
      if (videoUrl) {
        videoUrl = removeWatermark(videoUrl);
      } else {
        throw new Error('无法从网页获取视频地址');
      }
      
      return this.normalizeResult({
        videoId: videoId,
        title: videoData.desc || '无标题',
        author: videoData.author?.nickname || '未知作者',
        videoUrl: videoUrl,
        cover: videoData.video.cover?.url_list?.[0] || '',
        duration: Math.floor((videoData.video.duration || 0) / 1000)
      }, videoId);
      
    } catch (error) {
      console.error('网页解析失败:', error.message);
      throw error;
    }
  }
}

module.exports = WebPageParser;