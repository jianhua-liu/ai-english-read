const config = require('./config.js');

App({
  globalData: {
    apiBase: (config.baseUrl || '').replace(/\/$/, ''),
    books: [],
    vocab: [],
    pendingReadingBook: null,
  },
  onLaunch() {
    wx.cloud.init({ env: 'cloud1-7guq63z40050b062', traceUser: true });
    const books = wx.getStorageSync('english_books');
    const vocab = wx.getStorageSync('english_vocab');
    if (books && books.length) this.globalData.books = books;
    if (vocab && vocab.length) this.globalData.vocab = vocab;
  },
});
