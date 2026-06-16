import fs from 'fs';
import path from 'path';
import { Book, Student, BorrowRecord, Fine, Notification } from './types.js';

const DB_PATH = path.join(process.cwd(), 'database.json');

// Exact Core books mentioned/displayed in the provided screenshots for perfect UI consistency!
const CORE_BOOKS: Omit<Book, 'id'>[] = [
  {
    title: "Quantum Mechanics: A Modern Development",
    author: "Leslie E. Ballentine",
    category: "Physics",
    isbn: "978-9814578578",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80",
    description: "This book provides a thorough and updated introduction to the fundamental principles of quantum mechanics. It emphasizes the physical interpretation of the theory and its practical applications in modern physics. The development of the subject is logical and rigorous, yet accessible to students who have a basic understanding of mathematics and classical physics.\n\nUnlike traditional texts, Ballentine focuses on the conceptual foundations, clearing up many common misunderstandings in the field. This modern development covers everything from basic principles to advanced topics like measurement theory and quantum optics, making it an essential resource for researchers and graduate students alike.",
    publisher: "World Scientific Publishing",
    publishDate: "May 2014",
    pageCount: 736,
    format: "Hardcover",
    copiesCount: 5,
    availableCopies: 4,
    location: "Level 4, Shelf 212",
    subject: "Physics / Quantum Theory",
    edition: "2nd Edition"
  },
  {
    title: "The Architecture of Information",
    author: "Elena Thorne",
    category: "IT",
    isbn: "978-0123456789",
    imageUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&auto=format&fit=crop&q=80",
    description: "A comprehensive guide into how digital structures shape our understanding of modern knowledge ecosystems. This book bridges technical engineering diagrams with modern cognitive structures, empowering system architects to build accessible, enduring platforms.",
    publisher: "Academic Press Ltd",
    publishDate: "October 2021",
    pageCount: 412,
    format: "Hardcover",
    copiesCount: 4,
    availableCopies: 4,
    location: "Level 2, Shelf 105",
    subject: "Information Technology",
    edition: "1st Edition"
  },
  {
    title: "Quantum Mechanics II",
    author: "Dr. Sarah Jenkins",
    category: "Physics",
    isbn: "978-1234567890",
    imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80",
    description: "Advanced topics in quantum system dynamics, focusing on relativistic formulations, scattering theory, and quantum field approximations. Perfect for senior graduate physicists.",
    publisher: "University Science Press",
    publishDate: "March 2020",
    pageCount: 620,
    format: "Hardcover",
    copiesCount: 3,
    availableCopies: 3,
    location: "Level 4, Shelf 213",
    subject: "Physics / Quantum Dynamics",
    edition: "Revised Edition"
  },
  {
    title: "Global Economic Trends",
    author: "Marcus Thorne",
    category: "Economics",
    isbn: "978-2345678901",
    imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&auto=format&fit=crop&q=80",
    description: "An intensive retrospective on global trades and monetary policies from the Industrial Revolution up to the post-pandemic digital economy.",
    publisher: "Oxford University Press",
    publishDate: "January 2023",
    pageCount: 350,
    format: "Paperback",
    copiesCount: 6,
    availableCopies: 6,
    location: "Level 1, Shelf 41",
    subject: "Economics / Macroeconomics",
    edition: "1st Edition"
  },
  {
    title: "Urban Development",
    author: "Elena Rossi",
    category: "Business Studies",
    isbn: "978-3456789012",
    imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80",
    description: "An inquiry into sustainable municipal planning, economic micro-hubs, and environmental architectures of the 21st century.",
    publisher: "Milano Academic Publishers",
    publishDate: "September 2022",
    pageCount: 288,
    format: "Paperback",
    copiesCount: 2,
    availableCopies: 2,
    location: "Level 3, Shelf 302",
    subject: "Infrastructure & Cities",
    edition: "2nd Edition"
  },
  {
    title: "Molecular Biology",
    author: "Prof. Kenji Sato",
    category: "Chemistry",
    isbn: "978-4567890123",
    imageUrl: "https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?w=600&auto=format&fit=crop&q=80",
    description: "A deep dive into biochemical genetics, replication pathways, and cellular translation mechanisms.",
    publisher: "Tokyo Science Press",
    publishDate: "November 2019",
    pageCount: 512,
    format: "Hardcover",
    copiesCount: 4,
    availableCopies: 4,
    location: "Level 4, Shelf 115",
    subject: "Chemistry / Biology",
    edition: "3rd Edition"
  },
  {
    title: "Digital Ethics 101",
    author: "Lisa M. Cheng",
    category: "Cyber Security",
    isbn: "978-5678901234",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80",
    description: "An essential analysis on privacy rights, machine transparency, and the ethics of algorithmic decision-making.",
    publisher: "MIT Press",
    publishDate: "June 2024",
    pageCount: 310,
    format: "Paperback",
    copiesCount: 8,
    availableCopies: 8,
    location: "Level 2, Shelf 210",
    subject: "Cyber Tech Ethics",
    edition: "1st Edition"
  },
  // Related books from detailed page bottom:
  {
    title: "Introduction to Electrodynamics",
    author: "David J. Griffiths",
    category: "Physics",
    isbn: "978-1108420419",
    imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80",
    description: "The highly acclaimed standard student introduction to electromagnetic fields, radiation, electrostatics, and relativistic electrodynamics.",
    publisher: "Cambridge University Press",
    publishDate: "June 2017",
    pageCount: 624,
    format: "Hardcover",
    copiesCount: 8,
    availableCopies: 8,
    location: "Level 4, Shelf 214",
    subject: "Physics / Electromagnetism"
  },
  {
    title: "Classical Mechanics",
    author: "Herbert Goldstein",
    category: "Physics",
    isbn: "978-0201657029",
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
    description: "The definitive graduate textbook on mechanics, covering Hamiltonians, Lagrangian mechanics, rigid bodies, and celestial math.",
    publisher: "Pearson Education",
    publishDate: "June 2001",
    pageCount: 638,
    format: "Hardcover",
    copiesCount: 4,
    availableCopies: 4,
    location: "Level 4, Shelf 215",
    subject: "Physics / Classical Mechanics"
  },
  {
    title: "Modern Physics",
    author: "Kenneth S. Krane",
    category: "Physics",
    isbn: "978-1118061145",
    imageUrl: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=600&auto=format&fit=crop&q=80",
    description: "Covers special relativity, wave particle duality, atomic structures, and early quantum theory for intermediate undergraduate levels.",
    publisher: "John Wiley & Sons",
    publishDate: "February 2012",
    pageCount: 560,
    format: "Hardcover",
    copiesCount: 5,
    availableCopies: 5,
    location: "Level 4, Shelf 216",
    subject: "Physics / Quantum Foundations"
  },
  {
    title: "Statistical Mechanics",
    author: "R.K. Pathria",
    category: "Physics",
    isbn: "978-0123821881",
    imageUrl: "https://images.unsplash.com/photo-1562774053-4ab044fac3a5?w=600&auto=format&fit=crop&q=80",
    description: "Advanced reference on thermodynamic state states, ensemble theories, quantum ideals, phase transformations, and fluctuations.",
    publisher: "Elsevier",
    publishDate: "March 2011",
    pageCount: 718,
    format: "Paperback",
    copiesCount: 3,
    availableCopies: 3,
    location: "Level 4, Shelf 217",
    subject: "Physics / Statistical mechanics"
  },
  {
    title: "Principles of QM",
    author: "R. Shankar",
    category: "Physics",
    isbn: "978-0306447908",
    imageUrl: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&auto=format&fit=crop&q=80",
    description: "Features a beautiful starting mathematical summary of vector spaces, enabling students to step cleanly into wave equations and atomic solvers.",
    publisher: "Plenum Press",
    publishDate: "September 1994",
    pageCount: 692,
    format: "Hardcover",
    copiesCount: 6,
    availableCopies: 6,
    location: "Level 4, Shelf 218",
    subject: "Physics / Quantum mechanics"
  },
  // Core Books on Catalog page:
  {
    title: "Principles of Modern Logic and Knowledge",
    author: "Dr. Julian Sterling",
    category: "Literature",
    isbn: "978-3-16",
    imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80",
    description: "An inquiry into epistemic systems, formalizing deductive structures that underpin modern academic literature and philosophical studies.",
    publisher: "Cambridge Academic Press",
    publishDate: "April 2015",
    pageCount: 320,
    format: "Hardcover",
    copiesCount: 3,
    availableCopies: 3,
    location: "Level 3, Shelf 11",
    subject: "Humanities / Logic"
  },
  {
    title: "Advanced Organic Chemistry",
    author: "Elena Rodriguez",
    category: "Chemistry",
    isbn: "978-4-12",
    imageUrl: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=600&auto=format&fit=crop&q=80",
    description: "A molecular map of carbon structures, detailing bonding mechanisms, kinetic solvers, and practical industrial lab operations.",
    publisher: "Wiley Scientific",
    publishDate: "July 2018",
    pageCount: 810,
    format: "Hardcover",
    copiesCount: 2,
    availableCopies: 0, // Mocked borrowed in Image 3
    location: "Level 4, Shelf 49",
    subject: "Advanced Sciences / Chemistry"
  },
  {
    title: "Economic Policy in the 21st Century",
    author: "Arthur C. Millman",
    category: "Economics",
    isbn: "978-5-44",
    imageUrl: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600&auto=format&fit=crop&q=80",
    description: "Evaluating central bank fiscal actions, inflation controls, and trade frameworks in the interconnected post-globalization landscape.",
    publisher: "Standard Academic Publishers",
    publishDate: "August 2021",
    pageCount: 440,
    format: "Hardcover",
    copiesCount: 5,
    availableCopies: 5,
    location: "Level 1, Shelf 82",
    subject: "Social Sciences / Finance"
  },
  {
    title: "Sustainablity and Structural Ethics",
    author: "Sarah Van Der Meer",
    category: "Research Books",
    isbn: "978-9-01",
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80",
    description: "Examining architectural durability, engineering ethics, and raw resource footprints to frame our carbon-balanced future.",
    publisher: "Green Engineering Press",
    publishDate: "October 2019",
    pageCount: 295,
    format: "Hardcover",
    copiesCount: 4,
    availableCopies: 4,
    location: "Level 2, Shelf 33",
    subject: "Safety / Environmental Engineering"
  },
  {
    title: "Renaissance Techniques to Modern Art",
    author: "Prof. Lucas Thorne",
    category: "History",
    isbn: "978-2-19",
    imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&auto=format&fit=crop&q=80",
    description: "Mapping brushcraft, dynamic perspectives, and oil mixtures from early Italian systems to contemporary digital design paradigms.",
    publisher: "Artisan Publications",
    publishDate: "June 2016",
    pageCount: 390,
    format: "Paperback",
    copiesCount: 3,
    availableCopies: 3,
    location: "Level 3, Shelf 54",
    subject: "Fine Arts / Visual History"
  },
  {
    title: "Social Networks and Human Behavior",
    author: "Dr. Sarah Jenkins",
    category: "Research Books",
    isbn: "978-7-82",
    imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80",
    description: "Using algorithmic trackers, node clustering, and network physics to study the digital migration of cultural paradigms.",
    publisher: "Academic Research Network",
    publishDate: "February 2022",
    pageCount: 345,
    format: "Hardcover",
    copiesCount: 4,
    availableCopies: 4,
    location: "Level 2, Shelf 88",
    subject: "Social Sciences / Sociology"
  }
];

