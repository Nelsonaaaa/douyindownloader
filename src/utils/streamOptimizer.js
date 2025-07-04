const { Transform, pipeline } = require('stream');
const { promisify } = require('util');

const pipelineAsync = promisify(pipeline);

// 优化的下载流处理器
class DownloadStreamOptimizer {
  constructor(options = {}) {
    this.options = {
      // 根据文件大小动态调整buffer
      minBufferSize: 32 * 1024,    // 32KB - 小文件
      maxBufferSize: 512 * 1024,   // 512KB - 大文件  
      defaultBufferSize: 128 * 1024, // 128KB - 默认
      
      // 进度更新频率
      progressThrottleMs: 100,     // 100ms更新一次进度
      
      // 背压控制
      highWaterMark: 16,           // 流的缓冲区大小
      
      ...options
    };
    
    this.downloadedBytes = 0;
    this.totalBytes = 0;
    this.startTime = Date.now();
    this.lastProgressUpdate = 0;
    this.progressCallback = null;
  }

  // 根据文件大小计算最优buffer大小
  calculateOptimalBufferSize(contentLength) {
    if (!contentLength) return this.options.defaultBufferSize;
    
    const sizeMB = contentLength / (1024 * 1024);
    
    if (sizeMB < 5) {
      // 小于5MB，使用小buffer，减少延迟
      return this.options.minBufferSize;
    } else if (sizeMB > 50) {
      // 大于50MB，使用大buffer，提高吞吐量
      return this.options.maxBufferSize;
    } else {
      // 中等大小，使用默认buffer
      return this.options.defaultBufferSize;
    }
  }

  // 创建优化的Transform流
  createOptimizedTransform(contentLength, progressCallback) {
    this.totalBytes = parseInt(contentLength) || 0;
    this.progressCallback = progressCallback;
    this.downloadedBytes = 0;
    this.startTime = Date.now();

    const bufferSize = this.calculateOptimalBufferSize(this.totalBytes);
    console.log(`📊 使用Buffer大小: ${Math.round(bufferSize/1024)}KB, 文件大小: ${Math.round(this.totalBytes/1024/1024*100)/100}MB`);

    return new Transform({
      highWaterMark: bufferSize,
      
      transform: (chunk, encoding, callback) => {
        try {
          this.downloadedBytes += chunk.length;
          
          // 节流的进度更新
          this.updateProgressThrottled();
          
          // 背压控制：如果下游处理慢，这里会自动暂停
          callback(null, chunk);
          
        } catch (error) {
          callback(error);
        }
      },

      flush: (callback) => {
        // 最终进度更新
        this.updateProgress(true);
        console.log('✅ 流处理完成');
        callback();
      }
    });
  }

  // 节流的进度更新
  updateProgressThrottled() {
    const now = Date.now();
    if (now - this.lastProgressUpdate > this.options.progressThrottleMs) {
      this.updateProgress();
      this.lastProgressUpdate = now;
    }
  }

  // 更新下载进度
  updateProgress(force = false) {
    if (!this.progressCallback) return;

    const now = Date.now();
    const duration = (now - this.startTime) / 1000; // 秒
    const speed = duration > 0 ? this.downloadedBytes / duration : 0; // bytes/s
    const speedMBps = speed / (1024 * 1024); // MB/s

    const progress = {
      downloaded: this.downloadedBytes,
      total: this.totalBytes,
      percentage: this.totalBytes > 0 ? (this.downloadedBytes / this.totalBytes) * 100 : 0,
      speed: speedMBps,
      eta: this.calculateETA(speed),
      duration: duration
    };

    // 只在进度有意义变化或强制更新时回调
    if (force || progress.percentage > 0) {
      this.progressCallback(progress);
    }
  }

  // 计算预计剩余时间
  calculateETA(speed) {
    if (speed <= 0 || this.totalBytes <= 0) return 0;
    
    const remainingBytes = this.totalBytes - this.downloadedBytes;
    return remainingBytes / speed; // 秒
  }

  // 优化的流式下载方法
  async streamDownload(sourceStream, targetStream, contentLength, progressCallback) {
    try {
      console.log('🚀 开始优化流式下载...');
      
      const transformStream = this.createOptimizedTransform(contentLength, progressCallback);
      
      // 使用pipeline确保错误处理和背压控制
      await pipelineAsync(
        sourceStream,
        transformStream,
        targetStream
      );
      
      console.log('✅ 流式下载完成');
      return true;
      
    } catch (error) {
      console.error('❌ 流式下载失败:', error.message);
      throw error;
    }
  }

  // 内存使用监控
  static getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100,      // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100, // MB
      external: Math.round(usage.external / 1024 / 1024 * 100) / 100    // MB
    };
  }
}

// 流式下载的便利函数
class StreamUtils {
  // 高性能文件复制流
  static createHighPerformanceStream(options = {}) {
    return new Transform({
      highWaterMark: options.bufferSize || 128 * 1024,
      objectMode: false,
      
      transform(chunk, encoding, callback) {
        // 直接传递，最小化处理开销
        callback(null, chunk);
      }
    });
  }

  // 带重试的流处理
  static async retryableStream(streamFactory, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 流处理尝试 ${attempt}/${maxRetries}`);
        return await streamFactory();
      } catch (error) {
        lastError = error;
        console.error(`❌ 尝试 ${attempt} 失败:`, error.message);
        
        if (attempt < maxRetries) {
          // 指数退避
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ ${delay}ms后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  // 内存友好的大文件处理
  static createMemoryEfficientStream(maxMemoryMB = 50) {
    const maxMemoryBytes = maxMemoryMB * 1024 * 1024;
    
    return new Transform({
      transform(chunk, encoding, callback) {
        const memUsage = DownloadStreamOptimizer.getMemoryUsage();
        
        // 如果内存使用过高，触发GC
        if (memUsage.heapUsed * 1024 * 1024 > maxMemoryBytes) {
          console.log('🧹 触发垃圾回收，当前内存使用:', memUsage.heapUsed, 'MB');
          if (global.gc) {
            global.gc();
          }
        }
        
        callback(null, chunk);
      }
    });
  }
}

module.exports = {
  DownloadStreamOptimizer,
  StreamUtils
};