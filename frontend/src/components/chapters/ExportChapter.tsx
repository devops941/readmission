import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Colophon } from '../book/Colophon';
import { FoldButton } from '../book/FoldButton';
import { Download, FileText, FileSpreadsheet, Printer, CheckSquare, ShieldCheck } from 'lucide-react';

export const ExportChapter: React.FC = () => {
  const { activeDataset, user } = useAuth();

  const [analystName, setAnalystName] = useState<string>(user?.full_name || 'Lead Quality Analyst');
  const [reviewerName, setReviewerName] = useState<string>('Dr. Sarah Mitchell, MD (Reviewer)');
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');

  const handleDownload = (format: 'pdf' | 'excel' | 'csv') => {
    if (!activeDataset) return;
    const url = api.getExportUrl(activeDataset.id, null, format);
    window.open(url, '_blank');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Left Page: Export Configuration & Sign-Off */}
      <div className="space-y-6">
        <div>
          <h3 className="font-serif text-2xl font-bold text-ink">Print this Quality Dossier</h3>
          <p className="text-xs text-ink-2 mt-1">
            Generate formal documentation packages with automated governance sign-off lines and audit records.
          </p>
        </div>

        {/* Chapter Checklist */}
        <div className="border border-rule p-4 bg-page space-y-3 font-mono text-xs">
          <span className="font-bold text-ink uppercase tracking-wider text-[11px] block">
            Chapters Included in Export Package
          </span>

          <div className="space-y-2 text-[11px]">
            {[
              'Ch. 0 Frontispiece (Study Overview & Numerals)',
              'Ch. 1 Intake Summary & Data Dictionary',
              'Ch. 2 Patterns (Wilson 95% CIs & Odds Ratios)',
              'Ch. 3 Prospective Discrimination & Reliability Calibration',
              'Ch. 4 SHAP Driver Attribution & Stability Indices',
              'Ch. 5 Subgroup Fairness Gaps (Small-Cell Suppressed)',
              'Ch. 6 Population Drift Strips & Automated Telemetry',
              'Ch. 7 Clinical Expert Review Notes & Sign-Offs',
            ].map((ch, idx) => (
              <div key={idx} className="flex items-center gap-2 text-ink-2">
                <CheckSquare className="w-3.5 h-3.5 text-state-success" />
                <span>{ch}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sign-off Fields */}
        <div className="p-4 bg-page-shade border border-rule space-y-3 font-sans">
          <span className="font-mono text-[11px] font-bold text-ink uppercase tracking-wider block">
            Formal Governance Sign-Off Lines
          </span>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[10.5px] font-mono text-ink-3 uppercase block mb-1">
                Lead Analytical Investigator
              </label>
              <input
                className="printed-field w-full text-xs font-semibold bg-page"
                value={analystName}
                onChange={(e) => setAnalystName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[10.5px] font-mono text-ink-3 uppercase block mb-1">
                Clinical Quality Committee Reviewer
              </label>
              <input
                className="printed-field w-full text-xs font-semibold bg-page"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Download Buttons */}
        <div className="pt-2 flex flex-wrap gap-3">
          <FoldButton onClick={() => handleDownload('pdf')}>
            <FileText className="w-4 h-4" />
            <span>Download PDF Dossier</span>
          </FoldButton>

          <FoldButton variant="outline" onClick={() => handleDownload('excel')}>
            <FileSpreadsheet className="w-4 h-4 text-state-success" />
            <span>Export Multi-Sheet Excel</span>
          </FoldButton>

          <FoldButton variant="outline" onClick={() => handleDownload('csv')}>
            <Download className="w-4 h-4 text-state-teal" />
            <span>Export Clean CSV</span>
          </FoldButton>
        </div>
      </div>

      {/* Right Page: Auto-Filled Colophon & Research Caveat */}
      <div className="space-y-5">
        <Colophon
          datasetName={activeDataset?.name}
          totalEncounters={activeDataset?.row_count}
          activeModelName="Gradient Boosting Ensemble (Isotonic Calibrated)"
        />

        <div className="p-4 bg-page-shade border border-rule space-y-3 text-xs font-sans">
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-ink uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-state-teal" />
            <span>Colophon Provenance & Reproducibility</span>
          </div>
          <p className="text-ink-2 leading-relaxed">
            All tables, figures, calibration deciles, and SHAP attribution values in this report are mathematically reproducible via the seeded dataset and fixed random state (42).
          </p>
        </div>
      </div>
    </div>
  );
};
