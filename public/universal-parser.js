/**
 * 统一智能解析组件
 * 支持抖音和小红书的智能识别、解析和下载
 */
class UniversalParser {
    constructor() {
        this.initElements();
        this.bindEvents();
        this.currentResult = null;
        this.isLoading = false;
        this.supportedPlatforms = ['douyin', 'xiaohongshu'];
    }

    initElements() {
        // 输入相关元素
        this.inputContainer = document.getElementById('universalInputContainer');
        this.inputTextarea = document.getElementById('universalInput');
        this.parseButton = document.getElementById('universalParseBtn');
        this.platformIndicator = document.getElementById('platformIndicator');
        this.platformIcon = document.getElementById('platformIcon');
        this.platformName = document.getElementById('platformName');
        
        // 状态相关元素
        this.loadingContainer = document.getElementById('universalLoading');
        this.errorContainer = document.getElementById('universalError');
        this.errorMessage = document.getElementById('universalErrorMsg');
        this.resultContainer = document.getElementById('universalResult');
        
        // 结果展示元素
        this.resultContent = document.getElementById('resultContent');
        
        // 如果元素不存在，创建它们
        this.createElementsIfNeeded();
    }

    createElementsIfNeeded() {
        // 如果主容器不存在，动态创建
        if (!this.inputContainer) {
            this.createUniversalInterface();
            this.initElements(); // 重新初始化元素
        }
    }

    createUniversalInterface() {
        // 检查是否有专门的挂载点
        const mountPoint = document.getElementById('universalParserMount');
        if (mountPoint) {
            mountPoint.innerHTML = this.getUniversalInterfaceHTML();
            mountPoint.className = 'universal-parser-container';
            return;
        }
        
        // 如果没有挂载点，创建独立容器
        const container = document.createElement('div');
        container.className = 'universal-parser-container';
        container.innerHTML = this.getUniversalInterfaceHTML();

        // 找到合适的位置插入组件
        const targetElement = document.querySelector('.container') || document.body;
        targetElement.appendChild(container);
    }

    getUniversalInterfaceHTML() {
        return `
            <div class="universal-input-section">
                <div id="universalInputContainer" class="input-container">
                    <textarea 
                        id="universalInput" 
                        placeholder="粘贴抖音或小红书的分享内容..." 
                        rows="4"
                        class="universal-input"
                    ></textarea>
                    
                    <div id="platformIndicator" class="platform-indicator hidden">
                        <img id="platformIcon" src="" alt="平台图标" class="platform-icon">
                        <span id="platformName" class="platform-name"></span>
                    </div>
                </div>

                <button 
                    id="universalParseBtn" 
                    class="universal-parse-button"
                    disabled
                >
                    <img src="/icons/解析.svg" alt="解析" class="button-icon">
                    <span class="button-text">智能解析并下载</span>
                    <span class="button-loading hidden">
                        <div class="loading-spinner-small"></div>
                        解析中...
                    </span>
                </button>
            </div>

            <!-- 加载状态 -->
            <div id="universalLoading" class="loading-container hidden">
                <div class="loading-spinner"></div>
                <div class="loading-stages">
                    <div class="loading-stage" id="detectingStage">🔍 识别平台中...</div>
                    <div class="loading-stage" id="extractingStage">🔗 提取链接中...</div>
                    <div class="loading-stage" id="parsingStage">📊 解析内容中...</div>
                    <div class="loading-stage" id="preparingStage">⬇️ 准备下载中...</div>
                </div>
            </div>

            <!-- 错误提示 -->
            <div id="universalError" class="error-container hidden">
                <div class="error-icon">❌</div>
                <div id="universalErrorMsg" class="error-message"></div>
                <button class="retry-button" onclick="universalParser.retry()">重试</button>
            </div>

            <!-- 结果展示 -->
            <div id="universalResult" class="result-container hidden">
                <div id="resultContent" class="result-content">
                    <!-- 动态内容将在这里显示 -->
                </div>
            </div>
        `;
    }

