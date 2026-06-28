import * as fb from './client_firebase';
import { Book, Student, BorrowRecord, Fine, Notification, Librarian, GalleryItem, LibraryStatus, BrandingConfig, SupportMessage } from './types.js';

// Intercept window.fetch at the top level
export function setupFetchInterceptor() {
  if (typeof window === 'undefined') return;

  const originalFetch = window.fetch;

  const customFetch = async function (this: any, input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlStr = typeof input === 'string' ? input : (input instanceof URL ? input.href : input.url);

    // Only intercept requests destined for internal relative /api/ paths
    if (!urlStr.startsWith('/api') && !urlStr.includes('/api/')) {
      return originalFetch.call(this, input, init);
    }

    // Parse path and query parameters
    const parsedUrl = new URL(urlStr, window.location.origin);
    const pathname = parsedUrl.pathname;
    const parts = pathname.split('/').filter(Boolean); // e.g. ["api", "books", "id"]
    const method = init?.method?.toUpperCase() || 'GET';
    const requestBody = init?.body ? JSON.parse(init.body as string) : null;

    console.log(`[API Interceptor] Intercepted ${method} ${pathname}`, requestBody);

    try {
      // -------------------------------------------------------------
      // 1. BRANDING & GRAPHICAL CONFIGURATION
      // -------------------------------------------------------------
      if (pathname === '/api/branding') {
        if (method === 'GET') {
          const cfg = await fb.getBrandingConfig();
          return jsonResponse(cfg);
        }
        if (method === 'POST' || method === 'PUT') {
          await fb.saveBrandingConfig(requestBody);
          return jsonResponse({ message: 'Branding configuration updated successfully.', config: requestBody });
        }
      }
      if (pathname === '/api/admin/branding') {
        if (method === 'POST' || method === 'PUT') {
          await fb.saveBrandingConfig(requestBody);
          return jsonResponse({ message: 'Branding configuration updated successfully.', config: requestBody });
        }
      }

      // -------------------------------------------------------------
      // 2. LIBRARY OPEN HOURS & STATUS
      // -------------------------------------------------------------
      if (pathname === '/api/library-status') {
        if (method === 'GET') {
          const status = await fb.getLibraryStatus();
          return jsonResponse(status);
        }
        if (method === 'PUT') {
          await fb.saveLibraryStatus(requestBody);
          return jsonResponse({ message: 'Library status updated successfully.', status: requestBody });
        }
      }

      // -------------------------------------------------------------
      // 3. STAFF & LIBRARIANS
      // -------------------------------------------------------------
      if (pathname === '/api/librarians') {
        if (method === 'GET') {
          const libs = await fb.getAllLibrarians();
          return jsonResponse(libs);
        }
        if (method === 'POST') {
          const newLib = { ...requestBody, id: requestBody.id || `lib-${Date.now()}` };
          await fb.saveLibrarian(newLib);
          return jsonResponse({ message: 'Librarian added successfully.', librarian: newLib }, 201);
        }
      }
      if (pathname.startsWith('/api/librarians/') && parts.length === 3) {
        const id = parts[2];
        if (method === 'PUT') {
          const updated = { ...requestBody, id };
          await fb.saveLibrarian(updated);
          return jsonResponse({ message: 'Librarian details updated successfully.', librarian: updated });
        }
        if (method === 'DELETE') {
          await fb.deleteLibrarian(id);
          return jsonResponse({ message: 'Librarian registered profile deleted.' });
        }
      }

      // -------------------------------------------------------------
      // 4. CURATED CATALOG BOOKS
      // -------------------------------------------------------------
      if (pathname === '/api/books') {
        if (method === 'GET') {
          const books = await fb.getAllBooks();
          return jsonResponse(books);
        }
        if (method === 'POST') {
          const newBook = { 
            ...requestBody, 
            id: requestBody.id || `book-${Date.now()}`,
            availableCopies: Number(requestBody.copiesCount || 1),
            copiesCount: Number(requestBody.copiesCount || 1)
          };
          await fb.saveBook(newBook);
          return jsonResponse({ message: 'Book successfully published in digital catalog.', book: newBook }, 201);
        }
      }
      if (pathname.startsWith('/api/books/') && parts.length === 3) {
        const id = parts[2];
        if (method === 'GET') {
          const book = await fb.getBookById(id);
          if (book) return jsonResponse(book);
          return errorResponse('Book record not found in index.', 404);
        }
        if (method === 'PUT') {
          const updated = { ...requestBody, id };
          await fb.saveBook(updated);
          return jsonResponse({ message: 'Book catalog entry updated.', book: updated });
        }
        if (method === 'DELETE') {
          await fb.deleteBook(id);
          return jsonResponse({ message: 'Book removed from index successfully.' });
        }
      }

      // -------------------------------------------------------------
      // 5. DETERMINISTIC STUDENT LOGINS & PROFILES
      // -------------------------------------------------------------
      if (pathname === '/api/students') {
        if (method === 'GET') {
          const students = await fb.getAllStudents();
          return jsonResponse(students);
        }
        if (method === 'POST') {
          const roll = String(requestBody.rollNumber || requestBody.roll || '').trim();
          const p = requestBody.password || `pass-${roll}`;
          const newStudent = { ...requestBody, rollNumber: roll, password: p, isActive: true };
          await fb.saveStudent(newStudent);
          return jsonResponse({ message: 'Student registered successfully', student: newStudent }, 201);
        }
      }
      if (pathname.startsWith('/api/students/') && pathname !== '/api/students') {
        const roll = decodeURIComponent(pathname.substring('/api/students/'.length));
        if (method === 'GET') {
          const student = await fb.getStudentByRoll(roll);
          if (student) return jsonResponse(student);
          return errorResponse('Student profile not found.', 404);
        }
        if (method === 'PUT') {
          const updated = { ...requestBody, rollNumber: roll };
          await fb.saveStudent(updated);
          return jsonResponse({ message: 'Student profile updated successfully', student: updated });
        }
        if (method === 'DELETE') {
          await fb.deleteStudent(roll);
          return jsonResponse({ message: 'Student profile removed successfully.' });
        }
      }

      // -------------------------------------------------------------
      // 6. DETAILED STUDENT AUTHENTICATION ENFORCEMENTS
      // -------------------------------------------------------------
      if (pathname === '/api/auth/login' || pathname === '/api/login') {
        if (method === 'POST') {
          const { rollNumber, password } = requestBody;
          if (!rollNumber || !password) {
            return errorResponse('Please fill in roll number and password.', 400);
          }

          // Super Admin check
          if (rollNumber === 'ADMIN' && password === 'adminpass') {
            const adminUser = {
              name: 'Super Admin',
              rollNumber: 'ADMIN',
              department: 'Administration',
              semester: 8,
              isActive: true,
              role: 'admin'
            };
            return jsonResponse({ user: adminUser, role: 'admin' });
          }

          // Normal student check via Firestore
          const student = await fb.getStudentByRoll(rollNumber);
          if (!student) {
            return errorResponse('Roll number credentials not indexed.', 404);
          }
          if (student.password !== password) {
            return errorResponse('Incorrect security password code.', 401);
          }
          
          return jsonResponse({ user: student, role: 'student' });
        }
      }

      // -------------------------------------------------------------
      // 7. BORROWING PROCESS & INVENTORY CHECKOUTS
      // -------------------------------------------------------------
      if (pathname === '/api/borrow') {
        if (method === 'POST') {
          const { bookId, studentRoll, durationDays } = requestBody;
          if (!bookId || !studentRoll || !durationDays) {
            return errorResponse('Missing bookId, studentRoll, or durationDays', 400);
          }

          const student = await fb.getStudentByRoll(studentRoll);
          if (!student) return errorResponse('Student not indexed in base database.', 404);

          const book = await fb.getBookById(bookId);
          if (!book) return errorResponse('Curated book not found in library directory.', 404);

          const allBorrows = await fb.getAllBorrows();
          const activeCount = allBorrows.filter(b => b.studentRoll === student.rollNumber && b.status !== 'RETURNED').length;

          if (activeCount >= 2 && book.format !== 'E-Book') {
            return errorResponse('Borrow Limit Exceeded. You can borrow a maximum of 2 physical books at any time.', 400);
          }

          if (book.format !== 'E-Book' && book.availableCopies <= 0) {
            return errorResponse('Book of interest and edition is currently unavailable. You may join waitlist.', 400);
          }

          const now = new Date();
          const dueDate = new Date();
          dueDate.setDate(now.getDate() + parseInt(durationDays));

          const record: BorrowRecord = {
            id: `borrow-${Date.now()}`,
            bookId: book.id,
            bookTitle: book.title,
            bookImage: book.imageUrl || '',
            studentRoll: student.rollNumber,
            studentName: student.name,
            borrowDate: now.toISOString(),
            durationDays: parseInt(durationDays),
            dueDate: dueDate.toISOString(),
            status: 'PENDING_APPROVE',
            fineAmount: 0
          };

          await fb.saveBorrow(record);

          // Save borrow notification
          const notif: Notification = {
            id: `notif-${Date.now()}`,
            studentRoll: student.rollNumber,
            title: "Borrow Requested",
            message: `Your request to borrow "${book.title}" for ${durationDays} days has been submitted. Please collect once approved by the librarian.`,
            createdAt: now.toISOString(),
            isRead: false,
            type: 'INFO'
          };
          await fb.saveNotification(notif);

          return jsonResponse({ message: 'Borrow request submitted successfully. Awaiting librarian approval.', record });
        }
      }

      // -------------------------------------------------------------
      // 8. RETURNS CONTROL LOOPS
      // -------------------------------------------------------------
      if (pathname.startsWith('/api/return/') && parts.length === 3) {
        const recordId = parts[2];
        if (method === 'POST') {
          const record = await fb.getBorrowById(recordId);
          if (!record) return errorResponse('Borrow transaction not found.', 404);

          record.status = 'PENDING_RETURN';
          await fb.saveBorrow(record);

          const notif: Notification = {
            id: `notif-${Date.now()}`,
            studentRoll: record.studentRoll,
            title: "Return Initiated",
            message: `Your physical return request for book "${record.bookTitle}" has been logged. Please bring the book to the counter for verification.`,
            createdAt: new Date().toISOString(),
            isRead: false,
            type: 'INFO'
          };
          await fb.saveNotification(notif);

          return jsonResponse({ message: 'Return requested successfully. Please deliver book to physical counter.', record });
        }
      }

      // -------------------------------------------------------------
      // 9. LIBRARIANS BORROW & RETURN APPROVALS
      // -------------------------------------------------------------
      if (pathname.startsWith('/api/admin/approve-borrow/') && parts.length === 4) {
        const recordId = parts[3];
        if (method === 'POST') {
          const record = await fb.getBorrowById(recordId);
          if (!record) return errorResponse('Borrow transactions state not found.', 404);

          const book = await fb.getBookById(record.bookId);
          if (!book) return errorResponse('Book details missing.', 404);

          if (book.format !== 'E-Book') {
            book.availableCopies = Math.max(0, book.availableCopies - 1);
            await fb.saveBook(book);
          }

          record.status = 'BORROWED';
          await fb.saveBorrow(record);

          const notif: Notification = {
            id: `notif-${Date.now()}`,
            studentRoll: record.studentRoll,
            title: "Borrow Request Approved",
            message: `Your request for "${record.bookTitle}" was approved! Please collect from checkout counter, enjoy your reading.`,
            createdAt: new Date().toISOString(),
            isRead: false,
            type: 'APPROVAL'
          };
          await fb.saveNotification(notif);

          return jsonResponse({ message: 'Borrow transaction approved successfully.', record });
        }
      }

      if (pathname.startsWith('/api/admin/approve-return/') && parts.length === 4) {
        const recordId = parts[3];
        if (method === 'POST') {
          const record = await fb.getBorrowById(recordId);
          if (!record) return errorResponse('Borrow record not found.', 404);

          const book = await fb.getBookById(record.bookId);
          if (!book) return errorResponse('Book record not found.', 404);

          if (book.format !== 'E-Book') {
            book.availableCopies = Math.min(book.copiesCount, book.availableCopies + 1);
            await fb.saveBook(book);
          }

          record.status = 'RETURNED';
          await fb.saveBorrow(record);

          // Clear overdue fines if any (or mark finepaid)
          const allFines = await fb.getAllFines();
          const matchFine = allFines.find(f => f.reason.includes(recordId) && f.status === 'UNPAID');
          if (matchFine) {
            matchFine.status = 'PAID';
            await fb.saveFine(matchFine);
          }

          const notif: Notification = {
            id: `notif-${Date.now()}`,
            studentRoll: record.studentRoll,
            title: "Return Fully Verified",
            message: `Librarian has verified the copy condition for "${record.bookTitle}". Your account limits have been cleared.`,
            createdAt: new Date().toISOString(),
            isRead: false,
            type: 'APPROVAL'
          };
          await fb.saveNotification(notif);

          return jsonResponse({ message: 'Librarian approved and catalog count restored.', record });
        }
      }

      // Simulate overdue
      if (pathname.startsWith('/api/simulate-late/') && parts.length === 3) {
        const recordId = parts[2];
        const record = await fb.getBorrowById(recordId);
        if (!record) return errorResponse('No transaction record.', 404);

        record.fineAmount = 50;
        await fb.saveBorrow(record);

        // Add fine document
        const fine: Fine = {
          id: `fine-${Date.now()}`,
          studentRoll: record.studentRoll,
          studentName: record.studentName,
          amount: 50,
          reason: `Overdue: ${record.bookTitle} (Borrow ID: ${recordId})`,
          status: 'UNPAID',
          createdAt: new Date().toISOString()
        };
        await fb.saveFine(fine);

        const notif: Notification = {
          id: `notif-${Date.now()}`,
          studentRoll: record.studentRoll,
          title: "Overdue Fine Notice",
          message: `The book "${record.bookTitle}" is overdue. A late fee constraint of BDT 50 has been generated.`,
          createdAt: new Date().toISOString(),
          isRead: false,
          type: 'OVERDUE'
        };
        await fb.saveNotification(notif);

        return jsonResponse({ message: 'Simulated late status successfully.', record });
      }

      // -------------------------------------------------------------
      // 10. NOTIFICATIONS DISPATCH
      // -------------------------------------------------------------
      if (pathname.startsWith('/api/notifications')) {
        if (method === 'GET') {
          const roll = parts[2] || '';
          const notifs = await fb.getNotificationsForRoll(roll);
          return jsonResponse(notifs);
        }
      }
      if (pathname.startsWith('/api/notifications/') && parts.length === 3) {
        const id = parts[2];
        if (method === 'DELETE') {
          await fb.deleteNotification(id);
          return jsonResponse({ message: 'Notification dismissed successfully.' });
        }
      }

      // -------------------------------------------------------------
      // 11. BORROWS DIRECTORY & HISTORY
      // -------------------------------------------------------------
      if (pathname === '/api/admin/borrows') {
        if (method === 'GET') {
          const borrows = await fb.getAllBorrows();
          return jsonResponse(borrows);
        }
      }
      if (pathname.startsWith('/api/borrow-history/') && pathname !== '/api/borrow-history/') {
        const roll = decodeURIComponent(pathname.substring('/api/borrow-history/'.length));
        const borrows = await fb.getAllBorrows();
        const studentBorrows = borrows.filter(b => b.studentRoll === roll);
        return jsonResponse(studentBorrows);
      }

      // -------------------------------------------------------------
      // 12. FINES PAYMENTS
      // -------------------------------------------------------------
      if (pathname === '/api/admin/fines') {
        const fines = await fb.getAllFines();
        return jsonResponse(fines);
      }
      if (pathname.startsWith('/api/fines/') && !pathname.startsWith('/api/fines/pay/') && pathname !== '/api/fines/') {
        const roll = decodeURIComponent(pathname.substring('/api/fines/'.length));
        const fines = await fb.getAllFines();
        return jsonResponse(fines.filter(f => f.studentRoll === roll));
      }
      if (pathname.startsWith('/api/fines/pay/') && parts.length === 4) {
        const fineId = parts[3];
        const fine = await fb.getFineById(fineId);
        if (fine) {
          fine.status = 'PAID';
          await fb.saveFine(fine);
          
          // clear borrow fine amount by matching the Borrow ID in the reason field
          const match = fine.reason.match(/\(Borrow ID:\s*([^\)]+)\)/);
          const borrowId = match ? match[1] : null;
          if (borrowId) {
            const record = await fb.getBorrowById(borrowId);
            if (record) {
              record.fineAmount = 0;
              await fb.saveBorrow(record);
            }
          }

          const notif: Notification = {
            id: `notif-${Date.now()}`,
            studentRoll: fine.studentRoll,
            title: "Fine Payment Received",
            message: `Your payment of BDT ${fine.amount} for "${fine.reason}" overdue charges cleared.`,
            createdAt: new Date().toISOString(),
            isRead: false,
            type: 'APPROVAL'
          };
          await fb.saveNotification(notif);

          return jsonResponse({ message: 'Overdue pay confirmation recorded.', fine });
        }
      }

      // -------------------------------------------------------------
      // 13. NOTICES BOARD
      // -------------------------------------------------------------
      if (pathname === '/api/notices' || pathname === '/api/admin/notices') {
        if (method === 'GET') {
          const notices = await fb.getAllNotices();
          return jsonResponse(notices);
        }
        if (method === 'POST') {
          const notice = { ...requestBody, id: requestBody?.id || `notice-${Date.now()}`, createdAt: new Date().toISOString() };
          await fb.saveNotice(notice);
          return jsonResponse({ message: 'Notice board published successfully.', notice }, 201);
        }
      }
      if ((pathname.startsWith('/api/notices/') && pathname !== '/api/notices') || (pathname.startsWith('/api/admin/notices/') && pathname !== '/api/admin/notices')) {
        const id = decodeURIComponent(pathname.substring(pathname.includes('/admin/') ? '/api/admin/notices/'.length : '/api/notices/'.length));
        if (method === 'GET') {
          const notice = await fb.getAllNotices().then(all => all.find(n => n.id === id));
          if (notice) return jsonResponse(notice);
          return errorResponse('Notice not found.', 404);
        }
        if (method === 'PUT' || method === 'POST') {
          const notice = { ...requestBody, id, updatedAt: new Date().toISOString() };
          await fb.saveNotice(notice);
          return jsonResponse({ message: 'Notice updated successfully', notice });
        }
        if (method === 'DELETE') {
          await fb.deleteNotice(id);
          return jsonResponse({ success: true, message: 'Notice deleted successfully' });
        }
      }

      // -------------------------------------------------------------
      // 14. HERO CAROUSEL SLIDES
      // -------------------------------------------------------------
      if (pathname === '/api/hero-slides' || pathname === '/api/admin/hero-slides') {
        if (method === 'GET') {
          const slides = await fb.getAllHeroSlides();
          return jsonResponse(slides);
        }
        if (method === 'POST') {
          const slide = { ...requestBody, id: requestBody?.id || `slide-${Date.now()}`, createdAt: new Date().toISOString() };
          await fb.saveHeroSlide(slide);
          return jsonResponse({ message: 'Hero slide saved successfully.', slide }, 201);
        }
      }
      if ((pathname.startsWith('/api/hero-slides/') && pathname !== '/api/hero-slides') || (pathname.startsWith('/api/admin/hero-slides/') && pathname !== '/api/admin/hero-slides')) {
        const id = decodeURIComponent(pathname.substring(pathname.includes('/admin/') ? '/api/admin/hero-slides/'.length : '/api/hero-slides/'.length));
        if (method === 'GET') {
          const slide = await fb.getAllHeroSlides().then(all => all.find(s => s.id === id));
          if (slide) return jsonResponse(slide);
          return errorResponse('Hero slide not found.', 404);
        }
        if (method === 'PUT' || method === 'POST') {
          const slide = { ...requestBody, id, updatedAt: new Date().toISOString() };
          await fb.saveHeroSlide(slide);
          return jsonResponse({ message: 'Hero slide updated successfully', slide });
        }
        if (method === 'DELETE') {
          await fb.deleteHeroSlide(id);
          return jsonResponse({ success: true, message: 'Hero slide removed successfully.' });
        }
      }

      // -------------------------------------------------------------
      // 15. GALLERY GRAPHICS
      // -------------------------------------------------------------
      if (pathname === '/api/gallery') {
        const items = await fb.getAllGalleryItems();
        return jsonResponse(items);
      }
      if (pathname === '/api/gallery/submit' || pathname === '/api/gallery') {
        if (method === 'POST') {
          const item = { ...requestBody, id: `gal-${Date.now()}`, createdAt: new Date().toISOString() };
          await fb.saveGalleryItem(item);
          return jsonResponse({ message: 'Gallery attachment uploaded successfully.', item }, 201);
        }
      }
      if (pathname.startsWith('/api/gallery/') && parts.length === 3) {
        const id = parts[2];
        if (method === 'DELETE') {
          await fb.deleteGalleryItem(id);
          return jsonResponse({ message: 'Gallery item removed successfully.' });
        }
      }

      // -------------------------------------------------------------
      // 16. SUPPORT CENTER MESSAGES & LIFECYCLE
      // -------------------------------------------------------------
      if (pathname === '/api/support/messages' || pathname === '/api/support/chat') {
        if (method === 'GET') {
          const msgs = await fb.getAllSupportMessages();
          return jsonResponse(msgs);
        }
        if (method === 'POST') {
          const id = `msg-${Date.now()}`;
          const newMsg: SupportMessage = {
            id,
            name: requestBody.studentName || requestBody.name || 'Anonymous User',
            email: requestBody.email || 'support@cpi.edu.bd',
            rollNumber: requestBody.rollNumber || 'Anonymous',
            message: requestBody.messageText || requestBody.message || '',
            createdAt: new Date().toISOString(),
            status: 'PENDING'
          };
          await fb.saveSupportMessage(newMsg);
          return jsonResponse({ message: 'Support communication logged successfully.', supportMessage: newMsg }, 201);
        }
      }
      if (pathname.startsWith('/api/support/messages/') && parts.length === 4) {
        const id = parts[3];
        const msg = await fb.getAllSupportMessages();
        const active = msg.find(m => m.id === id);

        if (active) {
          if (pathname.endsWith('/reply') && method === 'POST') {
            active.replyText = requestBody.replyText || requestBody.text || '';
            active.repliedAt = new Date().toISOString();
            active.status = 'REPLIED';
            await fb.saveSupportMessage(active);
            return jsonResponse({ message: 'Response queued successfully.', supportMessage: active });
          }
          if (pathname.endsWith('/archive') && method === 'POST') {
            active.status = 'ARCHIVED';
            await fb.saveSupportMessage(active);
            return jsonResponse({ message: 'Support ticket archived.', supportMessage: active });
          }
          if (pathname.endsWith('/read') && method === 'POST') {
            active.status = 'READ';
            await fb.saveSupportMessage(active);
            return jsonResponse({ message: 'Ticket marked read.', supportMessage: active });
          }
        }
        if (method === 'DELETE') {
          await fb.deleteSupportMessage(id);
          return jsonResponse({ message: 'Support conversation discarded.' });
        }
      }

      // -------------------------------------------------------------
      // 17. ANALYTICS GRAPHS
      // -------------------------------------------------------------
      if (pathname === '/api/admin/analytics') {
        const booksCol = await fb.getAllBooks();
        const borrowsCol = await fb.getAllBorrows();
        const students = await fb.getAllStudents();
        const fines = await fb.getAllFines();

        const totalPhysicalBooksSum = booksCol.filter(b => b.format !== 'E-Book').reduce((sum, b) => sum + (b.copiesCount || 0), 0);
        const totalEbooksCount = booksCol.filter(b => b.format === 'E-Book').length;
        const activeStudentsLength = students.length;
        const activeBorrows = borrowsCol.filter(b => b.status === 'BORROWED' || b.status === 'PENDING_RETURN').length;
        const pendingRequests = borrowsCol.filter(b => b.status === 'PENDING_APPROVE').length;

        const catMap: { [cat: string]: number } = {};
        booksCol.forEach(b => {
          catMap[b.category] = (catMap[b.category] || 0) + 1;
        });

        const categoriesData = Object.keys(catMap).map(k => ({
          name: k,
          value: catMap[k]
        })).sort((a, b) => b.value - a.value).slice(0, 8);

        const monthlyLoans = [
          { month: 'Jan', loans: 110, digital: 45 },
          { month: 'Feb', loans: 145, digital: 68 },
          { month: 'Mar', loans: 230, digital: 112 },
          { month: 'Apr', loans: 190, digital: 95 },
          { month: 'May', loans: 320, digital: 140 },
          { month: 'Jun', loans: activeBorrows + 150, digital: totalEbooksCount + 80 }
        ];

        const unpaidFinesTotal = fines.filter(f => f.status === 'UNPAID').reduce((sum, f) => sum + f.amount, 0);
        const collectedFinesTotal = fines.filter(f => f.status === 'PAID').reduce((sum, f) => sum + f.amount, 0);

        const analytics = {
          totalPhysicalBooksSum,
          totalEbooksCount,
          activeStudentsLength,
          activeBorrows,
          pendingRequests,
          categoriesData,
          monthlyLoans,
          unpaidFinesTotal,
          collectedFinesTotal
        };

        return jsonResponse(analytics);
      }

      // Default fallback
      return errorResponse(`Method ${method} on resource ${pathname} not found in client api intercepts.`, 404);

    } catch (e: any) {
      console.error(`[API Interceptor] Fatal error in intercepting ${pathname}:`, e);
      return errorResponse(e?.message || 'Local execution interceptor runtime exception.', 500);
    }
  };

  try {
    (window as any).fetch = customFetch;
  } catch (error) {
    console.warn("Direct window.fetch override failed. Using Object.defineProperty fallback:", error);
    try {
      Object.defineProperty(window, 'fetch', {
        value: customFetch,
        writable: true,
        configurable: true,
        enumerable: true
      });
    } catch (definePropertyError) {
      console.error("Critical fallback failed: Cannot define property fetch on window:", definePropertyError);
    }
  }
}

// SPEC-COMPLIANT HELPER FUNCTIONS
function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Interceded-By': 'Client-Firebase-Vercel'
    }
  });
}

function errorResponse(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Interceded-By': 'Client-Firebase-Vercel'
    }
  });
}
