import React, { useState, useEffect } from 'react';
import { 
  Search, Compass, BookOpen, Scale, Palette, Cpu, Heart, 
  ChevronRight, Star, Languages, Phone, MapPin, Users, 
  Clock, Image as ImageIcon, Atom, Scroll, Gavel, Stethoscope,
  Mail, MessageSquare, ExternalLink, Sparkles, AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { Book, Librarian, GalleryItem, LibraryStatus } from '../types.js';

interface HomeViewProps {
  books: Book[];
  librarians?: Librarian[];
  galleryItems?: GalleryItem[];
  setCurrentView: (view: string) => void;
  setSelectedBookId: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string) => void;
}

export default function HomeView({ 
  books, 
  librarians = [], 
  galleryItems = [], 
  setCurrentView, 
  setSelectedBookId, 
  setSearchQuery, 
  setCategoryFilter 
}: HomeViewProps) {
  const [localSearch, setLocalSearch] = useState('');
  const [statusData, setStatusData] = useState<LibraryStatus | null>(null);

  useEffect(() => {
    fetch('/api/library-status')
      .then(res => res.json())
      .then(data => setStatusData(data))
      .catch(err => console.error("Could not fetch library status", err));
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch.trim()) {
      setSearchQuery(localSearch.trim());
      setCurrentView('catalog');
    }
  };

  const bookOfMonth = books.find(b => b.title.includes("The Architecture of Information")) || books[1];

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
      
      {/* 1. Hero Search Banner - Bounded Container with Modern Glass Backdrop */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8" id="hero-banner-container">
        <div 
          className="relative h-[440px] rounded-3xl overflow-hidden bg-cover bg-center flex items-center shadow-xl border border-slate-200/50"
          style={{ 
            backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.5)), url('https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1600&auto=format&fit=crop&q=80')` 
          }}
          id="hero-banner"
        >
          {/* Subtle absolute tech grid background pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
          
          <div className="relative max-w-4xl mx-auto px-6 sm:px-12 text-center text-white z-10 w-full">
            <div className="inline-flex items-center space-x-2 bg-blue-500/20 backdrop-blur-md rounded-full px-4 py-1.5 border border-white/10 mb-5">
              <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100">ScholarLib Unified ERP Terminal</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 font-sans text-white leading-tight">
              Find Your Next <span className="text-blue-400">Academic Pursuit</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl mx-auto mb-8 leading-relaxed">
              Instantly access over 50,000 peer-reviewed digital textbooks, specialized technology curriculums, and research papers curated by academic deans.
            </p>

            {/* Premium 56px Search Bar Container */}
            <form onSubmit={handleHeroSearch} className="relative max-w-2xl mx-auto flex bg-white/95 p-1.5 shadow-lg rounded-[18px] border border-slate-200/20" id="hero-search-form">
              <div className="relative flex-grow flex items-center">
                <Search className="absolute left-4 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search textbook title, engineering department, or code..." 
                  value={localSearch}
                  onChange={e => setLocalSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-transparent text-slate-900 border-none outline-none font-sans text-xs placeholder-slate-400 focus:ring-0 focus:outline-none"
                  id="hero-search-input"
                />
              </div>
              <button 
                type="submit"
                className="bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] hover:brightness-[106%] text-white px-7 py-2.5 rounded-[12px] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md select-none"
                id="hero-search-btn"
              >
                Search Catalog
              </button>
            </form>
          </div>
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

      {/* 3. New Arrivals Shelf Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14" id="new-arrivals-section">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 border-l-4 border-[#1E40AF] pl-3 h-max">New Arrivals Shelf</h2>
            <p className="text-xs text-slate-550 mt-1">Acquired textbooks and resources for the current academic session.</p>
          </div>
          <span className="text-xs font-mono font-bold text-[#3B82F6] uppercase bg-blue-50 border border-blue-100 px-3 py-1 rounded-md">CPI-2026 Session</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {newArrivals.map((book, idx) => (
            <div 
              key={book.id}
              onClick={() => viewBookDetails(book.id)}
              className="card-premium p-4 flex flex-col justify-between group cursor-pointer"
              id={`arrival-${book.id}`}
            >
              <div>
                {/* Book cover container with realistic aspect ratio (approx 2:3) */}
                <div className="relative w-full h-[220px] bg-slate-50/80 rounded-xl p-2.5 overflow-hidden border border-slate-105/85 flex items-center justify-center mb-3">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-slate-200 to-transparent z-10"></div>
                  <img 
                    src={book.imageUrl} 
                    alt={book.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain filter drop-shadow-sm group-hover:scale-104 transition-transform duration-300"
                  />
                  {idx === 0 && (
                    <span className="absolute top-2 left-2 bg-[#F59E0B] text-white font-sans font-bold text-[8px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs leading-none">
                      New
                    </span>
                  )}
                </div>

                <span className="text-[8.5px] bg-slate-100 text-slate-650 px-2 py-0.5 rounded-md font-bold uppercase tracking-tight block w-max mb-1.5">
                  {book.category}
                </span>

                <h4 className="font-sans font-bold text-xs text-slate-800 line-clamp-1 truncate group-hover:text-[#1E40AF] transition-colors leading-snug">
                  {book.title}
                </h4>
                <p className="text-[10px] text-slate-450 mt-0.5 truncate font-medium">By {book.author}</p>
              </div>

              {/* Added Availability indicators and Star review matrix for high-fidelity */}
              <div className="pt-3 border-t border-slate-100 mt-3.5 flex items-center justify-between">
                <div className="flex items-center gap-0.5 text-amber-400">
                  <Star className="w-3 h-3 fill-current" />
                  <span className="text-[9px] font-bold text-slate-600">4.8</span>
                </div>
                {book.copiesCount > 0 ? (
                  <span className="text-[8.5px] font-extrabold text-[#1E40AF] bg-blue-50 px-2 py-0.5 rounded-md uppercase">
                    {book.copiesCount} Available
                  </span>
                ) : (
                  <span className="text-[8.5px] font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md uppercase">
                    Loaned Out
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {newArrivals.length === 0 && (
            <div className="col-span-5 text-center text-xs text-slate-405 py-12 bg-white card-premium">
              Populating new textbook registers...
            </div>
          )}
        </div>
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
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-[#1E40AF] px-3.5 py-1.5 font-sans font-bold text-[9px] uppercase tracking-wider mb-3.5 border border-blue-100 rounded-md">
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
            <div className="text-center py-12 bg-white card-premium p-8 select-none text-slate-405">
              <ImageIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-bold font-sans">No gallery pictures currently cataloged.</p>
              <p className="text-[10px] text-slate-400 mt-1">Superintendent admins can add pictures from the Admin Dashboard.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 select-none" id="gallery-grid">
              {galleryItems.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-[#1E40AF] transition-all duration-300 group shadow-xs hover:shadow-md flex flex-col"
                  id={`gallery-item-${item.id}`}
                >
                  <div className="h-52 overflow-hidden relative bg-slate-100 flex items-center justify-center">
                    <img 
                      src={item.imageUrl} 
                      alt={item.caption}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                  <div className="p-4 flex-grow flex items-start gap-2.5 bg-white">
                    <span className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full mt-2 shrink-0"></span>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed font-sans">
                      {item.caption}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

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

      {/* 5. Enrollment Journey CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" id="cta-enroll-section">
        <div className="bg-gradient-to-tr from-[#1E40AF] to-slate-900 rounded-3xl p-8 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
          
          <div className="max-w-xl relative z-10">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2 font-sans">Ready to begin your academic session?</h2>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Sign in with your university credentials today to secure active textbook holdings, create bookmarks, and pay small dues digitally.
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

    </div>
  );
}
