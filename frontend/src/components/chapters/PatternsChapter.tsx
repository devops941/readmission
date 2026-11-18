import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { RateBars } from '../charts/RateBars';
import { TrendLine } from '../charts/TrendLine';
import { AgeDxHeatmap } from '../charts/AgeDxHeatmap';
import { OddsForest } from '../charts/OddsForest';
import { HighlightMark } from '../book/HighlightMark';
import { FoldButton } from '../book/FoldButton';
import { RateItem, TrendItem, CrosstabResult, RegressionResult } from '../../types';
import { Sparkles, ArrowRight, Filter } from 'lucide-react';

interface PatternsChapterProps {
  onNextChapter: () => void;
}

export const PatternsChapter: React.FC<PatternsChapterProps> = ({ onNextChapter }) => {
  const { activeDataset } = useAuth();

  // View words switcher
  const [viewMode, setViewMode] = useState<'RATES' | 'TREND' | 'CROSS-TAB' | 'ODDS RATIOS'>('RATES');
  const [groupBy, setGroupBy] = useState<string>('primary_dx_group');

  // Filter sentence state
  const [ageFilter, setAgeFilter] = useState<string>('all');
  const [dxFilter, setDxFilter] = useState<string>('all');
  const [dispFilter, setDispFilter] = useState<string>('all');

  // Data states
  const [ratesData, setRatesData] = useState<RateItem[]>([]);
  const [trendData, setTrendData] = useState<TrendItem[]>([]);
  const [crosstabData, setCrosstabData] = useState<CrosstabResult | null>(null);
  const [regressionData, setRegressionData] = useState<RegressionResult | null>(null);
  const [findings, setFindings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!activeDataset) return;
    loadAllPatterns();
  }, [activeDataset, groupBy]);

  const loadAllPatterns = async () => {
    if (!activeDataset) return;
    setLoading(true);
    try {
      const [r, t, c, reg, f] = await Promise.all([
        api.getRates(activeDataset.id, groupBy),
        api.getTrends(activeDataset.id),
        api.getCrosstab(activeDataset.id, 'age_band', 'primary_dx_group'),
        api.getRegression(activeDataset.id),
        api.getFindings(activeDataset.id)
      ]);
      setRatesData(r || []);
      setTrendData(t || []);
      setCrosstabData(c);
      setRegressionData(reg);
      setFindings(f || []);
    } catch (e) {
      console.error('Failed to load patterns:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Left Page: Interactive Filter Sentence & Natural Language Findings */}
      <div className="space-y-6">
        <div>
          <h3 className="font-serif text-2xl font-bold text-ink">Population Readmission Patterns</h3>
          <p className="text-xs text-ink-2 mt-1">
            Descriptive unadjusted and multivariable epidemiological patterns across de-identified encounters.
          </p>
        </div>

        {/* Filter Sentence */}
        <div className="p-4 bg-page-shade border border-rule font-serif text-base text-ink leading-relaxed space-y-3">
          <div className="text-[11px] font-mono uppercase tracking-wider text-ink-3 font-semibold flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-state-teal" />
            <span>Interactive Cohort Scope</span>
          </div>

          <p>
            Show readmission patterns for patients aged{' '}
            <select
              className="printed-field font-sans text-xs font-bold bg-page px-1 py-0.5 mx-1"
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
            >
              <option value="all">[All Ages]</option>
              <option value="older">[Age ≥ 65 Years]</option>
              <option value="younger">[Age &lt; 65 Years]</option>
            </select>{' '}
            admitted for{' '}
            <select
              className="printed-field font-sans text-xs font-bold bg-page px-1 py-0.5 mx-1"
              value={dxFilter}
              onChange={(e) => setDxFilter(e.target.value)}
            >
              <option value="all">[All Primary Diagnoses]</option>
              <option value="Circulatory">[Circulatory / Cardiac]</option>
              <option value="Respiratory">[Respiratory / Pulmonary]</option>
              <option value="Digestive">[Digestive / GI]</option>
              <option value="Diabetes/Endocrine">[Diabetes / Endocrine]</option>
            </select>{' '}
            and discharged to{' '}
            <select
              className="printed-field font-sans text-xs font-bold bg-page px-1 py-0.5 mx-1"
              value={dispFilter}
              onChange={(e) => setDispFilter(e.target.value)}
            >
              <option value="all">[Any Destination]</option>
              <option value="Home">[Home Independent]</option>
              <option value="Home Health">[Home Health Agency]</option>
              <option value="SNF/Rehab">[Skilled Nursing Facility (SNF)]</option>
            </select>
            .
          </p>
        </div>

        {/* Auto-Written Narrative Findings */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-ink-3 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-state-warning" />
            <span>Empirical Findings (Wilson 95% CIs)</span>
          </div>

          <div className="space-y-3 font-sans text-xs">
            {findings.map((f, i) => (
              <div key={i} className="p-3 bg-page border border-rule space-y-1 rounded-xs">
                <span className="text-[10px] font-mono text-state-teal uppercase font-bold block">
                  {f.category}
                </span>
                <p className="text-ink-2 leading-relaxed">
                  {f.lead},{' '}
                  <HighlightMark variant={i === 1 ? 'coral' : i === 2 ? 'emerald' : 'lime'}>
                    {f.highlight}
                  </HighlightMark>{' '}
                  <span className="font-mono text-[10.5px] text-ink-3">({f.ci_text})</span>.
                </p>
                <p className="text-[11px] text-ink-3 italic">{f.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <FoldButton onClick={onNextChapter}>
            <span>Next: Chapter 3 · Models</span>
            <ArrowRight className="w-4 h-4" />
          </FoldButton>
        </div>
      </div>

      {/* Right Page: Evidence Visualizations with View Words Switcher */}
      <div className="space-y-5">
        {/* Small-Caps View Switcher Written as Words */}
        <div className="flex items-center justify-between border-b border-rule pb-2 font-mono text-xs">
          <div className="flex items-center gap-2">
            {(['RATES', 'TREND', 'CROSS-TAB', 'ODDS RATIOS'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-2.5 py-1 rounded transition-colors uppercase font-bold ${
                  viewMode === mode
                    ? 'bg-ink text-lime'
                    : 'text-ink-2 hover:bg-page-shade'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Group-by selector for RATES */}
          {viewMode === 'RATES' && (
            <select
              className="printed-field text-[11px] font-mono text-ink bg-page"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
            >
              <option value="primary_dx_group">By Diagnosis</option>
              <option value="discharge_disposition">By Disposition</option>
              <option value="insurance">By Insurance</option>
              <option value="age_band">By Age Band</option>
              <option value="admission_type">By Admission</option>
            </select>
          )}
        </div>

        {/* Dynamic Evidence Container */}
        {loading ? (
          <div className="h-72 flex items-center justify-center font-mono text-xs text-ink-3">
            Recalculating rates and confidence intervals...
          </div>
        ) : (
          <div className="bg-page border border-rule p-4 rounded-xs">
            {viewMode === 'RATES' && <RateBars data={ratesData} title={`Readmission Rates by ${groupBy}`} />}
            {viewMode === 'TREND' && <TrendLine data={trendData} />}
            {viewMode === 'CROSS-TAB' && <AgeDxHeatmap data={crosstabData} />}
            {viewMode === 'ODDS RATIOS' && <OddsForest data={regressionData} />}
          </div>
        )}

        <div className="p-3 bg-page-shade border border-rule text-[11px] font-mono text-ink-3 italic">
          Wilson score intervals provide asymmetric coverage guaranteed to respect the [0, 1] probability boundary, avoiding Gaussian Wald approximation collapse on small cells.
        </div>
      </div>
    </div>
  );
};
