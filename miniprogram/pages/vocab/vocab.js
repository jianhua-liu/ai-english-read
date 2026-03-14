const app = getApp();

Page({
  data: {
    vocab: [],
  },

  onShow() {
    this.setData({ vocab: app.globalData.vocab || [] });
  },

  onRemove(e) {
    const id = e.currentTarget.dataset.id;
    const vocab = (app.globalData.vocab || []).filter((v) => v.id !== id);
    app.globalData.vocab = vocab;
    wx.setStorageSync('english_vocab', vocab);
    this.setData({ vocab });
  },
});
