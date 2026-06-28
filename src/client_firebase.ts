import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  writeBatch, 
  getDocFromServer
} from 'firebase/firestore';
import { Book, Student, BorrowRecord, Fine, Notification, Librarian, GalleryItem, LibraryStatus, BrandingConfig, SupportMessage } from './types.js';
import firebaseConfig from '../firebase-applet-config.json';
import studentsJson from './students_400.json';
import { generate1000Books, BANGLA_BOOKS, generate50EBooks } from './server_db.js';

// Initialize Firebase client SDK
const app = initializeApp(firebaseConfig);

// Connect to the designated Firestore database instance
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export function sanitizeForFirestore(data: any): any {
  if (data === null || data === undefined) return null;
  if (Array.isArray(data)) {
    return data.map(sanitizeForFirestore);
  }
  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const key in data) {
      if (data[key] !== undefined) {
        sanitized[key] = sanitizeForFirestore(data[key]);
      }
    }
    return sanitized;
  }
  return data;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Client-side implementation of student generation using direct JSON import
export function generate400StudentsClient(): { [roll: string]: Student & { password?: string } } {
  const students: { [roll: string]: Student & { password?: string } } = {};
  try {
    if (Array.isArray(studentsJson)) {
      studentsJson.forEach((item: any) => {
        const rollStr = String(item.roll).trim();
        const uidStr = String(item.UID).trim().toUpperCase();
        
        const studentObj: Student & { password?: string } = {
          name: item.name,
          rollNumber: rollStr,
          department: item.department || "CST",
          semester: Number(item.semester) || 1,
          password: item.password || `pass-${rollStr}`,
          isActive: true
        };
        
        students[rollStr] = studentObj;
        students[uidStr] = {
          ...studentObj,
          rollNumber: uidStr
        };
      });
    }
  } catch (err) {
    console.error("Error parsing studentsJson:", err);
  }
  return students;
}

/**
 * Check if the database has already been seeded.
 * If not, seed initial books, students, borrows, and notifications.
 */
