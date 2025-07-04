const axios = require('axios');
const { config } = require('../config');
const { getRandomUserAgent } = require('./userAgent');

// 创建优化的HTTP客户端
class OptimizedHttpClient {
  constructor() {
    // 创建带连接池的axios实例
    this.client = axios.create({
      timeout: config.request.downloadTimeout,
      maxRedirects: 5,
      
      // 连接池配置 - 关键优化点
      httpAgent: new (require('http').Agent)({
        keepAlive: true,
        keepAliveMsecs: 30000,
        maxSockets: 10,        // 每个host最大连接数
        maxFreeSockets: 5,     // 空闲连接池大小
        timeout: 60000,        // 连接超时
        freeSocketTimeout: 15000 // 空闲连接超时
      }),
      
      httpsAgent: new (require('https').Agent)({
        keepAlive: true,
        keepAliveMsecs: 30000,
        maxSockets: 10,
        maxFreeSockets: 5,
        timeout: 60000,
        freeSocketTimeout: 15000,
        // SSL优化
        secureProtocol: 'TLSv1_2_method',
        rejectUnauthorized: false // 抖音CDN证书问题时的fallback
      })
    });

    // 请求拦截器：优化请求头
    this.client.interceptors.request.use(config => {
      // 基础优化请求头
      config.headers = {
        ...config.headers,
        'User-Agent': getRandomUserAgent(),
        'Accept': config.responseType === 'stream' ? '*/*' : 'application/json',
        'Accept-Encoding': 'gzip, deflate, br', // 启用压缩 - 关键优化
        'Connection': 'keep-alive',               // 连接复用 - 关键优化
        'Cache-Control': 'no-cache',
        'Referer': 'https://www.douyin.com/',
        // HTTP/2 支持暗示
        'Upgrade-Insecure-Requests': '1'
      };

      // 为视频下载优化
      if (config.responseType === 'stream') {
        config.headers['Accept'] = 'video/*, audio/*, */*';
        config.headers['Range'] = config.headers['Range'] || undefined; // 保留Range支持
      }

      return config;
    });

    // 响应拦截器：性能监控
    this.client.interceptors.response.use(
      response => {
        // 记录连接复用情况
        if (response.config.metadata) {
          response.config.metadata.endTime = Date.now();
          const duration = response.config.metadata.endTime - response.config.metadata.startTime;
          console.log(`HTTP请求耗时: ${duration}ms, 连接复用: ${response.request.reusedSocket ? '是' : '否'}`);
        }
        return response;
      },
      error => {
        console.error('HTTP请求错误:', error.message);
        return Promise.reject(error);
      }
    );
  }

  // 优化的流式下载方法
  async downloadStream(url, options = {}) {
    const startTime = Date.now();
    
    try {
      console.log('🚀 开始优化下载:', url.substring(0, 100) + '...');
      
      const config = {
        method: 'GET',
        url: url,
        responseType: 'stream',
        metadata: { startTime }, // 用于性能监控
        
        // 流式下载优化配置
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        
        // 自定义配置合并
        ...options
      };

      const response = await this.client(config);
      
      // 记录下载元信息
      const contentLength = response.headers['content-length'];
      const contentType = response.headers['content-type'];
      const server = response.headers['server'];
      
      console.log(`📊 下载信息: 大小=${contentLength ? Math.round(contentLength/1024/1024*100)/100 + 'MB' : '未知'}, 类型=${contentType}, 服务器=${server}`);
      
      return response;
      
    } catch (error) {
      console.error('❌ 下载失败:', error.message);
      throw error;
    }
  }

  // 预热连接（为特定域名建立连接池）
  async warmupConnection(url) {
    try {
      const domain = new URL(url).origin;
      console.log('🔥 预热连接:', domain);
      
      // 发送HEAD请求预热连接
      await this.client({
        method: 'HEAD',
        url: domain,
        timeout: 5000,
        validateStatus: () => true // 即使404也算成功，目标是建立连接
      });
      
      console.log('✅ 连接预热完成');
    } catch (error) {
      console.log('⚠️ 连接预热失败，继续正常下载');
    }
  }

  // 检测最优质量（基于网络状况）
  async selectOptimalQuality(downloadLinks, estimatedDuration = 0) {
    if (!Array.isArray(downloadLinks) || downloadLinks.length === 0) {
      return null;
    }

    // 网络速度检测（简单实现）
    const networkSpeed = await this.estimateNetworkSpeed();
    console.log(`📶 估算网络速度: ${networkSpeed.toFixed(1)} Mbps`);

    // 智能质量选择逻辑
    const shouldUseHD = this.shouldUseHDQuality(networkSpeed, estimatedDuration);
    
    if (shouldUseHD) {
      // 网络好，视频短，选择HD
      const hdLink = downloadLinks.find(link => 
        link.label && link.label.includes('HD') && link.label.includes('MP4')
      );
      if (hdLink) {
        console.log('🎯 选择HD质量');
        return hdLink.url;
      }
    }

    // 默认选择标准质量
    const normalLink = downloadLinks.find(link => 
      link.label && link.label.includes('MP4') && 
      !link.label.includes('HD') && !link.label.includes('MP3')
    );
    
    if (normalLink) {
      console.log('🎯 选择标准质量');
      return normalLink.url;
    }

    // 降级选择
    console.log('🎯 降级选择第一个可用链接');
    return downloadLinks[0]?.url || null;
  }

  // 简单的网络速度估算
  async estimateNetworkSpeed() {
    const testUrl = 'https://www.douyin.com/favicon.ico'; // 小文件测试
    const startTime = Date.now();
    
    try {
      const response = await this.client({
        method: 'GET',
        url: testUrl,
        timeout: 3000,
        validateStatus: () => true
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      const size = response.headers['content-length'] || 1024; // 假设1KB
      
      // 计算速度 (Mbps)
      const speedMbps = (size * 8) / (duration / 1000) / 1000000;
      return Math.max(speedMbps, 1); // 最小1Mbps
      
    } catch (error) {
      return 5; // 默认5Mbps
    }
  }

  // 判断是否应该使用HD质量
  shouldUseHDQuality(networkSpeed, duration) {
    // 网络速度 > 10Mbps 且视频 < 3分钟，使用HD
    if (networkSpeed > 10 && duration < 180) {
      return true;
    }
    
    // 网络速度 > 20Mbps，无论视频长度都使用HD
    if (networkSpeed > 20) {
      return true;
    }
    
    return false;
  }

  // 获取客户端实例（用于其他非下载请求）
  getClient() {
    return this.client;
  }
}

// 单例模式，确保连接池复用
let clientInstance = null;

const getOptimizedClient = () => {
  if (!clientInstance) {
    clientInstance = new OptimizedHttpClient();
  }
  return clientInstance;
};

module.exports = {
  OptimizedHttpClient,
  getOptimizedClient
};