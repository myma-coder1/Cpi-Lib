import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Send, 
  X, 
  ChevronLeft, 
  User, 
  Mail, 
  BookOpen, 
  Clock, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  Building2, 
  Phone,
  Layers,
  GraduationCap
} from 'lucide-react';
import { Student, BrandingConfig } from '../types';

interface SupportWidgetProps {
  student: Student | null;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function SupportWidget({ student }: SupportWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'options' | 'chat' | 'contact'>('options');
  const [branding, setBranding] = useState<BrandingConfig | null>(null);
  
  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Contact Librarian Form State
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactRoll, setContactRoll] = useState('');
  const [contactReg, setContactReg] = useState('');
  const [contactDept, setContactDept] = useState('');
  const [contactSem, setContactSem] = useState('');
  
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactSuccessText, setContactSuccessText] = useState('');
  const [contactErrorText, setContactErrorText] = useState('');

  // Fetch Institutional Branding on mount
  useEffect(() => {
    fetch('/api/branding')
      .then(res => res.json())
      .then(data => setBranding(data))
      .catch(err => console.error("Error loading branding in support widget", err));
  }, []);

  // Set default guest field values if user is logged in
  useEffect(() => {
    if (student) {
      setContactName(student.name || '');
      setContactEmail(student.email || '');
      setContactRoll(student.rollNumber || '');
      setContactReg(student.registration || '');
      setContactDept(student.department || '');
      setContactSem(student.semester ? String(student.semester) : '');
    } else {
      // Clear fields on sign out
      setContactName('');
      setContactEmail('');
      setContactRoll('');
      setContactReg('');
      setContactDept('');
      setContactSem('');
    }
  }, [student]);

  // Welcome Chat Initialization
  useEffect(() => {
    if (chatMessages.length === 0) {
      setChatMessages([
        {
          id: 'welcome-msg',
          text: `স্বাগতম! আমি "ScholarBot", আপনার স্মার্ট লাইব্রেরি AI অ্যাসিস্ট্যান্ট। 😊\n\nলাইব্রেরির বই সংখ্যা, অবস্থান, বই ধার নেওয়ার নীতিমালা বা জরিমানা সংক্রান্ত যেকোনো তথ্য সরাসরি এখানে লিখে জিজ্ঞাসা করতে পারেন।`,
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
    }
  }, []);

  // Auto Scroll Chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isBotTyping]);

  // Send message to AI endpoint
  const sendChatMessage = async (msgText: string) => {
    if (!msgText.trim()) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      text: msgText,
      sender: 'user',
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsBotTyping(true);

    try {
      // Structure historical conversations for Gemini
      const historyPayload = chatMessages
        .filter(m => m.id !== 'welcome-msg')
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          text: m.text
        }));

      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: msgText,
          history: historyPayload
        })
      });

      const data = await res.json();
      
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        text: data.text || "দুঃখিত, কোনো উত্তর পাওয়া যায়নি। দয়া করে আবার চেষ্টা করুন।",
        sender: 'bot',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        text: "ডিজিটাল সার্ভার সংযোগ বিচ্ছিন্ন হয়েছে। দয়া করে কয়েক সেকেন্ড পরে পুনরায় চেষ্টা করুন।",
        sender: 'bot',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errMsg]);
    } finally {
      setIsBotTyping(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    sendChatMessage(question);
  };

  // Submit support ticket to backend
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSuccessText('');
    setContactErrorText('');

    // Field Validations based on type (Logged-In vs Guest Requirements)
    if (!contactName.trim()) {
      setContactErrorText('অনুগ্রহ করে আপনার নাম প্রদান করুন।');
      return;
    }
    if (!contactEmail.trim() || !contactEmail.includes('@')) {
      setContactErrorText('একটি সঠিক ইমেইল ঠিকানা প্রদান করুন।');
      return;
    }
    if (!contactMessage.trim()) {
      setContactErrorText('বার্তাটি খালি হতে পারবে না!');
      return;
    }

    setIsSubmittingContact(true);

    try {
      const res = await fetch('/api/support/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: contactName.trim(),
          email: contactEmail.trim(),
          rollNumber: contactRoll.trim(),
          registration: contactReg.trim(),
          department: contactDept.trim(),
          semester: contactSem ? Number(contactSem) : undefined,
          subject: contactSubject.trim() || 'Librarian Support',
          message: contactMessage.trim()
        })
      });

      const data = await res.json();

      if (res.ok) {
        setContactSuccessText(data.message || 'আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে!');
        setContactSubject('');
        setContactMessage('');
        
        // Clear guest optional inputs
        if (!student) {
          setContactName('');
          setContactEmail('');
          setContactRoll('');
          setContactReg('');
          setContactDept('');
          setContactSem('');
        }
      } else {
        setContactErrorText(data.error || 'ক্ষঃখিত, বার্তাটি পাঠানো সম্ভব হয়নি।');
      }
    } catch (err) {
      console.error(err);
      setContactErrorText('নেটওয়ার্ক সমস্যার সম্ভাবনা রয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsSubmittingContact(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans" id="floating-support-center">
      {/* Choice / Window Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute bottom-16 right-0 w-[92vw] sm:w-[410px] h-[550px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1E40AF] to-slate-900 px-5 py-4 pb-5 text-white flex items-center justify-between shadow-md shrink-0">
              <div className="flex items-center gap-2.5">
                {view !== 'options' && (
                  <button 
                    onClick={() => { setView('options'); setContactSuccessText(''); setContactErrorText(''); }}
                    className="p-1 rounded-lg hover:bg-white/10 transition-colors text-slate-250 cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                )}
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5 leading-none">
                    {view === 'options' && (
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-blue-300 animate-pulse" />
                        সহায়তা কেন্দ্র (Scholar Help Desk)
                      </span>
                    )}
                    {view === 'chat' && (
                      <span className="flex items-center gap-1.5 text-blue-105">
                        <Sparkles className="w-4 h-4 text-blue-300 animate-pulse" />
                        ScholarBot AI এসিস্ট্যান্ট
                      </span>
                    )}
                    {view === 'contact' && '📩 লাইব্রেরিয়ানকে মেসেজ দিন'}
                  </h3>
                  <p className="text-[10px] text-slate-300 mt-0.5">
                    {view === 'options' && 'ডিজিটাল সহায়তা ও কন্টাক্ট পোর্টাল'}
                    {view === 'chat' && 'রিয়েল-টাইম এআই লাইব্রেরি গাইড'}
                    {view === 'contact' && 'সরাসরি অভিযোগ বা পরামর্শ বার্তা পাঠান'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50 flex flex-col">
              
              {/* Option 1: Option Menu */}
              {view === 'options' && (
                <div className="p-6 space-y-6 flex-1 flex flex-col justify-center animate-fade-in">
                  <div className="text-center mb-4">
                    <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                      <Sparkles className="w-7 h-7 text-[#1E40AF]" />
                    </div>
                    <h4 className="font-semibold text-slate-800 text-sm">আপনাকে কীভাবে সাহায্য করতে পারি?</h4>
                    <p className="text-xs text-slate-500 mt-1 px-4 leading-relaxed">
                      লাইব্রেরির যেকোনো প্রশ্ন এআই-এর মাধ্যমে জেনে নিন অথবা কন্টাক্ট ফরম পূরণ করে সাহায্য পান।
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Option 1 Button */}
                    <button
                      onClick={() => setView('chat')}
                      className="w-full text-left bg-white border border-slate-205 rounded-2xl p-4 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all flex items-start gap-4 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-bold text-slate-855 text-xs tracking-tight">💬 AI চ্যাট অ্যাসিস্ট্যান্ট (Smart AI Chat)</h5>
                        <p className="text-[10px] text-slate-450 mt-0.5 leading-relaxed">
                          বইয়ের তালিকা, গাইডলাইন, ফিজিক্যাল কপির প্রাপ্যতা ও রুলস নিয়ে অবিলম্বে জিজ্ঞাসা করুন।
                        </p>
                      </div>
                    </button>

                    {/* Option 2 Button */}
                    <button
                      onClick={() => setView('contact')}
                      className="w-full text-left bg-white border border-slate-205 rounded-2xl p-4 hover:border-emerald-400 hover:shadow-md cursor-pointer transition-all flex items-start gap-4 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-bold text-slate-855 text-xs tracking-tight">📩 লাইব্রেরিয়ান যোগাযোগ কেন্দ্র (Contact Librarian)</h5>
                        <p className="text-[10px] text-slate-450 mt-0.5 leading-relaxed">
                          বই রিলিজ, কার্ড লক, ফাইন মওকুফ বা স্পেশাল রিসোর্স রিকোয়েস্টের জন্য মেল করুন।
                        </p>
                      </div>
                    </button>
                  </div>

                  <div className="text-center pt-4 border-t border-slate-100 mt-4 font-mono text-[9px] text-slate-400">
                    {branding?.libraryName || 'Academic Library System'} &bull; Digital Support Panel
                  </div>
                </div>
              )}

              {/* Option 2: Active AI Chat Assistant */}
              {view === 'chat' && (
                <div className="flex-1 flex flex-col min-h-0 bg-white animate-fade-in">
                  
                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-start gap-2.5 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                          {/* Avatar */}
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] select-none shrink-0 font-bold ${msg.sender === 'user' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-[#1E40AF]'}`}>
                            {msg.sender === 'user' ? 'ME' : 'AI'}
                          </div>
                          
                          {/* Bubble text */}
                          <div>
                            <div className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-line shadow-xs ${
                              msg.sender === 'user' 
                                ? 'bg-[#1E40AF] text-white rounded-tr-none text-left' 
                                : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-150 text-left'
                            }`}>
                              {msg.text}
                            </div>
                            <span className="block text-[8px] text-slate-400 mt-1 px-1 font-mono">
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Bot Typing indicator */}
                    {isBotTyping && (
                      <div className="flex justify-start">
                        <div className="flex items-start gap-2.5 max-w-[85%]">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 text-[#1E40AF] flex items-center justify-center text-[10px] shrink-0 font-bold animate-pulse">
                            AI
                          </div>
                          <div className="bg-slate-100 text-slate-700 border border-slate-150 p-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Suggested Question Pills (Static on bottom of message history) */}
                  {chatMessages.length < 5 && (
                    <div className="px-4 pb-2 pt-1 border-t border-slate-50 bg-slate-50/40 shrink-0">
                      <p className="text-[9px] text-slate-500 font-bold mb-1.5 flex items-center gap-1 select-none">
                        <Sparkles className="w-3 h-3 text-blue-500" /> সচরাচর জিজ্ঞাসিত প্রশ্ন (Suggested Topics):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "লাইব্রেরিতে মোট কতটি বই আছে?",
                          "Padma Nodir Majhi আছে কি?",
                          "লাইব্রেরির সময়সূচি কী?",
                          "লাইব্রেরিয়ান এর ফোন নম্বর দিন",
                          "কীভাবে বই ধার নিবো?"
                        ].map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestedQuestion(q)}
                            className="text-[10px] text-left bg-white text-[#1E40AF] border border-blue-150/80 rounded-full px-2.5 py-1 hover:bg-blue-50 transition-colors cursor-pointer whitespace-nowrap leading-tight"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chat Input form footer */}
                  <form 
                    onSubmit={(e) => { e.preventDefault(); sendChatMessage(chatInput); }}
                    className="p-3 border-t border-slate-150 bg-slate-50/50 flex gap-2 shrink-0"
                  >
                    <input 
                      type="text"
                      placeholder="এখানে প্রশ্ন টাইপ করুন..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={isBotTyping}
                      className="flex-1 bg-white border border-slate-205 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-105"
                    />
                    <button
                      type="submit"
                      disabled={isBotTyping || !chatInput.trim()}
                      className="bg-[#1E40AF] text-white p-2.5 rounded-xl hover:bg-blue-800 disabled:opacity-40 transition-all font-bold text-xs shrink-0 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* Option 3: Contact Support Tickets form */}
              {view === 'contact' && (
                <div className="flex-1 overflow-y-auto p-5 animate-fade-in bg-white">
                  
                  {contactSuccessText ? (
                    <div className="py-12 px-4 text-center space-y-4">
                      <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8 text-emerald-650" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-850">আপনার রিকোয়েস্ট জমা হয়েছে!</h4>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-[280px] mx-auto">
                        {contactSuccessText} লাইব্রেরিয়ান টিম ডাটাবেজ ইনকোয়ারি রিভিউ করে শীঘ্রই ইমেইল কন্টাক্ট এড্রেসে আপডেট প্রদান করবেন।
                      </p>
                      <button
                        onClick={() => { setView('options'); setContactSuccessText(''); }}
                        className="bg-slate-100 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-200 cursor-pointer"
                      >
                        ফিরে যান (Back to Menu)
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-4 text-left">
                      {/* Section alert about Auth */}
                      <div className="text-[10px] p-2.5 rounded-xl border border-blue-100 bg-blue-50/50 text-blue-800 leading-normal flex items-start gap-2">
                        {student ? (
                          <span>
                            <strong>লগইন স্ট্যাটাস active:</strong> আপনার শিক্ষার্থী প্রোফাইল থেকে প্রাতিষ্ঠানিক তথ্য এবং ডিটেইলস (Rol, Reg, Dept) স্বয়ংক্রিয়ভাবে ম্যাপ করা হয়েছে।
                          </span>
                        ) : (
                          <span>
                            <strong>গেস্ট মুড active:</strong> আপনি প্রাতিষ্ঠানিক অ্যাকাউন্ট ছাড়াই লাইব্রেরিয়ানের কাছে সরাসরি মেসেজ পাঠাতে পারছেন। অনুগ্রহ করে আবশ্যক ইনফো প্রদান করুন।
                          </span>
                        )}
                      </div>

                      {contactErrorText && (
                        <div className="text-[10px] text-red-650 border border-red-150 p-2.5 rounded-xl bg-red-50">
                          ✕ {contactErrorText}
                        </div>
                      )}

                      {/* Info Inputs fields */}
                      <div className="space-y-3.5">
                        <div className="grid grid-cols-2 gap-3">
                          {/* Name - Required */}
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1 select-none">
                              <User className="w-3 h-3" /> নাম <span className="text-red-500">*</span>
                            </label>
                            <input 
                              type="text"
                              value={contactName}
                              onChange={e => setContactName(e.target.value)}
                              disabled={!!student}
                              placeholder="আপনার নাম লিখুন"
                              className="w-full text-xs font-medium border border-slate-205 rounded-xl px-3 py-2 bg-slate-50/30 font-sans focus:outline-none focus:ring-2 focus:ring-blue-105 disabled:bg-slate-100/70 disabled:text-slate-500"
                            />
                          </div>

                          {/* Email - Required */}
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1 select-none">
                              <Mail className="w-3 h-3" /> ইমেইল <span className="text-red-500">*</span>
                            </label>
                            <input 
                              type="email"
                              value={contactEmail}
                              onChange={e => setContactEmail(e.target.value)}
                              disabled={!!student}
                              placeholder="example@mail.com"
                              className="w-full text-xs font-medium border border-slate-205 rounded-xl px-3 py-2 bg-slate-50/30 font-sans focus:outline-none focus:ring-2 focus:ring-blue-105 disabled:bg-slate-100/70 disabled:text-slate-500"
                            />
                          </div>
                        </div>

                        {/* Roll & Reg: Optional for Guest, prefilled for Student */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1 select-none">
                              <Layers className="w-3 h-3" /> রোল {!student && <span className="text-slate-400 font-normal">(ঐচ্ছিক)</span>}
                            </label>
                            <input 
                              type="text"
                              value={contactRoll}
                              onChange={e => setContactRoll(e.target.value)}
                              disabled={!!student}
                              placeholder="যেমন: CSE-4-045"
                              className="w-full text-xs font-medium border border-slate-205 rounded-xl px-3 py-2 bg-slate-50/30 font-sans focus:outline-none focus:ring-2 focus:ring-blue-105 disabled:bg-slate-100/70 disabled:text-slate-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1 select-none">
                              <BookOpen className="w-3 h-3" /> রেজিস্ট্রেশন {!student && <span className="text-slate-400 font-normal">(ঐচ্ছিক)</span>}
                            </label>
                            <input 
                              type="text"
                              value={contactReg}
                              onChange={e => setContactReg(e.target.value)}
                              disabled={!!student}
                              placeholder="যেমন: ১৫১২৩৪৫"
                              className="w-full text-xs font-medium border border-slate-205 rounded-xl px-3 py-2 bg-slate-50/30 font-sans focus:outline-none focus:ring-2 focus:ring-blue-105 disabled:bg-slate-100/70 disabled:text-slate-500"
                            />
                          </div>
                        </div>

                        {/* Dept & Semester: Optional for Guest, prefilled for Student */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1 select-none">
                              <Building2 className="w-3 h-3" /> ডিপার্টমেন্ট {!student && <span className="text-slate-400 font-normal">(ঐচ্ছিক)</span>}
                            </label>
                            <input 
                              type="text"
                              value={contactDept}
                              onChange={e => setContactDept(e.target.value)}
                              disabled={!!student}
                              placeholder="যেমন: CSE"
                              className="w-full text-xs font-medium border border-slate-205 rounded-xl px-3 py-2 bg-slate-50/30 font-sans focus:outline-none focus:ring-2 focus:ring-blue-105 disabled:bg-slate-100/70 disabled:text-slate-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1 select-none">
                              <GraduationCap className="w-3 h-3" /> সেমিস্টার {!student && <span className="text-slate-400 font-normal">(ঐচ্ছিক)</span>}
                            </label>
                            <input 
                              type="number"
                              min="1"
                              max="8"
                              value={contactSem}
                              onChange={e => setContactSem(e.target.value)}
                              disabled={!!student}
                              placeholder="যেমন: ৪"
                              className="w-full text-xs font-medium border border-slate-205 rounded-xl px-3 py-2 bg-slate-50/30 font-sans focus:outline-none focus:ring-2 focus:ring-blue-105 disabled:bg-slate-100/70 disabled:text-slate-500"
                            />
                          </div>
                        </div>

                        {/* Subject */}
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 select-none">
                            বিষয় (Subject) <span className="text-slate-400 font-normal">(ঐচ্ছিক)</span>
                          </label>
                          <input 
                            type="text"
                            value={contactSubject}
                            onChange={e => setContactSubject(e.target.value)}
                            placeholder="বার্তার বিষয় (যেমন: বই ধার জটিলতা)"
                            className="w-full text-xs font-medium border border-slate-205 rounded-xl px-3 py-2 bg-slate-50/30 font-sans focus:outline-none focus:ring-2 focus:ring-blue-105"
                          />
                        </div>

                        {/* Message - Required */}
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 select-none">
                            আপনার বার্তা (Message) <span className="text-red-500">*</span>
                          </label>
                          <textarea 
                            value={contactMessage}
                            onChange={e => setContactMessage(e.target.value)}
                            rows={3}
                            placeholder="এখানে বিস্তারিত লিখুন..."
                            className="w-full text-xs font-medium border border-slate-205 rounded-xl px-3 py-2 bg-slate-50/30 font-sans focus:outline-none focus:ring-2 focus:ring-blue-105 resize-none"
                          />
                        </div>
                      </div>

                      {/* Submit button */}
                      <button
                        type="submit"
                        disabled={isSubmittingContact}
                        className="w-full bg-[#1E40AF] text-white py-2.5 rounded-xl font-bold text-xs hover:bg-blue-800 transition-all font-sans cursor-pointer flex items-center justify-center gap-2 mt-4 select-none disabled:opacity-50"
                      >
                        {isSubmittingContact ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            ডাটাবেজে সাবমিট করা হচ্ছে...
                          </>
                        ) : 'পাঠিয়ে দিন (Submit Message)'}
                      </button>
                    </form>
                  )}
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Launcher Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-gradient-to-tr from-[#1E40AF] to-slate-900 text-white rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all cursor-pointer border border-[#2563EB]/40 select-none relative group"
        id="floating-support-btn"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close-icon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="chat-icon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <MessageSquare className="w-6 h-6 text-white" />
              <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-550 border-2 border-white rounded-full animate-bounce" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