export async function seedDatabaseIfEmpty() {
  try {
    const book1Snap = await getDoc(doc(db, 'books', 'book-1'));
    const banglaDocSnap = await getDoc(doc(db, 'books', 'bangla-1'));
    const ebookSeed1Snap = await getDoc(doc(db, 'books', 'ebook-seed-1'));
    
    let needsBookSeeding = false;
    if (!book1Snap.exists() || !banglaDocSnap.exists()) {
      needsBookSeeding = true;
    }
    
    if (needsBookSeeding) {
      console.log('Firebase Database books are empty or outdated. Seeding curated book collection to Cloud Firestore...');

      // 1. Seed Books in batches of 400
      const allBooks = generate1000Books();
      console.log(`Loading ${allBooks.length} real books for Firestore seeding...`);
      
      for (let i = 0; i < allBooks.length; i += 400) {
        const batch = writeBatch(db);
        const chunk = allBooks.slice(i, i + 400);
        chunk.forEach(book => {
          const bookRef = doc(db, 'books', book.id);
          batch.set(bookRef, sanitizeForFirestore(book));
        });
        await batch.commit();
        console.log(`Seeded books chunk: ${i} to ${i + chunk.length}`);
      }
    } else {
      console.log('Firebase books collection is already seeded with up-to-date real books.');
    }

    // Explicit check to guarantee 50 online E-Books are present even if physical books are already seeded
    if (!ebookSeed1Snap.exists()) {
      console.log('Firebase Database 50 digital E-Books are missing. Seeding now...');
      const ebooks = generate50EBooks();
      console.log(`Loading ${ebooks.length} E-Books for Firestore seeding...`);
      for (let i = 0; i < ebooks.length; i += 400) {
        const batch = writeBatch(db);
        const chunk = ebooks.slice(i, i + 400);
        chunk.forEach(book => {
          const bookRef = doc(db, 'books', book.id);
          batch.set(bookRef, sanitizeForFirestore(book));
        });
        await batch.commit();
        console.log(`Seeded E-Books chunk: ${i} to ${i + chunk.length}`);
      }
    } else {
      console.log('Firebase books collection already contains up-to-date online E-Books.');
    }

    // Check if new student database has been loaded
    const testDocSnap = await getDoc(doc(db, 'students', '1001'));
    if (!testDocSnap.exists()) {
      console.log('New student database not detected. Importing and seeding all 400 students...');
      const studentMap = generate400StudentsClient();
      const studentsList = Object.values(studentMap);
      
      // Filter out duplicate values
      const seenRolls = new Set<string>();
      const uniqueStudents: (Student & { password?: string })[] = [];
      studentsList.forEach(student => {
        const numericRoll = student.rollNumber.replace(/cst-/i, '').trim();
        if (/^\d+$/.test(numericRoll) && !seenRolls.has(numericRoll)) {
          seenRolls.add(numericRoll);
          uniqueStudents.push({
            ...student,
            rollNumber: numericRoll
          });
        }
      });

      // Assemble all Firestore document mutations
      const docsToWrite: { ref: any; data: any }[] = [];
      uniqueStudents.forEach(student => {
        docsToWrite.push({
          ref: doc(db, 'students', student.rollNumber),
          data: student
        });
        
        const uidUpper = `CST-${student.rollNumber}`;
        docsToWrite.push({
          ref: doc(db, 'students', uidUpper),
          data: {
            ...student,
            rollNumber: uidUpper
          }
        });
      });

      for (let i = 0; i < docsToWrite.length; i += 400) {
        const batch = writeBatch(db);
        const chunk = docsToWrite.slice(i, i + 400);
        chunk.forEach(item => {
          batch.set(item.ref, sanitizeForFirestore(item.data));
        });
        await batch.commit();
        console.log(`Uploaded student chunk ${i} to ${i + chunk.length}`);
      }
      console.log(`Seeded ${uniqueStudents.length} students successfully into Cloud Firestore.`);

      // Seed initial borrow record
      const now = new Date();
      const bDate = new Date();
      bDate.setDate(now.getDate() - 10);
      const dDate = new Date();
      dDate.setDate(bDate.getDate() + 7);

      const initialBorrow: BorrowRecord = {
        id: "borrow-seed-1",
        bookId: "book-14",
        bookTitle: "Advanced Organic Chemistry",
        bookImage: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=600&auto=format&fit=crop&q=80",
        studentRoll: "1001",
        studentName: "Rahim Uddin",
        borrowDate: bDate.toISOString(),
        durationDays: 7,
        dueDate: dDate.toISOString(),
        status: "BORROWED",
        fineAmount: 20
      };

      await setDoc(doc(db, 'borrows', initialBorrow.id), sanitizeForFirestore(initialBorrow));

      // Seed initial notifications
      const initialNotifs: Notification[] = [
        {
          id: "notif-seed-1",
          studentRoll: "1001",
          title: "Overdue Book Alert",
          message: 'The book "Advanced Organic Chemistry" was due on ' + dDate.toLocaleDateString() + '. A BDT 20 fine has been charged.',
          createdAt: now.toISOString(),
          isRead: false,
          type: "OVERDUE"
        },
        {
          id: "notif-seed-2",
          studentRoll: "", 
          title: "Exam Week Hours Extended",
          message: "The Library physical stack will remain open until 11:30 PM until July 15th to support your final exam preparations.",
          createdAt: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
          isRead: false,
          type: "INFO"
        }
      ];

      for (const notif of initialNotifs) {
        await setDoc(doc(db, 'notifications', notif.id), sanitizeForFirestore(notif));
      }

      // Seed Librarians
      const libCol = collection(db, 'librarians');
      const libSnap = await getDocs(libCol);
      if (libSnap.empty) {
        const defaultLibrarians: Librarian[] = [
          {
            id: 'lib-1',
            name: 'তানজিম আহমেদ (Tanjim Ahmed)',
            mobile: '01712004561',
            address: 'মিরপুর ২, ঢাকা',
            shift: 'Morning Shift ( সকাল ৮:০০ - দুপুর ২:০০ )'
          },
          {
            id: 'lib-2',
            name: 'ফারহানা ইসলাম (Farhana Islam)',
            mobile: '01923055990',
            address: 'ধানমন্ডি, ঢাকা',
            shift: 'Day Shift ( দুপুর ২:০০ - রাত ৮:০০ )'
          }
        ];
        for (const lib of defaultLibrarians) {
          await setDoc(doc(db, 'librarians', lib.id), sanitizeForFirestore(lib));
        }
      }

      // Seed Gallery Images
      const galleryCol = collection(db, 'gallery');
      const gallerySnap = await getDocs(galleryCol);
      if (gallerySnap.empty) {
        const defaultGallery: GalleryItem[] = [
          {
            id: 'gal-1',
            imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&auto=format&fit=crop&q=80',
            caption: 'আমাদের বিশাল ও আধুনিক পাঠ কক্ষ (Spacious Modern Reading Hall)',
            createdAt: now.toISOString()
          },
          {
            id: 'gal-2',
            imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&auto=format&fit=crop&q=80',
            caption: 'উন্নত ই-লার্নিং ও কম্পিউটার জোন (Advanced E-Learning Computer Lab)',
            createdAt: new Date(now.getTime() - 3600000).toISOString()
          },
          {
            id: 'gal-3',
            imageUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800&auto=format&fit=crop&q=80',
            caption: 'সুসজ্জিত বইয়ের সেলফ ও তাকসমূহ (Nicely Arranged Book Shells)',
            createdAt: new Date(now.getTime() - 7200000).toISOString()
          }
        ];
        for (const item of defaultGallery) {
          await setDoc(doc(db, 'gallery', item.id), sanitizeForFirestore(item));
        }
      }
    }

    // Seed default library status
    const statusDocRef = doc(db, 'library_status', 'current');
    const statusSnap = await getDoc(statusDocRef);
    if (!statusSnap.exists()) {
      const defaultStatus: LibraryStatus = {
        id: 'current',
        status: 'OPEN',
        openingTime: '08:00 AM',
        closingTime: '08:00 PM',
        weeklySchedule: 'Saturday - Thursday',
        updatedAt: new Date().toISOString()
      };
      await setDoc(statusDocRef, sanitizeForFirestore(defaultStatus));
    }

    // Seed initial notices
    const noticesCol = collection(db, 'notices');
    const noticesSnap = await getDocs(noticesCol);
    if (noticesSnap.empty) {
      const defaultNotices = [
        {
          id: 'notice-seed-1',
          title: 'Semester Final Exam Schedule & Digital Card Distribution',
          content: 'All students are hereby informed that the Semester Final Examinations are scheduled to commence shortly. It is mandatory for all students to download and print their Digital Library Card in PDF format from their profile dashboard. The printed library card is required for entry into the central study hall during the exam period.',
          attachments: 'Exam_Library_Schedule_2026.pdf',
          publishDate: new Date().toISOString().split('T')[0],
          isUrgent: true,
          isPinned: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'notice-seed-2',
          title: 'National Technology Reading Campaign & Literary Festival',
          content: 'We are thrilled to launch the CPI Central Library Annual Technology Reading Campaign. Over 50 new engineering e-books and reference handbooks have been indexed in our catalog. Participate in coding handbook deep-dives and submit review summaries to earn direct academic leaderboard points.',
          attachments: 'Tech_Campaign_Overview_2026.pdf',
          publishDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          isUrgent: false,
          isPinned: false,
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      for (const n of defaultNotices) {
        await setDoc(doc(db, 'notices', n.id), sanitizeForFirestore(n));
      }
    }

    // Seed initial hero slides
    const slidesCol = collection(db, 'hero_slides');
    const slidesSnap = await getDocs(slidesCol);
    if (slidesSnap.empty) {
      const defaultSlides = [
        {
          id: 'slide-seed-1',
          imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1600&auto=format&fit=crop&q=80',
          title: 'Unlock Infinite Technical Knowledge',
          subtitle: 'CPI Digital Library gateway offers peerless engineering literature indices, modern reading wings, and full E-Book reading hubs.',
          createdAt: new Date(Date.now() - 60000).toISOString()
        },
        {
          id: 'slide-seed-2',
          imageUrl: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1600&auto=format&fit=crop&q=80',
          title: 'Your Certified Digital Library Card is Ready',
          subtitle: 'Log in to your student workspace, complete your profile fields with precise registration numbers, and download your library credentials PDF.',
          createdAt: new Date(Date.now() - 30000).toISOString()
        },
        {
          id: 'slide-seed-3',
          imageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1600&auto=format&fit=crop&q=80',
          title: 'Active Technical Notices & Live Broadcasts',
          subtitle: 'Never miss an exam countdown. The new instant-alert administrative notice boards keep your studies synchronized.',
          createdAt: new Date().toISOString()
        }
      ];
      for (const s of defaultSlides) {
        await setDoc(doc(db, 'hero_slides', s.id), sanitizeForFirestore(s));
      }
    }

    // Seed default branding config
    const brandingDocRef = doc(db, 'branding', 'config');
    const brandingSnap = await getDoc(brandingDocRef);
    if (!brandingSnap.exists()) {
      const defaultBranding = {
        id: 'config',
        libraryName: 'CPI Central Digital Library',
        shortName: 'CpiLib',
        logoUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=120&auto=format&fit=crop&q=80',
        email: 'library@cpi.edu.bd',
        phone: '+880-1712-345678',
        address: 'CPI Campus, Technical Road, Bogura, Bangladesh',
        websiteUrl: 'https://cpi.edu.bd',
        footerText: 'The gateway to knowledge, reading excellence, and technical innovation at CPI.',
        copyrightText: '© 2026 CPI Digital Library System. Developed with academic honor.'
      };
      await setDoc(brandingDocRef, sanitizeForFirestore(defaultBranding));
    }
  } catch (error) {
    console.error('Error seeding Firebase database client-side:', error);
  }
}

// Validation helper connection on startup
async function testConnection() {
  try {
    console.log("Initializing client-side Firebase connections...");
    await seedDatabaseIfEmpty();
    console.log("Client-side Firebase connection active and checked!");
  } catch (error) {
    console.warn("Firebase connection or seed warning:", error);
  }
}
testConnection();

// ==========================================
// BOOKS FIRESTORE HELPERS
export async function getAllBooks(): Promise<Book[]> {
  try {
    const snap = await getDocs(collection(db, 'books'));
    return snap.docs.map(d => ({ ...d.data() }) as Book);
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'books');
  }
}

export async function getBookById(id: string): Promise<Book | null> {
  try {
    const snap = await getDoc(doc(db, 'books', id));
    return snap.exists() ? snap.data() as Book : null;
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, 'books/' + id);
  }
}

