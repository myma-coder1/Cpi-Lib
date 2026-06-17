import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, Grid, List, AlertCircle, Plus, BookOpen, ExternalLink, 
  RefreshCw, ChevronRight, Bookmark, Star, Clock, Info, X, 
  ZoomIn, ArrowUpRight, RotateCcw, Heart, Sparkles, Check, CheckCircle2 
} from 'lucide-react';
import { Book } from '../types.js';

interface CatalogViewProps {
  books: Book[];
  currentCategoryFilter: string;
  setCategoryFilter: (category: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setSelectedBookId: (id: string) => void;
  setCurrentView: (view: string) => void;
  user?: any;
  onUpdateUser?: (updated: any) => void;
}

export default function CatalogView({
  books: initialLocalBooks,
  currentCategoryFilter,
  setCategoryFilter,
  searchQuery,
  setSearchQuery,
  setSelectedBookId,
  setCurrentView,
  user,
  onUpdateUser
}: CatalogViewProps) {
  // --- CORE STATES ---
  const [localSearchText, setLocalSearchText] = useState(searchQuery || '');
  const [selectedSubCats, setSelectedSubCats] = useState<string[]>([]);
  const [availabilityState, setAvailabilityState] = useState<string>('All');
  const [languageFilter, setLanguageFilter] = useState<string>('All');
  const [selectedPublisher, setSelectedPublisher] = useState<string>('All');
  const [pubYearFilter, setPubYearFilter] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<string>('featured'); // featured, newly-added, popular, borrowed, rating
  const [authorQuery, setAuthorQuery] = useState<string>('');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTarget, setSearchTarget] = useState<'local' | 'openlibrary'>('local');

