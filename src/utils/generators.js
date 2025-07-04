// 生成UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// 生成OpenUDID
const generateOpenUDID = () => {
  return Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('');
};

// 生成Cookie
const generateCookie = () => {
  return `install_id=${Math.floor(Math.random() * 9999999999)}; ttreq=1$${generateUUID()}; d_ticket=${generateUUID().replace(/-/g, '')}; odin_tt=${generateUUID().replace(/-/g, '')}`;
};

// 生成X-Gorgon签名 (简化版)
const generateXGorgon = (params, timestamp) => {
  const str = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  return Buffer.from(str + timestamp).toString('base64').substring(0, 32);
};

// 生成移动端API参数
const generateMobileApiParams = (videoId) => {
  const timestamp = Math.floor(Date.now() / 1000);
  
  const params = {
    aweme_id: videoId,
    aid: '1128',
    version_name: '23.5.0',
    device_platform: 'android',
    os_version: '2333',
    channel: 'wandoujia_aweme',
    device_type: 'OPPO R11 Plus',
    language: 'zh',
    uuid: generateUUID(),
    openudid: generateOpenUDID(),
    manifest_version_code: '230500',
    resolution: '1080*1920',
    dpi: '420',
    update_version_code: '230500'
  };

  return {
    params,
    timestamp,
    headers: {
      'User-Agent': 'com.ss.android.ugc.aweme/230500 (Linux; U; Android 7.1.1; zh_CN; OPPO R11 Plus; Build/NMF26X; Cronet/TTNetVersion:b4d74d15 2020-04-23 QuicVersion:0144d358 2020-03-24)',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Cookie': generateCookie(),
      'X-Khronos': timestamp.toString(),
      'X-Gorgon': generateXGorgon(params, timestamp),
      'X-Pods': '',
      'sdk-version': '2'
    }
  };
};

module.exports = {
  generateUUID,
  generateOpenUDID,
  generateCookie,
  generateXGorgon,
  generateMobileApiParams
};