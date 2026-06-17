import React, { useState, useEffect } from 'react';
import { Book, Bell, User, LogOut, ChevronDown, Check, Shield } from 'lucide-react';
import { Notification } from '../types.js';

interface HeaderProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  user: any;
  logout: () => void;
  branding?: any;
}

export default function Header({ currentView, setCurrentView, user, logout, branding }: HeaderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    if (user && user.rollNumber) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000); // Poll notifications
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user || !user.rollNumber) {
      setNotifications([]);
      return;
    }
    try {
      const roll = user.rollNumber;
      const res = await fetch(`/api/notifications/${roll}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setNotifications(data);
        } else {
          setNotifications([]);
        }
      } else {
        setNotifications([]);
      }
    } catch (e: any) {
      if (e?.message?.includes('Failed to fetch') || e?.name === 'TypeError') {
        console.warn("Transient network issue loading notifications:", e?.message);
      } else {
        console.error("Error loading notifications:", e);
      }
      setNotifications([]);
    }
  };

  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/notifications/read/${id}`, { method: 'POST' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Brand Logo - Elite Modern Institutional Header */}
        <div 
          onClick={() => {
            setCurrentView('home');
            setShowNotifDropdown(false);
            setShowUserDropdown(false);
          }} 
          className="flex items-center space-x-3 cursor-pointer select-none group"
          id="logo"
        >
          {branding?.logoUrl ? (
            <img 
              src={branding.logoUrl} 
              alt={branding.shortName || "CpiLib"} 
              className="w-10 h-10 rounded-xl object-cover shadow-xs border border-slate-200 group-hover:scale-[1.05] transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1E40AF] to-[#3B82F6] flex items-center justify-center text-white font-extrabold text-lg shadow-sm group-hover:scale-[1.05] transition-transform duration-300">
              {(branding?.shortName || "CpiLib")[0]?.toUpperCase() || "C"}
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-sans font-extrabold text-base tracking-tight text-slate-900 uppercase">
              {branding?.shortName || "CpiLib"}
            </span>
            <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase leading-none mt-0.5">
              {branding?.libraryName || "Central Library"}
            </span>
          </div>
        </div>

        {/* Primary Navigation - SaaS Style Pills with Smooth Hover Elements */}
        <nav className="hidden md:flex space-x-1.5 items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/50" id="navbar">
          {(user && (user.role === 'admin' || user.rollNumber === 'ADMIN')
            ? [
                { id: 'home', label: 'Home' },
                { id: 'catalog', label: 'Catalog' },
                { id: 'ebooks', label: 'E-Books' },
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'profile', label: 'Profile' },
                { id: 'admin', label: 'Admin Panel' }
              ]
            : [
                { id: 'home', label: 'Home' },
                { id: 'catalog', label: 'Catalog' },
                { id: 'ebooks', label: 'E-Books' },
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'profile', label: 'Profile' }
              ]
          ).map(tab => {
            const isActive = currentView === tab.id || (tab.id === 'catalog' && currentView === 'book-detail');
            return (
              <button
                key={tab.id}
                id={`nav-${tab.id}`}
                onClick={() => {
                  setCurrentView(tab.id);
                  setShowNotifDropdown(false);
                  setShowUserDropdown(false);
                }}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-white text-[#1E40AF] shadow-xs border-b border-transparent font-bold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Header Right Widgets: Notification Bell and User Panel */}
        <div className="flex items-center space-x-3">
          
          {/* Notifications Trigger */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                setShowUserDropdown(false);
              }}
              className={`p-2.5 rounded-xl border transition-all duration-200 relative cursor-pointer ${
                showNotifDropdown 
                  ? 'bg-slate-100 border-slate-300 text-slate-900' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
              id="notif-bell-btn"
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9.5px] font-black h-4.5 min-w-4.5 px-1.5 rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel - Premium Card Style */}
            {showNotifDropdown && (
              <div 
                className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl py-2.5 z-50 max-h-[480px] overflow-y-auto animate-fade-in"
                id="notif-panel"
              >
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-sans font-bold text-slate-800 text-sm">Notifications</span>
                  <span className="text-xs bg-amber-550/10 text-[#F59E0B] rounded-full px-2.5 py-0.5 font-bold">{unreadCount} Active</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">No new notifications inbox.</div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        className={`p-4 transition-colors hover:bg-slate-50/50 ${notif.isRead ? 'bg-white' : 'bg-blue-50/20'}`}
                        id={`notif-${notif.id}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-sm uppercase tracking-wide border ${
                            notif.type === 'OVERDUE' 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : notif.type === 'APPROVAL' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {notif.type}
                          </span>
                          {!notif.isRead && (
                            <button 
                              onClick={(e) => markAsRead(notif.id, e)}
                              className="text-[10px] text-blue-600 hover:text-[#1E40AF] font-bold flex items-center gap-0.5 focus:outline-none cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" /> Mark read
                            </button>
                          )}
                        </div>
                        <h4 className="font-sans font-bold text-slate-800 text-xs mt-2">{notif.title}</h4>
                        <p className="text-xs text-slate-505 mt-1 leading-relaxed font-sans">{notif.message}</p>
                        <span className="text-[10px] text-slate-400 block mt-2 font-mono">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User profile dropdown - Handles login/logout triggers */}
          {user ? (
            <div className="relative">
              <button 
                onClick={() => {
                  setShowUserDropdown(!showUserDropdown);
                  setShowNotifDropdown(false);
                }}
                className="flex items-center space-x-2.5 focus:outline-none p-1 pr-2.5 rounded-xl border border-slate-200/60 bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer"
                id="user-profile-menu"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#1E40AF] to-[#3B82F6] flex items-center justify-center font-sans font-extrabold text-xs text-white shadow-xs">
                  {user.rollNumber === 'ADMIN' ? 'AD' : user.rollNumber.substring(0, 3).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-slate-800 truncate max-w-[120px]">{user.name}</p>
                  <p className="text-[10px] text-slate-450 font-mono tracking-tight leading-none mt-0.5">{user.rollNumber}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {showUserDropdown && (
                <div 
                  className="absolute right-0 mt-3 w-64 bg-white border border-slate-200 shadow-xl rounded-2xl py-1.5 z-50 font-sans text-slate-700 animate-fade-in"
                  id="user-profile-dropdown"
                >
                  <div className="px-4 py-3 border-b border-slate-100 text-xs">
                    <p className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Student Account</p>
                    <p className="font-extrabold text-slate-900 text-sm mt-0.5 truncate">{user.name}</p>
                    <p className="font-mono text-slate-500 mt-0.5">{user.rollNumber}</p>
                  </div>
                  
                  <div className="p-1">
                    <button 
                      onClick={() => {
                        setCurrentView('profile');
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 hover:text-slate-900 rounded-lg flex items-center gap-2.5 font-medium cursor-pointer"
                    >
                      <User className="w-4 h-4 text-slate-400" /> Profile Details
                    </button>

                    <button 
                      onClick={() => {
                        setCurrentView('dashboard');
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 hover:text-slate-900 rounded-lg flex items-center gap-2.5 font-medium cursor-pointer"
                    >
                      <Book className="w-4 h-4 text-slate-400" /> My Library Dashboard
                    </button>

                    {(user?.role === 'admin' || user?.rollNumber === 'ADMIN') && (
                      <button 
                        onClick={() => {
                          setCurrentView('admin');
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-[#1E40AF] text-left px-3 py-2 text-xs hover:bg-blue-50/50 rounded-lg flex items-center gap-2.5 font-bold cursor-pointer"
                      >
                        <Shield className="w-4 h-4 text-[#1E40AF]" /> Administration
                      </button>
                    )}
                  </div>

                  <div className="border-t border-slate-100 my-1"></div>

                  <div className="p-1">
                    <button 
                      onClick={() => {
                        logout();
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2.5 font-semibold cursor-pointer"
                      id="logout-btn"
                    >
                      <LogOut className="w-4 h-4" /> Logout Session
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={() => setCurrentView('dashboard')} 
              className="bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] hover:brightness-[106%] text-white px-5 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
              id="login-trigger-btn"
            >
              Sign In
            </button>
          )}

        </div>
      </div>
    </header>
  );
}
