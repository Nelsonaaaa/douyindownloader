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
        this.videoAuthor.textContent = data.author || '未知作者';
        this.videoDuration.textContent = data.duration || '未知';
        
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
            this.downloadVideoBtn.textContent = '📹 下载中...';
            
            const response = await fetch('/api/download-video', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    downloadLinks: this.currentVideoData.downloadLinks,
                    title: this.currentVideoData.title
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${this.generateFilename(this.currentVideoData.title)}.mp4`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } else {
                const error = await response.json();
                this.showError(error.error || '下载失败');
            }
            
        } catch (error) {
            console.error('下载错误:', error);
            this.showError('下载失败，请稍后重试');
        } finally {
            this.downloadVideoBtn.disabled = false;
            this.downloadVideoBtn.textContent = '📹 下载HD视频';
        }
    }

    async downloadAudio() {
        if (!this.currentVideoData) {
            this.showError('没有可下载的音频');
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
                    downloadLinks: this.currentVideoData.downloadLinks,
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
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new DouyinDownloader();
});