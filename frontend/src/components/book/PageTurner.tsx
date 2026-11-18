import React from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';

interface PageTurnerProps {
  currentPage: number;
  totalPages: number;
  isExpanded: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToggleExpand: () => void;
}

export const PageTurner: React.FC<PageTurnerProps> = ({
  currentPage,
  totalPages,
  isExpanded,
  onPrev,
  onNext,
  onToggleExpand
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-rule bg-page text-ink select-none">
      <button
        onClick={onPrev}
        disabled={currentPage <= 1}
        className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-medium hover:bg-page-shade disabled:opacity-30 disabled:hover:bg-transparent rounded transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>◂ PREV PAGE</span>
      </button>

      <div className="flex items-center gap-4 text-xs font-mono text-ink-3">
        <span>Spread {Math.ceil(currentPage / 2)} of {Math.ceil(totalPages / 2)} · p. {currentPage} & {currentPage + 1}</span>
        <button
          onClick={onToggleExpand}
          title={isExpanded ? "Collapse wide view" : "Expand to wide view"}
          className="p-1 hover:bg-page-shade text-ink hover:text-ink-2 rounded"
        >
          {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      <button
        onClick={onNext}
        disabled={currentPage >= totalPages - 1}
        className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-medium hover:bg-page-shade disabled:opacity-30 disabled:hover:bg-transparent rounded transition-colors"
      >
        <span>NEXT PAGE ▸</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
