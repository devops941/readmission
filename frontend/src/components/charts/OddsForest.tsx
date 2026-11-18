import React from 'react';
import { RegressionResult } from '../../types';

interface OddsForestProps {
  data: RegressionResult | null;
}

export const OddsForest: React.FC<OddsForestProps> = ({ data }) => {
  if (!data || !data.terms || data.terms.length === 0) {
    return <div className="text-xs font-mono text-ink-3 p-4">Multivariable logistic regression results not available.</div>;
  }

  // Filter out constant term
  const terms = data.terms.filter(t => t.term !== 'const');
  const maxOr = Math.max(...terms.map(t => Math.min(t.ci_upper, 4.0)), 2.5);

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between border-b border-rule pb-2">
        <div>
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
            Multivariable Odds Ratios (statsmodels Logit)
          </h4>
          <span className="text-[10px] text-ink-3 font-mono">
            N = {data.n_observations.toLocaleString()} · Pseudo R² = {data.pseudo_r2.toFixed(3)} · AIC = {data.aic.toFixed(0)}
          </span>
        </div>
        <span className="text-[10px] font-mono text-ink-3">REF = 1.0 · 95% WALD CI</span>
      </div>

      <div className="space-y-2 pt-1 max-h-72 overflow-y-auto pr-1">
        {terms.map((t, idx) => {
          const isRiskUp = t.odds_ratio > 1.0;
          const isSig = t.is_significant;
          
          // Position relative to maxOr
          const orPercent = Math.min(100, Math.max(0, (t.odds_ratio / maxOr) * 100));
          const lowPercent = Math.min(100, Math.max(0, (t.ci_lower / maxOr) * 100));
          const highPercent = Math.min(100, Math.max(0, (t.ci_upper / maxOr) * 100));
          const neutralPercent = (1.0 / maxOr) * 100;

          return (
            <div key={idx} className="space-y-1 text-xs hover:bg-page-shade/40 p-1 rounded">
              <div className="flex items-center justify-between text-[11px]">
                <span className={`font-mono truncate max-w-[200px] ${isSig ? 'font-bold text-ink' : 'text-ink-2'}`} title={t.term}>
                  {t.term}
                </span>
                <span className="font-mono text-[10.5px]">
                  <strong className={isRiskUp ? 'text-risk-up' : 'text-risk-down'}>
                    OR {t.odds_ratio.toFixed(2)}
                  </strong>
                  <span className="text-ink-3 ml-1.5">
                    [{t.ci_lower.toFixed(2)}–{t.ci_upper.toFixed(2)}] · p={t.p_value < 0.001 ? '<0.001' : t.p_value.toFixed(3)}
                  </span>
                </span>
              </div>

              {/* Forest plot bar line */}
              <div className="h-4 bg-page-shade border border-rule relative overflow-hidden rounded-xs">
                {/* Neutral line at OR=1.0 */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-ink-3/40 z-10"
                  style={{ left: `${neutralPercent}%` }}
                />

                {/* CI interval horizontal bar */}
                <div
                  className={`absolute top-1.5 bottom-1.5 rounded-full ${isRiskUp ? 'bg-risk-up/30' : 'bg-risk-down/30'}`}
                  style={{
                    left: `${lowPercent}%`,
                    width: `${Math.max(2, highPercent - lowPercent)}%`
                  }}
                />

                {/* Point estimate dot */}
                <div
                  className={`absolute top-1 w-2 h-2 rounded-full -ml-1 ${isRiskUp ? 'bg-risk-up' : 'bg-risk-down'}`}
                  style={{ left: `${orPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