export async function saveBook(book: Book): Promise<void> {
  try {
    await setDoc(doc(db, 'books', book.id), sanitizeForFirestore(book));
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, 'books/' + book.id);
  }
}

export async function deleteBook(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'books', id));
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, 'books/' + id);
  }
}

// STUDENTS HELPERS
export async function getStudentByRoll(roll: string): Promise<(Student & { password?: string }) | null> {
  try {
    const snap = await getDoc(doc(db, 'students', roll));
    return snap.exists() ? snap.data() as (Student & { password?: string }) : null;
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, 'students/' + roll);
  }
}

export async function getAllStudents(): Promise<(Student & { password?: string })[]> {
  try {
    const snap = await getDocs(collection(db, 'students'));
    const all = snap.docs.map(d => d.data() as (Student & { password?: string }));
    // Filter out duplicates and keep prefixed rolls
    const seenRolls = new Set<string>();
    return all.filter(s => {
      const roll = (s.rollNumber || '').trim().toUpperCase();
      if (!roll || roll === 'ADMIN' || !isNaN(Number(roll))) return false;
      if (seenRolls.has(roll)) return false;
      seenRolls.add(roll);
      return true;
    });
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'students');
  }
}

export async function saveStudent(student: Student & { password?: string }): Promise<void> {
  try {
    await setDoc(doc(db, 'students', student.rollNumber), sanitizeForFirestore(student));
    const uidUpper = `CST-${student.rollNumber}`;
    await setDoc(doc(db, 'students', uidUpper), sanitizeForFirestore({ ...student, rollNumber: uidUpper }));
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, 'students/' + student.rollNumber);
  }
}

