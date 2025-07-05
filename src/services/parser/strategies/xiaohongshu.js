const axios = require('axios');
const BaseParser = require('../base');
const { config } = require('../../../config');
const { fixChineseEncoding } = require('../../../utils/textUtils');

class XiaohongshuParser extends BaseParser {
  constructor() {
    super('Xiaohongshu');
  }

  isAvailable() {
    return !!(config.apis.xiaohongshu.key && config.apis.xiaohongshu.key !== 'your_rapidapi_key_here');
  }

  async parse(shareText, videoId) {
    try {
      console.log('使用小红书API解析方法...');
      console.log('原始输入:', shareText);
      
      // 直接使用原始输入，API可以处理链接和文本
      console.log('直接使用原始输入调用API');
      
      // 编码分享文本
      const encodedShareText = encodeURIComponent(shareText);
      const apiUrl = `https://tiktok-douyin-xiaohongshu-weibo-instagram-api.p.rapidapi.com/api/v1/xiaohongshu/web/get_note_info_v3?share_text=${encodedShareText}`;
      
      const response = await axios({
        method: 'GET',
        url: apiUrl,
        headers: {
          'x-rapidapi-key': config.apis.xiaohongshu.key,
          'x-rapidapi-host': config.apis.xiaohongshu.host,
          'Authorization': 'Bearer 0OA4VGxrwlUlgwJTjUWblCQDhjhbqbb9sr9c/TK4qjRP0VoEOa9V2zu3CA=='
        },
        timeout: config.request.timeout,
        responseType: 'json'
      });
      
      console.log('小红书API响应:', JSON.stringify(response.data, null, 2));
      
      if (response.data && response.data.code === 200 && response.data.data) {
        const data = response.data.data;
        
        // 解析数据
        const result = this.parseXiaohongshuData(data);
        
        return this.normalizeResult(result, data.note_id || videoId);
      }
      
      throw new Error('小红书API返回数据格式不正确: ' + JSON.stringify(response.data));
      
    } catch (error) {
      console.error('小红书API解析失败:', error.message);
      if (error.response) {
        console.error('错误状态:', error.response.status);
        console.error('错误详情:', error.response.data);
      }
      throw error;
    }
  }

  parseXiaohongshuData(data) {
    // 修复标题编码
    const title = fixChineseEncoding(data.title || '无标题');
    const description = fixChineseEncoding(data.desc || '');
    
    // 解析图片 - 只获取WB_DFT高质量图片
    const images = this.extractHighQualityImages(data.image_list || []);
    
    // 解析视频信息
    const videoInfo = this.extractVideoInfo(data.video);
    
    // 解析互动数据
    const interactInfo = data.interact_info || {};
    
    // 构建结果
    const result = {
      note_id: data.note_id,
      title: title,
      description: description,
      author: data.user?.nickname || '未知作者',
      avatar: data.user?.avatar || '',
      
      // 内容类型判断
      type: data.type || (images.length > 0 ? 'images' : 'unknown'),
      
      // 图片信息
      images: images,
      
      // 统计数据
      likeCount: this.parseCount(interactInfo.liked_count),
      commentCount: this.parseCount(interactInfo.comment_count),
      collectCount: this.parseCount(interactInfo.collected_count),
      shareCount: this.parseCount(interactInfo.share_count),
      
      // 其他信息
      tags: (data.tag_list || []).map(tag => tag.name),
      createTime: data.time,
      location: data.ip_location
    };
    
    // 如果是视频类型，添加视频信息
    if (videoInfo) {
      result.type = 'video';
      result.videoUrl = videoInfo.master_url;
      result.videoCover = videoInfo.cover;
      result.duration = videoInfo.duration;
      result.videoSize = videoInfo.size;
    }
    
    return result;
  }

  // 提取高质量图片 - 只要WB_DFT场景的
  extractHighQualityImages(imageList) {
    const images = [];
    
    imageList.forEach((imageItem, index) => {
      // 查找WB_DFT场景的图片
      const dftInfo = imageItem.info_list?.find(info => info.image_scene === 'WB_DFT');
      
      if (dftInfo && dftInfo.url) {
        images.push({
          index: index,
          url: dftInfo.url,
          width: imageItem.width || 0,
          height: imageItem.height || 0,
          // 同时保存预览图用于缩略图展示
          thumbnailUrl: imageItem.info_list?.find(info => info.image_scene === 'WB_PRV')?.url || dftInfo.url
        });
      }
    });
    
    console.log(`提取到 ${images.length} 张高质量图片`);
    return images;
  }

  // 提取视频信息
  extractVideoInfo(video) {
    if (!video || !video.media) {
      return null;
    }
    
    try {
      // 获取h264格式的视频流
      const h264Streams = video.media.stream?.h264;
      if (!h264Streams || h264Streams.length === 0) {
        return null;
      }
      
      // 选择第一个流（通常是最佳质量）
      const stream = h264Streams[0];
      
      // 获取封面图 - 从video的image中获取
      let cover = '';
      if (video.image && video.image.thumbnail_fileid) {
        // 这里可能需要构建完整的缩略图URL
        cover = `https://sns-img-qc.xhscdn.com/${video.image.thumbnail_fileid}`;
      }
      
      return {
        master_url: stream.master_url,
        cover: cover,
        duration: stream.duration || video.capa?.duration || 0,
        width: stream.width || 0,
        height: stream.height || 0,
        size: stream.size || 0,
        format: stream.format || 'mp4',
        quality: stream.quality_type || 'HD'
      };
      
    } catch (error) {
      console.error('解析视频信息失败:', error.message);
      return null;
    }
  }

  // 解析计数数据（如：1千+, 10+）
  parseCount(countStr) {
    if (!countStr || countStr === '-') return 0;
    
    // 处理"1千+"这种格式
    if (countStr.includes('千+')) {
      const num = parseFloat(countStr.replace('千+', ''));
      return Math.floor(num * 1000);
    }
    
    // 处理"万+"这种格式
    if (countStr.includes('万+')) {
      const num = parseFloat(countStr.replace('万+', ''));
      return Math.floor(num * 10000);
    }
    
    // 处理"10+"这种格式
    if (countStr.includes('+')) {
      return parseInt(countStr.replace('+', '')) || 0;
    }
    
    // 直接是数字的情况
    return parseInt(countStr) || 0;
  }

  // 重写基类方法，针对小红书特殊处理
  normalizeResult(data, videoId) {
    return {
      videoId: data.note_id || videoId,
      title: data.title || '无标题',
      author: data.author || '未知作者',
      
      // 兼容抖音助手的字段名
      videoUrl: data.videoUrl || '',
      cover: data.videoCover || (data.images && data.images[0] ? data.images[0].thumbnailUrl : ''),
      duration: data.duration || 0,
      
      // 小红书特有字段
      description: data.description || '',
      type: data.type || 'unknown',
      images: data.images || [],
      
      // 统计数据
      likeCount: data.likeCount || 0,
      commentCount: data.commentCount || 0,
      collectCount: data.collectCount || 0,
      shareCount: data.shareCount || 0,
      
      // 其他信息
      tags: data.tags || [],
      location: data.location || '',
      avatar: data.avatar || '',
      createTime: data.createTime || Date.now(),
      
      success: true,
      source: this.name
    };
  }
}

module.exports = XiaohongshuParser;