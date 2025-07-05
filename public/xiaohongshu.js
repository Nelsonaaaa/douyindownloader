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

        // 复制按钮
        this.copyTitleBtn = document.getElementById('copyTitleBtn');
        this.copyDescBtn = document.getElementById('copyDescBtn');

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

        // 复制功能事件
        this.copyTitleBtn.addEventListener('click', () => this.copyTitle());
        this.copyDescBtn.addEventListener('click', () => this.copyDescription());

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
        console.log('显示图片数据:', images);
        images.forEach((imageInfo, index) => {
            const img = document.createElement('img');
            
            // 使用代理API来加载图片，避免403错误
            const originalUrl = imageInfo.thumbnailUrl || imageInfo.url;
            const proxyUrl = `/api/xiaohongshu/proxy-image/${index}?url=${encodeURIComponent(originalUrl)}`;
            console.log(`加载图片 ${index + 1} 通过代理:`, proxyUrl);
            
            img.src = proxyUrl;
            img.alt = `图片 ${index + 1}`;
            img.title = `点击下载图片 ${index + 1}`;
            
            // 添加加载状态处理
            img.onload = () => {
                console.log(`图片 ${index + 1} 加载成功`);
                img.style.opacity = '1';
            };
            
            img.onerror = (e) => {
                console.error(`图片 ${index + 1} 加载失败:`, proxyUrl, e);
                img.style.background = 'linear-gradient(45deg, #f0f0f0, #e0e0e0)';
                img.style.display = 'flex';
                img.style.alignItems = 'center';
                img.style.justifyContent = 'center';
                img.style.color = '#666';
                img.textContent = `图片 ${index + 1}`;
            };
            
            // 初始透明，加载完成后显示
            img.style.opacity = '0.3';
            img.style.transition = 'opacity 0.3s ease';
            
            // 添加移动端长按预览功能
            this.addMobileLongPressPreview(img, imageInfo, index);
            
            // 点击直接下载
            img.addEventListener('click', (e) => {
                e.preventDefault();
                this.downloadSingleImage(imageInfo, index);
            });
            
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
        const shareText = this.contentUrlInput.value.trim();
        
        if (!shareText) {
            this.showError('请输入小红书分享文本');
            return;
        }

        if (!this.isValidXiaohongshuUrl(shareText)) {
            this.showError('请输入有效的小红书分享文本');
            return;
        }

        this.showLoading();

        try {
            console.log('发送解析请求:', shareText);
            
            const response = await fetch('/api/xiaohongshu/parse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ shareText: shareText })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
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


    isValidXiaohongshuUrl(shareText) {
        return shareText.includes('xiaohongshu.com') || shareText.includes('xhslink.com') || shareText.includes('小红书');
    }

    // 单张图片下载功能
    async downloadSingleImage(imageInfo, index) {
        if (!imageInfo || !imageInfo.url) {
            this.showError('图片信息缺失');
            return;
        }

        // 获取被点击的图片元素，添加下载状态
        const imgElement = this.previewImages.children[index];
        const originalStyle = imgElement.style.cssText;
        
        try {
            // 添加下载中的视觉反馈
            imgElement.style.opacity = '0.6';
            imgElement.style.transform = 'scale(0.95)';
            imgElement.style.filter = 'blur(1px)';
            
            console.log(`开始下载第 ${index + 1} 张图片...`);
            
            // 调用后端API下载单张图片
            const response = await fetch('/api/xiaohongshu/download-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    imageUrl: imageInfo.url,
                    title: this.currentContentData.title || '小红书图片',
                    index: index
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // 获取图片文件
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            // 创建下载链接
            const link = document.createElement('a');
            link.href = url;
            link.download = `xiaohongshu_image_${index + 1}_${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            
            // 下载成功的视觉反馈
            imgElement.style.cssText = originalStyle;
            imgElement.style.transform = 'scale(1.05)';
            setTimeout(() => {
                imgElement.style.transform = '';
            }, 300);
            
            this.showSuccessMessage(`图片 ${index + 1} 下载完成`);

        } catch (error) {
            console.error('单张图片下载错误:', error);
            // 恢复原始样式
            imgElement.style.cssText = originalStyle;
            this.showError(`图片 ${index + 1} 下载失败: ${error.message}`);
        }
    }

    // 复制功能 - 修复版本
    async copyTitle() {
        if (!this.currentContentData || !this.currentContentData.title) {
            this.showError('没有可复制的标题');
            return;
        }

        try {
            // 优先使用现代API
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(this.currentContentData.title);
                this.showSuccessMessage('标题已复制到剪贴板');
            } else {
                // 降级到传统方法
                this.fallbackCopyText(this.currentContentData.title);
                this.showSuccessMessage('标题已复制到剪贴板');
            }
        } catch (error) {
            console.error('复制失败:', error);
            // 尝试降级方法
            try {
                this.fallbackCopyText(this.currentContentData.title);
                this.showSuccessMessage('标题已复制到剪贴板');
            } catch (fallbackError) {
                this.showError('复制失败，请手动复制');
            }
        }
    }

    async copyDescription() {
        if (!this.currentContentData || !this.currentContentData.description) {
            this.showError('没有可复制的描述');
            return;
        }

        try {
            // 优先使用现代API
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(this.currentContentData.description);
                this.showSuccessMessage('描述已复制到剪贴板');
            } else {
                // 降级到传统方法
                this.fallbackCopyText(this.currentContentData.description);
                this.showSuccessMessage('描述已复制到剪贴板');
            }
        } catch (error) {
            console.error('复制失败:', error);
            // 尝试降级方法
            try {
                this.fallbackCopyText(this.currentContentData.description);
                this.showSuccessMessage('描述已复制到剪贴板');
            } catch (fallbackError) {
                this.showError('复制失败，请手动复制');
            }
        }
    }

    // 降级复制方法
    fallbackCopyText(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!successful) {
            throw new Error('Fallback copy failed');
        }
    }

    // 显示成功信息
    showSuccessMessage(message) {
        // 创建临时提示
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // 添加移动端长按预览功能
    addMobileLongPressPreview(img, imageInfo, index) {
        let longPressTimer = null;
        let isLongPress = false;
        let previewModal = null;

        // 创建长按预览模态框
        const createPreviewModal = () => {
            const modal = document.createElement('div');
            modal.className = 'mobile-preview-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                backdrop-filter: blur(5px);
                animation: fadeIn 0.2s ease-out;
            `;

            const previewImg = document.createElement('img');
            const originalUrl = imageInfo.url;
            const proxyUrl = `/api/xiaohongshu/proxy-image/${index}?url=${encodeURIComponent(originalUrl)}`;
            previewImg.src = proxyUrl;
            previewImg.style.cssText = `
                max-width: 90%;
                max-height: 80%;
                object-fit: contain;
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                animation: zoomIn 0.2s ease-out;
            `;

            const closeBtn = document.createElement('div');
            closeBtn.textContent = '✕';
            closeBtn.style.cssText = `
                position: absolute;
                top: 20px;
                right: 20px;
                color: white;
                font-size: 24px;
                font-weight: bold;
                cursor: pointer;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(10px);
            `;

            const downloadHint = document.createElement('div');
            downloadHint.textContent = '轻触下载图片';
            downloadHint.style.cssText = `
                position: absolute;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                color: rgba(255, 255, 255, 0.8);
                font-size: 14px;
                background: rgba(0, 0, 0, 0.5);
                padding: 8px 16px;
                border-radius: 20px;
                backdrop-filter: blur(10px);
            `;

            modal.appendChild(previewImg);
            modal.appendChild(closeBtn);
            modal.appendChild(downloadHint);

            // 关闭预览的事件
            const closePreview = () => {
                modal.style.animation = 'fadeOut 0.2s ease-out';
                setTimeout(() => {
                    if (modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                }, 200);
                document.body.style.overflow = '';
            };

            closeBtn.addEventListener('click', closePreview);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closePreview();
                }
            });

            // 点击图片下载
            previewImg.addEventListener('click', (e) => {
                e.stopPropagation();
                closePreview();
                this.downloadSingleImage(imageInfo, index);
            });

            return modal;
        };

        // 触摸开始
        img.addEventListener('touchstart', (e) => {
            isLongPress = false;
            longPressTimer = setTimeout(() => {
                isLongPress = true;
                // 添加触觉反馈
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
                
                // 显示预览
                previewModal = createPreviewModal();
                document.body.appendChild(previewModal);
                document.body.style.overflow = 'hidden';
                
                // 视觉反馈
                img.style.transform = 'scale(0.95)';
                img.style.opacity = '0.7';
            }, 500); // 500ms长按阈值
        }, { passive: false });

        // 触摸结束
        img.addEventListener('touchend', (e) => {
            clearTimeout(longPressTimer);
            
            // 恢复样式
            img.style.transform = '';
            img.style.opacity = '';
            
            if (isLongPress) {
                // 阻止点击事件
                e.preventDefault();
                e.stopPropagation();
            }
        }, { passive: false });

        // 触摸移动时取消长按
        img.addEventListener('touchmove', (e) => {
            clearTimeout(longPressTimer);
            img.style.transform = '';
            img.style.opacity = '';
        }, { passive: true });
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
            const currentImageInfo = this.currentContentData.images[this.currentImageIndex];
            // 使用代理API加载高质量图片
            const originalUrl = currentImageInfo.url;
            const proxyUrl = `/api/xiaohongshu/proxy-image/${this.currentImageIndex}?url=${encodeURIComponent(originalUrl)}`;
            this.currentImage.src = proxyUrl;
        }
    }

    createImageThumbnails() {
        this.galleryThumbs.innerHTML = '';
        
        if (this.currentContentData && this.currentContentData.images) {
            this.currentContentData.images.forEach((imageInfo, index) => {
                const thumb = document.createElement('img');
                // 使用代理API加载缩略图
                const originalUrl = imageInfo.thumbnailUrl || imageInfo.url;
                const proxyUrl = `/api/xiaohongshu/proxy-image/${index}?url=${encodeURIComponent(originalUrl)}`;
                thumb.src = proxyUrl;
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

            // 调用后端API批量下载图片
            const response = await fetch('/api/xiaohongshu/download-images', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    images: this.currentContentData.images,
                    title: this.currentContentData.title || 'xiaohongshu_images'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // 获取ZIP文件
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            // 创建下载链接
            const link = document.createElement('a');
            link.href = url;
            link.download = `xiaohongshu_images_${Date.now()}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            console.log('图片下载完成');

        } catch (error) {
            console.error('图片下载错误:', error);
            this.showError('图片下载失败，请稍后重试: ' + error.message);
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

            // 调用后端API下载视频
            const response = await fetch('/api/xiaohongshu/download-video', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    videoUrl: this.currentContentData.videoUrl,
                    title: this.currentContentData.title || 'xiaohongshu_video'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // 获取视频文件
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            // 创建下载链接
            const link = document.createElement('a');
            link.href = url;
            link.download = `xiaohongshu_video_${Date.now()}.mp4`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            console.log('视频下载完成');

        } catch (error) {
            console.error('视频下载错误:', error);
            this.showError('视频下载失败，请稍后重试: ' + error.message);
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

    async saveNote() {
        if (!this.currentContentData) {
            this.showError('没有可保存的笔记内容');
            return;
        }

        try {
            // 调用后端API导出笔记
            const response = await fetch('/api/xiaohongshu/export-note', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: this.currentContentData.title,
                    description: this.currentContentData.description,
                    author: this.currentContentData.author,
                    stats: {
                        likeCount: this.currentContentData.likeCount,
                        commentCount: this.currentContentData.commentCount,
                        collectCount: this.currentContentData.collectCount,
                        shareCount: this.currentContentData.shareCount
                    },
                    tags: this.currentContentData.tags || []
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // 获取文本文件
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            // 创建下载链接
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
            this.showError('笔记保存失败，请稍后重试: ' + error.message);
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