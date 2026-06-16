import React, { useState, useEffect } from 'react';
import { Book, Clock, AlertTriangle, ShieldCheck, Heart, KeyRound, CheckSquare, Layers, AlertCircle, RefreshCw, Coins } from 'lucide-react';
import { BorrowRecord, Fine } from '../types.js';

interface StudentDashboardProps {
  user: any;
  books: any[];
  setCurrentView: (view: string) => void;
  setSelectedBookId: (id: string) => void;
  logout: () => void;
}

export default function StudentDashboard({
  user,
  books,
  setCurrentView,
  setSelectedBookId,
  logout
}: StudentDashboardProps) {
  const [loans, setLoans] = useState<BorrowRecord[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Profile password modification state
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Simulated overdue modifier states
  const [isSimulating, setIsSimulating] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadStudentRecords();
    }
  }, [user]);

  const loadStudentRecords = async () => {
    setLoading(true);
    try {
      const loansRes = await fetch(`/api/borrow-history/${user.rollNumber}`);
      const loansData = await loansRes.json();
      setLoans(loansData);

      const finesRes = await fetch(`/api/fines/${user.rollNumber}`);
      const finesData = await finesRes.json();
      setFines(finesData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnRequest = async (recordId: string) => {
    try {
      const res = await fetch(`/api/return/${recordId}`, { method: 'POST' });
      if (res.ok) {
        alert("Return request submitted! Please present the book to the library checkout desk to verify check-in.");
        loadStudentRecords();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to make return request");
      }
    } catch (e) {
      alert("Error returning books.");
    }
  };

  const handleSimulateOverdue = async (recordId: string, daysLate: number) => {
    setIsSimulating(recordId);
    try {
      const res = await fetch(`/api/simulate-late/${recordId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysLate })
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        loadStudentRecords();
      } else {
        const data = await res.json();
        alert(data.error || "Simulation failed.");
      }
    } catch (e) {
      alert("Simulation encountered errors.");
    } finally {
      setIsSimulating(null);
    }
  };

  const handlePayFine = async (fineId: string) => {
    try {
      const res = await fetch(`/api/fines/pay/${fineId}`, { method: 'POST' });
      if (res.ok) {
        alert("Fine payment simulated successfully!");
        loadStudentRecords();
      } else {
        alert("Error paying fine.");
      }
    } catch (e) {
      alert("Error processing payment.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 4) {
      setPasswordError('Password should be at least 4 characters long.');
      return;
    }

    try {
      const res = await fetch(`/api/students/${user.rollNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });
      if (res.ok) {
        setPasswordSuccess('Password updated successfully! It is now saved in database.json.');
        setNewPassword('');
      } else {
        setPasswordError('Failed to change password on database endpoints.');
      }
    } catch (e) {
      setPasswordError('Error saving password.');
    }
  };

  const activeLoans = loans.filter(l => l.status !== 'RETURNED');
  const pastLoans = loans.filter(l => l.status === 'RETURNED');
  const unpaidFines = fines.filter(f => f.status === 'UNPAID');
  const paidFines = fines.filter(f => f.status !== 'UNPAID');

  const unpaidFinesTotal = unpaidFines.reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans animate-fade-in" id="student-dashboard">
      
      {/* Upper Student Card Header - Premium Styling */}
      <section className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] border border-slate-800 rounded-[20px] p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6 shadow-md text-white relative overflow-hidden animate-fade-in">
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-center space-x-4 relative z-10 w-full md:w-auto">
          <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-gradient-to-br from-[#1E40AF] to-blue-500 border border-blue-400 flex flex-col items-center justify-center font-mono font-black text-xs sm:text-sm text-white shadow-lg shrink-0">
            <span className="text-[9px] uppercase font-bold tracking-widest text-blue-100 opacity-85">Roll</span>
            <span>{user.rollNumber}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white uppercase tracking-wide truncate">{user.name}</h1>
              <span className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Active Member
              </span>
            </div>
            <p className="text-xs text-blue-300 font-mono mt-1 flex items-center gap-1">
              <span>{user.department} Department</span>
              <span>•</span>
              <span className="bg-slate-800 px-2 py-0.5 text-[10px] uppercase font-bold font-sans text-indigo-300 rounded border border-slate-700">Sem {user.semester}</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-1.5 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Verified Scholar Roster Sync: Active
            </p>
          </div>
        </div>

        {/* Highlight Stats summaries */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4 md:self-auto relative z-10 select-none pt-4 md:pt-0 border-t border-slate-800 md:border-0">
          <div className="grid grid-cols-3 divide-x divide-slate-800 text-center gap-1 sm:gap-2 w-full md:w-auto">
            <div className="px-3 sm:px-6">
              <p className="text-xl sm:text-2xl font-black font-mono text-emerald-400">{activeLoans.length}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Active Borrows</p>
            </div>
            <div className="px-3 sm:px-6">
              <p className={`text-xl sm:text-2xl font-black font-mono ${loans.filter(l => l.status === 'BORROWED' && new Date() > new Date(l.dueDate)).length > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-350'}`}>
                {loans.filter(l => l.status === 'BORROWED' && new Date() > new Date(l.dueDate)).length}
              </p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Overdue Books</p>
            </div>
            <div className="px-3 sm:px-6 font-mono">
              <p className={`text-xl sm:text-2xl font-black ${unpaidFinesTotal > 0 ? 'text-rose-400 font-bold' : 'text-slate-355'}`}>
                ৳{unpaidFinesTotal}
              </p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Fine Balance</p>
            </div>
          </div>
          <button 
            onClick={loadStudentRecords} 
            disabled={loading}
            className="p-2 sm:p-2.5 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 rounded-xl transition-all cursor-pointer border border-slate-700 disabled:opacity-50 shrink-0"
            title="Refresh Account Records"
            id="refresh-student-records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
          </button>
        </div>
      </section>

      {/* Account Overview Alert / Card in Bengali and English (100% Fully Responsive Layout) */}
      <div 
        className="mb-8 p-5 sm:p-6 bg-[#1E40AF]/5 border border-blue-150 text-slate-800 rounded-[20px] flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center shadow-xs select-none hover:border-blue-400 transition-all duration-200" 
        id="student-bilingual-summary"
      >
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center bg-blue-100 text-[#1E40AF] rounded-full">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
            </span>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
              লাইব্রেরি হিসাব সারসংক্ষেপ (Your Library Account Summary)
            </h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl font-sans font-medium">
            আপনার অ্যাকাউন্টে বর্তমানে <span className="bg-blue-100/70 border border-blue-200 text-blue-800 font-extrabold px-2 py-0.5 rounded-md font-sans whitespace-nowrap">{activeLoans.length} টি বই</span> ধার করা রয়েছে এবং এ পর্যন্ত আপনি মোট <span className="bg-slate-100 border border-slate-200 text-slate-800 font-extrabold px-2 py-0.5 rounded-md font-sans whitespace-nowrap">{loans.length} টি বই</span> লাইব্রেরি থেকে সংগ্রহ করেছেন। অনাদায়ী বুক জরিমানা মোট <span className="font-extrabold text-rose-600">BDT {unpaidFinesTotal}</span> টাকা। বই ফেরত দিতে চাইলে নিম্নে সংশ্লিষ্ট তালিকায় 'Request Return Checkout' বাটনে ক্লিক করুন।
          </p>
        </div>

        {/* STATS CONTAINERS: USING Adaptive Grid for mobile layout to prevent vertical squishing/clipping */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 shrink-0 w-full lg:w-auto mt-2 lg:mt-0">
          <div className="bg-white border border-slate-200 p-2.5 sm:p-3 text-center min-w-[85px] sm:min-w-[110px] flex-1 rounded-xl shadow-xs hover:border-blue-500 transition-colors duration-150">
            <span className="block text-[8px] sm:text-[9.5px] font-bold text-slate-400 uppercase tracking-wide">সর্বমোট ধার</span>
            <span className="block text-sm sm:text-lg font-bold text-[#1E40AF] font-mono mt-0.5">{loans.length}</span>
            <span className="text-[7px] sm:text-[9px] text-slate-400 block font-semibold">(Career)</span>
          </div>
          <div className="bg-white border border-slate-200 p-2.5 sm:p-3 text-center min-w-[85px] sm:min-w-[110px] flex-1 rounded-xl shadow-xs hover:border-amber-500 transition-colors duration-150">
            <span className="block text-[8px] sm:text-[9.5px] font-bold text-slate-400 uppercase tracking-wide font-sans">চলতি হিসাব</span>
            <span className="block text-sm sm:text-lg font-bold text-[#F59E0B] font-mono mt-0.5">{activeLoans.length}</span>
            <span className="text-[7px] sm:text-[9px] text-slate-400 block font-semibold">(Active)</span>
          </div>
          <div className="bg-white border border-slate-200 p-2.5 sm:p-3 text-center min-w-[85px] sm:min-w-[110px] flex-1 rounded-xl shadow-xs hover:border-rose-500 transition-colors duration-150">
            <span className="block text-[8px] sm:text-[9.5px] font-bold text-slate-400 uppercase tracking-wide font-sans">জরিমানা</span>
            <span className="block text-sm sm:text-lg font-bold text-rose-600 font-mono mt-0.5">৳{unpaidFinesTotal}</span>
            <span className="text-[7px] sm:text-[9px] text-slate-400 block font-semibold">(Fines BDT)</span>
          </div>
        </div>
      </div>

      {/* Main grids: active actions, historical list, profile manager */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns (Active borrowings & historical loans) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Borrowing Cards */}
          <div className="bg-white border border-slate-200 rounded-[20px] p-5 sm:p-6 shadow-xs" id="active-borrows">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100">
              <h3 className="font-sans font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
                <CheckSquare className="w-4.5 h-4.5 text-[#1E40AF] shrink-0" /> Checked Out Textbooks
              </h3>
              <span className="bg-blue-50 text-[#1E40AF] text-[10px] font-extrabold px-3 py-1 uppercase tracking-wider rounded-lg font-mono">
                {activeLoans.length} active
              </span>
            </div>

            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                <span>Loading active student borrow logs...</span>
              </div>
            ) : activeLoans.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center select-none text-slate-400">
                <Book className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-700">No active book checked out right now.</p>
                <p className="text-[10px] text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  You are in good standing! Pick a book from the Library Catalog or read digital PDF eBooks.
                </p>
                <button 
                  onClick={() => setCurrentView('catalog')}
                  className="mt-5 inline-flex items-center gap-1.5 bg-gradient-to-r from-[#1E40AF] to-blue-500 hover:brightness-105 text-white text-[10px] font-bold px-5 py-2.5 rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                >
                  Browse Catalog &rarr;
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeLoans.map(loan => {
                  const isOverdue = new Date() > new Date(loan.dueDate);
                  return (
                    <div 
                      key={loan.id} 
                      className={`border p-4 sm:p-5 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between rounded-xl transition-all duration-150 hover:bg-slate-50/20 ${
                        isOverdue ? 'border-red-200 bg-rose-50/20' : 'border-slate-200 bg-slate-55/65'
                      }`}
                      id={`active-loan-${loan.id}`}
                    >
                      <div className="flex gap-4 items-start sm:items-center min-w-0 flex-1">
                        <div className="w-12 h-16 bg-white rounded-lg border border-slate-200 p-1 shrink-0 flex items-center justify-center overflow-hidden shadow-xs">
                          {loan.bookImage ? (
                            <img 
                              src={loan.bookImage} 
                              alt={loan.bookTitle}
                              referrerPolicy="no-referrer"
                              className="max-w-full max-h-full object-contain object-center rounded-sm"
                            />
                          ) : (
                            <div className="bg-slate-100 w-full h-full flex items-center justify-center text-slate-300">
                              <Book className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-grow text-left">
                          <h4 className="font-sans font-bold text-xs sm:text-sm text-slate-900 leading-snug truncate" title={loan.bookTitle}>
                            {loan.bookTitle}
                          </h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 mt-2 text-[10px] font-mono text-slate-500">
                            <span className="flex items-center gap-1.5 text-slate-450">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              Checkout: {new Date(loan.borrowDate).toLocaleDateString()}
                            </span>
                            <span className={`flex items-center gap-1.5 font-bold ${isOverdue ? 'text-rose-600 animate-pulse' : 'text-slate-500'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isOverdue ? 'bg-rose-500' : 'bg-amber-400'}`}></span>
                              Due Date: {new Date(loan.dueDate).toLocaleDateString()} {isOverdue && '(OVERDUE)'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Borrow States and Simulation Triggers */}
                      <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end w-full md:w-auto gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                        {loan.status === 'PENDING_APPROVE' && (
                          <div className="flex flex-col items-stretch sm:items-end gap-1 w-full">
                            <span className="text-[9px] font-bold text-center text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-md uppercase tracking-wider whitespace-nowrap">
                              Awaiting Handover Check
                            </span>
                            <p className="text-[8px] text-slate-400 text-center sm:text-right">Visit count checklist table</p>
                          </div>
                        )}

                        {loan.status === 'PENDING_RETURN' && (
                          <div className="flex flex-col items-stretch sm:items-end gap-1 w-full">
                            <span className="text-[9px] font-bold text-center text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-md uppercase tracking-wider animate-pulse whitespace-nowrap">
                              Checking Return Logs...
                            </span>
                            <p className="text-[8px] text-slate-400 text-center sm:text-right font-semibold">Verification check ongoing</p>
                          </div>
                        )}

                        {loan.status === 'BORROWED' && (
                          <div className="flex flex-col gap-2.5 w-full font-mono items-stretch sm:items-end">
                            
                            {/* Simulator Sandbox */}
                            <div className="bg-slate-50 p-2.5 border border-slate-200 rounded-xl flex flex-col gap-1.5 w-full max-w-[280px]">
                              <p className="text-[8px] font-sans font-bold text-slate-500 text-center select-none tracking-wider uppercase">
                                🛠️ Simulation Warp (পরীক্ষামূলক জরিমানা তৈরি)
                              </p>
                              <div className="grid grid-cols-2 gap-1.5">
                                <button 
                                  onClick={() => handleSimulateOverdue(loan.id, 5)}
                                  disabled={isSimulating === loan.id}
                                  className="bg-amber-50 hover:bg-amber-100 border border-amber-250 text-amber-800 py-1 rounded-md text-[9px] font-bold cursor-pointer disabled:opacity-50 uppercase tracking-tight text-center"
                                  title="Warp 5 Days in the future"
                                >
                                  {isSimulating === loan.id ? 'Warps...' : '+5 Days'}
                                </button>
                                <button 
                                  onClick={() => handleSimulateOverdue(loan.id, 10)}
                                  disabled={isSimulating === loan.id}
                                  className="bg-rose-50 hover:bg-rose-100 border border-rose-250 text-rose-800 py-1 rounded-md text-[9px] font-bold cursor-pointer disabled:opacity-50 uppercase tracking-tight text-center"
                                  title="Warp 10 Days in the future (Triggers Fine BDT 50)"
                                >
                                  {isSimulating === loan.id ? 'Warps...' : '+10 Days (Fine)'}
                                </button>
                              </div>
                            </div>

                            <button 
                              onClick={() => handleReturnRequest(loan.id)}
                              className="text-white bg-blue-600 hover:brightness-105 text-[10px] font-bold px-4 py-2.5 rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-sm text-center"
                              id={`return-btn-${loan.id}`}
                            >
                              Request Return Checkout
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Historical Transferred items */}
          <div className="bg-white border border-slate-200 rounded-[20px] p-5 sm:p-6 shadow-xs animate-fade-in" id="borrow-history">
            <h3 className="font-sans font-bold text-slate-900 uppercase tracking-wider mb-6 text-xs flex items-center gap-2">
              <Layers className="w-4.5 h-4.5 text-[#1E40AF] shrink-0" /> Academic Return Logs & Career History
            </h3>

            {pastLoans.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center italic">Your historic returned records are clean.</p>
            ) : (
              <div className="overflow-x-auto select-none rounded-xl border border-slate-100/80">
                <table className="w-full text-xs text-left text-slate-500 border-collapse min-w-[500px]" id="history-table">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 uppercase tracking-wider text-[9px] font-bold pb-2">
                      <th className="py-3 px-4 font-extrabold">Book Details</th>
                      <th className="py-3 px-4 font-extrabold">Borrow Date</th>
                      <th className="py-3 px-4 font-extrabold">Return Date</th>
                      <th className="py-3 px-4 text-right font-extrabold">Librarian Fine</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastLoans.map(h => (
                      <tr key={h.id} className="border-b border-slate-100 last:border-none hover:bg-slate-50/50">
                        <td className="py-3 px-4 text-slate-900 font-bold max-w-[250px] truncate">{h.bookTitle}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{new Date(h.borrowDate).toLocaleDateString()}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{h.returnDate ? new Date(h.returnDate).toLocaleDateString() : 'N/A'}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          {h.fineAmount > 0 ? (
                            <span className="text-rose-705 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md text-[10px]">BDT {h.fineAmount}</span>
                          ) : (
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md text-[10px]">None</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Columns (Fine accounts, profile details) */}
        <div className="space-y-6">
          
          {/* Outstanding Fines Manager Wallet */}
          <div className="bg-white border border-slate-200 rounded-[20px] p-5 sm:p-6 shadow-xs" id="fine-manager animate-fade-in">
            <h3 className="font-sans font-bold text-slate-900 uppercase tracking-wider mb-4 text-xs flex items-center gap-2">
              <Coins className="w-4.5 h-4.5 text-indigo-600 shrink-0" /> Library Outstanding Wallet
            </h3>
            
            {unpaidFines.length === 0 ? (
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 text-xs text-slate-700 flex flex-col items-start gap-2.5 leading-relaxed font-sans rounded-xl text-left">
                <span className="text-emerald-650 bg-white p-1 rounded-full border border-emerald-100">
                  <span className="w-2 h-2 block bg-emerald-500 rounded-full animate-pulse"></span>
                </span>
                <div>
                  <p className="font-bold text-slate-900">Good Standing (ঋণ বা জরিমানা মুক্ত)</p>
                  <p className="text-[11px] text-slate-500 mt-1">Excellent job! You have zero outstanding overdue fine balances on your university ledger.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed font-medium text-left">
                  Unpaid penalties must be paid before borrowing original physical books from physical shelves.
                </p>
                
                <div className="divide-y divide-slate-100 border-t border-b border-slate-100 text-left">
                  {unpaidFines.map(fine => (
                    <div key={fine.id} className="py-3.5 flex justify-between items-start text-xs gap-4">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate" title={fine.reason}>{fine.reason}</p>
                        <span className="text-[10px] text-slate-400 mt-0.5 font-mono block">{new Date(fine.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="font-mono font-extrabold text-rose-600 text-xs">BDT {fine.amount}</span>
                        <button 
                          onClick={() => handlePayFine(fine.id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide cursor-pointer font-sans transition-all duration-150 rounded-md"
                        >
                          Simulate Pay
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-rose-50 to-amber-50 p-4 border border-rose-150 flex justify-between items-center text-xs rounded-xl">
                  <div className="font-bold text-rose-900 uppercase tracking-wide text-[9px] font-sans text-left">
                    <span>সর্বমোট বকেয়া জরিমানা</span>
                    <span className="block text-[8px] text-slate-500 font-semibold normal-case font-mono mt-0.5">Grand Total Penalty</span>
                  </div>
                  <span className="font-mono font-black text-rose-700 text-base">BDT {unpaidFinesTotal}</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick password change section */}
          <div className="bg-white border border-slate-200 rounded-[20px] p-5 sm:p-6 shadow-xs text-left">
            <h3 className="font-sans font-bold text-slate-900 uppercase tracking-wider mb-4 text-xs flex items-center gap-2">
              <KeyRound className="w-4.5 h-4.5 text-blue-600 shrink-0" /> Modify Portal Password
            </h3>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">New Security Password</label>
                <input 
                  type="password"
                  placeholder="Min 4 digits config..."
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-105 bg-slate-50/50"
                />
              </div>

              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10.5px] rounded-lg">
                  {passwordSuccess}
                </div>
              )}

              {passwordError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-[10.5px] rounded-lg">
                  {passwordError}
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-slate-900 text-white hover:bg-slate-800 font-bold uppercase tracking-wider py-2.5 rounded-xl text-[10px] cursor-pointer transition-colors"
              >
                Update Password
              </button>
            </form>
          </div>

        </div>
      </div>

    </div>
  );
}
