function hasCJK(s) {
  return typeof s === 'string' && /[\u4e00-\u9fff]/.test(s);
}
function isEmpty(s) {
  return s == null || (typeof s === 'string' && !s.trim());
}

function normalizePages(pages) {
  if (!pages || !Array.isArray(pages)) return pages || [];
  return pages.map((p) => {
    let text = (p && p.text) != null ? String(p.text).trim() : '';
    let translation = (p && p.translation) != null ? String(p.translation).trim() : '';
    if (isEmpty(text) && translation && !hasCJK(translation)) {
      text = translation;
      translation = (p && p.text) != null ? String(p.text).trim() : '';
    } else if (hasCJK(text) && translation && !hasCJK(translation)) {
      const t = text;
      text = translation;
      translation = t;
    }
    return { ...p, text: text || (p && p.text), translation: translation || (p && p.translation) };
  });
}

function normalizeBook(book) {
  if (!book || !book.pages || !Array.isArray(book.pages)) return book;
  return { ...book, pages: normalizePages(book.pages) };
}

module.exports = { normalizeBook, normalizePages };
