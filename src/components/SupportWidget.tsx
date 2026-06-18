import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  X, 
  User, 
  Mail, 
  Loader2, 
  CheckCircle2
} from 'lucide-react';
import { Student, BrandingConfig } from '../types';

interface SupportWidgetProps {
  student: Student | null;
}

export default function SupportWidget({ student }: SupportWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [branding, setBranding] = useState<BrandingConfig | null>(null);
  
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

  // Submit support ticket to backend
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSuccessText('');
    setContactErrorText('');

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
        setContactErrorText(data.error || 'দুঃখিত, বার্তাটি পাঠানো সম্ভব হয়নি।');
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
            className="absolute bottom-16 right-0 w-[92vw] sm:w-[410px] h-[525px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1E40AF] to-slate-900 px-5 py-4 pb-5 text-white flex items-center justify-between shadow-md shrink-0">
              <div>
                <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5 leading-none">
                  📩 লাইব্রেরিয়ান যোগাযোগ কেন্দ্র
                </h3>
                <p className="text-[10px] text-slate-350 mt-0.5">
                  সরাসরি অভিযোগ, বইয়ের রিকোয়েস্ট বা পরামর্শ বার্তা পাঠান
                </p>
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
              <div className="flex-1 overflow-y-auto p-5 bg-white">
                
                {contactSuccessText ? (
                  <div className="py-12 px-4 text-center space-y-4">
                    <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8 text-emerald-650" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-855">আপনার বার্তাটি জমা হয়েছে!</h4>
                    <p className="text-xs text-slate-505 leading-relaxed max-w-[280px] mx-auto">
                      {contactSuccessText} লাইব্রেরিয়ান টিম রিকোয়েস্ট চেক করে আপনার ইমেইল ঠিকানায় আপডেট প্রদান করবেন।
                    </p>
                    <button
                      onClick={() => setContactSuccessText('')}
                      className="bg-slate-100 text-slate-705 font-bold text-xs px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-200 cursor-pointer"
                    >
                      নতুন বার্তা লিখুন
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4 text-left">
                    {/* Section alert about Auth */}
                    <div className="text-[10px] p-2.5 rounded-xl border border-blue-105 bg-blue-50/50 text-blue-800 leading-normal flex items-start gap-2">
                      {student ? (
                        <span>
                          <strong>প্রোফাইল একটিভ:</strong> আপনার রোল ({student.rollNumber}) ও তথ্যসমূহ স্বয়ংক্রিয়ভাবে মেসেজের সাথে সংযুক্ত করা হয়েছে।
                        </span>
                      ) : (
                        <span>
                          <strong>গেস্ট মোড:</strong> আপনি প্রাতিষ্ঠানিক অ্যাকাউন্ট ছাড়াই লাইব্রেরিয়ানের কাছে সরাসরি মেসেজ পাঠাতে পারছেন। অনুগ্রহ করে আবশ্যক ইনফো প্রদান করুন।
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
                            onChange={(e) => setContactName(e.target.value)}
                            disabled={!!student}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 disabled:opacity-60 focus:outline-none"
                            placeholder="আপনার নাম"
                          />
                        </div>

                        {/* Email - Required */}
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1 select-none">
                            <Mail className="w-3 h-3" /> ইমেইল <span className="text-red-500">*</span>
                          </label>
                          <input 
                            type="text"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            disabled={!!student}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 disabled:opacity-60 focus:outline-none"
                            placeholder="name@domain.com"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Subject */}
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 select-none">
                            বিষয় <span className="text-slate-400 font-normal">(ঐচ্ছিক)</span>
                          </label>
                          <input 
                            type="text"
                            value={contactSubject}
                            onChange={(e) => setContactSubject(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            placeholder="যেমন: বইয়ের রিকোয়েস্ট"
                          />
                        </div>

                        {/* Roll Number */}
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 select-none">
                            রোল নম্বর <span className="text-slate-400 font-normal">(ঐচ্ছিক)</span>
                          </label>
                          <input 
                            type="text"
                            value={contactRoll}
                            onChange={(e) => setContactRoll(e.target.value)}
                            disabled={!!student}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 disabled:opacity-60 focus:outline-none"
                            placeholder="রোল নম্বর লিখুন"
                          />
                        </div>
                      </div>

                      {/* Message body */}
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-505 mb-1 select-none">
                          আপনার বার্তা ভদ্রভাবে লিখুন <span className="text-red-500">*</span>
                        </label>
                        <textarea 
                          rows={4}
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:ring-1 focus:ring-blue-500 resize-none focus:outline-none"
                          placeholder="আপনার অভিযোগ, প্রশ্ন বা বইয়ের রিকোয়েস্টটি বিস্তারিতভাবে লিখুন..."
                        />
                      </div>
                    </div>

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
