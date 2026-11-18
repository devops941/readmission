import React from 'react';
import { Bookmark } from 'lucide-react';

interface BookmarkRibbonProps {
  currentChapterNum: number;
  currentChapterTitle: string;
  isOpen: boolean;
  onToggle: () => void;
}

export const BookmarkRibbon: React.FC<BookmarkRibbonProps> = ({
  currentChapterNum,
  currentChapterTitle,
  isOpen,
  onToggle
}) => {
  return (
    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 cursor-pointer group" onClick={onToggle}>
      <div className={`px-4 py-2 bg-lime text-ink font-mono text-xs font-bold tracking-wider uppercase shadow-md flex items-center gap-2 border-b-2 border-ink/20 transition-all duration-200 ${isOpen ? 'translate-y-2 ring-2 ring-ink ring-offset-2 ring-offset-desk' : 'hover:translate-y-1'}`}>
        <Bookmark className="w-3.5 h-3.5 fill-ink" />
        <span>{currentChapterNum === 0 ? 'Frontispiece' : `${currentChapterNum} · ${currentChapterTitle}`}</span>
        <span className="text-[10px] bg-ink text-lime px-1.5 py-0.5 rounded-sm">CONTENTS ▾</span>
      </div>
      {/* Ribbon tail cut */}
      <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[8px] border-t-lime mx-auto"></div>
    </div>
  );
};
