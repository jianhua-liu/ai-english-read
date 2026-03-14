const api = require('../../utils/api.js');
const app = getApp();

const GRADES = ['Grade 6', 'Junior High', 'Senior High'];

function formatDate(ts) {
  const d = new Date(ts);
  return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();
}

Page({
  data: {
    selectedGrade: 'Grade 6',
    grades: GRADES,
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

  onOpenBook(e) {
    const book = e.currentTarget.dataset.book;
    if (!book) return;
    const pages = getCurrentPages();
    const bookshelf = pages.find((p) => p.route === 'pages/bookshelf/bookshelf');
    if (bookshelf) {
      bookshelf.setData({ readingBook: book, currentPage: 0 });
    }
    wx.switchTab({ url: '/pages/bookshelf/bookshelf' });
  },

  onGenerate() {
    if (this.data.isGenerating) return;
    this.setData({ isGenerating: true, status: '正在生成故事...' });
    const { selectedGrade } = this.data;

    api.generateStory(selectedGrade)
      .then((story) => {
        const book = {
          id: Math.random().toString(36).slice(2, 11),
          title: story.title,
          grade: selectedGrade,
          pages: story.pages,
          createdAt: Date.now(),
        };
        const books = [book, ...app.globalData.books];
        app.globalData.books = books;
        app.globalData.pendingReadingBook = book;
        wx.setStorageSync('english_books', books);
        wx.switchTab({ url: '/pages/bookshelf/bookshelf' });
      })
      .catch((err) => {
        wx.showToast({ title: err.message || '生成失败', icon: 'none' });
      })
      .finally(() => {
        this.setData({ isGenerating: false, status: '' });
      });
  },
});