export async function deleteStudent(roll: string): Promise<void> {
  try {
    const r = roll.trim();
    const upper = r.toUpperCase();
    const lower = r.toLowerCase();
    
    // Delete base forms
    await deleteDoc(doc(db, 'students', r));
    await deleteDoc(doc(db, 'students', upper));
    await deleteDoc(doc(db, 'students', lower));
    
    // Delete CST-prefixed forms
    await deleteDoc(doc(db, 'students', `CST-${r}`));
    await deleteDoc(doc(db, 'students', `CST-${upper}`));
    await deleteDoc(doc(db, 'students', `cst-${lower}`));
    
    // If it starts with CST- or similar prefixes, also delete the raw suffixes
    if (upper.startsWith('CST-') || upper.startsWith('CSE-') || upper.startsWith('BBA-') || upper.startsWith('HIS-')) {
      const bare = r.substring(4);
      await deleteDoc(doc(db, 'students', bare));
      await deleteDoc(doc(db, 'students', bare.toUpperCase()));
      await deleteDoc(doc(db, 'students', bare.toLowerCase()));
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, 'students/' + roll);
  }
}

// BORROW RECORDS HELPERS
export async function getAllBorrows(): Promise<BorrowRecord[]> {
  try {
    const snap = await getDocs(collection(db, 'borrows'));
    return snap.docs.map(d => d.data() as BorrowRecord);
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'borrows');
  }
}

