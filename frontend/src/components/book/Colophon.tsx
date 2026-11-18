import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface ColophonProps {
  datasetName?: string;
  totalEncounters?: number;
  activeModelName?: string;
  seed?: number;
  splitInfo?: string;
}

export const Colophon: React.FC<ColophonProps> = ({
  datasetName = 'General Hospital Inpatient Cohort',
  totalEncounters = 12000,
  activeModelName = 'Gradient Boosting Classifier (Isotonic Calibrated)',
  seed = 42,
  splitInfo = 'Time-based (Months 1–18 train, 19–21 calib, 22–24 test)'
}) => {
  return (
    <div className="border border-rule bg-page-shade p-5 font-mono text-xs text-ink-2 space-y-3">
      <div className="flex items-center gap-2 text-ink font-bold border-b border-rule pb-2">
        <ShieldAlert className="w-4 h-4 text-state-warning" />
        <span className="uppercase tracking-wider">Methodological Colophon & Audit Metadata</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
        <div><strong className="text-ink">Dataset:</strong> {datasetName} ({totalEncounters.toLocaleString()} encounters)</div>
        <div><strong className="text-ink">Model Architecture:</strong> {activeModelName}</div>
        <div><strong className="text-ink">Split Strategy:</strong> {splitInfo}</div>
        <div><strong className="text-ink">Fixed Random Seed:</strong> {seed} (reproducible bootstrap)</div>
        <div><strong className="text-ink">Engine:</strong> Python 3.12, scikit-learn, statsmodels, shap, PyMongo</div>
        <div><strong className="text-ink">Privacy Standard:</strong> De-identified historical cohort with small-cell suppression (n &lt; 20)</div>
      </div>

      <div className="pt-2 border-t border-rule text-[10px] text-ink-3 italic leading-relaxed">
        Research and quality-improvement use only. Population-level patterns for expert clinical review.
        Explanations show statistical association, not medical causation. Strictly not intended for individual real-time patient triage.
      </div>
    </div>
  );
};
