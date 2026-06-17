export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  isbn: string;
  imageUrl: string;
  description: string;
  publisher: string;
  publishDate: string;
  pageCount: number;
  format: 'Hardcover' | 'Paperback' | 'E-Book';
  copiesCount: number;
  availableCopies: number;
  pdfUrl?: string; // Standard PDF URL for e-books
  ebookContentText?: string; // Full text content or chapters of the E-Book
  location?: string; // e.g. "Level 4, Shelf 212"
  edition?: string; // e.g. "2nd Edition"
  subject?: string; // e.g. "Physics / Quantum Theory"
  language?: string; // Language under standard listings
}

export interface Student {
  name: string;
  rollNumber: string; // Format: DEP-SEM-ID, e.g. CSE-4-045
  department: string; // CSE, EEE, CE, BBA, ENG
  semester: number; // 1 to 8
  password?: string;
  isActive: boolean;
  email?: string;
  phone?: string;
  session?: string;
  address?: string;
  photoUrl?: string;
  registration?: string; // registration number
  wishlist?: string[]; // Account-synced book id bookmarks
}

export interface LibraryStatus {
  id: string;
  status: 'OPEN' | 'CLOSED';
  openingTime: string;
  closingTime: string;
  weeklySchedule: string;
  updatedAt: string;
}

export interface BorrowRecord {
  id: string;
  bookId: string;
  bookTitle: string;
  bookImage: string;
  studentRoll: string;
  studentName: string;
  borrowDate: string; // ISO string
  durationDays: number; // 7, 14, 30
  dueDate: string; // ISO string
  returnDate?: string; // ISO string if returned
  status: 'PENDING_APPROVE' | 'BORROWED' | 'PENDING_RETURN' | 'RETURNED';
  fineAmount: number; // Calculated dynamic BDT fine
}

export interface Fine {
  id: string;
  studentRoll: string;
  studentName: string;
  amount: number;
  reason: string; // e.g., "Overdue: Quantum Mechanics (5 days late)"
  status: 'UNPAID' | 'PAID' | 'WAIVED';
  createdAt: string;
}

export interface Notification {
  id: string;
  studentRoll: string; // empty for general notification
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  type: 'INFO' | 'OVERDUE' | 'APPROVAL';
}

export interface Librarian {
  id: string;
  name: string;
  mobile: string;
  address: string;
  shift: string; // e.g. "Morning Shift" / "Day Shift"
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  caption: string;
  createdAt: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  title?: string;
  description?: string;
  submittedByRoll?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  attachments?: string; // image or file URL/identifier
  publishDate: string;
  expiryDate?: string;
  isUrgent: boolean;
  isPinned: boolean;
  createdAt: string;
}

export interface HeroSlide {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  createdAt: string;
}

export interface BrandingConfig {
  id: string; // "config"
  libraryName: string;
  shortName: string;
  logoUrl: string;
  email: string;
  phone: string;
  address: string;
  websiteUrl: string;
  footerText: string;
  copyrightText: string;
}

export interface SupportMessage {
  id: string;
  name: string;
  email: string;
  rollNumber?: string;
  registration?: string;
  department?: string;
  semester?: number;
  subject?: string;
  message: string;
  createdAt: string; // ISO string
  status: 'PENDING' | 'READ' | 'ARCHIVED' | 'REPLIED';
  replyText?: string;
  repliedAt?: string;
}