// Helper database categories
const CATEGORIES = [
  "Computer Science", "Programming", "Networking", "Cyber Security", 
  "Artificial Intelligence", "Machine Learning", "Data Science", "Mathematics", 
  "Physics", "Chemistry", "English", "Business Studies", "Accounting", 
  "Marketing", "Economics", "Literature", "History", "Biography", 
  "Novels", "Research Books"
];

// Academic keywords to generate realistic book data
const ACADEMIC_PREFIXES = ["Principles of", "Introduction to", "Advanced Foundations in", "Handbook of", "Modern Perspectives on", "Applications in", "Practical Guide to", "The Economics of", "Strategic Management of", "Research Methodologies in"];
const ACADEMIC_SUBJECTS = {
  "Computer Science": ["Distributed Databases", "Algorithms & Structures", "Compiler Designs", "Cloud Computing Networks", "Operating Ecosystems"],
  "Programming": ["Functional Typescript", "Rust Systems Logic", "Concurrent Go Channels", "Web Architecture Scalers", "Object Paradigms"],
  "Networking": ["IP Routing Protocols", "Wireless Mesh Architectures", "Fiber Telecom Channels", "DNS Grid Systems", "Network Stack Theory"],
  "Cyber Security": ["Cryptographic Ciphers", "Intrusion Interceptors", "Zero-Trust Infrastructures", "Ethical Pen Testing", "Malware Deep Dissections"],
  "Artificial Intelligence": ["Neural Network Math", "Heuristic Logic Solvers", "Cognitive Robotic Control", "NLP Parse Pipelines", "Search Grid Heuristics"],
  "Machine Learning": ["Supervised Regressions", "Deep Latent Vectors", "Reinforcement Multi-Agents", "Gradient Boost Models", "Unsupervised Clusterings"],
  "Data Science": ["Big Data Spark Systems", "Statistical Estimators", "Feature Engineering Arrays", "Time Series Models", "Data Visualization Craft"],
  "Mathematics": ["Linear Vector Matrices", "Calculus & Limits", "Abstract Ring Algebra", "Complex Variable Analyses", "Stochastic Probability Grids"],
  "Physics": ["Relativistic Electrics", "Statistical States", "Quantum Field Solutions", "Solid State Matter", "Astrophysical Grids"],
  "Chemistry": ["Polymer Synthetic Lab", "Thermodynamics of Gasses", "Quantum Molecular Orbitals", "Inorganic Reaction Webs", "Analytical Separations"],
  "English": ["Rhetoric & Logic Writing", "18th Century Poetry", "Academic Writing Syntax", "Comparative Global Proses", "Shakespearian Drama"],
  "Business Studies": ["Corporate Operations", "Global Trade Protocols", "Supply Chain Analytics", "Organizational Behaviors", "Human Capital Systems"],
  "Accounting": ["Cost Analysis Taxations", "Managerial Asset Ledger", "Audit Verification Proofs", "Corporate Balance Books", "Financial Statement Maths"],
  "Marketing": ["Digital Brand Resonance", "Consumer Choice Mindsets", "Omnichannel Ad Systems", "Market Segmentation Math", "B2B Sales Operations"],
  "Economics": ["Game Theory Matrices", "Micro Market Equilibriums", "Development Cash Flows", "Behavioral Choice Models", "Macro Fiscal Policies"],
  "Literature": ["Post-Modern Criticisms", "Epic Narrative Structures", "Creative Verse Meters", "The Victorian Novels", "Cultural Mythology Types"],
  "History": ["Roman Civil Wars", "Industrial Capital Spans", "Medieval Trade Guilds", "The East India Company", "Cold War Geopolitics"],
  "Biography": ["The Life of Alan Turing", "Feynman's Infinite curiosities", "Hamilton Legislative Architect", "Steve Jobs Tech Aesthetics", "Marie Curie Radiance"],
  "Novels": ["The Whispering Archives", "Midnight Code compilers", "Echoes of the Quadrangle", "The Silicon Catalyst", "Beyond the Horizon Lines"],
  "Research Books": ["Quantitative Sample Methods", "Scholarly Publication Standards", "Grant Proposal Frameworks", "Peer Review Ethics", "Academic Thesis Structures"]
};
const ACADEMIC_SUFFIXES = ["for Undergraduates", "and Social Realities", "with Practical Lab Labs", ": An Institutional Guide", "in Digital Eras", "& Dynamic Solvers", "for Modern Engineers", "and Analytical Case Studies"];

