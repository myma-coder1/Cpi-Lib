import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Users, Key, DollarSign, BarChart2, CheckSquare, 
  Trash2, Edit, Plus, FileText, Download, TrendingUp, Cpu, 
  Trash, Save, X, Search, CheckCircle, RefreshCw, AlertCircle,
  UserPlus, Eye, BookOpenCheck, HelpCircle, Settings, ChevronRight, ChevronLeft,
  Printer, Grid, Info, BookCheck, Shield, Image as ImageIcon, Briefcase, Menu, Upload,
  Megaphone, Pin, MessageSquare, Send
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Book, Student, BorrowRecord, Fine, Librarian, GalleryItem } from '../types.js';

interface AdminDashboardProps {
  books: Book[];
  loadBooks: () => void;
  librarians: Librarian[];
  loadLibrarians: () => void;
  galleryItems: GalleryItem[];
  loadGalleryItems: () => void;
}

const compressImageAndSet = (file: File, callback: (base64: string) => void) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (event) => {
    const img = new Image();
    img.src = event.target?.result as string;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 500;
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
        callback(compressedBase64);
      } else {
        callback(img.src);
      }
    };
  };
};

export default function AdminDashboard({ 
  books, 
  loadBooks,
  librarians = [],
  loadLibrarians,
  galleryItems = [],
  loadGalleryItems
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'books' | 'students' | 'approvals' | 'fines' | 'reports' | 'settings' | 'help' | 'librarians' | 'gallery' | 'notices' | 'branding' | 'sliders' | 'support'>('analytics');
  
  // Library Status Admin Management States
  const [libStatus, setLibStatus] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [libOpeningTime, setLibOpeningTime] = useState('08:00 AM');
  const [libClosingTime, setLibClosingTime] = useState('08:00 PM');
  const [libWeeklySchedule, setLibWeeklySchedule] = useState('Saturday - Thursday');
  const [libStatusLoading, setLibStatusLoading] = useState(false);
  const [libStatusMessage, setLibStatusMessage] = useState('');

  // Support Center / Help Desk Admin States
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [selectedSupportMessage, setSelectedSupportMessage] = useState<any | null>(null);
  const [supportReplyText, setSupportReplyText] = useState('');
  const [supportFilterStatus, setSupportFilterStatus] = useState<'ALL' | 'PENDING' | 'READ' | 'REPLIED' | 'ARCHIVED'>('ALL');
  const [supportSearchQuery, setSupportSearchQuery] = useState('');
  const [loadingSupport, setLoadingSupport] = useState(false);
  const [supportStatusText, setSupportStatusText] = useState('');

  const loadSupportMessages = async () => {
    setLoadingSupport(true);
    try {
      const res = await fetch('/api/support/messages');
      if (res.ok) {
        const data = await res.json();
        setSupportMessages(data || []);
      }
    } catch (err) {
      console.error("Error loading support messages", err);
    } finally {
      setLoadingSupport(false);
    }
  };

  const handleSupportMarkRead = async (id: string) => {
    try {
      const res = await fetch(`/api/support/messages/${id}/read`, { method: 'POST' });
      if (res.ok) {
        const updated = await res.json();
        setSupportMessages(prev => prev.map(m => m.id === id ? updated : m));
        if (selectedSupportMessage?.id === id) {
          setSelectedSupportMessage(updated);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSupportReply = async (id: string) => {
    if (!supportReplyText.trim()) return;
    setLoadingSupport(true);
    setSupportStatusText('');
    try {
      const res = await fetch(`/api/support/messages/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyText: supportReplyText.trim() })
      });
      if (res.ok) {
        const updated = await res.json();
        setSupportMessages(prev => prev.map(m => m.id === id ? updated : m));
        setSelectedSupportMessage(updated);
        setSupportReplyText('');
        setSupportStatusText('উত্তরটি সফলভাবে পোস্ট করা হয়েছে!');
      } else {
        setSupportStatusText('উত্তর পোস্ট করা সম্ভব হয়নি।');
      }
    } catch (err) {
      console.error(err);
      setSupportStatusText('নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।');
    } finally {
      setLoadingSupport(false);
    }
  };

  const handleSupportArchive = async (id: string) => {
    try {
      const res = await fetch(`/api/support/messages/${id}/archive`, { method: 'POST' });
      if (res.ok) {
        const updated = await res.json();
        setSupportMessages(prev => prev.map(m => m.id === id ? updated : m));
        if (selectedSupportMessage?.id === id) {
          setSelectedSupportMessage(updated);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSupportDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this message permanently?')) return;
    try {
      const res = await fetch(`/api/support/messages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSupportMessages(prev => prev.filter(m => m.id !== id));
        if (selectedSupportMessage?.id === id) {
          setSelectedSupportMessage(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetch('/api/library-status')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setLibStatus(data.status);
          setLibOpeningTime(data.openingTime);
          setLibClosingTime(data.closingTime);
          setLibWeeklySchedule(data.weeklySchedule);
        }
      })
      .catch(err => console.error("Error fetching library status in admin panel", err));
  }, []);

  // Branding Panel state inside AdminDashboard.tsx
  const [brandingForm, setBrandingForm] = useState({
    libraryName: '',
    shortName: '',
    logoUrl: '',
    email: '',
    phone: '',
    address: '',
    websiteUrl: '',
    footerText: '',
    copyrightText: ''
  });
  const [loadingBranding, setLoadingBranding] = useState(false);
  const [brandingStatusText, setBrandingStatusText] = useState('');

  // Notice Board management Panel states
  const [adminNotices, setAdminNotices] = useState<any[]>([]);
  const [showAddNotice, setShowAddNotice] = useState(false);
  const [editingNotice, setEditingNotice] = useState<any | null>(null);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    description: '',
    attachmentUrl: '',
    attachmentType: 'PDF Document',
    urgent: false,
    pinned: false,
    publishDate: new Date().toISOString().split('T')[0],
    expiryDate: ''
  });

  // Hero Slides management Panel states
  const [adminSlides, setAdminSlides] = useState<any[]>([]);
  const [showAddSlide, setShowAddSlide] = useState(false);
  const [editingSlide, setEditingSlide] = useState<any | null>(null);
  const [slideForm, setSlideForm] = useState({
    title: '',
    subtitle: '',
    imageUrl: ''
  });

  const loadAdminNotices = () => {
    fetch('/api/notices')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAdminNotices(data);
      })
      .catch(err => console.error("Error fetching administrative notices", err));
  };

  const loadAdminSlides = () => {
    fetch('/api/hero-slides')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAdminSlides(data);
      })
      .catch(err => console.error("Error fetching hero slides list in admin panel", err));
  };

  useEffect(() => {
    // Load branding, notices, slides on admin mount
    fetch('/api/branding')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setBrandingForm({
            libraryName: data.libraryName || '',
            shortName: data.shortName || '',
            logoUrl: data.logoUrl || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            websiteUrl: data.websiteUrl || '',
            footerText: data.footerText || '',
            copyrightText: data.copyrightText || ''
          });
        }
      })
      .catch(err => console.error("Error loading branding in admin panel", err));

    loadAdminNotices();
    loadAdminSlides();
    loadSupportMessages();
  }, []);

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingBranding(true);
    setBrandingStatusText('');
    try {
      const res = await fetch('/api/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandingForm)
      });
      if (res.ok) {
        setBrandingStatusText('Institutional branding updated successfully! Refreshing dynamic components...');
        // Refresh branding dynamically
        fetch('/api/branding')
          .then(res => res.json())
          .then(data => {
            if (data && (window as any).refreshAppBranding) {
              (window as any).refreshAppBranding();
            }
          });
      } else {
        setBrandingStatusText('Could not synchronize logo or names.');
      }
    } catch (err) {
      setBrandingStatusText('Network error syncing branding configuration.');
    } finally {
      setLoadingBranding(false);
    }
  };

  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeForm.title || !noticeForm.description) {
      alert("Title and content description are required.");
      return;
    }
    const isEdit = !!editingNotice;
    const url = isEdit ? `/api/notices/${editingNotice.id}` : '/api/notices';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { ...noticeForm, id: editingNotice.id } : noticeForm)
      });
      if (res.ok) {
        alert(isEdit ? "Notice edited successfully!" : "New notice published. Live alerts dispatched to student portals!");
        setShowAddNotice(false);
        setEditingNotice(null);
        setNoticeForm({
          title: '',
          description: '',
          attachmentUrl: '',
          attachmentType: 'PDF Document',
          urgent: false,
          pinned: false,
          publishDate: new Date().toISOString().split('T')[0],
          expiryDate: ''
        });
        loadAdminNotices();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to submit announcement.");
      }
    } catch (err) {
      alert("Network error publishing notice.");
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notice permanently?")) return;
    try {
      const res = await fetch(`/api/notices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert("Notice deleted successfully.");
        loadAdminNotices();
      } else {
        alert("Could not remove notices.");
      }
    } catch (err) {
      alert("Connection failed.");
    }
  };

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideForm.title || !slideForm.imageUrl) {
      alert("Title and dynamic image URL are required.");
      return;
    }
    const isEdit = !!editingSlide;
    const url = isEdit ? `/api/hero-slides/${editingSlide.id}` : '/api/hero-slides';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { ...slideForm, id: editingSlide.id } : slideForm)
      });
      if (res.ok) {
        alert("Slides synced successfully! The landing page will now update instantly.");
        setShowAddSlide(false);
        setEditingSlide(null);
        setSlideForm({ title: '', subtitle: '', imageUrl: '' });
        loadAdminSlides();
      } else {
        alert("Could not update slideshow components.");
      }
    } catch (err) {
      alert("Failed to reach server.");
    }
  };

  const handleDeleteSlide = async (id: string) => {
    if (!confirm("Remove this hero banner? Information will be restored to system defaults.")) return;
    try {
      const res = await fetch(`/api/hero-slides/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert("Hero slide deleted.");
        loadAdminSlides();
      } else {
        alert("Failed to delete.");
      }
    } catch (err) {
      alert("Network fail.");
    }
  };

  const handleUpdateLibraryStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setLibStatusLoading(true);
    setLibStatusMessage('');
    try {
      const res = await fetch('/api/library-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: libStatus,
          openingTime: libOpeningTime,
          closingTime: libClosingTime,
          weeklySchedule: libWeeklySchedule
        })
      });
      if (res.ok) {
        setLibStatusMessage('Library hours and status synchronized successfully!');
      } else {
        setLibStatusMessage('Failed to save library status parameters.');
      }
    } catch (err) {
      setLibStatusMessage('Network error updating status parameters.');
    } finally {
      setLibStatusLoading(false);
    }
  };
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Dynamic lists from server
  const [students, setStudents] = useState<Student[]>([]);
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingRecords, setLoadingRecords] = useState(true);

  // Search parameters inside Admin views
  const [bookQuery, setBookQuery] = useState('');
  const [studentQuery, setStudentQuery] = useState('');

  // CRUD modifications state for Books
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [showAddBook, setShowAddBook] = useState(false);
  const [formData, setFormData] = useState({
    title: '', author: '', category: 'Computer Science', isbn: '',
    imageUrl: '', description: '', publisher: '', publishDate: '',
    pageCount: 300, format: 'Paperback' as any, copiesCount: 3, location: 'Level 1, Room 101',
    pdfUrl: '', ebookContentText: ''
  });

  // Dynamic user / student management states
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberForm, setMemberForm] = useState({
    name: '',
    password: 'student123',
    rollNumber: '',
    department: 'CST',
    semester: 1
  });
  const [selectedStudentRollForIssues, setSelectedStudentRollForIssues] = useState<string | null>(null);

  // Administrative Student popup, fine editor and clearance certificates states
  const [reviewedStudent, setReviewedStudent] = useState<Student | null>(null);
  const [editingFine, setEditingFine] = useState<Fine | null>(null);
  const [fineEditAmount, setFineEditAmount] = useState<number>(0);
  const [fineEditReason, setFineEditReason] = useState<string>('');
  const [fineEditStatus, setFineEditStatus] = useState<'UNPAID' | 'PAID' | 'WAIVED'>('UNPAID');
  const [savingFineLoading, setSavingFineLoading] = useState(false);
  const [showCertificateView, setShowCertificateView] = useState(false);

  // Librarian Management Form State
  const [showAddLibrarian, setShowAddLibrarian] = useState(false);
  const [editingLibrarian, setEditingLibrarian] = useState<Librarian | null>(null);
  const [libForm, setLibForm] = useState({
    name: '',
    mobile: '',
    address: '',
    shift: 'Morning Shift ( সকাল ৮:০০ - দুপুর ২:০০ )'
  });

  // Gallery Management Form State
  const [showAddGallery, setShowAddGallery] = useState(false);
  const [galForm, setGalForm] = useState({
    imageUrl: '',
    caption: ''
  });

  const handleSaveLibrarian = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!libForm.name) return;

    try {
      const isEdit = !!editingLibrarian;
      const url = isEdit ? `/api/librarians/${editingLibrarian.id}` : '/api/librarians';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { ...libForm, id: editingLibrarian.id } : libForm)
      });

      if (res.ok) {
        loadLibrarians();
        setShowAddLibrarian(false);
        setEditingLibrarian(null);
        setLibForm({
          name: '',
          mobile: '',
          address: '',
          shift: 'Morning Shift ( সকাল ৮:০০ - দুপুর ২:০০ )'
        });
      }
    } catch (err) {
      console.error("Error saving librarian roster:", err);
    }
  };

  const handleEditLibrarianClick = (lib: Librarian) => {
    setEditingLibrarian(lib);
    setLibForm({
      name: lib.name,
      mobile: lib.mobile,
      address: lib.address,
      shift: lib.shift
    });
    setShowAddLibrarian(true);
  };

  const handleDeleteLibrarian = async (id: string) => {
    if (!confirm("Are you sure you want to delete this librarian from database registries?")) return;
    try {
      const res = await fetch(`/api/librarians/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadLibrarians();
      }
    } catch (err) {
      console.error("Error deleting librarian roster item:", err);
    }
  };

  const handleSaveGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galForm.imageUrl) return;

    try {
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(galForm)
      });

      if (res.ok) {
        loadGalleryItems();
        setShowAddGallery(false);
        setGalForm({ imageUrl: '', caption: '' });
      }
    } catch (err) {
      console.error("Error uploading gallery image item:", err);
    }
  };

  const handleDeleteGallery = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this gallery highlight photo?")) return;
    try {
      const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadGalleryItems();
      }
    } catch (err) {
      console.error("Error deleting gallery photo item:", err);
    }
  };

  // OpenLibrary import states
  const [olQuery, setOlQuery] = useState('');
  const [olLoading, setOlLoading] = useState(false);
  const [olResults, setOlResults] = useState<any[]>([]);
  const [showImportDrawer, setShowImportDrawer] = useState(false);
  const [importCategory, setImportCategory] = useState('Computer Science');

  // Admin dynamic updates
  useEffect(() => {
    loadAdminStats();
  }, [books]);

  const loadAdminStats = async () => {
    setLoadingRecords(true);
    try {
      // 1. Fetch academic students catalog list
      const studRes = await fetch('/api/students');
      if (studRes.ok) {
        const studData = await studRes.json();
        if (Array.isArray(studData)) {
          setStudents(studData);
        } else {
          console.error("Expected array for students, got:", studData);
          setStudents([]);
        }
      } else {
        console.error("Failed to fetch students:", studRes.statusText);
        setStudents([]);
      }

      // 2. Fetch all student borrow transactions
      const borrowRes = await fetch('/api/admin/borrows');
      if (borrowRes.ok) {
        const borrowData = await borrowRes.json();
        setBorrowRecords(borrowData);
      }

      // 3. Fetch all active overdue fines
      const finesRes = await fetch('/api/admin/fines');
      if (finesRes.ok) {
        const finesData = await finesRes.json();
        setFines(finesData);
      }

      // 4. Load consolidated database analytics
      const analyticsRes = await fetch('/api/admin/analytics');
      if (analyticsRes.ok) {
        const stats = await analyticsRes.json();
        setAnalytics(stats);
      }
    } catch (e) {
      console.error("Error loading admin system directory data:", e);
    } finally {
      setLoadingRecords(false);
    }
  };

  // Re-fetch calculations & sync
  const reloadTransactions = async () => {
    await loadAdminStats();
  };

  // Approval desk actions
  const handleApproveLoan = async (recordId: string) => {
    try {
      const res = await fetch(`/api/admin/approve-borrow/${recordId}`, { method: 'POST' });
      if (res.ok) {
        alert("Loan Approved! The student can now collect the physical volume.");
        reloadTransactions();
        loadBooks();
      } else {
        const err = await res.json();
        alert(err.error || 'Approval failed');
      }
    } catch (e) {
      alert('Error updating database records');
    }
  };

  const handleReceiveReturn = async (recordId: string) => {
    try {
      const res = await fetch(`/api/admin/approve-return/${recordId}`, { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        if (result.fineAmount > 0) {
          alert(`Success! Returned book checked back into stock. Overdue detected: Charged late fee BDT ${result.fineAmount}`);
        } else {
          alert(`Returned book checked back in perfectly with updated copies.`);
        }
        reloadTransactions();
        loadBooks();
      } else {
        const err = await res.json();
        alert(err.error || 'Return check-in failed');
      }
    } catch (e) {
      alert('Error checkout desk returned operations');
    }
  };

  // Fines register waivers
  const handleAdminFineAction = async (fineId: string, action: 'PAID' | 'WAIVED') => {
    try {
      const res = await fetch(`/api/admin/fines/${fineId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        alert(`Success! Fine marked as ${action.toLowerCase()}.`);
        reloadTransactions();
      } else {
        alert('Action could not be executed.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Modern robust fine editor submission handler
  const handleUpdateFine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFine) return;
    setSavingFineLoading(true);
    try {
      const res = await fetch(`/api/admin/fines/${editingFine.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(fineEditAmount),
          status: fineEditStatus,
          reason: fineEditReason
        })
      });
      if (res.ok) {
        alert('Success! Fine modified and recorded perfectly.');
        setEditingFine(null);
        await reloadTransactions();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update fine record');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating fine record properties');
    } finally {
      setSavingFineLoading(false);
    }
  };

  // Direct fast cash intake receipt registrar
  const handleDirectPayFine = async (fineId: string) => {
    if (!window.confirm("Students has deposited the cash? Mark this outstanding fine as PAID?")) return;
    try {
      const res = await fetch(`/api/admin/fines/${fineId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID' })
      });
      if (res.ok) {
        alert("Cash intake received! Fine marked successfully as PAID.");
        await reloadTransactions();
      } else {
        alert("Failed to process cash intake.");
      }
    } catch (e) {
      console.error("Error setting fine payment", e);
    }
  };

  // Book CRUD modifications
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingBook ? `/api/books/${editingBook.id}` : '/api/books';
      const method = editingBook ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert(editingBook ? "Book updated successfully!" : "New Book added into catalog shelf!");
        setEditingBook(null);
        setShowAddBook(false);
        setFormData({
          title: '', author: '', category: 'Computer Science', isbn: '',
          imageUrl: '', description: '', publisher: '', publishDate: '',
          pageCount: 300, format: 'Paperback' as any, copiesCount: 3, location: 'Level 1, Room 101',
          pdfUrl: '', ebookContentText: ''
        });
        loadBooks();
      } else {
        alert("Failed to save book parameters.");
      }
    } catch (e) {
      alert("Error committing updates.");
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm("Are you sure you want to permanently delete this book from catalog shelves?")) return;
    try {
      const res = await fetch(`/api/books/${bookId}`, { method: 'DELETE' });
      if (res.ok) {
        alert("Book removed from database!");
        loadBooks();
      } else {
        alert("Could not update index.");
      }
    } catch (e) {
      alert("Error removing book.");
    }
  };

  const handleEditClick = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      category: book.category,
      isbn: book.isbn,
      imageUrl: book.imageUrl || '',
      description: book.description || '',
      publisher: book.publisher || '',
      publishDate: book.publishDate || '',
      pageCount: book.pageCount,
      format: book.format || 'Paperback',
      copiesCount: book.copiesCount,
      location: book.location || 'Level 1, Room 101',
      pdfUrl: book.pdfUrl || '',
      ebookContentText: book.ebookContentText || ''
    });
    setShowAddBook(true);
  };

  // Member management actions (Fulfills requested student management specs!)
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name || !memberForm.rollNumber) {
      alert("Please provide the Student Name and Roll Number.");
      return;
    }
    
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberForm)
      });
      if (res.ok) {
        alert("Student registered into library roster successfully! Roll automatically formatted with appropriate indicators.");
        setShowAddMember(false);
        setMemberForm({
          name: '',
          password: 'student123',
          rollNumber: '',
          department: 'CST',
          semester: 1
        });
        loadAdminStats();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to register student.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to backend for student registration.");
    }
  };

  const handleDeleteMember = async (rollNumber: string) => {
    if (!confirm(`Are you sure you want to permanently delete user ${rollNumber}?`)) return;
    try {
      const res = await fetch(`/api/students/${rollNumber}`, { method: 'DELETE' });
      if (res.ok) {
        alert("Student records wiped successfully.");
        loadAdminStats();
      } else {
        alert("Failed to delete user directory info.");
      }
    } catch (err) {
      console.error(err);
      alert("Error removing student portfolio.");
    }
  };

  // OpenLibrary import handlers
  const handleOlSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!olQuery.trim()) return;
    setOlLoading(true);
    setOlResults([]);
    try {
      const res = await fetch(`/api/openlibrary/search?q=${encodeURIComponent(olQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setOlResults(data);
      } else {
        alert("Open Library search failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Error contacting external OpenLibrary API.");
    } finally {
      setOlLoading(false);
    }
  };

  const handleOlImport = async (book: any) => {
    try {
      const res = await fetch('/api/books/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book, category: importCategory })
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Success! "${book.title}" imported into database stacks.`);
        loadBooks();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to import catalog volume.");
      }
    } catch (e) {
      alert("Error importing catalog book.");
    }
  };

  // Printable auditing reports
  const printReport = (reportType: string) => {
    let reportTitle = "ScholarLib System Audit Report";
    let headers: string[] = [];
    let rows: any[][] = [];

    if (reportType === 'overdue') {
      reportTitle = "Overdue Books Audit List";
      headers = ["Record ID", "Book Title", "Student Roll", "Due Date", "Days Overdue / Fine Amount"];
      rows = borrowRecords.filter(b => b.status === 'BORROWED' && new Date() > new Date(b.dueDate)).map(r => {
        const diffTime = Math.abs(new Date().getTime() - new Date(r.dueDate).getTime());
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1;
        return [r.id, r.bookTitle, r.studentRoll, new Date(r.dueDate).toLocaleDateString(), `${days} days (BDT ${r.fineAmount})`];
      });
    } else if (reportType === 'students') {
      reportTitle = "Outstanding Student Fines Ledger";
      headers = ["Student Name", "Roll Number", "Department", "Semester", "Penalty Balance"];
      rows = students.map((s, idx) => {
        const unpaidFine = fines.filter(f => (f.studentRoll || '').toUpperCase() === (s.rollNumber || '').toUpperCase() && f.status === 'UNPAID').reduce((sum, f) => sum + f.amount, 0);
        return [s.name, s.rollNumber, s.department, s.semester, `BDT ${unpaidFine}`];
      });
    } else {
      reportTitle = "Whole Library Active Loans Registry";
      headers = ["Record ID", "Book Title", "Borrower Roll", "Out Date", "Status"];
      rows = borrowRecords.map(r => [r.id, r.bookTitle, r.studentRoll, new Date(r.borrowDate).toLocaleDateString(), r.status]);
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${reportTitle}</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #1e293b; }
            h1 { color: #1d4ed8; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 30px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; font-size: 13px; }
            th { background-color: #f8fafc; font-weight: bold; }
            .date { font-size: 11px; text-align: right; color: #64748b; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <h1>ScholarLib Systems: ${reportTitle}</h1>
          <p>Audited database.json report compiled on ${new Date().toLocaleString()}. Compliant with library roster standards.</p>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
              ${rows.length === 0 ? `<tr><td colspan="${headers.length}" style="text-align:center;">No records meet audit criteria.</td></tr>` : ''}
            </tbody>
          </table>
          <p class="date">Authority Signature: ScholarLib Administration Desk</p>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const exportExcel = (reportType: string) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (reportType === 'overdue') {
      csvContent += "Record ID,Book Title,Student Roll,Due Date,Fine (BDT)\n";
      borrowRecords.filter(r => r.fineAmount > 0).forEach(r => {
        csvContent += `"${r.id}","${r.bookTitle}","${r.studentRoll}","${new Date(r.dueDate).toLocaleDateString()}",${r.fineAmount}\n`;
      });
    } else {
      csvContent += "Roll Number,Student Name,Department,Semester\n";
      students.forEach(s => {
        csvContent += `"${s.rollNumber}","${s.name}","${s.department}",${s.semester}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `scholarlib_${reportType}_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filters
  const localBooksFilter = books.filter(b => 
    (b.title || '').toLowerCase().includes((bookQuery || '').toLowerCase()) || 
    (b.author || '').toLowerCase().includes((bookQuery || '').toLowerCase()) || 
    (b.isbn || '').includes(bookQuery || '')
  );

  const studentsFilter = students.filter(s => 
    (s.name || '').toLowerCase().includes((studentQuery || '').toLowerCase()) || 
    (s.rollNumber || '').toLowerCase().includes((studentQuery || '').toLowerCase()) ||
    (s.department || '').toLowerCase().includes((studentQuery || '').toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800 relative" id="superintendent-console">
      
      {/* 1. MOBILE COLLAPSIBLE DRAWER PORTAL (Floating Overlay with high z-index) */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden animate-fade-in" id="mobile-sidebar-backdrop">
          {/* Shroud background */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          ></div>
          
          {/* Sliding panel drawer container */}
          <div className="relative flex w-64 max-w-xs flex-col bg-slate-900 text-slate-300 shadow-2xl" id="mobile-sidebar-panel">
            {/* Close button in drawer */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <span className="text-white font-bold text-xs uppercase tracking-wider">ScholarLib Console</span>
              <button 
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-850 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Micro navigation */}
            <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
              {[
                { id: 'analytics', label: 'Dashboard', icon: BarChart2, badge: null },
                { id: 'support', label: 'Support Centre', icon: MessageSquare, badge: supportMessages.filter((m: any) => m.status === 'PENDING').length || null },
                { id: 'students', label: 'Members Directory', icon: Users, badge: students.length },
                { id: 'books', label: 'Books Database', icon: BookOpen, badge: books.length },
                { id: 'notices', label: 'Notice Board', icon: Megaphone, badge: null },
                { id: 'branding', label: 'Institution Branding', icon: Settings, badge: null },
                { id: 'sliders', label: 'Hero Banner Slides', icon: ImageIcon, badge: null },
                { id: 'librarians', label: 'Librarians Staff', icon: Shield, badge: librarians.length },
                { id: 'gallery', label: 'Library Gallery', icon: ImageIcon, badge: galleryItems.length },
                { id: 'approvals', label: 'Check-out Desk', icon: CheckSquare, badge: borrowRecords.filter(r => r.status === 'PENDING_APPROVE' || r.status === 'PENDING_RETURN').length || null },
                { id: 'fines', label: 'Fines Register', icon: DollarSign, badge: fines.filter(f => f.status === 'UNPAID').length || null },
                { id: 'reports', label: 'Audit Reports', icon: FileText, badge: null },
                { id: 'settings', label: 'Console Settings', icon: Settings, badge: null },
                { id: 'help', label: 'Documentation', icon: HelpCircle, badge: null }
              ].map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setSelectedStudentRollForIssues(null);
                      setIsMobileSidebarOpen(false); // Auto close
                    }}
                    className={`w-full rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer px-4 py-3 ${
                      isActive 
                        ? 'bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] text-white shadow-md font-bold' 
                        : 'hover:bg-slate-800 hover:text-white text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== null && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold ${isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-800 text-slate-400'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Drawer Footer profile */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex gap-3 items-center">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-xs shrink-0">
                AD
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Librarian Admin</p>
                <p className="text-[10px] text-slate-400 font-mono">ScholarLib Manager</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. DESKTOP PERMANENT COLLAPSIBLE SIDEBAR (Hidden on portable, flex under high breakpoint) */}
      <aside className={`hidden lg:flex flex-col justify-between shrink-0 bg-slate-900 text-slate-300 border-r border-slate-800 select-none transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-64'}`} id="desktop-sidebar">
        <div>
          {/* Sidebar Brand Header */}
          <div className={`border-b border-slate-800 flex bg-slate-950 items-center justify-between ${isSidebarCollapsed ? 'flex-col gap-3 py-4 px-2' : 'p-6'}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg text-white shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              {!isSidebarCollapsed && (
                <div className="transition-all duration-200 text-left">
                  <h1 className="text-sm font-bold text-white tracking-wide uppercase">ScholarLib</h1>
                  <p className="text-[10px] text-slate-500 font-mono">CST Technical Suite</p>
                </div>
              )}
            </div>
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Menus */}
          <nav className={`p-4 ${isSidebarCollapsed ? 'space-y-3' : 'space-y-1'}`}>
            {[
              { id: 'analytics', label: 'Dashboard', icon: BarChart2, badge: null },
              { id: 'support', label: 'Support Centre', icon: MessageSquare, badge: supportMessages.filter((m: any) => m.status === 'PENDING').length || null },
              { id: 'students', label: 'Members Directory', icon: Users, badge: students.length },
              { id: 'books', label: 'Books Database', icon: BookOpen, badge: books.length },
              { id: 'notices', label: 'Notice Board', icon: Megaphone, badge: null },
              { id: 'branding', label: 'Institution Branding', icon: Settings, badge: null },
              { id: 'sliders', label: 'Hero Banner Slides', icon: ImageIcon, badge: null },
              { id: 'librarians', label: 'Librarians Staff', icon: Shield, badge: librarians.length },
              { id: 'gallery', label: 'Library Gallery', icon: ImageIcon, badge: galleryItems.length },
              { id: 'approvals', label: 'Check-out Desk', icon: CheckSquare, badge: borrowRecords.filter(r => r.status === 'PENDING_APPROVE' || r.status === 'PENDING_RETURN').length || null },
              { id: 'fines', label: 'Fines Register', icon: DollarSign, badge: fines.filter(f => f.status === 'UNPAID').length || null },
              { id: 'reports', label: 'Audit Reports', icon: FileText, badge: null },
              { id: 'settings', label: 'Console Settings', icon: Settings, badge: null },
              { id: 'help', label: 'Documentation', icon: HelpCircle, badge: null }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setSelectedStudentRollForIssues(null);
                  }}
                  className={`w-full rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer relative ${
                    isSidebarCollapsed ? 'justify-center p-3' : 'px-4 py-3'
                  } ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] text-white shadow-md font-bold' 
                      : 'hover:bg-slate-800 hover:text-white text-slate-400'
                  }`}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                    <Icon className={`${isSidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4'} shrink-0`} />
                    {!isSidebarCollapsed && <span className="transition-all duration-200">{item.label}</span>}
                  </div>
                  {item.badge !== null && (
                    isSidebarCollapsed ? (
                      <span className="absolute top-1.5 right-1.5 text-[8px] h-4 min-w-4 px-1 flex items-center justify-center rounded-full font-mono bg-red-500 text-white font-bold leading-none scale-90">
                        {item.badge}
                      </span>
                    ) : (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold ${isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-800 text-slate-400'}`}>
                        {item.badge}
                      </span>
                    )
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer info */}
        <div className={`border-t border-slate-800 bg-slate-950/50 flex ${isSidebarCollapsed ? 'p-2 justify-center' : 'p-4 gap-3'} items-center select-none`}>
          <div className="w-8 h-8 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-xs shrink-0" title="Librarian Admin">
            AD
          </div>
          {!isSidebarCollapsed && (
            <div className="transition-all duration-200 text-left">
              <p className="text-xs font-semibold text-white">Librarian Admin</p>
              <p className="text-[10px] text-slate-400 font-mono">ScholarLib Manager</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Panel Area (Scrollable with smooth scrolling) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative overflow-y-auto">
        
        {/* Responsive dual header row (hamburger visible on hidden screens) */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs select-none sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for mobile drawer toggle */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-5.5 h-5.5" />
            </button>
            <div className="flex items-center gap-2">
              <Cpu className="text-blue-600 w-4 h-4 block" />
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono hidden sm:block">ADMIN CENTRAL DESK // LEVEL SECURE</h2>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono sm:hidden">ADMIN SUITE</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={reloadTransactions}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Synchronize indices"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" /> <span className="hidden md:inline">SYNC ALL INDICES</span>
            </button>
            <span className="text-xs text-slate-400 font-mono shrink-0">Logged: ADMIN01</span>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
          
          {/* ==================== TAB 1: ANALYTICS PANEL ==================== */}
          {activeTab === 'analytics' && (
            <div className="space-y-8 animate-fade-in" id="analytics-tab">
              <div className="border-b border-slate-200 pb-4">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Superintendent Analytics Overview</h1>
                <p className="text-xs text-slate-500 mt-1">Real-time compilation of stack indices, loans registry, page capacities, and outstanding fines.</p>
              </div>

              {/* Grid 1: Numerical statistical panels with green/red variance pills */}
              {analytics ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
                  <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs transition-shadow hover:shadow-sm">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Borrowed Books</p>
                    <div className="flex items-baseline justify-between mt-2">
                      <p className="text-2xl font-bold font-mono text-slate-900">{analytics.activeBorrows || 0}</p>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">+23%</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 font-mono">Issued items out of the stacks</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs transition-shadow hover:shadow-sm">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Volumes Capacity</p>
                    <div className="flex items-baseline justify-between mt-2">
                      <p className="text-2xl font-bold font-mono text-slate-900">{analytics.totalPhysicalBooksSum || 0}</p>
                      <span className="text-[10px] bg-red-55 text-red-700 border border-red-100 px-2 py-0.5 rounded-full font-bold">-14%</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 font-mono">Physical copies in local stacks</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs transition-shadow hover:shadow-sm">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Outstanding Overdues</p>
                    <div className="flex items-baseline justify-between mt-2">
                      <p className="text-2xl font-bold font-mono text-rose-600">
                        {borrowRecords.filter(r => r.status === 'BORROWED' && new Date() > new Date(r.dueDate)).length}
                      </p>
                      <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-full font-bold">+11%</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 font-mono">Requires collection check-in</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs transition-shadow hover:shadow-sm">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Active Members</p>
                    <div className="flex items-baseline justify-between mt-2">
                      <p className="text-2xl font-bold font-mono text-slate-900">{students.length}</p>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">+395 new</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 font-mono">Seeded catalog & dynamic users</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-400 font-semibold tracking-wider font-mono">COMPILING STATISTICAL INDICATORS...</div>
              )}

              {/* Grid 2: Second group of stats cards mentioned: Total Books, Visitors, New Members, Pending Fees */}
              {analytics && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
                  <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Books (including digital)</p>
                    <p className="text-2xl font-bold font-mono mt-2 text-blue-650">{books.length}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">Uniquely indexed titles catalog</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Unpaid Fines Amount</p>
                    <p className="text-2xl font-bold font-mono mt-2 text-rose-600">BDT {analytics.unpaidFinesTotal || 0}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">Outstanding collection penalties</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Collected Fines</p>
                    <p className="text-2xl font-bold font-mono mt-2 text-green-700 font-mono">BDT {analytics.collectedFinesTotal || 0}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">Paid desk ledger totals</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Library Visitors</p>
                    <p className="text-2xl font-bold font-mono mt-2 text-slate-800">4,120</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">Audited terminal entries (month)</p>
                  </div>
                </div>
              )}

              {/* Graphic charts row */}
              {analytics && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                    <h4 className="font-sans font-bold text-slate-900 text-xs uppercase tracking-wider mb-6 flex items-center gap-1.5">
                      <TrendingUp className="w-5 h-5 text-blue-600" /> Book Distribution by Catalog Categories
                    </h4>
                    <div className="h-72 w-full text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.categoriesData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" stroke="#64748b" tickFormatter={(v) => v.substring(0, 10) + '..'} />
                          <YAxis stroke="#64748b" />
                          <Tooltip />
                          <Bar dataKey="value" name="Catalog Volumes" fill="#2563eb" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                    <h4 className="font-sans font-bold text-slate-900 text-xs uppercase tracking-wider mb-6 flex items-center gap-1.5">
                      <BarChart2 className="w-5 h-5 text-blue-600" /> Monthly Lending Activity & Reads Trend (6 mos)
                    </h4>
                    <div className="h-72 w-full text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.monthlyLoans}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="month" stroke="#64748b" />
                          <YAxis stroke="#64748b" />
                          <Tooltip />
                          <Legend />
                          <Area type="monotone" dataKey="loans" name="Physical Loans" stroke="#2563eb" fill="#2563eb" fillOpacity={0.06} strokeWidth={2} />
                          <Area type="monotone" dataKey="digital" name="Digital E-Book" stroke="#10b981" fill="#10b981" fillOpacity={0.04} strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Dual tables of Overdue and Recent Checkouts as requested in image reference */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Left Table Panel: Overdues History */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs select-none">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-950 text-xs uppercase tracking-wider flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500" /> Overdue's History / Collectible Fines
                    </h3>
                    <span className="text-[10px] font-mono font-bold bg-rose-50 text-rose-700 px-2 py-0.5 border border-rose-100 rounded-md">
                      {borrowRecords.filter(r => r.status === 'BORROWED' && new Date() > new Date(r.dueDate)).length} overdue
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="text-slate-400 uppercase tracking-widest text-[9px] border-b border-slate-100">
                          <th className="py-2">Member ID</th>
                          <th className="py-2">Title</th>
                          <th className="py-2">Due Date</th>
                          <th className="py-2 text-right">Fine</th>
                        </tr>
                      </thead>
                      <tbody>
                        {borrowRecords.filter(r => r.status === 'BORROWED' && new Date() > new Date(r.dueDate)).slice(0, 5).map(req => (
                          <tr key={req.id} className="border-b border-slate-50 last:border-none">
                            <td className="py-2.5 font-mono font-bold text-slate-900">{req.studentRoll}</td>
                            <td className="py-2.5 text-slate-700 font-medium truncate max-w-[150px]">{req.bookTitle}</td>
                            <td className="py-2.5 text-slate-500 font-sans">{new Date(req.dueDate).toLocaleDateString()}</td>
                            <td className="py-2.5 text-right font-mono text-rose-600 font-bold">BDT {req.fineAmount}</td>
                          </tr>
                        ))}
                        {borrowRecords.filter(r => r.status === 'BORROWED' && new Date() > new Date(r.dueDate)).length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-slate-400">Excellent! No books are currently recorded as overdue.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Table Panel: Recent Checkouts */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs select-none">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-950 text-xs uppercase tracking-wider flex items-center gap-2">
                      <BookCheck className="w-4 h-4 text-emerald-500" /> Recent Library Check-outs
                    </h3>
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      Global Logs
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="text-slate-400 uppercase tracking-widest text-[9px] border-b border-slate-100">
                          <th className="py-2">ISBN</th>
                          <th className="py-2">Title</th>
                          <th className="py-2">Member</th>
                          <th className="py-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {borrowRecords.slice(0, 5).map(req => (
                          <tr key={req.id} className="border-b border-slate-50 last:border-none">
                            <td className="py-2.5 font-mono text-slate-500">book-{req.bookId.split('-').pop()}</td>
                            <td className="py-2.5 text-slate-705 font-medium truncate max-w-[130px]">{req.bookTitle}</td>
                            <td className="py-2.5 font-bold text-slate-800 font-mono text-[10px]">{req.studentRoll}</td>
                            <td className="py-2.5 text-center">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                req.status === 'RETURNED'
                                  ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                                  : req.status === 'BORROWED'
                                  ? 'bg-blue-50 border border-blue-100 text-blue-700'
                                  : 'bg-amber-50 border border-amber-150 text-amber-700'
                              }`}>
                                {req.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {borrowRecords.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-slate-400">No loan operations recorded in database.json yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ==================== TAB 2: MEMBERS MANAGEMENT (Durable Dynamic Custom Users) ==================== */}
          {activeTab === 'students' && (
            <div className="space-y-6 animate-fade-in" id="members-tab">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5 mb-6">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">Library Members Directory</h1>
                  <p className="text-xs text-slate-500 mt-1">Add, update, or cancel user student profiles. View active loans and calculated overdue penalties per student index.</p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowAddMember(true)}
                    className="h-12 rounded-[14px] text-white font-semibold bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] hover:brightness-[106%] hover:-translate-y-0.5 shadow-md px-5 text-xs transition-all cursor-pointer flex items-center gap-1.5"
                    id="add-member-btn"
                  >
                    <UserPlus className="w-4 h-4" /> Add Member Profile
                  </button>
                  <button 
                    onClick={() => exportExcel('members')}
                    className="btn-premium-secondary text-xs"
                  >
                    <Download className="w-4 h-4 mr-1.5" /> Export CSV
                  </button>
                </div>
              </div>

              {/* SEARCH ALIGNMENT */}
              <div className="relative w-full max-w-md select-none bg-white p-1 shadow-xs border border-slate-200 rounded-[14px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search Member ID, Register, Department, Name..." 
                  value={studentQuery}
                  onChange={e => setStudentQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 text-xs focus:outline-none font-sans text-slate-800 bg-transparent"
                  id="student-search-box"
                />
              </div>

              {/* DYNAMIC ADD STUDENT DIALOG / COLLAPSIBLE FORM CONTAINER */}
              {showAddMember && (
                <div className="bg-slate-50 border border-slate-200 rounded-[20px] p-6 shadow-xs animate-fade-in">
                  <div className="flex justify-between items-center border-b border-slate-150 pb-3 mb-5">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <UserPlus className="w-4.5 h-4.5 text-[#1E40AF]" /> New Student Registration Form
                    </h3>
                    <button onClick={() => setShowAddMember(false)} className="text-slate-400 hover:text-black cursor-pointer">
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>
                  
                  <form onSubmit={handleSaveMember} className="grid grid-cols-1 md:grid-cols-4 gap-5 text-xs font-sans">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">Full Student Name</label>
                      <input 
                        type="text" 
                        value={memberForm.name} 
                        onChange={e => setMemberForm({ ...memberForm, name: e.target.value })}
                        className="w-full border border-slate-200 focus:ring-2 focus:ring-blue-105/45 focus:border-blue-500 rounded-[14px] h-14 px-4 text-xs font-semibold text-slate-800 bg-white placeholder-slate-400" 
                        placeholder="Md. Rafid Islam"
                        required 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">Default password</label>
                      <input 
                        type="password" 
                        value={memberForm.password} 
                        onChange={e => setMemberForm({ ...memberForm, password: e.target.value })}
                        className="w-full border border-slate-205 focus:ring-2 focus:ring-blue-105/45 focus:border-blue-500 rounded-[14px] h-14 px-4 text-xs font-semibold text-slate-800 bg-white font-mono placeholder-slate-400" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">Roll Index / UID</label>
                      <input 
                        type="text" 
                        value={memberForm.rollNumber} 
                        onChange={e => setMemberForm({ ...memberForm, rollNumber: e.target.value })}
                        className="w-full border border-slate-205 focus:ring-2 focus:ring-blue-105/45 focus:border-blue-500 rounded-[14px] h-14 px-4 text-xs font-bold text-slate-800 bg-white font-mono placeholder-slate-400 uppercase" 
                        placeholder="e.g. 150 or CST-150"
                        required 
                      />
                      <span className="text-[9px] text-[#1E40AF] block mt-1.5 font-bold font-mono">Numbers auto-formatted as CST-roll</span>
                    </div>
                    
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">Department Course</label>
                      <select 
                        value={memberForm.department} 
                        onChange={e => setMemberForm({ ...memberForm, department: e.target.value })}
                        className="w-full border border-slate-205 focus:ring-2 focus:ring-blue-105/45 focus:border-blue-500 rounded-[14px] h-14 px-4 text-xs font-bold text-slate-800 bg-white"
                      >
                        {["CST", "ENT", "CE", "ME", "PE", "CSE", "BBA", "ENG"].map(d => (
                          <option key={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">Academic Semester</label>
                      <select 
                        value={memberForm.semester} 
                        onChange={e => setMemberForm({ ...memberForm, semester: parseInt(e.target.value, 10) })}
                        className="w-full border border-slate-205 focus:ring-2 focus:ring-blue-105/45 focus:border-blue-500 rounded-[14px] h-14 px-4 text-xs font-bold text-slate-800 bg-white font-mono"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                          <option key={s} value={s}>{s}st/th Semester</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-4 flex justify-end gap-3 mt-3 border-t border-slate-200 pt-4">
                      <button 
                        type="button" 
                        onClick={() => setShowAddMember(false)} 
                        className="btn-premium-secondary text-xs h-12"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="btn-premium-primary text-xs h-12"
                      >
                        Register Member Information
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* MAIN REPORTERS TABLE */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse font-sans text-slate-600">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-205 text-slate-400 uppercase tracking-widest text-[9px] font-bold select-none">
                        <th className="py-3.5 px-6">Member ID / Register</th>
                        <th className="py-3.5 px-6">Name</th>
                        <th className="py-3.5 px-6">Department</th>
                        <th className="py-3.5 px-6">Class/Term</th>
                        <th className="py-3.5 px-6">Issued Active Books</th>
                        <th className="py-3.5 px-6 text-right">Fines Outstanding</th>
                        <th className="py-3.5 px-4 text-center">Action Portfolio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentsFilter.map((st) => {
                        const activeBorrowCount = borrowRecords.filter(r => (r.studentRoll || '').toUpperCase() === (st.rollNumber || '').toUpperCase() && r.status !== 'RETURNED').length;
                        const unpaidFineSum = fines.filter(f => (f.studentRoll || '').toUpperCase() === (st.rollNumber || '').toUpperCase() && f.status === 'UNPAID').reduce((sum, f) => sum + f.amount, 0);
                        const isExpanded = selectedStudentRollForIssues === st.rollNumber;
                        
                        return (
                          <React.Fragment key={st.rollNumber}>
                            <tr className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-6 font-mono font-bold text-slate-900">{st.rollNumber}</td>
                              <td className="py-4 px-6 font-medium text-slate-900 flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] font-sans">
                                  {(st.name || '').substring(0, 2).toUpperCase()}
                                </div>
                                {st.name}
                              </td>
                              <td className="py-4 px-6 select-all font-semibold text-slate-600">
                                <span className="bg-slate-100 border border-slate-200 text-slate-750 font-semibold px-2 py-0.5 rounded text-[10px] font-mono">
                                  {st.department}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-slate-600">Semester {st.semester}</td>
                              <td className="py-4 px-6 font-semibold">
                                {activeBorrowCount > 0 ? (
                                  <button 
                                    onClick={() => setReviewedStudent(st)}
                                    className="text-blue-600 hover:scale-[1.01] active:scale-[0.99] font-bold flex items-center gap-1 bg-blue-50/40 px-2 py-1 rounded border border-blue-105 cursor-pointer transition-transform"
                                    title="Click to view checked-out copies in profile portal"
                                  >
                                    <BookOpenCheck className="w-3.5 h-3.5" />
                                    <span>{activeBorrowCount} Copy{activeBorrowCount > 1 ? 'ies' : ''} held</span>
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-[11px] font-normal font-sans">No checked-out copies</span>
                                )}
                              </td>
                              <td 
                                onClick={() => setReviewedStudent(st)}
                                className={`py-4 px-6 text-right font-mono font-bold select-none cursor-pointer hover:underline ${unpaidFineSum > 0 ? 'text-rose-600 hover:text-rose-700' : 'text-slate-400'}`}
                                title="Click to review/manage fines and fees"
                              >
                                {unpaidFineSum > 0 ? `BDT ${unpaidFineSum}` : '0 (Clear)'}
                              </td>
                              <td className="py-4 px-4 text-center">
                                <div className="flex gap-2.5 justify-center">
                                  <button 
                                    onClick={() => setReviewedStudent(st)}
                                    className="px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded text-[10px] font-bold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer select-none"
                                    title="View full profile, borrow history & clearance"
                                  >
                                    Review
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteMember(st.rollNumber)}
                                    className="px-2 py-1 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded text-[10px] font-bold transition-all cursor-pointer select-none"
                                    title="Cancel member profile directory"
                                  >
                                    <Trash className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* COLLAPSIBLE DETAIL SUB-ROW COMPLYING WITH REQUIREMENT FOR SEEING WHICH USER HAS WHICH BOOK, COPIES, DUEDATE, FINES */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={7} className="bg-slate-50/75 p-6 border-b border-slate-105">
                                  <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs max-w-4xl animate-fade-in space-y-4">
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                                        <Info className="w-4 h-4 text-blue-600" /> Active lending portfolio audit // {st.name} ({st.rollNumber})
                                      </h4>
                                      <button 
                                        onClick={() => setSelectedStudentRollForIssues(null)}
                                        className="text-[10px] text-slate-400 hover:text-slate-900 border border-slate-200 px-2 py-0.5 rounded cursor-pointer"
                                      >
                                        Hide details
                                      </button>
                                    </div>

                                    {/* LIST CORRESPONDING COPIES */}
                                    <div className="space-y-4">
                                      {borrowRecords.filter(r => (r.studentRoll || '').toUpperCase() === (st.rollNumber || '').toUpperCase() && r.status !== 'RETURNED').length === 0 ? (
                                        <p className="text-xs text-slate-400 py-3">No active physical books are checked out under this member registry.</p>
                                      ) : (
                                        <div className="divide-y divide-slate-100">
                                          {borrowRecords.filter(r => (r.studentRoll || '').toUpperCase() === (st.rollNumber || '').toUpperCase() && r.status !== 'RETURNED').map(loan => {
                                            const isOverdue = new Date() > new Date(loan.dueDate);
                                            return (
                                              <div key={loan.id} className="py-3 flex justify-between items-center text-xs">
                                                <div>
                                                  <p className="font-bold text-slate-900">"{loan.bookTitle}"</p>
                                                  <p className="text-[10px] text-slate-405 font-mono mt-0.5">Loan ID: {loan.id} | Issued Date: {new Date(loan.borrowDate).toLocaleDateString()}</p>
                                                </div>
                                                <div className="text-right space-y-1">
                                                  <p className="font-sans text-slate-650">Return Due: <strong className="font-mono text-slate-900">{new Date(loan.dueDate).toLocaleDateString()}</strong></p>
                                                  <div className="flex gap-2 justify-end items-center">
                                                    {isOverdue ? (
                                                      <span className="bg-rose-50 border border-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono">
                                                        Overdue fine BDT {loan.fineAmount}
                                                      </span>
                                                    ) : (
                                                      <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono">
                                                        On Track
                                                      </span>
                                                    )}
                                                    
                                                    {/* Return transaction receiver shortcut */}
                                                    <button 
                                                      onClick={() => handleReceiveReturn(loan.id)}
                                                      className="bg-[#1E40AF] hover:bg-[#1E40AF]/90 text-white font-semibold text-[9.5px] uppercase tracking-wider px-3 py-1 rounded-[6px] cursor-pointer transition-all active:scale-95 shadow-xs"
                                                    >
                                                      Return book
                                                    </button>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}

                      {studentsFilter.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">No results matched your parameters inside active member directory.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 3: BOOKS DATABASE (CRUD & OPENLIBRARY IMPORT) ==================== */}
          {activeTab === 'books' && (
            <div className="space-y-6 animate-fade-in" id="books-crud-tab">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5 mb-6">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">Catalog Books Database</h1>
                  <p className="text-xs text-slate-500 mt-1">Submit new publications, or edit shelf locations directly inside localized system stacks.</p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setEditingBook(null);
                      setFormData({
                        title: '', author: '', category: 'Computer Science', isbn: '',
                        imageUrl: '', description: '', publisher: '', publishDate: '',
                        pageCount: 300, format: 'Paperback' as any, copiesCount: 3, location: 'Level 1, Room 101',
                        pdfUrl: '', ebookContentText: ''
                      });
                      setShowAddBook(true);
                    }}
                    className="h-12 rounded-[14px] text-white font-semibold bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] hover:brightness-[106%] hover:-translate-y-0.5 shadow-md px-5 text-xs transition-all cursor-pointer flex items-center gap-1.5"
                    id="add-volume-btn"
                  >
                    <Plus className="w-4 h-4" /> Add Publication Volume
                  </button>
                </div>
              </div>

              {/* SEARCH BOX */}
              <div className="relative w-full max-w-sm select-none bg-white p-1 shadow-xs border border-slate-200 rounded-[14px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search database books title, author, isbn..." 
                  value={bookQuery}
                  onChange={e => setBookQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 text-xs focus:outline-none font-sans text-slate-800 bg-transparent"
                  id="search-books-db"
                />
              </div>

              {/* OPENLIBRARY DRAWER CONTAINER DISPLAY */}
              {showImportDrawer && (
                <div className="bg-slate-900 text-slate-100 rounded-xl p-6 border border-slate-800 shadow-md animate-fade-in select-none">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                    <h3 className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-2">
                      <Download className="w-4 h-4 text-emerald-500" /> Dynamic Catalog search OpenLibrary importer
                    </h3>
                    <button onClick={() => setShowImportDrawer(false)} className="text-slate-500 hover:text-white cursor-pointer">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <form onSubmit={handleOlSearch} className="flex flex-wrap items-center gap-4 mb-4">
                    <input 
                      type="text" 
                      placeholder="Search title, genre, author, publisher..." 
                      value={olQuery}
                      onChange={e => setOlQuery(e.target.value)}
                      className="border border-slate-700 bg-slate-950 text-slate-100 p-2.5 text-xs rounded-lg min-w-[280px]" 
                    />
                    <select 
                      value={importCategory}
                      onChange={e => setImportCategory(e.target.value)}
                      className="border border-slate-705 bg-slate-955 text-slate-100 p-2.5 text-xs rounded-lg font-sans"
                    >
                      {["Computer Science", "Programming", "Networking", "Cyber Security", "Artificial Intelligence", "Machine Learning", "Mathematics", "Physics", "Chemistry"].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <button 
                      type="submit" 
                      className="bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] hover:brightness-[106%] text-white font-semibold text-xs tracking-wider px-5 py-3 rounded-[12px] cursor-pointer transition-all active:scale-95 shadow-sm"
                    >
                      {olLoading ? 'Fetching Catalog...' : 'Contact OpenLibrary'}
                    </button>
                  </form>

                  {/* RESULTS SCROLLABLE GRID */}
                  <div className="max-h-72 overflow-y-auto space-y-3 pr-2 divide-y divide-slate-800">
                    {olResults.slice(0, 10).map((b, i) => (
                      <div key={i} className="pt-3 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-white">"{b.title}"</p>
                          <p className="text-[10px] text-slate-400 mt-1">Author: {b.author || 'Unknown'} | ISBN: {b.isbn || 'N/A'} | Pages: {b.pageCount || 'N/A'}</p>
                        </div>
                        <button 
                          onClick={() => handleOlImport(b)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-[8px] cursor-pointer transition-all active:scale-95 shadow-sm"
                        >
                          Import Volume
                        </button>
                      </div>
                    ))}
                    {olResults.length === 0 && !olLoading && (
                      <p className="text-center py-6 text-slate-500 font-medium">Type academic titles above to fetch free real Metadata specifications from the OpenLibrary directory.</p>
                    )}
                  </div>
                </div>
              )}
                             {showAddBook && (
                <div className="bg-slate-50 border border-slate-200 rounded-[20px] p-6 shadow-xs">
                  <div className="flex justify-between items-center border-b border-slate-150 pb-3 mb-5">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-[#1E40AF]" />
                      {editingBook ? 'Modify existing catalog specifications' : 'Catalog New Book registration'}
                    </h4>
                    <button onClick={() => setShowAddBook(false)} className="text-slate-400 hover:text-black cursor-pointer">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <form onSubmit={handleSaveBook} className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">Book Title</label>
                      <input 
                        type="text" 
                        value={formData.title} 
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full border border-slate-200 focus:ring-2 focus:ring-blue-105/45 focus:border-blue-500 rounded-[14px] h-14 px-4 text-xs font-semibold text-slate-800 bg-white placeholder-slate-400" 
                        placeholder="Principles of Quantum Mechanics"
                        required 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">Author Name</label>
                      <input 
                        type="text" 
                        value={formData.author} 
                        onChange={e => setFormData({ ...formData, author: e.target.value })}
                        className="w-full border border-slate-200 focus:ring-2 focus:ring-blue-105/45 focus:border-blue-500 rounded-[14px] h-14 px-4 text-xs font-semibold text-slate-800 bg-white placeholder-slate-400" 
                        placeholder="R. Shankar"
                        required 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">ISBN Code</label>
                      <input 
                        type="text" 
                        value={formData.isbn} 
                        onChange={e => setFormData({ ...formData, isbn: e.target.value })}
                        className="w-full border border-slate-205 focus:ring-2 focus:ring-blue-105/45 focus:border-blue-500 rounded-[14px] h-14 px-4 text-xs font-bold text-slate-800 bg-white font-mono placeholder-slate-400 uppercase" 
                        placeholder="978-0306447908"
                        required 
                      />
                    </div>
                    
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">Category Discipline</label>
                      <select 
                        value={formData.category} 
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="w-full border border-slate-205 focus:ring-2 focus:ring-blue-105/45 focus:border-blue-500 rounded-[14px] h-14 px-4 text-xs font-semibold text-slate-800 bg-white"
                      >
                        {["Computer Science", "Programming", "Networking", "Cyber Security", "Artificial Intelligence", "Machine Learning", "Data Science", "Mathematics", "Physics", "Chemistry", "Literature", "History", "Biography", "Novels", "Research Books"].map(c => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">Copies Stock count</label>
                      <input 
                        type="number" 
                        value={formData.copiesCount} 
                        onChange={e => setFormData({ ...formData, copiesCount: parseInt(e.target.value) || 1 })}
                        className="w-full border border-slate-205 focus:ring-2 focus:ring-blue-105/45 focus:border-blue-500 rounded-[14px] h-14 px-4 text-xs font-bold text-slate-800 bg-white font-mono" 
                        placeholder="3"
                        required 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">Publication Format</label>
                      <select 
                        value={formData.format} 
                        onChange={e => {
                          const val = e.target.value as any;
                          setFormData({ 
                            ...formData, 
                            format: val,
                            location: val === 'E-Book' ? 'Online Access Only' : formData.location === 'Online Access Only' ? 'Level 1, Room 101' : formData.location,
                            copiesCount: val === 'E-Book' ? 9999 : formData.copiesCount === 9999 ? 3 : formData.copiesCount
                          });
                        }}
                        className="w-full border border-slate-205 focus:ring-2 focus:ring-blue-105/45 focus:border-blue-500 rounded-[14px] h-14 px-4 text-xs font-semibold text-slate-800 bg-white"
                      >
                        <option value="Paperback">Paperback (ফিজিক্যাল বই)</option>
                        <option value="Hardcover">Hardcover (ফিজিক্যাল বই)</option>
                        <option value="E-Book">E-Book (ডিজিটাল বই/PDF/Text)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">Location Shelf</label>
                      <input 
                        type="text" 
                        value={formData.location} 
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                        className="w-full border border-slate-200 focus:ring-2 focus:ring-blue-105/45 focus:border-blue-500 rounded-[14px] h-14 px-4 text-xs font-semibold text-slate-800 bg-white placeholder-slate-400" 
                        placeholder="Level 4, Shelf 218"
                        disabled={formData.format === 'E-Book'}
                      />
                    </div>

                    {formData.format === 'E-Book' && (
                      <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50/40 p-5 border border-blue-200 rounded-[20px] animate-fade-in text-left">
                        <div className="col-span-full">
                          <p className="text-[11px] font-extrabold text-[#1E40AF] uppercase tracking-wider">E-Book Resource Options (ডিজিটাল রিডিং অপশন)</p>
                          <p className="text-[10px] text-slate-500 font-medium">Add a PDF URL or write the full book text so users can read online.</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-extrabold text-blue-800 block mb-1.5 uppercase tracking-wider">E-Book PDF URL (for inline rendering)</label>
                          <input 
                            type="text" 
                            value={formData.pdfUrl || ''} 
                            onChange={e => setFormData({ ...formData, pdfUrl: e.target.value })}
                            className="w-full border border-blue-200 focus:ring-1 focus:ring-blue-500 rounded-[14px] h-[48px] px-3.5 text-xs text-slate-800 bg-white font-mono placeholder-slate-400" 
                            placeholder="e.g., https://arxiv.org/pdf/quant-ph/0312051.pdf"
                          />
                          <p className="text-[9.5px] text-slate-500 mt-1.5">Provide an online PDF url. Note: Must be accessible directly from browsers.</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-extrabold text-blue-800 block mb-1.5 uppercase tracking-wider">Or, paste E-Book Text (লেখা বা টেক্সট কনটেন্ট)</label>
                          <textarea 
                            value={formData.ebookContentText || ''} 
                            onChange={e => setFormData({ ...formData, ebookContentText: e.target.value })}
                            className="w-full border border-blue-200 focus:ring-1 focus:ring-blue-500 rounded-[14px] p-3 text-xs text-slate-800 bg-white h-24 placeholder-slate-400" 
                            placeholder="Write chapters text, summary pages or paste complete novel transcript for inline layout readers..."
                          />
                          <p className="text-[9.5px] text-slate-500 mt-1.5">For books without PDFs, write the readable text directly here.</p>
                        </div>
                      </div>
                    )}

                    <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Image URL Input */}
                      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex flex-col justify-between">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">Image URL (ছবি লিংক বা Unsplash)</label>
                          <input 
                            type="text" 
                            value={formData.imageUrl} 
                            onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                            className="w-full border border-slate-200 focus:ring-2 focus:ring-blue-105/45 focus:border-[#2563eb] rounded-lg h-10 px-3 text-xs text-slate-850 font-mono bg-white placeholder-slate-400" 
                            placeholder="https://images.unsplash.com/..."
                          />
                        </div>
                        {formData.imageUrl && !formData.imageUrl.startsWith('data:') && (
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">URL Preview Loaded</span>
                            <div className="w-8 h-10 border border-slate-100 rounded overflow-hidden shadow-xs">
                              <img src={formData.imageUrl} alt="preview" className="w-full h-full object-contain" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Direct Upload Option */}
                      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex flex-col justify-between">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">Or, Direct Image Upload (সরাসরি ছবি আপলোড)</label>
                          <div className="relative border-2 border-dashed border-slate-200 hover:border-[#2563eb] transition-all rounded-lg p-3 text-center bg-white cursor-pointer group">
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  compressImageAndSet(file, (base64) => {
                                    setFormData({ ...formData, imageUrl: base64 });
                                  });
                                }
                              }}
                            />
                            <div className="flex flex-col items-center justify-center">
                              <Upload className="w-5 h-5 text-slate-400 group-hover:text-[#2563eb] mb-1 duration-200" />
                              <span className="text-[11px] font-medium text-slate-600 group-hover:text-[#2563eb] duration-200">
                                Click or drag picture
                              </span>
                              <span className="text-[9px] text-slate-400 mt-0.5">JPEG, PNG up to 5MB</span>
                            </div>
                          </div>
                        </div>
                        {formData.imageUrl && formData.imageUrl.startsWith('data:') && (
                          <div className="mt-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Uploaded file</span>
                              <div className="w-8 h-10 border border-slate-100 rounded overflow-hidden shadow-xs">
                                <img src={formData.imageUrl} alt="preview" className="w-full h-full object-contain" />
                              </div>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => setFormData({ ...formData, imageUrl: '' })}
                              className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-3">
                      <label className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wide">Description Overview</label>
                      <textarea 
                        value={formData.description} 
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full border border-slate-200 focus:ring-2 focus:ring-blue-105/45 focus:border-blue-500 rounded-[14px] p-4 text-xs text-slate-850 h-24 bg-white placeholder-slate-400"
                        placeholder="Provide details about chapter proofs, research scopes..."
                      />
                    </div>

                    <div className="md:col-span-3 flex justify-end gap-3 mt-3 border-t border-slate-200 pt-4">
                      <button 
                        type="button" 
                        onClick={() => setShowAddBook(false)} 
                        className="btn-premium-secondary text-xs h-12"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="btn-premium-primary text-xs h-12"
                      >
                        {editingBook ? 'Save Catalog Specs' : 'Register Volume'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* PRIMARY CATALOG GRID LIST */}
              <div className="bg-white border border-slate-205 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse text-slate-550 font-sans">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-250 text-slate-400 uppercase tracking-widest text-[9px] font-bold select-none">
                        <th className="py-3 px-6">Book Title / Cover Info</th>
                        <th className="py-3 px-6">Discipline</th>
                        <th className="py-3 px-6">ISBN Metadata</th>
                        <th className="py-3 px-6 text-center">Status / copies</th>
                        <th className="py-3 px-6">Shelf Location</th>
                        <th className="py-3 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {localBooksFilter.slice(0, 30).map(b => (
                        <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-6">
                            <div className="flex gap-4 items-center">
                              <img 
                                src={b.imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600'} 
                                alt={b.title} 
                                referrerPolicy="no-referrer"
                                className="w-9 h-11 object-contain object-center rounded shadow-xs bg-slate-50 border border-slate-100"
                              />
                              <div>
                                <p className="font-bold text-slate-900 line-clamp-1 truncate max-w-[240px]">{b.title}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">By {b.author}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-semibold text-slate-800">{b.category}</td>
                          <td className="py-4 px-6 font-mono text-slate-500">{b.isbn}</td>
                          <td className="py-4 px-6 text-center font-bold font-mono">
                            {b.format === 'E-Book' ? (
                              <span className="bg-emerald-50 text-emerald-700 font-bold border border-emerald-150 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider">Digital Reading</span>
                            ) : b.availableCopies <= 0 ? (
                              <span className="bg-rose-50 text-rose-700 font-bold border border-rose-150 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider">0 Copies Left</span>
                            ) : (
                              <span className="bg-slate-100 text-slate-800 font-bold border border-slate-200 px-2.5 py-0.5 rounded-full text-[9px] font-mono select-none">
                                {b.availableCopies} available / {b.copiesCount} total
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-slate-650 font-normal">{b.location || 'Academic Stack'}</td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex gap-1.5 justify-end">
                              <button 
                                onClick={() => handleEditClick(b)}
                                className="p-2 text-blue-650 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                title="Edit specs"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteBook(b.id)}
                                className="p-2 text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Delete from indices"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] font-mono text-slate-400 uppercase select-none">
                  <span>DISPENSING TOP 30 SHELF VOLUMES</span>
                  <span>ScholarLib Administration cataloger</span>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 4: CHECK-OUT DESK (BORROW / RETURNS APPROVALS) ==================== */}
          {activeTab === 'approvals' && (
            <div className="space-y-8 animate-fade-in" id="approvals-tab border-b border-slate-200 pb-4">
              <div className="border-b border-slate-200 pb-4 select-none">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Borrow & Return Check-out Desk</h1>
                <p className="text-xs text-slate-500 mt-1">Approve pending library requests or register returned copies. Real-time overdue penalties applied instantly upon return verification.</p>
              </div>

              {/* Pending Queue section */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs select-none">
                <h3 className="font-sans font-bold text-slate-900 mb-6 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <CheckSquare className="w-4.5 h-4.5 text-blue-600" /> Pending Borrow Requests Queue
                </h3>

                {borrowRecords.filter(r => r.status === 'PENDING_APPROVE').length === 0 ? (
                  <div className="py-12 text-center text-slate-400 font-sans text-xs">
                    <CheckCircle className="w-8 h-8 text-slate-250 mx-auto mb-3" />
                    <p className="font-semibold">All dispatch borrow queues are clear.</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Students dynamic borrow requests will propagate here instantly.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {borrowRecords.filter(r => r.status === 'PENDING_APPROVE').map(loan => (
                      <div key={loan.id} className="bg-slate-50 border border-slate-205 rounded-xl p-5 flex flex-col justify-between items-stretch gap-4 hover:shadow-xs transition-shadow">
                        <div>
                          <div className="flex justify-between items-center text-[9px] font-mono font-bold tracking-wider text-blue-600">
                            <span>BORROW REF ID: {loan.id}</span>
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full uppercase">Pending Librarian</span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-xs mt-3.5">"{loan.bookTitle}"</h4>
                          <p className="text-[11px] text-slate-500 mt-2 font-sans">Borrower Member: <strong className="font-bold text-slate-800">{loan.studentName}</strong> ({loan.studentRoll})</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-1">Desired Duration: {loan.durationDays} Days</p>
                        </div>
                        <button 
                          onClick={() => handleApproveLoan(loan.id)}
                          className="w-full bg-blue-600 font-bold hover:bg-blue-750 text-white text-[10px] uppercase tracking-wider py-2 rounded-lg cursor-pointer transition-colors shadow-xs"
                        >
                          Approve & Hand Over Book
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Return Desk checking section */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs select-none">
                <h3 className="font-sans font-bold text-slate-950 mb-6 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <RefreshCw className="w-4 h-4 text-slate-700" /> Active Issued Loans / Desk returns desk
                </h3>

                {borrowRecords.filter(r => r.status === 'BORROWED' || r.status === 'PENDING_RETURN').length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center font-semibold">No publications are currently checked out under any student portfolios.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse text-slate-600">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-150 text-slate-400 uppercase tracking-widest text-[9px] font-bold">
                          <th className="py-3 px-4">Checked-out Publication</th>
                          <th className="py-3 px-4">Borrower Details</th>
                          <th className="py-3 px-4 text-center">Due Return Date</th>
                          <th className="py-3 px-4">Calculated Fine Amount</th>
                          <th className="py-3 px-4 text-right">Action Reception Desk</th>
                        </tr>
                      </thead>
                      <tbody>
                        {borrowRecords.filter(r => r.status === 'BORROWED' || r.status === 'PENDING_RETURN').map(loan => {
                          const isOverdue = new Date() > new Date(loan.dueDate);
                          return (
                            <tr key={loan.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                              <td className="py-4 px-4">
                                <p className="font-bold text-slate-900">"{loan.bookTitle}"</p>
                                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Loan-ID: {loan.id}</span>
                              </td>
                              <td className="py-4 px-4 font-medium text-slate-700">
                                {loan.studentName} <span className="font-mono text-slate-400">({loan.studentRoll})</span>
                              </td>
                              <td className="py-4 px-4 text-center font-mono font-semibold">{new Date(loan.dueDate).toLocaleDateString()}</td>
                              <td className="py-4 px-4">
                                {isOverdue ? (
                                  <span className="bg-rose-50 border border-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono">
                                    Overdue: BDT {loan.fineAmount}
                                  </span>
                                ) : (
                                  <span className="bg-emerald-50 border border-emerald-150 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono">
                                    No late fee
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-4 text-right">
                                <button 
                                  onClick={() => handleReceiveReturn(loan.id)}
                                  className="bg-emerald-600 hover:bg-emerald-755 text-white px-4 py-1.5 rounded text-[10px] uppercase font-bold tracking-widest cursor-pointer select-none transition-colors"
                                >
                                  Check-In Book
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== TAB 5: FINES REGISTER STATEMENT ==================== */}
          {activeTab === 'fines' && (
            <div className="bg-white border border-slate-205 rounded-xl p-6 shadow-xs animate-fade-in" id="fines-tab">
              <div className="border-b border-slate-200 pb-4 mb-6 select-none">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Fines Statement Ledger</h1>
                <p className="text-xs text-slate-500 mt-1 font-sans">Log, edit, waive, or confirm payment for late-return fees. Values dynamically updated upon book returns desk audits.</p>
              </div>

              {fines.length === 0 ? (
                <div className="py-12 bg-slate-50 text-center border border-dashed rounded-xl border-slate-250 select-none">
                  <DollarSign className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-500">Perfect financial record.</p>
                  <p className="text-xs text-slate-400 mt-0.5">Overdue time leaps dynamically calculate late penalties which appear here upon member return check-ins.</p>
                </div>
              ) : (
                <div className="overflow-x-auto select-none">
                  <table className="w-full text-xs text-left border-collapse text-slate-500 font-sans">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-widest text-[9px] font-bold">
                        <th className="py-3 px-4">Late-Return Warning Reason</th>
                        <th className="py-3 px-4">Borrower Student</th>
                        <th className="py-3 px-4 text-center">Incurred Date</th>
                        <th className="py-3 px-4">Penalty Weight</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-right">Desk Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fines.map(fn => (
                        <tr key={fn.id} className="border-b border-slate-100 hover:bg-slate-50/20 last:border-none">
                          <td className="py-4 px-4">
                            <p className="font-bold text-slate-800">"{fn.reason}"</p>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block font-normal">Fine ID: {fn.id}</span>
                          </td>
                          <td className="py-4 px-4 font-medium text-slate-700">
                            {fn.studentName} <span className="font-mono text-slate-400">({fn.studentRoll})</span>
                          </td>
                          <td className="py-4 px-4 text-center font-mono">{new Date(fn.createdAt).toLocaleDateString()}</td>
                          <td className="py-4 px-4 font-bold text-rose-600 font-mono">BDT {fn.amount}</td>
                          <td className="py-4 px-4 text-center">
                            <span className={`text-[9px] font-semibold px-2 py-0.5 rounded uppercase leading-none font-sans ${
                              fn.status === 'PAID' 
                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                                : fn.status === 'WAIVED' 
                                ? 'bg-slate-100 border border-slate-250 text-slate-600' 
                                : 'bg-rose-50 border border-rose-200 text-rose-700'
                            }`}>
                              {fn.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            {fn.status === 'UNPAID' && (
                              <div className="flex gap-2 justify-end">
                                <button 
                                  onClick={() => handleAdminFineAction(fn.id, 'PAID')}
                                  className="bg-emerald-650 hover:bg-emerald-700 text-white px-2.5 py-1 text-[9px] uppercase font-bold tracking-wider cursor-pointer"
                                >
                                  Paid
                                </button>
                                <button 
                                  onClick={() => handleAdminFineAction(fn.id, 'WAIVED')}
                                  className="bg-slate-50 border border-slate-250 hover:bg-slate-100 text-[9px] uppercase tracking-wider text-slate-700 px-2.5 py-1 font-bold cursor-pointer transition-colors"
                                >
                                  Waive
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 6: AUDIT SYSTEM REPORTS ==================== */}
          {activeTab === 'reports' && (
            <div className="bg-white border border-slate-205 rounded-xl p-6 shadow-xs animate-fade-in" id="reports-tab">
              <div className="border-b border-slate-200 pb-4 mb-4 select-none">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Audit Reports</h1>
                <p className="text-xs text-slate-500 mt-1">Print formatted administration rosters or export library datasets directly as spreadsheet files for audit tracking.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                {/* Overdues */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-xs hover:shadow-sm transition-shadow">
                  <div>
                    <span className="text-[9px] font-bold bg-blue-50 border border-blue-200 text-blue-600 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">Penalties</span>
                    <h4 className="font-bold text-slate-900 text-xs mt-3.5">Overdue Loans Audit List</h4>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed font-sans">
                      Formats non-conformance borrows. Displays borrower roll-index, books identifiers, due return dates, and late-days weights.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-6 border-t border-slate-200 pt-4 select-none">
                    <button 
                      onClick={() => printReport('overdue')}
                      className="flex-1 bg-white border border-slate-250 hover:bg-slate-55 text-slate-700 px-3.5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print PDF
                    </button>
                    <button 
                      onClick={() => exportExcel('overdue')}
                      className="bg-blue-600 text-white p-2.5 text-center rounded-lg hover:bg-blue-750 transition-colors shadow-sm cursor-pointer"
                      title="Spreadsheet download"
                    >
                      <Download className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>

                {/* Students directory */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-xs hover:shadow-sm transition-shadow">
                  <div>
                    <span className="text-[9px] font-bold bg-amber-50 border border-amber-250 text-amber-905 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">Members</span>
                    <h4 className="font-bold text-slate-900 text-xs mt-3.5">Outstanding Member Penalty Ledger</h4>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed font-sans">
                      Lists student account names, department tracks, semester codes, and calculated cumulative outstanding unpaid late fee statements.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-6 border-t border-slate-200 pt-4 select-none">
                    <button 
                      onClick={() => printReport('students')}
                      className="flex-1 bg-white border border-slate-250 hover:bg-slate-55 text-slate-705 px-3.5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print PDF
                    </button>
                    <button 
                      onClick={() => exportExcel('members')}
                      className="bg-blue-600 text-white p-2.5 text-center rounded-lg hover:bg-blue-750 transition-colors shadow-sm cursor-pointer"
                      title="Spreadsheet download"
                    >
                      <Download className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>

                {/* General records logs */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-xs hover:shadow-sm transition-shadow">
                  <div>
                    <span className="text-[9px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">Registers</span>
                    <h4 className="font-bold text-slate-900 text-xs mt-3.5">Consolidated Active Borrowing logs</h4>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed font-sans">
                      Complete list of historical and unreturned student loan transactions stored in database registers with precise state qualifiers.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-6 border-t border-slate-200 pt-4 select-none">
                    <button 
                      onClick={() => printReport('all')}
                      className="flex-1 bg-white border border-slate-250 hover:bg-slate-55 text-slate-700 px-3.5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print PDF
                    </button>
                    <button 
                      onClick={() => exportExcel('overdue')}
                      className="bg-blue-600 text-white p-2.5 text-center rounded-lg hover:bg-blue-750 transition-colors shadow-sm cursor-pointer"
                      title="Spreadsheet download"
                    >
                      <Download className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 7: SETTINGS ==================== */}
          {activeTab === 'settings' && (
            <div className="bg-white border border-slate-205 rounded-xl p-8 shadow-xs animate-fade-in text-slate-850" id="settings-tab">
              <h3 className="font-bold text-slate-905 mb-4 text-sm uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                <Settings className="w-4.5 h-4.5 text-blue-600" /> Console Settings & Presets
              </h3>
              <p className="text-xs text-slate-500 mb-6">Modify ScholarLib system constraints, default late fine margins, and live operational hours.</p>

              {libStatusMessage && (
                <div className="p-4 mb-6 bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs flex items-center gap-2" id="admin-status-message-alert">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span>{libStatusMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Status Form (8-cols) */}
                <form onSubmit={handleUpdateLibraryStatus} className="lg:col-span-8 space-y-6">
                  
                  {/* Status Toggle buttons */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-2 uppercase tracking-wider">
                      Library Gateway Status
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setLibStatus('OPEN')}
                        className={`p-4 border text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                          libStatus === 'OPEN'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                        id="admin-set-open"
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${libStatus === 'OPEN' ? 'bg-emerald-500 animate-ping' : 'bg-slate-350'}`}></span>
                        <span className="text-xs font-black tracking-widest uppercase">🟢 OPEN</span>
                        <span className="text-[9px] text-slate-450 normal-case">Allow general checkouts</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setLibStatus('CLOSED')}
                        className={`p-4 border text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                          libStatus === 'CLOSED'
                            ? 'bg-rose-55 border-rose-400 text-rose-900 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                        id="admin-set-closed"
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${libStatus === 'CLOSED' ? 'bg-rose-500' : 'bg-slate-350'}`}></span>
                        <span className="text-xs font-black tracking-widest uppercase">🔴 CLOSED</span>
                        <span className="text-[9px] text-slate-450 normal-case">Halt active loans & checkouts</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-550 block mb-1.5 uppercase tracking-wide">
                        Opening Time (হিসাব খোলার সময়)
                      </label>
                      <input
                        type="text"
                        value={libOpeningTime}
                        onChange={(e) => setLibOpeningTime(e.target.value)}
                        placeholder="e.g. 08:00 AM"
                        className="w-full border border-slate-200 p-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-550 block mb-1.5 uppercase tracking-wide">
                        Closing Time (বন্ধের সময়)
                      </label>
                      <input
                        type="text"
                        value={libClosingTime}
                        onChange={(e) => setLibClosingTime(e.target.value)}
                        placeholder="e.g. 08:00 PM"
                        className="w-full border border-slate-200 p-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-550 block mb-1.5 uppercase tracking-wide">
                      Weekly Schedule (সাপ্তাহিক কার্যাবলী)
                    </label>
                    <input
                      type="text"
                      value={libWeeklySchedule}
                      onChange={(e) => setLibWeeklySchedule(e.target.value)}
                      placeholder="e.g. Saturday - Thursday"
                      className="w-full border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={libStatusLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] uppercase tracking-wider py-3.5 px-6 rounded-none transition-colors cursor-pointer shadow-xs"
                      id="save-lib-hours-btn"
                    >
                      {libStatusLoading ? 'Synchronizing configuration...' : 'Apply Status Settings'}
                    </button>
                  </div>

                </form>

                {/* Info particulars on the right (4-cols) */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-4">
                    <h4 className="font-extrabold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-1.5 uppercase tracking-wide">
                      <Info className="w-4 h-4 text-slate-500" />
                      <span>Operational Notes</span>
                    </h4>
                    
                    <p className="text-slate-500 leading-relaxed text-[11px]">
                      Changes applied here update the status parameters in Firestore dynamically and synchronize across academic portals without restarting instances.
                    </p>

                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between text-[11px] border-b border-slate-100 pb-1 text-slate-600">
                        <span>Current Gateway:</span>
                        <span className={`font-bold uppercase ${libStatus === 'OPEN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {libStatus}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] border-b border-slate-100 pb-1 text-slate-600">
                        <span>Librarian Logs:</span>
                        <span className="font-bold">ACTIVE</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-600">
                        <span>Database:</span>
                        <span className="font-mono font-semibold">CLOUD FSTORE</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ==================== TAB 8: HELP ==================== */}
          {activeTab === 'help' && (
            <div className="bg-white border border-slate-205 rounded-xl p-8 shadow-xs animate-fade-in select-none" id="help-tab">
              <h3 className="font-bold text-slate-905 mb-4 text-sm uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                <HelpCircle className="w-4.5 h-4.5 text-blue-600" /> Librarian Administrator Documentation
              </h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                Welcome to the ScholarLib Technical console manual. Use the guidelines bellow to perform standard loan operations, catalog management, and student directory updates.
              </p>

              <div className="space-y-6 text-xs leading-relaxed text-slate-650 font-sans">
                <div>
                  <h5 className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-2">1. To register or add new students:</h5>
                  <p>Open the "Members Directory" tab from the left navigation panel. Click on the solid green "Add Member Profile" button on the top right. Fill out the student full name, default password, roll index, department track, and current academic semester, then click "Register Member". Roll numbers are automatically padded and system prefixing applies automatically.</p>
                </div>

                <div>
                  <h5 className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-2">2. To track which user holds which checked-out books:</h5>
                  <p>In the "Members Directory" overview database table, you will see an "Issued Active Books" column next to each student profile. If the user has active checked-out publications, a blue badge indicates the number of copies held (e.g., "1 Copy held"). Click this badge to expand the sub-row detail panel showing the exact book title, issue date, due date, calculated fine status, and a desk check-in action receiver shortcut.</p>
                </div>

                <div>
                  <h5 className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-2">3. To process borrow desk check-outs and returns:</h5>
                  <p>When student initiates a borrow transaction or requests returns, navigate to the "Check-out Desk" tab. The upper card section displays outstanding "Pending Borrow Requests Queue". Click "Approve & Hand Over Book" to dispatch physical volumes out of stock rooms. The lower section displays unreturned checked-out copies with checking details; click "Check-In Book" to process return check-ins and recalculate late penality statements dynamically.</p>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 9: LIBRARIANS ==================== */}
          {activeTab === 'librarians' && (
            <div className="space-y-6 animate-fade-in" id="librarians-tab">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-xl font-bold font-sans text-slate-900 tracking-tight">Librarians & Staff Directory</h1>
                  <p className="text-xs text-slate-500 mt-1">Manage shift rosters, mobile numbers, and workspace assignments for library operators.</p>
                </div>
                <button 
                  onClick={() => {
                    setEditingLibrarian(null);
                    setLibForm({ name: '', mobile: '', address: '', shift: 'Morning Shift ( সকাল ৮:০০ - দুপুর ২:০০ )' });
                    setShowAddLibrarian(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-blue-750 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  id="add-librarian-btn"
                >
                  <Plus className="w-4 h-4" /> Add Librarian Staff
                </button>
              </div>

              {/* Form Modal / Section */}
              {showAddLibrarian && (
                <div className="bg-white p-6 border border-slate-200 rounded-none animate-slide-in">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-sm">{editingLibrarian ? 'Edit Librarian Staff Key' : 'Add New Librarian Staff'}</h3>
                    <button 
                      onClick={() => setShowAddLibrarian(false)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-650 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <form onSubmit={handleSaveLibrarian} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Name (নাম) *</label>
                        <input 
                          type="text" 
                          required
                          value={libForm.name}
                          onChange={e => setLibForm({ ...libForm, name: e.target.value })}
                          placeholder="e.g. Tanzim Rahman"
                          className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-600 rounded-none font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Shift (শিফট - সময় সহ) *</label>
                        <select 
                          value={libForm.shift}
                          onChange={e => setLibForm({ ...libForm, shift: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-600 rounded-none font-sans"
                        >
                          <option value="Morning Shift ( সকাল ৮:০০ - দুপুর ২:০০ )">Morning Shift ( সকাল ৮:০০ - দুপুর ২:০০ )</option>
                          <option value="Day Shift ( দুপুর ২:০০ - রাত ৮:০০ )">Day Shift ( দুপুর ২:০০ - রাত ৮:০০ )</option>
                          <option value="Evening Shift ( রাত ৮:০০ - রাত ১২:০০ )">Evening Shift ( রাত ৮:০০ - রাত ১২:০০ )</option>
                          <option value="Night Shift ( রাত ১২:০০ - সকাল ৮:০০ )">Night Shift ( রাত ১২:০০ - সকাল ৮:০০ )</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Mobile (মোবাইল) *</label>
                        <input 
                          type="text" 
                          required
                          value={libForm.mobile}
                          onChange={e => setLibForm({ ...libForm, mobile: e.target.value })}
                          placeholder="e.g. 01712000000"
                          className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-600 rounded-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Address (ঠিকানা)</label>
                        <input 
                          type="text" 
                          value={libForm.address}
                          onChange={e => setLibForm({ ...libForm, address: e.target.value })}
                          placeholder="e.g. Mirpur, Dhaka"
                          className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-600 rounded-none font-sans"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2.5 pt-2">
                      <button 
                        type="button"
                        onClick={() => setShowAddLibrarian(false)}
                        className="bg-white border border-slate-200 text-slate-705 px-4 py-2.5 rounded-none text-xs font-bold uppercase tracking-wider hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-none text-xs font-bold uppercase tracking-wider hover:bg-blue-700 cursor-pointer flex items-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" /> Save Staff
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Table / List Grid */}
              <div className="bg-white border border-slate-200 rounded-none shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse font-sans text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold select-none">
                      <th className="py-3 px-6">Staff Profile Name (নাম)</th>
                      <th className="py-3 px-6">Shift Assignment (শিফট)</th>
                      <th className="py-3 px-6">Contact Mobile (মোবাইল)</th>
                      <th className="py-3 px-6">Address (ঠিকানা)</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {librarians.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 select-none">
                          No librarians registered in system indexes.
                        </td>
                      </tr>
                    ) : (
                      librarians.map((lib) => (
                        <tr key={lib.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                          <td className="py-4 px-6 font-semibold text-slate-900">{lib.name}</td>
                          <td className="py-4 px-6">
                            <span className="bg-blue-50 border border-blue-100 text-blue-800 font-medium px-2 py-0.5 rounded text-[11px]">
                              {lib.shift}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-mono text-slate-700">{lib.mobile || 'N/A'}</td>
                          <td className="py-4 px-6 text-slate-550">{lib.address || 'N/A'}</td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => handleEditLibrarianClick(lib)}
                                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                title="Edit staff details"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteLibrarian(lib.id)}
                                className="p-1 text-slate-500 hover:text-red-650 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                title="Delete staff record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== TAB 10: GALLERY ==================== */}
          {activeTab === 'gallery' && (
            <div className="space-y-6 animate-fade-in" id="gallery-tab">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-xl font-bold font-sans text-slate-900 tracking-tight">Main Campus Gallery Showcase</h1>
                  <p className="text-xs text-slate-550 mt-1">Upload environmental highlights, library spaces, desk areas, and event pictures here.</p>
                </div>
                <button 
                  onClick={() => {
                    setGalForm({ imageUrl: '', caption: '' });
                    setShowAddGallery(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-blue-750 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  id="add-gallery-btn"
                >
                  <Plus className="w-4 h-4" /> Upload Gallery Photo
                </button>
              </div>

              {/* Form Segment */}
              {showAddGallery && (
                <div className="bg-white p-6 border border-slate-205 rounded-none animate-slide-in">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-sm">Upload High-Definition Photo</h3>
                    <button 
                      onClick={() => setShowAddGallery(false)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-650 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <form onSubmit={handleSaveGallery} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* URL Option */}
                      <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl flex flex-col justify-between">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Image URL (ছবি লিংক)</label>
                          <div className="flex gap-1.5">
                            <input 
                              type="text" 
                              value={galForm.imageUrl}
                              onChange={e => setGalForm({ ...galForm, imageUrl: e.target.value })}
                              placeholder="https://images.unsplash.com/..."
                              className="w-full bg-white border border-slate-200 p-2 text-xs focus:ring-1 focus:ring-blue-500 rounded-lg font-mono placeholder-slate-400"
                            />
                            <button 
                              type="button" 
                              onClick={() => setGalForm({ ...galForm, imageUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&auto=format&fit=crop&q=80" })}
                              className="bg-white hover:bg-slate-50 border border-slate-200 px-2.5 text-[9px] uppercase font-bold text-slate-600 shrink-0 rounded-lg transition-colors cursor-pointer"
                            >
                              Preset
                            </button>
                          </div>
                        </div>
                        {galForm.imageUrl && !galForm.imageUrl.startsWith('data:') && (
                          <div className="mt-2.5 flex items-center gap-2">
                            <span className="text-[9px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Url Preview</span>
                            <div className="w-12 h-8 border border-slate-100 rounded overflow-hidden shadow-xs">
                              <img src={galForm.imageUrl} alt="preview" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Direct Upload Option */}
                      <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl flex flex-col justify-between">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Direct Upload (সরাসরি আপলোড)</label>
                          <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-500 transition-all rounded-lg p-2.5 text-center bg-white cursor-pointer group">
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  compressImageAndSet(file, (base64) => {
                                    setGalForm({ ...galForm, imageUrl: base64 });
                                  });
                                }
                              }}
                            />
                            <div className="flex flex-col items-center justify-center">
                              <Upload className="w-4 h-4 text-slate-400 group-hover:text-blue-500 duration-200" />
                              <span className="text-[10px] font-medium text-slate-600 mt-0.5">Click to choose image</span>
                            </div>
                          </div>
                        </div>
                        {galForm.imageUrl && galForm.imageUrl.startsWith('data:') && (
                          <div className="mt-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">File loaded</span>
                              <div className="w-12 h-8 border border-slate-100 rounded overflow-hidden shadow-xs">
                                <img src={galForm.imageUrl} alt="preview" className="w-full h-full object-cover" />
                              </div>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => setGalForm({ ...galForm, imageUrl: '' })}
                              className="text-[9px] text-rose-500 hover:underline cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Caption Description (ক্যাপশন বর্ণনা) *</label>
                      <input 
                        type="text" 
                        required
                        value={galForm.caption}
                        onChange={e => setGalForm({ ...galForm, caption: e.target.value })}
                        placeholder="e.g. লাইব্রেরির মনোরম ও শান্ত সেমিনার কক্ষ"
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-600 rounded-none font-sans"
                      />
                    </div>
                    <div className="flex justify-end gap-2.5 pt-2">
                      <button 
                        type="button"
                        onClick={() => setShowAddGallery(false)}
                        className="bg-white border border-slate-200 text-slate-705 px-4 py-2.5 rounded-none text-xs font-bold uppercase tracking-wider hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-none text-xs font-bold uppercase tracking-wider hover:bg-blue-700 cursor-pointer flex items-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" /> Upload Asset
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Gallery List Grid View */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 select-none" id="admin-gallery-grid">
                {galleryItems.length === 0 ? (
                  <div className="col-span-full py-12 text-center bg-white border border-slate-200 p-8 select-none text-slate-400">
                    <ImageIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-bold font-sans">No gallery pictures currently in catalog.</p>
                  </div>
                ) : (
                  galleryItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-white border border-slate-200 rounded-none overflow-hidden flex flex-col group shadow-xs relative"
                      id={`list-gallery-item-${item.id}`}
                    >
                      <button 
                        onClick={() => handleDeleteGallery(item.id)}
                        className="absolute right-3 top-3 z-10 p-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors shadow cursor-pointer font-sans"
                        title="Delete photo"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                      <div className="h-44 bg-slate-50 relative overflow-hidden flex items-center justify-center">
                        <img 
                          src={item.imageUrl} 
                          alt={item.caption}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4 flex-grow">
                        <p className="text-xs text-slate-800 font-medium leading-relaxed">{item.caption}</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-mono">Date Uploaded: {new Date(item.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ==================== TAB: NOTICE BOARD ==================== */}
          {activeTab === 'notices' && (
            <div className="space-y-6 animate-fade-in font-sans text-[#334155]" id="notices-admin-tab">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">Academic Notice Board Management</h1>
                  <p className="text-xs text-slate-550 mt-1">Add official student notifications, exam dates, vacation periods, and other technical circulars.</p>
                </div>
                <button 
                  onClick={() => {
                    setEditingNotice(null);
                    setNoticeForm({
                      title: '',
                      description: '',
                      attachmentUrl: '',
                      attachmentType: 'PDF Document',
                      urgent: false,
                      pinned: false,
                      publishDate: new Date().toISOString().split('T')[0],
                      expiryDate: ''
                    });
                    setShowAddNotice(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none"
                  id="admin-create-notice-btn"
                >
                  <Plus className="w-4 h-4" /> Create New Notice
                </button>
              </div>

              {/* Form Segment */}
              {showAddNotice && (
                <div className="bg-white p-6 border border-slate-205 rounded-2xl shadow-xs animate-slide-in">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-sm">
                      {editingNotice ? "Modify Published Circular" : "Publish New Official Circular"}
                    </h3>
                    <button 
                      onClick={() => setShowAddNotice(false)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-650 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveNotice} className="space-y-4 font-sans text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1">Notice Title (শিরোনাম) *</label>
                        <input 
                          type="text" 
                          required
                          value={noticeForm.title}
                          onChange={e => setNoticeForm({ ...noticeForm, title: e.target.value })}
                          placeholder="e.g. ১ম পর্ব সমাপনী পরীক্ষার সময়সূচি প্রকাশ প্রসঙ্গে সংশোধিত বিজ্ঞপ্তি"
                          className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-650 rounded-lg"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1">Detailed Content Description (নোটিশের মূল বিষয়বস্তু) *</label>
                        <textarea 
                          rows={6}
                          required
                          value={noticeForm.description}
                          onChange={e => setNoticeForm({ ...noticeForm, description: e.target.value })}
                          placeholder="নোটিশের বিস্তারিত অংশ এখানে বাংলায় অথবা ইংরেজিতে লিখুন..."
                          className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-655 rounded-lg whitespace-pre-wrap leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1">Attachment File URL (সংযুক্ত ফাইল লিঙ্ক/লিফলেট)</label>
                        <input 
                          type="url" 
                          value={noticeForm.attachmentUrl}
                          onChange={e => setNoticeForm({ ...noticeForm, attachmentUrl: e.target.value })}
                          placeholder="https://example.com/files/notice.pdf"
                          className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-655 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1">Attachment Type</label>
                        <select 
                          value={noticeForm.attachmentType}
                          onChange={e => setNoticeForm({ ...noticeForm, attachmentType: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-655 rounded-lg"
                        >
                          <option value="PDF Document">PDF Document (.pdf)</option>
                          <option value="JPEG Roster Image">JPEG Roster Image (.jpg)</option>
                          <option value="Excel Sheet Ledger">Excel Sheet Ledger (.xlsx)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1">Publish Date (প্রকাশের তারিখ) *</label>
                        <input 
                          type="date" 
                          required
                          value={noticeForm.publishDate}
                          onChange={e => setNoticeForm({ ...noticeForm, publishDate: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-655 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1">Expiry Date (মেয়াদোত্তীর্ণের তারিখ)</label>
                        <input 
                          type="date" 
                          value={noticeForm.expiryDate}
                          onChange={e => setNoticeForm({ ...noticeForm, expiryDate: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-655 rounded-lg"
                        />
                      </div>

                      <div className="flex items-center space-x-6 pt-3 select-none">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={noticeForm.urgent}
                            onChange={e => setNoticeForm({ ...noticeForm, urgent: e.target.checked })}
                            className="rounded text-red-650 focus:ring-red-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-red-650 uppercase tracking-wide">Mark as Urgent (জরুরি বিজ্ঞপ্তি)</span>
                        </label>

                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={noticeForm.pinned}
                            onChange={e => setNoticeForm({ ...noticeForm, pinned: e.target.checked })}
                            className="rounded text-amber-650 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Pin Announcement (শীর্ষে পিন করুন)</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 select-none">
                      <button 
                        type="button"
                        onClick={() => setShowAddNotice(false)}
                        className="bg-white border border-slate-200 text-slate-705 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-blue-700 cursor-pointer flex items-center gap-1"
                      >
                        <Save className="w-4 h-4" /> 
                        <span>{editingNotice ? "Update Notice" : "Publish Announcement"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Active Notices Registry */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs text-left">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between select-none">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-505">Notice records registry</h3>
                  <span className="text-[10px] font-mono text-slate-400">Total Publications: {adminNotices.length}</span>
                </div>

                {adminNotices.length === 0 ? (
                  <div className="text-center py-12 select-none text-slate-400">
                    <Megaphone className="w-10 h-10 mx-auto text-slate-250 mb-2" />
                    <p className="text-xs font-bold text-slate-650 font-sans">No administrative circulars found.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {adminNotices
                      .sort((a, b) => {
                        if (a.pinned && !b.pinned) return -1;
                        if (!a.pinned && b.pinned) return 1;
                        return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
                      })
                      .map((notice) => (
                        <div key={notice.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/45 transition-colors">
                          <div className="space-y-1.5 flex-grow text-left">
                            <div className="flex items-center gap-2 flex-wrap select-none">
                              <span className="text-[9.5px] text-slate-400 font-mono font-bold">
                                Publish date: {new Date(notice.publishDate).toLocaleDateString()}
                              </span>
                              {notice.pinned && (
                                <span className="inline-flex items-center bg-amber-50 border border-amber-200 text-amber-700 text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                  Pinned
                                </span>
                              )}
                              {notice.urgent && (
                                <span className="inline-flex items-center bg-red-50 border border-red-200 text-red-700 text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">
                                  Urgent
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 font-sans">
                              {notice.title}
                            </h4>
                            <p className="text-xs text-slate-550 line-clamp-2 max-w-3xl leading-relaxed font-sans">
                              {notice.description}
                            </p>
                          </div>

                          <div className="flex gap-2 shrink-0 select-none">
                            <button 
                              onClick={() => {
                                setEditingNotice(notice);
                                setNoticeForm({
                                  title: notice.title,
                                  description: notice.description,
                                  attachmentUrl: notice.attachmentUrl || '',
                                  attachmentType: notice.attachmentType || 'PDF Document',
                                  urgent: !!notice.urgent,
                                  pinned: !!notice.pinned,
                                  publishDate: notice.publishDate,
                                  expiryDate: notice.expiryDate || ''
                                });
                                setShowAddNotice(true);
                              }}
                              className="p-1 px-2.5 border border-slate-205 hover:bg-slate-50 hover:text-blue-650 rounded text-[10px] font-extrabold uppercase text-slate-650 cursor-pointer flex items-center gap-1 transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-3 h-3" /> Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteNotice(notice.id)}
                              className="p-1 px-2.5 border border-red-205 hover:bg-red-50 hover:text-red-750 rounded text-[10px] font-extrabold uppercase text-red-650 cursor-pointer flex items-center gap-1 transition-colors"
                              title="Delete notice"
                            >
                              <Trash className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== TAB: WEBSITE BRANDING ==================== */}
          {activeTab === 'branding' && (
            <div className="space-y-6 animate-fade-in font-sans text-[#334155]" id="branding-tab">
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Portal Identity & Website Branding</h1>
                <p className="text-xs text-slate-550 mt-1">Configure systemic variables instantly like names, logos, official contacts, and web portals active on layout margins.</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
                <form onSubmit={handleSaveBranding} className="space-y-6">
                  {brandingStatusText && (
                    <div className="p-4 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold rounded-xl animate-fade-in select-none text-left">
                      {brandingStatusText}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Official Library Name *</label>
                      <input 
                        type="text" 
                        required
                        value={brandingForm.libraryName}
                        onChange={e => setBrandingForm({ ...brandingForm, libraryName: e.target.value })}
                        placeholder="e.g. Chatpoly Central Digital Library"
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-600 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Short Header Name (navbar layout) *</label>
                      <input 
                        type="text" 
                        required
                        value={brandingForm.shortName}
                        onChange={e => setBrandingForm({ ...brandingForm, shortName: e.target.value })}
                        placeholder="e.g. CpiLib"
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-600 rounded-xl"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Custom Shield Logo Image URL</label>
                      <input 
                        type="url" 
                        value={brandingForm.logoUrl}
                        onChange={e => setBrandingForm({ ...brandingForm, logoUrl: e.target.value })}
                        placeholder="https://example.com/logo.png"
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-600 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Official Support Email</label>
                      <input 
                        type="email" 
                        value={brandingForm.email}
                        onChange={e => setBrandingForm({ ...brandingForm, email: e.target.value })}
                        placeholder="library@chattpoly.edu.bd"
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-600 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Official Hotline / Phone</label>
                      <input 
                        type="text" 
                        value={brandingForm.phone}
                        onChange={e => setBrandingForm({ ...brandingForm, phone: e.target.value })}
                        placeholder="+880 1712-345678"
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-600 rounded-xl"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Physical Campus Station Address</label>
                      <input 
                        type="text" 
                        value={brandingForm.address}
                        onChange={e => setBrandingForm({ ...brandingForm, address: e.target.value })}
                        placeholder="Chattogram Port Road, Chattogram, Bangladesh"
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-600 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Official Website URL</label>
                      <input 
                        type="url" 
                        value={brandingForm.websiteUrl}
                        onChange={e => setBrandingForm({ ...brandingForm, websiteUrl: e.target.value })}
                        placeholder="https://chattpoly.edu.bd"
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-600 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Footer Description text</label>
                      <input 
                        type="text" 
                        value={brandingForm.footerText}
                        onChange={e => setBrandingForm({ ...brandingForm, footerText: e.target.value })}
                        placeholder="CPI Central library provides unified research indices and certified textbooks."
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-600 rounded-xl"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Copyright Statement (footer legal) *</label>
                      <input 
                        type="text" 
                        required
                        value={brandingForm.copyrightText}
                        onChange={e => setBrandingForm({ ...brandingForm, copyrightText: e.target.value })}
                        placeholder="© 2026 Chatpoly Central Library. All Rights Reserved."
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-600 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="flex justify-start select-none pt-2 border-t border-slate-100">
                    <button 
                      type="submit"
                      disabled={loadingBranding}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold px-7 py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center gap-1.5 animate-pulse-once"
                    >
                      <Save className="w-4 h-4" />
                      <span>{loadingBranding ? "Synchronizing Configuration..." : "Synchronize System Customizations"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ==================== TAB: SUPPORT CENTER ==================== */}
          {activeTab === 'support' && (
            <div className="space-y-6 animate-fade-in font-sans text-slate-700" id="support-center-tab">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-xl font-bold text-slate-950 tracking-tight">Support Centre Messaging Hub</h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage guest support tickets and student inquiries. Respond to messages to assist users with their library tasks.
                  </p>
                </div>
                <button
                  onClick={loadSupportMessages}
                  disabled={loadingSupport}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingSupport ? 'animate-spin' : ''}`} />
                  {loadingSupport ? 'Refreshing...' : 'Sync Messages'}
                </button>
              </div>

              {/* KPI Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
                {/* Stat 1: Total Messages */}
                <div className="bg-white border border-slate-150 p-4.5 rounded-2xl flex items-center gap-4 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-semibold">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-mono tracking-wider text-slate-450 font-semibold">Total Inquiries</p>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">{supportMessages.length}</h3>
                  </div>
                </div>

                {/* Stat 2: Unread/Pending Messages */}
                <div className="bg-white border border-slate-150 p-4.5 rounded-2xl flex items-center gap-4 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-semibold">
                    <AlertCircle className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-mono tracking-wider text-slate-450 font-semibold">Unread / New</p>
                    <h3 className="text-lg font-bold text-rose-600 mt-0.5">
                      {supportMessages.filter(m => m.status === 'PENDING').length}
                    </h3>
                  </div>
                </div>

                {/* Stat 3: Resolved/Replied Messages */}
                <div className="bg-white border border-slate-150 p-4.5 rounded-2xl flex items-center gap-4 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-semibold">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-mono tracking-wider text-slate-450 font-semibold">Resolved / Replied</p>
                    <h3 className="text-lg font-bold text-emerald-600 mt-0.5">
                      {supportMessages.filter(m => m.status === 'REPLIED').length}
                    </h3>
                  </div>
                </div>

                {/* Stat 4: Read/Pending Action */}
                <div className="bg-white border border-slate-150 p-4.5 rounded-2xl flex items-center gap-4 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-semibold">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-mono tracking-wider text-slate-450 font-semibold">Read (No Reply)</p>
                    <h3 className="text-lg font-bold text-amber-600 mt-0.5">
                      {supportMessages.filter(m => m.status === 'READ').length}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Message split viewer */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Panel: Search & Directory list */}
                <div className="lg:col-span-5 bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-xs flex flex-col h-[550px]">
                  
                  {/* Search Filter Head */}
                  <div className="p-4 border-b border-slate-150 bg-slate-50/50 space-y-3 shrink-0">
                    {/* Search Field */}
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search ticket text or user info..."
                        value={supportSearchQuery}
                        onChange={e => setSupportSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs border border-slate-205 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* Status filter tabs scroll */}
                    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin select-none">
                      {(['ALL', 'PENDING', 'READ', 'REPLIED', 'ARCHIVED'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setSupportFilterStatus(st)}
                          className={`text-[9px] font-bold uppercase px-2.5 py-1 rounded-lg border cursor-pointer shrink-0 transition-all ${
                            supportFilterStatus === st
                              ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {st === 'ALL' && 'All'}
                          {st === 'PENDING' && `New (${supportMessages.filter(m => m.status === 'PENDING').length})`}
                          {st === 'READ' && 'Read'}
                          {st === 'REPLIED' && 'Replied'}
                          {st === 'ARCHIVED' && 'Archived'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message Items Directory */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[460px]">
                    {supportMessages.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        {loadingSupport ? 'Loading support messages...' : 'No tickets or inquiries in the system.'}
                      </div>
                    ) : (
                      (() => {
                        // Filter messages locally
                        const filtered = supportMessages.filter(m => {
                          const statusMatch = supportFilterStatus === 'ALL' || m.status === supportFilterStatus;
                          const textQuery = supportSearchQuery.toLowerCase().trim();
                          const matchesSearch = !textQuery || 
                            m.name?.toLowerCase().includes(textQuery) ||
                            m.email?.toLowerCase().includes(textQuery) ||
                            m.subject?.toLowerCase().includes(textQuery) ||
                            m.message?.toLowerCase().includes(textQuery) ||
                            m.rollNumber?.toLowerCase().includes(textQuery);
                          return statusMatch && matchesSearch;
                        });

                        if (filtered.length === 0) {
                          return (
                            <div className="p-8 text-center text-xs text-slate-400">
                              No tickets match your search parameters.
                            </div>
                          );
                        }

                        return filtered.map((msg) => {
                          const isSelected = selectedSupportMessage?.id === msg.id;
                          return (
                            <div
                              key={msg.id}
                              onClick={async () => {
                                setSelectedSupportMessage(msg);
                                if (msg.status === 'PENDING') {
                                  await handleSupportMarkRead(msg.id);
                                }
                              }}
                              className={`p-4 hover:bg-slate-50 cursor-pointer transition-all ${
                                isSelected ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'bg-white'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2.5">
                                <h4 className="text-xs font-bold text-slate-900 truncate flex-1">
                                  {msg.subject || 'Librarian Support Connection'}
                                </h4>
                                <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-full ${
                                  msg.status === 'PENDING' ? 'bg-red-50 text-red-650 font-bold border border-red-100 animate-pulse' :
                                  msg.status === 'READ' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                  msg.status === 'REPLIED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  'bg-slate-100 text-slate-500 border border-slate-200'
                                }`}>
                                  {msg.status}
                                </span>
                              </div>

                              <p className="text-[10px] text-slate-700 mt-1 line-clamp-2 leading-relaxed">
                                {msg.message}
                              </p>

                              <div className="flex justify-between items-center mt-2.5 text-[8px] text-slate-400 font-mono">
                                <span className="font-semibold text-slate-600 truncate max-w-[150px]">
                                  {msg.name} ({msg.rollNumber || 'GUEST'})
                                </span>
                                <span>
                                  {msg.createdAt && new Date(msg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          );
                        });
                      })()
                    )}
                  </div>
                </div>

                {/* Right Panel: Detail view + Action interface */}
                <div className="lg:col-span-7 bg-white border border-slate-150 rounded-2xl p-5 shadow-xs h-[550px] flex flex-col justify-between">
                  {selectedSupportMessage ? (
                    <div className="flex flex-col h-full justify-between">
                      
                      {/* Ticket content section */}
                      <div className="space-y-4 overflow-y-auto max-h-[400px] flex-1 pr-1 scrollbar-thin">
                        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                          <div>
                            <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-widest block">
                              Ticket Reference &bull; {selectedSupportMessage.id}
                            </span>
                            <h2 className="text-sm font-bold text-slate-950 mt-1">
                              {selectedSupportMessage.subject || 'Librarian Support Connection'}
                            </h2>
                          </div>

                          <div className="flex gap-1.5 select-none">
                            <button
                              onClick={() => handleSupportArchive(selectedSupportMessage.id)}
                              disabled={selectedSupportMessage.status === 'ARCHIVED'}
                              className="text-[9px] font-semibold bg-slate-50 border border-slate-200 text-slate-500 px-2.5 py-1 rounded-lg hover:font-bold hover:bg-slate-100 cursor-pointer transition-colors disabled:opacity-40"
                              title="Archive Ticket"
                            >
                              Archive
                            </button>
                            <button
                              onClick={() => handleSupportDelete(selectedSupportMessage.id)}
                              className="text-[9px] font-semibold bg-rose-50 border border-rose-100 text-rose-600 px-2.5 py-1 rounded-lg hover:font-bold hover:bg-rose-100 cursor-pointer transition-colors"
                              title="Delete inquiry entry"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {/* Customer credentials card */}
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-150 grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-tight">Full Name</span>
                            <p className="font-semibold text-slate-800">{selectedSupportMessage.name}</p>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-tight">Email Address</span>
                            <a href={`mailto:${selectedSupportMessage.email}`} className="text-blue-650 hover:underline inline-block truncate max-w-full font-mono">{selectedSupportMessage.email}</a>
                          </div>
                          
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-tight">Status</span>
                            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${
                                selectedSupportMessage.status === 'PENDING' ? 'bg-red-500 animate-pulse' :
                                selectedSupportMessage.status === 'READ' ? 'bg-amber-500' :
                                selectedSupportMessage.status === 'REPLIED' ? 'bg-emerald-500' : 'bg-slate-400'
                              }`} />
                              {selectedSupportMessage.status}
                            </p>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-tight">Class Roll / Identity</span>
                            <p className="font-semibold text-slate-700 font-mono">{selectedSupportMessage.rollNumber || 'GUEST / OFF-REGISTER'}</p>
                          </div>

                          {selectedSupportMessage.registration && (
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-tight">Registration Number</span>
                              <p className="font-semibold text-slate-700 font-mono">{selectedSupportMessage.registration}</p>
                            </div>
                          )}

                          {selectedSupportMessage.department && (
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-tight">Department / Semester</span>
                              <p className="font-semibold text-slate-700">
                                {selectedSupportMessage.department} {selectedSupportMessage.semester ? `(${selectedSupportMessage.semester} Semester)` : ''}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* actual Inquiry text */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider font-mono block select-none">Submitted Message</span>
                          <div className="p-4 rounded-xl border border-blue-50 bg-blue-50/10 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-line text-left">
                            {selectedSupportMessage.message}
                          </div>
                        </div>

                        {/* Reply Log history */}
                        {selectedSupportMessage.repliedAt && (
                          <div className="space-y-1.5 border-t border-dashed border-slate-150 pt-4 text-left">
                            <span className="text-[9px] uppercase font-bold text-emerald-600 tracking-wider font-mono block flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Librarian Response Sent
                            </span>
                            <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/10 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-line">
                              {selectedSupportMessage.replyText}
                              
                              <span className="block text-[8px] text-slate-400 font-mono mt-2 pt-1 border-t border-slate-100 select-none">
                                Replied Date: {new Date(selectedSupportMessage.repliedAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Reply form actions area at bottom */}
                      <div className="border-t border-slate-150 pt-3 mt-3 shrink-0">
                        {supportStatusText && (
                          <div className="text-[10px] text-emerald-700 border border-emerald-150 p-2.5 rounded-xl bg-emerald-50/50 mb-2">
                            ✓ {supportStatusText}
                          </div>
                        )}

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block select-none font-mono">
                            {selectedSupportMessage.replyText ? 'Post another response' : 'Compose Response message'}
                          </label>
                          <div className="flex gap-2">
                            <textarea
                              rows={2}
                              value={supportReplyText}
                              onChange={e => setSupportReplyText(e.target.value)}
                              placeholder="Type official response/instructions to send via database connection email..."
                              className="flex-1 text-xs border border-slate-205 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50 focus:bg-white resize-none"
                            />
                            <button
                              onClick={() => handleSupportReply(selectedSupportMessage.id)}
                              disabled={!supportReplyText.trim() || loadingSupport}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 rounded-xl cursor-pointer disabled:opacity-50 flex flex-col justify-center items-center gap-1 select-none"
                            >
                              <Send className="w-4 h-4" />
                              <span>Reply</span>
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 select-none">
                      <MessageSquare className="w-12 h-12 text-slate-200 stroke-1.5 mb-2.5" />
                      <p className="text-xs font-semibold">No Ticket Chosen</p>
                      <p className="text-[10px] text-slate-450 mt-1 text-center max-w-[245px]">
                        Select any help desk ticket or student inquiry item on the left panel to display deep diagnostics, customer verification, and issue replies.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ==================== TAB: HERO BANNER SLIDES ==================== */}
          {activeTab === 'sliders' && (
            <div className="space-y-6 animate-fade-in font-sans text-[#334155]" id="sliders-tab">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">Main Hero Slides Directory</h1>
                  <p className="text-xs text-slate-550 mt-1">Replace background images, change display headings and subtitles rendered in the homepage top viewport dynamically.</p>
                </div>
                <button 
                  onClick={() => {
                    setEditingSlide(null);
                    setSlideForm({ title: '', subtitle: '', imageUrl: '' });
                    setShowAddSlide(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-blue-750 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none"
                  id="add-banner-slide-btn"
                >
                  <Plus className="w-4 h-4" /> Add Hero Slide
                </button>
              </div>

              {/* Form Segment */}
              {showAddSlide && (
                <div className="bg-white p-6 border border-slate-205 rounded-2xl shadow-xs animate-slide-in">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 select-none">
                    <h3 className="font-bold text-slate-900 text-sm">
                      {editingSlide ? "Modify Slideshow Item" : "Create Slideshow Banner"}
                    </h3>
                    <button 
                      onClick={() => setShowAddSlide(false)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-650 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveSlide} className="space-y-4 text-left font-sans">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1">Slide Heading Title (মূল ব্যানার লেখা) *</label>
                        <input 
                          type="text" 
                          required
                          value={slideForm.title}
                          onChange={e => setSlideForm({ ...slideForm, title: e.target.value })}
                          placeholder="e.g. Unlock Infinite Technical Knowledge"
                          className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-650 rounded-lg"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1">Slide Subtitle Announcement (বর্ণনা লাইন) *</label>
                        <input 
                          type="text" 
                          required
                          value={slideForm.subtitle}
                          onChange={e => setSlideForm({ ...slideForm, subtitle: e.target.value })}
                          placeholder="e.g. Access 50,050 peer-reviewed digital textbooks on engineering and technology."
                          className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-650 rounded-lg"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1">Background Image URL (ব্যানার ছবির লিংক) *</label>
                        <input 
                          type="url" 
                          required
                          value={slideForm.imageUrl}
                          onChange={e => setSlideForm({ ...slideForm, imageUrl: e.target.value })}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-650 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 select-none">
                      <button 
                        type="button"
                        onClick={() => setShowAddSlide(false)}
                        className="bg-white border border-slate-205 text-slate-705 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-blue-700 cursor-pointer flex items-center gap-1"
                      >
                        <Save className="w-4 h-4" /> 
                        <span>{editingSlide ? "Update Slide" : "Save and Install Slide"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Roster list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none" id="hero-slides-admin-registry">
                {adminSlides.length === 0 ? (
                  <div className="col-span-full py-12 text-center bg-white border border-slate-200 p-8 text-slate-400 rounded-2xl">
                    <ImageIcon className="w-10 h-10 mx-auto text-slate-305 mb-2" />
                    <p className="text-xs font-bold">Standard fallback slides are operational in landing page.</p>
                  </div>
                ) : (
                  adminSlides.map((slide) => (
                    <div key={slide.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between hover:border-blue-500 duration-200 relative group">
                      <button 
                        onClick={() => handleDeleteSlide(slide.id)}
                        className="absolute right-3 top-3 z-10 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 hover:scale-105 transition-all shadow cursor-pointer font-sans"
                        title="Delete photo"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>

                      <div className="h-44 bg-slate-900 relative">
                        <img 
                          src={slide.imageUrl} 
                          alt={slide.title} 
                          className="w-full h-full object-cover opacity-60"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-x-4 bottom-4 text-white text-left">
                          <span className="font-mono text-[8.5px] tracking-wider uppercase bg-blue-600 text-white px-2 py-0.5 rounded font-bold">Slide Registry: {slide.id}</span>
                          <h4 className="text-xs font-bold line-clamp-1 mt-1">{slide.title}</h4>
                        </div>
                      </div>

                      <div className="p-4 flex-grow text-left">
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{slide.subtitle}</p>
                      </div>

                      <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-1.5 select-none font-sans">
                        <button 
                          onClick={() => {
                            setEditingSlide(slide);
                            setSlideForm({
                              title: slide.title,
                              subtitle: slide.subtitle,
                              imageUrl: slide.imageUrl
                            });
                            setShowAddSlide(true);
                          }}
                          className="p-1 px-3 border border-slate-205 hover:bg-white text-slate-650 text-[10px] font-extrabold uppercase rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <Edit className="w-3 h-3" /> Edit Slide details
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {reviewedStudent && (() => {
        // Find all loan history for this student
        const studentLoans = borrowRecords.filter(r => (r.studentRoll || '').toUpperCase() === (reviewedStudent.rollNumber || '').toUpperCase());
        const activeLoans = studentLoans.filter(r => r.status !== 'RETURNED');
        const activeLoansCount = activeLoans.length;

        // Find all fines for this student
        const studentFines = fines.filter(f => (f.studentRoll || '').toUpperCase() === (reviewedStudent.rollNumber || '').toUpperCase());
        const unpaidFineSum = studentFines.filter(f => f.status === 'UNPAID').reduce((sum, f) => sum + f.amount, 0);

        const isClearForCertificate = activeLoansCount === 0 && unpaidFineSum === 0;

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans overflow-y-auto animate-fade-in" id="student-review-overlay">
            <div className="bg-white border border-slate-200 w-full max-w-4xl shadow-2xl flex flex-col md:flex-row h-auto max-h-[90vh] overflow-hidden rounded-xl animate-scale-up" id="student-review-modal-content">
              
              {/* LEFT PROFILE PANEL */}
              <div className="w-full md:w-1/3 bg-slate-50 border-r border-slate-100 p-6 flex flex-col justify-between shrink-0">
                <div className="space-y-6">
                  {/* Title & Close */}
                  <div className="flex justify-between items-start md:block">
                    <div>
                      <span className="text-[10px] bg-blue-100 border border-blue-200 text-blue-800 font-extrabold px-2 py-0.5 uppercase tracking-wider rounded">
                        PORTAL DIRECTORY
                      </span>
                      <h2 className="text-base font-extrabold text-slate-900 mt-2 tracking-tight">Student Profile</h2>
                      <p className="text-[11px] text-slate-450 leading-relaxed font-semibold">Administrative Audit console</p>
                    </div>
                    <button 
                      onClick={() => {
                        setReviewedStudent(null);
                        setEditingFine(null);
                        setShowCertificateView(false);
                      }}
                      className="md:hidden p-1 text-slate-400 hover:text-slate-800 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Identification Card */}
                  <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-2xs space-y-3 relative overflow-hidden animate-fade-in">
                    <div className="absolute right-[-15px] top-[-15px] w-24 h-24 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center opacity-70 select-none">
                      <Users className="w-10 h-10 text-slate-300" />
                    </div>
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-inner tracking-wider shrink-0">
                        {(reviewedStudent.name || '').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-slate-800 leading-snug">{reviewedStudent.name}</h3>
                        <p className="text-[10px] text-slate-400 font-bold font-mono tracking-wider mt-0.5">{reviewedStudent.rollNumber}</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 relative z-10 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <p className="text-slate-405 font-bold uppercase text-[9px] tracking-wider">Department</p>
                        <p className="font-extrabold text-slate-700">{reviewedStudent.department}</p>
                      </div>
                      <div>
                        <p className="text-slate-405 font-bold uppercase text-[9px] tracking-wider">Semester</p>
                        <p className="font-extrabold text-slate-700">Semester {reviewedStudent.semester}</p>
                      </div>
                      <div className="col-span-2 pt-1">
                        <p className="text-slate-450 font-bold uppercase text-[9px] tracking-wider">Portal Access status</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`w-2 h-2 rounded-full ${reviewedStudent.isActive ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                          <span className="font-bold text-slate-705 uppercase text-[10px] tracking-wide">
                            {reviewedStudent.isActive ? "ACTIVE PORTAL / সচল" : "BLOCKED PORTAL / স্থগিত"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Analytics Stats */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded">
                      <div className="flex items-center gap-2">
                        <BookOpenCheck className="w-4 h-4 text-blue-500" />
                        <span className="text-[11px] font-bold text-slate-605">Active Book Loans</span>
                      </div>
                      <span className={`font-mono text-xs font-extrabold px-2 py-0.5 rounded ${activeLoansCount > 0 ? "bg-amber-150 text-amber-900 border border-amber-200" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                        {activeLoansCount} Copies
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-rose-500" />
                        <span className="text-[11px] font-bold text-slate-605">Arrear Late Fines</span>
                      </div>
                      <span className={`font-mono text-xs font-extrabold px-2 py-0.5 rounded ${unpaidFineSum > 0 ? "bg-red-100 text-red-800 border border-red-200 animate-pulse" : "bg-emerald-100 text-emerald-800 border border-emerald-200"}`}>
                        BDT {unpaidFineSum}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CLEARANCE DECISION & CERTIFICATE DOWNLOAD PANEL */}
                <div className="pt-6 border-t border-slate-200 space-y-3">
                  {isClearForCertificate ? (
                    <div className="space-y-2.5">
                      <div className="bg-emerald-50 border border-emerald-200 p-3.5 text-left text-emerald-950 rounded">
                        <p className="text-[11px] font-extrabold flex items-center gap-1.5 uppercase tracking-wide">
                          <CheckCircle className="w-4 h-4 text-emerald-600" /> Clearance Approved!
                        </p>
                        <p className="text-[10px] text-emerald-700 leading-normal font-semibold mt-1">
                          The student has zero physical book borrowings outstanding and zero late cash fine debts. Officially eligible to download Clearance Certificate.
                        </p>
                      </div>
                      <button 
                        onClick={() => setShowCertificateView(true)}
                        className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-[11px] uppercase tracking-wider transition-all duration-150 shadow-md hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer rounded"
                        id="generate-clearance-btn"
                      >
                        <FileText className="w-4 h-4" />
                        Get Clearance Certificate
                      </button>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 p-3.5 text-left text-amber-950 rounded">
                      <p className="text-[11px] font-extrabold flex items-center gap-1.5 uppercase tracking-wide">
                        <AlertCircle className="w-4 h-4 text-amber-600" /> Clearance Locked (স্থগিত)
                      </p>
                      <div className="text-[10px] text-amber-705 mt-1 leading-normal font-medium">
                        Student cannot obtain Clearance Certificate until:
                        <ul className="list-disc ml-4 mt-1 space-y-0.5 font-semibold text-amber-900">
                          {activeLoansCount > 0 && <li>Return {activeLoansCount} physical copy books</li>}
                          {unpaidFineSum > 0 && <li>Clear BDT {unpaidFineSum} overdue fine records</li>}
                        </ul>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => {
                      setReviewedStudent(null);
                      setEditingFine(null);
                      setShowCertificateView(false);
                    }}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-700 font-extrabold text-[11px] uppercase tracking-widest cursor-pointer text-center rounded transition-colors"
                  >
                    Close Portal Overlay
                  </button>
                </div>
              </div>

              {/* RIGHT CONTENT WORKSPACE */}
              <div className="flex-grow p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
                
                {showCertificateView ? (
                  /* CLEARANCE CERTIFICATE RENDER COMPONENT */
                  <div className="space-y-4 animate-fade-in" id="clearance-certificate-workspace">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                        <FileText className="w-4.5 h-4.5 text-emerald-600" /> No-Demand Library Clearance Statement
                      </h3>
                      <button 
                        onClick={() => setShowCertificateView(false)}
                        className="text-[11.5px] font-bold text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        &larr; Return to Profile View
                      </button>
                    </div>

                    {/* Highly Styled Golden-Border Official Certificate Box */}
                    <div 
                      className="bg-white border-4 border-amber-500/75 p-6 sm:p-10 text-center relative select-none rounded shadow-md overflow-hidden bg-[radial-gradient(#f8fafc_1px,transparent_1px)] [background-size:16px_16px]"
                      id="printable-clearance-certificate-frame"
                    >
                      {/* Technical Watermark Emblem background */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
                        <BookOpen className="w-72 h-72 text-slate-900" />
                      </div>

                      {/* Certificate Golden Border lines */}
                      <div className="absolute inset-1 border border-amber-600/30 pointer-events-none"></div>

                      <div className="relative z-10 space-y-6">
                        {/* Certificate Header */}
                        <div className="space-y-1">
                          <p className="text-[10px] font-extrabold text-blue-800 uppercase tracking-widest">ScholarLib Central Library System</p>
                          <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">DHAKA CST INSTITUTION OF EDUCATION</h4>
                          <p className="text-[9px] text-slate-400 font-mono">Mirpur Academic Belt, Block-D / Central Registry</p>
                        </div>

                        {/* Seal Emblem Image Placeholder */}
                        <div className="w-14 h-14 mx-auto bg-amber-50 rounded-full border border-amber-300 flex items-center justify-center shadow-xs">
                          <CheckCircle className="w-8 h-8 text-amber-600" />
                        </div>

                        {/* Title of Certificate */}
                        <div className="space-y-1">
                          <h5 className="text-xs sm:text-sm font-black text-amber-950 uppercase tracking-widest border-b border-dashed border-amber-200 pb-1 max-w-sm mx-auto">
                            LIBRARY NO-DEMAND CLEARANCE
                          </h5>
                          <p className="text-[9px] text-slate-500 font-mono">Certificate Serial: CST-LIB-2026-{reviewedStudent.rollNumber.replace(/-/g, '')}</p>
                        </div>

                        {/* Official Bilingual Body Text */}
                        <div className="max-w-2xl mx-auto space-y-3 text-slate-800 text-[11px] sm:text-xs leading-relaxed text-center font-sans">
                          <p className="font-semibold text-slate-700">
                            This is to officially declare that the library record base of the student detailed below has been thoroughly audited with central computer indices:
                          </p>
                          
                          {/* Student Identification Meta-Box inside certificate */}
                          <div className="bg-slate-50/80 border border-slate-205 p-3 grid grid-cols-3 gap-2 text-left max-w-lg mx-auto rounded">
                            <div>
                              <span className="block text-[8px] text-slate-400 uppercase font-black tracking-wider">Candidate Name:</span>
                              <strong className="text-slate-850 font-extrabold text-[11px]">{reviewedStudent.name}</strong>
                            </div>
                            <div>
                              <span className="block text-[8px] text-slate-400 uppercase font-black tracking-wider">Roll/ID Number:</span>
                              <strong className="text-slate-850 font-extrabold text-[11px] font-mono">{reviewedStudent.rollNumber}</strong>
                            </div>
                            <div>
                              <span className="block text-[8px] text-slate-400 uppercase font-black tracking-wider">Department:</span>
                              <strong className="text-slate-850 font-extrabold text-[11px]">{reviewedStudent.department} / Sem {reviewedStudent.semester}</strong>
                            </div>
                          </div>

                          <p className="text-slate-600 font-medium px-4">
                            আমাদের ডাটাবেজ অনুযায়ী উক্ত শিক্ষার্থী কোনো বই ধার রাখেননি এবং তাঁর নিকট কোনো জরিমানা বা পেমেন্ট বকেয়া নেই। গ্রন্থাগার কর্তৃপক্ষ তাঁকে সফলভাবে সম্পূর্ণ ক্লিয়ারেন্স সার্টিফিকেট এবং ছাড়পত্র প্রদান করছে।
                          </p>
                          <p className="text-[10.5px] font-medium leading-relaxed italic text-slate-600">
                            "The candidate currently holds <strong className="text-emerald-700 font-bold">0 unreturned textbooks</strong> and carries <strong className="text-emerald-700 font-bold">BDT 0 overdue late outstanding fees</strong>. The candidate is fully cleared from any and all legal demands of the Library Directory Registry Console."
                          </p>
                        </div>

                        <div className="pt-4 border-t border-slate-105 grid grid-cols-2 gap-4 max-w-md mx-auto items-end">
                          <div className="text-center font-sans space-y-1">
                            <div className="h-6 flex items-center justify-center font-mono text-[9px] text-slate-400 italic">Central Database Verified</div>
                            <span className="block h-px bg-slate-250 w-24 mx-auto"></span>
                            <span className="text-[9px] text-slate-450 uppercase font-black">System Stamp</span>
                          </div>
                          <div className="text-center font-sans space-y-1">
                            <div className="h-6 flex items-center justify-center font-mono text-[10px] text-blue-700 font-bold uppercase tracking-widest">ScholarLib Server</div>
                            <span className="block h-px bg-slate-250 w-24 mx-auto"></span>
                            <span className="text-[9px] text-slate-450 uppercase font-black">Authorized Registrar</span>
                          </div>
                        </div>

                        {/* QR Code / Barcode Simulation */}
                        <div className="flex justify-center pt-2">
                          <div className="bg-slate-50 border border-slate-200 px-3 py-1 font-mono text-[9px] text-slate-500 rounded tracking-widest flex items-center gap-1.5 select-none uppercase">
                            <span>||| | |||| || | | || | | ||</span>
                            <strong>VERIFIED SYSTEM CLEARANCE</strong>
                            <span>|| | ||| | ||| ||</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end items-center">
                      <button 
                        onClick={() => {
                          const printContents = document.getElementById('printable-clearance-certificate-frame')?.outerHTML;
                          if (printContents) {
                            const popupWin = window.open('', '_blank', 'width=850,height=750');
                            if (popupWin) {
                              popupWin.document.open();
                              popupWin.document.write(`
                                <html>
                                  <head>
                                    <title>Print No-Demand Certificate - ${reviewedStudent.name}</title>
                                    <script src="https://cdn.tailwindcss.com"></script>
                                    <style>
                                      body { background-color: white; padding: 2.5cm; font-family: system-ui, sans-serif; }
                                      @media print {
                                        body { padding: 1.5cm; }
                                      }
                                    </style>
                                  </head>
                                  <body onload="window.print();">
                                    <div class="border-4 border-amber-500/75 p-12 text-center relative rounded shadow-md overflow-hidden max-w-4xl mx-auto">
                                      ${printContents}
                                    </div>
                                  </body>
                                </html>
                              `);
                              popupWin.document.close();
                            } else {
                              alert("Pop-up blocked! Please click allow pop-up from Chrome settings to enable direct document printing.");
                            }
                          }
                        }}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded flex items-center gap-1.5 cursor-pointer shadow transition-transform hover:scale-[1.01]"
                        id="print-certificate-btn-action"
                      >
                        <Printer className="w-4 h-4" />
                        Print Certificate / Save PDF
                      </button>
                      <button 
                        onClick={() => setShowCertificateView(false)}
                        className="px-4 py-2.5 bg-slate-100 border border-slate-250 text-slate-700 hover:bg-slate-200 font-bold text-xs uppercase tracking-wider rounded cursor-pointer"
                      >
                        Back to Profile
                      </button>
                    </div>
                  </div>
                ) : (
                  /* PROFILE METRIC AND FINES REVIEW WORKSPACE */
                  <div className="space-y-6 animate-fade-in">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                          Portfolio Workspace: <strong className="text-slate-800 font-mono">{reviewedStudent.name}</strong>
                        </h3>
                        <p className="text-[10.5px] text-slate-450 font-sans mt-0.5 font-semibold">Active borrowings history logs and penalty cash books.</p>
                      </div>
                      <button 
                        onClick={() => {
                          setReviewedStudent(null);
                          setEditingFine(null);
                          setShowCertificateView(false);
                        }}
                        className="hidden md:flex p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-800 border border-slate-200 transition-colors cursor-pointer"
                        title="Close pop-up review"
                      >
                        <X className="w-4.5 h-4.5" />
                      </button>
                    </div>

                    {/* DYNAMIC FINE EDITOR COMPONENT INCASE ADMIN SELECTS A FINE TO EDIT / OR SUBMITS IT */}
                    {editingFine && (
                      <div className="bg-gradient-to-br from-amber-50/50 to-white border-2 border-amber-300 p-5 rounded-xl shadow-md animate-fade-in space-y-4" id="fine-dynamic-editor-console">
                        <div className="flex justify-between items-center border-b border-amber-200 pb-1.5">
                          <h4 className="text-xs font-black text-amber-950 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                            <Edit className="w-4.5 h-4.5 text-amber-600 animate-pulse" />
                            Fine Adjustment Desk // Record ID: <span className="font-mono text-[10.5px] bg-amber-100 text-amber-900 px-1 rounded font-black">{editingFine.id}</span>
                          </h4>
                          <button 
                            onClick={() => setEditingFine(null)}
                            className="text-[10px] text-amber-700 hover:text-rose-700 font-extrabold hover:underline cursor-pointer"
                          >
                            Discard edits
                          </button>
                        </div>

                        <form onSubmit={handleUpdateFine} className="grid grid-cols-1 md:grid-cols-3 gap-4" id="fine-edit-subform">
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Fine Outstanding (BDT Amount)</label>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-xs text-slate-405 font-bold">BDT</span>
                              <input 
                                type="number" 
                                required
                                min="0" 
                                value={fineEditAmount}
                                onChange={(e) => setFineEditAmount(Number(e.target.value))}
                                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded text-xs font-extrabold focus:outline-none focus:border-blue-500 bg-white"
                                id="fine-edit-amount-input"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Fee Penalty Status Index</label>
                            <select 
                              value={fineEditStatus}
                              onChange={(e: any) => setFineEditStatus(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-bold focus:outline-none focus:border-blue-500 bg-white"
                              id="fine-edit-status-select"
                            >
                              <option value="UNPAID">UNPAID (বকেয়া জরিমানা)</option>
                              <option value="PAID">PAID (জরিমানা পরিশোধিত)</option>
                              <option value="WAIVED">WAIVED (জরিমানা মওকুফ)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Detailed Reason Statement</label>
                            <input 
                              type="text" 
                              required
                              value={fineEditReason}
                              onChange={(e) => setFineEditReason(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-semibold focus:outline-none focus:border-blue-500 bg-white"
                              placeholder="Overdue reason or book return gap"
                              id="fine-edit-reason-input"
                            />
                          </div>

                          <div className="col-span-full pt-2 flex gap-2 justify-end">
                            <button 
                              type="button" 
                              onClick={() => setEditingFine(null)}
                              className="px-4 py-1.5 border border-slate-300 text-slate-650 rounded bg-white text-xs font-bold hover:bg-slate-50 cursor-pointer"
                            >
                              Discard
                            </button>
                            <button 
                              type="submit" 
                              disabled={savingFineLoading} 
                              className="px-5 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white rounded text-xs font-extrabold cursor-pointer transition-colors shadow-xs"
                              id="confirm-fine-adjustment-btn"
                            >
                              {savingFineLoading ? "Saving adjustments..." : "Save Adjustments"}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* PHYSICAL COPY BORROW STATUS */}
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-widest border-l-4 border-blue-500 pl-2">
                        Physical Textbook Borrowings Indices
                      </h4>
                      {studentLoans.length === 0 ? (
                        <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded">
                          <p className="text-xs text-slate-450 font-semibold font-sans">No book borrowings record history in library network logs.</p>
                        </div>
                      ) : (
                        <div className="bg-white border border-slate-200 overflow-hidden shadow-2xs rounded-lg">
                          <table className="w-full text-[11px] text-left border-collapse font-sans text-slate-600">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[9px] font-bold select-none text-left">
                                <th className="p-3">Book details / Format</th>
                                <th className="p-3">Loan Period</th>
                                <th className="p-3">Return Due</th>
                                <th className="p-3 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {studentLoans.map((loan) => {
                                const isOverdue = loan.status !== 'RETURNED' && new Date() > new Date(loan.dueDate);
                                return (
                                  <tr key={loan.id} className="hover:bg-slate-50/40">
                                    <td className="p-3">
                                      <p className="font-extrabold text-slate-800 leading-tight">"{loan.bookTitle}"</p>
                                      <p className="text-[9.5px] text-slate-404 font-mono mt-0.5">Loan Registry: {loan.id}</p>
                                    </td>
                                    <td className="p-3 font-semibold text-slate-650">
                                      {new Date(loan.borrowDate).toLocaleDateString()} <span className="text-slate-350 mx-1">&rarr;</span> {loan.durationDays} days duration
                                    </td>
                                    <td className="p-3">
                                      <p className={`font-mono font-bold ${isOverdue ? 'text-rose-600 underline' : 'text-slate-700'}`}>
                                        {new Date(loan.dueDate).toLocaleDateString()}
                                      </p>
                                      {isOverdue && (
                                        <p className="text-[9px] text-rose-650 font-black uppercase tracking-wider">OVERDUE LIMIT PASSED</p>
                                      )}
                                    </td>
                                    <td className="p-3 text-center">
                                      {loan.status === 'RETURNED' ? (
                                        <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider font-mono rounded">
                                          RETURNED (ফেরতপ্রাপ্ত)
                                        </span>
                                      ) : loan.status === 'BORROWED' ? (
                                        <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider font-mono rounded ${isOverdue ? 'bg-rose-50 border border-rose-200 text-rose-700 animate-pulse' : 'bg-amber-50 border border-amber-250 text-amber-800'}`}>
                                          BORROWED (সংগৃহীত)
                                        </span>
                                      ) : (
                                        <span className="bg-blue-50 border border-blue-200 text-blue-705 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider font-mono rounded">
                                          {loan.status}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* FINES PENALTIES LIST CONSOLE (CLICK TO EDIT ACTION) */}
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-widest border-l-4 border-rose-500 pl-2 flex items-center justify-between">
                        <span>Fines Register & Cash Collections statement</span>
                        <span className="text-[9.5px] text-slate-400 lowercase italic font-sans font-normal">Click individual fine ID, reason text or edit icon to edit properties</span>
                      </h4>
                      {studentFines.length === 0 ? (
                        <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded">
                          <p className="text-xs text-slate-450 font-semibold font-sans">Student has zero past late return charges or fines statement records.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {studentFines.map((item) => (
                            <div 
                              key={item.id}
                              className={`p-3.5 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all ${item.status === 'UNPAID' ? 'bg-rose-50/20 border-rose-100 hover:border-rose-400' : item.status === 'PAID' ? 'bg-emerald-50/10 border-emerald-100' : 'bg-slate-50/40 border-slate-200'}`}
                            >
                              <div 
                                onClick={() => {
                                  // Click ID or reason text to quickly configure fine editing mode
                                  setEditingFine(item);
                                  setFineEditAmount(item.amount);
                                  setFineEditReason(item.reason);
                                  setFineEditStatus(item.status);
                                }}
                                className="cursor-pointer group flex-grow text-left space-y-1 select-none"
                                title="Click to edit/mark this fine record details"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="bg-slate-205 text-slate-700 font-mono text-[9px] font-black px-1.5 py-0.5 uppercase rounded group-hover:bg-amber-100 group-hover:text-amber-900 transition-colors">
                                    ID: {item.id} (Click ✍️)
                                  </span>
                                  <span className={`px-2 py-0.5 shrink-0 rounded text-[9px] font-black tracking-wider uppercase font-mono ${item.status === 'UNPAID' ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse' : item.status === 'PAID' ? 'bg-emerald-50 border border-emerald-250 text-emerald-850' : 'bg-slate-100 border border-slate-150 text-slate-600'}`}>
                                    {item.status === 'UNPAID' ? "UNPAID / বকেয়া" : item.status === 'PAID' ? "PAID / পরিশোধিত" : "WAIVED / মওকুফ"}
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-slate-803 leading-normal group-hover:text-blue-700 transition-colors">
                                  {item.reason}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono">Date Charged: {new Date(item.createdAt || item.id.split('-')[1] ? Number(item.id.split('-')[1]) : Date.now()).toLocaleDateString()}</p>
                              </div>

                              <div className="shrink-0 flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-start pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 sm:border-none">
                                <div className="text-right mr-2">
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Overdue Late Fine</p>
                                  <p className={`text-sm font-black font-mono ${item.status === 'UNPAID' ? 'text-rose-650' : 'text-slate-850'}`}>
                                    BDT {item.amount}
                                  </p>
                                </div>

                                <div className="flex gap-1 justify-end">
                                  {item.status === 'UNPAID' && (
                                    <button 
                                      onClick={() => handleDirectPayFine(item.id)}
                                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-extrabold text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                                      title="Mark immediately as cash received"
                                    >
                                      <DollarSign className="w-3 h-3" />
                                      Pay Cash
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => {
                                      setEditingFine(item);
                                      setFineEditAmount(item.amount);
                                      setFineEditReason(item.reason);
                                      setFineEditStatus(item.status);
                                    }}
                                    className="p-1 px-2 border border-slate-300 hover:border-slate-800 text-slate-700 hover:text-slate-900 bg-white rounded font-bold text-[10px] cursor-pointer flex items-center gap-0.5 uppercase tracking-wide shrink-0 transition-colors"
                                    title="Edit Fine details"
                                  >
                                    <Edit className="w-3 h-3" />
                                    Edit
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}

              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
