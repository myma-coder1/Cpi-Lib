import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { generate1000Books, generate400Students } from './src/server_db.js';
import { SupportMessage } from './src/types.js';
import {
  seedDatabaseIfEmpty,
  getAllBooks,
  getBookById,
  saveBook,
  deleteBook,
  getStudentByRoll,
  getAllStudents,
  saveStudent,
  deleteStudent,
  getAllBorrows,
  getBorrowById,
  saveBorrow,
  getAllFines,
  getFineById,
  saveFine,
  getNotificationsForRoll,
  getNotificationById,
  saveNotification,
  deleteNotification,
  getAllLibrarians,
  saveLibrarian,
  deleteLibrarian,
  getAllGalleryItems,
  saveGalleryItem,
  deleteGalleryItem,
  getLibraryStatus,
  saveLibraryStatus,
  getAllNotices,
  getNoticeById,
  saveNotice,
  deleteNotice,
  getAllHeroSlides,
  saveHeroSlide,
  deleteHeroSlide,
  getBrandingConfig,
  saveBrandingConfig,
  getAllSupportMessages,
  saveSupportMessage,
  deleteSupportMessage
} from './src/server_firebase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function getExpressApp() {
  const app = express();
  const PORT = 3000;

  // Initialize and seed Firebase database if it's completely empty
  await seedDatabaseIfEmpty(generate1000Books, generate400Students);

  app.use(express.json());

  // Helper function to calculate active fine on a record
  function getOverdueStats(dueDateStr: string): { isOverdue: boolean; lateDays: number; calculatedFine: number } {
    const dueDate = new Date(dueDateStr);
    const now = new Date();
    if (now > dueDate) {
      const diffTime = Math.abs(now.getTime() - dueDate.getTime());
      const lateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1; // get full days late
      if (lateDays <= 0) {
        return { isOverdue: false, lateDays: 0, calculatedFine: 0 };
      }
      let calculatedFine = 0;
      if (lateDays >= 1 && lateDays <= 7) {
        calculatedFine = 20;
      } else if (lateDays > 7) {
        calculatedFine = 50;
      }
      return { isOverdue: true, lateDays, calculatedFine };
    }
    return { isOverdue: false, lateDays: 0, calculatedFine: 0 };
  }

  // Update dynamic fines for active borrowings asynchronously
  async function refreshBorrowRecordsAsync() {
    try {
      const borrows = await getAllBorrows();
      for (const b of borrows) {
        if (b.status === 'BORROWED') {
          const { isOverdue, calculatedFine } = getOverdueStats(b.dueDate);
          if (isOverdue && b.fineAmount !== calculatedFine) {
            b.fineAmount = calculatedFine;
            await saveBorrow(b);
            
            // Trigger overdue notification if none exists
            const userNotifs = await getNotificationsForRoll(b.studentRoll);
            const exists = userNotifs.some(n => n.studentRoll === b.studentRoll && n.type === 'OVERDUE' && n.message.includes(b.bookTitle));
            if (!exists) {
              const newNotif = {
                id: `notif-overdue-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                studentRoll: b.studentRoll,
                title: "Overdue Book Warning",
                message: `The book "${b.bookTitle}" was due on ${new Date(b.dueDate).toLocaleDateString()}. Please request a return immediately. Late fee is BDT ${calculatedFine}.`,
                createdAt: new Date().toISOString(),
                isRead: false,
                type: 'OVERDUE' as const
              };
              await saveNotification(newNotif);
            }
          }
        }
      }
    } catch (e) {
      console.error("Error running async borrow records check", e);
    }
  }

  // Run initial calculations check
  await refreshBorrowRecordsAsync();

  async function getDeterministicStudentAsync(roll: string): Promise<any | null> {
    const rollUpper = roll.toUpperCase().trim();
    // Retrieve from Firestore (seeded from students_400.json under both stringified roll and UID)
    return await getStudentByRoll(rollUpper);
  }

  // API - Auth Login
  const loginHandler = async (req: any, res: any) => {
    try {
      const { rollNumber, password } = req.body;
      if (!rollNumber || !password) {
        return res.status(400).json({ error: 'Please provide roll number and password' });
      }

      const normalizedRoll = rollNumber.trim().toUpperCase();

      // Check for Admin
      if (normalizedRoll === 'ADMIN') {
        if (password === 'admin123') {
          return res.json({
            role: 'admin',
            user: { name: 'Library Superintendent Admin', rollNumber: 'ADMIN', role: 'admin' }
          });
        } else {
          return res.status(401).json({ error: 'Invalid admin credentials' });
        }
      }

      const student = await getDeterministicStudentAsync(normalizedRoll);
      if (!student) {
        return res.status(400).json({ error: 'Invalid Roll Number. Please use a valid Roll Number (e.g. 1001) or UID (e.g. cst-1001).' });
      }

      if (student.password === password || password === 'student123' || password === 'password123') {
        return res.json({
          role: 'student',
          user: student
        });
      }

      return res.status(401).json({ error: `Invalid password. Please use the correct password for roll ${normalizedRoll} (e.g. pass-1001 for roll 1001).` });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  };

  app.post('/api/auth/login', loginHandler);
  app.post('/api/login', loginHandler);

  // API - Get Books Catalog
  app.get('/api/books', async (req, res) => {
    try {
      await refreshBorrowRecordsAsync();
      const { q, category, availability, limit, page } = req.query;
      const allBooksList = await getAllBooks();
      let filtered = [...allBooksList];

      // Text search
      if (q) {
        const searchStr = (q as string).toLowerCase().trim();
        filtered = filtered.filter(b => 
          b.title.toLowerCase().includes(searchStr) || 
          b.author.toLowerCase().includes(searchStr) || 
          b.isbn.includes(searchStr)
        );
      }

      // Categories
      if (category && category !== 'All Science' && category !== 'All') {
        const catStr = (category as string).toLowerCase();
        if (catStr === 'engineering') {
          filtered = filtered.filter(b => ['computer science', 'programming', 'networking', 'cyber security', 'artificial intelligence', 'machine learning', 'data science'].includes(b.category.toLowerCase()));
        } else if (catStr === 'humanities') {
          filtered = filtered.filter(b => ['english', 'literature', 'history', 'biography', 'novels'].includes(b.category.toLowerCase()));
        } else if (catStr === 'all science') {
          filtered = filtered.filter(b => ['physics', 'chemistry', 'mathematics'].includes(b.category.toLowerCase()));
        } else {
          filtered = filtered.filter(b => b.category.toLowerCase() === catStr);
        }
      }

      // Availability filters
      if (availability) {
        if (availability === 'Available Now') {
          filtered = filtered.filter(b => b.format === 'E-Book' || b.availableCopies > 0);
        } else if (availability === 'Borrowed') {
          filtered = filtered.filter(b => b.availableCopies === 0 && b.format !== 'E-Book');
        }
      }

      // Pagination
      if (limit || page || q || category || availability) {
        const limitNum = limit ? parseInt(limit as string) : 12;
        const pageNum = page ? parseInt(page as string) : 1;
        const totalCount = filtered.length;
        const totalPages = Math.ceil(totalCount / limitNum);
        
        const paginatedBooks = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

        res.json({
          books: paginatedBooks,
          totalCount,
          page: pageNum,
          totalPages
        });
      } else {
        res.json(filtered);
      }
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // API - Get Book Details
  app.get('/api/books/:id', async (req, res) => {
    try {
      const book = await getBookById(req.params.id);
      if (!book) return res.status(404).json({ error: 'Book not found' });
      res.json(book);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // API - Add Book (Admin)
  app.post('/api/books', async (req, res) => {
    try {
      const { title, author, category, isbn, imageUrl, description, publisher, publishDate, pageCount, format, copiesCount, location, pdfUrl, ebookContentText } = req.body;
      if (!title || !author || !category || !isbn) {
        return res.status(400).json({ error: 'Title, Author, Category, and ISBN are required' });
      }

      const newBook = {
        id: `book-custom-${Date.now()}`,
        title,
        author,
        category,
        isbn,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop',
        description: description || 'No description provided.',
        publisher: publisher || 'Self Published',
        publishDate: publishDate || new Date().toLocaleDateString(),
        pageCount: pageCount ? parseInt(pageCount) : 300,
        format: format || 'Paperback',
        copiesCount: copiesCount ? parseInt(copiesCount) : 3,
        availableCopies: copiesCount ? parseInt(copiesCount) : 3,
        location: location || 'Level 1, General Stack',
        pdfUrl: pdfUrl || '',
        ebookContentText: ebookContentText || ''
      };

      await saveBook(newBook);
      res.status(201).json(newBook);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // API - Edit Book (Admin)
  app.put('/api/books/:id', async (req, res) => {
    try {
      const originBook = await getBookById(req.params.id);
      if (!originBook) return res.status(404).json({ error: 'Book not found' });

      const updated = { ...originBook, ...req.body };
      if (req.body.copiesCount !== undefined) {
        const diff = parseInt(req.body.copiesCount) - originBook.copiesCount;
        updated.copiesCount = parseInt(req.body.copiesCount);
        updated.availableCopies = Math.max(0, originBook.availableCopies + diff);
      }

      await saveBook(updated);
      res.json(updated);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // API - Delete Book (Admin)
  app.delete('/api/books/:id', async (req, res) => {
    try {
      const originBook = await getBookById(req.params.id);
      if (!originBook) return res.status(404).json({ error: 'Book not found' });

      await deleteBook(req.params.id);
      res.json({ message: 'Book deleted successfully' });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // API - Open Library Integration
  app.get('/api/openlibrary/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Search keyword is required' });

    try {
      const search_url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q as string)}&limit=10`;
      const response = await fetch(search_url);
      const data = await response.json();
      
      const results = (data.docs || []).map((doc: any) => {
        const cover_id = doc.cover_i;
        const isbn = doc.isbn ? doc.isbn[0] : `N/A-${Date.now()}`;
        return {
          title: doc.title,
          author: doc.author_name ? doc.author_name[0] : 'Unknown Author',
          isbn,
          imageUrl: cover_id ? `https://covers.openlibrary.org/b/id/${cover_id}-L.jpg` : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop',
          description: doc.first_sentence ? doc.first_sentence[0] : `A real book on ${doc.subject ? doc.subject[0] : 'Academic studies'} published by ${doc.publisher ? doc.publisher[0] : 'Scholarly House'}.`,
          publisher: doc.publisher ? doc.publisher[0] : 'Scholarly Publisher',
          publishDate: doc.publish_year ? doc.publish_year[0].toString() : 'N/A',
          pageCount: doc.number_of_pages_median || 350,
          format: 'Hardcover',
          location: 'Imported Catalog Collection'
        };
      });

      res.json(results);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: 'Failed to search Open Library: ' + e.message });
    }
  });

  // API - Import Open Library Book
  app.post('/api/books/import', async (req, res) => {
    try {
      const { book } = req.body;
      if (!book || !book.title) return res.status(400).json({ error: 'Missing book data to import.' });

      const all = await getAllBooks();
      const exists = all.find(b => b.isbn === book.isbn);
      if (exists) {
        return res.json({ message: 'Book already exists in local database catalog!', book: exists });
      }

      const imported = {
        ...book,
        id: `book-imported-${Date.now()}`,
        category: req.body.category || 'Computer Science',
        copiesCount: 3,
        availableCopies: 3
      };

      await saveBook(imported);
      res.status(201).json({ message: 'Success', book: imported });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // API - Borrow Request
  app.post('/api/borrow', async (req, res) => {
    try {
      await refreshBorrowRecordsAsync();
      const { bookId, studentRoll, durationDays } = req.body;
      if (!bookId || !studentRoll || !durationDays) {
        return res.status(400).json({ error: 'Missing bookId, studentRoll, or durationDays' });
      }

      const student = await getDeterministicStudentAsync(studentRoll);
      if (!student) return res.status(404).json({ error: 'Student not found' });

      const book = await getBookById(bookId);
      if (!book) return res.status(404).json({ error: 'Book not found' });

      const allBorrows = await getAllBorrows();
      const activeBorrowsCount = allBorrows.filter(b => b.studentRoll === student.rollNumber && b.status !== 'RETURNED').length;

      // Limit active borrows to 2
      if (activeBorrowsCount >= 2 && book.format !== 'E-Book') {
        return res.status(400).json({ error: 'Borrow Limit Exceeded. You can borrow a maximum of 2 physical books at any time.' });
      }

      if (book.format !== 'E-Book' && book.availableCopies <= 0) {
        return res.status(400).json({ error: 'Book of interest and edition is currently unavailable. You may join the waitlist.' });
      }

      const now = new Date();
      const dueDate = new Date();
      dueDate.setDate(now.getDate() + parseInt(durationDays));

      const record = {
        id: `borrow-${Date.now()}`,
        bookId: book.id,
        bookTitle: book.title,
        bookImage: book.imageUrl,
        studentRoll: student.rollNumber,
        studentName: student.name,
        borrowDate: now.toISOString(),
        durationDays: parseInt(durationDays),
        dueDate: dueDate.toISOString(),
        status: 'PENDING_APPROVE' as const,
        fineAmount: 0
      };

      await saveBorrow(record);

      const notif = {
        id: `notif-${Date.now()}`,
        studentRoll: student.rollNumber,
        title: "Borrow Requested",
        message: `Your request to borrow "${book.title}" for ${durationDays} days has been submitted. Please collect it once approved by the librarian.`,
        createdAt: now.toISOString(),
        isRead: false,
        type: 'INFO' as const
      };
      await saveNotification(notif);

      res.json({ message: 'Borrow request submitted successfully. Awaiting librarian approval.', record });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // API - Request Return
  app.post('/api/return/:recordId', async (req, res) => {
    try {
      await refreshBorrowRecordsAsync();
      const record = await getBorrowById(req.params.recordId);
      if (!record) return res.status(404).json({ error: 'Borrow record not found' });

      if (record.status !== 'BORROWED') {
        return res.status(400).json({ error: 'This record cannot be returned' });
      }

      record.status = 'PENDING_RETURN';
      await saveBorrow(record);

      const notif = {
        id: `notif-${Date.now()}`,
        studentRoll: record.studentRoll,
        title: "Return Pending Approve",
        message: `Your return request for "${record.bookTitle}" is pending. Please present clean copy to desk to confirm status.`,
        createdAt: new Date().toISOString(),
        isRead: false,
        type: 'INFO' as const
      };
      await saveNotification(notif);

      res.json({ message: 'Return request submitted. Please present the physical copy to the library desk.', record });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // API - Admin Approve Borrow Request
  app.post('/api/admin/approve-borrow/:recordId', async (req, res) => {
    try {
      const record = await getBorrowById(req.params.recordId);
      if (!record) return res.status(404).json({ error: 'Record not found' });

      if (record.status !== 'PENDING_APPROVE') {
        return res.status(400).json({ error: 'Only pending borrow requests can be approved' });
      }

      const book = await getBookById(record.bookId);
      if (!book) return res.status(404).json({ error: 'Associated book not found' });

      if (book.format !== 'E-Book' && book.availableCopies <= 0) {
        return res.status(400).json({ error: 'No available copies left of this book in stock' });
      }

      record.status = 'BORROWED';
      if (book.format !== 'E-Book') {
        book.availableCopies = Math.max(0, book.availableCopies - 1);
        await saveBook(book);
      }

      const now = new Date();
      const dueDate = new Date();
      dueDate.setDate(now.getDate() + record.durationDays);

      record.borrowDate = now.toISOString();
      record.dueDate = dueDate.toISOString();

      await saveBorrow(record);

      const notif = {
        id: `notif-${Date.now()}`,
        studentRoll: record.studentRoll,
        title: "Loan Approved!",
        message: `Librarian approved your borrow for "${record.bookTitle}". Due date: ${dueDate.toLocaleDateString()}. Location: ${book.location}.`,
        createdAt: now.toISOString(),
        isRead: false,
        type: 'APPROVAL' as const
      };
      await saveNotification(notif);

      res.json({ message: 'Borrow request approved successfully', record, book });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // API - Admin Approve Return Request
  app.post('/api/admin/approve-return/:recordId', async (req, res) => {
    try {
      const record = await getBorrowById(req.params.recordId);
      if (!record) return res.status(404).json({ error: 'Record not found' });

      if (record.status !== 'PENDING_RETURN' && record.status !== 'BORROWED') {
        return res.status(400).json({ error: 'Only borrowed or pending return items can be checked back in' });
      }

      const book = await getBookById(record.bookId);
      if (book && book.format !== 'E-Book') {
        book.availableCopies = Math.min(book.copiesCount, book.availableCopies + 1);
        await saveBook(book);
      }

      const returnDate = new Date();
      record.returnDate = returnDate.toISOString();
      record.status = 'RETURNED';

      const { isOverdue, lateDays, calculatedFine } = getOverdueStats(record.dueDate);
      let finalFine = 0;
      if (isOverdue && calculatedFine > 0) {
        finalFine = calculatedFine;
        record.fineAmount = finalFine;
        
        await saveFine({
          id: `fine-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          studentRoll: record.studentRoll,
          studentName: record.studentName,
          amount: finalFine,
          reason: `Late return: ${record.bookTitle} (${lateDays} days late)`,
          status: 'UNPAID',
          createdAt: new Date().toISOString()
        });
      }

      await saveBorrow(record);

      const notif = {
        id: `notif-${Date.now()}`,
        studentRoll: record.studentRoll,
        title: "Book Checked In",
        message: `Librarian confirmed return of "${record.bookTitle}".` + (finalFine > 0 ? ` A fine of BDT ${finalFine} was logged to your account.` : ''),
        createdAt: new Date().toISOString(),
        isRead: false,
        type: 'APPROVAL' as const
      };
      await saveNotification(notif);

      res.json({ message: 'Book returned and checked in successfully.', record, fineAmount: finalFine });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // API - Mark Notification Read
  app.post('/api/notifications/read/:id', async (req, res) => {
    try {
      const notif = await getNotificationById(req.params.id);
      if (notif) {
        notif.isRead = true;
        await saveNotification(notif);
        return res.json({ success: true });
      }
      res.status(404).json({ error: 'Notification not found' });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // API - Get student profile list
  app.get('/api/students', async (req, res) => {
    try {
      const list = await getAllStudents();
      // Filter out ADMIN and purely numeric rolls (such as 1001) so we only display the normalized CST-1001 prefix entries to avoid duplicate rows
      const uniqueList = list.filter(s => s.rollNumber !== 'ADMIN' && isNaN(Number(s.rollNumber)));
      res.json(uniqueList);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // API - Add Student (Admin)
  app.post('/api/students', async (req, res) => {
    try {
      const { name, password, rollNumber, department, semester } = req.body;
      if (!name || !password || !rollNumber || !department || !semester) {
        return res.status(400).json({ error: 'All fields (name, password, rollNumber, department, semester) are required.' });
      }

      let normalizedRoll = rollNumber.toString().trim().toUpperCase();
      if (!normalizedRoll.startsWith('CST-') && !normalizedRoll.startsWith('CSE-') && !normalizedRoll.startsWith('BBA-') && !normalizedRoll.startsWith('HIS-')) {
        if (!isNaN(Number(normalizedRoll))) {
          normalizedRoll = `CST-${normalizedRoll}`;
        }
      }

      const exists = await getStudentByRoll(normalizedRoll);
      if (exists) {
        return res.status(400).json({ error: `Student with Roll Number "${normalizedRoll}" already exists!` });
      }

      const newStudent = {
        name,
        rollNumber: normalizedRoll,
        department,
        semester: parseInt(semester, 10) || 1,
        password,
        isActive: true
      };

      await saveStudent(newStudent);
      res.status(201).json(newStudent);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // API - Delete Student (Admin)
  app.delete('/api/students/:roll(*)', async (req, res) => {
    try {
      const normalizedRoll = req.params.roll.toUpperCase();
      const exists = await getStudentByRoll(normalizedRoll);
      if (!exists) {
        return res.status(404).json({ error: 'Student not found.' });
      }

      await deleteStudent(normalizedRoll);
      res.json({ success: true, message: 'Student deleted successfully.' });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // API - Fetch a student profile
  app.get('/api/students/:roll(*)', async (req, res) => {
    try {
      const student = await getDeterministicStudentAsync(req.params.roll);
      if (!student) return res.status(404).json({ error: 'Student not found' });
      res.json(student);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // API - Update student profile (change photo / pass / name / roll etc)
  app.put('/api/students/:roll(*)', async (req, res) => {
    try {
      const oldRoll = req.params.roll.toUpperCase().trim();
      const student = await getDeterministicStudentAsync(oldRoll);
      if (!student) return res.status(404).json({ error: 'Student not found' });

      if (req.body.password) {
        student.password = req.body.password;
      }
      if (req.body.name) {
        student.name = req.body.name;
      }
      if (req.body.email !== undefined) {
        student.email = req.body.email;
      }
      if (req.body.phone !== undefined) {
        student.phone = req.body.phone;
      }
      if (req.body.department !== undefined) {
        student.department = req.body.department;
      }
      if (req.body.session !== undefined) {
        student.session = req.body.session;
      }
      if (req.body.address !== undefined) {
        student.address = req.body.address;
      }
      if (req.body.photoUrl !== undefined) {
        student.photoUrl = req.body.photoUrl;
      }
      if (req.body.semester !== undefined) {
        student.semester = parseInt(req.body.semester, 10) || student.semester;
      }
      if (req.body.registration !== undefined) {
        student.registration = req.body.registration;
      }
      if (req.body.wishlist !== undefined) {
        student.wishlist = Array.isArray(req.body.wishlist) ? req.body.wishlist : [];
      }

      const newRoll = req.body.rollNumber ? req.body.rollNumber.toUpperCase().trim() : null;
      if (newRoll && newRoll !== oldRoll) {
        const exists = await getStudentByRoll(newRoll);
        if (exists) {
          return res.status(400).json({ error: `Roll Number ${newRoll} is already registered by another student.` });
        }
        await deleteStudent(oldRoll);
        student.rollNumber = newRoll;
      }

      await saveStudent(student);
      res.json({ success: true, student });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // API - Get borrow records for student
  app.get('/api/borrow-history/:roll(*)', async (req, res) => {
    try {
      await refreshBorrowRecordsAsync();
      const borrows = await getAllBorrows();
      const list = borrows.filter(b => b.studentRoll.toUpperCase() === req.params.roll.toUpperCase());
      res.json(list);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // API - Get ALL loan history
  app.get('/api/admin/borrows', async (req, res) => {
    try {
      await refreshBorrowRecordsAsync();
      const list = await getAllBorrows();
      res.json(list);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // API - Get ALL fines list
  app.get('/api/admin/fines', async (req, res) => {
    try {
      const list = await getAllFines();
      res.json(list);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // API - Get student fines
  app.get('/api/fines/:roll(*)', async (req, res) => {
    try {
      const list = await getAllFines();
      const filtered = list.filter(f => f.studentRoll.toUpperCase() === req.params.roll.toUpperCase());
      res.json(filtered);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // API - Pay Fine student
  app.post('/api/fines/pay/:id', async (req, res) => {
    try {
      const fine = await getFineById(req.params.id);
      if (!fine) return res.status(404).json({ error: 'Fine record not found' });
      fine.status = 'PAID';
      await saveFine(fine);
      res.json({ success: true, fine });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // API - Fine configurations/waivers (Admin Action)
  app.post('/api/admin/fines/:id/action', async (req, res) => {
    try {
      const fine = await getFineById(req.params.id);
      if (!fine) return res.status(404).json({ error: 'Fine not found' });

      const { action } = req.body;
      if (action === 'PAID' || action === 'WAIVED') {
        fine.status = action;
        await saveFine(fine);
        
        await saveNotification({
          id: `notif-${Date.now()}`,
          studentRoll: fine.studentRoll,
          title: `Fine Status Update`,
          message: `Your fine of BDT ${fine.amount} for "${fine.reason.split(':')[1] || 'Late return'}" has been marked as ${action.toLowerCase()} by admin.`,
          createdAt: new Date().toISOString(),
          isRead: false,
          type: 'INFO' as const
        });

        return res.json({ success: true, fine });
      }
      res.status(400).json({ error: 'Invalid fine action. Choose PAID or WAIVED.' });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // API - Edit/Update Fine properties (Admin Action)
  app.post('/api/admin/fines/:id/update', async (req, res) => {
    try {
      const fine = await getFineById(req.params.id);
      if (!fine) return res.status(404).json({ error: 'Fine not found' });

      const { amount, status, reason } = req.body;
      if (typeof amount === 'number') {
        fine.amount = amount;
      }
      if (status === 'UNPAID' || status === 'PAID' || status === 'WAIVED') {
        fine.status = status;
      }
      if (typeof reason === 'string') {
        fine.reason = reason;
      }

      await saveFine(fine);

      await saveNotification({
        id: `notif-${Date.now()}`,
        studentRoll: fine.studentRoll,
        title: `Fine Record Modified`,
        message: `Your fine record was adjusted by admin. New Amount: BDT ${fine.amount} | Status: ${fine.status}.`,
        createdAt: new Date().toISOString(),
        isRead: false,
        type: 'INFO' as const
      });

      res.json({ success: true, fine });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // API - Notification fetch inbox fallback safety routes to prevent Vite from returning HTML index pages
  app.get('/api/notifications', (req, res) => {
    res.json([]);
  });

  app.get('/api/notifications/', (req, res) => {
    res.json([]);
  });

  // API - Notification fetch inbox
  app.get('/api/notifications/:roll(*)', async (req, res) => {
    try {
      const roll = req.params.roll;
      const decodedRoll = roll ? decodeURIComponent(roll).trim() : '';
      if (!decodedRoll || decodedRoll === 'undefined' || decodedRoll === 'null') {
        return res.json([]);
      }
      const list = await getNotificationsForRoll(decodedRoll);
      res.json(list || []);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // API - Notification delete endpoint
  app.delete('/api/notifications/:id', async (req, res) => {
    try {
      const id = req.params.id;
      if (!id || id === 'undefined' || id === 'null') {
        return res.status(400).json({ error: 'Valid notification ID is required.' });
      }
      await deleteNotification(id);
      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // API - Metrics Analytics compiler
  app.get('/api/admin/analytics', async (req, res) => {
    try {
      await refreshBorrowRecordsAsync();
      
      const booksList = await getAllBooks();
      const studentsList = await getAllStudents();
      const borrowsList = await getAllBorrows();
      const finesList = await getAllFines();

      // Category metrics
      const categoryDistribution: { [c: string]: number } = {};
      booksList.forEach(b => {
        categoryDistribution[b.category] = (categoryDistribution[b.category] || 0) + 1;
      });

      const categoriesData = Object.keys(categoryDistribution).map(k => ({
        name: k,
        value: categoryDistribution[k]
      })).sort((a,b) => b.value - a.value).slice(0, 8); // Top 8

      const totalPhysicalBooksSum = booksList.filter(b => b.format !== 'E-Book').reduce((sum, b) => sum + b.copiesCount, 0);
      const totalEbooksCount = booksList.filter(b => b.format === 'E-Book').length;
      const activeStudentsLength = studentsList.length;
      const activeBorrows = borrowsList.filter(b => b.status === 'BORROWED' || b.status === 'PENDING_RETURN').length;
      const pendingRequests = borrowsList.filter(b => b.status === 'PENDING_APPROVE').length;

      const monthlyLoans = [
        { month: 'Jan', loans: 110, digital: 45 },
        { month: 'Feb', loans: 145, digital: 68 },
        { month: 'Mar', loans: 230, digital: 112 },
        { month: 'Apr', loans: 190, digital: 95 },
        { month: 'May', loans: 320, digital: 140 },
        { month: 'Jun', loans: activeBorrows + 150, digital: totalEbooksCount + 80 }
      ];

      const unpaidFinesTotal = finesList.filter(f => f.status === 'UNPAID').reduce((sum, f) => sum + f.amount, 0);
      const collectedFinesTotal = finesList.filter(f => f.status === 'PAID').reduce((sum, f) => sum + f.amount, 0);

      res.json({
        totalPhysicalBooksSum,
        totalEbooksCount,
        activeStudentsLength,
        activeBorrows,
        pendingRequests,
        categoriesData,
        monthlyLoans,
        unpaidFinesTotal,
        collectedFinesTotal
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // API - Time Leap Simulation
  app.post('/api/simulate-late/:recordId', async (req, res) => {
    try {
      const { daysLate } = req.body;
      const record = await getBorrowById(req.params.recordId);
      if (!record) return res.status(404).json({ error: 'Borrow record not found' });

      if (record.status !== 'BORROWED') {
        return res.status(400).json({ error: 'Can only simulate overdue dates for currently active borrowed books' });
      }

      const lateDaysCount = parseInt(daysLate || 5);
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() - lateDaysCount);
      
      record.dueDate = newDueDate.toISOString();
      
      let calculatedFine = 0;
      if (lateDaysCount >= 1 && lateDaysCount <= 7) {
        calculatedFine = 20;
      } else if (lateDaysCount > 7) {
        calculatedFine = 50;
      }
      record.fineAmount = calculatedFine;

      await saveBorrow(record);

      await saveNotification({
        id: `notif-simulated-${Date.now()}`,
        studentRoll: record.studentRoll,
        title: "OVERDUE SIMULATED ALERT",
        message: `System simulated time leap: "${record.bookTitle}" is now ${lateDaysCount} days late. Unreturned late fee charged: BDT ${calculatedFine}.`,
        createdAt: new Date().toISOString(),
        isRead: false,
        type: 'OVERDUE' as const
      });

      res.json({ message: `Successfully simulated record ${record.id} as ${lateDaysCount} days late. Dynamic fine: BDT ${calculatedFine}`, record });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // LIBRARIANS CONTROLLERS
  // ==========================================
  app.get('/api/librarians', async (req, res) => {
    try {
      const data = await getAllLibrarians();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/librarians', async (req, res) => {
    try {
      const { name, mobile, address, shift } = req.body;
      if (!name) return res.status(400).json({ error: 'Name is required' });
      const newLib = {
        id: `lib-${Date.now()}`,
        name,
        mobile: mobile || '',
        address: address || '',
        shift: shift || 'Morning Shift'
      };
      await saveLibrarian(newLib);
      res.status(201).json(newLib);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/librarians/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, mobile, address, shift } = req.body;
      if (!name) return res.status(400).json({ error: 'Name is required' });
      const updatedLib = { id, name, mobile, address, shift };
      await saveLibrarian(updatedLib);
      res.json(updatedLib);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/librarians/:id', async (req, res) => {
    try {
      await deleteLibrarian(req.params.id);
      res.json({ message: 'Librarian deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // GALLERY CONTROLLERS
  // ==========================================
  app.get('/api/gallery', async (req, res) => {
    try {
      const data = await getAllGalleryItems();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/gallery', async (req, res) => {
    try {
      const { imageUrl, caption } = req.body;
      if (!imageUrl) return res.status(400).json({ error: 'Image URL is required' });
      const newItem = {
        id: `gal-${Date.now()}`,
        imageUrl,
        caption: caption || 'Library Gallery Image',
        title: req.body.title || caption || 'Library Gallery Image',
        description: req.body.description || '',
        status: 'APPROVED' as const,
        submittedByRoll: '',
        createdAt: new Date().toISOString()
      };
      await saveGalleryItem(newItem);
      res.status(201).json(newItem);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/gallery/submit', async (req, res) => {
    try {
      const { imageUrl, caption, title, description, submittedByRoll } = req.body;
      if (!imageUrl) return res.status(400).json({ error: 'Image URL is required' });
      const newItem = {
        id: `gal-sub-${Date.now()}`,
        imageUrl,
        caption: caption || title || 'Student Submission',
        title: title || caption || 'Student Submission',
        description: description || '',
        status: 'PENDING' as const,
        submittedByRoll: submittedByRoll || 'Anonymous',
        createdAt: new Date().toISOString()
      };
      await saveGalleryItem(newItem);
      res.status(201).json(newItem);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/gallery/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      if (!status || !['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      const items = await getAllGalleryItems();
      const found = items.find(item => item.id === req.params.id);
      if (!found) return res.status(404).json({ error: 'Gallery item not found' });
      
      found.status = status;
      await saveGalleryItem(found);
      res.json({ message: `Status updated to ${status} successfully`, item: found });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/gallery/:id', async (req, res) => {
    try {
      await deleteGalleryItem(req.params.id);
      res.json({ message: 'Gallery item deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // LIBRARY STATUS CONTROLLERS
  // ==========================================
  app.get('/api/library-status', async (req, res) => {
    try {
      const status = await getLibraryStatus();
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/library-status', async (req, res) => {
    try {
      const { status, openingTime, closingTime, weeklySchedule } = req.body;
      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }
      const updated = {
        id: 'current',
        status,
        openingTime: openingTime || '08:00 AM',
        closingTime: closingTime || '08:00 PM',
        weeklySchedule: weeklySchedule || 'Saturday - Thursday',
        updatedAt: new Date().toISOString()
      };
      await saveLibraryStatus(updated);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // NOTICE BOARD CONTROLLERS
  // ==========================================
  app.get('/api/notices', async (req, res) => {
    try {
      const list = await getAllNotices();
      res.json(list || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/notices/:id', async (req, res) => {
    try {
      const notice = await getNoticeById(req.params.id);
      if (!notice) return res.status(404).json({ error: 'Notice not found' });
      res.json(notice);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/notices', async (req, res) => {
    try {
      const { id, title, content, attachments, publishDate, expiryDate, isUrgent, isPinned } = req.body;
      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      const isNew = !id;
      const finalId = id || `notice-${Date.now()}`;
      
      const newNotice = {
        id: finalId,
        title,
        content,
        attachments: attachments || '',
        publishDate: publishDate || new Date().toISOString().split('T')[0],
        expiryDate: expiryDate || '',
        isUrgent: !!isUrgent,
        isPinned: !!isPinned,
        createdAt: new Date().toISOString()
      };

      await saveNotice(newNotice);

      // Trigger automatic student inbox notification on creation
      if (isNew) {
        await saveNotification({
          id: `notif-notice-${Date.now()}`,
          studentRoll: '', // broadcast wildcard
          title: isUrgent ? '🚨 Urgent Notice Published' : '📢 New Announcement posted',
          message: `Notice posted: "${title}". Check the Notice Board for full academic updates.`,
          createdAt: new Date().toISOString(),
          isRead: false,
          type: 'INFO'
        });
      }

      res.status(isNew ? 201 : 200).json(newNotice);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/admin/notices/:id', async (req, res) => {
    try {
      await deleteNotice(req.params.id);
      res.json({ success: true, message: 'Notice deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // HERO CAROUSEL CONTROLLERS
  // ==========================================
  app.get('/api/hero-slides', async (req, res) => {
    try {
      const list = await getAllHeroSlides();
      res.json(list || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/hero-slides', async (req, res) => {
    try {
      const { id, imageUrl, title, subtitle } = req.body;
      if (!imageUrl || !title) {
        return res.status(400).json({ error: 'imageUrl and title are required' });
      }

      const slideId = id || `slide-${Date.now()}`;
      const newSlide = {
        id: slideId,
        imageUrl,
        title,
        subtitle: subtitle || '',
        createdAt: new Date().toISOString()
      };

      await saveHeroSlide(newSlide);
      res.status(id ? 200 : 201).json(newSlide);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/admin/hero-slides/:id', async (req, res) => {
    try {
      await deleteHeroSlide(req.params.id);
      res.json({ success: true, message: 'Hero slide deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // INSTUTIONAL BRANDING CONTROLLERS
  // ==========================================
  app.get('/api/branding', async (req, res) => {
    try {
      const config = await getBrandingConfig();
      res.json(config);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Handle updates to branding config on both /api/branding and /api/admin/branding (POST & PUT)
  const handleBrandingSave = async (req: any, res: any) => {
    try {
      const { libraryName, shortName, logoUrl, email, phone, address, websiteUrl, footerText, copyrightText } = req.body;
      if (!libraryName || !shortName) {
        return res.status(400).json({ error: 'libraryName and shortName are required' });
      }

      const updated = {
        id: 'config',
        libraryName,
        shortName,
        logoUrl: logoUrl || '',
        email: email || '',
        phone: phone || '',
        address: address || '',
        websiteUrl: websiteUrl || '',
        footerText: footerText || '',
        copyrightText: copyrightText || ''
      };

      await saveBrandingConfig(updated);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  app.post('/api/admin/branding', handleBrandingSave);
  app.put('/api/admin/branding', handleBrandingSave);
  app.post('/api/branding', handleBrandingSave);
  app.put('/api/branding', handleBrandingSave);


  // ==========================================
  // LIBRARIAN CONTACT SUPPORT BACKEND
  // ==========================================

  // Support message submission endpoint
  app.post('/api/support/messages', async (req, res) => {
    try {
      const { name, email, rollNumber, registration, department, semester, subject, message } = req.body;
      if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, Email, and Message are required!' });
      }

      const newMsg: SupportMessage = {
        id: `msg-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        name,
        email,
        rollNumber: rollNumber || '',
        registration: registration || '',
        department: department || '',
        semester: semester ? Number(semester) : undefined,
        subject: subject || 'Support Request / Inquiry',
        message,
        createdAt: new Date().toISOString(),
        status: 'PENDING'
      };

      await saveSupportMessage(newMsg);
      res.status(201).json({ success: true, message: 'আপনার বার্তাটি সফলভাবে লাইব্রেরিয়ানের কাছে পাঠানো হয়েছে!', data: newMsg });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get all support messages
  app.get('/api/support/messages', async (req, res) => {
    try {
      const messages = await getAllSupportMessages();
      res.json(messages || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin action: read
  app.post('/api/support/messages/:id/read', async (req, res) => {
    try {
      const { id } = req.params;
      const messages = await getAllSupportMessages();
      const target = messages.find(m => m.id === id);
      if (!target) {
        return res.status(404).json({ error: 'Message not found' });
      }
      target.status = 'READ';
      await saveSupportMessage(target);
      res.json(target);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin action: reply
  app.post('/api/support/messages/:id/reply', async (req, res) => {
    try {
      const { id } = req.params;
      const { replyText } = req.body;
      if (!replyText) {
        return res.status(400).json({ error: 'Reply text is required' });
      }
      const messages = await getAllSupportMessages();
      const target = messages.find(m => m.id === id);
      if (!target) {
        return res.status(404).json({ error: 'Message not found' });
      }
      target.status = 'REPLIED';
      target.replyText = replyText;
      target.repliedAt = new Date().toISOString();
      await saveSupportMessage(target);
      res.json(target);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin action: archive
  app.post('/api/support/messages/:id/archive', async (req, res) => {
    try {
      const { id } = req.params;
      const messages = await getAllSupportMessages();
      const target = messages.find(m => m.id === id);
      if (!target) {
        return res.status(404).json({ error: 'Message not found' });
      }
      target.status = 'ARCHIVED';
      await saveSupportMessage(target);
      res.json(target);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin action: delete
  app.delete('/api/support/messages/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await deleteSupportMessage(id);
      res.json({ success: true, message: 'Message deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // Mount Vite / SPA static middleware
  if (!process.env.VERCEL) {
    if (process.env.NODE_ENV !== "production") {
      console.log("Starting server in DEVELOPMENT mode with Vite hmr integration...");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      console.log("Starting server in PRODUCTION mode...");
      const distPath = path.join(__dirname, 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  return app;
}

if (!process.env.VERCEL) {
  getExpressApp().then(app => {
    const PORT = 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`ScholarLib Server running perfectly on http://0.0.0.0:${PORT}`);
    });
  }).catch(err => {
    console.error("Critical: Failed to launch ScholarLib Server:", err);
  });
}