const AUTHORS = [
  "Dr. Timothy Miller", "Prof. Amelia Watson", "Dr. Richard Feynman", "Donald Knuth", "Dr. Grace Hopper",
  "Prof. Andrew Ng", "Dr. Linus Torvalds", "Robert C. Martin", "Martin Fowler", "Prof. Thomas Cormen",
  "Dr. Sarah Jenkins", "Elena Rossi", "Marcus Thorne", "Kenji Sato", "Lisa M. Cheng",
  "Prof. Charles Darwin", "Adam Smith", "Dr. Julian Sterling", "Sarah Van Der Meer", "Elena Rodriguez"
];

const PUBLISHERS = [
  "MIT Press", "Oxford University Press", "Cambridge Academic Press", "McGraw-Hill", "Pearson Education",
  "Wiley Scientific Systems", "O\\'Reilly Media", "Springer-Verlag", "Standard Academic Publisher"
];

export const BANGLA_BOOKS: Book[] = [
  {
    id: "bangla-1",
    title: "পথের পাঁচালী",
    author: "বিভূতিভূষণ বন্দ্যোপাধ্যায়",
    category: "Bangla",
    isbn: "978-984-01-0001",
    imageUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=80",
    description: "অপুর শৈশব ও গ্রামীণ বাংলার জীবন নিয়ে রচিত কালজয়ী উপন্যাস।",
    publisher: "সিগনেট প্রেস (Signet Press)",
    publishDate: "1929",
    pageCount: 232,
    format: "Paperback",
    copiesCount: 5,
    availableCopies: 5,
    location: "Level 5, Shelf 501 (Bangla Section)",
    edition: "1st Edition",
    subject: "Bangla Literature"
  },
  {
    id: "bangla-2",
    title: "অপরাজিত",
    author: "বিভূতিভূষণ বন্দ্যোপাধ্যায়",
    category: "Bangla",
    isbn: "978-984-01-0002",
    imageUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=80",
    description: "পথের পাঁচালীর ধারাবাহিকতায় অপুর জীবন সংগ্রামের কাহিনী।",
    publisher: "সিগনেট প্রেস (Signet Press)",
    publishDate: "1932",
    pageCount: 336,
    format: "Paperback",
    copiesCount: 5,
    availableCopies: 5,
    location: "Level 5, Shelf 501 (Bangla Section)",
    edition: "1st Edition",
    subject: "Bangla Literature"
  },
  {
    id: "bangla-3",
    title: "দেবদাস",
    author: "শরৎচন্দ্র চট্টোপাধ্যায়",
    category: "Bangla",
    isbn: "978-984-01-0003",
    imageUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=80",
    description: "প্রেম, বেদনা ও আত্মবিনাশের এক অমর উপন্যাস।",
    publisher: "ভারতী লাইব্রেরী (Bharati Library)",
    publishDate: "1917",
    pageCount: 192,
    format: "Paperback",
    copiesCount: 5,
    availableCopies: 5,
    location: "Level 5, Shelf 501 (Bangla Section)",
    edition: "1st Edition",
    subject: "Bangla Literature"
  },
  {
    id: "bangla-4",
    title: "শ্রীকান্ত",
    author: "শরৎচন্দ্র চট্টোপাধ্যায়",
    category: "Bangla",
    isbn: "978-984-01-0004",
    imageUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=80",
    description: "ভ্রমণ, বন্ধুত্ব ও জীবনের নানা অভিজ্ঞতা নিয়ে লেখা বিখ্যাত উপন্যাস।",
    publisher: "এম সি সরকার অ্যান্ড সন্স (M. C. Sarkar & Sons)",
    publishDate: "1917",
    pageCount: 680,
    format: "Paperback",
    copiesCount: 5,
    availableCopies: 5,
    location: "Level 5, Shelf 501 (Bangla Section)",
    edition: "1st Edition",
    subject: "Bangla Literature"
  },
  {
    id: "bangla-5",
    title: "লালসালু",
    author: "সৈয়দ ওয়ালীউল্লাহ",
    category: "Bangla",
    isbn: "978-984-01-0005",
    imageUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=80",
    description: "ধর্মীয় কুসংস্কার ও সমাজবাস্তবতার শক্তিশালী উপস্থাপন।",
    publisher: "নওরোজ কিতাবিস্তান (Nowroze Kitabistan)",
    publishDate: "1948",
    pageCount: 176,
    format: "Paperback",
    copiesCount: 5,
    availableCopies: 5,
    location: "Level 5, Shelf 501 (Bangla Section)",
    edition: "1st Edition",
    subject: "Bangla Literature"
  },
  {
    id: "bangla-6",
    title: "হাজার বছর ধরে",
    author: "জহির রায়হান",
    category: "Bangla",
    isbn: "978-984-01-0006",
    imageUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=80",
    description: "বাংলার গ্রামীণ সমাজ ও মানুষের জীবনচিত্র নিয়ে রচিত উপন্যাস।",
    publisher: "সন্ধানী প্রকাশনী (Sandhani Prokashoni)",
    publishDate: "1964",
    pageCount: 208,
    format: "Paperback",
    copiesCount: 5,
    availableCopies: 5,
    location: "Level 5, Shelf 502 (Bangla Section)",
    edition: "1st Edition",
    subject: "Bangla Literature"
  },
  {
    id: "bangla-7",
    title: "আগুনের পরশমণি",
    author: "হুমায়ূন আহমেদ",
    category: "Bangla",
    isbn: "978-984-01-0007",
    imageUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=80",
    description: "বাংলাদেশের মুক্তিযুদ্ধভিত্তিক জনপ্রিয় উপন্যাস।",
    publisher: "উৎস প্রকাশন (Utsho Prokashon)",
    publishDate: "1986",
    pageCount: 240,
    format: "Paperback",
    copiesCount: 5,
    availableCopies: 5,
    location: "Level 5, Shelf 502 (Bangla Section)",
    edition: "1st Edition",
    subject: "Bangla Literature"
  },
  {
    id: "bangla-8",
    title: "নন্দিত নরকে",
    author: "হুমায়ূন আহমেদ",
    category: "Bangla",
    isbn: "978-984-01-0008",
    imageUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=80",
    description: "হুমায়ূন আহমেদের প্রথম প্রকাশিত উপন্যাস।",
    publisher: "খান ব্রাদার্স (Khan Brothers)",
    publishDate: "1972",
    pageCount: 128,
    format: "Paperback",
    copiesCount: 5,
    availableCopies: 5,
    location: "Level 5, Shelf 502 (Bangla Section)",
    edition: "1st Edition",
    subject: "Bangla Literature"
  },
  {
    id: "bangla-9",
    title: "কবি",
    author: "তারাশঙ্কর বন্দ্যোপাধ্যায়",
    category: "Bangla",
    isbn: "978-984-01-0009",
    imageUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=80",
    description: "গ্রামীণ বাংলার সংস্কৃতি ও মানুষের জীবন নিয়ে লেখা বিখ্যাত উপন্যাস।",
    publisher: "ডি এম লাইব্রেরী (D. M. Library)",
    publishDate: "1944",
    pageCount: 256,
    format: "Paperback",
    copiesCount: 5,
    availableCopies: 5,
    location: "Level 5, Shelf 501 (Bangla Section)",
    edition: "1st Edition",
    subject: "Bangla Literature"
  },
  {
    id: "bangla-10",
    title: "পদ্মা নদীর মাঝি",
    author: "মানিক বন্দ্যোপাধ্যায়",
    category: "Bangla",
    isbn: "978-984-01-0010",
    imageUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=80",
    description: "জেলে সম্প্রদায়ের জীবন ও সংগ্রামের এক অনন্য সাহিত্যকর্ম।",
    publisher: "কপিরাইট হোল্ডার (Copyright Holder)",
    publishDate: "1936",
    pageCount: 224,
    format: "Paperback",
    copiesCount: 5,
    availableCopies: 5,
    location: "Level 5, Shelf 501 (Bangla Section)",
    edition: "1st Edition",
    subject: "Bangla Literature"
  }
];

