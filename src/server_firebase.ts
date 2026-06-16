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
import { Book, Student, BorrowRecord, Fine, Notification, Librarian, GalleryItem, LibraryStatus } from './types.js';
import { readFileSync } from 'fs';
import path from 'path';

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

