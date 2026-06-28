import React from 'react';
import { Book } from '../types';
import { CheckCircle2, AlertCircle, ArrowRight, Heart, ZoomIn, Download, Sparkles } from 'lucide-react';

interface BookCardProps {
  book: Book;
  onViewDetails: (id: string) => void;
  badgeText?: string;
  rankIndex?: number; // Optional rank index for Top Borrowed Books
  isWishlisted?: boolean;
  onWishlistToggle?: (id: string, e: React.MouseEvent) => void;
  onActionClick?: (e: React.MouseEvent) => void;
  actionText?: string;
  highlightText?: string;
  onZoomCover?: (url: string) => void;
  onTitleClick?: () => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onViewDetails,
  badgeText,
  rankIndex,
  isWishlisted,
  onWishlistToggle,
  onActionClick,
  actionText,
  highlightText = '',
  onZoomCover,
  onTitleClick,
}) => {
  // Helper for search query highlighting
  const renderHighlighted = (text: string) => {
    if (!highlightText || !highlightText.trim()) return text;
    const regex = new RegExp(`(${highlightText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <mark key={i} className="bg-yellow-200 text-slate-900 font-bold rounded-[3px] px-0.5">{part}</mark>
          ) : part
        )}
      </>
    );
  };

  // Determine fallback badge text if not explicitly provided
  const getBadge = () => {
    if (badgeText) return badgeText;
    if (rankIndex !== undefined) return `Monthly Rank #${rankIndex + 1}`;
    if (book.copiesCount === 0) return 'Hold / Out of Stock';
    if (book.category && (book.category.toUpperCase().includes('STEM') || book.category.toUpperCase().includes('TECH'))) return 'STEM Focus';
    if (book.availableCopies > 0 && book.availableCopies === book.copiesCount) return 'Available Now';
    return book.category || 'Library Copy';
  };

  const activeBadge = getBadge();

  // Determine badge styling based on content
  const getBadgeStyle = (badge: string) => {
    const b = badge.toLowerCase();
    if (b.includes('rank') || b.includes('#1') || b.includes('#2') || b.includes('#3')) {
      return 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-none shadow-xs';
    }
    if (b.includes('month')) {
      return 'bg-amber-600 text-white border-none shadow-xs';
    }
    if (b.includes('trending') || b.includes('match') || b.includes('popular')) {
      return 'bg-emerald-600 text-white border-none';
    }
    if (b.includes('new') || b.includes('arrival')) {
      return 'bg-purple-600 text-white border-none';
    }
    if (b.includes('hold') || b.includes('borrowed') || b.includes('stock')) {
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    }
    return 'bg-slate-100 text-slate-800 border border-slate-200/50';
  };

  const isAvailable = book.copiesCount > 0 && book.availableCopies > 0;
  const borrowCount = (book as any).borrowCount || 0;

  return (
    <div 
      onClick={() => {
        if (onTitleClick) {
          onTitleClick();
        } else {
          onViewDetails(book.id);
        }
      }}
      className="group relative flex flex-col justify-between bg-white border border-slate-200/80 rounded-[20px] p-4 sm:p-5 shadow-sm hover:shadow-xl hover:border-blue-400/60 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer h-full select-none overflow-hidden"
    >
      <div>
        {/* Top: Status Badge & Optional floating rank / actions */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${getBadgeStyle(activeBadge)}`}>
            {activeBadge}
          </span>
          {rankIndex !== undefined && (
            <span className="font-mono text-[10px] sm:text-xs font-black text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-100/50">
              #{String(rankIndex + 1).padStart(2, '0')}
            </span>
          )}
        </div>

        {/* Middle: Large Book Cover (Guarantees uncropped, object-contain, padding, fixed responsive height) */}
        <div className="w-full h-[180px] sm:h-[220px] md:h-[260px] lg:h-[280px] bg-slate-50/60 rounded-2xl flex items-center justify-center p-4 sm:p-5 relative select-none border border-slate-100 overflow-hidden group-hover:bg-slate-50/90 transition-colors">
          <img 
            src={book.imageUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400'} 
            alt={book.title}
            referrerPolicy="no-referrer"
            className="max-h-full max-w-full h-auto w-auto object-contain transition-transform duration-500 ease-out group-hover:scale-102 shadow-xs"
            onError={e => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400';
            }}
          />

          {/* Action triggers on cover */}
          {onZoomCover && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onZoomCover(book.imageUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800');
              }}
              className="absolute right-3 top-3 p-2 bg-white/90 hover:bg-white border border-slate-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer duration-200 text-slate-650 shadow-sm"
              title="Zoom Cover Image"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          )}

          {onWishlistToggle && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onWishlistToggle(book.id, e);
              }}
              className={`absolute left-3 top-3 p-2 border rounded-full transition-all cursor-pointer shadow-sm ${
                isWishlisted 
                  ? 'bg-rose-50 text-rose-500 border-rose-100 opacity-100' 
                  : 'bg-white/90 text-slate-400 hover:text-rose-500 border-slate-150 opacity-0 group-hover:opacity-100 focus:opacity-100 duration-200'
              }`}
              title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          )}
        </div>

        {/* Bottom: Book Info */}
        <div className="mt-4 sm:mt-5 text-left">
          {/* Language label */}
          <div className="text-[10px] sm:text-[11px] font-bold tracking-widest text-blue-600 uppercase">
            {(book.language || 'English').toUpperCase()}
          </div>

          {/* Book Title */}
          <h4 className="font-sans font-bold text-base sm:text-[17px] text-slate-900 tracking-tight line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors mt-1 h-[2.75rem] sm:h-[3rem] overflow-hidden">
            {renderHighlighted(book.title)}
          </h4>

          {/* Author Name */}
          <p className="text-xs sm:text-[14px] text-slate-500 font-medium line-clamp-1 mt-1">
            By {renderHighlighted(book.author)}
          </p>

          {/* Category */}
          <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase mt-1 tracking-wider">
            {book.category}
          </div>
        </div>
      </div>

      {/* Footer: Availability, Borrow Count, and Actions */}
      <div className="mt-4 sm:mt-5 pt-3.5 border-t border-slate-100 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          {/* Availability badge */}
          <div className="flex items-center gap-1.5 font-semibold">
            {isAvailable ? (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-emerald-700 bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-full font-bold">
                <CheckCircle2 className="w-3 h-3" /> Available
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-amber-600 bg-amber-50 border border-amber-100/50 px-2 py-0.5 rounded-full font-bold">
                <AlertCircle className="w-3 h-3" /> Borrowed
              </span>
            )}
          </div>

          {/* Borrow Count */}
          <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/50">
            {borrowCount} {borrowCount === 1 ? 'Borrow' : 'Borrows'}
          </span>
        </div>

        {/* CTA Button */}
        {onActionClick && actionText ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onActionClick(e);
            }}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm py-2 px-4 rounded-xl transition-all duration-300 shadow-xs active:scale-[0.98]"
          >
            {actionText.toLowerCase().includes('import') ? <Download className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{actionText}</span>
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(book.id);
            }}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs sm:text-sm py-2 px-4 rounded-xl transition-all duration-300 group/btn shadow-xs active:scale-[0.98]"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
};
