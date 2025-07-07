# 图标文件夹

这个文件夹用于存放项目所需的图标文件。

## 建议的图标文件命名规范：

### 平台图标
- `douyin-logo.svg` - 抖音官方logo
- `xiaohongshu-logo.svg` - 小红书官方logo

### 功能图标
- `video-icon.svg` - 视频下载图标
- `audio-icon.svg` - 音频下载图标
- `download-icon.svg` - 通用下载图标
- `play-icon.svg` - 播放图标
- `pause-icon.svg` - 暂停图标
- `loading-icon.svg` - 加载图标

### 状态图标
- `success-icon.svg` - 成功图标
- `error-icon.svg` - 错误图标
- `warning-icon.svg` - 警告图标

## 推荐规格：
- 格式：SVG（矢量图，支持缩放）
- 尺寸：24x24px 或 32x32px
- 颜色：支持CSS变量或单色便于主题切换

## 使用方法：
上传图标后，代码中会自动引用这些文件来替换当前的base64编码图标。