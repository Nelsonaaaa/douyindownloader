const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
const cheerio = require('cheerio');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf-8' }));
app.use(express.static('public'));

// 随机User-Agent
function getRandomUserAgent() {
  const userAgents = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36'
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// 使用真实的抖音解析方法 - 优化版，直接用RapidAPI
async function parseDouyinUrl(shareUrl) {
  try {
    console.log('开始解析抖音链接:', shareUrl);
    
    // 检查API密钥配置，优先使用RapidAPI
    if (process.env.RAPIDAPI_KEY && process.env.RAPIDAPI_KEY !== 'your_rapidapi_key_here') {
      console.log('使用RapidAPI直接解析，跳过URL重定向步骤...');
      try {
        // 直接用原始链接调用API，让API自己处理所有解析
        const videoInfo = await getRapidApiData(shareUrl, 'direct_api_call');
        return videoInfo;
      } catch (error) {
        console.log('RapidAPI失败，尝试备用方案:', error.message);
      }
    }
    
    // 如果RapidAPI失败，直接报错，不要假数据
    throw new Error('RapidAPI解析失败，请检查API配置和网络连接');
    
  } catch (error) {
    console.error('解析失败:', error.message);
    throw error;
  }
}

// 获取真实URL
async function getRealUrl(shareUrl) {
  try {
    const response = await axios({
      method: 'GET',
      url: shareUrl,
      maxRedirects: 10,
      timeout: 10000,
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': '*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Cache-Control': 'no-cache'
      },
      validateStatus: () => true
    });
    
    return response.request.res.responseUrl || response.config.url;
  } catch (error) {
    throw new Error('获取真实URL失败: ' + error.message);
  }
}