    bindEvents() {
        // 输入框事件
        if (this.inputTextarea) {
            this.inputTextarea.addEventListener('input', () => this.onInputChange());
            this.inputTextarea.addEventListener('paste', () => {
                setTimeout(() => this.onInputChange(), 100);
            });
            this.inputTextarea.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    this.parseAndDownload();
                }
            });
        }

        // 解析按钮事件
        if (this.parseButton) {
            this.parseButton.addEventListener('click', () => this.parseAndDownload());
        }
    }

    onInputChange() {
        const input = this.inputTextarea.value.trim();
        
        if (!input) {
            this.hidePlatformIndicator();
            this.disableParseButton();
            return;
        }

        try {
            // 检测平台
            const platform = this.detectPlatform(input);
            this.showPlatformIndicator(platform);
            this.enableParseButton();
        } catch (error) {
            this.hidePlatformIndicator();
            this.disableParseButton();
        }
    }

    detectPlatform(input) {
        const patterns = {
            douyin: [
                /v\.douyin\.com/i,
                /douyin\.com/i,
                /抖音/i,
                /看看.*作品/i,
                /复制打开抖音/i,
                /iesdouyin\.com/i
            ],
            xiaohongshu: [
                /xiaohongshu\.com/i,
                /xhslink/i,
                /小红书/i,
                /发现好内容/i,
                /发现美好，马上出发/i
            ]
        };

        for (const [platform, regexes] of Object.entries(patterns)) {
            if (regexes.some(regex => regex.test(input))) {
                return platform;
            }
        }
        
        throw new Error('不支持的平台');
    }

    showPlatformIndicator(platform) {
        if (!this.platformIndicator) return;

        const platformInfo = {
            douyin: {
                name: '抖音',
                icon: '/icons/douyin.svg',
                color: '#FF0055',
                className: 'douyin-platform'
            },
            xiaohongshu: {
                name: '小红书',
                icon: '/icons/renote.svg',
                color: '#FF2943',
                className: 'xiaohongshu-platform'
            }
        };

        const info = platformInfo[platform];
        if (info) {
            // 设置图标并添加错误处理
            this.platformIcon.src = info.icon;
            this.platformIcon.onerror = () => {
                // 图标加载失败时的fallback
                this.platformIcon.style.display = 'none';
                const fallbackIcon = document.createElement('span');
                fallbackIcon.textContent = platform === 'douyin' ? '🎵' : '📹';
                fallbackIcon.className = 'platform-icon-fallback';
                this.platformIcon.parentNode.insertBefore(fallbackIcon, this.platformIcon);
            };
            
            this.platformName.textContent = info.name;
            // 清除旧的平台样式类
            this.platformIndicator.classList.remove('douyin-platform', 'xiaohongshu-platform');
            // 添加新的平台样式类
            if (info.className) {
                this.platformIndicator.classList.add(info.className);
            }
            this.platformIndicator.classList.remove('hidden');
        }
    }

    hidePlatformIndicator() {
        if (this.platformIndicator) {
            this.platformIndicator.classList.add('hidden');
        }
    }

    enableParseButton() {
        if (this.parseButton) {
            this.parseButton.disabled = false;
            this.parseButton.classList.remove('disabled');
        }
    }

    disableParseButton() {
        if (this.parseButton) {
            this.parseButton.disabled = true;
            this.parseButton.classList.add('disabled');
        }
    }

    async parseAndDownload() {
        if (this.isLoading) return;
        
        const input = this.inputTextarea.value.trim();
        if (!input) {
            this.showError('请输入内容');
            return;
        }

        try {
            this.showLoading();
            this.hideError();
            this.hideResult();

            // 调用统一解析API
            const response = await fetch('/api/universal-parse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ input: input })
            });

            const result = await response.json();

            if (result.success) {
                this.currentResult = result;
                this.showResult(result);
            } else {
                this.showError(result.error || '解析失败');
            }

        } catch (error) {
            console.error('解析错误:', error);
            this.showError('网络错误，请稍后重试');
        } finally {
            this.hideLoading();
        }
    }

    showLoading() {
        this.isLoading = true;
        this.parseButton.disabled = true;
        
        // 显示按钮加载状态
        const buttonText = this.parseButton.querySelector('.button-text');
        const buttonLoading = this.parseButton.querySelector('.button-loading');
        if (buttonText) buttonText.classList.add('hidden');
        if (buttonLoading) buttonLoading.classList.remove('hidden');
        
        // 显示加载容器
        if (this.loadingContainer) {
            this.loadingContainer.classList.remove('hidden');
            this.animateLoadingStages();
        }
    }

    hideLoading() {
        this.isLoading = false;
        this.parseButton.disabled = false;
        
        // 恢复按钮状态
        const buttonText = this.parseButton.querySelector('.button-text');
        const buttonLoading = this.parseButton.querySelector('.button-loading');
        if (buttonText) buttonText.classList.remove('hidden');
        if (buttonLoading) buttonLoading.classList.add('hidden');
        
        // 隐藏加载容器
        if (this.loadingContainer) {
            this.loadingContainer.classList.add('hidden');
        }
    }

    animateLoadingStages() {
        const stages = ['detectingStage', 'extractingStage', 'parsingStage', 'preparingStage'];
        let currentStage = 0;

        const animateNext = () => {
            if (currentStage > 0) {
                const prevElement = document.getElementById(stages[currentStage - 1]);
                if (prevElement) {
                    prevElement.classList.remove('active');
                    prevElement.classList.add('completed');
                }
            }

            if (currentStage < stages.length && this.isLoading) {
                const currentElement = document.getElementById(stages[currentStage]);
                if (currentElement) {
                    currentElement.classList.add('active');
                }
                currentStage++;
                setTimeout(animateNext, 800);
            }
        };

        animateNext();
    }

    showError(message) {
        if (this.errorContainer) {
            this.errorContainer.classList.remove('hidden');
            this.errorMessage.textContent = message;
        }
    }

    hideError() {
        if (this.errorContainer) {
            this.errorContainer.classList.add('hidden');
        }
    }

    showResult(result) {
        if (!this.resultContainer || !this.resultContent) return;

        // 根据平台渲染不同的结果界面
        if (result.platform === 'douyin') {
            this.renderDouyinResult(result.data);
        } else if (result.platform === 'xiaohongshu') {
            this.renderXiaohongshuResult(result.data);
        }

        this.resultContainer.classList.remove('hidden');
    }

    hideResult() {
        if (this.resultContainer) {
            this.resultContainer.classList.add('hidden');
        }
    }

    renderDouyinResult(data) {
        this.resultContent.innerHTML = `
            <div class="result-header">
                <div class="platform-badge douyin">
                    <img src="/icons/douyin.svg" alt="抖音" class="platform-icon">
                    <span>抖音视频</span>
                </div>
                <div class="result-title">${data.title}</div>
                <div class="result-author">作者: ${data.author.name}</div>
            </div>
            
            <div class="result-preview">
                ${data.thumbnail ? `<img src="${data.thumbnail}" alt="视频封面" class="result-thumbnail">` : ''}
            </div>
            
            <div class="download-actions">
                ${data.downloadUrls.video ? `
                    <button class="download-btn video-btn" onclick="universalParser.downloadDouyinVideo()">
                        <img src="/icons/download.svg" alt="下载" class="btn-icon">
                        <span class="btn-text">下载视频</span>
                        <span class="btn-progress"></span>
                        <div class="download-progress"></div>
                    </button>
                ` : ''}
                ${data.downloadUrls.audio ? `
                    <button class="download-btn audio-btn" onclick="universalParser.downloadDouyinAudio()">
                        <img src="/icons/download.svg" alt="下载" class="btn-icon">
                        <span class="btn-text">下载音频</span>
                        <span class="btn-progress"></span>
                        <div class="download-progress"></div>
                    </button>
                ` : ''}
            </div>
        `;
    }

    renderXiaohongshuResult(data) {
        this.resultContent.innerHTML = `
            <div class="result-header">
                <div class="platform-badge xiaohongshu">
                    <img src="/icons/renote.svg" alt="小红书" class="platform-icon">
                    <span>小红书视频</span>
                </div>
                <div class="result-title">${data.title}</div>
                <div class="result-author">作者: ${data.author.name}</div>
            </div>
            
            <div class="result-preview">
                ${data.thumbnail ? `<img src="${data.thumbnail}" alt="视频封面" class="result-thumbnail">` : ''}
            </div>
            
            <div class="download-actions">
                ${data.downloadUrls.video ? `
                    <button class="download-btn video-btn" onclick="universalParser.downloadXiaohongshuVideo()">
                        <img src="/icons/download.svg" alt="下载" class="btn-icon">
                        <span class="btn-text">下载视频</span>
                        <span class="btn-progress"></span>
                        <div class="download-progress"></div>
                    </button>
                ` : ''}
            </div>
        `;
    }

    // 抖音下载方法
    async downloadDouyinVideo() {
        console.log('downloadDouyinVideo called!');
        if (!this.currentResult || !this.currentResult.data.downloadUrls.video) {
            this.showError('没有可下载的视频');
            return;
        }

        const button = document.querySelector('.download-btn.video-btn');
        console.log('Button found:', button);
        if (!button || button.classList.contains('downloading')) {
            return;
        }

        try {
            // 开始下载状态
            this.setDownloadingState(button, true);
            
            const downloadUrl = this.currentResult.data.downloadUrls.video;
            const title = this.currentResult.data.title;
            
            // 调用后端下载API
            await this.realDownloadFile('/api/download-video', {
                downloadUrl: downloadUrl,
                title: title
            }, button, `${this.generateFilename(title)}.mp4`);
            
            // 完成状态
            this.setDownloadingState(button, false);
            this.setCompletedState(button);
            this.showSuccessToast('视频下载完成！');
            
        } catch (error) {
            console.error('下载错误:', error);
            this.setDownloadingState(button, false);
            this.showError('下载失败，请稍后重试');
        }
    }

    async downloadDouyinAudio() {
        if (!this.currentResult || !this.currentResult.data.downloadUrls.audio) {
            this.showError('没有可下载的音频');
            return;
        }

        const button = document.querySelector('.download-btn.audio-btn');
        if (!button || button.classList.contains('downloading')) {
            return;
        }

        try {
            // 开始下载状态
            this.setDownloadingState(button, true);
            
            const downloadUrl = this.currentResult.data.downloadUrls.audio;
            const title = this.currentResult.data.title;
            
            // 调用后端下载API
            await this.realDownloadFile('/api/download-audio', {
                downloadUrl: downloadUrl,
                title: title
            }, button, `${this.generateFilename(title)}.mp3`);
            
            // 完成状态
            this.setDownloadingState(button, false);
            this.setCompletedState(button);
            this.showSuccessToast('音频下载完成！');
            
        } catch (error) {
            console.error('音频下载错误:', error);
            this.setDownloadingState(button, false);
            this.showError('音频下载失败，请稍后重试');
        }
    }

    // 小红书下载方法
    async downloadXiaohongshuVideo() {
        if (!this.currentResult || !this.currentResult.data.downloadUrls.video) {
            this.showError('没有可下载的视频');
            return;
        }

        const button = document.querySelector('.download-btn.video-btn');
        if (!button || button.classList.contains('downloading')) {
            return;
        }

        try {
            // 开始下载状态
            this.setDownloadingState(button, true);
            
            const downloadUrl = this.currentResult.data.downloadUrls.video;
            const title = this.currentResult.data.title;
            
            // 调用后端下载API
            await this.realDownloadFile('/api/xiaohongshu/download-video', {
                videoUrl: downloadUrl,
                title: title
            }, button, `${this.generateFilename(title)}.mp4`);
            
            // 完成状态
            this.setDownloadingState(button, false);
            this.setCompletedState(button);
            this.showSuccessToast('视频下载完成！');
            
        } catch (error) {
            console.error('视频下载错误:', error);
            this.setDownloadingState(button, false);
            this.showError('视频下载失败，请稍后重试');
        }
    }


    // 工具方法
    generateFilename(title) {
        const cleanTitle = (title || 'media')
            .substring(0, 50)
            .replace(/[^\w\s\u4e00-\u9fff-]/g, '')
            .replace(/\s+/g, '_');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '');
        return `${cleanTitle}_${timestamp}`;
    }

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

    // 直接下载文件（通过URL）
    directDownload(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // 真正的文件下载方法
    async realDownloadFile(apiUrl, data, button, filename) {
        const progressBar = button.querySelector('.download-progress');
        const progressText = button.querySelector('.btn-progress');
        
        try {
            // 显示初始进度
            if (progressBar) progressBar.style.width = '10%';
            if (progressText) progressText.textContent = '10%';
            
            // 调用后端下载API
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `下载失败: ${response.status}`);
            }
            
            // 更新进度
            if (progressBar) progressBar.style.width = '30%';
            if (progressText) progressText.textContent = '30%';
            
            // 获取文件流
            const blob = await response.blob();
            
            // 更新进度
            if (progressBar) progressBar.style.width = '80%';
            if (progressText) progressText.textContent = '80%';
            
            // 创建下载链接
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            link.style.display = 'none';
            
            // 执行下载
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // 清理URL
            setTimeout(() => {
                window.URL.revokeObjectURL(downloadUrl);
            }, 1000);
            
            // 完成进度
            if (progressBar) progressBar.style.width = '100%';
            if (progressText) progressText.textContent = '100%';
            
        } catch (error) {
            console.error('下载失败:', error);
            throw error;
        }
    }


    // 显示成功提示
    showSuccessToast(message) {
        // 移除已存在的提示
        const existingToast = document.querySelector('.success-toast');
        if (existingToast) {
            existingToast.remove();
        }

        // 创建新提示
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        // 3秒后自动移除
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }

    // 设置下载中状态
    setDownloadingState(button, isDownloading) {
        if (isDownloading) {
            button.classList.add('downloading');
            button.disabled = true;
        } else {
            button.classList.remove('downloading');
            button.disabled = false;
            // 重置进度
            const progressBar = button.querySelector('.download-progress');
            const progressText = button.querySelector('.btn-progress');
            if (progressBar) progressBar.style.width = '0%';
            if (progressText) progressText.textContent = '';
        }
    }

    // 设置完成状态
    setCompletedState(button) {
        button.classList.add('completed');
        const btnText = button.querySelector('.btn-text');
        if (btnText) {
            btnText.textContent = btnText.textContent.replace('下载', '已下载');
        }
        
        // 3秒后恢复状态
        setTimeout(() => {
            button.classList.remove('completed');
            if (btnText) {
                btnText.textContent = btnText.textContent.replace('已下载', '下载');
            }
        }, 3000);
    }

    retry() {
        this.hideError();
        this.parseAndDownload();
    }
}

// 创建全局实例
let universalParser;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    universalParser = new UniversalParser();
});