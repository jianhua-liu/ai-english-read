const app = getApp();

function requestByUrl(url, data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data,
      timeout: 60000,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) return resolve(res.data);
        const msg = (res.data && (res.data.error || res.data.detail)) || ('HTTP ' + res.statusCode);
        reject(new Error(msg));
      },
      fail: (err) => {
        let msg = err.errMsg || '网络错误';
        if (msg.indexOf('url not in domain list') !== -1) msg = '域名未配置：请在微信公众平台把接口域名加入 request 合法域名';
        if (msg.indexOf('timeout') !== -1) msg = '请求超时，请换 WiFi 或稍后重试';
        reject(new Error(msg));
      },
    });
  });
}

function generateStory(grade, modelName) {
  const base = app.globalData.apiBase || '';
  if (base) {
    return requestByUrl(base + '/api/generate-story', {
      grade: grade || 'Grade 6',
      modelName: modelName || 'gemini-2.5-flash',
    });
  }
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'englishApi',
      data: {
        action: 'generateStory',
        grade: grade || 'Grade 6',
        modelName: modelName || 'gemini-2.5-flash',
      },
    })
      .then((res) => {
        const r = res.result;
        if (r && r.errMsg === 'ok' && r.data) return resolve(r.data);
        reject(new Error(r?.errMsg || '生成失败'));
      })
      .catch(reject);
  });
}

function translateWord(word) {
  const base = app.globalData.apiBase || '';
  if (base) {
    return requestByUrl(base + '/api/translate-word', { word });
  }
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'englishApi',
      data: { action: 'translateWord', word },
    })
      .then((res) => {
        const r = res.result;
        if (r && r.errMsg === 'ok' && r.data) return resolve(r.data);
        reject(new Error(r?.errMsg || '翻译失败'));
      })
      .catch(reject);
  });
}

module.exports = { generateStory, translateWord };
