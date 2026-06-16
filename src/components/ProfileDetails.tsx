import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Award, Camera, ShieldCheck, Download, AlertCircle, KeyRound, RefreshCw, Sparkles, FolderSync } from 'lucide-react';
import { Student } from '../types.js';
import { jsPDF } from 'jspdf';

interface ProfileDetailsProps {
  user: Student;
  onUpdateUser: (updatedUser: Student) => void;
  setCurrentView: (view: string) => void;
}

function getCourseName(dept: string): string {
  switch (dept?.toUpperCase()) {
    case 'CSE': return 'Diploma in Computer';
    case 'EEE': return 'Diploma in Electrical';
    case 'CE': return 'Diploma in Civil';
    case 'BBA': return 'Diploma in Business Admin';
    case 'ENG': return 'Diploma in Mechanical';
    default: return `Diploma in ${dept || 'Engineering'}`;
  }
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
];

export default function ProfileDetails({ user, onUpdateUser, setCurrentView }: ProfileDetailsProps) {
  // Profile Form States
  const [name, setName] = useState(user.name || '');
  const [rollNumber, setRollNumber] = useState(user.rollNumber || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [department, setDepartment] = useState(user.department || 'CSE');
  const [session, setSession] = useState(user.session || 'Fall-2026');
  const [address, setAddress] = useState(user.address || '');
  const [photoUrl, setPhotoUrl] = useState(user.photoUrl || DEFAULT_AVATARS[0]);

  // Pass change states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Status states
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');
  
  // Handle local photo converting to Base64 with compression
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setSaveError('File is too large. Please select a photo smaller than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      
      // Compress Base64 image using an HTML Canvas to keep Firestore payloads light
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
          setPhotoUrl(compressedBase64);
          setSaveSuccess('Photo loaded! Remember to click "Save Profile Changes" to write to the system database.');
        }
      };
    };
    reader.readAsDataURL(file);
  };

  // Perform full profile PUT save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveSuccess('');
    setSaveError('');

    if (!name.trim()) {
      setSaveError('Full Name is required.');
      setSaveLoading(false);
      return;
    }

    if (!rollNumber.trim()) {
      setSaveError('Student Roll Number is required.');
      setSaveLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/students/${user.rollNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          rollNumber: rollNumber.trim().toUpperCase(),
          email: email.trim(),
          phone: phone.trim(),
          department: department,
          session: session.trim(),
          address: address.trim(),
          photoUrl: photoUrl
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSaveSuccess('Profile updated successfully and synchronized to backend database!');
        onUpdateUser(data.student);
      } else {
        setSaveError(data.error || 'Failed to update student profile.');
      }
    } catch (err: any) {
      setSaveError('Network error syncing profile fields.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Perform password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassLoading(true);
    setPassSuccess('');
    setPassError('');

    if (newPassword.length < 4) {
      setPassError('Password must be at least 4 characters long.');
      setPassLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('Passwords do not match.');
      setPassLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/students/${user.rollNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        setPassSuccess('Account password updated successfully reference database!');
        setNewPassword('');
        setConfirmPassword('');
        onUpdateUser(data.student);
      } else {
        setPassError(data.error || 'Failed to update password.');
      }
    } catch (err) {
      setPassError('Network error updating password.');
    } finally {
      setPassLoading(false);
    }
  };

  // Programmatic PDF library card download callback
  const downloadLibraryCardPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [120, 80]
    });

    const primaryBlue = [19, 56, 138];
    const accentBlack = [0, 0, 0];
    const lightBg = [255, 255, 255];

    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.rect(0, 0, 120, 80, 'F');

    doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.rect(0, 0, 55, 4.5, 'F');
    doc.triangle(55, 0, 63, 0, 55, 4.5, 'F');

    doc.setFillColor(accentBlack[0], accentBlack[1], accentBlack[2]);
    doc.rect(0, 4.5, 120, 0.8, 'F');

    doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.rect(65, 75.5, 55, 4.5, 'F');
    doc.triangle(65, 80, 65, 75.5, 57, 80, 'F');

    doc.setFillColor(accentBlack[0], accentBlack[1], accentBlack[2]);
    doc.rect(0, 74.7, 120, 0.8, 'F');

    doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('CHATTOGRAM POLYTECHNIC INSTITUTE', 60, 11, { align: 'center' });
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Nasirabad, Chattogram', 60, 14.5, { align: 'center' });

    doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.rect(48, 17.5, 24, 4.2, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('ID CARD', 60, 20.6, { align: 'center' });

    const photoWidth = 22;
    const photoHeight = 26.5;
    const px = 8;
    const py = 25.5;
    
    doc.setFillColor(243, 244, 246);
    doc.rect(px, py, photoWidth, photoHeight, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(px, py, photoWidth, photoHeight, 'S');

    try {
      doc.addImage(photoUrl, 'JPEG', px, py, photoWidth, photoHeight);
    } catch (e) {
      doc.setDrawColor(150, 150, 150);
      doc.line(px + 3, py + 3, px + photoWidth - 3, py + photoHeight - 3);
      doc.line(px + photoWidth - 3, py + 3, px + 3, py + photoHeight - 3);
    }

    doc.setFillColor(0, 0, 0);
    const barcodeX = 8;
    const barcodeY = 54.5;
    const barcodeHeight = 7.5;
    const pattern = [1, 3, 1, 2, 1, 4, 1, 2, 1, 3, 1, 2, 1, 3, 1];
    let currentX = barcodeX;
    for (let i = 0; i < pattern.length; i++) {
      const w = pattern[i] * 0.4;
      if (i % 2 === 0) {
        doc.rect(currentX, barcodeY, w, barcodeHeight, 'F');
      }
      currentX += w + 0.3;
    }

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(30, 41, 59);
    doc.text(rollNumber, 19, 64.5, { align: 'center' });

    const tx = 37;
    const valX = 54;
    const ty = 29;
    const step = 5.2;

    const fields = [
      { label: 'ID NO', value: rollNumber },
      { label: 'Name', value: name },
      { label: 'Roll', value: rollNumber },
      { label: 'Reg', value: `SL-${rollNumber.replace(/[^a-zA-Z0-9]/g, '')}` },
      { label: 'Course', value: getCourseName(department) },
      { label: 'Phone', value: phone || '+880 1234 56987' }
    ];

    fields.forEach((f, idx) => {
      const yPos = ty + idx * step;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(f.label, tx, yPos);
      doc.text(':', valX - 2, yPos);

      doc.setTextColor(15, 23, 42);
      if (f.label === 'Name' || f.label === 'Course') {
        doc.setFont('Helvetica', 'bold');
      } else {
        doc.setFont('Helvetica', 'normal');
      }
      const valStr = String(f.value || '');
      const maxLen = f.label === 'Name' ? 26 : 22;
      const dispVal = valStr.length > maxLen ? valStr.substring(0, maxLen) + '..' : valStr;
      doc.text(dispVal, valX, yPos);
    });

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.rect(0, 0, 120, 80, 'S');

    doc.save(`cpi_id_card_${rollNumber.toLowerCase()}.pdf`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans animate-fade-in text-left select-none" id="profile-container">
      
      {/* Page Header Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-905 tracking-tight flex items-center gap-2">
            <User className="w-7 h-7 text-[#1E40AF] shrink-0" />
            <span>প্রোফাইল বিবরণী ও লাইব্রেরি কার্ড (Profile Details)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
            ব্যবস্থাপনা হিসাব সংশোধন করুন এবং প্রিন্টার-বান্ধব ডিজিটাল লাইব্রেরি আইডি কার্ড সংরক্ষণ করুন।
          </p>
        </div>
        <button 
          onClick={() => setCurrentView('dashboard')}
          className="text-xs font-bold leading-none bg-slate-900 hover:bg-slate-800 text-white px-4 h-11 flex items-center justify-center transition-colors cursor-pointer rounded-xl uppercase tracking-wider shadow-xs"
          id="back-to-dashboard"
        >
          &larr; Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column - Digital Library Identity Card Flip Component (5-cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-[20px] shadow-xs relative overflow-hidden" id="interactive-card-show">
            <h3 className="font-sans font-bold text-slate-800 uppercase tracking-wider text-xs mb-4 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" /> Digital Library Card Preview
            </h3>
            
            {/* Lanyard Clip Mockup */}
            <div className="flex flex-col items-center mb-1">
              <div className="w-7 h-9 bg-gradient-to-b from-slate-200 to-slate-300 rounded-sm border border-slate-350 relative flex items-center justify-center shadow-xs">
                {/* Lanyard Slot Hole */}
                <div className="w-3.5 h-2 bg-slate-850 rounded-full border border-slate-400 absolute top-2 flex items-center justify-center">
                  <div className="w-1.5 h-0.5 bg-slate-300 rounded-full"></div>
                </div>
              </div>
              {/* Plastic Hook Strap */}
              <div className="w-3 h-5 bg-slate-100/75 border-x border-slate-200 shadow-xs -mt-1 z-10"></div>
            </div>

            {/* Outer Plastic Card Holder Frame */}
            <div className="bg-[#EBEBEB] border-2 border-[#D6D6D6] p-2.5 rounded-[16px] shadow-lg relative overflow-hidden max-w-sm mx-auto">
              
              {/* Interactive horizontal custom library badge */}
              <div className="w-full bg-white text-slate-800 p-3 sm:p-4 relative overflow-hidden flex flex-col justify-between shadow-inner rounded-lg select-none" style={{ aspectRatio: '1.58/1' }}>
                
                {/* Slanted top-left blue block */}
                <div 
                  className="absolute left-0 top-0 w-[55%] h-[12px] bg-[#13388a] z-20" 
                  style={{ clipPath: 'polygon(0 0, 100% 0, 88% 100%, 0 100%)' }}
                ></div>
                {/* Top black bar block continuing from slant to right edge */}
                <div 
                  className="absolute right-0 top-0 w-[48%] h-[3px] bg-black z-10"
                ></div>

                {/* Slanted bottom-right blue block */}
                <div 
                  className="absolute right-0 bottom-0 w-[50%] h-[12px] bg-[#13388a] z-20" 
                  style={{ clipPath: 'polygon(12% 0, 100% 0, 100% 100%, 0% 100%)' }}
                ></div>
                {/* Bottom black bar block continuing from slant to left edge */}
                <div 
                  className="absolute left-0 bottom-0 w-[54%] h-[3px] bg-black z-10"
                ></div>

                {/* Headers */}
                <div className="text-center mt-3 z-10">
                  <h4 className="text-[10px] sm:text-[13px] font-black text-[#13388a] uppercase tracking-tight leading-normal font-sans">
                    CHATTOGRAM POLYTECHNIC INSTITUTE
                  </h4>
                  <p className="text-[7.5px] sm:text-[8.5px] text-slate-500 font-extrabold leading-none tracking-wide mt-0.5">
                    Nasirabad, Chattogram
                  </p>
                  {/* Thin divider */}
                  <div className="border-b border-slate-200 mt-1.5 mx-8"></div>
                  <div className="flex justify-center mt-1.5">
                    <span className="bg-[#13388a] text-white text-[7px] font-black px-4 py-0.5 rounded-sm uppercase tracking-widest">
                      ID CARD
                    </span>
                  </div>
                </div>

                {/* Card Main Columns */}
                <div className="grid grid-cols-12 gap-2 items-center my-auto z-10">
                  
                  {/* Left side: Photo & Barcode */}
                  <div className="col-span-4 flex flex-col items-center">
                    <div className="w-[50px] sm:w-[65px] h-[60px] sm:h-[78px] bg-slate-50 border border-slate-200 p-0.5 shadow-xs flex items-center justify-center shrink-0">
                      <img 
                        src={photoUrl} 
                        alt="Student" 
                        className="w-full h-full object-cover rounded-none"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    
                    {/* Barcode representation */}
                    <div className="mt-1 flex flex-col items-center w-full">
                      <div className="flex items-end justify-center h-3.5 gap-[1px] w-full px-1">
                        <div className="w-[1.5px] h-full bg-black"></div>
                        <div className="w-[0.5px] h-full bg-black"></div>
                        <div className="w-[2px] h-full bg-black"></div>
                        <div className="w-[1px] h-full bg-black"></div>
                        <div className="w-[0.5px] h-full bg-black"></div>
                        <div className="w-[2.5px] h-full bg-black"></div>
                        <div className="w-[1.2px] h-full bg-black"></div>
                        <div className="w-[0.5px] h-full bg-black"></div>
                        <div className="w-[1.8px] h-full bg-black"></div>
                        <div className="w-[1px] h-full bg-black"></div>
                        <div className="w-[2.2px] h-full bg-black"></div>
                        <div className="w-[0.8px] h-full bg-black"></div>
                      </div>
                      <span className="text-[6px] sm:text-[7px] font-mono font-bold tracking-widest mt-0.5 leading-none text-slate-800">
                        {rollNumber || 'CST-1001'}
                      </span>
                    </div>
                  </div>

                  {/* Right side: student data details */}
                  <div className="col-span-8 space-y-0.5 pl-3 text-[8px] sm:text-[10px] text-slate-850 font-sans">
                    <div className="grid grid-cols-[45px_5px_1fr] gap-x-1 items-center font-semibold">
                      <span className="text-slate-500 font-bold uppercase text-[7px] sm:text-[8px] tracking-wide">ID NO</span>
                      <span className="text-slate-400">:</span>
                      <span className="text-slate-900 font-bold truncate">{rollNumber}</span>
                    </div>

                    <div className="grid grid-cols-[45px_5px_1fr] gap-x-1 items-center font-semibold">
                      <span className="text-slate-500 font-bold uppercase text-[7px] sm:text-[8px] tracking-wide">Name</span>
                      <span className="text-slate-400">:</span>
                      <span className="text-slate-900 font-extrabold truncate uppercase">{name || 'Your Full Name'}</span>
                    </div>

                    <div className="grid grid-cols-[45px_5px_1fr] gap-x-1 items-center font-semibold">
                      <span className="text-slate-500 font-bold uppercase text-[7px] sm:text-[8px] tracking-wide">Roll</span>
                      <span className="text-slate-400">:</span>
                      <span className="text-slate-900 font-bold truncate">{rollNumber}</span>
                    </div>

                    <div className="grid grid-cols-[45px_5px_1fr] gap-x-1 items-center font-semibold">
                      <span className="text-slate-500 font-bold uppercase text-[7px] sm:text-[8px] tracking-wide">Reg</span>
                      <span className="text-slate-400">:</span>
                      <span className="text-slate-900 font-bold truncate font-mono">SL-{rollNumber?.replace(/[^a-zA-Z0-9]/g, '')}</span>
                    </div>

                    <div className="grid grid-cols-[45px_5px_1fr] gap-x-1 items-center font-semibold">
                      <span className="text-slate-500 font-bold uppercase text-[7px] sm:text-[8px] tracking-wide">Course</span>
                      <span className="text-slate-400">:</span>
                      <span className="text-[#13388a] font-bold truncate">{getCourseName(department)}</span>
                    </div>

                    <div className="grid grid-cols-[45px_5px_1fr] gap-x-1 items-center font-semibold">
                      <span className="text-slate-500 font-bold uppercase text-[7px] sm:text-[8px] tracking-wide">Phone</span>
                      <span className="text-slate-400">:</span>
                      <span className="text-slate-905 truncate">{phone || '+880 1234 56987'}</span>
                    </div>
                  </div>

                </div>
                
                <div className="h-1"></div>
              </div>
            </div>

            {/* Quick action details card download button */}
            <div className="mt-6 flex flex-col gap-3">
              <button 
                onClick={downloadLibraryCardPDF}
                className="w-full text-white bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] hover:brightness-[106%] hover:-translate-y-0.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md h-12 rounded-[14px]"
                id="download-pdf-btn"
              >
                <Download className="w-4 h-4 shrink-0 animate-bounce" />
                <span>Download Library Card (PDF)</span>
              </button>
              <p className="text-[10px] text-slate-400 text-center leading-relaxed font-medium">
                Card includes standard logo headers, user photo, enrollment parameters, dynamic barcodes and programmatic ID frames.
              </p>
            </div>
          </div>

          {/* Quick Avatar selector in case they don't have local photo */}
          <div className="bg-white border border-slate-200 p-5 rounded-[20px] shadow-xs">
            <h4 className="font-sans font-bold text-slate-800 uppercase tracking-wider text-xs mb-3 flex items-center gap-1">
              <span>Quick Library Avatars</span>
            </h4>
            <div className="flex gap-4 items-center">
              {DEFAULT_AVATARS.map((url, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setPhotoUrl(url);
                    setSaveSuccess('Photo loaded! Remember to click "Save Profile Changes" below to write to the system.');
                  }}
                  className={`w-12 h-12 rounded-xl overflow-hidden hover:scale-[1.05] hover:border-[#1E40AF] transition-all bg-slate-50 ${
                    photoUrl === url ? 'border-2 border-[#1E40AF] shadow-md scale-[1.05]' : 'border border-slate-200'
                  }`}
                >
                  <img src={url} alt={`Avatar ${index}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <p className="text-[9px] text-slate-400 mt-2.5 font-medium leading-relaxed">
              Click any quick avatar above, or browse your local workspace to upload a customized profile image.
            </p>
          </div>

        </div>

        {/* Right column - Profile and Password fields edit forms (7-cols) */}
        <div className="lg:col-span-7 space-y-6 animate-fade-in">
          
          {/* Main User Info Form Card */}
          <div className="bg-white border border-slate-200 p-6 sm:p-8 shadow-xs rounded-[20px]">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100 select-none">
              <h3 className="font-sans font-bold text-slate-850 uppercase tracking-wider text-xs flex items-center gap-2">
                <FolderSync className="w-4 h-4 text-[#1E40AF] shrink-0 animate-spin" /> Profile Information Management
              </h3>
              <span className="text-[10px] font-mono font-bold text-slate-400">ID: {user.rollNumber}</span>
            </div>

            {saveSuccess && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2.5 leading-relaxed font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{saveSuccess}</span>
              </div>
            )}

            {saveError && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5 leading-relaxed font-semibold">
                <AlertCircle className="w-4 h-4 text-[#E23636] shrink-0 mt-0.5" />
                <span>{saveError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5">
              
              {/* Profile image upload dropzone section */}
              <div className="p-4 bg-[#F8FAFC]/70 border border-dashed border-slate-200 rounded-[14px] flex flex-col sm:flex-row items-center gap-5 justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white border border-slate-205 p-0.5 overflow-hidden shrink-0 shadow-xs relative rounded-xl">
                    <img src={photoUrl} alt="Face profile representation" className="w-full h-full object-cover rounded-lg" />
                    <label className="absolute bottom-0 inset-x-0 h-4 bg-black/60 cursor-pointer flex items-center justify-center font-bold text-[8px] text-white select-none">
                      EDIT
                    </label>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">Account Profile Photo</h4>
                    <p className="text-[10.5px] text-slate-450 mt-0.5 font-medium leading-relaxed max-w-sm">
                      Upload any customized photo. Re-sized to 250x250 max lock to keep data persistence optimal.
                    </p>
                  </div>
                </div>

                <div className="shrink-0 w-full sm:w-auto">
                  <label className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-[10px] font-bold px-4 py-2.5 uppercase tracking-wider cursor-pointer transition-all shadow-xs text-center block rounded-xl select-none">
                    <span className="flex items-center justify-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" /> Select Local File
                    </span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              {/* Dual Layout lines */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">
                    Full Name (সম্পূর্ণ নাম)
                  </label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name of student..."
                    className="w-full border border-slate-200 px-4 focus:ring-2 focus:ring-blue-105/40 focus:border-blue-500 rounded-[14px] h-14 text-xs font-semibold text-slate-800 bg-white placeholder-slate-400"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wide bg-amber-50 inline-block px-2 border border-amber-100 rounded-lg">
                    Student ID Roll (সংশোধনযোগ্য আইডি)
                  </label>
                  <input 
                    type="text" 
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="Format: CSE-4-045 etc."
                    className="w-full border border-slate-205 px-4 focus:ring-2 focus:ring-blue-105/40 focus:border-blue-500 rounded-[14px] h-14 text-xs font-bold text-slate-800 bg-white font-mono placeholder-slate-400 uppercase"
                    required
                  />
                  <p className="text-[8.5px] text-amber-650 mt-1.5 font-bold leading-normal">
                    ⚠️ Changing Roll will instantly recreate Firestore schemas and sync history parameters.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">
                    Email Address (ইমেইল ঠিকানা)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 shrink-0" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="address@university.edu"
                      className="w-full border border-slate-205 pl-11 pr-4 focus:ring-2 focus:ring-blue-105/40 focus:border-blue-500 rounded-[14px] h-14 text-xs font-semibold text-slate-800 bg-white placeholder-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">
                    Mobile Phone (মোবাইল নম্বর)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 shrink-0" />
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+8801---------"
                      className="w-full border border-slate-205 pl-11 pr-4 focus:ring-2 focus:ring-blue-105/40 focus:border-blue-500 rounded-[14px] h-14 text-xs font-semibold text-slate-800 bg-white placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">
                    Academic Department (অনুষদ/বিভাগ)
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full border border-slate-205 px-4 focus:ring-2 focus:ring-blue-105/40 focus:border-blue-500 rounded-[14px] h-14 text-xs font-bold text-slate-800 bg-white"
                  >
                    <option value="CSE">CSE (Computer Science)</option>
                    <option value="EEE">EEE (Electrical)</option>
                    <option value="CE">CE (Civil Eng)</option>
                    <option value="BBA">BBA (Business Admin)</option>
                    <option value="ENG">ENG (English Department)</option>
                    <option value="CST">CST (Comp Technology)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">
                    Academic Session (শিক্ষাবর্ষ/সেশন)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 shrink-0" />
                    <input 
                      type="text" 
                      value={session}
                      onChange={(e) => setSession(e.target.value)}
                      placeholder="e.g. 2023-2024"
                      className="w-full border border-slate-205 pl-11 pr-4 focus:ring-2 focus:ring-blue-105/40 focus:border-blue-500 rounded-[14px] h-14 text-xs font-semibold text-slate-800 bg-white placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">
                  Postal/Residential Address (বাসস্থানের ঠিকানা)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4.5 w-4 h-4 text-slate-400 shrink-0" />
                  <textarea 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter complete current street mailing details..."
                    className="w-full border border-slate-205 pl-11 pr-4 py-3 focus:ring-2 focus:ring-blue-105/40 focus:border-blue-500 rounded-[14px] min-h-[90px] text-xs font-semibold text-slate-800 bg-white placeholder-slate-400 leading-relaxed"
                  />
                </div>
              </div>

              {/* Submit triggers with primary gradient h-12 rounded-[14px] */}
              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={saveLoading}
                  className="w-full text-white bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] hover:brightness-[106%] hover:-translate-y-0.5 text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 h-12 rounded-[14px] cursor-pointer"
                  id="save-profile-btn"
                >
                  {saveLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Writing changes to Database...</span>
                    </>
                  ) : (
                    'Save Profile Changes'
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* Account Security Settings under profile details card */}
          <div className="bg-white border border-slate-200 p-6 sm:p-8 shadow-xs rounded-[20px]">
            <h3 className="font-sans font-bold text-slate-800 uppercase tracking-wider text-xs mb-5 flex items-center gap-2 border-b border-slate-100 pb-3 select-none">
              <KeyRound className="w-4 h-4 text-[#1E40AF] shrink-0" /> Account Security settings (পাসওয়ার্ড পরিবর্তন)
            </h3>

            {passSuccess && (
              <div className="mb-4 p-4 bg-emerald-50 border border-emerald-250 text-emerald-850 text-xs rounded-xl font-semibold">
                {passSuccess}
              </div>
            )}

            {passError && (
              <div className="mb-4 p-4 bg-rose-50 border border-rose-250 text-[#E23636] text-xs rounded-xl font-semibold">
                {passError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">
                    New Password (নতুন পাসওয়ার্ড)
                  </label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter brand new password..."
                    className="w-full border border-slate-205 px-4 focus:ring-2 focus:ring-blue-105/40 focus:border-blue-500 rounded-[14px] h-14 text-xs font-semibold text-slate-800 bg-white placeholder-slate-400"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">
                    Confirm Password (পাসওয়ার্ড নিশ্চিত করুন)
                  </label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Verify brand new password..."
                    className="w-full border border-slate-205 px-4 focus:ring-2 focus:ring-blue-105/40 focus:border-blue-500 rounded-[14px] h-14 text-xs font-semibold text-[#374151] bg-white placeholder-slate-400"
                    required
                  />
                </div>
              </div>

              {/* Black/SLA dark option button */}
              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={passLoading}
                  className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:-translate-y-0.5 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center h-12 rounded-[14px] cursor-pointer shadow-xs"
                  id="change-password-btn"
                >
                  {passLoading ? (
                    'Saving password...'
                  ) : (
                    'Change Password'
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
