import React, { useState, useEffect } from 'react';
import { Book, Grade, VocabularyItem, Page } from './types';
import { generateStory, translateWord } from './services/geminiService';
import { BookOpen, Library, BookMarked, User, Plus, ChevronRight, ChevronLeft, Trash2, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

type Tab = 'home' | 'bookshelf' | 'vocab' | 'profile';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [books, setBooks] = useState<Book[]>([]);
  const [vocab, setVocab] = useState<VocabularyItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-pro-preview');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<Grade>('Grade 6');
  const [readingBook, setReadingBook] = useState<Book | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedWord, setSelectedWord] = useState<{ word: string; translation: string; example: string } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Load data from localStorage
  useEffect(() => {
    const savedBooks = localStorage.getItem('english_books');
    const savedVocab = localStorage.getItem('english_vocab');
    if (savedBooks) setBooks(JSON.parse(savedBooks));
    if (savedVocab) setVocab(JSON.parse(savedVocab));
    setIsLoaded(true);
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('english_books', JSON.stringify(books));
    }
  }, [books, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('english_vocab', JSON.stringify(vocab));
    }
  }, [vocab, isLoaded]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus('Creating your story...');
    try {
      const storyData = await generateStory(selectedGrade, selectedModel);
      
      const newBook: Book = {
        id: Math.random().toString(36).substr(2, 9),
        title: storyData.title,
        grade: selectedGrade,
        pages: storyData.pages,
        createdAt: Date.now()
      };

      setBooks([newBook, ...books]);
      setReadingBook(newBook);
      setCurrentPage(0);
      setActiveTab('bookshelf');
    } catch (error) {
      console.error('Generation failed:', error);
      alert('Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
      setGenerationStatus('');
      setGenerationProgress(0);
    }
  };

  const handleWordClick = async (word: string) => {
    const cleanWord = word.replace(/[.,!?;:"]/g, '').toLowerCase();
    setIsTranslating(true);
    try {
      const result = await translateWord(cleanWord);
      setSelectedWord({ word: cleanWord, ...result });
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const addToVocab = () => {
    if (!selectedWord) return;
    const newItem: VocabularyItem = {
      id: Math.random().toString(36).substr(2, 9),
      word: selectedWord.word,
      translation: selectedWord.translation,
      example: selectedWord.example,
      addedAt: Date.now()
    };
    setVocab([newItem, ...vocab]);
    setSelectedWord(null);
  };

  const removeFromVocab = (id: string) => {
    setVocab(vocab.filter(v => v.id !== id));
  };

  const grades: Grade[] = ['Grade 6', 'Junior High', 'Senior High'];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-4 py-3 sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tight text-emerald-700">AI English Story</h1>
        <div className="flex items-center gap-2">
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="text-[10px] font-bold bg-stone-100 border-none rounded-lg px-2 py-1 text-stone-600 outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="gemini-3.1-pro-preview">Pro 3.1</option>
            <option value="gemini-3-flash-preview">Flash 3.0</option>
            <option value="gemini-3.1-flash-lite-preview">Lite 3.1</option>
          </select>
          {activeTab === 'home' && (
            <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-[10px] font-bold">
              BETA
            </div>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto p-4">
        {activeTab === 'home' && (
          <div className="space-y-6">
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                Create New Story
              </h2>
              <p className="text-stone-500 text-sm mb-6">Select your grade to generate a story tailored to your level.</p>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                {grades.map(grade => (
                  <button
                    key={grade}
                    onClick={() => setSelectedGrade(grade)}
                    className={cn(
                      "py-3 px-4 rounded-xl text-sm font-medium transition-all border",
                      selectedGrade === grade 
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md" 
                        : "bg-white text-stone-600 border-stone-200 hover:border-emerald-300"
                    )}
                  >
                    {grade}
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-200 flex flex-col items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-transform overflow-hidden relative"
              >
                {isGenerating ? (
                  <div className="py-2 w-full px-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{generationStatus}</span>
                    </div>
                    <div className="w-full bg-emerald-800/30 h-1.5 rounded-full overflow-hidden">
                      <motion.div 
                        className="bg-white h-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${generationProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <BookOpen className="w-5 h-5" />
                    <span>Generate English Story</span>
                  </div>
                )}
              </button>
            </section>

            <section>
              <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-4">Recent Stories</h3>
              <div className="space-y-4">
                {books.slice(0, 3).map(book => (
                  <div 
                    key={book.id}
                    onClick={() => { setReadingBook(book); setActiveTab('bookshelf'); }}
                    className="bg-white p-4 rounded-xl border border-stone-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="w-16 h-16 bg-emerald-50 rounded-lg flex items-center justify-center overflow-hidden">
                      <BookOpen className="text-emerald-300" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-stone-800 line-clamp-1">{book.title}</h4>
                      <p className="text-xs text-stone-400">{book.grade} • {new Date(book.createdAt).toLocaleDateString()}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-stone-300" />
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'bookshelf' && (
          <div className="space-y-4">
            {readingBook ? (
              <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-stone-100 flex flex-col min-h-[500px]">
                <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                  <button 
                    onClick={() => setReadingBook(null)}
                    className="text-stone-500 hover:text-stone-800 transition-colors p-2"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  
                  <div className="flex items-center gap-4">
                    <button
                      disabled={currentPage === 0}
                      onClick={() => setCurrentPage(p => p - 1)}
                      className="p-2 rounded-full bg-white border border-stone-200 text-stone-600 disabled:opacity-30 active:scale-90 transition-transform shadow-sm"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="text-xs font-bold text-stone-500 min-w-[60px] text-center">
                      {currentPage + 1} / {readingBook.pages.length}
                    </div>

                    <button
                      disabled={currentPage === readingBook.pages.length - 1}
                      onClick={() => setCurrentPage(p => p + 1)}
                      className="p-2 rounded-full bg-emerald-600 text-white disabled:opacity-30 active:scale-90 transition-transform shadow-sm"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="w-10" /> {/* Spacer */}
                </div>
                
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex-1 space-y-8">
                    <h2 className="text-center text-emerald-600 text-sm font-bold uppercase tracking-widest">{readingBook.title}</h2>
                    
                    <div className="text-xl leading-relaxed text-stone-800 text-center font-medium">
                      {readingBook.pages[currentPage].text.split(' ').map((word, i) => (
                        <span 
                          key={i} 
                          onClick={() => handleWordClick(word)}
                          className="inline-block mr-1 cursor-pointer hover:text-emerald-600 hover:underline decoration-emerald-300 underline-offset-4 transition-colors"
                        >
                          {word}
                        </span>
                      ))}
                    </div>

                    <div className="text-sm text-stone-400 text-center italic mt-2">
                      {readingBook.pages[currentPage].translation}
                    </div>

                    <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 mt-8">
                      <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <BookMarked className="w-4 h-4" />
                        Grammar Focus / 语法重点
                      </h3>
                      <p className="text-stone-700 text-sm leading-relaxed">
                        {readingBook.pages[currentPage].grammarPoint}
                      </p>
                    </div>
                  </div>

                  <div className="mt-12 flex justify-center">
                    <div className="flex gap-2">
                      {readingBook.pages.map((_, i) => (
                        <div key={i} className={cn("w-2 h-2 rounded-full transition-all", i === currentPage ? "bg-emerald-600 w-6" : "bg-stone-200")} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {books.map(book => (
                  <div 
                    key={book.id}
                    onClick={() => { setReadingBook(book); setCurrentPage(0); }}
                    className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm active:scale-95 transition-transform flex flex-col items-center text-center gap-3"
                  >
                    <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm line-clamp-2 text-stone-800">{book.title}</h4>
                      <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1 font-bold">{book.grade}</p>
                    </div>
                  </div>
                ))}
                {books.length === 0 && (
                  <div className="col-span-2 py-20 text-center text-stone-400">
                    <Library className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No books yet. Go to Home to generate one!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'vocab' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Vocabulary Notebook</h2>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md">{vocab.length} words</span>
            </div>
            
            <div className="space-y-3">
              {vocab.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold text-emerald-700">{item.word}</h4>
                    <p className="text-stone-600 text-sm font-medium">{item.translation}</p>
                    <p className="text-stone-400 text-xs italic mt-2">"{item.example}"</p>
                  </div>
                  <button 
                    onClick={() => removeFromVocab(item.id)}
                    className="text-stone-300 hover:text-red-500 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {vocab.length === 0 && (
                <div className="py-20 text-center text-stone-400">
                  <BookMarked className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Your vocabulary notebook is empty.</p>
                  <p className="text-xs mt-2">Click on words while reading to add them here.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 text-center border border-stone-100 shadow-sm">
              <div className="w-24 h-24 bg-emerald-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <User className="w-12 h-12 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold">English Learner</h2>
              <p className="text-stone-400 text-sm">Keep up the good work!</p>
            </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-stone-100 text-center">
                    <div className="text-2xl font-bold text-emerald-600">{books.length}</div>
                    <div className="text-xs text-stone-400 uppercase font-bold">Stories Read</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-stone-100 text-center">
                    <div className="text-2xl font-bold text-emerald-600">{vocab.length}</div>
                    <div className="text-xs text-stone-400 uppercase font-bold">Words Learned</div>
                  </div>
                </div>
          </div>
        )}
      </main>

      {/* Word Popup */}
      <AnimatePresence>
        {selectedWord && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedWord(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-emerald-700 mb-1">{selectedWord.word}</h3>
                  <p className="text-lg text-stone-600 font-medium">{selectedWord.translation}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addToVocab}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-emerald-100 flex items-center gap-2 active:scale-95 transition-transform text-sm"
                  >
                    <BookMarked className="w-4 h-4" />
                    Add
                  </button>
                  <button 
                    onClick={() => setSelectedWord(null)}
                    className="text-stone-400 hover:text-stone-600 p-2"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Example</p>
                  <p className="text-stone-700 italic">"{selectedWord.example}"</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Translating Loader */}
      <AnimatePresence>
        {isTranslating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white flex items-center gap-3"
            >
              <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
              <span className="text-sm font-medium">Translating...</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-stone-200 px-6 py-3 flex justify-between items-center z-10 max-w-md mx-auto">
        <button 
          onClick={() => { setActiveTab('home'); setReadingBook(null); }}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'home' ? "text-emerald-600" : "text-stone-400")}
        >
          <Plus className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Create</span>
        </button>
        <button 
          onClick={() => setActiveTab('bookshelf')}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'bookshelf' ? "text-emerald-600" : "text-stone-400")}
        >
          <Library className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Library</span>
        </button>
        <button 
          onClick={() => setActiveTab('vocab')}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'vocab' ? "text-emerald-600" : "text-stone-400")}
        >
          <BookMarked className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Vocab</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'profile' ? "text-emerald-600" : "text-stone-400")}
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Profile</span>
        </button>
      </nav>
    </div>
  );
}
