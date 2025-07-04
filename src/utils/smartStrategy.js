// 智能下载策略
class SmartDownloadStrategy {
  constructor() {
    this.downloadHistory = new Map(); // 下载历史统计
    this.networkProfile = {
      averageSpeed: 5, // MB/s
      reliability: 0.8, // 成功率
      lastUpdate: Date.now()
    };
  }

  // 智能质量选择（基于网络状况和视频特征）
  selectOptimalQuality(downloadLinks, videoInfo = {}) {
    if (!Array.isArray(downloadLinks) || downloadLinks.length === 0) {
      return null;
    }

    const { duration = 0, title = '' } = videoInfo;
    const networkScore = this.calculateNetworkScore();
    
    console.log(`🧠 智能质量选择: 时长=${duration}s, 网络评分=${networkScore.toFixed(2)}`);

    // 质量选择策略
    const strategy = this.determineQualityStrategy(networkScore, duration);
    
    return this.selectByStrategy(downloadLinks, strategy);
  }

  // 计算网络评分 (0-10分)
  calculateNetworkScore() {
    const { averageSpeed, reliability } = this.networkProfile;
    
    // 速度评分 (0-5分)
    const speedScore = Math.min(averageSpeed / 2, 5);
    
    // 可靠性评分 (0-5分)  
    const reliabilityScore = reliability * 5;
    
    return speedScore + reliabilityScore;
  }

  // 确定质量策略
  determineQualityStrategy(networkScore, duration) {
    // 网络很好 (8-10分)
    if (networkScore >= 8) {
      return duration > 300 ? 'balanced' : 'high'; // 长视频平衡，短视频高质量
    }
    
    // 网络中等 (5-8分)
    if (networkScore >= 5) {
      return duration > 180 ? 'standard' : 'balanced'; // 长视频标准，短视频平衡
    }
    
    // 网络较差 (< 5分)
    return 'low'; // 统一低质量
  }

  // 根据策略选择链接
  selectByStrategy(downloadLinks, strategy) {
    console.log(`🎯 使用策略: ${strategy}`);
    
    switch (strategy) {
      case 'high':
        return this.selectHighQuality(downloadLinks);
      case 'balanced':
        return this.selectBalancedQuality(downloadLinks);
      case 'standard':
        return this.selectStandardQuality(downloadLinks);
      case 'low':
        return this.selectLowQuality(downloadLinks);
      default:
        return this.selectStandardQuality(downloadLinks);
    }
  }

  // 选择高质量
  selectHighQuality(links) {
    const hdLink = links.find(link => 
      link.label && link.label.includes('HD') && link.label.includes('MP4')
    );
    return hdLink?.url || this.selectStandardQuality(links);
  }

  // 选择平衡质量
  selectBalancedQuality(links) {
    // 优先普通质量，如果没有再选HD
    const normalLink = links.find(link => 
      link.label && link.label.includes('MP4') && 
      !link.label.includes('HD') && !link.label.includes('MP3')
    );
    return normalLink?.url || this.selectHighQuality(links);
  }

  // 选择标准质量
  selectStandardQuality(links) {
    const normalLink = links.find(link => 
      link.label && link.label.includes('MP4') && 
      !link.label.includes('HD') && !link.label.includes('MP3')
    );
    return normalLink?.url || links[0]?.url;
  }

  // 选择低质量
  selectLowQuality(links) {
    // 查找最小的MP4链接，或者第一个可用的
    const mp4Links = links.filter(link => 
      link.label && link.label.includes('MP4') && !link.label.includes('MP3')
    );
    
    // 假设没有HD标识的是较低质量
    const lowQualityLink = mp4Links.find(link => !link.label.includes('HD'));
    return lowQualityLink?.url || mp4Links[0]?.url || links[0]?.url;
  }

