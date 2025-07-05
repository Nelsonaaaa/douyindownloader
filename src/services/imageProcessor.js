const axios = require('axios');
const sharp = require('sharp');
const { getRandomUserAgent } = require('../utils/userAgent');
const { generateSafeFilename } = require('../utils/textUtils');

class ImageProcessor {
  constructor() {
    this.supportedFormats = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff'];
  }

  // 下载并转换图片为JPG格式
  async downloadAndConvertToJpg(imageUrl, title = '', index = 0) {
    try {
      console.log(`开始下载并转换图片 ${index + 1}:`, imageUrl.substring(0, 100) + '...');
      
      // 下载图片
      const imageBuffer = await this.downloadImage(imageUrl);
      
      // 转换为JPG格式
      const jpgBuffer = await this.convertToJpg(imageBuffer);
      
      // 生成文件名
      const filename = this.generateImageFilename(title, index);
      
      console.log(`图片转换完成: ${filename}`);
      
      return {
        buffer: jpgBuffer,
        filename: filename,
        size: jpgBuffer.length,
        mimeType: 'image/jpeg'
      };
      
    } catch (error) {
      console.error(`图片处理失败 ${index + 1}:`, error.message);
      throw new Error(`图片 ${index + 1} 处理失败: ${error.message}`);
    }
  }

  // 下载图片
  async downloadImage(imageUrl) {
    try {
      const response = await axios({
        method: 'GET',
        url: imageUrl,
        responseType: 'arraybuffer',
        timeout: 30000, // 30秒超时
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Referer': 'https://www.xiaohongshu.com/',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
        }
      });
      
      return Buffer.from(response.data);
      
    } catch (error) {
      throw new Error(`下载图片失败: ${error.message}`);
    }
  }

  // 转换图片为JPG格式
  async convertToJpg(imageBuffer, options = {}) {
    try {
      const defaultOptions = {
        quality: 90,        // JPG质量 (1-100)
        progressive: true,  // 渐进式JPG
        mozjpeg: true      // 使用mozjpeg编码器
      };
      
      const jpegOptions = { ...defaultOptions, ...options };
      
      // 使用sharp处理图片
      const sharpInstance = sharp(imageBuffer);
      
      // 获取图片信息
      const metadata = await sharpInstance.metadata();
      console.log(`原始图片格式: ${metadata.format}, 尺寸: ${metadata.width}x${metadata.height}`);
      
      // 转换为JPG
      const jpgBuffer = await sharpInstance
        .jpeg(jpegOptions)
        .toBuffer();
      
      console.log(`转换后大小: ${Math.round(jpgBuffer.length / 1024)}KB`);
      
      return jpgBuffer;
      
    } catch (error) {
      throw new Error(`图片格式转换失败: ${error.message}`);
    }
  }

  // 批量处理图片
  async batchProcessImages(images, title = '') {
    const results = [];
    const errors = [];
    
    console.log(`开始批量处理 ${images.length} 张图片...`);
    
    for (let i = 0; i < images.length; i++) {
      try {
        const result = await this.downloadAndConvertToJpg(images[i].url, title, i);
        results.push({
          ...result,
          originalIndex: i,
          originalUrl: images[i].url
        });
      } catch (error) {
        errors.push({
          index: i,
          url: images[i].url,
          error: error.message
        });
      }
    }
    
    console.log(`批量处理完成: 成功 ${results.length} 张, 失败 ${errors.length} 张`);
    
    return {
      success: results,
      errors: errors,
      total: images.length
    };
  }

  // 生成图片文件名
  generateImageFilename(title, index) {
    const baseName = generateSafeFilename(title || 'xiaohongshu_image', '');
    const paddedIndex = String(index + 1).padStart(2, '0');
    return `${baseName}_${paddedIndex}.jpg`;
  }

  // 压缩图片（可选功能）
  async compressImage(imageBuffer, maxWidth = 1920, quality = 85) {
    try {
      const compressedBuffer = await sharp(imageBuffer)
        .resize(maxWidth, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .jpeg({
          quality: quality,
          progressive: true
        })
        .toBuffer();
      
      const originalSize = imageBuffer.length;
      const compressedSize = compressedBuffer.length;
      const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
      
      console.log(`图片压缩完成: ${Math.round(originalSize/1024)}KB → ${Math.round(compressedSize/1024)}KB (压缩率: ${compressionRatio}%)`);
      
      return compressedBuffer;
      
    } catch (error) {
      throw new Error(`图片压缩失败: ${error.message}`);
    }
  }

  // 创建图片下载流
  async createImageDownloadStream(imageUrl) {
    try {
      const response = await axios({
        method: 'GET',
        url: imageUrl,
        responseType: 'stream',
        timeout: 30000,
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Referer': 'https://www.xiaohongshu.com/',
          'Accept': 'image/*'
        }
      });
      
      return response.data;
      
    } catch (error) {
      throw new Error(`创建图片下载流失败: ${error.message}`);
    }
  }

  // 获取图片信息（不下载）
  async getImageInfo(imageUrl) {
    try {
      const response = await axios({
        method: 'HEAD',
        url: imageUrl,
        timeout: 10000,
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Referer': 'https://www.xiaohongshu.com/'
        }
      });
      
      return {
        contentType: response.headers['content-type'],
        contentLength: response.headers['content-length'],
        lastModified: response.headers['last-modified'],
        url: imageUrl
      };
      
    } catch (error) {
      throw new Error(`获取图片信息失败: ${error.message}`);
    }
  }
}

module.exports = ImageProcessor;