import React, { useState } from 'react';

interface ThresholdItem {
  threshold: number;
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  sensitivity: number;
  specificity: number;
  ppv: number;
  npv: number;
  f1: number;
  accuracy: number;
}

interface ThresholdSliderProps {
  metricsList: ThresholdItem[] | undefined;
}

export const ThresholdSlider: React.FC<ThresholdSliderProps> = ({ metricsList }) => {
  const [selectedThreshold, setSelectedThreshold] = useState<number>(0.20);

  if (!metricsList || metricsList.length === 0) {
    return <div className="text-xs font-mono text-ink-3 p-4">Threshold metrics not available.</div>;
  }

  // Find closest threshold
  const current = metricsList.reduce((prev, curr) => {
    return Math.abs(curr.threshold - selectedThreshold) < Math.abs(prev.threshold - selectedThreshold) ? curr : prev;
  }, metricsList[0]);

  return (
    <div className="space-y-4 font-sans border border-rule p-4 bg-page rounded-xs">
      <div className="flex items-center justify-between border-b border-rule pb-2">
        <div>
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
            Classification Threshold Analysis
          </h4>
          <span className="text-[10px] text-ink-3 font-mono italic">
            Research parameter only — not for automated clinical alert rules
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs font-bold bg-lime px-2 py-0.5 rounded text-ink">
          <span>Threshold:</span>
          <span>{current.threshold.toFixed(2)}</span>
        </div>
      </div>

      {/* Interactive slider */}
      <div className="space-y-1">
        <input
          type="range"
          min="0.05"
          max="0.90"
          step="0.05"
          value={selectedThreshold}
          onChange={(e) => setSelectedThreshold(parseFloat(e.target.value))}
          className="w-full accent-ink cursor-pointer"
        />
        <div className="flex justify-between font-mono text-[9.5px] text-ink-3">
          <span>0.05 (High Recall)</span>
          <span>0.20 (Default Research Cutoff)</span>
          <span>0.50 (Standard)</span>
          <span>0.90 (High Precision)</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        <div className="p-2.5 bg-page-shade border border-rule font-mono text-center">
          <span className="text-[10px] text-ink-3 block">Sensitivity (Recall)</span>
          <span className="text-sm font-bold text-ink">{(current.sensitivity * 100).toFixed(1)}%</span>
        </div>
        <div className="p-2.5 bg-page-shade border border-rule font-mono text-center">
          <span className="text-[10px] text-ink-3 block">Specificity</span>
          <span className="text-sm font-bold text-ink">{(current.specificity * 100).toFixed(1)}%</span>
        </div>
        <div className="p-2.5 bg-page-shade border border-rule font-mono text-center">
          <span className="text-[10px] text-ink-3 block">PPV (Precision)</span>
          <span className="text-sm font-bold text-ink">{(current.ppv * 100).toFixed(1)}%</span>
        </div>
        <div className="p-2.5 bg-page-shade border border-rule font-mono text-center">
          <span className="text-[10px] text-ink-3 block">F1 Score</span>
          <span className="text-sm font-bold text-ink">{current.f1.toFixed(3)}</span>
        </div>
      </div>

      {/* 2x2 Confusion Matrix */}
      <div className="pt-2">
        <span className="font-mono text-[10.5px] font-bold text-ink-2 uppercase tracking-wider block mb-1.5">
          Validation Cohort 2×2 Contingency Table
        </span>
        <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs">
          <div className="p-3 bg-state-success/10 border border-state-success/30 rounded-xs">
            <span className="text-[10px] text-state-success font-semibold block">True Positives (TP)</span>
            <span className="text-base font-bold text-ink">{current.tp.toLocaleString()}</span>
          </div>
          <div className="p-3 bg-risk-up/10 border border-risk-up/30 rounded-xs">
            <span className="text-[10px] text-risk-up font-semibold block">False Positives (FP)</span>
            <span className="text-base font-bold text-ink">{current.fp.toLocaleString()}</span>
          </div>
          <div className="p-3 bg-risk-up/10 border border-risk-up/30 rounded-xs">
            <span className="text-[10px] text-risk-up font-semibold block">False Negatives (FN)</span>
            <span className="text-base font-bold text-ink">{current.fn.toLocaleString()}</span>
          </div>
          <div className="p-3 bg-state-success/10 border border-state-success/30 rounded-xs">
            <span className="text-[10px] text-state-success font-semibold block">True Negatives (TN)</span>
            <span className="text-base font-bold text-ink">{current.tn.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
