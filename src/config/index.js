require('dotenv').config();

const config = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3003,
  },

  // API配置
  apis: {
    // 抖音API配置 - 使用v3端点
    rapidapi: {
      key: process.env.RAPIDAPI_KEY || '3432c861c6msh5b60758163ec8d3p138733jsn7db8b1f9847d',
      host: process.env.DOUYIN_RAPIDAPI_HOST || 'tiktok-douyin-xiaohongshu-weibo-instagram-api.p.rapidapi.com',
      url: 'https://tiktok-douyin-xiaohongshu-weibo-instagram-api.p.rapidapi.com/api/v1/douyin/app/v3/fetch_one_video_by_share_url',
      auth: 'Bearer x5ordnxU3CYgkBsu1GXvpkERgl4buJPmvZFK0S7ptk4f/0cVWOR56SaICA=='
    },
    // 小红书API配置
    xiaohongshu: {
      key: process.env.RAPIDAPI_KEY || '3432c861c6msh5b60758163ec8d3p138733jsn7db8b1f9847d',
      host: process.env.XIAOHONGSHU_RAPIDAPI_HOST || 'tiktok-douyin-xiaohongshu-weibo-instagram-api.p.rapidapi.com',
      url: 'https://tiktok-douyin-xiaohongshu-weibo-instagram-api.p.rapidapi.com/api/v1/xiaohongshu/web/get_note_info_v3',
      auth: 'Bearer x5ordnxU3CYgkBsu1GXvpkERgl4buJPmvZFK0S7ptk4f/0cVWOR56SaICA=='
    },
    juhe: {
      key: process.env.JUHE_API_KEY,
      url: 'http://apis.juhe.cn/fapig/douyin/detail'
    },
    apispace: {
      token: process.env.APISPACE_TOKEN,
      url: 'https://eolink.o.apispace.com/douyin-video/video/info'
    }
  },

  // 网络请求配置
  request: {
    timeout: 15000,
    maxRedirects: 10,
    downloadTimeout: 60000
  },

  // 支持的平台
  platforms: {
    douyin: {
      domains: ['douyin.com', 'v.douyin.com'],
      name: '抖音'
    },
    xiaohongshu: {
      domains: ['xiaohongshu.com', 'xhslink.com'],
      name: '小红书'
    }
  }
};

// 动态更新API配置的方法
const updateApiConfig = (updates) => {
  if (updates.rapidApiKey && updates.rapidApiKey !== 'your_rapidapi_key_here') {
    config.apis.rapidapi.key = updates.rapidApiKey;
    process.env.RAPIDAPI_KEY = updates.rapidApiKey;
  }
  if (updates.rapidApiHost) {
    config.apis.rapidapi.host = updates.rapidApiHost;
    process.env.RAPIDAPI_HOST = updates.rapidApiHost;
  }
  if (updates.juheKey) {
    config.apis.juhe.key = updates.juheKey;
    process.env.JUHE_API_KEY = updates.juheKey;
  }
  if (updates.apiSpaceToken) {
    config.apis.apispace.token = updates.apiSpaceToken;
    process.env.APISPACE_TOKEN = updates.apiSpaceToken;
  }
};

// 检查API配置是否可用
const isApiConfigured = (apiName) => {
  switch (apiName) {
    case 'rapidapi':
      return config.apis.rapidapi.key && config.apis.rapidapi.key !== 'your_rapidapi_key_here';
    case 'xiaohongshu':
      return config.apis.xiaohongshu.key && config.apis.xiaohongshu.key !== 'your_rapidapi_key_here';
    case 'juhe':
      return !!config.apis.juhe.key;
    case 'apispace':
      return !!config.apis.apispace.token;
    default:
      return false;
  }
};

module.exports = {
  config,
  updateApiConfig,
  isApiConfigured
};