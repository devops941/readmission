import React from 'react';
import { RateItem } from '../../types';

interface RateBarsProps {
  data: RateItem[];
  title?: string;
}

export const RateBars: React.FC<RateBarsProps> = ({ data, title = 'Readmission Rates by Group (Wilson 95% CI)' }) => {
  if (!data || data.length === 0) {
    return <div className="text-xs font-mono text-ink-3 p-4">No data available for group breakdown.</div>;
  }

  const maxRate = Math.max(...data.map(d => (d.ci_upper || d.rate || 0.1)), 0.35);

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between border-b border-rule pb-2">
        <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-ink">{title}</h4>
        <span className="text-[10px] font-mono text-ink-3">WHISKERS: WILSON 95% CI</span>
      </div>

      <div className="space-y-2 pt-1">
        {data.map((item, idx) => {
          const rateVal = item.rate ?? 0;
          const ratePct = rateVal * 100;
          const barWidth = `${Math.min(100, (rateVal / maxRate) * 100)}%`;
          
          const ciLowPct = (item.ci_lower ?? rateVal) * 100;
          const ciHighPct = (item.ci_upper ?? rateVal) * 100;
          const whiskerLeft = `${(ciLowPct / (maxRate * 100)) * 100}%`;
          const whiskerRight = `${(ciHighPct / (maxRate * 100)) * 100}%`;

          return (
            <div key={idx} className="space-y-1 text-xs">
              <div className="flex items-center justify-between text-[11.5px]">
                <span className="font-medium text-ink truncate max-w-[220px]" title={item.category}>
                  {item.category}
                </span>
                <span className="font-mono text-ink-2">
                  {item.suppressed ? (
                    <span className="text-ink-3 italic">Suppressed (n &lt; 20)</span>
                  ) : (
                    <span>
                      <strong className="text-ink font-bold">{ratePct.toFixed(1)}%</strong>
                      <span className="text-[10px] text-ink-3 ml-1.5">
                        [{ciLowPct.toFixed(1)}–{ciHighPct.toFixed(1)}%] · n={item.n.toLocaleString()}
                      </span>
                    </span>
                  )}
                </span>
              </div>

              {/* Bar track */}
              <div className="h-4 bg-page-shade border border-rule relative overflow-hidden rounded-xs">
                {item.suppressed ? (
                  <div className="w-full h-full hatched-cell flex items-center justify-center text-[9px] font-mono text-ink-3">
                    SMALL CELL SUPPRESSED
                  </div>
                ) : (
                  <>
                    <div
                      className="h-full bg-ink transition-all duration-300"
                      style={{ width: barWidth }}
                    />
                    {/* Wilson CI Whisker line */}
                    {item.ci_lower !== undefined && item.ci_upper !== undefined && (
                      <div
                        className="absolute top-0 bottom-0 border-t-2 border-b-2 border-lime pointer-events-none"
                        style={{
                          left: whiskerLeft,
                          width: `calc(${whiskerRight} - ${whiskerLeft})`
                        }}
                      >
                        <div className="w-0.5 h-full bg-lime mx-auto" />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
