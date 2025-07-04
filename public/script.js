class DouyinDownloader {
    constructor() {
        this.initElements();
        this.bindEvents();
        this.currentVideoData = null;
    }

    initElements() {
        this.videoUrlInput = document.getElementById('videoUrl');
        this.parseBtn = document.getElementById('parseBtn');
        this.loading = document.getElementById('loading');
        this.error = document.getElementById('error');
        this.errorMsg = document.getElementById('errorMsg');
        this.result = document.getElementById('result');
        this.videoCover = document.getElementById('videoCover');
        this.videoTitle = document.getElementById('videoTitle');
        this.videoAuthor = document.getElementById('videoAuthor');
        this.videoDuration = document.getElementById('videoDuration');
        this.downloadVideoBtn = document.getElementById('downloadVideoBtn');
        this.downloadAudioBtn = document.getElementById('downloadAudioBtn');
        // 视频预览相关元素
        this.videoPreview = document.getElementById('videoPreview');
        this.videoModal = document.getElementById('videoModal');
        this.previewVideo = document.getElementById('previewVideo');
        this.videoSource = document.getElementById('videoSource');
        this.closeModal = document.getElementById('closeModal');
    }

    bindEvents() {
        this.parseBtn.addEventListener('click', () => this.parseVideo());
        this.videoUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.parseVideo();
            }
        });
        this.downloadVideoBtn.addEventListener('click', () => this.downloadVideo());
        this.downloadAudioBtn.addEventListener('click', () => this.downloadAudio());
        
        // 视频预览相关事件
        this.videoPreview.addEventListener('click', () => this.showVideoPreview());
        this.closeModal.addEventListener('click', () => this.hideVideoPreview());
        this.videoModal.addEventListener('click', (e) => {
            if (e.target === this.videoModal) {
                this.hideVideoPreview();
            }
        });
        
        // 键盘ESC关闭预览
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideVideoPreview();
            }
        });
        
        // 自动清理输入框
        this.videoUrlInput.addEventListener('paste', (e) => {
            setTimeout(() => {
                this.cleanUrl();
            }, 100);
        });
    }

    cleanUrl() {
        let url = this.videoUrlInput.value.trim();
        if (url) {
            // 提取链接中的有效部分
            const match = url.match(/(https?:\/\/[^\s]+)/);
            if (match) {
                this.videoUrlInput.value = match[1];
            }
        }
    }

    showLoading() {
        this.loading.classList.remove('hidden');
        this.error.classList.add('hidden');
        this.result.classList.add('hidden');
        this.parseBtn.disabled = true;
        this.parseBtn.textContent = '解析中...';
    }

    hideLoading() {
        this.loading.classList.add('hidden');
        this.parseBtn.disabled = false;
        this.parseBtn.textContent = '解析视频';
    }

    showError(message) {
        this.error.classList.remove('hidden');
        this.errorMsg.textContent = message;
        this.result.classList.add('hidden');
    }

    showResult(data) {
        this.currentVideoData = data;
        this.result.classList.remove('hidden');
        this.error.classList.add('hidden');
        
        this.videoCover.src = data.cover;
        this.videoTitle.textContent = data.title || '无标题';
        // 固定显示觅安-if和保密
        this.videoAuthor.textContent = '觅安-if';
        this.videoDuration.textContent = '保密';
        
        console.log('显示解析结果:', data);
    }

    async parseVideo() {
        const url = this.videoUrlInput.value.trim();
        
        if (!url) {
            this.showError('请输入抖音视频链接');
            return;
        }

        if (!this.isValidDouyinUrl(url)) {
            this.showError('请输入有效的抖音视频链接');
            return;
        }

        this.showLoading();

        try {
            console.log('发送解析请求:', url);
            
            const response = await fetch('/api/parse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: url })
            });

            console.log('响应状态:', response.status);
            
            const result = await response.json();
            console.log('解析结果:', result);

            if (result.success) {
                this.showResult(result.data);
            } else {
                this.showError(result.error || '解析失败');
            }
        } catch (error) {
            console.error('解析错误:', error);
            this.showError('网络错误，请稍后重试: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    isValidDouyinUrl(url) {
        return url.includes('douyin.com') || url.includes('v.douyin.com');
    }

    async downloadVideo() {
        if (!this.currentVideoData) {
            this.showError('没有可下载的视频');
            return;
        }

        try {
            this.downloadVideoBtn.disabled = true;
            this.downloadVideoBtn.textContent = '📹 准备下载...';
            
            // 显示下载进度条
            this.showDownloadProgress();
            
            // 直接使用普通质量链接，如果没有就用第一个
            const downloadUrl = this.currentVideoData.normalVideoUrl || 
                               this.currentVideoData.videoUrl || 
                               (this.currentVideoData.downloadLinks && this.currentVideoData.downloadLinks[0] ? this.currentVideoData.downloadLinks[0].url : '');
            
            if (!downloadUrl) {
                this.showError('没有可用的下载链接');
                return;
            }
            
            const response = await fetch('/api/download-video', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    downloadUrl: downloadUrl,
                    title: this.currentVideoData.title
                })
            });

            if (response.ok) {
                // 获取文件大小用于进度计算
                const contentLength = response.headers.get('content-length');
                const total = parseInt(contentLength, 10);
                
                if (total) {
                    this.downloadWithProgress(response, total, this.currentVideoData.title);
                } else {
                    // 如果无法获取文件大小，直接下载
                    const blob = await response.blob();
                    this.downloadBlob(blob, `${this.generateFilename(this.currentVideoData.title)}.mp4`);
                }
            } else {
                const error = await response.json();
                this.showError(error.error || '下载失败');
            }
            
        } catch (error) {
            console.error('下载错误:', error);
            this.showError('下载失败，请稍后重试');
        } finally {
            this.hideDownloadProgress();
            this.downloadVideoBtn.disabled = false;
            this.downloadVideoBtn.textContent = '📹 下载视频';
        }
    }

    async downloadAudio() {
        if (!this.currentVideoData) {
            this.showError('没有可下载的音频');
            return;
        }

        // 检查是否有音频链接
        const audioUrl = this.currentVideoData.audioUrl;
        if (!audioUrl) {
            this.showError('该视频没有可用的音频链接');
            return;
        }

        try {
            this.downloadAudioBtn.disabled = true;
            this.downloadAudioBtn.textContent = '🎵 下载中...';
            
            const response = await fetch('/api/download-audio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    audioUrl: audioUrl,
                    downloadLinks: this.currentVideoData.downloadLinks, // 兼容旧版
                    title: this.currentVideoData.title
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${this.generateFilename(this.currentVideoData.title)}.mp3`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } else {
                const error = await response.json();
                this.showError(error.error || '音频下载失败');
            }
            
        } catch (error) {
            console.error('音频下载错误:', error);
            this.showError('音频下载失败，请稍后重试');
        } finally {
            this.downloadAudioBtn.disabled = false;
            this.downloadAudioBtn.textContent = '🎵 下载MP3音频';
        }
    }

    generateFilename(title) {
        const cleanTitle = (title || 'douyin_media')
            .substring(0, 50)
            .replace(/[^\w\s\u4e00-\u9fff-]/g, '') // 保留中文字符
            .replace(/\s+/g, '_');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '');
        return `${cleanTitle}_${timestamp}`;
    }


    // 显示下载进度条
    showDownloadProgress() {
        // 创建进度条元素（如果不存在）
        let progressContainer = document.getElementById('downloadProgress');
        if (!progressContainer) {
            progressContainer = document.createElement('div');
            progressContainer.id = 'downloadProgress';
            progressContainer.className = 'progress-container';
            progressContainer.innerHTML = `
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
                <div class="progress-text" id="progressText">准备下载...</div>
            `;
            this.result.appendChild(progressContainer);
        }
        progressContainer.classList.remove('hidden');
    }

    // 隐藏下载进度条
    hideDownloadProgress() {
        const progressContainer = document.getElementById('downloadProgress');
        if (progressContainer) {
            progressContainer.classList.add('hidden');
        }
    }

    // 带进度的下载
    async downloadWithProgress(response, total, title) {
        const reader = response.body.getReader();
        const chunks = [];
        let received = 0;

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            chunks.push(value);
            received += value.length;

            // 更新进度
            const progress = (received / total) * 100;
            this.updateProgress(progress, received, total);
        }

        // 合并所有chunks
        const blob = new Blob(chunks);
        this.downloadBlob(blob, `${this.generateFilename(title)}.mp4`);
    }

    // 更新进度显示
    updateProgress(progress, received, total) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }

        if (progressText) {
            const receivedMB = (received / 1024 / 1024).toFixed(1);
            const totalMB = (total / 1024 / 1024).toFixed(1);
            progressText.textContent = `下载中... ${progress.toFixed(1)}% (${receivedMB}MB / ${totalMB}MB)`;
        }

        // 更新按钮文字
        this.downloadVideoBtn.textContent = `📹 下载中 ${progress.toFixed(0)}%`;
    }

    // 下载blob文件
    downloadBlob(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    // 显示视频预览
    showVideoPreview() {
        if (!this.currentVideoData) {
            return;
        }

        // 使用普通质量链接进行预览
        const previewUrl = this.currentVideoData.normalVideoUrl || 
                          this.currentVideoData.videoUrl || 
                          (this.currentVideoData.downloadLinks && this.currentVideoData.downloadLinks[0] ? this.currentVideoData.downloadLinks[0].url : '');
        
        if (!previewUrl) {
            this.showError('无法预览，缺少视频链接');
            return;
        }

        this.videoSource.src = previewUrl;
        this.previewVideo.load();
        this.videoModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // 防止背景滚动
    }

    // 隐藏视频预览
    hideVideoPreview() {
        this.videoModal.classList.add('hidden');
        this.previewVideo.pause();
        this.videoSource.src = '';
        document.body.style.overflow = ''; // 恢复滚动
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new DouyinDownloader();
});