export async function getBorrowById(id: string): Promise<BorrowRecord | null> {
  try {
    const snap = await getDoc(doc(db, 'borrows', id));
    return snap.exists() ? snap.data() as BorrowRecord : null;
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, 'borrows/' + id);
  }
}

export async function saveBorrow(record: BorrowRecord): Promise<void> {
  try {
    await setDoc(doc(db, 'borrows', record.id), sanitizeForFirestore(record));
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, 'borrows/' + record.id);
  }
}

// FINES HELPERS
export async function getAllFines(): Promise<Fine[]> {
  try {
    const snap = await getDocs(collection(db, 'fines'));
    return snap.docs.map(d => d.data() as Fine);
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'fines');
  }
}

export async function getFineById(id: string): Promise<Fine | null> {
  try {
    const snap = await getDoc(doc(db, 'fines', id));
    return snap.exists() ? snap.data() as Fine : null;
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, 'fines/' + id);
  }
}

export async function saveFine(fine: Fine): Promise<void> {
  try {
    await setDoc(doc(db, 'fines', fine.id), sanitizeForFirestore(fine));
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, 'fines/' + fine.id);
  }
}

// NOTIFICATIONS HELPERS
export async function getNotificationsForRoll(roll: string): Promise<Notification[]> {
  try {
    const snap = await getDocs(collection(db, 'notifications'));
    const all = snap.docs.map(d => d.data() as Notification);
    if (!roll) return all.filter(n => !n.studentRoll);
    return all.filter(n => n.studentRoll === roll || n.studentRoll === "");
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'notifications');
  }
}

export async function getNotificationById(id: string): Promise<Notification | null> {
  try {
    const snap = await getDoc(doc(db, 'notifications', id));
    return snap.exists() ? snap.data() as Notification : null;
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, 'notifications/' + id);
  }
}

export async function saveNotification(notif: Notification): Promise<void> {
  try {
    await setDoc(doc(db, 'notifications', notif.id), sanitizeForFirestore(notif));
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, 'notifications/' + notif.id);
  }
}

export async function deleteNotification(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'notifications', id));
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, 'notifications/' + id);
  }
}

// LIBRARIANS HELPERS
export async function getAllLibrarians(): Promise<Librarian[]> {
  try {
    const snap = await getDocs(collection(db, 'librarians'));
    return snap.docs.map(d => d.data() as Librarian);
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'librarians');
  }
}

export async function saveLibrarian(lib: Librarian): Promise<void> {
  try {
    await setDoc(doc(db, 'librarians', lib.id), sanitizeForFirestore(lib));
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, 'librarians/' + lib.id);
  }
}

export async function deleteLibrarian(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'librarians', id));
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, 'librarians/' + id);
  }
}

// GALLERY HELPERS
export async function getAllGalleryItems(): Promise<GalleryItem[]> {
  try {
    const snap = await getDocs(collection(db, 'gallery'));
    return snap.docs.map(d => d.data() as GalleryItem);
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'gallery');
  }
}

export async function saveGalleryItem(item: GalleryItem): Promise<void> {
  try {
    await setDoc(doc(db, 'gallery', item.id), sanitizeForFirestore(item));
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, 'gallery/' + item.id);
  }
}

