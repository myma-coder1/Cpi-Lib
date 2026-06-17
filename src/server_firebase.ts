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
  query, 
  limit,
  getDocFromServer
} from 'firebase/firestore';
import { Book, Student, BorrowRecord, Fine, Notification, Librarian, GalleryItem, LibraryStatus, BrandingConfig, SupportMessage } from './types.js';
import { readFileSync } from 'fs';
import path from 'path';
import { generate50EBooks } from './server_db.js';

// Read config safely
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(readFileSync(configPath, 'utf-8'));

// Initialize Firebase client SDK to run on server context
const app = initializeApp(firebaseConfig);

// Connect to the designated Firestore database instance
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

/**
 * Validate Connection to Firestore on startup
 */
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection verified and active!");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    } else {
      console.log("Firebase connection testing completed.");
    }
  }
}
testConnection();

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

/**
 * Check if the database has already been seeded.
 * If not, seed initial books, students, borrows, and notifications.
 */
export async function seedDatabaseIfEmpty(
  generate1000Books: () => Book[], 
  generate400Students: () => { [roll: string]: Student & { password?: string } }
) {
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
      const studentMap = generate400Students();
      const studentsList = Object.values(studentMap);
      
      // Filter out duplicate values (keep only one record per student roll)
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

      // Assemble all Firestore document mutations (both numeric and UID lookup paths)
      const docsToWrite: { ref: any; data: any }[] = [];
      uniqueStudents.forEach(student => {
        // Doc ID format 1: numeric (e.g. "1001")
        docsToWrite.push({
          ref: doc(db, 'students', student.rollNumber),
          data: student
        });
        
        // Doc ID format 2: prefixed UID (e.g. "CST-1001")
        const uidUpper = `CST-${student.rollNumber}`;
        docsToWrite.push({
          ref: doc(db, 'students', uidUpper),
          data: {
            ...student,
            rollNumber: uidUpper
          }
        });
      });

      // Firestore limit: 500 write operations per batch. Write chunks of 400 docs.
      for (let i = 0; i < docsToWrite.length; i += 400) {
        const batch = writeBatch(db);
        const chunk = docsToWrite.slice(i, i + 400);
        chunk.forEach(item => {
          batch.set(item.ref, sanitizeForFirestore(item.data));
        });
        await batch.commit();
        console.log(`Uploaded student chunk ${i} to ${i + chunk.length}`);
      }
      console.log(`Seeded ${uniqueStudents.length} students (and prefix lookups) successfully into Cloud Firestore.`);

      // Seed initial borrow record for first-run demonstration using the new student
      const now = new Date();
      const bDate = new Date();
      bDate.setDate(now.getDate() - 10);
      const dDate = new Date();
      dDate.setDate(bDate.getDate() + 7);

      const initialBorrow: BorrowRecord = {
        id: "borrow-seed-1",
        bookId: "book-14", // Advanced Organic Chemistry
        bookTitle: "Advanced Organic Chemistry",
        bookImage: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=600&auto=format&fit=crop&q=80",
        studentRoll: "1001", // Rahim Uddin
        studentName: "Rahim Uddin",
        borrowDate: bDate.toISOString(),
        durationDays: 7,
        dueDate: dDate.toISOString(),
        status: "BORROWED",
        fineAmount: 20
      };

      await setDoc(doc(db, 'borrows', initialBorrow.id), sanitizeForFirestore(initialBorrow));

      // Seed initial notifications for student
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

      // 3. Seed Librarians if empty
      const libCol = collection(db, 'librarians');
      const libSnap = await getDocs(libCol);
      if (libSnap.empty) {
        console.log('Seeding initial library staff / librarians...');
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

      // 4. Seed Gallery Images if empty
      const galleryCol = collection(db, 'gallery');
      const gallerySnap = await getDocs(galleryCol);
      if (gallerySnap.empty) {
        console.log('Seeding initial library gallery pictures...');
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

      console.log('Cloud Firestore student table seeded successfully!');
    } else {
      console.log('Firebase students collection already seeded with students_400.json records.');
    }

    // 5. Seed default library status if empty
    const statusDocRef = doc(db, 'library_status', 'current');
    const statusSnap = await getDoc(statusDocRef);
    if (!statusSnap.exists()) {
      console.log('Seeding default library status to Firestore...');
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

    // 6. Seed initial notices if empty
    const noticesCol = collection(db, 'notices');
    const noticesSnap = await getDocs(noticesCol);
    if (noticesSnap.empty) {
      console.log('Seeding default notices board items...');
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

    // 7. Seed initial hero slides if empty
    const slidesCol = collection(db, 'hero_slides');
    const slidesSnap = await getDocs(slidesCol);
    if (slidesSnap.empty) {
      console.log('Seeding default premium hero slides...');
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

    // 8. Seed default branding configuration if empty
    const brandingDocRef = doc(db, 'branding', 'config');
    const brandingSnap = await getDoc(brandingDocRef);
    if (!brandingSnap.exists()) {
      console.log('Seeding default branding config to Firestore...');
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
    console.error('Error seeding Firebase database:', error);
  }
}

// ==========================================
// BOOKS FIRESTORE API HELPERS
// ==========================================

export async function getAllBooks(): Promise<Book[]> {
  const booksCol = collection(db, 'books');
  try {
    const snap = await getDocs(booksCol);
    const list: Book[] = [];
    snap.forEach(docSnap => {
      list.push(docSnap.data() as Book);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'books');
  }
}

export async function getBookById(id: string): Promise<Book | null> {
  const bookRef = doc(db, 'books', id);
  try {
    const snap = await getDoc(bookRef);
    if (snap.exists()) {
      return snap.data() as Book;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `books/${id}`);
  }
}

export async function saveBook(book: Book): Promise<void> {
  const bookRef = doc(db, 'books', book.id);
  try {
    await setDoc(bookRef, sanitizeForFirestore(book));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `books/${book.id}`);
  }
}

export async function deleteBook(id: string): Promise<void> {
  const bookRef = doc(db, 'books', id);
  try {
    await deleteDoc(bookRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `books/${id}`);
  }
}

// ==========================================
// STUDENTS FIRESTORE API HELPERS
// ==========================================

export async function getStudentByRoll(roll: string): Promise<(Student & { password?: string }) | null> {
  const rollNormalized = roll.trim().toUpperCase();
  const docRef = doc(db, 'students', rollNormalized);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as (Student & { password?: string });
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `students/${rollNormalized}`);
  }
}

export async function getAllStudents(): Promise<(Student & { password?: string })[]> {
  const colRef = collection(db, 'students');
  try {
    const snap = await getDocs(colRef);
    const list: (Student & { password?: string })[] = [];
    snap.forEach(docSnap => {
      list.push(docSnap.data() as (Student & { password?: string }));
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'students');
  }
}

export async function saveStudent(student: Student & { password?: string }): Promise<void> {
  const rollNormalized = student.rollNumber.trim().toUpperCase();
  const docRef = doc(db, 'students', rollNormalized);
  try {
    await setDoc(docRef, sanitizeForFirestore(student));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `students/${rollNormalized}`);
  }
}

export async function deleteStudent(roll: string): Promise<void> {
  const rollNormalized = roll.trim().toUpperCase();
  const docRef = doc(db, 'students', rollNormalized);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `students/${rollNormalized}`);
  }
}

