# ScholarLib - Professional Library Management System

ScholarLib is a highly polished, responsive, full-stack library management system designed for academic and institutional libraries. It handles catalog searching, book borrowings, returns, online e-book reading, fine management, institutional branding adjustments, and direct messaging with librarians.

---

## 🚫 AI Removal Log (এআই রিমুভাল রেকর্ড)
As requested, all references to virtual chatbot assistants (**ScholarBot AI**) have been permanently decommissioned and removed from the codebase:
- **Index Title Cleared**: The main application page title in `index.html` has been changed from "My Google AI Studio App" to "ScholarLib - Library Management System".
- **Widget Purged**: The AI support floating action bot is now a **Direct Librarian Message Portal** (`SupportWidget.tsx`). The menu options and state trackers for AI typing simulation are removed.
- **Backend Cleaned**: All server-side Gemini generation routes (`/api/support/chat`) have been completely deleted from `server.ts`.

All support requests are routing directly into the library's administrative inbox, securing human supervision for all ticket reviews.

---

## 🚀 Key Features

### 📖 For Students & Members
- **Interactive Book Catalog**: Advanced searching of 1,000+ custom-seeded books by titles, author, tags, and category with physical location identifiers.
- **Responsive E-Book Reader**: Integrated in-browser viewer to search, open, and read academic digital contents instantly without downloading PDF copies.
- **Unified Dashboards**: Real-time overview of current borrow metrics, book checkouts history, pending request tracking, and calculated overdue fines.
- **Support Inbox**: Secure, guest-supported mail widget that maps active student profiles instantly to direct librarian communication channels.

### 🔑 For Admins & Librarians
- **Lending Management**: Detailed panel to approve physical checkouts, log returned packages, track due dates, and update manual fine status entries.
- **Comprehensive Database Control**: Fully structured tables to create, modify, view, or delete authors indices, student roster profiles, and individual book entries.
- **Dynamic Site Branding**: Instant client-wide customizations for library banners, official schedule timings, contact directory helplines, logo details, and mailing domains.

---

## 🛠️ Tech Stack & Structure
- **Frontend Engine**: React 19 + TypeScript + Vite + Motion (Fluid transition effects)
- **Styling Guide**: Tailwind CSS
- **Icons Library**: Lucide React
- **Backend Framework**: Express JS Core API routes
- **Database Architecture**: Cloud Firestore persistent schema
