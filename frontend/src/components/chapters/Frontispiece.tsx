import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { FoldButton } from '../book/FoldButton';
import { HighlightMark } from '../book/HighlightMark';
import { ArrowRight, FileText, ShieldAlert, Sparkles, Database } from 'lucide-react';

interface FrontispieceProps {
  onOpenChapter: (chapterNum: number) => void;
  onOpenUpload: () => void;
}

export const Frontispiece: React.FC<FrontispieceProps> = ({ onOpenChapter, onOpenUpload }) => {
  const { activeDataset, user } = useAuth();

  const totalCount = activeDataset?.row_count || 12000;
  const readmitRate = activeDataset?.readmit_rate ?? 32.2;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Left Page: Title & Study Narrative */}
      <div className="space-y-6">
        <div className="inline-block px-2.5 py-1 bg-lime text-ink font-mono text-[11px] font-bold uppercase tracking-wider rounded-xs">
          HOSPITAL QUALITY RESEARCH DOSSIER · VOL. 2026
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl text-ink font-bold tracking-tight leading-tight">
          ReadmitExplain <span className="italic font-normal text-ink-2">AI</span>
        </h1>

        <p className="font-serif text-lg text-ink-2 italic leading-relaxed">
          Explainable Hospital Readmission Pattern & Risk Analysis Platform
        </p>

        {/* Giant Inline Numerals */}
        <div className="p-5 bg-page-shade border border-rule space-y-3 font-sans">
          <p className="text-sm text-ink-2 leading-relaxed">
            The study archive currently holds{' '}
            <span className="font-serif text-3xl font-bold text-ink inline-block mx-1">
              {totalCount.toLocaleString()}
            </span>{' '}
            de-identified adult inpatient encounters. Across this historical population,{' '}
            <HighlightMark variant="lime">
              <span className="font-serif text-2xl font-bold text-ink">
                {readmitRate.toFixed(1)}%
              </span>{' '}
              were readmitted within 30 days
            </HighlightMark>{' '}
            of acute discharge.
          </p>

          <div className="text-[11px] font-mono text-ink-3 pt-2 border-t border-rule/60 flex items-center justify-between">
            <span>ACTIVE STUDY: {activeDataset?.name || 'General Hospital Cohort'}</span>
            <span className="text-state-teal font-semibold">LEAKAGE-SAFE DESIGN</span>
          </div>
        </div>

        <div className="space-y-2 text-xs text-ink-2 leading-relaxed font-sans">
          <p>
            Hospitals seek transparent clarity on <strong>who returns within 30 days and why</strong> without
            treating machine learning models as automated clinical arbiters. ReadmitExplain AI provides transparent
            population-level pattern analysis, probability calibration, SHAP driver attribution, demographic disparity
            audits, and formalized clinical expert review workflows.
          </p>
        </div>

        {/* Disclaimer Callout Box */}
        <div className="p-3.5 bg-page border-l-2 border-state-warning text-[11px] font-mono text-ink-2 space-y-1">
          <div className="font-bold text-ink flex items-center gap-1.5 uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5 text-state-warning" />
            <span>Research & Quality Improvement Use Only</span>
          </div>
          <p className="text-ink-3 italic">
            Operates exclusively on de-identified historical records. Explanations represent statistical associations,
            not clinical causation. Strictly not intended for individual real-time patient decision making.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <FoldButton onClick={() => onOpenChapter(1)}>
            <span>Open Chapter 1: Intake</span>
            <ArrowRight className="w-4 h-4" />
          </FoldButton>
          <FoldButton variant="outline" onClick={onOpenUpload}>
            <Database className="w-4 h-4 text-state-teal" />
            <span>Upload New Dataset</span>
          </FoldButton>
        </div>
      </div>

      {/* Right Page: Dot-Leader Table of Contents */}
      <div className="space-y-5">
        <div className="flex items-center justify-between border-b border-rule pb-2">
          <h3 className="font-serif text-2xl font-bold text-ink">Contents of the Dossier</h3>
          <span className="font-mono text-xs text-ink-3 uppercase">PAGES 1–28</span>
        </div>

        <p className="text-xs text-ink-2 font-sans italic">
          Click any chapter below or use the lime bookmark ribbon at the top of the gutter to jump directly to any page spread.
        </p>

        <div className="space-y-2.5 font-mono text-xs">
          {[
            { num: 1, title: 'Intake & Ledger', sub: 'Data Import, PHI Scanner & In-App Entry', pp: 'pp. 3–6' },
            { num: 2, title: 'Patterns', sub: 'Wilson 95% CIs, Trends & Multivariable Regression', pp: 'pp. 7–10' },
            { num: 3, title: 'Models & Calibration', sub: 'Tree Ensembles, Brier, ECE & Decision Curves', pp: 'pp. 11–14' },
            { num: 4, title: 'Explanations (SHAP)', sub: 'Beeswarm, Permutation, PDP & Waterfall', pp: 'pp. 15–18' },
            { num: 5, title: 'Subgroups & Fairness', sub: 'Demographic Gaps & Small-Cell Suppression', pp: 'pp. 19–20' },
            { num: 6, title: 'Monitoring & Drift', sub: 'Monthly PSI Strips, KS Tests & Alerts', pp: 'pp. 21–22' },
            { num: 7, title: 'Clinical Review', sub: 'Expert Governance & Margin Annotations', pp: 'pp. 23–24' },
            { num: 8, title: 'Export & Colophon', sub: 'Printable Book, PDF/Excel & Methodology', pp: 'pp. 25–26' },
            { num: 9, title: 'Appendix', sub: 'User Accounts, Audit Log & Diagnostics', pp: 'pp. 27–28' },
          ].map((item) => (
            <div
              key={item.num}
              onClick={() => onOpenChapter(item.num)}
              className="flex items-center justify-between p-2 rounded hover:bg-page-shade cursor-pointer group transition-colors"
            >
              <div className="flex items-center gap-2 truncate pr-2">
                <span className="font-bold text-ink w-5">{item.num}.</span>
                <span className="font-sans font-bold text-ink group-hover:text-ink">{item.title}</span>
                <span className="hidden sm:inline text-[11px] text-ink-3 font-sans truncate">— {item.sub}</span>
              </div>
              <div className="flex-1 mx-2 border-b border-dotted border-rule hidden sm:block" />
              <span className="text-[11px] text-ink-3 group-hover:text-ink font-semibold">{item.pp}</span>
            </div>
          ))}
        </div>

        {/* Quick Start Guidance */}
        <div className="p-4 bg-page-shade border border-rule space-y-2 text-xs font-sans">
          <span className="font-mono text-[10.5px] font-bold text-ink uppercase tracking-wider block">
            Reader Guidance
          </span>
          <p className="text-ink-2 leading-relaxed">
            Signed in as <strong>{user?.full_name || 'Healthcare Quality Analyst'}</strong> ({user?.role || 'Analyst'}).
            All analyses update dynamically when switching cohorts or datasets.
          </p>
        </div>
      </div>
    </div>
  );
};
