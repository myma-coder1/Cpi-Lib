import React, { useState, useEffect } from 'react';
import { BookOpen, Search, ArrowLeft, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Book } from '../types.js';
import { BookCard } from './BookCard';

interface EBookViewProps {
  books: Book[];
  setCurrentView: (view: string) => void;
  selectedBookId: string;
  setSelectedBookId: (id: string) => void;
}

export default function EBookView({
  books,
  setCurrentView,
  selectedBookId,
  setSelectedBookId
}: EBookViewProps) {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  
  // Search state inside eBook index
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Reader core states
  const [readerMode, setReaderMode] = useState<'pdf' | 'text'>('text');
  const [activePageIdx, setActivePageIdx] = useState(0);
  const [textSearch, setTextSearch] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    if (selectedBookId) {
      const b = books.find(item => item.id === selectedBookId);
      if (b && b.format === 'E-Book') {
        setSelectedBook(b);
        // Prioritize PDF over text if PDF link exists
        if (b.pdfUrl) {
          setReaderMode('pdf');
        } else {
          setReaderMode('text');
        }
        setActivePageIdx(0);
        setTextSearch('');
        setSearchResults([]);
      }
    }
  }, [selectedBookId, books]);

  // Filters for electronic books in the database
  const ebooksList = books.filter(b => 
    b.format === 'E-Book' && 
    (activeCategory === 'All' || b.category === activeCategory) &&
    (b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     b.author.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const categories = ['All', 'Computer Science', 'Programming', 'Physics', 'Mathematics', 'Chemistry', 'Novels', 'Research Books'];

  // Word/Paragraph splitter for typed E-Book texts
  const getPagesForSelectedBook = () => {
    if (!selectedBook) return [];
    if (selectedBook.ebookContentText && selectedBook.ebookContentText.trim()) {
      const paragraphs = selectedBook.ebookContentText.split(/\n\s*\n/).filter(p => p.trim());
      if (paragraphs.length === 0) return ["No text content written for this E-Book yet."];
      
      const pages: string[] = [];
      let currentPage = "";
      paragraphs.forEach((p) => {
        // Group paragraphs to form reasonable pages (~200 words per page transition)
        if (currentPage && (currentPage.split(/\s+/).length + p.split(/\s+/).length > 200)) {
          pages.push(currentPage);
          currentPage = p;
        } else {
          currentPage = currentPage ? currentPage + "\n\n" + p : p;
        }
      });
      if (currentPage) {
        pages.push(currentPage);
      }
      return pages;
    }
    
    // Default fallback to show description if no written text nor PDF link exists
    if (!selectedBook.pdfUrl) {
      return [
        `Book Overview:\n\n${selectedBook.description || "No description provided."}`,
        "Please note: The librarian has registered this volume as digital, but has not uploaded the full content text or PDF document yet. If you are an administrator, edit this book from the Admin Console to insert content assets."
      ];
    }

    // Default mock contents if it was one of the default mock E-Books
    return [
      "Welcome to Online Academic Reading rooms. This textbook volume covers foundations of core disciplines. Use the PDF frame above if you wish to read the formal documentation.",
      "ScholarLib Academic Resource. Verified, type-safe distribution pipelines allow students across semesters to explore concepts concurrently without manual book queueing delays.",
      "End of overview. For research scopes, consult with course instructors or library coordinators."
    ];
  };

  const dynamicPages = getPagesForSelectedBook();

  // Handle textual phrase search inside E-Book written text
  const handleContentSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textSearch.trim()) {
      setSearchResults([]);
      return;
    }
    const query = textSearch.toLowerCase();
    const hits: string[] = [];
    
    dynamicPages.forEach((pgText, idx) => {
      if (pgText.toLowerCase().includes(query)) {
        hits.push(`Found in Page ${idx + 1}`);
      }
    });

    if (hits.length === 0) {
      // search in title/description too as feedback
      if (selectedBook?.title.toLowerCase().includes(query) || selectedBook?.description.toLowerCase().includes(query)) {
        hits.push("Found in book metadata info.");
      }
    }
    
    setSearchResults(hits);
  };

  const handleBookSelect = (book: Book) => {
    setSelectedBookId(book.id);
    setSelectedBook(book);
    if (book.pdfUrl) {
      setReaderMode('pdf');
    } else {
      setReaderMode('text');
    }
    setActivePageIdx(0);
    setTextSearch('');
    setSearchResults([]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans animate-fade-in text-left select-none" id="ebook-view">
      
      {/* CASE 1: READING ROOM ACTIVE (Book details selected) */}
      {selectedBook ? (
        <div className="animate-fade-in space-y-6" id="ebook-reader-screen">
          
          {/* Header controls strip */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4 select-none">
            <button 
              onClick={() => {
                setSelectedBook(null);
                setSelectedBookId('');
              }}
              className="text-[10px] font-bold uppercase tracking-wider text-slate-700 hover:text-slate-950 hover:-translate-y-0.5 transition-all flex items-center cursor-pointer bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-xs"
              id="back-to-library-btn"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Close Reader
            </button>
            <div className="text-right sm:max-w-xl">
              <h2 className="text-base font-bold text-slate-900 truncate">{selectedBook.title}</h2>
              <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">Online Digital Library • Profesor {selectedBook.author}</p>
            </div>
          </div>

          {/* READER TYPE TOGGLES: PDF vs Text (Visible if both exist) */}
          {(selectedBook.pdfUrl && selectedBook.ebookContentText) && (
            <div className="flex justify-start gap-1.5 bg-slate-100 p-1 rounded-xl max-w-xs select-none">
              <button
                onClick={() => setReaderMode('pdf')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${readerMode === 'pdf' ? 'bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}
              >
                📄 View PDF File
              </button>
              <button
                onClick={() => {
                  setReaderMode('text');
                  setActivePageIdx(0);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${readerMode === 'text' ? 'bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}
              >
                📖 Read Text Content
              </button>
            </div>
          )}

          {/* Core Reader Workspace layout: Sidebar chapters + Main Reading text */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left sidebar: Chapters, Search, Zoom */}
            <div className="lg:col-span-4 bg-white border border-slate-200 p-5 rounded-[20px] shadow-xs space-y-6 select-none">
              
              <div>
                <h4 className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Book Catalog Metadata</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-100 pb-2 font-medium">
                    <span className="text-slate-400">Author Name</span>
                    <span className="font-bold text-slate-800">{selectedBook.author}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2 font-medium">
                    <span className="text-slate-400">Category Discipline</span>
                    <span className="font-bold text-slate-800">{selectedBook.category}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2 font-medium">
                    <span className="text-slate-400">ISBN Code</span>
                    <span className="font-mono text-slate-600 font-bold">{selectedBook.isbn}</span>
                  </div>
                  <div className="flex justify-between pb-1 font-medium border-b border-slate-100 pb-2">
                    <span className="text-slate-400">Digital Provider</span>
                    <span className="font-bold text-slate-850">ScholarLib Cloud</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Pages / Chapters indicator inside Sidebar (for Text output mode) */}
              {readerMode === 'text' && (
                <div>
                  <h4 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">Jump to Page</h4>
                  <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto">
                    {dynamicPages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActivePageIdx(idx)}
                        className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${activePageIdx === idx ? 'bg-[#1E40AF] text-white border-[#1E40AF]' : 'bg-slate-55 hover:bg-slate-100 text-slate-700 border-slate-200/80'}`}
                      >
                        P. {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Phrase search inside book */}
              {readerMode === 'text' && (
                <div className="border-t border-slate-100 pt-5">
                  <h4 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Search written text</h4>
                  <form onSubmit={handleContentSearch} className="relative mb-3">
                    <input 
                      type="text" 
                      placeholder="Type keyword / page phrase..." 
                      value={textSearch}
                      onChange={e => setTextSearch(e.target.value)}
                      className="w-full pl-3 pr-9 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 text-slate-800 placeholder-slate-400"
                      id="reader-search-input"
                    />
                    <button type="submit" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black focus:outline-none cursor-pointer">
                      <Search className="w-3.5 h-3.5" />
                    </button>
                  </form>

                  {searchResults.length > 0 ? (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto bg-slate-50/50 p-3 rounded-lg border border-slate-200 font-mono text-[10px]">
                      <p className="text-[9px] font-extrabold text-emerald-805 uppercase flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Hits found:
                      </p>
                      {searchResults.map((res, i) => (
                        <p key={i} className="text-slate-600 font-bold py-1 border-b border-white last:border-none">
                          • {res}
                        </p>
                      ))}
                    </div>
                  ) : textSearch.trim() ? (
                    <p className="text-[10px] text-slate-450 italic font-medium">No matching results found inside written pages.</p>
                  ) : null}
                </div>
              )}

              {/* Magnify lens controls */}
              {readerMode === 'text' && (
                <div className="border-t border-slate-100 pt-5 flex justify-between items-center text-xs text-slate-500">
                  <span className="font-semibold text-slate-550">Zoom Scale:</span>
                  <div className="flex items-center space-x-2.5">
                    <button onClick={() => setZoomLevel(prev => Math.max(75, prev - 25))} className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer border border-slate-200 bg-white shadow-xs">
                      <ZoomOut className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                    <span className="font-mono font-bold text-slate-800">{zoomLevel}%</span>
                    <button onClick={() => setZoomLevel(prev => Math.min(175, prev + 25))} className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer border border-slate-200 bg-white shadow-xs">
                      <ZoomIn className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                  </div>
                </div>
              )}

              {/* PDF Download trigger if in PDF mode */}
              {readerMode === 'pdf' && selectedBook.pdfUrl && (
                <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-[14px] text-xs leading-relaxed space-y-3">
                  <p className="font-bold text-[9.5px] tracking-wider flex items-center gap-1.5 text-[#1E40AF] uppercase">
                    <FileText className="w-4 h-4" /> PDF Link Active
                  </p>
                  <p className="text-[11px] text-slate-555 font-medium leading-relaxed">This book has been uploaded as an online PDF document. Read directly on the container frame or open full document in browser.</p>
                  <a
                    href={selectedBook.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] hover:brightness-[105%] text-white font-bold h-11 flex items-center justify-center rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all"
                  >
                    Open PDF in New Tab
                  </a>
                </div>
              )}

            </div>

            {/* Right panel: Active Book Web PDF Frame or Text Frame */}
            <div className="lg:col-span-8 flex flex-col justify-between">
              
              {/* PDF MODE */}
              {readerMode === 'pdf' && selectedBook.pdfUrl ? (
                <div className="w-full flex flex-col bg-white border border-slate-200 overflow-hidden rounded-[20px] shadow-xs">
                  <div className="bg-slate-900 px-4 py-2.5 flex justify-between items-center text-slate-300 text-xs select-none">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="font-bold text-[9.5px] uppercase tracking-wider text-slate-200">Browser PDF Frame Viewer</span>
                    </div>
                    <a 
                      href={selectedBook.pdfUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-[9px] uppercase tracking-wider px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      Full screen window ↗️
                    </a>
                  </div>
                  
                  {/* The iframe viewport */}
                  <div className="w-full bg-slate-50 border-t border-slate-200" style={{ height: '700px' }}>
                    <iframe 
                      src={selectedBook.pdfUrl} 
                      className="w-full h-full"
                      title={`PDF Reader: ${selectedBook.title}`}
                    />
                  </div>
                  
                  <div className="p-4.5 bg-amber-50/40 border-t border-slate-200 text-[10.5px] text-slate-655 flex items-start gap-2.5 text-left">
                    <AlertCircle className="w-4.5 h-4.5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-900">বইয়ের ই-বুক PDF রিডার রেন্ডার হচ্ছে:</p>
                      <p className="mt-0.5 leading-relaxed font-medium">যদি লোড না হয় বা ফ্রেমে কিছু না দেখায়, তবে ব্রাউজার সিকিউরিটির জন্য উপরে দেওয়া <strong>Full screen window ↗️</strong> বাটনে ক্লিক করে সরাসরি নতুন ট্যাবে PDF ফাইলটি পড়তে পারেন।</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* TEXT MODE */
                <div>
                  <div 
                    className="bg-white border border-slate-200 p-6 sm:p-10 rounded-[20px] shadow-xs min-h-[420px] relative transition-all"
                    style={{ fontSize: `${(zoomLevel / 100) * 13}px` }}
                    id="ebook-page-frame"
                  >
                    {/* Visual binder line to convey real-book aesthetics */}
                    <div className="absolute top-0 bottom-0 left-4 w-1 bg-gradient-to-r from-slate-100 to-transparent"></div>
                    
                    {/* Header metadata inside page */}
                    <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-8 border-b border-slate-100 pb-2 select-none">
                      <span>Online Text Mode</span>
                      <span>Page {activePageIdx + 1} of {dynamicPages.length}</span>
                    </div>

                    <div className="font-serif text-slate-800 leading-relaxed font-normal whitespace-pre-wrap selection:bg-blue-100 text-left" id="ebook-chapter-content">
                      <p className="indent-8 text-sm sm:text-base leading-relaxed text-slate-800 font-medium">
                        {dynamicPages[activePageIdx]}
                      </p>
                      
                      <p className="text-[9px] font-mono text-slate-400 mt-12 italic border-t border-slate-100 pt-4 select-none uppercase tracking-wider">
                        * [ScholarLib System Reader] Verified campus textbook license - Read in Browser *
                      </p>
                    </div>
                  </div>

                  {/* Footer step controls list */}
                  <div className="flex justify-between items-center mt-6 select-none" id="ebook-page-controls">
                    <button 
                      onClick={() => {
                        if (activePageIdx > 0) {
                          setActivePageIdx(prev => prev - 1);
                        }
                      }}
                      disabled={activePageIdx === 0}
                      className="px-4 py-2 border border-slate-200 bg-white text-[10px] uppercase tracking-wider font-bold hover:bg-slate-50 disabled:opacity-50 cursor-pointer flex items-center transition-colors rounded-xl shadow-xs"
                    >
                      <ChevronLeft className="w-4 h-4 mr-0.5" /> Previous Page
                    </button>
                    
                    <span className="text-xs text-slate-500 font-bold font-mono">
                      Page {activePageIdx + 1} / {dynamicPages.length}
                    </span>

                    <button 
                      onClick={() => {
                        if (activePageIdx < dynamicPages.length - 1) {
                          setActivePageIdx(prev => prev + 1);
                        }
                      }}
                      disabled={activePageIdx === dynamicPages.length - 1}
                      className="px-4 py-2 border border-slate-200 bg-white text-[10px] uppercase tracking-wider font-bold hover:bg-slate-50 disabled:opacity-50 cursor-pointer flex items-center transition-colors rounded-xl shadow-xs"
                    >
                      Next Page <ChevronRight className="w-4 h-4 ml-0.5" />
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      ) : (
        // CASE 2: MAIN E-BOOKS DIRECTORY LIST (Searching and Category picker)
        <div className="space-y-8 animate-fade-in animate-duration-300" id="ebooks-directory">
          
          {/* Header titles */}
          <div className="border-b border-slate-200 pb-4 select-none text-left">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-[#1E40AF]" /> E-Book Learning & Reading Room
            </h1>
            <p className="text-xs text-slate-500 mt-1">Read digital volumes, uploaded PDF books, and written textbook chapters directly inside the browser window.</p>
          </div>

          {/* Search bar & Category filters strip */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center bg-slate-100/50 p-4 rounded-[20px] border border-slate-200 shadow-xs">
            <div className="relative w-full lg:col-span-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search digital textbooks..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-semibold shadow-xs"
                id="ebooks-index-search"
              />
            </div>

            {/* Micro Tab switches for Categories */}
            <div className="lg:col-span-8 flex flex-wrap gap-1.5 select-none text-[9px] font-bold uppercase tracking-wider justify-end">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                    activeCategory === cat 
                      ? 'bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] text-white border-[#1E40AF] shadow-sm' 
                      : 'bg-white hover:bg-slate-50 text-slate-650 border-slate-200 shadow-xs'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid list of Digital books with premium card radius and visual style */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6" id="ebook-index-grid">
            {ebooksList.map(book => (
              <BookCard
                key={book.id}
                book={book}
                onViewDetails={() => handleBookSelect(book)}
                badgeText="Digital E-Book"
              />
            ))}

            {ebooksList.length === 0 && (
              <div className="col-span-6 bg-white border border-dashed border-slate-200 rounded-[20px] p-16 text-center text-slate-400 select-none shadow-xs animate-fade-in">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No dynamic E-Books found matching filter settings.</p>
                <p className="text-xs text-slate-500 mt-1.5">Go to the Admin Console, add a new publication, and set its format to <strong>E-Book</strong> to see it represented instantly in this room!</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
