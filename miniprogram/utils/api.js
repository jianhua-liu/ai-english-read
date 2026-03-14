const app = getApp();

function requestByUrl(url, data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(res.data);
        else reject(new Error(res.data?.error || '请求失败'));
      },
      fail: reject,
    });
  });
}

function generateStory(grade, modelName) {
  const base = app.globalData.apiBase || '';
  if (base) {
    return requestByUrl(base + '/api/generate-story', {
      grade: grade || 'Grade 6',
      modelName: modelName || 'gemini-1.5-flash',
    });
  }
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'englishApi',
      data: {
        action: 'generateStory',
        grade: grade || 'Grade 6',
        modelName: modelName || 'gemini-1.5-flash',
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
