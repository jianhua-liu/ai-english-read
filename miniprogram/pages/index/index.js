const api = require('../../utils/api.js');
const app = getApp();
const { normalizePages } = require('../../utils/bookHelper.js');

const GRADES = ['Grade 6', 'Junior High', 'Senior High'];
const MODELS = [
  { label: 'Flash', value: 'gemini-2.5-flash' },
  { label: 'Pro', value: 'gemini-2.5-pro' },
  { label: 'Lite', value: 'gemini-2.5-flash-lite' },
];

function formatDate(ts) {
  const d = new Date(ts);
  return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();
}

Page({
  data: {
    selectedGrade: 'Grade 6',
    grades: GRADES,
    models: MODELS,
    selectedModel: MODELS[0].value,
    modelIndex: 0,
    isGenerating: false,
    status: '',
    books: [],
  },

  onShow() {
    const list = (app.globalData.books || []).slice(0, 3).map((b) => ({
      ...b,
      displayDate: formatDate(b.createdAt),
    }));
    this.setData({ books: list });
  },

  onGradeTap(e) {
    this.setData({ selectedGrade: e.currentTarget.dataset.grade });
  },

  onModelChange(e) {
    const i = Number(e.detail.value);
    this.setData({ modelIndex: i, selectedModel: MODELS[i].value });
  },

  onOpenBook(e) {
    const id = e.currentTarget.dataset.id;
    const book = id ? (app.globalData.books || []).find((b) => b.id === id) : e.currentTarget.dataset.book;
    if (!book || !book.pages) return;
    const pages = getCurrentPages();
    const bookshelf = pages.find((p) => p.route === 'pages/bookshelf/bookshelf');
    if (bookshelf && typeof bookshelf.setReadingBook === 'function') {
      bookshelf.setReadingBook(book, 0);
    }
    wx.switchTab({ url: '/pages/bookshelf/bookshelf' });
  },

  onGenerate() {
    if (this.data.isGenerating) return;
    this.setData({ isGenerating: true, status: '正在生成故事...' });
    const { selectedGrade, selectedModel } = this.data;

    api.generateStory(selectedGrade, selectedModel)
      .then((story) => {
        const book = {
          id: Math.random().toString(36).slice(2, 11),
          title: story.title,
          grade: selectedGrade,
          pages: normalizePages(story.pages || []),
          createdAt: Date.now(),
        };
        const books = [book, ...app.globalData.books];
        app.globalData.books = books;
        app.globalData.pendingReadingBook = book;
        wx.setStorageSync('english_books', books);
        wx.switchTab({ url: '/pages/bookshelf/bookshelf' });
      })
      .catch((err) => {
        const msg = err && err.message ? err.message : '生成失败';
        wx.showModal({ title: '生成失败', content: msg, showCancel: false });
      })
      .finally(() => {
        this.setData({ isGenerating: false, status: '' });
      });
  },
});
