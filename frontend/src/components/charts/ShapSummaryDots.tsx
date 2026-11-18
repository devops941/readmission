import React from 'react';
import { BeeswarmFeature } from '../../types';

interface ShapSummaryDotsProps {
  data: BeeswarmFeature[] | undefined;
}

export const ShapSummaryDots: React.FC<ShapSummaryDotsProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-xs font-mono text-ink-3 p-4">SHAP beeswarm distribution data not available.</div>;
  }

  // Calculate max absolute SHAP for symmetric axis
  let maxAbs = 0.15;
  data.forEach(f => {
    f.points?.forEach(p => {
      if (Math.abs(p.shap_val) > maxAbs) maxAbs = Math.abs(p.shap_val);
    });
  });

  return (
    <div className="space-y-4 font-sans border border-rule p-4 bg-page rounded-xs">
      <div className="flex items-center justify-between border-b border-rule pb-2">
        <div>
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
            Global Feature Impact (SHAP Beeswarm Summary)
          </h4>
          <span className="text-[10px] text-ink-3 font-mono">
            Sample of validation encounters · Points jittered vertically
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="text-risk-down">LOW VALUE</span>
          <div className="w-16 h-2 rounded-full bg-gradient-to-r from-risk-down via-lime to-risk-up" />
          <span className="text-risk-up">HIGH VALUE</span>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        {data.slice(0, 10).map((feat, fIdx) => {
          return (
            <div key={fIdx} className="grid grid-cols-12 gap-2 items-center text-xs hover:bg-page-shade/50 p-1 rounded">
              {/* Feature name & mean impact */}
              <div className="col-span-4 truncate pr-1">
                <span className="font-mono text-[11px] font-bold text-ink block truncate" title={feat.feature}>
                  {feat.feature}
                </span>
                <span className="font-mono text-[9.5px] text-ink-3 block">
                  mean |SHAP| = {feat.mean_abs_shap.toFixed(4)}
                </span>
              </div>

              {/* Beeswarm scatter track */}
              <div className="col-span-8 h-7 bg-page-shade border border-rule relative overflow-hidden rounded-xs">
                {/* Zero line */}
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-ink/30 z-10" />

                {/* Dots */}
                {(feat.points || []).map((pt, pIdx) => {
                  // Position from -maxAbs to +maxAbs mapped to 0% to 100%
                  const leftPct = ((pt.shap_val + maxAbs) / (2 * maxAbs)) * 100;
                  // Vertical jitter
                  const topOffset = 4 + (Math.sin(pIdx * 13) * 6 + 6);

                  // Color gradient from cool (low value) to hot (high value)
                  let dotColor = '#059669'; // low
                  if (pt.norm_val > 0.65) dotColor = '#E11D48'; // high
                  else if (pt.norm_val > 0.35) dotColor = '#D97706'; // mid

                  return (
                    <div
                      key={pIdx}
                      className="absolute w-2 h-2 rounded-full opacity-75 hover:opacity-100 hover:scale-150 transition-all pointer-events-auto"
                      style={{
                        left: `${Math.min(97, Math.max(3, leftPct))}%`,
                        top: `${topOffset}px`,
                        backgroundColor: dotColor
                      }}
                      title={`${feat.feature}: raw=${pt.raw_val}, SHAP=${pt.shap_val > 0 ? '+' : ''}${pt.shap_val.toFixed(3)}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between font-mono text-[10px] text-ink-3 pt-1 border-t border-rule/50">
        <span>◂ PUSHES RISK DOWN (PROTECTIVE)</span>
        <span>NO IMPACT (0.0)</span>
        <span>PUSHES RISK UP (ELEVATES RISK) ▸</span>
      </div>
    </div>
  );
};
