const { getOptimizedClient } = require('../utils/httpClient');
const { DownloadStreamOptimizer, StreamUtils } = require('../utils/streamOptimizer');
const { SmartDownloadStrategy, SmartRetryStrategy, DownloadQueue } = require('../utils/smartStrategy');
const { getPerformanceMonitor } = require('../utils/performanceMonitor');
const { generateSafeFilename } = require('../utils/textUtils');

// 优化后的下载服务
class OptimizedDownloadService {
  constructor() {
    this.httpClient = getOptimizedClient();
    this.smartStrategy = new SmartDownloadStrategy();
    this.retryStrategy = new SmartRetryStrategy();
    this.downloadQueue = new DownloadQueue(2); // 限制并发数
    this.performanceMonitor = getPerformanceMonitor();
  }

  // 优化的视频下载
  async downloadVideo(req, res) {
    const downloadId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let monitor = null;
    
    try {
      const { downloadUrl, downloadLinks, title, duration } = req.body;
      
      // 开始性能监控
      monitor = this.performanceMonitor.startDownloadMonitoring(downloadId, {
        type: 'video',
        title,
        hasLinks: !!downloadLinks
      });
      
      // 智能选择最优下载URL
      let finalDownloadUrl = await this.selectOptimalDownloadUrl(
        downloadUrl, 
        downloadLinks, 
        { title, duration }
      );
      
      if (!finalDownloadUrl) {
        return res.status(400).json({ error: '未找到视频下载链接' });
      }
      
      console.log('🚀 开始优化下载:', finalDownloadUrl.substring(0, 100) + '...');
      
      // 添加检查点
      this.performanceMonitor.addCheckpoint(monitor, 'url_selected', {
        url: finalDownloadUrl.substring(0, 100)
      });
      
      // 使用重试机制的下载
      await this.retryStrategy.executeWithRetry(async () => {
        return await this.performOptimizedDownload(
          finalDownloadUrl,
          res,
          title,
          monitor
        );
      }, { operation: '视频下载' });
      
      // 完成监控
      this.performanceMonitor.completeDownloadMonitoring(monitor, true);
      
    } catch (error) {
      console.error('❌ 视频下载失败:', error.message);
      
      // 完成监控（失败）
      if (monitor) {
        this.performanceMonitor.completeDownloadMonitoring(monitor, false, error);
      }
      
      if (!res.headersSent) {
        res.status(500).json({ error: '视频下载失败: ' + error.message });
      }
    }
  }

  // 优化的音频下载
  async downloadAudio(req, res) {
    const downloadId = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let monitor = null;
    
    try {
      const { downloadLinks, audioUrl, title } = req.body;
      
      // 开始性能监控
      monitor = this.performanceMonitor.startDownloadMonitoring(downloadId, {
        type: 'audio',
        title
      });
      
      // 选择音频URL
      let finalAudioUrl = audioUrl;
      
      if (!finalAudioUrl && downloadLinks && Array.isArray(downloadLinks)) {
        let mp3Link = downloadLinks.find(link => 
          link.label && link.label.includes('MP3')
        );
        finalAudioUrl = mp3Link ? mp3Link.url : null;
      }
      
      if (!finalAudioUrl) {
        return res.status(400).json({ error: '未找到音频下载链接' });
      }
      
      console.log('🎵 开始音频下载:', finalAudioUrl.substring(0, 100) + '...');
      
      // 使用重试机制的下载
      await this.retryStrategy.executeWithRetry(async () => {
        return await this.performOptimizedDownload(
          finalAudioUrl,
          res,
          title,
          monitor,
          'audio/mpeg',
          '.mp3'
        );
      }, { operation: '音频下载' });
      
      // 完成监控
      this.performanceMonitor.completeDownloadMonitoring(monitor, true);
      
    } catch (error) {
      console.error('❌ 音频下载失败:', error.message);
      
      if (monitor) {
        this.performanceMonitor.completeDownloadMonitoring(monitor, false, error);
      }
      
      if (!res.headersSent) {
        res.status(500).json({ error: '音频下载失败: ' + error.message });
      }
    }
  }

  // 智能选择最优下载URL
  async selectOptimalDownloadUrl(downloadUrl, downloadLinks, videoInfo) {
    // 如果直接提供了URL，先尝试使用
    if (downloadUrl) {
      return downloadUrl;
    }
    
    // 如果有链接数组，使用智能策略选择
    if (downloadLinks && Array.isArray(downloadLinks)) {
      const optimalUrl = this.smartStrategy.selectOptimalQuality(downloadLinks, videoInfo);
      if (optimalUrl) {
        return optimalUrl;
      }
    }
    
    return null;
  }

  // 执行优化下载
  async performOptimizedDownload(url, res, title, monitor, contentType = 'video/mp4', extension = '.mp4') {
    // 预热连接
    await this.httpClient.warmupConnection(url);
    
    // 获取优化的流
    const response = await this.httpClient.downloadStream(url);
    
    // 添加检查点
    this.performanceMonitor.addCheckpoint(monitor, 'stream_started', {
      contentLength: response.headers['content-length'],
      contentType: response.headers['content-type']
    });
    
    // 设置响应头
    const fileName = generateSafeFilename(title, extension);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader('Content-Type', contentType);
    
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }
    
    // 创建优化的流处理器
    const streamOptimizer = new DownloadStreamOptimizer();
    const contentLength = response.headers['content-length'];
    
    // 进度回调
    const progressCallback = (progress) => {
      this.performanceMonitor.addCheckpoint(monitor, 'progress', progress);
      
      // 可以在这里发送进度到前端（如果需要实时进度）
      // 由于当前是文件下载，暂不实现WebSocket进度推送
    };
    
    // 执行优化的流式下载
    await streamOptimizer.streamDownload(
      response.data,
      res,
      contentLength,
      progressCallback
    );
    
    // 添加完成检查点
    this.performanceMonitor.addCheckpoint(monitor, 'download_completed');
    
    console.log('✅ 下载完成');
  }

  // 获取性能报告
  getPerformanceReport() {
    return this.performanceMonitor.getPerformanceReport();
  }

  // 获取下载队列状态
  getQueueStatus() {
    return this.downloadQueue.getStatus();
  }

  // 更新网络档案（供外部调用）
  updateNetworkProfile(stats) {
    this.smartStrategy.updateNetworkProfile(stats);
  }
}

// 创建单例实例
let serviceInstance = null;

const getOptimizedDownloadService = () => {
  if (!serviceInstance) {
    serviceInstance = new OptimizedDownloadService();
  }
  return serviceInstance;
};

// 保持向后兼容的静态方法
class DownloadService {
  static async downloadVideo(req, res) {
    const service = getOptimizedDownloadService();
    return await service.downloadVideo(req, res);
  }

  static async downloadAudio(req, res) {
    const service = getOptimizedDownloadService();
    return await service.downloadAudio(req, res);
  }

  // 新增：获取性能报告API
  static getPerformanceReport() {
    const service = getOptimizedDownloadService();
    return service.getPerformanceReport();
  }

  // 新增：获取队列状态API
  static getQueueStatus() {
    const service = getOptimizedDownloadService();
    return service.getQueueStatus();
  }

  // 兼容原有的方法
  static selectBestVideoUrl(downloadLinks) {
    const service = getOptimizedDownloadService();
    return service.smartStrategy.selectStandardQuality(downloadLinks);
  }
}

module.exports = DownloadService;