// ==========================================
// BORROW RECORDS FIRESTORE API HELPERS
// ==========================================

export async function getAllBorrows(): Promise<BorrowRecord[]> {
  const colRef = collection(db, 'borrows');
  try {
    const snap = await getDocs(colRef);
    const list: BorrowRecord[] = [];
    snap.forEach(docSnap => {
      list.push(docSnap.data() as BorrowRecord);
    });
    // Sort in descending order of borrowDate
    return list.sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'borrows');
  }
}

export async function getBorrowById(id: string): Promise<BorrowRecord | null> {
  const docRef = doc(db, 'borrows', id);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as BorrowRecord;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `borrows/${id}`);
  }
}

export async function saveBorrow(record: BorrowRecord): Promise<void> {
  const docRef = doc(db, 'borrows', record.id);
  try {
    await setDoc(docRef, sanitizeForFirestore(record));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `borrows/${record.id}`);
  }
}

// ==========================================
// FINES FIRESTORE API HELPERS
// ==========================================

export async function getAllFines(): Promise<Fine[]> {
  const colRef = collection(db, 'fines');
  try {
    const snap = await getDocs(colRef);
    const list: Fine[] = [];
    snap.forEach(docSnap => {
      list.push(docSnap.data() as Fine);
    });
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'fines');
  }
}

