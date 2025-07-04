class XiaohongshuDownloader {
    constructor() {
        this.initElements();
        this.bindEvents();
        this.currentContentData = null;
        this.currentImageIndex = 0;
    }

    initElements() {
        // 输入和控制元素
        this.contentUrlInput = document.getElementById('contentUrl');
        this.parseBtn = document.getElementById('parseBtn');
        this.loading = document.getElementById('loading');
        this.error = document.getElementById('error');
        this.errorMsg = document.getElementById('errorMsg');
        this.result = document.getElementById('result');

        // 内容展示元素
        this.contentTitle = document.getElementById('contentTitle');
        this.contentDesc = document.getElementById('contentDesc');
        this.contentAuthor = document.getElementById('contentAuthor');
        this.likeCount = document.getElementById('likeCount');
        this.commentCount = document.getElementById('commentCount');
        this.collectCount = document.getElementById('collectCount');

        // 预览区域元素
        this.contentPreview = document.getElementById('contentPreview');
        this.previewImages = document.getElementById('previewImages');
        this.previewVideo = document.getElementById('previewVideo');
        this.videoCover = document.getElementById('videoCover');

        // 下载按钮
        this.downloadImagesBtn = document.getElementById('downloadImagesBtn');
        this.downloadVideoBtn = document.getElementById('downloadVideoBtn');
        this.saveNoteBtn = document.getElementById('saveNoteBtn');
        this.downloadAudioBtn = document.getElementById('downloadAudioBtn');

        // 模态框元素
        this.imageModal = document.getElementById('imageModal');
        this.videoModal = document.getElementById('videoModal');
        this.currentImage = document.getElementById('currentImage');
        this.galleryThumbs = document.getElementById('galleryThumbs');
        this.previewVideoPlayer = document.getElementById('previewVideoPlayer');
        this.videoSource = document.getElementById('videoSource');
        this.closeImageModal = document.getElementById('closeImageModal');
        this.closeVideoModal = document.getElementById('closeVideoModal');
    }

    bindEvents() {
        // 基础交互事件
        this.parseBtn.addEventListener('click', () => this.parseContent());
        this.contentUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.parseContent();
            }
        });

        // 下载功能事件
        this.downloadImagesBtn.addEventListener('click', () => this.downloadImages());
        this.downloadVideoBtn.addEventListener('click', () => this.downloadVideo());
        this.saveNoteBtn.addEventListener('click', () => this.saveNote());
        this.downloadAudioBtn.addEventListener('click', () => this.downloadAudio());

        // 预览事件
        this.previewVideo.addEventListener('click', () => this.showVideoPreview());

        // 模态框事件
        this.closeImageModal.addEventListener('click', () => this.hideImageModal());
        this.closeVideoModal.addEventListener('click', () => this.hideVideoModal());
        
        this.imageModal.addEventListener('click', (e) => {
            if (e.target === this.imageModal) {
                this.hideImageModal();
            }
        });
        
        this.videoModal.addEventListener('click', (e) => {
            if (e.target === this.videoModal) {
                this.hideVideoModal();
            }
        });

        // 键盘ESC关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideImageModal();
                this.hideVideoModal();
            }
        });

        // 自动清理输入框
        this.contentUrlInput.addEventListener('paste', (e) => {
            setTimeout(() => {
                this.cleanUrl();
            }, 100);
        });
    }

    cleanUrl() {
        let url = this.contentUrlInput.value.trim();
        if (url) {
            // 提取链接中的有效部分
            const match = url.match(/(https?:\/\/[^\s]+)/);
            if (match) {
                this.contentUrlInput.value = match[1];
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
        this.parseBtn.textContent = '解析内容';
    }

    showError(message) {
        this.error.classList.remove('hidden');
        this.errorMsg.textContent = message;
        this.result.classList.add('hidden');
    }

    showResult(data) {
        this.currentContentData = data;
        this.result.classList.remove('hidden');
        this.error.classList.add('hidden');

        // 显示内容信息
        this.contentTitle.textContent = data.title || '无标题';
        this.contentDesc.textContent = data.description || '暂无描述';
        this.contentAuthor.textContent = '觅安-if'; // 固定显示
        
        // 显示统计数据
        this.likeCount.textContent = data.likeCount || '-';
        this.commentCount.textContent = data.commentCount || '-';
        this.collectCount.textContent = data.collectCount || '-';

        // 根据内容类型显示不同的预览
        this.displayContentPreview(data);
        
        // 显示/隐藏相应的下载按钮
        this.updateDownloadButtons(data);

        console.log('显示解析结果:', data);
    }

    displayContentPreview(data) {
        // 清空之前的预览
        this.previewImages.innerHTML = '';
        this.previewVideo.classList.add('hidden');

        if (data.images && data.images.length > 0) {
            // 显示图片内容
            this.displayImages(data.images);
        } else if (data.videoUrl) {
            // 显示视频内容
            this.displayVideo(data);
        }
    }

    displayImages(images) {
        images.forEach((imageUrl, index) => {
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = `图片 ${index + 1}`;
            img.addEventListener('click', () => this.showImageModal(index));
            this.previewImages.appendChild(img);
        });
    }

    displayVideo(data) {
        this.previewVideo.classList.remove('hidden');
        this.videoCover.src = data.cover || '';
        this.videoCover.alt = '视频封面';
    }

    updateDownloadButtons(data) {
        // 图片下载按钮
        if (data.images && data.images.length > 0) {
            this.downloadImagesBtn.classList.remove('hidden');
            this.downloadImagesBtn.textContent = `📸 下载图片 (${data.images.length})`;
        } else {
            this.downloadImagesBtn.classList.add('hidden');
        }

        // 视频下载按钮
        if (data.videoUrl) {
            this.downloadVideoBtn.classList.remove('hidden');
        } else {
            this.downloadVideoBtn.classList.add('hidden');
        }

        // 音频下载按钮
        if (data.audioUrl) {
            this.downloadAudioBtn.classList.remove('hidden');
        } else {
            this.downloadAudioBtn.classList.add('hidden');
        }

        // 笔记保存按钮始终显示
        this.saveNoteBtn.classList.remove('hidden');
    }

    async parseContent() {
        const url = this.contentUrlInput.value.trim();
        
        if (!url) {
            this.showError('请输入小红书分享链接');
            return;
        }

        if (!this.isValidXiaohongshuUrl(url)) {
            this.showError('请输入有效的小红书链接');
            return;
        }

        this.showLoading();

        try {
            console.log('发送解析请求:', url);
            
            // 这里将来会调用小红书解析API
            // const response = await fetch('/api/xiaohongshu/parse', {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify({ url: url })
            // });

            // 暂时使用模拟数据进行演示
            setTimeout(() => {
                const mockData = this.generateMockData(url);
                this.showResult(mockData);
                this.hideLoading();
            }, 2000);

        } catch (error) {
            console.error('解析错误:', error);
            this.showError('网络错误，请稍后重试: ' + error.message);
            this.hideLoading();
        }
    }

    generateMockData(url) {
        // 模拟不同类型的小红书内容
        const contentTypes = ['images', 'video'];
        const type = contentTypes[Math.floor(Math.random() * contentTypes.length)];

        const baseData = {
            id: 'xhs_' + Date.now(),
            title: '这是一个示例小红书内容标题',
            description: '这里是内容的详细描述，包含了作者想要分享的所有精彩内容。明天会添加真实的API解析功能。',
            author: '示例作者',
            likeCount: Math.floor(Math.random() * 10000),
            commentCount: Math.floor(Math.random() * 1000),
            collectCount: Math.floor(Math.random() * 5000),
            createTime: new Date().toISOString()
        };

        if (type === 'images') {
            return {
                ...baseData,
                type: 'images',
                images: [
                    'https://via.placeholder.com/400x600/FF2442/FFFFFF?text=图片1',
                    'https://via.placeholder.com/400x600/FF6B9D/FFFFFF?text=图片2',
                    'https://via.placeholder.com/400x600/FF8E53/FFFFFF?text=图片3'
                ]
            };
        } else {
            return {
                ...baseData,
                type: 'video',
                videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
                cover: 'https://via.placeholder.com/400x600/FF2442/FFFFFF?text=视频封面',
                duration: 60,
                audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'
            };
        }
    }

    isValidXiaohongshuUrl(url) {
        return url.includes('xiaohongshu.com') || url.includes('xhslink.com');
    }

    // 图片预览模态框
    showImageModal(startIndex = 0) {
        if (!this.currentContentData || !this.currentContentData.images) {
            return;
        }

        this.currentImageIndex = startIndex;
        this.updateImageModal();
        this.createImageThumbnails();
        this.imageModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    updateImageModal() {
        if (this.currentContentData && this.currentContentData.images) {
            const currentImageUrl = this.currentContentData.images[this.currentImageIndex];
            this.currentImage.src = currentImageUrl;
        }
    }

    createImageThumbnails() {
        this.galleryThumbs.innerHTML = '';
        
        if (this.currentContentData && this.currentContentData.images) {
            this.currentContentData.images.forEach((imageUrl, index) => {
                const thumb = document.createElement('img');
                thumb.src = imageUrl;
                thumb.alt = `缩略图 ${index + 1}`;
                thumb.classList.toggle('active', index === this.currentImageIndex);
                thumb.addEventListener('click', () => {
                    this.currentImageIndex = index;
                    this.updateImageModal();
                    this.createImageThumbnails(); // 更新激活状态
                });
                this.galleryThumbs.appendChild(thumb);
            });
        }
    }

    hideImageModal() {
        this.imageModal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    // 视频预览模态框
    showVideoPreview() {
        if (!this.currentContentData || !this.currentContentData.videoUrl) {
            this.showError('无法预览，缺少视频链接');
            return;
        }

        this.videoSource.src = this.currentContentData.videoUrl;
        this.previewVideoPlayer.load();
        this.videoModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    hideVideoModal() {
        this.videoModal.classList.add('hidden');
        this.previewVideoPlayer.pause();
        this.videoSource.src = '';
        document.body.style.overflow = '';
    }

    // 下载功能
    async downloadImages() {
        if (!this.currentContentData || !this.currentContentData.images) {
            this.showError('没有可下载的图片');
            return;
        }

        try {
            this.downloadImagesBtn.disabled = true;
            this.downloadImagesBtn.textContent = '📸 下载中...';

            // 这里将来会调用后端API批量下载图片
            // 现在模拟下载过程
            for (let i = 0; i < this.currentContentData.images.length; i++) {
                const imageUrl = this.currentContentData.images[i];
                const filename = `xiaohongshu_image_${i + 1}_${Date.now()}.jpg`;
                
                // 模拟下载延迟
                await new Promise(resolve => setTimeout(resolve, 500));
                console.log(`下载图片: ${filename}`);
                
                // 实际下载逻辑将在后端API实现后添加
                // this.downloadFile(imageUrl, filename);
            }

            console.log('所有图片下载完成');

        } catch (error) {
            console.error('图片下载错误:', error);
            this.showError('图片下载失败，请稍后重试');
        } finally {
            this.downloadImagesBtn.disabled = false;
            this.downloadImagesBtn.textContent = `📸 下载图片 (${this.currentContentData.images.length})`;
        }
    }

    async downloadVideo() {
        if (!this.currentContentData || !this.currentContentData.videoUrl) {
            this.showError('没有可下载的视频');
            return;
        }

        try {
            this.downloadVideoBtn.disabled = true;
            this.downloadVideoBtn.textContent = '📹 下载中...';

            // 这里将来会调用后端API下载视频
            console.log('开始下载视频:', this.currentContentData.videoUrl);
            
            // 模拟下载过程
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log('视频下载完成');

        } catch (error) {
            console.error('视频下载错误:', error);
            this.showError('视频下载失败，请稍后重试');
        } finally {
            this.downloadVideoBtn.disabled = false;
            this.downloadVideoBtn.textContent = '📹 下载视频';
        }
    }

    async downloadAudio() {
        if (!this.currentContentData || !this.currentContentData.audioUrl) {
            this.showError('没有可下载的音频');
            return;
        }

        try {
            this.downloadAudioBtn.disabled = true;
            this.downloadAudioBtn.textContent = '🎵 下载中...';

            // 这里将来会调用后端API下载音频
            console.log('开始下载音频:', this.currentContentData.audioUrl);
            
            // 模拟下载过程
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log('音频下载完成');

        } catch (error) {
            console.error('音频下载错误:', error);
            this.showError('音频下载失败，请稍后重试');
        } finally {
            this.downloadAudioBtn.disabled = false;
            this.downloadAudioBtn.textContent = '🎵 提取音频';
        }
    }

    saveNote() {
        if (!this.currentContentData) {
            this.showError('没有可保存的笔记内容');
            return;
        }

        try {
            const noteContent = this.generateNoteContent();
            const blob = new Blob([noteContent], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `xiaohongshu_note_${Date.now()}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            console.log('笔记保存成功');

        } catch (error) {
            console.error('保存笔记错误:', error);
            this.showError('笔记保存失败，请稍后重试');
        }
    }

    generateNoteContent() {
        const data = this.currentContentData;
        let content = '';
        
        content += '=== 小红书笔记内容 ===\n\n';
        content += `标题: ${data.title || '无标题'}\n\n`;
        content += `作者: ${data.author || '未知作者'}\n\n`;
        content += `内容描述:\n${data.description || '暂无描述'}\n\n`;
        
        if (data.likeCount) {
            content += `👍 点赞: ${data.likeCount}\n`;
        }
        if (data.commentCount) {
            content += `💬 评论: ${data.commentCount}\n`;
        }
        if (data.collectCount) {
            content += `⭐ 收藏: ${data.collectCount}\n`;
        }
        
        content += `\n保存时间: ${new Date().toLocaleString()}\n`;
        content += `\n--- 由觅安小红书助手保存 ---`;
        
        return content;
    }

    // 工具方法
    downloadFile(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new XiaohongshuDownloader();
    console.log('小红书助手初始化完成');
});