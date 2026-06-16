import React from 'react';
import { BookOpen, Mail, Phone, MapPin, Globe, ExternalLink, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 pt-16 pb-12 mt-auto font-sans" id="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Multi-column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 pb-12 border-b border-slate-800">
          
          {/* Column 1: Institutional Intro */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center space-x-2 text-white">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#1E40AF] to-[#3B82F6] flex items-center justify-center text-white font-black text-sm">
                S
              </div>
              <span className="font-sans font-extrabold text-base tracking-tight uppercase">ScholarLib</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              The premier digital library framework powering Chattogram Polytechnic Institute. Streamlining access to thousands of academic books, core session curriculums, and research journals.
            </p>
            <div className="flex items-center space-x-2.5 text-[11px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-900/30 px-3 py-1.5 rounded-lg w-max shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Institutional Core Online</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Catalog & Resources</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#books" className="hover:text-white hover:underline transition-all">Engineering Books</a>
              </li>
              <li>
                <a href="#journals" className="hover:text-white hover:underline transition-all">Scientific Journals</a>
              </li>
              <li>
                <a href="#ebooks" className="hover:text-white hover:underline transition-all">Digital PDF Books</a>
              </li>
              <li>
                <a href="#collections" className="hover:text-white hover:underline transition-all">Special Archives</a>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform & Support */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Support Center</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#tickets" className="hover:text-white hover:underline transition-all">Library Helpdesk</a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white hover:underline transition-all">Borrowing Policies</a>
              </li>
              <li>
                <a href="#guide" className="hover:text-white hover:underline transition-all">Student Handbooks</a>
              </li>
              <li>
                <a href="#rules" className="hover:text-white hover:underline transition-all">Code of Conduct</a>
              </li>
            </ul>
          </div>

          {/* Column 4: Location & Contact */}
          <div className="md:col-span-4 space-y-3.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Institutional Contact</h4>
            <div className="space-y-2 text-xs text-slate-400 font-sans">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" />
                <span>Nasirabad, Bayazid Bostami Road, Chattogram, Bangladesh</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-[#3B82F6] shrink-0" />
                <span>+880 31 681144 / +880 1234 56987</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-[#3B82F6] shrink-0" />
                <span>librarian@chattpoly.edu.bd</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-[#3B82F6] shrink-0" />
                <a href="https://cgpc.gov.bd" target="_blank" rel="noreferrer" className="hover:text-white inline-flex items-center gap-1 transition-all">
                  cgpc.gov.bd <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Lower Banner Section: Copyright & Social Integrity */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-sans text-slate-500">
          <div>
            <span>© {new Date().getFullYear()} ScholarLib Systems. All rights reserved. Powered by enterprise architecture.</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>Crafted with meticulous engineering for Chattogram Polytechnic</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-550" />
          </div>
        </div>

      </div>
    </footer>
  );
}
