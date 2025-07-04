// 性能监控和自适应优化
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      downloads: [],
      systemMetrics: [],
      maxHistory: 100 // 最多保留100条记录
    };
    
    this.thresholds = {
      slowDownload: 1,    // MB/s - 认为慢的下载速度
      highMemory: 100,    // MB - 高内存使用阈值
      longDuration: 300   // 秒 - 长时间下载阈值
    };
  }

  // 开始监控下载
  startDownloadMonitoring(downloadId, metadata = {}) {
    const startTime = Date.now();
    
    const monitor = {
      id: downloadId,
      startTime,
      metadata,
      checkpoints: [],
      systemSnapshots: []
    };
    
    // 记录初始系统状态
    monitor.systemSnapshots.push(this.captureSystemSnapshot());
    
    return monitor;
  }

  // 添加检查点
  addCheckpoint(monitor, type, data = {}) {
    const checkpoint = {
      timestamp: Date.now(),
      type,
      data,
      memoryUsage: this.getMemoryUsage(),
      elapsedTime: Date.now() - monitor.startTime
    };
    
    monitor.checkpoints.push(checkpoint);
    
    // 如果是进度检查点，实时分析性能
    if (type === 'progress') {
      this.analyzeRealTimePerformance(monitor, checkpoint);
    }
  }

  // 完成下载监控
  completeDownloadMonitoring(monitor, success = true, error = null) {
    const endTime = Date.now();
    const duration = (endTime - monitor.startTime) / 1000; // 秒
    
    // 计算总体统计
    const stats = this.calculateDownloadStats(monitor, duration, success);
    
    // 记录到历史
    this.recordDownloadHistory(stats);
    
    // 触发自适应优化
    this.triggerAdaptiveOptimization(stats);
    
    console.log('📊 下载性能统计:', this.formatStats(stats));
    
    return stats;
  }

  // 计算下载统计
  calculateDownloadStats(monitor, duration, success) {
    const { metadata, checkpoints } = monitor;
    
    // 获取最后的进度检查点
    const progressCheckpoints = checkpoints.filter(cp => cp.type === 'progress');
    const lastProgress = progressCheckpoints[progressCheckpoints.length - 1];
    
    const totalBytes = lastProgress?.data.total || 0;
    const downloadedBytes = lastProgress?.data.downloaded || 0;
    const averageSpeed = duration > 0 ? (downloadedBytes / duration) / (1024 * 1024) : 0; // MB/s
    
    return {
      id: monitor.id,
      success,
      duration,
      totalBytes,
      downloadedBytes,
      averageSpeed,
      metadata,
      checkpoints: checkpoints.length,
      memoryPeak: this.calculateMemoryPeak(checkpoints),
      networkEfficiency: this.calculateNetworkEfficiency(checkpoints),
      timestamp: Date.now()
    };
  }

  // 计算内存峰值
  calculateMemoryPeak(checkpoints) {
    return Math.max(...checkpoints.map(cp => cp.memoryUsage.heapUsed));
  }

  // 计算网络效率
  calculateNetworkEfficiency(checkpoints) {
    const progressPoints = checkpoints.filter(cp => cp.type === 'progress');
    if (progressPoints.length < 2) return 1;
    
    // 计算速度的稳定性（变异系数）
    const speeds = [];
    for (let i = 1; i < progressPoints.length; i++) {
      const prev = progressPoints[i - 1];
      const curr = progressPoints[i];
      const timeDiff = (curr.timestamp - prev.timestamp) / 1000;
      const bytesDiff = curr.data.downloaded - prev.data.downloaded;
      const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0;
      speeds.push(speed);
    }
    
    if (speeds.length === 0) return 1;
    
    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const variance = speeds.reduce((acc, speed) => acc + Math.pow(speed - avgSpeed, 2), 0) / speeds.length;
    const stdDev = Math.sqrt(variance);
    const cv = avgSpeed > 0 ? stdDev / avgSpeed : 1;
    
    // 返回效率分数 (0-1，越接近1越好)
    return Math.max(0, 1 - cv);
  }

  // 实时性能分析
  analyzeRealTimePerformance(monitor, checkpoint) {
    const { data } = checkpoint;
    const currentSpeed = this.calculateCurrentSpeed(monitor, checkpoint);
    
    // 检测慢速下载
    if (currentSpeed < this.thresholds.slowDownload) {
      console.log('⚠️ 检测到慢速下载:', currentSpeed.toFixed(2), 'MB/s');
      this.suggestOptimization('slow_download', { speed: currentSpeed });
    }
    
    // 检测高内存使用
    if (checkpoint.memoryUsage.heapUsed > this.thresholds.highMemory) {
      console.log('⚠️ 内存使用较高:', checkpoint.memoryUsage.heapUsed, 'MB');
      this.suggestOptimization('high_memory', { memory: checkpoint.memoryUsage });
    }
    
    // 检测长时间下载
    if (checkpoint.elapsedTime > this.thresholds.longDuration * 1000) {
      console.log('⚠️ 下载时间较长:', Math.round(checkpoint.elapsedTime / 1000), '秒');
      this.suggestOptimization('long_duration', { duration: checkpoint.elapsedTime });
    }
  }

  // 计算当前速度
  calculateCurrentSpeed(monitor, checkpoint) {
    const recentCheckpoints = monitor.checkpoints
      .filter(cp => cp.type === 'progress')
      .slice(-3); // 最近3个检查点
    
    if (recentCheckpoints.length < 2) return 0;
    
    const first = recentCheckpoints[0];
    const last = recentCheckpoints[recentCheckpoints.length - 1];
    
    const timeDiff = (last.timestamp - first.timestamp) / 1000;
    const bytesDiff = last.data.downloaded - first.data.downloaded;
    
    return timeDiff > 0 ? (bytesDiff / timeDiff) / (1024 * 1024) : 0;
  }

  // 优化建议
  suggestOptimization(type, data) {
    const suggestions = {
      slow_download: '建议：降低视频质量或检查网络连接',
      high_memory: '建议：减小buffer大小或触发垃圾回收',
      long_duration: '建议：考虑分片下载或质量降级'
    };
    
    const suggestion = suggestions[type] || '建议：检查网络和系统状态';
    console.log('💡', suggestion);
  }

  // 记录下载历史
  recordDownloadHistory(stats) {
    this.metrics.downloads.push(stats);
    
    // 保持历史记录数量限制
    if (this.metrics.downloads.length > this.metrics.maxHistory) {
      this.metrics.downloads.shift();
    }
  }

  // 触发自适应优化
  triggerAdaptiveOptimization(stats) {
    // 基于历史数据调整策略
    const recentDownloads = this.metrics.downloads.slice(-10);
    
    if (recentDownloads.length >= 5) {
      const avgSpeed = recentDownloads.reduce((sum, d) => sum + d.averageSpeed, 0) / recentDownloads.length;
      const successRate = recentDownloads.filter(d => d.success).length / recentDownloads.length;
      
      console.log(`📈 自适应分析: 平均速度=${avgSpeed.toFixed(2)}MB/s, 成功率=${(successRate*100).toFixed(1)}%`);
      
      // 根据分析结果调整策略
      this.adjustDownloadStrategy(avgSpeed, successRate);
    }
  }

  // 调整下载策略
  adjustDownloadStrategy(avgSpeed, successRate) {
    // 如果速度慢，建议降低默认质量
    if (avgSpeed < 2) {
      console.log('🔧 自适应优化: 建议默认使用标准质量');
    }
    
    // 如果成功率低，建议增加重试次数
    if (successRate < 0.8) {
      console.log('🔧 自适应优化: 建议增加重试次数');
    }
    
    // 如果速度很快，可以尝试更高质量
    if (avgSpeed > 10) {
      console.log('🔧 自适应优化: 网络条件良好，可尝试高质量下载');
    }
  }

  // 捕获系统快照
  captureSystemSnapshot() {
    return {
      timestamp: Date.now(),
      memory: this.getMemoryUsage(),
      uptime: process.uptime(),
      loadAverage: require('os').loadavg()
    };
  }

  // 获取内存使用情况
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100,
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100,
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100,
      external: Math.round(usage.external / 1024 / 1024 * 100) / 100
    };
  }

  // 格式化统计信息
  formatStats(stats) {
    return {
      成功: stats.success ? '✅' : '❌',
      时长: `${stats.duration.toFixed(1)}秒`,
      大小: `${Math.round(stats.totalBytes / 1024 / 1024 * 100) / 100}MB`,
      速度: `${stats.averageSpeed.toFixed(2)}MB/s`,
      效率: `${(stats.networkEfficiency * 100).toFixed(1)}%`,
      内存峰值: `${stats.memoryPeak.toFixed(1)}MB`
    };
  }

  // 获取性能报告
  getPerformanceReport() {
    const downloads = this.metrics.downloads;
    if (downloads.length === 0) {
      return { message: '暂无下载数据' };
    }
    
    const successful = downloads.filter(d => d.success);
    const avgSpeed = successful.reduce((sum, d) => sum + d.averageSpeed, 0) / successful.length;
    const avgDuration = successful.reduce((sum, d) => sum + d.duration, 0) / successful.length;
    const successRate = successful.length / downloads.length;
    
    return {
      总下载次数: downloads.length,
      成功次数: successful.length,
      成功率: `${(successRate * 100).toFixed(1)}%`,
      平均速度: `${avgSpeed.toFixed(2)}MB/s`,
      平均时长: `${avgDuration.toFixed(1)}秒`,
      最近10次下载: downloads.slice(-10).map(d => this.formatStats(d))
    };
  }
}

// 单例模式
let monitorInstance = null;

const getPerformanceMonitor = () => {
  if (!monitorInstance) {
    monitorInstance = new PerformanceMonitor();
  }
  return monitorInstance;
};

module.exports = {
  PerformanceMonitor,
  getPerformanceMonitor
};