export function generate1000Books(): Book[] {
  try {
    const booksJsonPath = path.join(process.cwd(), 'src', 'books.json');
    if (fs.existsSync(booksJsonPath)) {
      const content = fs.readFileSync(booksJsonPath, 'utf-8');
      return JSON.parse(content) as Book[];
    }
  } catch (err) {
    console.error("Error reading books.json in generate1000Books:", err);
  }
  // Fallback to CORE_BOOKS + BANGLA_BOOKS so the app always has books!
  const mappedCore: Book[] = CORE_BOOKS.map((b, i) => ({
    ...b,
    id: `book-${i + 1}`
  })) as Book[];
  return [...mappedCore, ...BANGLA_BOOKS];
}

export interface LibraryDB {
  books: Book[];
  students: { [roll: string]: Student & { password?: string } };
  borrows: BorrowRecord[];
  fines: Fine[];
  notifications: Notification[];
}

export function generate400Students(): { [roll: string]: Student & { password?: string } } {
  const students: { [roll: string]: Student & { password?: string } } = {};
  try {
    const filePath = path.join(process.cwd(), 'src', 'students_400.json');
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);
      if (Array.isArray(data)) {
        data.forEach(item => {
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
        console.log(`Successfully mapped ${data.length} students from students_400.json`);
        return students;
      }
    } else {
      console.error(`students_400.json not found at ${filePath}`);
    }
  } catch (err) {
    console.error("Error reading students_400.json in generate400Students:", err);
  }
  return students;
}

