const app = getApp();
const api = require('../../utils/api.js');

Page({
  data: {
    books: [],
    readingBook: null,
    currentPage: 0,
    selectedWord: null,
    isTranslating: false,
  },

  onShow() {
    const books = app.globalData.books || [];
    const pending = app.globalData.pendingReadingBook;
    if (pending) {
      app.globalData.pendingReadingBook = null;
      this.setData({ books, readingBook: pending, currentPage: 0 });
    } else {
      this.setData({ books });
    }
  },

  onBookTap(e) {
    const book = e.currentTarget.dataset.book;
    this.setData({ readingBook: book, currentPage: 0 });
  },

  onBack() {
    this.setData({ readingBook: null, selectedWord: null });
  },

  onPrev() {
    const { currentPage } = this.data;
    if (currentPage > 0) this.setData({ currentPage: currentPage - 1, selectedWord: null });
  },

  onNext() {
    const { readingBook, currentPage } = this.data;
    if (readingBook && currentPage < readingBook.pages.length - 1) {
      this.setData({ currentPage: currentPage + 1, selectedWord: null });
    }
  },

  onWordTap(e) {
    const word = (e.currentTarget.dataset.word || '').replace(/[.,!?;:"]/g, '').toLowerCase();
    if (!word) return;
    this.setData({ isTranslating: true });
    api.translateWord(word)
      .then((res) => {
        this.setData({
          selectedWord: { word, translation: res.translation, example: res.example },
          isTranslating: false,
        });
      })
      .catch(() => {
        this.setData({ isTranslating: false });
        wx.showToast({ title: '翻译失败', icon: 'none' });
      });
  },

  onCloseWord() {
    this.setData({ selectedWord: null });
  },

  onAddToVocab() {
    const { selectedWord } = this.data;
    if (!selectedWord) return;
    const item = {
      id: Math.random().toString(36).slice(2, 11),
      word: selectedWord.word,
      translation: selectedWord.translation,
      example: selectedWord.example,
      addedAt: Date.now(),
    };
    const vocab = [item, ...(app.globalData.vocab || [])];
    app.globalData.vocab = vocab;
    wx.setStorageSync('english_vocab', vocab);
    this.setData({ selectedWord: null });
    wx.showToast({ title: '已加入生词本' });
  },
});
