import React, { useState, useEffect } from 'react';
import { 
  Search, Compass, BookOpen, Scale, Palette, Cpu, Heart, 
  ChevronRight, ChevronLeft, Star, Languages, Phone, MapPin, Users, 
  Clock, Image as ImageIcon, Atom, Scroll, Gavel, Stethoscope,
  Mail, MessageSquare, ExternalLink, Sparkles, AlertCircle, X, Maximize2, Play, Pause,
  Pin, Megaphone, Download, FileText, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, Librarian, GalleryItem, LibraryStatus } from '../types.js';

interface HomeViewProps {
  books: Book[];
  librarians?: Librarian[];
  galleryItems?: GalleryItem[];
  setCurrentView: (view: string) => void;
  setSelectedBookId: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string) => void;
  branding?: any;
}

export default function HomeView({ 
  books, 
  librarians = [], 
  galleryItems = [], 
  setCurrentView, 
  setSelectedBookId, 
  setSearchQuery, 
  setCategoryFilter,
  branding
}: HomeViewProps) {
  const [localSearch, setLocalSearch] = useState('');
  const [statusData, setStatusData] = useState<LibraryStatus | null>(null);
  const [recentBorrows, setRecentBorrows] = useState<Book[]>([]);

  // Home View Book Collection Limits for progressive loading
  const [limitNewArrivals, setLimitNewArrivals] = useState(5);
  const [limitTrending, setLimitTrending] = useState(5);
  const [limitRecentlyAdded, setLimitRecentlyAdded] = useState(5);
  const [limitRecommended, setLimitRecommended] = useState(5);

  // Premium Notices & Hero Slides States
  const [notices, setNotices] = useState<any[]>([]);
  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [heroActiveIndex, setHeroActiveIndex] = useState(0);
  const [selectedNotice, setSelectedNotice] = useState<any | null>(null);
  const [showAllNoticesModal, setShowAllNoticesModal] = useState(false);

  const defaultHeroSlides = [
    {
      id: 'default-1',
      imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1600&auto=format&fit=crop&q=80',
      title: 'Unlock Infinite Technical Knowledge',
      subtitle: 'CPI Digital Library gateway offers peerless engineering literature indices, modern reading wings, and full E-Book reading hubs.'
    },
    {
      id: 'default-2',
      imageUrl: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1600&auto=format&fit=crop&q=80',
      title: 'Your Certified Digital Library Card is Ready',
      subtitle: 'Log in to your student workspace, complete your profile fields with precise registration numbers, and download your library credentials PDF.'
    },
    {
      id: 'default-3',
      imageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1600&auto=format&fit=crop&q=80',
      title: 'Active Technical Notices & Live Broadcasts',
      subtitle: 'Never miss an exam countdown. The new instant-alert administrative notice boards keep your studies synchronized.'
    }
  ];

  const activeSlidesList = heroSlides.length > 0 ? heroSlides : defaultHeroSlides;

  // Premium Gallery Carousel States
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<GalleryItem | null>(null);
  const [isAutoplayActive, setIsAutoplayActive] = useState(true);

  // FAQ Accordion States (প্রশ্ন ও উত্তর)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [expandAllFaqs, setExpandAllFaqs] = useState(false);

  // Auto scroll gallery preview slides
  useEffect(() => {
    if (!isAutoplayActive || galleryItems.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % galleryItems.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isAutoplayActive, galleryItems.length]);

  useEffect(() => {
    fetch('/api/library-status')
      .then(res => res.json())
      .then(data => setStatusData(data))
      .catch(err => console.error("Could not fetch library status", err));

    fetch('/api/notices')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setNotices(data);
        }
      })
      .catch(err => console.error("Could not fetch notices", err));

    fetch('/api/hero-slides')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setHeroSlides(data);
        }
      })
      .catch(err => console.error("Could not fetch hero slides", err));
  }, []);

  // Auto transition for hero slides
  useEffect(() => {
    if (activeSlidesList.length <= 1) return;
    const timer = setInterval(() => {
      setHeroActiveIndex((prev) => (prev + 1) % activeSlidesList.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // Keyboard navigation listener for image lightbox popup
  useEffect(() => {
    if (!selectedGalleryItem || galleryItems.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedGalleryItem(null);
      } else if (e.key === 'ArrowRight') {
        const currentIndex = galleryItems.findIndex(item => item.id === selectedGalleryItem.id);
        if (currentIndex !== -1) {
          const nextIndex = (currentIndex + 1) % galleryItems.length;
          setSelectedGalleryItem(galleryItems[nextIndex]);
        }
      } else if (e.key === 'ArrowLeft') {
        const currentIndex = galleryItems.findIndex(item => item.id === selectedGalleryItem.id);
        if (currentIndex !== -1) {
          const prevIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
          setSelectedGalleryItem(galleryItems[prevIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGalleryItem, galleryItems]);

  useEffect(() => {
    const fetchRecentBorrows = async () => {
      try {
        const res = await fetch('/api/admin/borrows');
        if (res.ok) {
          const records = await res.json();
          const borrowedBooksMap: Book[] = [];
          records.forEach((record: any) => {
            const found = books.find(b => b.id === record.bookId || b.title === record.bookTitle);
            if (found && !borrowedBooksMap.some(b => b.id === found.id)) {
              borrowedBooksMap.push({
                ...found,
                borrowerName: record.studentName || 'Scholar Student'
              } as any);
            }
          });
          
          if (borrowedBooksMap.length > 3) {
            setRecentBorrows(borrowedBooksMap);
            return;
          }
        }
      } catch (err) {
        console.error("Could not fetch recent borrows:", err);
      }
      
      // Fallback selection if no real database borrows yet to keep marquee vibrant
      const fallbackList = books.slice(0, 8).map((b, i) => ({
        ...b,
        borrowerName: ['Sarah Jenkins', 'Elena Rossi', 'Kenji Sato', 'James Stevenson', 'Robert Karim', 'Anita Meyers', 'Lucas Thorne', 'Marcus Watson'][i % 8]
      }));
      setRecentBorrows(fallbackList);
    };

    if (books && books.length > 0) {
      fetchRecentBorrows();
    }
  }, [books]);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch.trim()) {
      setSearchQuery(localSearch.trim());
      setCurrentView('catalog');
    }
  };

  const bookOfMonth = books.find(b => b.title.includes("The Architecture of Information")) || books[1];

  // Robust book collections for home page showcase expansion
  const newArrivalsList = books.slice(0, 15);
  const trendingBooksList = books.filter(b => b.format === 'E-Book' || b.category === 'Technology' || b.id.charCodeAt(0) % 2 === 0);
  const recentlyAddedList = books.slice(5, 20);
  const recommendedList = books.filter(b => b.category === 'Science' || b.category === 'Mathematics' || b.id.charCodeAt(0) % 2 === 1).slice(0, 12);

  // Top 10 Borrowed Books Leaderboard (সর্বাধিক ধার নেওয়া বই)
  const top10BorrowedList = books.slice(2, 12).map((book, idx) => ({
    ...book,
    borrowCount: 148 - idx * 11,
    rank: idx + 1
  }));

  const newArrivalNames = ["Quantum Mechanics II", "Global Economic Trends", "Urban Development", "Molecular Biology", "Digital Ethics 101"];
  const newArrivals = books.filter(b => newArrivalNames.some(name => b.title.includes(name)))
    .slice(0, 5);

  const viewBookDetails = (bookId: string) => {
    setSelectedBookId(bookId);
    setCurrentView('book-detail');
  };

  const handleCategoryClick = (categoryName: string) => {
    setCategoryFilter(categoryName);
    setCurrentView('catalog');
  };

  return (
    <div className="font-sans text-[#334155] bg-slate-50/50 pb-16 animate-fade-in" id="home-view">
      
      {/* 1. Hero Search Banner - Bounded Container with Modern Glass Backdrop & Dynamic Slides */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8" id="hero-banner-container">
        <div className="relative h-[440px] rounded-3xl overflow-hidden shadow-xl border border-slate-200/50 bg-slate-900" id="hero-banner-slider-wrapper">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={heroActiveIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 w-full h-full bg-cover bg-center flex items-center"
              style={{
                backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.52)), url('${activeSlidesList[heroActiveIndex]?.imageUrl}')`
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
              
              <div className="relative max-w-4xl mx-auto px-6 sm:px-12 text-center text-white z-10 w-full">
                <div className="inline-flex items-center space-x-2 bg-blue-500/20 backdrop-blur-md rounded-full px-4 py-1.5 border border-white/10 mb-5">
                  <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100">
                    {branding?.shortName || "CpiLib"} Digital Portal
                  </span>
                </div>
                
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight mb-4 font-sans text-white leading-tight">
                  {activeSlidesList[heroActiveIndex]?.title}
                </h1>
                <p className="text-xs sm:text-xs md:text-sm text-slate-300 font-medium max-w-2xl mx-auto mb-8 leading-relaxed">
                  {activeSlidesList[heroActiveIndex]?.subtitle}
                </p>

                {/* Premium Search Bar Container inside the Active Slide */}
                <form onSubmit={handleHeroSearch} className="relative max-w-2xl mx-auto flex bg-white/95 p-1.5 shadow-lg rounded-[18px] border border-slate-200/20" id="hero-slider-search-form">
                  <div className="relative flex-grow flex items-center">
                    <Search className="absolute left-4 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search textbook title, engineering department, or code..." 
                      value={localSearch}
                      onChange={e => setLocalSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-transparent text-slate-900 border-none outline-none font-sans text-xs placeholder-slate-400 focus:ring-0 focus:outline-none"
                      id="hero-slider-search-input"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] hover:brightness-[106%] text-white px-7 py-2.5 rounded-[12px] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md select-none"
                    id="hero-slider-search-btn"
                  >
                    Search Catalog
                  </button>
                </form>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Manual Left/Right Arrow Chevrons */}
          {activeSlidesList.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setHeroActiveIndex((prev) => (prev - 1 + activeSlidesList.length) % activeSlidesList.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-25 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
                aria-label="Previous Hero Slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setHeroActiveIndex((prev) => (prev + 1) % activeSlidesList.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-25 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
                aria-label="Next Hero Slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Slide dot indicators at bottom container edge */}
          {activeSlidesList.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-25 flex space-x-2 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/5">
              {activeSlidesList.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setHeroActiveIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    heroActiveIndex === idx ? 'bg-blue-500 w-4' : 'bg-white/50 hover:bg-white'
                  }`}
                  aria-label={`Go to hero slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main Grid: Book of the Month + Library Pulse Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="featured-grid-panel">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Featured Book of the Month Card - Real Premium Card Style */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-center shadow-xs hover:shadow-lg transition-all duration-300" id="book-of-the-month-card">
            
            {/* Textbook representation with correct aspect ratio & spine depth */}
            <div 
              className="w-48 sm:w-52 shrink-0 transition-transform duration-300 hover:scale-[1.03] cursor-pointer" 
              onClick={() => viewBookDetails(bookOfMonth?.id)}
            >
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 border border-slate-200/80 shadow-md rounded-2xl relative overflow-hidden h-[290px] flex items-center justify-center">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-slate-200 to-transparent z-10"></div>
                <img 
                  src={bookOfMonth?.imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop'} 
                  alt={bookOfMonth?.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain filter drop-shadow-md rounded-lg"
                />
              </div>
            </div>

            <div className="flex-grow text-center md:text-left flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-center md:justify-start gap-1.5 mb-2.5">
                  <span className="text-[10px] bg-blue-50 text-blue-700 font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider border border-blue-100">
                    Editors' Choice
                  </span>
                  <span className="text-[10px] bg-amber-50 text-amber-700 font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider border border-amber-100">
                    Book of the Month
                  </span>
                </div>
                
                <h3 
                  className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 mb-2 hover:text-[#1E40AF] transition-colors cursor-pointer line-clamp-2" 
                  onClick={() => viewBookDetails(bookOfMonth?.id)}
                >
                  {bookOfMonth?.title}
                </h3>
                <p className="text-xs text-slate-500 mb-3.5 font-semibold">By {bookOfMonth?.author}</p>
                
                {/* Visual rating metric */}
                <div className="flex items-center justify-center md:justify-start gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((st) => (
                    <Star key={st} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                  <span className="text-xs font-bold text-slate-600 ml-1.5">5.0 Recommendation Score</span>
                </div>

                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  {bookOfMonth?.description.substring(0, 180)}...
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 justify-center md:justify-start pt-2 border-t border-slate-100">
                <button 
                  onClick={() => viewBookDetails(bookOfMonth?.id)}
                  className="btn-premium-primary !h-11 !rounded-xl !text-xs"
                  id="botm-borrow-btn"
                >
                  Borrow Textbook
                </button>
                <button 
                  onClick={() => viewBookDetails(bookOfMonth?.id)}
                  className="btn-premium-secondary !h-11 !rounded-xl !text-xs"
                  id="botm-details-btn"
                >
                  Full Document Details
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Branch Hours & Metrics */}
          <div className="flex flex-col gap-6 lg:col-span-1">
            
            {/* Live Branch status with elegant styling details */}
            <div className="bg-white border border-slate-200/80 p-6 shadow-xs rounded-3xl text-slate-800" id="library-status-card">
              <h3 className="font-sans font-extrabold text-xs uppercase tracking-wider text-slate-450 border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>Real-time Branch Hours</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-blue-500 block"></span>
              </h3>

              {statusData ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Access Windows:</span>
                    {statusData.status === 'OPEN' ? (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-550/10 text-emerald-700 text-[10px] uppercase font-bold px-3 py-1 rounded-full tracking-wider shadow-xs animate-pulse" id="home-open-status">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        OPEN NOW
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-800 text-[10px] uppercase font-bold px-3 py-1 rounded-full tracking-wider shadow-xs" id="home-closed-status">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        CLOSED NOW
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="font-semibold text-slate-500">Official Hours:</span>
                      <span className="font-mono font-bold text-[#1E40AF] bg-blue-50 border border-blue-100/50 px-2.5 py-0.5 rounded-md">{statusData.openingTime} - {statusData.closingTime}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span className="font-semibold text-slate-500">Days Active:</span>
                      <span className="font-semibold text-slate-800 bg-slate-100/60 px-2.5 py-0.5 rounded-md">{statusData.weeklySchedule}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-2 float-right font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Refreshed {new Date(statusData.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#1E40AF] border-t-transparent rounded-full animate-spin"></span>
                  <span>Fetching platform variables...</span>
                </div>
              )}
            </div>

            {/* Library Pulse Stats - Beautiful Deep Solid Primary Color */}
            <div className="bg-[#1E40AF] text-white rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-md relative overflow-hidden" id="library-pulse-card">
              {/* Graphic highlights to create elevation and SaaS contrast */}
              <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-white/5 pointer-events-none"></div>
              
              <div>
                <h3 className="font-sans font-bold text-xs uppercase tracking-widest text-[#F59E0B] mb-5 pb-2 border-b border-white/10">Library Pulse Panel</h3>
                <div className="space-y-4">
                  
                  <div className="flex items-center space-x-3.5">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                      <Compass className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-bold font-mono text-white">50k+ Assets</p>
                      <p className="text-[9px] text-blue-200 tracking-wider uppercase leading-none mt-0.5">Physical & Digital Catalog</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3.5">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-bold font-mono text-white">10k+ Members</p>
                      <p className="text-[9px] text-blue-200 tracking-wider uppercase leading-none mt-0.5">Active Faculty/Students</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3.5">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                      <Star className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-bold font-mono text-white">2,400+ Monthly</p>
                      <p className="text-[9px] text-blue-200 tracking-wider uppercase leading-none mt-0.5">System Textbook Loans</p>
                    </div>
                  </div>

                </div>
              </div>

              <button 
                onClick={() => setCurrentView('dashboard')} 
                className="text-[11px] font-bold uppercase tracking-wider text-white mt-6 flex items-center hover:text-amber-300 focus:outline-none cursor-pointer self-start transition-colors"
                id="view-report-link"
              >
                Go to Dashboard Controls <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* 1.5 Real-time Notice Board Module */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-2" id="home-notice-board-section">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 mb-6 gap-4 select-none">
            <div>
              <div className="inline-flex items-center space-x-2 bg-red-50 text-red-700 px-3 py-1 font-sans font-bold text-[9px] uppercase tracking-wider mb-2.5 border border-red-100 rounded-md">
                <Megaphone className="w-3.5 h-3.5" />
                <span>Notice Board System</span>
              </div>
              <h2 className="text-xl font-bold font-sans text-slate-900 tracking-tight">
                অফিসিয়াল নোটিশ বোর্ড <span className="text-slate-400 font-medium font-sans">| Official Announcements</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Stay up-to-date with academic updates, exam cycles, and central library notifications.</p>
            </div>
            
            <button 
              onClick={() => setShowAllNoticesModal(true)}
              className="inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold px-4 py-2 rounded-xl transition-all border border-slate-200 cursor-pointer uppercase tracking-wider gap-1.5 self-start sm:self-center"
              id="view-all-notices-btn"
            >
              <span>View All Notices</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {notices.length === 0 ? (
            <div className="text-center py-12 select-none text-slate-400">
              <Megaphone className="w-10 h-10 mx-auto text-slate-300 mb-2.5" />
              <p className="text-xs font-bold font-sans text-slate-600">No active notices published</p>
              <p className="text-[10px] text-slate-400 mt-1">Academic administrative notices will appear in real-time as soon as logged.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="latest-notices-grid">
              {notices
                .sort((a, b) => {
                  if (a.pinned && !b.pinned) return -1;
                  if (!a.pinned && b.pinned) return 1;
                  return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
                })
                .slice(0, 3)
                .map((notice) => {
                  const isUrgent = notice.urgent;
                  const isPinned = notice.pinned;
                  return (
                    <div 
                      key={notice.id}
                      onClick={() => setSelectedNotice(notice)}
                      className={`relative bg-slate-50/50 border ${
                        isUrgent ? 'border-red-200 bg-red-50/10 hover:border-red-400' : 'border-slate-200/80 hover:border-blue-500 hover:bg-white'
                      } p-5 rounded-2xl cursor-pointer hover:shadow-md transition-all duration-300 flex flex-col justify-between group`}
                      id={`notice-card-${notice.id}`}
                    >
                      <div>
                        {/* Notice badges */}
                        <div className="flex items-center justify-between mb-3.5 select-none">
                          <span className="text-[9px] text-slate-400 font-mono font-bold flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {new Date(notice.publishDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                          
                          <div className="flex gap-1.5 font-sans font-bold">
                            {isPinned && (
                              <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                <Pin className="w-2.5 h-2.5 text-amber-600" />
                                Pinned
                              </span>
                            )}
                            {isUrgent && (
                              <span className="inline-flex items-center gap-1 bg-red-50 border border-red-200 text-red-700 text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                Urgent
                              </span>
                            )}
                          </div>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 line-clamp-2 leading-snug mb-2 font-sans">
                          {notice.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">
                          {notice.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-blue-600 group-hover:underline">
                        <span>Read Full Details</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </section>

      {/* 2. Explore Collections Section - Premium Gradient Icon Cards */}
      <section className="bg-slate-100/50 border-y border-slate-200 py-14" id="explore-categories-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 select-none">
            <div>
              <h2 className="text-base font-bold text-slate-950 uppercase tracking-widest text-[#1E40AF]">Explore Collections</h2>
              <p className="text-xs text-slate-500 mt-1">Browse through our academic depts and cataloged reserves.</p>
            </div>
            <button 
              onClick={() => {
                setCategoryFilter('All');
                setCurrentView('catalog');
              }}
              className="text-xs font-bold uppercase tracking-wider text-[#1E40AF] hover:text-[#3B82F6] cursor-pointer"
              id="categories-view-all-btn"
            >
              Browse Expanded Catalog
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { 
                id: 'physics', 
                label: 'STEM / Sc', 
                banglaLabel: 'বিজ্ঞান ও প্রযুক্তি', 
                category: 'Physics', 
                icon: Atom,
                books: '12,450 Books',
                journals: '120 Journals',
                gradient: 'from-blue-500/10 to-indigo-500/5'
              },
              { 
                id: 'history', 
                label: 'Archives', 
                banglaLabel: 'ইতিহাস ও ঐতিহ্য', 
                category: 'History', 
                icon: Scroll,
                books: '5,800 Books',
                journals: '45 Journals',
                gradient: 'from-amber-500/10 to-orange-500/5'
              },
              { 
                id: 'law', 
                label: 'Law Dept', 
                banglaLabel: 'আইন ও অধিকার', 
                category: 'Literature', 
                icon: Gavel,
                books: '8,210 Books',
                journals: '70 Journals',
                gradient: 'from-sky-500/10 to-blue-500/5'
              },
              { 
                id: 'arts', 
                label: 'Arts & Hum', 
                banglaLabel: 'শিল্প ও সাহিত্য', 
                category: 'History', 
                icon: Palette,
                books: '4,100 Books',
                journals: '20 Journals',
                gradient: 'from-rose-500/10 to-pink-500/5'
              },
              { 
                id: 'it', 
                label: 'IT / CSE', 
                banglaLabel: 'তথ্যপ্রযুক্তি', 
                category: 'IT', 
                icon: Cpu,
                books: '14,300 Books',
                journals: '185 Journals',
                gradient: 'from-emerald-500/10 to-teal-500/5'
              },
              { 
                id: 'medicine', 
                label: 'Chem / Bio', 
                banglaLabel: 'চিকিৎসা বিজ্ঞান', 
                category: 'Chemistry', 
                icon: Stethoscope,
                books: '7,900 Books',
                journals: '90 Journals',
                gradient: 'from-red-500/10 to-rose-500/5'
              },
              { 
                id: 'bangla', 
                label: 'Bangla Lit', 
                banglaLabel: 'বাংলা সাহিত্য', 
                category: 'Bangla', 
                icon: Languages,
                books: '9,250 Books',
                journals: '30 Journals',
                gradient: 'from-violet-500/10 to-fuchsia-500/5'
              }
            ].map(cat => {
              const Icon = cat.icon;
              return (
                <div 
                  key={cat.id}
                  id={`cat-card-${cat.id}`}
                  onClick={() => handleCategoryClick(cat.category)}
                  className="bg-white border border-slate-200 hover:border-[#1E40AF] p-5 pb-6 flex flex-col items-center justify-center text-center cursor-pointer rounded-2xl group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg"
                >
                  {/* Gradient Icon Container */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${cat.gradient} flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-5 h-5 text-slate-800" />
                  </div>

                  {/* Title labels */}
                  <span className="font-sans font-bold text-xs text-slate-800 uppercase tracking-wider group-hover:text-[#1E40AF] transition-colors mb-0.5">
                    {cat.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold group-hover:text-[#1E40AF]/80 transition-colors font-sans mb-3">
                    {cat.banglaLabel}
                  </span>

                  {/* Added descriptive book counts for visual depth */}
                  <div className="border-t border-slate-100/80 w-full pt-2.5 flex flex-col gap-0.5">
                    <span className="text-[8.5px] font-mono text-slate-500 font-semibold uppercase leading-none">{cat.books}</span>
                    <span className="text-[8.5px] font-mono text-[#3B82F6] font-extrabold uppercase leading-none mt-0.5">{cat.journals}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2.5 Recently Borrowed Live Marquee Stream */}
      <section className="bg-slate-50/80 py-10 overflow-hidden relative border-b border-slate-205" id="recent-borrow-stream-section">
        {/* Left and Right ambient fades for premium SaaS visual depth */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-sans">
                সদস্যদের সাম্প্রতিক পঠিত বই সমূহ <span className="text-slate-400 font-sans font-light">| Live Loan Stream</span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 sm:mt-0 font-sans">
              Currently requested volumes by faculty & student researchers. Click to view & borrow.
            </p>
          </div>
        </div>

        {/* Marquee Track Container */}
        <div className="relative w-full">
          <style>{`
            @keyframes marqueeScroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .marquee-track {
              display: flex;
              width: max-content;
              animation: marqueeScroll 45s linear infinite;
            }
            .marquee-track:hover {
              animation-play-state: paused;
            }
          `}</style>
          
          <div className="marquee-track gap-5 pl-4">
            {recentBorrows && recentBorrows.length > 0 && [...recentBorrows, ...recentBorrows].map((book, idx) => {
              const uniqueKey = `marquee-${book.id || book.isbn}-${idx}`;
              return (
                <div 
                  key={uniqueKey}
                  onClick={() => viewBookDetails(book.id)}
                  className="w-[280px] bg-white border border-slate-200/80 hover:border-[#2563eb] hover:shadow-md transition-all duration-300 rounded-xl p-3 flex items-center gap-3.5 cursor-pointer shrink-0 select-none group"
                >
                  {/* Miniature Book Cover */}
                  <div className="w-12 h-16 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 flex items-center justify-center shrink-0">
                    <img 
                      src={book.imageUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=200'} 
                      alt={book.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  
                  {/* Text details */}
                  <div className="flex-grow min-w-0">
                    <span className="text-[9px] font-semibold text-[#2563eb] tracking-wide uppercase">
                      {book.category}
                    </span>
                    <h4 className="text-xs font-semibold text-slate-850 line-clamp-1 group-hover:text-[#2563eb] transition-colors leading-tight">
                      {book.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      By {book.author}
                    </p>
                    
                    {/* Active borrower tag */}
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="text-[9.5px] font-medium font-sans text-slate-400">
                        Borrowed by <span className="font-semibold text-slate-600">{(book as any).borrowerName || 'Scholar Student'}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Home View Expanded Book Collections (5 Curated Shelves & Leaderboards) */}
      
      {/* 3.1 New Arrivals Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14" id="new-arrivals-section">
        <div className="flex items-end justify-between mb-8 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 border-l-4 border-blue-600 pl-3 h-max">New Arrivals Shelf (নতুন বইয়ের সমাহার)</h2>
            <p className="text-xs text-slate-500 mt-1">Acquired textbooks and research resources for the current academic session.</p>
          </div>
          <span className="text-xs font-mono font-bold text-blue-600 uppercase bg-blue-50 border border-blue-100 px-3 py-1 rounded-md">CPI-2026 Session</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {newArrivalsList.slice(0, limitNewArrivals).map((book, idx) => (
            <div 
              key={book.id}
              onClick={() => viewBookDetails(book.id)}
              className="bg-white border border-slate-200 hover:border-blue-400 hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 rounded-2xl p-4 flex flex-col justify-between group cursor-pointer text-left w-full"
            >
              <div>
                <div className="relative w-full h-[220px] bg-[#f8fafc] rounded-xl p-3 overflow-hidden border border-slate-100 flex items-center justify-center mb-4 select-none">
                  <img 
                    src={book.imageUrl} 
                    alt={book.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  <span className="absolute top-2.5 left-2.5 bg-blue-600 text-white font-sans font-bold text-[8px] px-2 py-0.5 rounded uppercase tracking-wider">
                    Arrival
                  </span>
                </div>
                <span className="text-[9.5px] font-bold text-blue-650 tracking-wide uppercase inline-block mb-1">
                  {book.category}
                </span>
                <h4 className="font-sans font-bold text-xs text-slate-800 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                  {book.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">By {book.author}</p>
              </div>
              <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-650">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase font-mono">{book.format}</span>
                {book.copiesCount > 0 ? (
                  <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 rounded">Available</span>
                ) : (
                  <span className="text-[9px] font-extrabold text-[#F59E0B] bg-amber-50 px-2 rounded">Borrowed</span>
                )}
              </div>
            </div>
          ))}
        </div>
        {newArrivalsList.length > limitNewArrivals && (
          <div className="mt-8 text-center">
            <button 
              onClick={() => setLimitNewArrivals(prev => prev + 5)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-[10px] uppercase tracking-wider px-6 py-2.5 rounded-xl cursor-pointer transition-colors"
            >
              আরো দেখুন (Load More Acquisitions)
            </button>
          </div>
        )}
      </section>

      {/* 3.2 Top Borrowed Books Leaderboard Section */}
      <section className="bg-gradient-to-b from-slate-50 to-white border-y border-slate-200/60 py-16 text-left font-sans" id="leaderboard-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-[#1E40AF] font-bold text-[10px] uppercase tracking-widest bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
              জনপ্রিয়তার তুলনামূলক তালিকা (Monthly Leaderboard)
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-3">
              সর্বাধিক ধার নেওয়া বই (Top 10 Borrowed Reads)
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">চলতি মাসের লাইব্রেরি রেকর্ড অনুযায়ী শিক্ষার্থীদের মাঝে সবচেয়ে বেশি প্রচারিত ও পঠিত শীর্ষ ১০ টি অ্যাকাডেমিক টেক্সটবই।</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {top10BorrowedList.map((book, idx) => (
              <div 
                key={book.id}
                onClick={() => viewBookDetails(book.id)}
                className="bg-white border border-slate-200 rounded-[20px] p-4 flex flex-col justify-between group hover:shadow-lg hover:border-blue-400 transition-all duration-300 cursor-pointer relative overflow-hidden"
              >
                {/* Floating Rank Badge */}
                <div className={`absolute top-0 right-0 w-12 h-12 flex items-center justify-center font-mono font-black text-sm rounded-bl-3xl ${idx < 3 ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600'}`}>
                  {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                </div>

                <div>
                  {/* Thumbnail Cover */}
                  <div className="aspect-[4/5] bg-slate-50 rounded-xl mb-4 overflow-hidden relative border border-slate-100 flex items-center justify-center p-2 select-none">
                    <img 
                      src={book.imageUrl} 
                      alt={book.title} 
                      referrerPolicy="no-referrer"
                      className="h-[150px] object-contain group-hover:scale-105 transition-transform duration-300"
                      onError={e => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=200';
                      }}
                    />
                  </div>

                  <span className="text-[8.5px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    ★ Monthly Rank #{idx + 1}
                  </span>

                  <h4 className="font-bold text-slate-900 text-xs mt-3 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {book.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">By {book.author}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1 text-slate-650 font-medium">
                    <span className="text-blue-600 font-extrabold font-mono">{book.borrowCount}</span>
                    <span>Borrows</span>
                  </div>
                  <span className="text-[8px] text-slate-400 font-bold uppercase font-mono">{book.format}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3.3 Trending Books Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-left" id="trending-books-section">
        <div className="flex items-end justify-between mb-8 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 border-l-4 border-emerald-500 pl-3 h-max">Trending Books (জনপ্রিয় বইসমূহ)</h2>
            <p className="text-xs text-slate-500 mt-1">Highlighted and widely discussed STEM and humanities studies.</p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-600 uppercase bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-md">Live read rate</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {trendingBooksList.slice(0, limitTrending).map((book, idx) => (
            <div 
              key={book.id}
              onClick={() => viewBookDetails(book.id)}
              className="bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 rounded-2xl p-4 flex flex-col justify-between group cursor-pointer text-left w-full"
            >
              <div>
                <div className="relative w-full h-[220px] bg-[#f8fafc] rounded-xl p-3 overflow-hidden border border-slate-100 flex items-center justify-center mb-4 select-none">
                  <img 
                    src={book.imageUrl} 
                    alt={book.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  <span className="absolute top-2.5 right-2.5 bg-emerald-600 text-white font-sans font-bold text-[8px] px-2 py-0.5 rounded uppercase tracking-wider">
                    98% Match
                  </span>
                </div>
                <span className="text-[9.5px] font-bold text-emerald-650 tracking-wide uppercase inline-block mb-1">
                  {book.category}
                </span>
                <h4 className="font-sans font-bold text-xs text-slate-800 line-clamp-2 leading-snug group-hover:text-emerald-600 transition-colors">
                  {book.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">By {book.author}</p>
              </div>
              <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-650">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase font-mono">{book.format}</span>
                {book.copiesCount > 0 ? (
                  <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 rounded">Active</span>
                ) : (
                  <span className="text-[9px] font-extrabold text-[#F59E0B] bg-amber-50 px-2 rounded">Reserved</span>
                )}
              </div>
            </div>
          ))}
        </div>
        {trendingBooksList.length > limitTrending && (
          <div className="mt-8 text-center">
            <button 
              onClick={() => setLimitTrending(prev => prev + 5)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-[10px] uppercase tracking-wider px-6 py-2.5 rounded-xl cursor-pointer transition-colors"
            >
              আরো দেখুন (Load More Trending)
            </button>
          </div>
        )}
      </section>

      {/* 3.4 Recently Added Section */}
      <section className="bg-slate-50/50 py-16 text-left border-y border-slate-200/60" id="recently-added-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 border-l-4 border-purple-500 pl-3 h-max">Recently Added (সদ্য যুক্ত বই)</h2>
              <p className="text-xs text-slate-500 mt-1">Academic resources and publications registered into catalog during the past 30 days.</p>
            </div>
            <span className="text-xs font-mono font-bold text-purple-650 bg-purple-50 border border-purple-100 px-3 py-1 rounded-md">Catalog Sync</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {recentlyAddedList.slice(0, limitRecentlyAdded).map((book, idx) => (
              <div 
                key={book.id}
                onClick={() => viewBookDetails(book.id)}
                className="bg-white border border-slate-200 hover:border-purple-400 hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 rounded-2xl p-4 flex flex-col justify-between group cursor-pointer text-left w-full"
              >
                <div>
                  <div className="relative w-full h-[220px] bg-[#f8fafc] rounded-xl p-3 overflow-hidden border border-slate-100 flex items-center justify-center mb-4 select-none">
                    <img 
                      src={book.imageUrl} 
                      alt={book.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                    <span className="absolute top-2.5 right-2.5 bg-purple-600 text-white font-sans font-bold text-[8px] px-2 py-0.5 rounded uppercase tracking-wider">
                      Added
                    </span>
                  </div>
                  <span className="text-[9.5px] font-bold text-purple-650 tracking-wide uppercase inline-block mb-1">
                    {book.category}
                  </span>
                  <h4 className="font-sans font-bold text-xs text-slate-800 line-clamp-2 leading-snug group-hover:text-purple-600 transition-colors">
                    {book.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">By {book.author}</p>
                </div>
                <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-655">
                  <span className="text-[8.5px] font-bold text-slate-400 uppercase font-mono">{book.format}</span>
                  {book.copiesCount > 0 ? (
                    <span className="text-[9px] font-extrabold text-purple-700 bg-purple-50 px-2 rounded">New</span>
                  ) : (
                    <span className="text-[9px] font-extrabold text-slate-400 bg-slate-105 px-2 rounded">Hold</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {recentlyAddedList.length > limitRecentlyAdded && (
            <div className="mt-8 text-center">
              <button 
                onClick={() => setLimitRecentlyAdded(prev => prev + 5)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-[10px] uppercase tracking-wider px-6 py-2.5 rounded-xl cursor-pointer transition-colors"
              >
                আরো দেখুন (Load More Cataloged)
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 3.5 Recommended Reads Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-left" id="recommended-reads-section">
        <div className="flex items-end justify-between mb-8 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 border-l-4 border-indigo-600 pl-3 h-max">Recommended Reads (প্রস্তাবিত বইসমূহ)</h2>
            <p className="text-xs text-slate-500 mt-1">Curated academic studies and publications manually selected by department advisors.</p>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-650 uppercase bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-md">Advisors choice</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {recommendedList.slice(0, limitRecommended).map((book, idx) => (
            <div 
              key={book.id}
              onClick={() => viewBookDetails(book.id)}
              className="bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 rounded-2xl p-4 flex flex-col justify-between group cursor-pointer text-left w-full"
            >
              <div>
                <div className="relative w-full h-[220px] bg-[#f8fafc] rounded-xl p-3 overflow-hidden border border-slate-100 flex items-center justify-center mb-4 select-none">
                  <img 
                    src={book.imageUrl} 
                    alt={book.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  <span className="absolute top-2.5 right-2.5 bg-indigo-600 text-white font-sans font-bold text-[8px] px-2 py-0.5 rounded uppercase tracking-wider">
                    Excellent Choice
                  </span>
                </div>
                <span className="text-[9.5px] font-bold text-indigo-650 tracking-wide uppercase inline-block mb-1">
                  {book.category}
                </span>
                <h4 className="font-sans font-bold text-xs text-slate-800 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                  {book.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">By {book.author}</p>
              </div>
              <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-650">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase font-mono">{book.format}</span>
                {book.copiesCount > 0 ? (
                  <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50 px-2 rounded">Curated</span>
                ) : (
                  <span className="text-[9px] font-extrabold text-[#F59E0B] bg-amber-50 px-2 rounded">Check shelf</span>
                )}
              </div>
            </div>
          ))}
        </div>
        {recommendedList.length > limitRecommended && (
          <div className="mt-8 text-center">
            <button 
              onClick={() => setLimitRecommended(prev => prev + 5)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-[10px] uppercase tracking-wider px-6 py-2.5 rounded-xl cursor-pointer transition-colors"
            >
              আরো দেখুন (Load More Curations)
            </button>
          </div>
        )}
      </section>

      {/* 4. Verified Review Testimonials - Modern Realistic Cards */}
      <section className="bg-white border-y border-slate-200/60 py-16" id="testimonials-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto mb-12">
            <h2 className="text-base font-extrabold text-[#1E40AF] uppercase tracking-widest leading-none">Verified Scholars feedback</h2>
            <h3 className="text-xl sm:text-2xl font-bold font-sans text-slate-900 tracking-tight mt-2.5">
              Refining Collaborative Research Quality
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">See how student researchers optimize study hours using ScholarLib.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "James Stevenson",
                role: "PhD Candidate, Physics (CPI)",
                initials: "JS",
                stars: 5,
                text: "\"ScholarLib has completely transformed my thesis research. The digital availability of core STEM journals is an absolute lifesaver during our late-night laboratory sessions.\""
              },
              {
                name: "Anita Meyers",
                role: "Undergraduate, IT / CSE",
                initials: "AM",
                stars: 4,
                text: "\"The search interface is incredibly intuitive. I can find specific research papers across different databases in seconds. Truly efficient for programming assignments.\""
              },
              {
                name: "Robert Karim",
                role: "Senior Faculty, Civil Engineering",
                initials: "RK",
                stars: 5,
                text: "\"The textbook reservation system works perfectly. No more waiting queues in aisles; faculty and studnets just pick up pre-approved books at the counter with ID scans.\""
              }
            ].map((usr, i) => (
              <div 
                key={i} 
                className="bg-slate-50 border border-slate-200/80 p-6 sm:p-7 text-left flex flex-col justify-between rounded-2xl hover:shadow-md hover:border-blue-200 transition-all duration-200"
                id={`testimonial-card-${i}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex space-x-0.5 select-none">
                      {[1, 2, 3, 4, 5].map((st) => (
                        <Star 
                          key={st} 
                          className={`w-3.5 h-3.5 ${
                            st <= usr.stars ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-slate-300'
                          }`} 
                        />
                      ))}
                    </div>
                    {/* Verified Scholar Badge */}
                    <span className="text-[8.5px] bg-blue-50 text-[#1E40AF] border border-blue-100 font-extrabold rounded-full px-2.5 py-0.5 uppercase tracking-wide">
                      ✔ Verified Student
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed italic font-sans">{usr.text}</p>
                </div>
                
                <div className="flex items-center space-x-3 mt-6 pt-4 border-t border-slate-205/60">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1E40AF] to-[#3B82F6] flex items-center justify-center font-sans font-bold text-xs text-white">
                    {usr.initials}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 leading-tight">{usr.name}</h5>
                    <p className="text-[10px] text-slate-500 font-medium tracking-tight mt-0.5">{usr.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4.5 Library Showcase Gallery Section */}
      <section className="bg-slate-50 border-b border-slate-200 py-16" id="home-gallery-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 animate-fade-in">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-[#1E40AF] px-3.5 py-1.5 font-sans font-bold text-[9px] uppercase tracking-wider mb-3.5 border border-blue-100 rounded-md select-none">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Library Photographic Showcase</span>
            </div>
            
            {/* Elegant Bangla/English Header */}
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-sans">
              লাইব্রেরি গ্যালারি <span className="text-slate-400 font-medium font-sans">| Photo Archives</span>
            </h2>
            <div className="h-1 w-10 bg-[#1E40AF] mx-auto mt-3.5 mb-3"></div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
              লাইব্রেরির আধুনিক সুযোগ-সুবিধা, পড়াশোনার শান্ত পরিবেশ এবং আমাদের মনোরম গ্যালারি ও ক্যাম্পাসের সাম্প্রতিক মুহূর্তসমূহ।
            </p>
          </div>

          {galleryItems.length === 0 ? (
            <div className="text-center py-12 bg-white card-premium p-8 select-none text-slate-400 rounded-2xl border border-slate-200">
              <ImageIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-bold font-sans">No gallery pictures currently cataloged.</p>
              <p className="text-[10px] text-slate-400 mt-1">Superintendent admins can add pictures from the Admin Dashboard.</p>
            </div>
          ) : (
            <div className="space-y-8 select-none">
              {/* Primary Premium Showcase Slider */}
              <div 
                className="relative bg-slate-950 rounded-[24px] overflow-hidden shadow-2xl border border-slate-800/80 max-w-3xl mx-auto group/slider"
                onMouseEnter={() => setIsAutoplayActive(false)}
                onMouseLeave={() => setIsAutoplayActive(true)}
              >
                {/* Main Slide Panel with AnimatePresence */}
                <div 
                  className="h-64 sm:h-96 md:h-[420px] relative overflow-hidden flex items-center justify-center cursor-pointer"
                  onClick={() => setSelectedGalleryItem(galleryItems[activeSlide])}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSlide}
                      initial={{ opacity: 0, scale: 1.025 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.45, ease: "easeInOut" }}
                      className="absolute inset-0 w-full h-full"
                    >
                      <img 
                        src={galleryItems[activeSlide].imageUrl} 
                        alt={galleryItems[activeSlide].caption}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-center group-hover/slider:scale-103 transition-transform duration-700 ease-out brightness-[0.93]"
                      />
                      {/* Dark Gradient Overlay for Caption readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/35 pointer-events-none"></div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Top Bar: Slide Index and Autoplay Status */}
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10 pointer-events-none">
                    <span className="backdrop-blur-md bg-black/45 text-white font-mono text-[9px] px-3 py-1 rounded-full font-bold tracking-wider border border-white/10 shadow-md">
                      ARCHIVE {activeSlide + 1} / {galleryItems.length}
                    </span>
                    
                    {galleryItems.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAutoplayActive(!isAutoplayActive);
                        }}
                        className="pointer-events-auto backdrop-blur-md bg-black/45 hover:bg-black/60 text-white rounded-full p-2 border border-white/10 transition-all duration-200 active:scale-95 cursor-pointer shadow-md"
                        title={isAutoplayActive ? "Pause Slideshow" : "Start Slideshow"}
                      >
                        {isAutoplayActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      </button>
                    )}
                  </div>

                  {/* Middle Left/Right Floating Glass Controls (Only if multiple items) */}
                  {galleryItems.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSlide((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full backdrop-blur-md bg-white/15 hover:bg-white text-white hover:text-slate-900 flex items-center justify-center border border-white/15 hover:border-white shadow-xl opacity-0 group-hover/slider:opacity-100 transition-all duration-300 transform -translate-x-1 group-hover/slider:translate-x-0 cursor-pointer"
                        aria-label="Previous slide"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSlide((prev) => (prev + 1) % galleryItems.length);
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full backdrop-blur-md bg-white/15 hover:bg-white text-white hover:text-slate-900 flex items-center justify-center border border-white/15 hover:border-white shadow-xl opacity-0 group-hover/slider:opacity-100 transition-all duration-300 transform translate-x-1 group-hover/slider:translate-x-0 cursor-pointer"
                        aria-label="Next slide"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Caption & Expand CTA Overlay */}
                  <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 pointer-events-none">
                    <div className="max-w-xl">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                        <span className="text-[8px] font-bold text-blue-400 tracking-wider uppercase font-sans">Highlight Photo</span>
                      </div>
                      <h4 className="text-xs sm:text-sm md:text-base font-bold text-white leading-normal drop-shadow-md font-sans">
                        {galleryItems[activeSlide].caption}
                      </h4>
                    </div>

                    <button 
                      type="button"
                      className="pointer-events-auto self-start md:self-end backdrop-blur-md bg-blue-600/75 hover:bg-blue-600 text-white font-sans text-[9px] uppercase font-bold tracking-widest px-3.5 py-2 rounded-xl border border-blue-400/20 shadow-lg group/btn hover:scale-102 active:scale-97 transition-all flex items-center gap-1.5 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedGalleryItem(galleryItems[activeSlide]);
                      }}
                    >
                      <Maximize2 className="w-3 h-3 text-blue-100 group-hover/btn:rotate-90 duration-300" />
                      <span>zoom / popup</span>
                    </button>
                  </div>
                </div>

                {/* Bottom Pagination indicators (Only if multiple items) */}
                {galleryItems.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center space-x-1.5">
                    {galleryItems.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSlide(idx);
                        }}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                          idx === activeSlide ? 'w-5 bg-blue-500' : 'w-1.5 bg-slate-500 hover:bg-slate-400'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Slider Thumbnails Strip - Quick Navigation */}
              {galleryItems.length > 1 && (
                <div className="max-w-3xl mx-auto">
                  <p className="text-[9px] text-center font-bold text-slate-400 uppercase tracking-widest mb-3 select-none">
                    Jump directly to scene
                  </p>
                  <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 scrollbar-none px-4 select-none">
                    {galleryItems.map((item, index) => {
                      const isActive = index === activeSlide;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveSlide(index);
                          }}
                          className={`w-14 h-10 md:w-16 md:h-12 rounded-lg overflow-hidden cursor-pointer border-2 transition-all shrink-0 duration-350 relative ${
                            isActive 
                              ? 'border-blue-600 scale-105 shadow-md shadow-blue-500/10 brightness-100' 
                              : 'border-slate-200 brightness-[0.6] hover:brightness-[0.8] hover:border-slate-350'
                          }`}
                        >
                          <img 
                            src={item.imageUrl} 
                            alt={item.caption}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Immersive Lightbox Modal Container */}
      <AnimatePresence>
        {selectedGalleryItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[120] flex flex-col items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md select-none"
            onClick={() => setSelectedGalleryItem(null)}
          >
            {/* Close floating button */}
            <button
              type="button"
              onClick={() => setSelectedGalleryItem(null)}
              className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95 flex items-center justify-center text-white transition-all shadow-2xl border border-white/10 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Immersive navigation elements within popup */}
            {galleryItems.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentIndex = galleryItems.findIndex(item => item.id === selectedGalleryItem.id);
                    if (currentIndex !== -1) {
                      const prevIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
                      setSelectedGalleryItem(galleryItems[prevIndex]);
                    }
                  }}
                  className="absolute left-2 md:left-6 w-11 h-11 rounded-full bg-white/5 hover:bg-white/15 text-white flex items-center justify-center border border-white/10 active:scale-95 transition-all shadow-2xl cursor-pointer"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentIndex = galleryItems.findIndex(item => item.id === selectedGalleryItem.id);
                    if (currentIndex !== -1) {
                      const nextIndex = (currentIndex + 1) % galleryItems.length;
                      setSelectedGalleryItem(galleryItems[nextIndex]);
                    }
                  }}
                  className="absolute right-2 md:right-6 w-11 h-11 rounded-full bg-white/5 hover:bg-white/15 text-white flex items-center justify-center border border-white/10 active:scale-95 transition-all shadow-2xl cursor-pointer"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Middle Image viewport with scale up entrance */}
            <motion.div
              initial={{ scale: 0.96, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 10 }}
              transition={{ type: "spring", damping: 26, stiffness: 190 }}
              className="relative max-w-3xl max-h-[75vh] md:max-h-[82vh] flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedGalleryItem.imageUrl}
                alt={selectedGalleryItem.caption}
                referrerPolicy="no-referrer"
                className="max-h-[62vh] md:max-h-[72vh] w-auto max-w-[94vw] md:max-w-2xl object-contain rounded-2xl shadow-2xl border border-white/10"
              />

              {/* Caption Banner Bar */}
              <div className="bg-black/60 backdrop-blur-md px-5 py-3.5 rounded-xl text-center border border-white/10 shadow-2xl mt-4 max-w-[94vw]">
                <p className="text-white text-xs sm:text-sm font-medium leading-relaxed font-sans">
                  {selectedGalleryItem.caption}
                </p>
                {galleryItems.length > 1 && (
                  <p className="text-[9px] text-slate-400 font-mono mt-1 select-none">
                    Photo {galleryItems.findIndex(i => i.id === selectedGalleryItem.id) + 1} of {galleryItems.length} • Use Left/Right Arrow Keys to browse
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4.6 Library Officers Directory - Fully Responsive Card with Communications */}
      <section className="bg-white py-16" id="home-librarians-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center space-x-2 bg-amber-50 text-amber-700 px-3.5 py-1.5 font-sans font-bold text-[9px] uppercase tracking-wider mb-4 border border-amber-200 rounded-md">
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span>Library Officers</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-900 tracking-tight">
              লাইব্রেরিয়ান ও দায়িত্বপ্রাপ্ত কর্মকর্তা <span className="text-slate-400 font-medium font-sans">| shift Directory</span>
            </h2>
            <div className="h-1 w-10 bg-[#F59E0B] mx-auto mt-3.5 mb-3"></div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
              লাইব্রেরির যেকোনো তথ্য অনুসন্ধান, বই উদ্ধার বা লজিস্টিক সহায়তার জন্য শিফট অনুযায়ী দায়িত্বপ্রাপ্ত কর্মচারীদের সাথে দ্রুত যোগাযোগ করুন।
            </p>
          </div>

          {librarians.length === 0 ? (
            <div className="text-center py-12 bg-slate-55/60 border border-slate-200/80 rounded-2xl p-8 select-none text-slate-400">
              <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-bold font-sans text-slate-600">No librarians listed in roster.</p>
              <p className="text-[10px] text-slate-400 mt-1">Librarians can be managed securely from the Admin Console.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8" id="librarians-grid">
              {librarians.map((lib) => (
                <div 
                  key={lib.id} 
                  className="bg-slate-50/70 border border-slate-200/85 p-6 flex flex-col sm:flex-row gap-5 items-start hover:border-[#1E40AF] hover:bg-white transition-all duration-300 rounded-2xl shadow-xs"
                  id={`librarian-card-${lib.id}`}
                >
                  {/* Real Photo Placeholder - Visual Avatar Frame */}
                  <div className="w-16 h-16 shrink-0 bg-gradient-to-tr from-[#1E40AF] to-[#3B82F6] flex items-center justify-center text-white font-sans font-extrabold text-xl rounded-xl shadow-xs">
                    {lib.name.trim().substring(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-grow font-sans w-full">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-sm font-bold text-slate-900">{lib.name}</h3>
                      <span className="text-[9px] bg-blue-50 text-[#1E40AF] font-bold border border-blue-100 px-2 py-0.5 rounded-full uppercase">
                        {lib.shift}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-xs mb-4 text-slate-600">
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                        <span><strong>Duty shift:</strong> Active hours inside CPI Desk</span>
                      </div>
                      
                      {lib.mobile && (
                        <div className="flex items-center gap-2.5 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                          <span><strong>Tel / Mobile:</strong> {lib.mobile}</span>
                        </div>
                      )}

                      {lib.address && (
                        <div className="flex items-start gap-2.5 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-450 shrink-0 mt-0.5" />
                          <span className="leading-tight"><strong>Roster Station:</strong> {lib.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Added Real Functional Buttons: Call, Email, and WhatsApp to satisfy requirements */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200/60 mt-3">
                      {lib.mobile && (
                        <>
                          <a 
                            href={`tel:${lib.mobile}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-205 hover:bg-slate-50 text-slate-700 text-[10px] font-extrabold rounded-lg uppercase tracking-wide transition-colors"
                          >
                            <Phone className="w-3 h-3 text-[#1E40AF]" /> Call Officer
                          </a>
                          <a 
                            href={`https://wa.me/${lib.mobile.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100/55 text-emerald-800 text-[10px] font-extrabold rounded-lg uppercase tracking-wide transition-colors"
                          >
                            <MessageSquare className="w-3 h-3 text-emerald-600" /> WhatsApp
                          </a>
                        </>
                      )}
                      <a 
                        href="mailto:librarian@chattpoly.edu.bd"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-205 hover:bg-slate-50 text-slate-705 text-[10px] font-extrabold rounded-lg uppercase tracking-wide transition-colors"
                      >
                        <Mail className="w-3 h-3 text-[#3B82F6]" /> Email Support
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4.8 FAQ / Q&A Section (প্রশ্ন ও উত্তর) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-left" id="faq-section">
        <div className="border border-slate-205 bg-white rounded-3xl p-6 sm:p-10 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-100">
            <div>
              <span className="text-[#1E40AF] font-bold text-[10px] uppercase tracking-widest bg-blue-50 border border-blue-100 px-3 py-1 rounded-full font-mono">
                জিজ্ঞাসিত প্রশ্নাবলী (Common Library Q&A)
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-3 font-sans">
                প্রশ্ন ও উত্তর (FAQ Section)
              </h2>
              <p className="text-xs text-slate-500 mt-1">লাইব্রেরি ব্যবহার পদ্ধতি, বই সংরক্ষণ ও জরিমানা সংক্রান্ত সাধারণ বিষয়সমূহ জেনে নিন।</p>
            </div>

            {/* Expand / Collapse All & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search input with search icon */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="প্রশ্ন খুঁজুন..."
                  value={faqSearchQuery}
                  onChange={e => {
                    setFaqSearchQuery(e.target.value);
                    if (e.target.value) {
                      setExpandAllFaqs(true);
                    }
                  }}
                  className="pl-9 pr-4 py-2 text-xs border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-105 bg-slate-50/50 min-w-[200px]"
                />
                {faqSearchQuery && (
                  <button 
                    onClick={() => { setFaqSearchQuery(''); setExpandAllFaqs(false); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 font-bold text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Action toggles */}
              <button
                onClick={() => {
                  setExpandAllFaqs(!expandAllFaqs);
                  setOpenFaqIndex(null);
                }}
                className="bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 font-bold text-[10px] uppercase tracking-wider py-2 px-4 rounded-xl cursor-pointer transition-all whitespace-nowrap"
              >
                {expandAllFaqs ? "সব বন্ধ করুন (Collapse All)" : "সব খুলুন (Expand All)"}
              </button>
            </div>
          </div>

          {/* Accordion Questions List */}
          <div className="space-y-3">
            {[
              {
                q: "ডিজিটাল লাইব্রেরি ব্যবহারের নিয়ম কী?",
                ans: "লাইব্রেরি ব্যবহার করতে হলে প্রতিটি শিক্ষার্থীকে অবশ্যই নিজের রোল ও রেজিস্ট্রেশন নম্বর ব্যবহার করে ডিজিটাল পোর্টালে সাইন-ইন করতে হবে। পোর্টাল থেকে যেকোনো ই-বুক সরাসরি যেকোনো সময় ব্রাউজারেই পড়া যাবে এবং ফিজিক্যাল বইয়ের ক্ষেত্রে অনলাইন বুকিং দেওয়ার পরে অনুমোদিত স্লিপ নিয়ে কাউন্টার থেকে সংগ্রহ করা যাবে।"
              },
              {
                q: "কিভাবে আমি একটি বই ধার নিতে পারি?",
                ans: "যেকোনো বইয়ের বিবরণী পৃষ্ঠায় ঢুকে 'ধার নিশ্চিত করুন' (Request Borrow Duration Layout) বাটনে ক্লিক করে মেয়াদ নির্বাচন করে রিকোয়েস্ট সাবমিট করুন। এরপর অ্যাডমিন বা লাইব্রেরিয়ান সেটি অনুমোদন করলে আপনি লাইব্রেরি কাউন্টারে গিয়ে মূল ফিজিক্যাল কপিটি সংগ্রহ করতে পারবেন।"
              },
              {
                q: "বই ধার নেওয়ার সর্বোচ্চ মেয়াদ কতদিন?",
                ans: "সাধারণ ফিজিক্যাল বইয়ের ক্ষেত্রে সর্বোচ্চ ১৫ দিন পর্যন্ত বই নিজের কাছে রাখা সম্ভব। নির্ধারিত মেয়াদ পার হওয়ার পূর্বে পোর্টালে ঢুকে পুনরায় ড্যাশবোর্ড থেকে রিনিউয়াল (Renewal Entry) রিকোয়েস্ট সাবমিট করতে হবে।"
              },
              {
                q: "বই ফেরত দিতে বিলম্ব হলে কি কোনো জরিমানা আছে?",
                ans: "হ্যাঁ, নির্ধারিত মেয়াদের পর বই ফেরত দিতে বিলম্ব হলে প্রতিদিন ৫ টাকা হারে অলস ফাইন যুক্ত হবে। অলস ফাইন অ্যাকাউন্টের ওয়ালেট লেজারে যোগ হবে যা লাইব্রেরি কাউন্টারে ম্যানুয়ালি পরিশোধ করে ক্লিয়ারেন্সের জন্য এন্ট্রি পাওয়া সম্ভব।"
              },
              {
                q: "গ্যালারিতে ছবি আপলোড করার প্রক্রিয়া কী?",
                ans: "নিবন্ধিত শিক্ষার্থীরা তাদের ড্যাশবোর্ডের 'গ্যালারি সাবমিশন' ট্যাব ব্যবহার করে যেকোনো ছবির শিরোনাম ও একটি বৈধ ছবির ইউআরএল টাইপ করে আপলোড করতে পারবেন। অ্যাডমিন এপ্রুভাল রিকোয়েস্ট থেকে সেটিকে অনুমোদন দিলেই সেটি সরাসরি হোমপেজের পাবলিক গ্যালারি শোকেসে এন্ট্রি পাবে।"
              }
            ]
            .filter(item => {
              if (!faqSearchQuery) return true;
              return item.q.toLowerCase().includes(faqSearchQuery.toLowerCase()) || item.ans.toLowerCase().includes(faqSearchQuery.toLowerCase());
            })
            .map((item, index) => {
              const isOpen = expandAllFaqs || openFaqIndex === index;
              return (
                <div 
                  key={index} 
                  className="border border-slate-205 rounded-2xl overflow-hidden bg-slate-50/20 hover:bg-slate-50/50 transition-all duration-200 text-left"
                >
                  <button
                    onClick={() => {
                      if (expandAllFaqs) setExpandAllFaqs(false);
                      setOpenFaqIndex(openFaqIndex === index ? null : index);
                    }}
                    className="w-full font-sans font-bold text-slate-800 text-xs sm:text-sm p-4 sm:p-5 flex items-center justify-between text-left cursor-pointer transition-colors"
                  >
                    <span className="pr-4 leading-normal font-semibold text-slate-850 select-none flex items-center gap-2.5">
                      <span className="text-[#1E40AF] font-mono select-none font-extrabold">Q{index + 1}.</span>
                      {item.q}
                    </span>
                    <span className={`w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 transform transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-blue-600 bg-blue-50 border-blue-200 font-extrabold' : ''}`}>
                      ▼
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-6 pb-5 pt-0 text-xs sm:text-xs text-slate-600 leading-relaxed font-sans font-medium border-t border-slate-150 pt-4 bg-white animate-fade-in whitespace-pre-line text-left">
                      {item.ans}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Empty Search Fallback */}
            {[
              {
                q: "ডিজিটাল লাইব্রেরি ব্যবহারের নিয়ম কী?",
                ans: "লাইব্রেরি ব্যবহার করতে হলে প্রতিটি শিক্ষার্থীকে অবশ্যই..."
              }
            ].filter(item => {
              if (!faqSearchQuery) return true;
              return item.q.toLowerCase().includes(faqSearchQuery.toLowerCase()) || item.ans.toLowerCase().includes(faqSearchQuery.toLowerCase());
            }).length === 0 && (
              <div className="py-12 text-center text-slate-400 font-sans border border-dashed border-slate-200 rounded-2xl">
                <p className="text-xs font-bold text-slate-650">কোনো প্রশ্ন খুঁজে পাওয়া যায়নি!</p>
                <p className="text-[10px] text-slate-400 mt-1">অনুগ্রহ করে অন্য শব্দ টাইপ করে সার্চ করুন।</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. Enrollment Journey CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" id="cta-enroll-section">
        <div className="bg-gradient-to-tr from-[#1E40AF] to-slate-900 rounded-3xl p-8 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
          
          <div className="max-w-xl relative z-10">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2 font-sans">Ready to begin your academic session?</h2>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Sign in with your institute credentials today to secure active textbook holdings, create bookmarks, and pay small dues digitally.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 min-w-[200px] relative z-10 w-full sm:w-auto">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className="bg-white text-[#1E40AF] font-bold px-6 py-3 rounded-xl text-xs hover:bg-slate-50 transition-all duration-150 shadow-md transform hover:-translate-y-0.5"
              id="cta-enroll-btn"
            >
              Sign In to Member Portal
            </button>
            <button 
              onClick={() => handleCategoryClick('IT')}
              className="bg-white/10 hover:bg-white/15 text-white font-bold border border-white/20 px-6 py-3 rounded-xl text-xs transition-all duration-150"
              id="cta-learn-btn"
            >
              Explore IT Catalogue
            </button>
          </div>
        </div>
      </section>

      {/* ================= NOTICE DETAILED MODAL POPUP ================= */}
      <AnimatePresence>
        {selectedNotice && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedNotice(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto border border-slate-200/80 shadow-2xl relative p-6 sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedNotice(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Priority Labels */}
              <div className="flex flex-wrap gap-2 mb-4 select-none">
                {selectedNotice.pinned && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    <Pin className="w-3 h-3 text-amber-600" />
                    Pinned Announcement
                  </span>
                )}
                {selectedNotice.urgent && (
                  <span className="inline-flex items-center gap-1 bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
                    Urgent Notice
                  </span>
                )}
                <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Official Publication
                </span>
              </div>

              {/* Notice Title */}
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans leading-tight mb-3">
                {selectedNotice.title}
              </h1>

              {/* Publish Date metadata */}
              <div className="flex items-center gap-2.5 text-xs text-slate-400 mb-6 pb-4 border-b border-slate-100 select-none font-sans">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Published on:</span>
                <strong className="text-slate-600">{new Date(selectedNotice.publishDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                {selectedNotice.expiryDate && (
                  <>
                    <span className="text-slate-350">•</span>
                    <span>Expires:</span>
                    <strong className="text-red-500">{new Date(selectedNotice.expiryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</strong>
                  </>
                )}
              </div>

              {/* Main Content */}
              <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed space-y-4 mb-8 font-sans text-sm whitespace-pre-line">
                {selectedNotice.description}
              </div>

              {/* Attachments Section */}
              {selectedNotice.attachmentUrl && (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 font-sans">Attached Files / Documentation</h4>
                      <p className="text-[10px] text-slate-500 font-mono">Filetype: {selectedNotice.attachmentType || "PDF / Media Images"}</p>
                    </div>
                  </div>

                  <a 
                    href={selectedNotice.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs select-none"
                    download
                    id="download-notice-attachment"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Attachment</span>
                  </a>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= ALL NOTICES BROWSER OVERLAY ================= */}
      <AnimatePresence>
        {showAllNoticesModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-90 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowAllNoticesModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-4xl h-[85vh] overflow-hidden border border-slate-200/80 shadow-2xl relative flex flex-col font-sans"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between select-none">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 font-sans flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-[#1E40AF]" />
                    <span>Institute Notice Archive</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Explore active administrative instructions, guidelines, and shift schedules.</p>
                </div>

                <button 
                  onClick={() => setShowAllNoticesModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Inner List Container scrollable */}
              <div className="flex-grow overflow-y-auto p-6 sm:p-8 space-y-4 bg-slate-50/50">
                {notices.length === 0 ? (
                  <div className="text-center py-20 text-slate-400">
                    <Megaphone className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-semibold">No announcements logged in system database.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notices
                      .sort((a, b) => {
                        if (a.pinned && !b.pinned) return -1;
                        if (!a.pinned && b.pinned) return 1;
                        return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
                      })
                      .map((notice) => {
                        const isUrgent = notice.urgent;
                        const isPinned = notice.pinned;
                        return (
                          <div 
                            key={notice.id}
                            onClick={() => {
                              setSelectedNotice(notice);
                            }}
                            className={`p-5 rounded-2xl bg-white border ${
                              isUrgent ? 'border-red-200 bg-red-50/10 hover:border-red-400' : 'border-slate-200/60 hover:border-blue-500'
                            } hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-start justify-between gap-4`}
                          >
                            <div className="space-y-1.5 flex-grow">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 select-none font-bold">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {new Date(notice.publishDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>

                                <div className="flex gap-1">
                                  {isPinned && (
                                    <span className="bg-amber-50 border border-amber-200 text-amber-700 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                      <Pin className="w-2.5 h-2.5" /> Pinned
                                    </span>
                                  )}
                                  {isUrgent && (
                                    <span className="bg-red-50 border border-red-200 text-red-700 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse font-bold">
                                      Urgent
                                    </span>
                                  )}
                                </div>
                              </div>

                              <h3 className="text-sm font-bold text-slate-900 font-sans hover:text-[#1E40AF]">
                                {notice.title}
                              </h3>
                              <p className="text-xs text-slate-500 line-clamp-2 max-w-3xl leading-relaxed">
                                {notice.description}
                              </p>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedNotice(notice);
                              }}
                              className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 hover:text-[#1E40AF] text-[#1E40AF] text-xs font-bold rounded-xl transition-all cursor-pointer self-start sm:self-center uppercase tracking-wide shrink-0 font-sans"
                            >
                              Open Details
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