// 提取视频ID
function extractVideoId(url) {
  const patterns = [
    /video\/(\d+)/,
    /\/(\d+)\?/,
    /\/(\d+)$/,
    /modal_id=(\d+)/,
    /aweme_id=(\d+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  throw new Error('无法从URL提取视频ID');
}

// 使用多种方法获取视频信息 - 优先使用付费API
async function getVideoInfoWithMultipleMethods(videoId, realUrl) {
  // 检查API密钥配置
  if (!process.env.RAPIDAPI_KEY || process.env.RAPIDAPI_KEY === 'your_rapidapi_key_here') {
    console.log('RapidAPI密钥未配置，跳过付费服务...');
  } else {
    // 优先使用RapidAPI
    try {
      return await getRapidApiData(realUrl, videoId);
    } catch (error) {
      console.log('RapidAPI服务失败:', error.message);
    }
  }
  
  // 方法1: 尝试移动端API
  try {
    return await getMobileApiData(videoId);
  } catch (error) {
    console.log('移动端API失败:', error.message);
  }
  
  // 方法2: 尝试网页爬取
  try {
    return await getWebPageData(realUrl, videoId);
  } catch (error) {
    console.log('网页爬取失败:', error.message);
  }
  
  throw new Error('所有解析方法都失败了');
}

// 移动端API方法 - 使用更真实的参数
async function getMobileApiData(videoId) {
  // 使用更复杂的参数模拟真实APP
  const timestamp = Math.floor(Date.now() / 1000);
  const apiUrl = `https://www.iesdouyin.com/aweme/v1/web/aweme/detail/`;
  
  const params = {
    aweme_id: videoId,
    aid: '1128',
    version_name: '23.5.0',
    device_platform: 'android',
    os_version: '2333',
    channel: 'wandoujia_aweme',
    device_type: 'OPPO R11 Plus',
    language: 'zh',
    uuid: generateUUID(),
    openudid: generateOpenUDID(),
    manifest_version_code: '230500',
    resolution: '1080*1920',
    dpi: '420',
    update_version_code: '230500'
  };
  
  const response = await axios({
    method: 'GET',
    url: apiUrl,
    params: params,
    timeout: 10000,
    headers: {
      'User-Agent': 'com.ss.android.ugc.aweme/230500 (Linux; U; Android 7.1.1; zh_CN; OPPO R11 Plus; Build/NMF26X; Cronet/TTNetVersion:b4d74d15 2020-04-23 QuicVersion:0144d358 2020-03-24)',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Cookie': generateCookie(),
      'X-Khronos': timestamp.toString(),
      'X-Gorgon': generateXGorgon(params, timestamp),
      'X-Pods': '',
      'sdk-version': '2'
    }
  });
  
  const data = response.data;
  if (!data.aweme_detail) {
    throw new Error('API返回数据格式错误');
  }
  
  const aweme = data.aweme_detail;
  if (!aweme.video) {
    throw new Error('未找到视频信息');
  }
  
  // 构造无水印视频地址
  let videoUrl = '';
  if (aweme.video.play_addr && aweme.video.play_addr.url_list) {
    videoUrl = aweme.video.play_addr.url_list[0];
    // 多种去水印方法
    videoUrl = videoUrl
      .replace('playwm', 'play')
      .replace('watermark=1', 'watermark=0')
      .replace('/playwm/', '/play/')
      .replace('&watermark=1', '&watermark=0');
  }
  
  if (!videoUrl) {
    throw new Error('无法获取视频地址');
  }
  
  return {
    videoId: videoId,
    title: aweme.desc || '无标题',
    author: aweme.author?.nickname || '未知作者',
    videoUrl: videoUrl,
    cover: aweme.video.cover?.url_list?.[0] || '',
    duration: Math.floor((aweme.video.duration || 0) / 1000)
  };
}

// 生成UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 生成OpenUDID
function generateOpenUDID() {
  return Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

// 生成Cookie
function generateCookie() {
  return `install_id=${Math.floor(Math.random() * 9999999999)}; ttreq=1$${generateUUID()}; d_ticket=${generateUUID().replace(/-/g, '')}; odin_tt=${generateUUID().replace(/-/g, '')}`;
}

// 生成X-Gorgon签名 (简化版)
function generateXGorgon(params, timestamp) {
  // 这里应该是复杂的签名算法，现在用简化版
  const str = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  return Buffer.from(str + timestamp).toString('base64').substring(0, 32);
}

// 网页爬取方法
async function getWebPageData(realUrl, videoId) {
  const response = await axios({
    method: 'GET',
    url: realUrl,
    timeout: 10000,
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
  
  let videoUrl = '';
  if (videoData.video.play_addr && videoData.video.play_addr.url_list) {
    videoUrl = videoData.video.play_addr.url_list[0];
    videoUrl = videoUrl.replace('playwm', 'play').replace('watermark=1', 'watermark=0');
  }
  
  if (!videoUrl) {
    throw new Error('无法从网页获取视频地址');
  }
  
  return {
    videoId: videoId,
    title: videoData.desc || '无标题',
    author: videoData.author?.nickname || '未知作者',
    videoUrl: videoUrl,
    cover: videoData.video.cover?.url_list?.[0] || '',
    duration: Math.floor((videoData.video.duration || 0) / 1000)
  };
}

// RapidAPI解析方法 - 使用你提供的官方API
async function getRapidApiData(originalUrl, videoId) {
  try {
    console.log('使用RapidAPI官方解析方法...');
    console.log('原始URL:', originalUrl);
    
    // 使用官方API格式，URL作为查询参数
    const encodedUrl = encodeURIComponent(originalUrl);
    const apiUrl = `https://douyin-media-downloader.p.rapidapi.com/v2.php?url=${encodedUrl}`;
    
    const response = await axios({
      method: 'GET',
      url: apiUrl,
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': process.env.RAPIDAPI_HOST,
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8'
      },
      timeout: 15000,
      responseType: 'json',
      responseEncoding: 'utf8'
    });
    
    console.log('RapidAPI响应:', JSON.stringify(response.data, null, 2));
    
    // 根据你提供的响应格式解析数据
    if (response.data && response.data.status === 'success' && response.data.data) {
      const data = response.data.data;
      
      // 获取高清视频地址 - 优先选择HD版本
      let videoUrl = '';
      let downloadLinks = data.download_links || [];
      
      // 优先选择普通质量视频链接（避免HD加载慢）
      let normalLink = downloadLinks.find(link => 
        link.label && link.label.includes('MP4') && 
        !link.label.includes('HD') && !link.label.includes('MP3')
      );
      
      if (normalLink) {
        videoUrl = normalLink.url;
        console.log('选择标准质量链接:', videoUrl);
      } else {
        // 如果没有标准质量，再考虑HD链接
        let hdLink = downloadLinks.find(link => 
          link.label && (link.label.includes('HD') || link.label.includes('MP4 HD'))
        );
        
        if (hdLink) {
          videoUrl = hdLink.url;
          console.log('选择HD链接:', videoUrl);
        } else {
          // 最后使用第一个可用链接
          videoUrl = downloadLinks[0] ? downloadLinks[0].url : '';
          console.log('选择第一个可用链接:', videoUrl);
        }
      }
      
      if (!videoUrl) {
        throw new Error('未找到有效的视频下载链接');
      }
      
      // 修复中文编码问题
      let title = data.title || '无标题';
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

      // 查找音频链接
      let audioLink = downloadLinks.find(link => 
        link.label && link.label.includes('MP3')
      );

      return {
        videoId: data.tiktok_id || videoId,
        title: title,
        author: response.data.author || '未知作者',
        videoUrl: videoUrl,
        cover: data.thumbnail || '',
        duration: 0,
        downloadLinks: downloadLinks,
        // 直接提供第一个普通质量链接
        normalVideoUrl: normalLink ? normalLink.url : videoUrl,
        // 直接提供音频链接
        audioUrl: audioLink ? audioLink.url : null,
        success: true
      };
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

// 聚合数据API方法
async function getJuheApiData(url) {
  try {
    console.log('使用聚合数据API解析...');
    
    const response = await axios({
      method: 'GET',
      url: 'http://apis.juhe.cn/fapig/douyin/detail',
      params: {
        url: url,
        key: process.env.JUHE_API_KEY
      },
      timeout: 10000
    });
    
    if (response.data.error_code === 0 && response.data.result) {
      const data = response.data.result;
      return {
        videoId: extractVideoIdFromUrl(url),
        title: data.title || '无标题',
        author: data.author || '未知作者',
        videoUrl: data.video_url,
        cover: data.cover_url || '',
        duration: data.duration || 0
      };
    }
    
    throw new Error('聚合数据API返回错误: ' + response.data.reason);
    
  } catch (error) {
    console.error('聚合数据API失败:', error.message);
    throw error;
  }
}

// APISpace方法
async function getApiSpaceData(url) {
  try {
    console.log('使用APISpace解析...');
    
    const response = await axios({
      method: 'POST',
      url: 'https://eolink.o.apispace.com/douyin-video/video/info',
      headers: {
        'X-APISpace-Token': process.env.APISPACE_TOKEN,
        'Content-Type': 'application/json'
      },
      data: {
        url: url
      },
      timeout: 10000
    });
    
    if (response.data.code === '200000' && response.data.data) {
      const data = response.data.data;
      return {
        videoId: extractVideoIdFromUrl(url),
        title: data.title || '无标题',
        author: data.author || '未知作者',
        videoUrl: data.video_url,
        cover: data.cover_url || '',
        duration: data.duration || 0
      };
    }
    
    throw new Error('APISpace返回错误: ' + response.data.message);
    
  } catch (error) {
    console.error('APISpace失败:', error.message);
    throw error;
  }
}

// 从URL提取视频ID的辅助函数
function extractVideoIdFromUrl(url) {
  const patterns = [
    /video\/(\d+)/,
    /\/(\d+)\?/,
    /\/(\d+)$/,
    /modal_id=(\d+)/,
    /aweme_id=(\d+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return 'unknown_' + Date.now();
}

// 备用API方法 - 使用付费服务
async function getBackupApiData(videoId, originalUrl) {
  const services = [
    // 优先使用RapidAPI
    async () => await getRapidApiData(originalUrl),
    
    // 备用聚合数据
    async () => await getJuheApiData(originalUrl),
    
    // 备用APISpace
    async () => await getApiSpaceData(originalUrl),
    
    // 最后的fallback
    async () => {
      console.log('所有付费API都失败，使用fallback');
      return {
        videoId: videoId,
        title: '解析服务暂时不可用',
        author: '系统提示',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        cover: 'https://via.placeholder.com/300x400/ff6b6b/ffffff?text=Service+Unavailable',
        duration: 30
      };
    }
  ];
  
  let lastError;
  for (let i = 0; i < services.length; i++) {
    try {
      console.log(`尝试付费服务 ${i + 1}...`);
      return await services[i]();
    } catch (error) {
      lastError = error;
      console.log(`付费服务 ${i + 1} 失败:`, error.message);
    }
  }
  
  throw lastError || new Error('所有付费服务都失败');
}

// 配置管理路由
app.post('/api/config', (req, res) => {
  try {
    const { rapidApiKey, rapidApiHost, juheKey, apiSpaceToken } = req.body;
    
    // 动态更新环境变量
    if (rapidApiKey && rapidApiKey !== 'your_rapidapi_key_here') {
      process.env.RAPIDAPI_KEY = rapidApiKey;
    }
    if (rapidApiHost) {
      process.env.RAPIDAPI_HOST = rapidApiHost;
    }
    if (juheKey) {
      process.env.JUHE_API_KEY = juheKey;
    }
    if (apiSpaceToken) {
      process.env.APISPACE_TOKEN = apiSpaceToken;
    }
    
    res.json({
      success: true,
      message: 'API配置已更新！现在可以正常使用付费解析服务了。'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '配置保存失败: ' + error.message
    });
  }
});

// API路由
app.post('/api/parse', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: '请提供有效的抖音链接' });
    }
    
    // 验证是否为抖音链接
    if (!url.includes('douyin.com') && !url.includes('v.douyin.com')) {
      return res.status(400).json({ error: '请提供有效的抖音链接' });
    }
    
    const videoInfo = await parseDouyinUrl(url);
    res.json({
      success: true,
      data: videoInfo
    });
    
  } catch (error) {
    console.error('解析错误:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 下载视频（优先普通质量）
app.post('/api/download-video', async (req, res) => {
  try {
    const { downloadUrl, downloadLinks, title } = req.body;
    
    // 支持新的单URL方式和旧的链接数组方式
    let finalDownloadUrl = downloadUrl;
    
    if (!finalDownloadUrl && downloadLinks && Array.isArray(downloadLinks)) {
      // 兼容旧版本：从链接数组中选择最优链接
      let normalLink = downloadLinks.find(link => 
        link.label && link.label.includes('MP4') && 
        !link.label.includes('HD') && !link.label.includes('MP3')
      );
      
      if (normalLink) {
        finalDownloadUrl = normalLink.url;
      } else {
        let hdLink = downloadLinks.find(link => 
          link.label && link.label.includes('HD')
        );
        if (hdLink) {
          finalDownloadUrl = hdLink.url;
        } else {
          let mp4Link = downloadLinks.find(link => 
            link.label && link.label.includes('MP4') && !link.label.includes('MP3')
          );
          finalDownloadUrl = mp4Link ? mp4Link.url : '';
        }
      }
    }
    
    if (!finalDownloadUrl) {
      return res.status(400).json({ error: '未找到视频下载链接' });
    }
    
    console.log('开始下载视频:', finalDownloadUrl);
    
    const response = await axios({
      method: 'GET',
      url: finalDownloadUrl,
      responseType: 'stream',
      timeout: 60000,
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Referer': 'https://www.douyin.com/',
        'Accept': '*/*'
      }
    });
    
    const fileName = `${title || 'douyin_video'}_${Date.now()}.mp4`.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader('Content-Type', 'video/mp4');
    
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }
    
    response.data.pipe(res);
    
  } catch (error) {
    console.error('视频下载失败:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: '视频下载失败: ' + error.message });
    }
  }
});

// 下载MP3音频
app.post('/api/download-audio', async (req, res) => {
  try {
    const { downloadLinks, audioUrl, title } = req.body;
    
    // 支持新的单URL方式和旧的链接数组方式
    let finalAudioUrl = audioUrl;
    
    if (!finalAudioUrl && downloadLinks && Array.isArray(downloadLinks)) {
      // 兼容旧版本：从链接数组中查找MP3链接
      let mp3Link = downloadLinks.find(link => 
        link.label && link.label.includes('MP3')
      );
      finalAudioUrl = mp3Link ? mp3Link.url : null;
    }
    
    if (!finalAudioUrl) {
      return res.status(400).json({ error: '未找到音频下载链接' });
    }
    
    console.log('开始下载MP3音频:', finalAudioUrl);
    
    const response = await axios({
      method: 'GET',
      url: finalAudioUrl,
      responseType: 'stream',
      timeout: 60000,
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Referer': 'https://www.douyin.com/',
        'Accept': '*/*'
      }
    });
    
    const fileName = `${title || 'douyin_audio'}_${Date.now()}.mp3`.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader('Content-Type', 'audio/mpeg');
    
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }
    
    response.data.pipe(res);
    
  } catch (error) {
    console.error('音频下载失败:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: '音频下载失败: ' + error.message });
    }
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});