import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, Bookmark, ArrowLeft, Loader, CheckCircle, Clock, BookOpen, 
  MapPin, AlertCircle, AlertTriangle, Ban, Star, Heart, FileText, Download, 
  User, Compass, ShoppingBag, ShieldCheck, Mail, MessageSquare 
} from 'lucide-react';
import { motion } from 'motion/react';
import { Book } from '../types.js';

interface BookDetailViewProps {
  bookId: string;
  books: Book[];
  setCurrentView: (view: string) => void;
  setSelectedBookId: (id: string) => void;
  user: any;
  requestBorrow: (bookId: string, durationDays: number) => Promise<string>;
  onUpdateUser?: (updated: any) => void;
}

export default function BookDetailView({
  bookId,
  books,
  setCurrentView,
  setSelectedBookId,
  user,
  requestBorrow,
  onUpdateUser
}: BookDetailViewProps) {
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [borrowDuration, setBorrowDuration] = useState<number>(14); // 7, 14, 30 days
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [borrowSuccess, setBorrowSuccess] = useState(false);
  const [activeLoansCount, setActiveLoansCount] = useState<number>(0);
  const [loadingActiveLoans, setLoadingActiveLoans] = useState<boolean>(false);
  
  // Review inputs
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [reviewInput, setReviewInput] = useState<string>('');
  const [submittedReviews, setSubmittedReviews] = useState<any[]>([]);

  // Load target book details
  const book = books.find(b => b.id === bookId);

  // Dynamic user live active counts checker
  useEffect(() => {
    if (!user) {
      setActiveLoansCount(0);
      return;
    }
    setLoadingActiveLoans(true);
    fetch(`/api/borrow-history/${user.rollNumber}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Calculate currently checked out or unreturned bookings (unreturned: state is not RETURNED)
          const active = data.filter((b: any) => b.status !== 'RETURNED').length;
          setActiveLoansCount(active);
        }
      })
      .catch(err => console.error("Error fetching online borrow stats", err))
      .finally(() => setLoadingActiveLoans(false));
  }, [user, bookId, showBorrowModal, borrowSuccess]);

  if (!book) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-slate-500 font-sans select-none">
        <p className="font-bold">Searching catalog shelves for book ID: {bookId}...</p>
        <button onClick={() => setCurrentView('catalog')} className="text-[#1E40AF] mt-4 hover:underline font-bold uppercase tracking-wide text-xs cursor-pointer">
          Return to Catalog
        </button>
      </div>
    );
  }

  const isAvailable = book.format === 'E-Book' || book.availableCopies > 0;

  // Find related books in the same category, excluding active selection
  const relatedBooks = books
    .filter(b => b.category === book.category && b.id !== book.id)
    .slice(0, 5);

  const similarBooksInFormat = books
    .filter(b => b.format === book.format && b.id !== book.id && b.category !== book.category)
    .slice(0, 4);

  // Ratings calculation matching isbn values
  const getSimulatedRating = (isbn: string) => {
    if (!isbn) return 4.5;
    const sum = isbn.split('').reduce((acc, char) => acc + (parseInt(char) || 0), 0);
    return 3.5 + (sum % 16) * 0.1;
  };

  const starRating = getSimulatedRating(book.isbn);

  const handleBorrowRequest = async () => {
    if (!user) {
      alert("Please login with your Student Roll Number to borrow books.");
      setCurrentView('dashboard');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await requestBorrow(book.id, borrowDuration);
      setBorrowSuccess(true);
    } catch (e: any) {
      alert(e.message || "Failed to process borrow request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveForLater = async () => {
    try {
      const storedWishlist = localStorage.getItem('scholarlib_wishlist');
      let wishlist = storedWishlist ? JSON.parse(storedWishlist) : [];
      if (!wishlist.includes(book.id)) {
        wishlist.push(book.id);
        localStorage.setItem('scholarlib_wishlist', JSON.stringify(wishlist));
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);

      if (user && user.rollNumber && onUpdateUser) {
        try {
          const res = await fetch(`/api/students/${user.rollNumber}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wishlist })
          });
          if (res.ok) {
            const resData = await res.json();
            if (resData.student) {
              onUpdateUser(resData.student);
            }
          }
        } catch (err) {
          console.error("Failed to sync book bookmark with database", err);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const navigateRelated = (id: string) => {
    setSelectedBookId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Review submission
  const submitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewInput.trim()) return;
    const newRev = {
      user: user ? user.name : "Anonymous Student",
      roll: user ? user.rollNumber : "V-Index",
      comment: reviewInput,
      stars: ratingInput,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    setSubmittedReviews([newRev, ...submittedReviews]);
    setReviewInput('');
  };

  // Mock initial reviews to populate the UI beautifully based on book details
  const initialMockReviews = [
    {
      user: "Md. Rafiqul Islam",
      roll: "CST-1025",
      comment: `Recommended by our department head. This volume on ${book.category} covers all the theoretical proofs with clean practical illustrations. Highly instructive!`,
      stars: 5,
      date: "May 14, 2026"
    },
    {
      user: "Nusrat Jahan",
      roll: "CST-1033",
      comment: `Perfect for midterm preparation. The chapters on coordinate transforms and distributed pipelines in ${book.publisher || 'academic repository'} are written in an easy-to-digest manner.`,
      stars: 4,
      date: "Apr 28, 2026"
    }
  ];

  const allReviewsList = [...submittedReviews, ...initialMockReviews];

  // Mock dynamic author bio
  const getMockAuthorBio = (author: string) => {
    return `${author} is a distinguished faculty member and senior academic coordinator specializing in ${book.category}. With over fifteen years of pedagogical research history across South-East Asian departments, they have drafted numerous core university textbooks. Their monographs aim to streamline computational complexity theory into intuitive student guidelines.`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans animate-fade-in text-left select-none" id="book-detail-view">
      
      {/* Category Breadcrumbs */}
      <nav className="flex flex-wrap items-center space-x-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-6 pb-4 border-b border-slate-205/60 select-none animate-fade-in" id="breadcrumb">
        <button onClick={() => setCurrentView('catalog')} className="hover:text-[#1E40AF] transition-colors cursor-pointer flex items-center">
          📚 Library Catalog
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-400">{book.category}</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-800 normal-case font-bold truncate max-w-xs sm:max-w-md">{book.title}</span>
      </nav>

      {/* Main detail Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Side: Thumbnail & Actions */}
        <div className="lg:col-span-4 flex flex-col items-center">
          
          <div className="w-full max-w-[340px] h-[380px] bg-white border border-slate-200 rounded-[20px] p-5 shadow-xs overflow-hidden flex items-center justify-center relative mb-6 group">
            <div className="absolute inset-0 bg-slate-50/50 opacity-40 blur-lg rounded-xl"></div>
            
            <img 
              src={book.imageUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800'} 
              alt={book.title} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain object-center rounded-lg shadow-xs transition-transform duration-500 group-hover:scale-[1.03]"
              id="detail-book-img"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800';
              }}
            />
            {/* Diagonal flash element */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-700"></div>
          </div>

          {/* Action strip buttons panel */}
          <div className="w-full max-w-[340px] space-y-3.5">
            {book.format === 'E-Book' ? (
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    setSelectedBookId(book.id);
                    setCurrentView('ebooks');
                  }}
                  className="w-full text-white bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] hover:brightness-[106%] text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 h-12 rounded-[14px]"
                  id="read-ebook-btn"
                >
                  <BookOpen className="w-4 h-4" /> Start Reading Online
                </button>
                {book.pdfUrl && (
                  <a
                    href={book.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-center gap-2 text-center h-12 rounded-[14px] text-xs font-bold uppercase tracking-wider shadow-xs"
                  >
                    <Download className="w-4 h-4 text-slate-550" /> Download PDF Volume
                  </a>
                )}
              </div>
            ) : isAvailable ? (
              <button 
                onClick={() => {
                  setBorrowSuccess(false);
                  setShowBorrowModal(true);
                }}
                className="w-full text-white bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] hover:brightness-[106%] hover:-translate-y-0.5 text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 h-12 rounded-[14px]"
                id="request-borrow-btn"
              >
                <ShoppingBag className="w-4 h-4" /> Request Loan / Borrow Now
              </button>
            ) : (
              <button 
                onClick={() => alert("We have registered your waitlist index. You'll be notified automatically once checked-in.")}
                className="w-full bg-slate-100 text-slate-550 border border-slate-200 h-12 rounded-[14px] text-xs font-bold uppercase tracking-wider hover:bg-slate-150 transition-all cursor-pointer flex items-center justify-center gap-2"
                id="reserve-waitlist-btn"
              >
                <Ban className="w-4 h-4 text-rose-600" /> Book Borrowed (Join Waitlist)
              </button>
            )}

            <button 
              onClick={handleSaveForLater}
              className="w-full bg-white border border-slate-200 text-slate-800 h-12 rounded-[14px] text-xs font-bold uppercase tracking-wider hover:bg-slate-50 hover:shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              id="save-later-btn"
            >
              <Heart className={`w-4 h-4 ${saveSuccess ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} /> 
              {saveSuccess ? 'Saved to Wishlist ✓' : 'Add to Wishlist'}
            </button>

            {/* Quick badge protection */}
            <div className="bg-slate-100/50 border border-slate-200 p-3.5 rounded-xl text-[10px] text-slate-500 flex items-center gap-2.5 justify-center">
              <ShieldCheck className="w-4 h-4 text-slate-455 flex-shrink-0" />
              <span className="font-medium">Verified ScholarLib Institutional Copy License</span>
            </div>
          </div>

        </div>

        {/* Right Side: Specifications & Bio */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Availability metadata banner */}
          <div className="flex flex-wrap items-center gap-3 select-none animate-fade-in">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold shadow-xs border ${
              isAvailable ? 'bg-emerald-50 text-emerald-805 border-emerald-200' : 'bg-rose-50 text-rose-805 border-rose-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
              {book.format === 'E-Book' 
                ? 'E-Book Resource • Unlocked' 
                : isAvailable 
                ? `Available • Stack location: ${book.location || 'Level 1, Room 101'}`
                : 'Checked Out • Queued'
              }
            </span>
            
            <span className="text-xs bg-slate-100 border border-slate-200 text-slate-650 px-3 py-1 rounded-full font-bold">
              📚 {book.copiesCount === 9999 ? 'Digital' : `${book.availableCopies} of ${book.copiesCount} in stock`}
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight leading-tight" id="detail-title">
              {book.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#1E40AF] font-bold uppercase tracking-wider mt-1.5" id="detail-author">
              By Professor {book.author}
            </p>
          </div>

          {/* Location details card with radius 20px */}
          {book.format !== 'E-Book' && (
            <div className="p-5 bg-amber-50/50 border border-amber-200/80 text-amber-950 flex flex-col sm:flex-row gap-4 rounded-[20px] shadow-xs" id="book-shelf-location">
              <MapPin className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <h4 className="font-extrabold uppercase tracking-wide text-amber-900">বইয়ের অবস্থান নির্দেশক (Librarian Stack Area)</h4>
                <p className="font-semibold text-slate-800 mt-1.5">
                  সংরক্ষিত ফ্লোর ও তাক: <span className="bg-white border border-amber-200 text-amber-900 px-2.5 py-0.5 rounded-lg font-bold font-mono text-xs inline-block ml-1">{book.location || 'Level 1, Room 101'}</span>
                </p>
                <p className="text-[10.5px] text-amber-800/80 leading-relaxed mt-1.5">
                  লাইব্রেরি ভবন ১-এর CST কর্নারে এই সূচক কোড মিলিয়ে খুব সহজেই বইটি খুজে পেতে পারেন। ধার অনুমোদনের আগে সেলফ থেকে সংগৃহীত কপিটি কাউন্টারে পেশ করতে হবে।
                </p>
              </div>
            </div>
          )}

          {/* Specification boxes section */}
          <div className="grid grid-cols-2 md:grid-cols-4 bg-[#F8FAFC] border border-slate-200 rounded-[20px] p-5 gap-4 text-center select-none shadow-xs" id="detail-specifications">
            <div className="border-r border-slate-200 last:border-none p-1">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Standard ISBN</p>
              <p className="text-xs font-bold font-mono text-slate-800">{book.isbn}</p>
            </div>
            <div className="border-r border-slate-200 last:border-none p-1">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">PUBLICATION</p>
              <p className="text-xs font-bold text-slate-800">{book.publishDate || 'CST Press (2024)'}</p>
            </div>
            <div className="border-r border-slate-200 last:border-none p-1">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Discipline</p>
              <p className="text-xs font-bold text-slate-800">{book.category}</p>
            </div>
            <div className="p-1">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Star score</p>
              <div className="flex items-center justify-center text-xs font-bold text-amber-500 gap-0.5 mt-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{starRating.toFixed(1)} / 5.0</span>
              </div>
            </div>
          </div>

          {/* Book abstract */}
          <div className="space-y-2 border-b border-slate-100 pb-5">
            <h3 className="text-sm font-bold text-slate-950 flex items-center gap-1.5 uppercase tracking-wider">
              <Compass className="w-4.5 h-4.5 text-slate-400" /> Monograph Summary
            </h3>
            <p className="text-xs leading-relaxed text-slate-600 whitespace-pre-wrap">
              {book.description || "The publisher has loaded global catalog headings. Advanced coursework systems use this textbook as primary or secondary literature to support continuous assessment modules. It outlines practical implementation sequences alongside theoretical computational laws."}
            </p>
          </div>

          {/* Details Spec Table */}
          <div className="space-y-3.5">
            <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4.5 h-4.5 text-slate-400" /> Catalog Index Details
            </h3>
            <div className="bg-white border border-slate-200 rounded-[20px] overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left text-slate-600 border-collapse" id="specs-table">
                <tbody>
                  <tr className="border-b border-slate-100 bg-slate-50/20">
                    <td className="py-3.5 px-4 font-bold text-slate-500 w-1/3">Publisher Agency</td>
                    <td className="py-3.5 px-4 text-slate-900 font-semibold">{book.publisher || 'Universal Academic Press Index'}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-3.5 px-4 font-bold text-slate-500 w-1/3">Page Count Size</td>
                    <td className="py-3.5 px-4 text-slate-900 font-semibold">{book.pageCount} Print Pages</td>
                  </tr>
                  <tr className="border-b border-slate-100 bg-slate-50/20">
                    <td className="py-3.5 px-4 font-bold text-slate-500 w-1/3">Subject Stream</td>
                    <td className="py-3.5 px-4 text-slate-900 font-semibold">{book.category} Level Reference</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-slate-500 w-1/3">Language Standard</td>
                    <td className="py-3.5 px-4 text-slate-900 font-semibold">{book.language || 'English (Inter)'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Author Profile section with radius 20px */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-[20px] space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#1E40AF]" /> About Professor {book.author}
            </h4>
            <p className="text-xs text-slate-650 leading-relaxed italic">
              "{getMockAuthorBio(book.author)}"
            </p>
          </div>

          {/* REVIEWS & RATINGS ELEMENT */}
          <div className="border-t border-slate-100 pt-6 space-y-5">
            <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider">
              Student Reviews & Discussion ({allReviewsList.length})
            </h3>

            {/* Review logger Form */}
            <form onSubmit={submitReview} className="bg-slate-50 p-5 border border-slate-200 rounded-[20px] space-y-3.5">
              <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Write a book review</p>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-550 font-semibold">Your Rating score:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRatingInput(star)}
                      className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star className={`w-5 h-5 ${star <= ratingInput ? 'fill-amber-450 text-amber-400' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={reviewInput}
                  onChange={(e) => setReviewInput(e.target.value)}
                  placeholder="Share your thoughts about this volume text, difficulty level, or exam relevance..."
                  className="w-full text-xs p-3.5 border border-slate-200 focus:border-blue-500 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 h-20 text-slate-800 font-medium placeholder-slate-400"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-slate-950 hover:bg-slate-900 border border-slate-950 text-white font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Submit review
                </button>
              </div>
            </form>

            {/* List of comments */}
            <div className="space-y-3 divide-y divide-slate-100">
              {allReviewsList.map((rev, idx) => (
                <div key={idx} className="pt-3.5 first:pt-0 text-xs text-left">
                  <div className="flex justify-between items-center select-none text-[10.5px]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{rev.user}</span>
                      <span className="text-[9.5px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-bold">{rev.roll}</span>
                    </div>
                    <span className="text-slate-400 font-bold font-sans">{rev.date}</span>
                  </div>

                  <div className="flex items-center gap-0.5 text-amber-500 my-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < rev.stars ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                    ))}
                  </div>

                  <p className="text-slate-650 mt-1 leading-relaxed font-sans font-medium">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Related Books Carousel */}
      {relatedBooks.length > 0 && (
        <section className="border-t border-slate-200 pt-12 mt-12 animate-fade-in" id="related-books-section">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-sans font-bold text-slate-900 uppercase tracking-widest text-xs">Similiar Books in {book.category}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Explore same department resources</p>
            </div>
            <button 
              onClick={() => setCurrentView('catalog')}
              className="text-[10px] font-bold uppercase tracking-wider text-[#1E40AF] hover:underline cursor-pointer flex items-center_right"
              id="view-catalog-link"
            >
              Browse all catalog <ChevronRight className="w-3.5 h-3.5 ml-1 inline" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 select-none animate-fade-in">
            {relatedBooks.map((relBook) => {
              const relRating = getSimulatedRating(relBook.isbn);
              return (
                <div 
                  key={relBook.id}
                  onClick={() => navigateRelated(relBook.id)}
                  className="group cursor-pointer text-left bg-white border border-slate-205 hover:border-slate-350 p-4 rounded-xl hover:shadow-md transition-all flex flex-col justify-between"
                  id={`related-${relBook.id}`}
                >
                  <div>
                    <div className="relative w-full h-[220px] bg-slate-50/55 border border-slate-200 p-3 overflow-hidden shadow-xs group-hover:scale-[1.01] transition-all mb-3 flex items-center justify-center rounded-lg">
                      <img 
                        src={relBook.imageUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800'} 
                        alt={relBook.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain object-center rounded-xs"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800';
                        }}
                      />
                    </div>
                    <span className="text-[9.5px] uppercase font-bold text-[#1E40AF] block">{relBook.category}</span>
                    <h4 className="font-sans font-bold text-xs text-slate-800 mt-1 group-hover:text-[#1E40AF] line-clamp-2 truncate transition-colors leading-tight">
                      {relBook.title}
                    </h4>
                  </div>
                  
                  <div className="mt-3.5 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 select-none">
                    <span>By {relBook.author.split(' ').pop()}</span>
                    <div className="flex items-center text-amber-500 font-bold gap-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{relRating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Duration Borrow Selector Modal Overlay */}
      {showBorrowModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans select-none animate-fade-in">
          <div className="bg-white rounded-[20px] border border-slate-200 max-w-md w-full shadow-2xl p-6 relative animate-scale-up" id="borrow-duration-modal">
            {activeLoansCount >= 2 && book.format !== 'E-Book' ? (
              <div className="text-center py-2" id="borrow-limit-warning-view">
                {/* Warning Indicator */}
                <div className="relative w-16 h-16 mx-auto mb-5 flex items-center justify-center">
                  <div className="absolute inset-0 bg-amber-100 rounded-full animate-ping opacity-45"></div>
                  <div className="absolute inset-1 bg-amber-50 rounded-full border border-amber-200"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-tr from-[#F59E0B] to-amber-600 rounded-full flex items-center justify-center shadow-md">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                </div>

                <h3 className="text-sm sm:text-base font-extrabold text-amber-900 uppercase tracking-wide">
                  ধার করার সর্বোচ্চ সীমা অতিক্রম!
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5 mb-5">
                  Borrowing Limit Reached
                </p>

                {/* Bilingual warning layout details */}
                <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-xl text-left space-y-3 shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <Ban className="w-4.5 h-4.5 text-amber-750 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">নীতিমালা সতর্কীকরণ (Policy Limit):</p>
                      <p className="text-[11px] text-slate-600 leading-relaxed mt-1 font-medium">
                        নিরাপত্তা ও নিয়ম অনুযায়ী একজন শিক্ষার্থী সর্বোচ্চ <span className="text-rose-600 font-black font-mono">২টি (Two)</span> ফিজিক্যাল বই একসাথে ধার নিতে পারেন। 
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-amber-200/60 pt-2.5 text-[10.5px] text-slate-500 leading-normal font-sans font-medium">
                    You currently have <strong className="text-amber-900 font-bold">{activeLoansCount} pending or approved loans</strong> active under your student portal credentials. Please return your current books to clear your loan index before requesting more physical volumes.
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={() => {
                      setShowBorrowModal(false);
                      setCurrentView('dashboard');
                    }}
                    className="flex-1 px-4 h-11 bg-[#1E40AF] hover:bg-[#1E40AF]/90 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer text-center select-none shadow-xs"
                    id="borrow-warning-dashboard-btn"
                  >
                    Go to My Dashboard &rarr;
                  </button>
                  <button 
                    onClick={() => setShowBorrowModal(false)}
                    className="px-5 h-11 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[10px] uppercase tracking-wider transition-colors cursor-pointer text-center"
                    id="borrow-warning-close-btn"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : borrowSuccess ? (
              <div className="text-center py-4 font-sans animate-fade-in" id="borrow-success-view">
                <div className="w-14 h-14 bg-emerald-50 border border-emerald-250 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-up shadow-sm">
                  <CheckCircle className="w-7 h-7" />
                </div>
                
                <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
                  আবেদন সম্পন্ন হয়েছে!
                </h3>
                <p className="text-[10px] text-slate-550 font-bold uppercase tracking-wider mt-0.5">
                  Request Received Successfully
                </p>

                {/* Instructions card block */}
                <div className="bg-gradient-to-br from-emerald-50/55 via-white to-slate-50 border border-emerald-150 p-4 text-emerald-950 rounded-[14px] text-xs space-y-2.5 mt-5 text-left font-medium shadow-xs">
                  <p className="font-extrabold flex items-center gap-1.5 text-emerald-805">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    বই সংগ্রহের নিয়মাবলি (Collection Instructions)
                  </p>
                  <p className="leading-relaxed text-slate-700 font-bold">
                    লাইব্রেরিয়ান আপনার ধার করার অনুরোধটি <span className="text-[#1E40AF] border-b border-dashed border-blue-300 pb-0.5">অনুমোদন (Approve) করার পর ১-২ দিনের মধ্যে</span> অবশ্যই লাইব্রেরি কাউন্টারে এসে বইটি সংগ্রহ করুন।
                  </p>
                  <p className="text-[10.5px] text-slate-400 font-mono italic leading-normal border-t border-emerald-100 pt-2">
                    Once the librarian approves your loan, please collect the textbook from the desk within 1 to 2 days maximum.
                  </p>
                </div>

                {/* Selected volume specs wrapper */}
                <div className="mt-5 p-3 px-4 bg-[#F8FAFC] border border-slate-200 rounded-xl text-left flex gap-3.5 items-center">
                  <div className="w-8 h-11 bg-white border border-slate-200 p-0.5 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                    <img 
                      src={book.imageUrl} 
                      alt={book.title} 
                      referrerPolicy="no-referrer"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-905 truncate" title={book.title}>{book.title}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">Author: {book.author}</p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end items-center mt-6">
                  <button 
                    onClick={() => {
                      setShowBorrowModal(false);
                      setCurrentView('dashboard');
                    }}
                    className="flex-1 h-11 bg-slate-900 border border-slate-800 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider hover:bg-slate-800 transition-colors cursor-pointer text-center"
                    id="borrow-success-dashboard-btn"
                  >
                    Go to Dashboard &rarr;
                  </button>
                  <button 
                    onClick={() => setShowBorrowModal(false)}
                    className="px-5 h-11 bg-[#1E40AF] text-white font-bold rounded-xl text-[10px] uppercase tracking-wider hover:bg-[#1E40AF]/90 shadow-sm cursor-pointer"
                    id="borrow-success-close-btn"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-1">Confirm Borrow Request</h3>
                <p className="text-xs text-slate-500 mb-6 font-medium">Select your loan duration period below.</p>
                
                <div className="mb-6">
                  <p className="text-[9px] font-bold text-slate-400 mb-2.5 uppercase tracking-wider">Choose Loan Term Period</p>
                  <div className="grid grid-cols-3 gap-3 text-left">
                    {[
                      { days: 7, label: "7 Days", desc: "Short study lookups" },
                      { days: 14, label: "14 Days", desc: "Standard assignment" },
                      { days: 30, label: "30 Days", desc: "Intensive reference" }
                    ].map(item => (
                      <button 
                        type="button"
                        key={item.days}
                        onClick={() => setBorrowDuration(item.days)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          borrowDuration === item.days 
                            ? 'border-[#1E40AF] bg-blue-50/30 text-[#1E40AF] font-bold shadow-xs' 
                            : 'border-slate-205 hover:border-slate-400 text-slate-700'
                        }`}
                      >
                        <span className="text-xs font-bold block leading-none">{item.label}</span>
                        <span className="text-[9px] text-slate-405 block mt-1.5 leading-snug">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl mb-6 text-[10px] text-blue-805 flex gap-2.5 shadow-xs leading-relaxed font-sans text-left font-medium">
                  <Clock className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-[#1E40AF]" />
                  <div>
                    <strong className="uppercase block font-sans font-bold mb-0.5">Fine Overdue Rules Apply:</strong> A structural fine of BDT 20 per week is charged for late returns up to 7 days. If delayed over 7 days, a penalty fine of BDT 50 takes effect.
                  </div>
                </div>

                <div className="flex gap-3 justify-end items-center">
                  <button 
                    onClick={() => setShowBorrowModal(false)}
                    className="px-4 h-11 border border-slate-200 text-slate-700 font-bold rounded-xl text-[10px] uppercase tracking-wide hover:bg-slate-50 transition-colors cursor-pointer"
                    id="borrow-cancel-btn"
                  >
                    Go Back
                  </button>
                  <button 
                    onClick={handleBorrowRequest}
                    disabled={isSubmitting}
                    className="px-5 h-11 bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] text-white font-bold rounded-xl text-[10px] uppercase tracking-wider hover:brightness-[105%] transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer min-w-[125px]"
                    id="borrow-confirm-btn"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="w-3.5 h-3.5 animate-spin" /> Requesting...
                      </>
                    ) : (
                      'Request Approval'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
