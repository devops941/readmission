import React, { useState, useEffect } from 'react';
import { BookmarkRibbon } from './BookmarkRibbon';
import { ContentsPopover } from './ContentsPopover';
import { PageTurner } from './PageTurner';
import { LibraryCard } from './LibraryCard';
import { useAuth } from '../../context/AuthContext';
import { LogOut, ChevronRight, BookOpen } from 'lucide-react';

interface BookShellProps {
  currentChapter: number;
  chapterTitle: string;
  leftPageNumber: number;
  rightPageNumber: number;
  totalPages: number;
  children: React.ReactNode;
  onNavigateChapter: (chapterNum: number) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  onOpenUpload: () => void;
}

export const BookShell: React.FC<BookShellProps> = ({
  currentChapter,
  chapterTitle,
  leftPageNumber,
  rightPageNumber,
  totalPages,
  children,
  onNavigateChapter,
  onNextPage,
  onPrevPage,
  onOpenUpload
}) => {
  const { user, activeDataset, datasets, setActiveDataset, logout } = useAuth();
  const [isContentsOpen, setIsContentsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'ArrowRight') onNextPage();
      else if (e.key === 'ArrowLeft') onPrevPage();
      else if (e.key.toLowerCase() === 'e') setIsExpanded(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNextPage, onPrevPage]);

  return (
    <div className="min-h-screen bg-desk flex flex-col justify-between p-2 sm:p-4 md:p-6 lg:p-8 font-sans select-text">
      {/* Top bar on the desk outside the book */}
      <div className="max-w-[1400px] w-full mx-auto flex items-center justify-between mb-3 px-2">
        <LibraryCard
          currentDataset={activeDataset}
          datasets={datasets}
          onSelectDataset={setActiveDataset}
          onOpenUpload={onOpenUpload}
        />

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-page border border-rule text-[11px] font-mono text-ink-3 shadow-xs">
            <span>KEYBOARD</span> <kbd className="px-1.5 bg-desk border border-rule font-bold">←</kbd> <kbd className="px-1.5 bg-desk border border-rule font-bold">→</kbd> <span>TURN PAGES</span>
          </div>

          {/* User profile initials */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-8 h-8 rounded-full bg-ink text-page font-mono text-xs font-bold flex items-center justify-center border-2 border-lime shadow-sm hover:scale-105 transition-transform"
              title={user?.email}
            >
              {user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : 'EX'}
            </button>

            {isUserMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-page border-2 border-ink shadow-xl z-50 p-3 font-sans text-xs animate-in fade-in duration-100">
                  <div className="font-semibold text-ink truncate">{user?.full_name || 'Healthcare User'}</div>
                  <div className="text-[11px] font-mono text-ink-3 truncate mb-2">{user?.email}</div>
                  <div className="inline-block px-1.5 py-0.5 bg-lime text-ink font-mono text-[10px] uppercase font-bold mb-3">
                    {user?.role || 'Analyst'}
                  </div>

                  <div className="border-t border-rule pt-2 space-y-1 font-mono">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onNavigateChapter(9); // Appendix
                      }}
                      className="w-full text-left p-1.5 hover:bg-page-shade rounded flex items-center justify-between text-ink-2"
                    >
                      <span>System & Audit Log</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={logout}
                      className="w-full text-left p-1.5 hover:bg-page-shade rounded text-risk-up flex items-center gap-2 font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* The Open Book spread */}
      <div className={`w-full mx-auto relative transition-all duration-300 ${isExpanded ? 'max-w-[1600px]' : 'max-w-[1380px]'}`}>
        {/* Hanging Bookmark Ribbon */}
        <BookmarkRibbon
          currentChapterNum={currentChapter}
          currentChapterTitle={chapterTitle}
          isOpen={isContentsOpen}
          onToggle={() => setIsContentsOpen(!isContentsOpen)}
        />

        {/* Contents popover */}
        <ContentsPopover
          currentChapter={currentChapter}
          isOpen={isContentsOpen}
          onClose={() => setIsContentsOpen(false)}
          onSelectChapter={onNavigateChapter}
        />

        {/* Book pages container */}
        <div className="bg-page shadow-book border border-rule relative min-h-[720px] p-6 sm:p-8 md:p-10">
          {/* Subtle page edge lines */}
          <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-1.5 bg-page border-r border-rule/50 shadow-inner" />
          <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-1.5 bg-page border-l border-rule/50 shadow-inner" />

          {/* Central Gutter Gradient shadow */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-10 -translate-x-1/2 pointer-events-none shadow-gutter z-10" />

          {/* Running Head banner */}
          <div className="flex items-center justify-between pb-3 mb-6 border-b border-rule/70 text-[11px] font-mono tracking-wider uppercase text-ink-3">
            <span className="flex items-center gap-1.5 font-bold text-ink">
              <BookOpen className="w-3.5 h-3.5 text-state-teal" />
              <span>CHAPTER {currentChapter} · {chapterTitle}</span>
            </span>
            <span className="font-serif italic text-ink-2 lowercase hidden sm:inline">
              de-identified clinical quality research dossier · light theme
            </span>
            <span className="font-mono text-ink-3 font-semibold">READMITEXPLAIN AI</span>
          </div>

          {/* Main 2-Page Spread Content */}
          <div className="relative z-0">
            {children}
          </div>

          {/* Folio numbers at bottom */}
          <div className="pt-6 mt-8 border-t border-rule/50 flex items-center justify-between text-xs font-mono text-ink-3">
            <span>p. {leftPageNumber}</span>
            <span className="text-[10px] uppercase tracking-widest text-state-teal font-semibold hidden sm:inline">
              RESEARCH USE ONLY · POPULATION-LEVEL PATTERNS
            </span>
            <span>p. {rightPageNumber}</span>
          </div>
        </div>

        {/* Bottom Page Turner Controls */}
        <PageTurner
          currentPage={leftPageNumber}
          totalPages={totalPages}
          isExpanded={isExpanded}
          onPrev={onPrevPage}
          onNext={onNextPage}
          onToggleExpand={() => setIsExpanded(!isExpanded)}
        />
      </div>

      {/* Mandatory Footer Disclaimer */}
      <div className="max-w-[1380px] w-full mx-auto mt-4 px-3 text-center font-mono text-[11px] text-ink-3">
        Research and quality-improvement use only. Population-level patterns for expert review. Explanations show statistical association, not causation. Not for individual clinical decisions.
      </div>
    </div>
  );
};