  // --- INTERACTIVE & STORED STATES ---
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [activeSuggestions, setActiveSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [quickViewBook, setQuickViewBook] = useState<Book | null>(null);
  const [previewCoverUrl, setPreviewCoverUrl] = useState<string | null>(null);

  // --- OPEN LIBRARY API STATE ---
  const [openLibraryResults, setOpenLibraryResults] = useState<any[]>([]);
  const [apiLoading, setApiLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>('');

  const suggestionRef = useRef<HTMLDivElement>(null);

  // Load wishlist & search history from localStorage or user profile
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('scholarlib_recent_searches');
      if (storedHistory) {
        setRecentSearches(JSON.parse(storedHistory));
      }
      
      if (user && Array.isArray(user.wishlist)) {
        setWishlist(user.wishlist);
        localStorage.setItem('scholarlib_wishlist', JSON.stringify(user.wishlist));
      } else {
        const storedWishlist = localStorage.getItem('scholarlib_wishlist');
        if (storedWishlist) {
          setWishlist(JSON.parse(storedWishlist));
        }
      }
    } catch (e) {
      console.error("Failed to load local storage lists", e);
    }
  }, [user]);

  // Sync outside searchQuery with local input
  useEffect(() => {
    setLocalSearchText(searchQuery);
  }, [searchQuery]);

  // Handle click outside suggestions to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Generate unique publishers list from books for filter
  const publishersList = useMemo(() => {
    const list = new Set<string>();
    initialLocalBooks.forEach(b => {
      if (b.publisher) list.add(b.publisher);
    });
    return Array.from(list).sort();
  }, [initialLocalBooks]);

  // Create mock ratings mapped to isbn for aesthetic UI
  const getSimulatedRating = (isbn: string) => {
    if (!isbn) return 4.5;
    const sum = isbn.split('').reduce((acc, char) => acc + (parseInt(char) || 0), 0);
    return 3.5 + (sum % 16) * 0.1; // Out of 5.0
  };

  // Typo tolerance matching & highlight generator
  const typoTolerantMatch = (text: string, query: string): boolean => {
    const t = text.toLowerCase();
    const q = query.toLowerCase();
    if (t.includes(q)) return true;
    
    // Simple edit distance tolerance for queries length > 4 with 1 typo
    if (q.length > 4) {
      let mismatches = 0;
      let qIdx = 0;
      for (let i = 0; i < t.length && qIdx < q.length; i++) {
        if (t[i] === q[qIdx]) {
          qIdx++;
        } else {
          mismatches++;
          if (mismatches > 1) return false;
        }
      }
      return qIdx === q.length;
    }
    return false;
  };

  // Search autocomplete dynamic list generator
  useEffect(() => {
    if (localSearchText.trim().length > 1) {
      const q = localSearchText.toLowerCase();
      const suggestions = initialLocalBooks
        .filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
        .map(b => b.title)
        .slice(0, 5);
      setActiveSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setActiveSuggestions([]);
      setShowSuggestions(false);
    }
  }, [localSearchText, initialLocalBooks]);

  // Local Filtered and Sorted list
  const localFiltered = useMemo(() => {
    let result = [...initialLocalBooks];

    // 1. Text Search Input (Instant & Typo Tolerant across Title, Author, ISBN, description)
    if (localSearchText.trim()) {
      const q = localSearchText.toLowerCase();
      result = result.filter(b => 
        typoTolerantMatch(b.title, q) || 
        typoTolerantMatch(b.author, q) || 
        b.isbn.includes(q) ||
        (b.description && b.description.toLowerCase().includes(q))
      );
    }

    // 2. Category Sidebar Checkboxes Group
    if (selectedSubCats.length > 0) {
      result = result.filter(b => {
        const catLower = b.category.toLowerCase();
        return selectedSubCats.some(sub => {
          if (sub === 'Engineering') {
            return ['computer science', 'programming', 'networking', 'cyber security', 'artificial intelligence', 'machine learning', 'data science', 'engineering'].includes(catLower);
          }
          if (sub === 'Humanities') {
            return ['english', 'literature', 'history', 'biography', 'novels', 'humanities'].includes(catLower);
          }
          if (sub === 'All Science') {
            return ['physics', 'chemistry', 'mathematics', 'science'].includes(catLower);
          }
          if (sub === 'Bangla') {
            return catLower === 'bangla' || catLower.includes('bangla');
          }
          return false;
        });
      });
    } else if (currentCategoryFilter && currentCategoryFilter !== 'All') {
      // Handles click routing from Home component categories grid
      result = result.filter(b => 
        b.category.toLowerCase() === currentCategoryFilter.toLowerCase() || 
        (currentCategoryFilter === 'STEM' && ['physics', 'chemistry', 'mathematics', 'computer science'].includes(b.category.toLowerCase())) ||
        (currentCategoryFilter === 'IT' && ['computer science', 'programming', 'networking', 'cyber security', 'artificial intelligence', 'machine learning', 'data science'].includes(b.category.toLowerCase()))
      );
    }

    // 3. Availability State (All, Available, Borrowed, E-Book)
    if (availabilityState === 'Available Now') {
      result = result.filter(b => b.format === 'E-Book' || b.availableCopies > 0);
    } else if (availabilityState === 'Borrowed') {
      result = result.filter(b => b.availableCopies === 0 && b.format !== 'E-Book');
    } else if (availabilityState === 'E-Book') {
      result = result.filter(b => b.format === 'E-Book');
    }

    // 4. Year Group publication filter
    if (pubYearFilter !== 'All') {
      result = result.filter(b => {
        if (!b.publishDate) return false;
        const year = parseInt(b.publishDate.substring(0, 4));
        if (isNaN(year)) return false;
        
        if (pubYearFilter === 'Newer (25+)') return year >= 2025;
        if (pubYearFilter === '2020-2024') return year >= 2020 && year < 2025;
        if (pubYearFilter === '2010-2019') return year >= 2010 && year < 2020;
        if (pubYearFilter === 'Older') return year < 2010;
        return true;
      });
    }

    // 5. Publisher filter
    if (selectedPublisher !== 'All') {
      result = result.filter(b => b.publisher === selectedPublisher);
    }

    // 6. Language matches
    if (languageFilter !== 'All') {
      result = result.filter(b => {
        // Aesthetic mock matching or real property if exists
        const bLang = b.language || 'English';
        return bLang.toLowerCase() === languageFilter.toLowerCase();
      });
    }

    // 7. Sidebar dynamic Author Query Text Filter
    if (authorQuery.trim()) {
      const aq = authorQuery.toLowerCase();
      result = result.filter(b => b.author.toLowerCase().includes(aq));
    }

    // --- SORTING ---
    if (sortOrder === 'newly-added') {
      result.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
    } else if (sortOrder === 'popular') {
      result.sort((a, b) => b.copiesCount - a.copiesCount);
    } else if (sortOrder === 'borrowed') {
      // Sort E-Books and heavily copied books first
      result.sort((a, b) => (b.format === 'E-Book' ? 10 : 0) - (a.format === 'E-Book' ? 10 : 0));
    } else if (sortOrder === 'rating') {
      result.sort((a, b) => getSimulatedRating(b.isbn) - getSimulatedRating(a.isbn));
    }

    return result;
  }, [initialLocalBooks, localSearchText, selectedSubCats, currentCategoryFilter, availabilityState, pubYearFilter, selectedPublisher, languageFilter, authorQuery, sortOrder]);

  const totalCount = localFiltered.length;

  // Search History handler
  const saveSearchToHistory = (queryStr: string) => {
    if (!queryStr.trim()) return;
    const cleanQStr = queryStr.trim();
    let updated = [cleanQStr, ...recentSearches.filter(q => q !== cleanQStr)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('scholarlib_recent_searches', JSON.stringify(updated));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSearchToHistory(localSearchText);
    setShowSuggestions(false);
    // If local results are empty, automatically trigger fallback to Open Library API
    if (localFiltered.length === 0) {
      setSearchTarget('openlibrary');
      triggerOpenLibraryQuery();
    }
  };

  const clearHistory = () => {
    setRecentSearches([]);
    localStorage.removeItem('scholarlib_recent_searches');
  };

  // Open Library API integrated dynamic query
  const triggerOpenLibraryQuery = async () => {
    if (!localSearchText.trim()) {
      setApiError('type a search keyword first for API live connection!');
      return;
    }
    setApiLoading(true);
    setApiError('');
    try {
      const res = await fetch(`/api/openlibrary/search?q=${encodeURIComponent(localSearchText)}`);
      if (!res.ok) throw new Error('Open Library API offline or server error');
      const data = await res.json();
      setOpenLibraryResults(data);
    } catch (e: any) {
      setApiError('Could not sync with Open Library: ' + e.message);
    } finally {
      setApiLoading(false);
    }
  };

  // Watch for local results of search. If user typed and local returns the exact same count = 0,
  // notify and prompt live API
  const localSearchFailed = localSearchText.trim().length > 0 && localFiltered.length === 0 && searchTarget === 'local';

  // Import Open Library book into local database collection
  const importOpenLibraryBook = async (olBook: any) => {
    try {
      const res = await fetch('/api/books/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book: olBook })
      });
      if (res.ok) {
        alert(`Successfully imported "${olBook.title}" into physical catalog repository!`);
        // Refresh by transition back to local and search the imported book title
        setSearchTarget('local');
        setSearchQuery(olBook.title);
        setLocalSearchText(olBook.title);
      } else {
        const err = await res.json();
        alert(err.error || 'Librarian configuration error during API importing');
      }
    } catch (e) {
      alert('Importers registered network sync conflicts.');
    }
  };

  const selectCategoryCheckbox = (catName: string) => {
    setCategoryFilter('All');
    if (selectedSubCats.includes(catName)) {
      setSelectedSubCats(prev => prev.filter(c => c !== catName));
    } else {
      setSelectedSubCats(prev => [...prev, catName]);
    }
  };

  // Toggle wishlist Bookmark
  const toggleWishlist = async (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated: string[];
    if (wishlist.includes(bookId)) {
      updated = wishlist.filter(id => id !== bookId);
    } else {
      updated = [...wishlist, bookId];
    }
    setWishlist(updated);
    localStorage.setItem('scholarlib_wishlist', JSON.stringify(updated));

    if (user && user.rollNumber && onUpdateUser) {
      try {
        const res = await fetch(`/api/students/${user.rollNumber}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wishlist: updated })
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.student) {
            onUpdateUser(resData.student);
          }
        }
      } catch (err) {
        console.error("Failed to sync wishlist with database", err);
      }
    }
  };

  // Reset all filters easily
  const resetAllFilters = () => {
    setLocalSearchText('');
    setSearchQuery('');
    setCategoryFilter('All');
    setSelectedSubCats([]);
    setAvailabilityState('All');
    setLanguageFilter('All');
    setSelectedPublisher('All');
    setPubYearFilter('All');
    setSortOrder('featured');
    setAuthorQuery('');
    setSearchTarget('local');
    setOpenLibraryResults([]);
    setCurrentPage(1);
  };

  const itemsPerPage = 8;
  const currentBooksSlice = useMemo(() => {
    const list = searchTarget === 'local' ? localFiltered : openLibraryResults;
    const start = (currentPage - 1) * itemsPerPage;
    return list.slice(start, start + itemsPerPage);
  }, [searchTarget, localFiltered, openLibraryResults, currentPage]);

  const totalPages = Math.ceil((searchTarget === 'local' ? localFiltered.length : openLibraryResults.length) / itemsPerPage);

  const viewBookDetails = (bookId: string) => {
    setSelectedBookId(bookId);
    setCurrentView('book-detail');
  };

  const handleRequestPurchase = () => {
    const title = prompt("Enter Book Title you wish the university to purchase:");
    if (title) {
      alert(`Success! Purchase request submitted for: "${title}". Librarians will review your request.`);
    }
  };

  // Utility to highlight search keywords beautifully in names/authors
  const highlightWord = (phrase: string, query: string) => {
    if (!query.trim() || !phrase) return <span>{phrase}</span>;
    const index = phrase.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return <span>{phrase}</span>;
    
    const start = phrase.substring(0, index);
    const middle = phrase.substring(index, index + query.length);
    const end = phrase.substring(index + query.length);
    
    return (
      <span>
        {start}
        <mark className="bg-amber-100 text-slate-900 border-b-2 border-amber-400 rounded-sm font-bold px-0.5">{middle}</mark>
        {end}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans flex flex-col lg:flex-row gap-8 select-none" id="catalog-main-app">
      
      {/* FILTER DRAWER SIDEBAR */}
      <aside className="w-full lg:w-72 flex-shrink-0" id="catalog-sidebar-panel">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs sticky top-24 space-y-6 text-left">
          
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-sans font-bold text-slate-900 text-xs uppercase tracking-wider">Refine Catalog</h3>
              <p className="text-[10px] text-slate-400 mt-1">Multi-criteria filtering</p>
            </div>
            <button 
              onClick={resetAllFilters} 
              className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-bold uppercase tracking-wider cursor-pointer bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
              title="Reset Filters"
            >
              <RotateCcw className="w-3.0 h-3.0" /> Reset
            </button>
          </div>

          {/* Quick Stats Widget */}
          <div className="bg-gradient-to-tr from-slate-900 to-slate-850 text-white rounded-lg p-3 w-full border border-slate-800 relative overflow-hidden">
            <span className="text-[9px] uppercase font-bold tracking-widest text-[#00E5FF] block">Local Index Status</span>
            <span className="text-xl font-bold font-mono block mt-1 tracking-tight">{localFiltered.length} <span className="text-xs font-normal font-sans text-slate-350">Matched</span></span>
            <span className="text-[9.5px] text-slate-400 italic mt-1 block">Wishlist active items: {wishlist.length}</span>
            <div className="absolute right-2 bottom-2 text-slate-750 opacity-20"><BookOpen className="w-16 h-16" /></div>
          </div>

          {/* Sorting Option */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Sort Output By</h4>
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700 bg-slate-50 font-semibold"
            >
              <option value="featured">Featured Index</option>
              <option value="newly-added">Recently Added (Newest First)</option>
              <option value="popular">Most Popular (Highest Copies)</option>
              <option value="borrowed">Most Borrowed Volumes</option>
              <option value="rating">User Star Ratings</option>
            </select>
          </div>

          {/* Categories Sub-Department Checklist */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Academic Department</h4>
            <div className="space-y-2">
              {[
                { label: 'Engineering', desc: 'Computer Science & ICT' },
                { label: 'All Science', desc: 'Physics, Chemistry, Math' },
                { label: 'Humanities', desc: 'English, Literature, Biography' },
                { label: 'Bangla', desc: 'Bangladeshi Literary & Novels' }
              ].map(subcat => {
                const checked = selectedSubCats.includes(subcat.label);
                return (
                  <label key={subcat.label} className="flex items-start space-x-2.5 text-xs text-slate-650 cursor-pointer hover:text-black">
                    <input 
                      type="checkbox" 
                      checked={checked}
                      onChange={() => selectCategoryCheckbox(subcat.label)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300 mt-0.5"
                    />
                    <div className="leading-tight">
                      <span className="font-semibold block">{subcat.label}</span>
                      <span className="text-[9.5px] text-slate-400">{subcat.desc}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Format & Availability Radio */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Availability & Format</h4>
            <div className="grid grid-cols-2 gap-1.5">
              {['All', 'Available Now', 'Borrowed', 'E-Book'].map((status) => (
                <button
                  key={status}
                  onClick={() => setAvailabilityState(status)}
                  className={`py-1.5 px-2.5 rounded-lg border text-left text-[10.5px] font-semibold transition-all cursor-pointer ${
                    availabilityState === status 
                      ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs' 
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-650 border-slate-200'
                  }`}
                >
                  {status === 'All' ? 'Infinite (All)' : status}
                </button>
              ))}
            </div>
          </div>

          {/* Author Name input search */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Primary Author</h4>
            <input 
              type="text"
              placeholder="Search by writer name..."
              value={authorQuery}
              onChange={e => setAuthorQuery(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-750 bg-slate-50 placeholder-slate-400"
            />
          </div>

          {/* Dynamic dynamic Publishers list */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Publisher Agency</h4>
            <select
              value={selectedPublisher}
              onChange={e => setSelectedPublisher(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Publishers ({publishersList.length})</option>
              {publishersList.map(pub => (
                <option key={pub} value={pub}>{pub}</option>
              ))}
            </select>
          </div>

          {/* Language filter */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Publication Language</h4>
            <select
              value={languageFilter}
              onChange={e => setLanguageFilter(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-705 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Languages (বাংলা & English)</option>
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="German">German</option>
              <option value="French">French</option>
            </select>
          </div>

          {/* Publication Year category */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Publication Era</h4>
            <select
              value={pubYearFilter}
              onChange={e => setPubYearFilter(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-705 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Years</option>
              <option value="Newer (25+)">New Releases (2025 - Present)</option>
              <option value="2020-2024">Digital Era (2020 - 2024)</option>
              <option value="2010-2019">System Era (2010 - 2019)</option>
              <option value="Older">Vintage / Heritage (&lt; 2010)</option>
            </select>
          </div>

          {/* Quick actions bottom */}
          <div className="pt-2">
            <button 
              onClick={handleRequestPurchase}
              className="w-full bg-slate-900 border border-slate-950 text-white py-3 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Request Purchase
            </button>
          </div>

        </div>
      </aside>

      {/* MAIN MAIN BOOK GRID VIEW */}
      <main className="flex-grow space-y-6">
        
        {/* TOP BAR SEARCH WITH AUTO SUGGEST & HISTORY */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative space-y-4">
          
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-grow w-full" ref={suggestionRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search local catalog by Title, Author, ISBN, or keywords..." 
                value={localSearchText}
                onChange={e => setLocalSearchText(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg font-sans text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder-slate-400 text-slate-800 font-semibold"
                id="search-input"
              />

              {/* AUTO SUGGESTIONS DROP PANEL */}
              {showSuggestions && activeSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-lg z-30 overflow-hidden divide-y divide-slate-50 text-left">
                  {activeSuggestions.map((sug, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setLocalSearchText(sug);
                        saveSearchToHistory(sug);
                        setShowSuggestions(false);
                      }}
                      className="px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer font-medium flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <span className="truncate">{sug}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Source Segment Selection */}
            <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-lg w-full sm:w-auto text-[10px] font-bold uppercase tracking-wider select-none">
              <button 
                type="button"
                onClick={() => {
                  setSearchTarget('local');
                  setApiError('');
                }}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-md transition-all cursor-pointer ${searchTarget === 'local' ? 'bg-white text-slate-850 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Local Index
              </button>
              <button 
                type="button"
                onClick={() => {
                  setSearchTarget('openlibrary');
                  triggerOpenLibraryQuery();
                }}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${searchTarget === 'openlibrary' ? 'bg-white text-slate-850 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <RefreshCw className={`w-3 h-3 ${apiLoading ? 'animate-spin' : ''}`} /> Open Library API Live
              </button>
            </div>
          </form>

          {/* RECENT SEARCHES TABS */}
          {recentSearches.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 select-none text-[10.5px]">
              <span className="text-slate-400 font-bold uppercase text-[9.5px]">Recent Searches:</span>
              {recentSearches.map((q, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setLocalSearchText(q);
                    saveSearchToHistory(q);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-650 px-2.5 py-1.5 rounded-full border border-slate-150 transition-all font-medium cursor-pointer"
                >
                  {q}
                </button>
              ))}
              <button 
                onClick={clearHistory}
                className="text-[9.5px] font-bold text-red-500 hover:underline uppercase cursor-pointer"
              >
                clear
              </button>
            </div>
          )}

        </div>

        {/* FEEDBACK ALERTS */}
        {localSearchFailed && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3.5 text-left animate-fade-in shadow-xs">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-slate-750 space-y-1.5 flex-grow">
              <p className="font-bold text-amber-800">Local database search yielded 0 results for "{localSearchText}"</p>
              <p className="text-[11px] text-slate-500">ScholarLib is automatically falling back to Open Library's international API server so you can search and import this textbook.</p>
              <button 
                onClick={() => {
                  setSearchTarget('openlibrary');
                  triggerOpenLibraryQuery();
                }}
                className="bg-amber-600 hover:bg-amber-705 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
              >
                Trigger Live API Search
              </button>
            </div>
          </div>
        )}

        {searchTarget === 'openlibrary' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3.5 text-left text-xs text-blue-900 shadow-xs">
            <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <strong>Live Open Library API Sync Mode Active:</strong> Clicking <strong>Import to Catalog</strong> will automatically fetch structural metadata, format parameters, and cover images from standard databases to store inside the local Firestore collection.
            </div>
          </div>
        )}

        {apiLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400 bg-white border border-slate-200 rounded-xl shadow-xs animate-fade-in">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-550">Syncing with Open Library servers...</span>
          </div>
        )}

        {apiError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2 shadow-xs text-left animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        {/* LISTING HEADER */}
        {!apiLoading && (
          <div className="flex justify-between items-center bg-white border border-slate-200 px-5 py-3.5 rounded-xl shadow-xs select-none">
            <div className="text-left">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Active Inventory</span>
              <h2 className="text-sm font-extrabold text-slate-850 mt-0.5 uppercase tracking-wide">
                {searchTarget === 'local' ? `Showing ${totalCount} books matches` : `API Match Result count: ${openLibraryResults.length}`}
              </h2>
            </div>

            {/* Layout switch buttons */}
            <div className="flex bg-slate-50 border border-slate-200 p-0.5 rounded-lg">
              <button 
                onClick={() => setLayoutMode('grid')}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${layoutMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
                title="Grid layout"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setLayoutMode('list')}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${layoutMode === 'list' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
                title="List layout"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* CORE CARDS WRAPPER GRID - PORTRAIT AND LANDSCAPE UNIFORM DESIGN (Contains object-fit: contain, hover zooms, fallback img, and bookmark states) */}
        {!apiLoading && (
          layoutMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6" id="books-grid">
              {currentBooksSlice.map(book => {
                const isAvailable = book.format === 'E-Book' || book.availableCopies > 0;
                const starRating = getSimulatedRating(book.isbn);
                const isWishlisted = wishlist.includes(book.id || book.isbn);
                
                return (
                  <div 
                    key={book.id || book.isbn} 
                    className="bg-white border border-slate-250/60 hover:border-slate-300 hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 rounded-2xl p-4.5 flex flex-col justify-between group overflow-hidden relative animate-fade-in text-left max-w-[320px] mx-auto w-full"
                    id={`book-card-${book.id || book.isbn}`}
                  >
                    <div>
                      {/* Premium Cover block with center contained layout */}
                      <div className="book-cover-wrapper relative overflow-hidden flex items-center justify-center select-none rounded-xl border border-slate-100 bg-[#f8fafc] mb-4.5">
                        <img 
                          src={book.imageUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800'} 
                          alt={book.title}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="book-cover transition-transform duration-500 ease-out group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800';
                          }}
                        />

                        {/* Hover elements */}
                        <div className="absolute inset-0 bg-transparent pointer-events-none group-hover:bg-black/[0.01] transition-colors" />

                        {/* Top corner hover zoom action */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewCoverUrl(book.imageUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800');
                          }}
                          className="absolute right-3 top-3 p-2 bg-white border border-slate-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer duration-200 hover:bg-slate-50 text-slate-600 shadow-sm"
                          title="Zoom Cover Image"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => toggleWishlist(book.id || book.isbn, e)}
                          className={`absolute left-3 top-3 p-2 border rounded-full class-wishlist-toggle transition-all cursor-pointer shadow-sm ${
                            isWishlisted 
                              ? 'bg-rose-50 text-rose-500 border-rose-105 opacity-100' 
                              : 'bg-white text-slate-400 hover:text-rose-500 border-slate-100 opacity-0 group-hover:opacity-100 focus:opacity-100 duration-200'
                          }`}
                          title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>
                      </div>

                      {/* Content Section */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-[#2563eb] tracking-wide uppercase inline-block mb-1">
                          {book.category}
                        </span>
                        
                        <h4 
                          onClick={() => {
                            if (searchTarget === 'local') {
                              viewBookDetails(book.id);
                            } else {
                              setQuickViewBook(book);
                            }
                          }}
                          className="font-sans font-semibold text-xs+ text-slate-800 hover:text-[#2563eb] mt-0.5 line-clamp-2 leading-snug cursor-pointer transition-colors"
                        >
                          {highlightWord(book.title, localSearchText)}
                        </h4>
                        
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                          {highlightWord(book.author, localSearchText)}
                        </p>

                        {/* Rating Display and Availability in single row */}
                        <div className="flex items-center justify-between pt-2.5 text-xs text-slate-600">
                          <div className="flex items-center gap-1 font-sans select-none text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-semibold text-slate-700 ml-0.5">{starRating.toFixed(1)}</span>
                          </div>
                          
                          <span className={`text-[10px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full ${
                            book.format === 'E-Book' 
                              ? 'bg-blue-50 text-[#2563eb]' 
                              : isAvailable 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : 'bg-rose-50 text-rose-700'
                          }`}>
                            {book.format === 'E-Book' ? 'E-Book' : (isAvailable ? 'Available' : 'Borrowed')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4.5 pt-3.5 border-t border-slate-100 select-none">
                      {searchTarget === 'local' ? (
                        <button 
                          onClick={() => viewBookDetails(book.id)}
                          className="w-full bg-[#2563eb] text-white hover:bg-[#2563eb]/95 active:scale-[0.98] py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1"
                          id={`details-btn-${book.id}`}
                        >
                          {book.format === 'E-Book' ? 'Read Digital Book' : 'Read & Borrow'}
                        </button>
                      ) : (
                        <button 
                          onClick={() => importOpenLibraryBook(book)}
                          className="w-full bg-[#2563eb] text-white hover:bg-[#2563eb]/95 active:scale-[0.98] py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1"
                          id={`import-btn-${book.isbn}`}
                        >
                          Import to Catalog
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // LIST VIEW GRAPHICS
            <div className="space-y-4 text-left animate-fade-in" id="books-list">
              {currentBooksSlice.map(book => {
                const isAvailable = book.format === 'E-Book' || book.availableCopies > 0;
                const starRating = getSimulatedRating(book.isbn);
                const isWishlisted = wishlist.includes(book.id || book.isbn);
                
                return (
                  <div 
                    key={book.id || book.isbn} 
                    className="bg-white border border-slate-200 p-4.5 rounded-lg hover:border-slate-350 transition-all shadow-xs flex flex-col sm:flex-row gap-5 group items-start sm:items-center relative"
                    id={`book-list-card-${book.id || book.isbn}`}
                  >
                    {/* Contained image thumbnails block */}
                    <div className="w-24 h-32 bg-slate-50 border border-slate-150 rounded-lg p-1.5 flex-shrink-0 flex items-center justify-center overflow-hidden relative shadow-xs">
                      <img 
                        src={book.imageUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800'} 
                        alt={book.title}
                        className="max-w-full max-h-full object-contain object-center rounded-sm group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800';
                        }}
                      />
                      <button 
                        onClick={() => setPreviewCoverUrl(book.imageUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800')}
                        className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer duration-200"
                        title="Zoom Image"
                      >
                        <ZoomIn className="w-5 h-5 text-white" />
                      </button>
                    </div>

                    {/* Book Metadata details */}
                    <div className="flex-grow space-y-1.5 min-w-0">
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-[9px] font-bold text-[#0252CD] bg-blue-50/70 border border-blue-100 rounded-md px-2 py-0.5 uppercase tracking-wider">{book.category}</span>
                        <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded-md uppercase leading-none border shadow-sm ${
                          book.format === 'E-Book' ? 'bg-blue-500 text-white border-blue-600' : (isAvailable ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-rose-500 text-white border-rose-600')
                        }`}>
                          {book.format === 'E-Book' ? 'E-Book 📖' : (isAvailable ? 'Available Now' : 'Borrowed Roster')}
                        </span>
                        <div className="flex items-center text-amber-500 ml-1.5 select-none font-bold text-[10.5px]">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 mr-1" />
                          <span className="text-slate-800">{starRating.toFixed(1)}</span>
                        </div>
                      </div>

                      <h4 
                        className="font-sans font-bold text-sm text-slate-850 group-hover:text-blue-600 hover:underline cursor-pointer leading-tight transition-colors" 
                        onClick={() => searchTarget === 'local' ? viewBookDetails(book.id) : setQuickViewBook(book)}
                      >
                        {highlightWord(book.title, localSearchText)}
                      </h4>

                      <p className="text-xs text-slate-500 font-medium">By {highlightWord(book.author, localSearchText)}</p>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono text-slate-400 select-none">
                        <span>ISBN: {book.isbn}</span>
                        <span>Available: {book.format === 'E-Book' ? '∞ Unlimited' : `${book.availableCopies} copy left`}</span>
                        {book.publisher && <span>Publisher: {book.publisher}</span>}
                      </div>
                    </div>

                    {/* Actions panel */}
                    <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0 select-none pt-2 sm:pt-0">
                      <button 
                        onClick={(e) => toggleWishlist(book.id || book.isbn, e)}
                        className={`px-3 py-2 border rounded-lg flex items-center justify-center gap-1 text-[10px] uppercase font-bold tracking-wider cursor-pointer transition-all ${
                          isWishlisted 
                            ? 'bg-rose-50 text-rose-500 border-rose-200' 
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-500' : ''}`} /> {isWishlisted ? 'Wishlisted' : 'Wishlist'}
                      </button>

                      <button 
                        onClick={() => setQuickViewBook(book)}
                        className="px-3.5 py-2 bg-slate-100 font-semibold border border-slate-205 text-slate-800 rounded-lg text-[10px] uppercase tracking-wide hover:bg-slate-200 transition-colors cursor-pointer flex-1 sm:flex-initial"
                      >
                        Quick View
                      </button>

                      {searchTarget === 'local' ? (
                        <button 
                          onClick={() => viewBookDetails(book.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] uppercase font-bold tracking-wider hover:bg-blue-700 transition-colors shadow-sm cursor-pointer text-center flex-1 sm:flex-initial"
                        >
                          Details →
                        </button>
                      ) : (
                        <button 
                          onClick={() => importOpenLibraryBook(book)}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] uppercase font-bold tracking-wider hover:bg-emerald-705 transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1 flex-1 sm:flex-initial"
                        >
                          <Plus className="w-3.5 h-3.5" /> Import
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Empty matching result segment */}
        {!apiLoading && currentBooksSlice.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-16 text-center text-slate-400 select-none shadow-sm animate-fade-in text-left">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-750 text-center">No catalog volumes match your active filter settings.</p>
            <p className="text-xs text-slate-500 mt-2 text-center">Try tapping <strong>Reset Filters</strong> above, or search for external matches using the <strong>Open Library API Live</strong> live tracker tab!</p>
            <div className="flex justify-center mt-4">
              <button 
                onClick={resetAllFilters}
                className="bg-blue-600 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg shadow-sm hover:bg-blue-750 transition-colors cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          </div>
        )}

        {/* PAGINATION PANEL FOOTER */}
        {!apiLoading && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 pt-6 mt-8 select-none" id="catalog-pagination">
            <span className="text-xs text-slate-500 mb-4 sm:mb-0 font-medium font-sans">
              Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({searchTarget === 'local' ? localFiltered.length : openLibraryResults.length} index matches)
            </span>
            <div className="flex items-center space-x-1.5 text-xs text-slate-600">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-sans font-bold text-[10px] uppercase tracking-wide transition-colors"
              >
                Prev
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => {
                const pNum = i + 1;
                // Only render reasonable range
                if (totalPages > 5 && Math.abs(currentPage - pNum) > 2 && pNum !== 1 && pNum !== totalPages) {
                  if (pNum === 2 || pNum === totalPages - 1) {
                    return <span key={pNum} className="px-1 text-slate-400">...</span>;
                  }
                  return null;
                }
                return (
                  <button 
                    key={pNum}
                    onClick={() => setCurrentPage(pNum)}
                    className={`px-3 py-2 rounded-lg border transition-colors cursor-pointer text-[10px] font-bold ${
                      currentPage === pNum 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}

              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-sans font-bold text-[10px] uppercase tracking-wide transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

      </main>

      {/* --- QUICK VIEW PANEL DIALOG MODAL --- */}
      {quickViewBook && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 overflow-hidden shadow-2xl animate-scale-up text-left flex flex-col md:flex-row">
            
            <div className="bg-[#f8f9fa] md:w-2/5 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100">
              <div className="relative h-[350px] w-full bg-[#f8f9fa] rounded-xl p-3 flex items-center justify-center border border-slate-200 shadow-xs">
                <img 
                  src={quickViewBook.imageUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800'} 
                  alt={quickViewBook.title}
                  className="w-full h-full object-contain object-center rounded-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800';
                  }}
                />
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-50 pb-1.5 text-[11px]">
                  <span className="text-slate-400 font-semibold uppercase">Category</span>
                  <span className="font-bold text-slate-800">{quickViewBook.category}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-1.5 text-[11px]">
                  <span className="text-slate-400 font-semibold uppercase">Copies Spec</span>
                  <span className="font-mono text-slate-800 font-bold">
                    {quickViewBook.format === 'E-Book' ? '∞' : `${quickViewBook.availableCopies} / ${quickViewBook.copiesCount}`}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400 font-semibold uppercase">Format</span>
                  <span className="font-bold text-[#0252CD]">{quickViewBook.format || 'Paperback'}</span>
                </div>
              </div>
            </div>

            <div className="md:w-3/5 p-6.5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block bg-blue-50 border border-blue-100 rounded px-2 py-0.5 inline-block">
                      {quickViewBook.category}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-2 tracking-tight leading-tight">
                      {quickViewBook.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-550 mt-1">Written by: {quickViewBook.author}</p>
                  </div>
                  <button 
                    onClick={() => setQuickViewBook(null)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-800 rounded-lg shrink-0 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Rating display */}
                <div className="flex items-center gap-1.5 text-amber-500 font-mono mt-3 text-xs">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 fill-amber-400 text-amber-400`} />
                    ))}
                  </div>
                  <span className="font-bold text-slate-705">{(getSimulatedRating(quickViewBook.isbn)).toFixed(1)} / 5.0 Rating</span>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description Abstract</h5>
                  <p className="text-slate-650 text-xs leading-relaxed line-clamp-5 whitespace-pre-wrap">
                    {quickViewBook.description || "No textbook volume summary registered in databases index yet. Open full details view to explore location logs."}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-2 select-none border-t border-slate-100 pt-4">
                <div className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase text-slate-450 tracking-wider">
                  <Clock className="w-4 h-4 text-slate-400" /> Shelf Location: <span className="text-slate-700 font-mono font-bold normal-case">&nbsp;{quickViewBook.location || 'Online Resource Unit'}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <button 
                    onClick={() => {
                      setQuickViewBook(null);
                      if (searchTarget === 'local') {
                        viewBookDetails(quickViewBook.id);
                      } else {
                        importOpenLibraryBook(quickViewBook);
                      }
                    }}
                    className="w-full bg-[#0252CD] hover:bg-blue-750 text-white font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-wide text-center cursor-pointer shadow-md"
                  >
                    {searchTarget === 'local' ? 'Open Book Detail' : 'Import Local'}
                  </button>
                  <button 
                    onClick={() => {
                      const isWish = wishlist.includes(quickViewBook.id || quickViewBook.isbn);
                      let updated = isWish 
                        ? wishlist.filter(id => id !== (quickViewBook.id || quickViewBook.isbn))
                        : [...wishlist, (quickViewBook.id || quickViewBook.isbn)];
                      setWishlist(updated);
                      localStorage.setItem('scholarlib_wishlist', JSON.stringify(updated));
                    }}
                    className={`w-full font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-wide border text-center cursor-pointer transition-colors ${
                      wishlist.includes(quickViewBook.id || quickViewBook.isbn)
                        ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {wishlist.includes(quickViewBook.id || quickViewBook.isbn) ? '✓ Saved' : '♥ Save later'}
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* --- IMAGE ZOOM LIGHTBOX COVER MODAL --- */}
      {previewCoverUrl && (
        <div 
          onClick={() => setPreviewCoverUrl(null)}
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 animate-fade-in select-none cursor-zoom-out"
        >
          <div className="relative max-w-lg w-full max-h-[85vh] flex items-center justify-center p-2 rounded-lg bg-white/5 border border-white/10 shadow-2xl">
            <img 
              src={previewCoverUrl} 
              alt="High Res Cover Lightbox Preview" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg animate-scale-up"
            />
            <button 
              onClick={() => setPreviewCoverUrl(null)}
              className="absolute -top-12 right-0 text-white bg-slate-900 border border-slate-850 p-2 rounded-full cursor-pointer hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