  // 更新网络档案
  updateNetworkProfile(downloadStats) {
    const { speed, success, duration } = downloadStats;
    
    if (speed && speed > 0) {
      // 使用指数移动平均更新平均速度
      this.networkProfile.averageSpeed = 
        this.networkProfile.averageSpeed * 0.7 + speed * 0.3;
    }
    
    if (typeof success === 'boolean') {
      // 更新可靠性
      this.networkProfile.reliability = 
        this.networkProfile.reliability * 0.8 + (success ? 1 : 0) * 0.2;
    }
    
    this.networkProfile.lastUpdate = Date.now();
    
    console.log(`📊 网络档案更新: 速度=${this.networkProfile.averageSpeed.toFixed(2)}MB/s, 可靠性=${(this.networkProfile.reliability*100).toFixed(1)}%`);
  }
}

// 智能重试机制
class SmartRetryStrategy {
  constructor(options = {}) {
    this.options = {
      maxRetries: 3,
      baseDelay: 1000,      // 基础延迟 1秒
      maxDelay: 10000,      // 最大延迟 10秒
      backoffMultiplier: 2, // 退避倍数
      jitter: true,         // 添加随机抖动
      ...options
    };
  }

  // 智能重试执行
  async executeWithRetry(operation, context = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        console.log(`🔄 尝试 ${attempt}/${this.options.maxRetries}: ${context.operation || '下载'}`);
        
        const result = await operation();
        
        if (attempt > 1) {
          console.log(`✅ 重试成功，尝试次数: ${attempt}`);
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        console.error(`❌ 尝试 ${attempt} 失败:`, error.message);
        
        // 最后一次尝试，不再等待
        if (attempt === this.options.maxRetries) {
          break;
        }
        
        // 计算延迟时间
        const delay = this.calculateDelay(attempt);
        console.log(`⏳ ${delay}ms后重试...`);
        
        await this.sleep(delay);
      }
    }
    
    throw new Error(`操作失败，已重试${this.options.maxRetries}次: ${lastError.message}`);
  }

  // 计算重试延迟（指数退避 + 抖动）
  calculateDelay(attempt) {
    let delay = this.options.baseDelay * Math.pow(this.options.backoffMultiplier, attempt - 1);
    
    // 限制最大延迟
    delay = Math.min(delay, this.options.maxDelay);
    
    // 添加随机抖动，避免惊群效应
    if (this.options.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return Math.round(delay);
  }

  // 根据错误类型调整重试策略
  shouldRetry(error, attempt) {
    // 网络错误通常可以重试
    if (error.code === 'ECONNRESET' || 
        error.code === 'ETIMEDOUT' || 
        error.code === 'ENOTFOUND') {
      return true;
    }
    
    // HTTP 5xx 错误可以重试
    if (error.response && error.response.status >= 500) {
      return true;
    }
    
    // HTTP 429 (Too Many Requests) 需要更长延迟
    if (error.response && error.response.status === 429) {
      // 增加延迟
      this.options.baseDelay *= 2;
      return attempt < this.options.maxRetries;
    }
    
    // 4xx 错误通常不需要重试
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
      return false;
    }
    
    return true;
  }

  // 睡眠函数
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 下载队列管理
class DownloadQueue {
  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent;
    this.running = new Set();
    this.queue = [];
  }

  // 添加下载任务
  async add(downloadTask) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        task: downloadTask,
        resolve,
        reject
      });
      
      this.process();
    });
  }

  // 处理队列
  async process() {
    if (this.running.size >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }
    
    const { task, resolve, reject } = this.queue.shift();
    const taskId = Date.now() + Math.random();
    
    this.running.add(taskId);
    
    try {
      const result = await task();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running.delete(taskId);
      this.process(); // 处理下一个任务
    }
  }

  // 获取队列状态
  getStatus() {
    return {
      running: this.running.size,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent
    };
  }
}

module.exports = {
  SmartDownloadStrategy,
  SmartRetryStrategy,
  DownloadQueue
};