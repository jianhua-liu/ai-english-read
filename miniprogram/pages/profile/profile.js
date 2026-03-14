const app = getApp();

Page({
  data: {
    bookCount: 0,
    vocabCount: 0,
  },

  onShow() {
    this.setData({
      bookCount: (app.globalData.books || []).length,
      vocabCount: (app.globalData.vocab || []).length,
    });
  },
});