export async function getFineById(id: string): Promise<Fine | null> {
  const docRef = doc(db, 'fines', id);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Fine;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `fines/${id}`);
  }
}

export async function saveFine(fine: Fine): Promise<void> {
  const docRef = doc(db, 'fines', fine.id);
  try {
    await setDoc(docRef, sanitizeForFirestore(fine));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `fines/${fine.id}`);
  }
}

// ==========================================
// NOTIFICATIONS FIRESTORE API HELPERS
// ==========================================

export async function getNotificationsForRoll(roll: string): Promise<Notification[]> {
  const colRef = collection(db, 'notifications');
  try {
    const snap = await getDocs(colRef);
    const list: Notification[] = [];
    const rollNormalized = roll.trim().toUpperCase();
    
    snap.forEach(docSnap => {
      const data = docSnap.data() as Notification;
      const sRoll = data.studentRoll || '';
      if (sRoll === '' || sRoll.toUpperCase() === rollNormalized) {
        list.push(data);
      }
    });
    
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'notifications');
  }
}

export async function getNotificationById(id: string): Promise<Notification | null> {
  const docRef = doc(db, 'notifications', id);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Notification;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `notifications/${id}`);
  }
}

export async function saveNotification(notif: Notification): Promise<void> {
  const docRef = doc(db, 'notifications', notif.id);
  try {
    await setDoc(docRef, sanitizeForFirestore(notif));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `notifications/${notif.id}`);
  }
}

export async function deleteNotification(id: string): Promise<void> {
  const docRef = doc(db, 'notifications', id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `notifications/${id}`);
  }
}

// ==========================================
// LIBRARIANS FIRESTORE API HELPERS
// ==========================================

export async function getAllLibrarians(): Promise<Librarian[]> {
  const colRef = collection(db, 'librarians');
  try {
    const snap = await getDocs(colRef);
    const list: Librarian[] = [];
    snap.forEach(docSnap => {
      list.push(docSnap.data() as Librarian);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'librarians');
  }
}

export async function saveLibrarian(lib: Librarian): Promise<void> {
  const docRef = doc(db, 'librarians', lib.id);
  try {
    await setDoc(docRef, sanitizeForFirestore(lib));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `librarians/${lib.id}`);
  }
}

export async function deleteLibrarian(id: string): Promise<void> {
  const docRef = doc(db, 'librarians', id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `librarians/${id}`);
  }
}

// ==========================================
// GALLERY FIRESTORE API HELPERS
// ==========================================

export async function getAllGalleryItems(): Promise<GalleryItem[]> {
  const colRef = collection(db, 'gallery');
  try {
    const snap = await getDocs(colRef);
    const list: GalleryItem[] = [];
    snap.forEach(docSnap => {
      list.push(docSnap.data() as GalleryItem);
    });
    // Sort in descending order of creation time
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'gallery');
  }
}

export async function saveGalleryItem(item: GalleryItem): Promise<void> {
  const docRef = doc(db, 'gallery', item.id);
  try {
    await setDoc(docRef, sanitizeForFirestore(item));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `gallery/${item.id}`);
  }
}

export async function deleteGalleryItem(id: string): Promise<void> {
  const docRef = doc(db, 'gallery', id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `gallery/${id}`);
  }
}

// ==========================================
// LIBRARY STATUS FIRESTORE API HELPERS
// ==========================================

