import React from 'react';
import { BookOpen, CheckCircle2, Circle, AlertCircle, X } from 'lucide-react';

interface ChapterItem {
  num: number;
  title: string;
  subtitle: string;
  pages: string;
  status: 'done' | 'in_progress' | 'attention';
}

const CHAPTERS: ChapterItem[] = [
  { num: 0, title: 'Frontispiece', subtitle: 'Overview, Population Scale & Contents', pages: 'pp. 1–2', status: 'done' },
  { num: 1, title: 'Intake & Ledger', subtitle: 'Data Import, PHI Scanner & In-App Entry', pages: 'pp. 3–6', status: 'done' },
  { num: 2, title: 'Patterns', subtitle: 'Wilson 95% CIs, Trends & Statsmodels Odds Ratios', pages: 'pp. 7–10', status: 'done' },
  { num: 3, title: 'Models & Calibration', subtitle: 'Tree & Linear Ensembles, Brier, Reliability & Net Benefit', pages: 'pp. 11–14', status: 'done' },
  { num: 4, title: 'Explanations (SHAP)', subtitle: 'Global Beeswarm, Permutation, PDP/ICE & Record Waterfall', pages: 'pp. 15–18', status: 'done' },
  { num: 5, title: 'Subgroups & Fairness', subtitle: 'Demographic Disparity Gaps & Small-Cell Suppression', pages: 'pp. 19–20', status: 'attention' },
  { num: 6, title: 'Monitoring & Drift', subtitle: 'Monthly PSI Strips, KS Tests & Model Registry', pages: 'pp. 21–22', status: 'done' },
  { num: 7, title: 'Clinical Review', subtitle: 'Expert Governance, Margin Notes & Flagging', pages: 'pp. 23–24', status: 'done' },
  { num: 8, title: 'Export & Colophon', subtitle: 'Printable Dossier (PDF/Excel), Splits & Metadata', pages: 'pp. 25–26', status: 'done' },
  { num: 9, title: 'Appendix', subtitle: 'User Accounts, Audit Log & Health Status', pages: 'pp. 27–28', status: 'done' },
];

interface ContentsPopoverProps {
  currentChapter: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectChapter: (chapterNum: number) => void;
}

export const ContentsPopover: React.FC<ContentsPopoverProps> = ({
  currentChapter,
  isOpen,
  onClose,
  onSelectChapter
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-page border-2 border-ink w-full max-w-2xl p-6 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-rule pb-3 mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-ink" />
            <h2 className="font-serif text-2xl font-bold tracking-tight">Table of Contents</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-page-shade text-ink-2 hover:text-ink">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="font-sans text-xs text-ink-2 mb-4 italic">
          Click any chapter to open that two-page spread in the dossier. Status marks indicate verified analytical completion.
        </p>

        <div className="space-y-1.5 font-mono text-xs">
          {CHAPTERS.map((ch) => {
            const isSelected = currentChapter === ch.num;
            return (
              <div
                key={ch.num}
                onClick={() => {
                  onSelectChapter(ch.num);
                  onClose();
                }}
                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors group ${
                  isSelected ? 'bg-lime text-ink font-semibold' : 'hover:bg-page-shade text-ink-2 hover:text-ink'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate pr-2">
                  <span className="w-4 flex items-center justify-center">
                    {ch.status === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-state-success" />}
                    {ch.status === 'attention' && <AlertCircle className="w-3.5 h-3.5 text-state-warning" />}
                    {ch.status === 'in_progress' && <Circle className="w-3.5 h-3.5 text-ink-3" />}
                  </span>
                  <span className="font-bold text-ink w-6">{ch.num}.</span>
                  <span className="font-sans font-medium text-sm text-ink group-hover:text-ink truncate">{ch.title}</span>
                  <span className="hidden sm:inline text-[11px] text-ink-3 font-sans truncate">— {ch.subtitle}</span>
                </div>

                {/* Dot leaders */}
                <div className="flex-1 mx-2 border-b border-dotted border-rule min-w-[20px] hidden sm:block"></div>

                <span className="font-mono text-[11px] text-ink-3 group-hover:text-ink whitespace-nowrap">{ch.pages}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-3 border-t border-rule flex items-center justify-between text-xs text-ink-3">
          <span>Keyboard: use <kbd className="px-1.5 py-0.5 bg-desk font-mono rounded border border-rule">←</kbd> <kbd className="px-1.5 py-0.5 bg-desk font-mono rounded border border-rule">→</kbd> to turn pages</span>
          <span className="font-semibold text-state-teal">Research & Quality Improvement Use Only</span>
        </div>
      </div>
    </div>
  );
};
