const app = getApp();
const api = require('../../utils/api.js');
const { normalizeBook } = require('../../utils/bookHelper.js');

Page({
  data: {
    books: [],
    readingBook: null,
    currentPage: 0,
    currentPageText: '',
    currentPageTranslation: '',
    currentPageGrammar: '',
    selectedWord: null,
    isTranslating: false,
  },

  setReadingBook(book, pageIndex) {
    const normalized = normalizeBook(book);
    const idx = Math.max(0, Math.min(pageIndex || 0, (normalized.pages && normalized.pages.length) ? normalized.pages.length - 1 : 0));
    const page = (normalized.pages && normalized.pages[idx]) || {};
    let showText = (page.text != null && page.text !== '') ? String(page.text).trim() : '';
    if (!showText && page.translation && /[a-zA-Z]{2,}/.test(page.translation)) {
      showText = String(page.translation).trim();
    }
    if (!showText && (page.content != null && page.content !== '')) showText = String(page.content).trim();
    if (!showText && (page.english != null && page.english !== '')) showText = String(page.english).trim();
    this.setData({
      readingBook: normalized,
      currentPage: idx,
      currentPageText: showText,
      currentPageTranslation: page.translation || '',
      currentPageGrammar: page.grammarPoint || '',
      selectedWord: null,
    });
  },

  onShow() {
    const books = app.globalData.books || [];
    const pending = app.globalData.pendingReadingBook;
    if (pending) {
      app.globalData.pendingReadingBook = null;
      this.setReadingBook(pending, 0);
      this.setData({ books });
    } else {
      this.setData({ books });
    }
  },

  onBookTap(e) {
    const id = e.currentTarget.dataset.id;
    const books = this.data.books.length ? this.data.books : (app.globalData.books || []);
    const book = typeof id === 'string' ? books.find((b) => b.id === id) : null;
    if (!book || !book.pages || !book.pages.length) return;
    this.setReadingBook(book, 0);
  },

  onBack() {
    this.setData({ readingBook: null, currentPageText: '', currentPageTranslation: '', currentPageGrammar: '', selectedWord: null });
  },

  _pageShowText(page) {
    const t = (page && page.text != null && page.text !== '') ? String(page.text).trim() : '';
    if (t) return t;
    if (page && page.translation && /[a-zA-Z]{2,}/.test(page.translation)) return String(page.translation).trim();
    if (page && page.content != null && page.content !== '') return String(page.content).trim();
    if (page && page.english != null && page.english !== '') return String(page.english).trim();
    return '';
  },

  onPrev() {
    const { readingBook, currentPage } = this.data;
    if (!readingBook || !readingBook.pages || currentPage <= 0) return;
    const idx = currentPage - 1;
    const page = readingBook.pages[idx] || {};
    this.setData({
      currentPage: idx,
      currentPageText: this._pageShowText(page),
      currentPageTranslation: page.translation || '',
      currentPageGrammar: page.grammarPoint || '',
      selectedWord: null,
    });
  },

  onNext() {
    const { readingBook, currentPage } = this.data;
    if (!readingBook || !readingBook.pages || currentPage >= readingBook.pages.length - 1) return;
    const idx = currentPage + 1;
    const page = readingBook.pages[idx] || {};
    this.setData({
      currentPage: idx,
      currentPageText: this._pageShowText(page),
      currentPageTranslation: page.translation || '',
      currentPageGrammar: page.grammarPoint || '',
      selectedWord: null,
    });
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