export async function getLibraryStatus(): Promise<LibraryStatus> {
  const docRef = doc(db, 'library_status', 'current');
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as LibraryStatus;
    }
    // Return and save default if it doesn't exist
    const defaultStatus: LibraryStatus = {
      id: 'current',
      status: 'OPEN',
      openingTime: '08:00 AM',
      closingTime: '08:00 PM',
      weeklySchedule: 'Saturday - Thursday',
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, sanitizeForFirestore(defaultStatus));
    return defaultStatus;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'library_status/current');
  }
}

export async function saveLibraryStatus(status: LibraryStatus): Promise<void> {
  const docRef = doc(db, 'library_status', 'current');
  try {
    await setDoc(docRef, sanitizeForFirestore(status));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'library_status/current');
  }
}

// ==========================================
// NOTICE BOARD FIRESTORE API HELPERS
// ==========================================
export async function getAllNotices(): Promise<any[]> {
  const colRef = collection(db, 'notices');
  try {
    const snap = await getDocs(colRef);
    const list: any[] = [];
    snap.forEach(docSnap => {
      list.push(docSnap.data());
    });
    // Sort logic: Pinned first, then by publishDate/createdAt descending
    return list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.publishDate || b.createdAt).getTime() - new Date(a.publishDate || a.createdAt).getTime();
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'notices');
  }
}

export async function getNoticeById(id: string): Promise<any | null> {
  const docRef = doc(db, 'notices', id);
  try {
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `notices/${id}`);
  }
}

export async function saveNotice(notice: any): Promise<void> {
  const docRef = doc(db, 'notices', notice.id);
  try {
    await setDoc(docRef, sanitizeForFirestore(notice));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `notices/${notice.id}`);
  }
}

export async function deleteNotice(id: string): Promise<void> {
  const docRef = doc(db, 'notices', id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `notices/${id}`);
  }
}

// ==========================================
// HERO CAROUSEL FIRESTORE API HELPERS
// ==========================================
export async function getAllHeroSlides(): Promise<any[]> {
  const colRef = collection(db, 'hero_slides');
  try {
    const snap = await getDocs(colRef);
    const list: any[] = [];
    snap.forEach(docSnap => {
      list.push(docSnap.data());
    });
    return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'hero_slides');
  }
}

export async function saveHeroSlide(slide: any): Promise<void> {
  const docRef = doc(db, 'hero_slides', slide.id);
  try {
    await setDoc(docRef, sanitizeForFirestore(slide));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `hero_slides/${slide.id}`);
  }
}

export async function deleteHeroSlide(id: string): Promise<void> {
  const docRef = doc(db, 'hero_slides', id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `hero_slides/${id}`);
  }
}

// ==========================================
// INSTITUTIONAL BRANDING FIRESTORE API HELPERS
// ==========================================
export async function getBrandingConfig(): Promise<BrandingConfig> {
  const docRef = doc(db, 'branding', 'config');
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as BrandingConfig;
    }
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
    await setDoc(docRef, sanitizeForFirestore(defaultBranding));
    return defaultBranding;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'branding/config');
  }
}

export async function saveBrandingConfig(config: BrandingConfig): Promise<void> {
  const docRef = doc(db, 'branding', 'config');
  try {
    await setDoc(docRef, sanitizeForFirestore(config));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'branding/config');
  }
}

// ==========================================
// SUPPORT MESSAGES FIRESTORE HELPERS
// ==========================================
export async function getAllSupportMessages(): Promise<SupportMessage[]> {
  const colRef = collection(db, 'support_messages');
  try {
    const snap = await getDocs(colRef);
    const list: SupportMessage[] = [];
    snap.forEach(docSnap => {
      list.push(docSnap.data() as SupportMessage);
    });
    // Sort logic: newest message first
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'support_messages');
  }
}

export async function saveSupportMessage(msg: SupportMessage): Promise<void> {
  const docRef = doc(db, 'support_messages', msg.id);
  try {
    await setDoc(docRef, sanitizeForFirestore(msg));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `support_messages/${msg.id}`);
  }
}

export async function deleteSupportMessage(id: string): Promise<void> {
  const docRef = doc(db, 'support_messages', id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `support_messages/${id}`);
  }
}


