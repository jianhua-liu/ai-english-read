const app = getApp();

function requestByUrl(url, data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data,
      timeout: 90000,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) return resolve(res.data);
        const msg = (res.data && (res.data.error || res.data.detail)) || ('HTTP ' + res.statusCode);
        reject(new Error(msg));
      },
      fail: (err) => {
        let msg = err.errMsg || '网络错误';
        if (msg.indexOf('url not in domain list') !== -1) msg = '域名未配置：请在微信公众平台把接口域名加入 request 合法域名';
        if (msg.indexOf('timeout') !== -1 || msg.indexOf('TIMED_OUT') !== -1 || msg.indexOf('-118') !== -1) {
          msg = '连接超时（当前网络可能无法访问境外服务器）。请换 WiFi 或稍后重试，我们将自动尝试用云函数生成';
        }
        reject(new Error(msg));
      },
    });
  });
}

function isConnectionTimeout(err) {
  const msg = (err && err.message) || (err && err.errMsg) || '';
  return /timeout|TIMED_OUT|-118|CONNECTION/.test(msg);
}

function generateStoryByCloud(grade, modelName) {
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

function generateStory(grade, modelName) {
  const base = app.globalData.apiBase || '';
  if (base) {
    return requestByUrl(base + '/api/generate-story', {
      grade: grade || 'Grade 6',
      modelName: modelName || 'gemini-2.5-flash',
    }).catch((err) => {
      if (isConnectionTimeout(err)) {
        return generateStoryByCloud(grade, modelName);
      }
      throw err;
    });
  }
  return generateStoryByCloud(grade, modelName);
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
