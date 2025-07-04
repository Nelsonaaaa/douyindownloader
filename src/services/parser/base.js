// 解析器基类
class BaseParser {
  constructor(name) {
    this.name = name;
  }

  // 抽象方法：子类必须实现
  async parse(url, videoId) {
    throw new Error(`${this.name} parser must implement parse method`);
  }

  // 检查是否可用
  isAvailable() {
    return true;
  }

  // 解析结果标准化
  normalizeResult(data, videoId) {
    return {
      videoId: data.videoId || videoId,
      title: data.title || '无标题',
      author: data.author || '未知作者',
      videoUrl: data.videoUrl || '',
      cover: data.cover || '',
      duration: data.duration || 0,
      downloadLinks: data.downloadLinks || [],
      normalVideoUrl: data.normalVideoUrl || data.videoUrl,
      audioUrl: data.audioUrl || null,
      success: true,
      source: this.name
    };
  }

  // 选择最佳视频链接
  selectBestVideoLink(downloadLinks) {
    if (!Array.isArray(downloadLinks) || downloadLinks.length === 0) {
      return null;
    }

    // 优先选择普通质量视频链接（避免HD加载慢）
    let normalLink = downloadLinks.find(link => 
      link.label && link.label.includes('MP4') && 
      !link.label.includes('HD') && !link.label.includes('MP3')
    );

    if (normalLink) {
      return normalLink.url;
    }

    // 如果没有标准质量，再考虑HD链接
    let hdLink = downloadLinks.find(link => 
      link.label && (link.label.includes('HD') || link.label.includes('MP4 HD'))
    );

    if (hdLink) {
      return hdLink.url;
    }

    // 最后使用第一个可用链接
    return downloadLinks[0] ? downloadLinks[0].url : null;
  }

  // 选择音频链接
  selectAudioLink(downloadLinks) {
    if (!Array.isArray(downloadLinks) || downloadLinks.length === 0) {
      return null;
    }

    let audioLink = downloadLinks.find(link => 
      link.label && link.label.includes('MP3')
    );

    return audioLink ? audioLink.url : null;
  }
}

module.exports = BaseParser;