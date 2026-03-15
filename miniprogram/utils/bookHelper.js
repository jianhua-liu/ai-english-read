function hasCJK(s) {
  return typeof s === 'string' && /[\u4e00-\u9fff]/.test(s);
}
function isEmpty(s) {
  return s == null || (typeof s === 'string' && !s.trim());
}

function extractEnglishFromMixed(str) {
  if (typeof str !== 'string' || !str.trim()) return '';
  const s = str.trim();
  const i = s.search(/[\u4e00-\u9fff]/);
  if (i < 0) return s;
  const before = s.slice(0, i).trim();
  return before.length >= 2 ? before : '';
}

function normalizePages(pages) {
  if (!pages || !Array.isArray(pages)) return pages || [];
  return pages.map((p) => {
    let text = (p && (p.text ?? p.content ?? p.english)) != null ? String(p.text ?? p.content ?? p.english).trim() : '';
    let translation = (p && p.translation) != null ? String(p.translation).trim() : '';
    if (isEmpty(text) && translation) {
      if (!hasCJK(translation)) {
        text = translation;
        translation = (p && p.text) != null ? String(p.text).trim() : '';
      } else {
        const en = extractEnglishFromMixed(translation);
        if (en) text = en;
      }
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
