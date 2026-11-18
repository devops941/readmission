import React, { useState } from 'react';
import { Database, ChevronDown, Check, Plus } from 'lucide-react';
import { Dataset } from '../../types';

interface LibraryCardProps {
  currentDataset: Dataset | null;
  datasets: Dataset[];
  onSelectDataset: (dataset: Dataset) => void;
  onOpenUpload: () => void;
}

export const LibraryCard: React.FC<LibraryCardProps> = ({
  currentDataset,
  datasets,
  onSelectDataset,
  onOpenUpload
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 bg-page border border-rule hover:border-ink rounded-sm shadow-sm transition-all text-xs font-mono text-ink text-left"
      >
        <Database className="w-3.5 h-3.5 text-state-teal" />
        <div className="max-w-[190px] sm:max-w-[260px] truncate">
          <span className="font-semibold block truncate">
            {currentDataset?.name || 'No Dataset Selected'}
          </span>
          <span className="text-[10px] text-ink-3">
            {currentDataset ? `${currentDataset.row_count?.toLocaleString()} encounters · ${currentDataset.readmit_rate ?? 0}% readmit` : 'Select or upload'}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-ink-3 ml-1" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-80 bg-page border-2 border-ink shadow-xl z-50 p-2 font-sans text-xs">
            <div className="px-2 py-1 text-[11px] font-mono text-ink-3 uppercase tracking-wider border-b border-rule mb-1 flex items-center justify-between">
              <span>Library Datasets</span>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenUpload();
                }}
                className="text-state-teal font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> New Upload
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1">
              {datasets.map((ds) => {
                const isSelected = currentDataset?.id === ds.id;
                return (
                  <div
                    key={ds.id}
                    onClick={() => {
                      onSelectDataset(ds);
                      setIsOpen(false);
                    }}
                    className={`p-2 rounded cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected ? 'bg-lime text-ink font-medium' : 'hover:bg-page-shade text-ink-2'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-semibold truncate">{ds.name}</div>
                      <div className="font-mono text-[10px] text-ink-3">
                        {ds.row_count?.toLocaleString()} encounters · {ds.readmit_rate ?? 0}% readmit
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-ink flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
