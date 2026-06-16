import React, { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import Header from './components/Header.js';
import Footer from './components/Footer.js';
import HomeView from './components/HomeView.js';
import CatalogView from './components/CatalogView.js';
import BookDetailView from './components/BookDetailView.js';
import StudentDashboard from './components/StudentDashboard.js';
import AdminDashboard from './components/AdminDashboard.js';
import EBookView from './components/EBookView.js';
import ProfileDetails from './components/ProfileDetails.js';
import { Book, Notification, Librarian, GalleryItem, Student } from './types.js';

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [user, setUser] = useState<any>(null); // Logged in student
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  // Librarians & Gallery state
  const [librarians, setLibrarians] = useState<Librarian[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

  // Authenticate using credentials form state
  const [loginRoll, setLoginRoll] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [loadingLogin, setLoadingLogin] = useState<boolean>(false);

  useEffect(() => {
    loadBooks();
    checkExistingSession();
    loadLibrarians();
    loadGalleryItems();
  }, []);

  const loadLibrarians = async () => {
    try {
      const res = await fetch('/api/librarians');
      if (res.ok) {
        const data = await res.json();
        setLibrarians(data);
      }
    } catch (e) {
      console.error("Failed to load librarians", e);
    }
  };

  const loadGalleryItems = async () => {
    try {
      const res = await fetch('/api/gallery');
      if (res.ok) {
        const data = await res.json();
        setGalleryItems(data);
      }
    } catch (e) {
      console.error("Failed to load gallery items", e);
    }
  };

  const loadBooks = async () => {
    try {
      const res = await fetch('/api/books');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setBooks(data);
        } else if (data && Array.isArray(data.books)) {
          setBooks(data.books);
        } else {
          setBooks([]);
        }
      }
    } catch (e) {
      console.error("Failed to load catalog books", e);
    }
  };

  const checkExistingSession = () => {
    const cachedUser = localStorage.getItem('scholar_user');
    const cachedIsAdmin = localStorage.getItem('scholar_admin') === 'true';
    if (cachedUser) {
      const parsed = JSON.parse(cachedUser);
      setUser(parsed);
      setIsAdmin(cachedIsAdmin);
      loadNotifications(parsed.rollNumber);
    }
  };

  const loadNotifications = async (roll: string) => {
    if (!roll || roll === 'undefined' || roll === 'null') {
      setNotifications([]);
      return;
    }
    try {
      const res = await fetch(`/api/notifications/${roll}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setNotifications(data);
        } else {
          setNotifications([]);
        }
      } else {
        setNotifications([]);
      }
    } catch (e: any) {
      if (e?.message?.includes('Failed to fetch') || e?.name === 'TypeError') {
        console.warn("Transient network issue loading notifications:", e?.message);
      } else {
        console.error("Error loading notifications:", e);
      }
      setNotifications([]);
    }
  };

  // Perform secure student authentication query
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoadingLogin(true);
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: loginRoll, password: loginPassword })
      });

      if (res.ok) {
        const data = await res.json();
        const isAdminUser = data.role === 'admin' || (data.user && (data.user.role === 'admin' || data.user.rollNumber === 'ADMIN'));
        
        setUser(data.user);
        setIsAdmin(isAdminUser);
        
        localStorage.setItem('scholar_user', JSON.stringify(data.user));
        localStorage.setItem('scholar_admin', String(isAdminUser));
        
        loadNotifications(data.user.rollNumber);
        
        setLoginRoll('');
        setLoginPassword('');

        // Redirect appropriately
        if (isAdminUser) {
          setCurrentView('admin');
        } else {
          setCurrentView('dashboard');
        }
      } else {
        const err = await res.json();
        setLoginError(err.error || 'Invalid Roll Number or Password credentials.');
      }
    } catch (err: any) {
      setLoginError('Authentication server returned error state.');
    } finally {
      setLoadingLogin(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('scholar_user');
    localStorage.removeItem('scholar_admin');
    setCurrentView('home');
  };

  const requestBorrow = async (bookId: string, durationDays: number): Promise<string> => {
    if (!user) throw new Error("Credentials Expired. Please login.");
    
    const res = await fetch('/api/borrow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rollNumber: user.rollNumber,
        studentRoll: user.rollNumber,
        bookId,
        durationDays
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Could not borrow.");
    }
    
    // Refresh catalog quantities and student notifies
    loadBooks();
    loadNotifications(user.rollNumber);
    return data.message;
  };

  const clearNotification = async (notifId: string) => {
    if (!user) return;
    try {
      await fetch(`/api/notifications/${notifId}`, { method: 'DELETE' });
      loadNotifications(user.rollNumber);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f1f5f9] text-[#1e293b] font-sans" id="scholar-app-root">
      
      {/* Dynamic Navigation Header Component */}
      <Header 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        user={user}
        logout={logout}
      />

      {/* Primary responsive view routing segment */}
      <main className="flex-grow">
        
        {currentView === 'home' && (
          <HomeView 
            books={books} 
            librarians={librarians}
            galleryItems={galleryItems}
            setCurrentView={setCurrentView}
            setCategoryFilter={(cat) => {
              setCategoryFilter(cat);
              setCurrentView('catalog');
            }} 
            setSearchQuery={(q) => {
              setSearchQuery(q);
              setCurrentView('catalog');
            }}
            setSelectedBookId={(id) => {
              setSelectedBookId(id);
              setCurrentView('book-detail');
            }}
          />
        )}

        {currentView === 'catalog' && (
          <CatalogView 
            books={books}
            currentCategoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setSelectedBookId={setSelectedBookId}
            setCurrentView={setCurrentView}
          />
        )}

        {currentView === 'book-detail' && (
          <BookDetailView 
            bookId={selectedBookId}
            books={books}
            setCurrentView={setCurrentView}
            setSelectedBookId={setSelectedBookId}
            user={user}
            requestBorrow={requestBorrow}
          />
        )}

        {currentView === 'ebooks' && (
          <EBookView 
            books={books}
            setCurrentView={setCurrentView}
            selectedBookId={selectedBookId}
            setSelectedBookId={setSelectedBookId}
          />
        )}

        {currentView === 'profile' && (
          user ? (
            <ProfileDetails
              user={user}
              onUpdateUser={(updatedStudent) => {
                setUser(updatedStudent);
                localStorage.setItem('scholar_user', JSON.stringify(updatedStudent));
              }}
              setCurrentView={setCurrentView}
            />
          ) : (
            <div className="max-w-md mx-auto my-16 text-center text-slate-500 font-sans p-8 bg-white border border-slate-200">
              <p className="text-xs font-semibold text-slate-700">Please authenticate first to access profile configurations.</p>
              <button onClick={() => setCurrentView('dashboard')} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-4 py-2 uppercase tracking-wider transition-colors cursor-pointer">
                Go to Sign In
              </button>
            </div>
          )
        )}

        {/* SECURE DASHBOARD OR LOGIN PANEL */}
        {currentView === 'dashboard' && (
          user ? (
            <StudentDashboard 
              user={user} 
              books={books} 
              setCurrentView={setCurrentView} 
              setSelectedBookId={setSelectedBookId}
              logout={logout}
            />
          ) : (
            // Handcrafted high-fidelity portal matching requirements
            <div className="max-w-md mx-auto my-16 px-6 py-10 bg-white border border-slate-200 shadow-sm rounded-none font-sans select-none animate-fade-in" id="login-panel">
              <div className="text-center mb-8">
                <span className="text-xs uppercase bg-blue-500/10 text-blue-600 px-3 py-1 rounded-sm font-semibold font-mono">University Portal</span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-3">ScholarLib Terminal</h2>
                <p className="text-xs text-slate-500 mt-1">Please authenticate with your Roll credentials to checkout textbooks.</p>
              </div>

              {loginError && (
                <div className="p-3 bg-red-100/60 border border-red-200 rounded-none text-xs text-red-600 mb-4 font-medium" id="login-error-alert">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wide">University Roll Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 1001, 1002, cst-1001..." 
                    value={loginRoll}
                    onChange={e => setLoginRoll(e.target.value)}
                    className="w-full border border-slate-200 rounded-none p-2.5 text-xs text-slate-800 placeholder-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                    required
                    id="roll-login-input"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wide">Account Access Password</label>
                  <input 
                    type="password" 
                    placeholder="Enter password..." 
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-none p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                    required
                    id="password-login-input"
                  />
                </div>

                <div className="p-2.5 bg-blue-50/50 border border-blue-100 rounded-none text-[11px] text-blue-800 font-normal leading-relaxed">
                  <strong>Access Hint:</strong> Type any valid roll number (e.g. <code>1001</code>) and password <code>pass-1001</code>. For librarian privileges, access with roll <code>ADMIN</code> and password <code>admin123</code>.
                </div>

                <button 
                  type="submit"
                  disabled={loadingLogin}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-none font-bold text-xs hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-sm cursor-pointer select-none flex items-center justify-center gap-2"
                  id="submit-login-btn"
                >
                  {loadingLogin ? (
                    <>
                      <Loader className="w-3.5 h-3.5 animate-spin shrink-0" />
                      <span>Authorizing credentials...</span>
                    </>
                  ) : (
                    'Enter System Roster'
                  )}
                </button>
              </form>
            </div>
          )
        )}

        {/* SECURE ADMIN SUPERINTENDENT */}
        {currentView === 'admin' && (
          isAdmin ? (
            <AdminDashboard 
              books={books} 
              loadBooks={loadBooks} 
              librarians={librarians}
              loadLibrarians={loadLibrarians}
              galleryItems={galleryItems}
              loadGalleryItems={loadGalleryItems}
            />
          ) : (
            <div className="max-w-md mx-auto text-center p-12 text-gray-500 font-sans select-none">
              <p>You do not have administrative authorization parameters for session variables.</p>
              <button onClick={() => setCurrentView('home')} className="text-[#0252CD] mt-4 hover:underline cursor-pointer">
                Return home
              </button>
            </div>
          )
        )}

      </main>

      {/* Styled institutional Footer */}
      <Footer />

    </div>
  );
}