export function initializeDB(): LibraryDB {
  if (fs.existsSync(DB_PATH)) {
    try {
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      const loaded = JSON.parse(content);
      
      let changed = false;
      // Upgrade checks: Ensure all models are present
      if (!loaded.books || loaded.books.length < 50) {
        loaded.books = generate1000Books();
        changed = true;
      }
      if (!loaded.students || Object.keys(loaded.students).length < 50) {
        loaded.students = generate400Students();
        changed = true;
      }
      if (!loaded.borrows) {
        loaded.borrows = [];
        changed = true;
      }
      if (!loaded.fines) {
        loaded.fines = [];
        changed = true;
      }
      if (!loaded.notifications) {
        loaded.notifications = [];
        changed = true;
      }
      
      if (changed) {
        saveDB(loaded);
      }
      return loaded;
    } catch (e) {
      console.error("Error reading database.json. Reinitializing...", e);
    }
  }

  const generatedBooks = generate1000Books();
  
  // Seed the 400 deterministic students
  const seededStudents = generate400Students();

  // Seed sample transactions to match Image 3 and Dashboard states
  const now = new Date();
  
  // James Stevenson has borrowed Advanced Organic Chemistry (represented by ID book-14 / isbn 978-4-12)
  const borrow1Id = "borrow-seed-1";
  const bDate = new Date();
  bDate.setDate(now.getDate() - 10);
  const dDate = new Date();
  dDate.setDate(bDate.getDate() + 7); // late by 3 days!

  const seededBorrows: BorrowRecord[] = [
    {
      id: borrow1Id,
      bookId: "book-14", // Advanced Organic Chemistry
      bookTitle: "Advanced Organic Chemistry",
      bookImage: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=600&auto=format&fit=crop&q=80",
      studentRoll: "CSE-4-045",
      studentName: "James Stevenson",
      borrowDate: bDate.toISOString(),
      durationDays: 7,
      dueDate: dDate.toISOString(),
      status: "BORROWED",
      fineAmount: 20 // 3 days overdue => 20 BDT
    }
  ];

  // Seed notification
  const seededNotifications: Notification[] = [
    {
      id: "notif-seed-1",
      studentRoll: "CSE-4-045",
      title: "Overdue Book Alert",
      message: "The book \"Advanced Organic Chemistry\" was due on " + dDate.toLocaleDateString() + ". A BDT 20 fine has been charged.",
      createdAt: now.toISOString(),
      isRead: false,
      type: "OVERDUE"
    },
    {
      id: "notif-seed-2",
      studentRoll: "", // general
      title: "Exam Week Hours Extended",
      message: "The Library physical stack will remain open until 11:30 PM until July 15th to support your final exam preparations.",
      createdAt: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
      isRead: false,
      type: "INFO"
    }
  ];

  const db: LibraryDB = {
    books: generatedBooks,
    students: seededStudents,
    borrows: seededBorrows,
    fines: [],
    notifications: seededNotifications
  };

  saveDB(db);
  return db;
}

export function saveDB(db: LibraryDB) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error("Error saving database.json:", e);
  }
}