export async function deleteGalleryItem(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'gallery', id));
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, 'gallery/' + id);
  }
}

// STATUS HELPERS
export async function getLibraryStatus(): Promise<LibraryStatus> {
  try {
    const docSnap = await getDoc(doc(db, 'library_status', 'current'));
    if (docSnap.exists()) return docSnap.data() as LibraryStatus;
    const defaultStatus: LibraryStatus = {
      id: 'current',
      status: 'OPEN',
      openingTime: '08:00 AM',
      closingTime: '08:00 PM',
      weeklySchedule: 'Saturday - Thursday',
      updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'library_status', 'current'), sanitizeForFirestore(defaultStatus));
    return defaultStatus;
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, 'library_status/current');
  }
}

export async function saveLibraryStatus(status: LibraryStatus): Promise<void> {
  try {
    await setDoc(doc(db, 'library_status', 'current'), sanitizeForFirestore(status));
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, 'library_status/current');
  }
}

// NOTICES HELPERS
export async function getAllNotices(): Promise<any[]> {
  try {
    const snap = await getDocs(collection(db, 'notices'));
    return snap.docs.map(d => d.data());
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'notices');
  }
}

export async function getNoticeById(id: string): Promise<any | null> {
  try {
    const snap = await getDoc(doc(db, 'notices', id));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, 'notices/' + id);
  }
}

export async function saveNotice(notice: any): Promise<void> {
  try {
    await setDoc(doc(db, 'notices', notice.id), sanitizeForFirestore(notice));
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, 'notices/' + notice.id);
  }
}

export async function deleteNotice(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'notices', id));
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, 'notices/' + id);
  }
}

// HERO SLIDES HELPERS
export async function getAllHeroSlides(): Promise<any[]> {
  try {
    const snap = await getDocs(collection(db, 'hero_slides'));
    return snap.docs.map(d => d.data());
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'hero_slides');
  }
}

export async function saveHeroSlide(slide: any): Promise<void> {
  try {
    await setDoc(doc(db, 'hero_slides', slide.id), sanitizeForFirestore(slide));
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, 'hero_slides/' + slide.id);
  }
}

export async function deleteHeroSlide(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'hero_slides', id));
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, 'hero_slides/' + id);
  }
}

// BRANDING HELPERS
export async function getBrandingConfig(): Promise<BrandingConfig> {
  try {
    const docSnap = await getDoc(doc(db, 'branding', 'config'));
    if (docSnap.exists()) return docSnap.data() as BrandingConfig;
    const defaultBranding: BrandingConfig = {
      id: 'config',
      libraryName: 'CPI Central Digital Library',
      shortName: 'CpiLib',
      logoUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=120&auto=format&fit=crop&q=80',
      email: 'library@cpi.edu.bd',
      phone: '+880-1712-345678',
      address: 'CPI Campus, Technical Road, Bogura, Bangladesh',
      websiteUrl: 'https://cpi.edu.bd',
      footerText: 'The gateway to knowledge, reading excellence, and technical innovation at CPI.',
      copyrightText: '© 2026 CPI Digital Library System. Developed with academic honor.'
    };
    await setDoc(doc(db, 'branding', 'config'), sanitizeForFirestore(defaultBranding));
    return defaultBranding;
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, 'branding/config');
  }
}

export async function saveBrandingConfig(config: BrandingConfig): Promise<void> {
  try {
    await setDoc(doc(db, 'branding', 'config'), sanitizeForFirestore(config));
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, 'branding/config');
  }
}

// SUPPORT HELPERS
export async function getAllSupportMessages(): Promise<SupportMessage[]> {
  try {
    const snap = await getDocs(collection(db, 'support_messages'));
    return snap.docs.map(d => d.data() as SupportMessage);
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'support_messages');
  }
}

export async function saveSupportMessage(msg: SupportMessage): Promise<void> {
  try {
    await setDoc(doc(db, 'support_messages', msg.id), sanitizeForFirestore(msg));
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, 'support_messages/' + msg.id);
  }
}

export async function deleteSupportMessage(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'support_messages', id));
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, 'support_messages/' + id);
  }
}
