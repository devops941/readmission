import React from 'react';
import { CrosstabResult } from '../../types';

interface AgeDxHeatmapProps {
  data: CrosstabResult | null;
}

export const AgeDxHeatmap: React.FC<AgeDxHeatmapProps> = ({ data }) => {
  if (!data || !data.matrix || data.matrix.length === 0) {
    return <div className="text-xs font-mono text-ink-3 p-4">Cross-tabulation matrix not available.</div>;
  }

  // Get color for rate (NO BLUE: using warm lime to deep amber/coral)
  const getCellBg = (rate: number | null, suppressed: boolean) => {
    if (suppressed || rate === null) return '';
    if (rate >= 0.35) return 'bg-risk-up/25 text-risk-up font-bold';
    if (rate >= 0.25) return 'bg-state-warning/20 text-state-warning font-semibold';
    if (rate >= 0.15) return 'bg-lime/40 text-ink';
    return 'bg-state-success/15 text-state-success';
  };

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between border-b border-rule pb-2">
        <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
          Two-Way Matrix: {data.row_variable} × {data.col_variable}
        </h4>
        <span className="text-[10px] font-mono text-ink-3">HATCHED: SMALL CELL SUPPRESSED (&lt; 20)</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-rule text-xs">
          <thead>
            <tr className="bg-page-shade border-b border-rule">
              <th className="p-2 text-left font-mono text-[11px] text-ink-2 uppercase border-r border-rule">
                {data.row_variable}
              </th>
              {data.col_categories.map((col, idx) => (
                <th key={idx} className="p-2 text-center font-mono text-[10.5px] text-ink uppercase border-r border-rule last:border-r-0 max-w-[120px] truncate" title={col}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.matrix.map((rowCells, rIdx) => {
              const rowLabel = data.row_categories[rIdx] || `Row ${rIdx}`;
              return (
                <tr key={rIdx} className="border-b border-rule last:border-b-0 hover:bg-page-shade/50">
                  <td className="p-2 font-mono text-[11px] font-semibold text-ink border-r border-rule bg-page-shade/40 whitespace-nowrap">
                    {rowLabel}
                  </td>
                  {rowCells.map((cell, cIdx) => {
                    const isSupp = cell.suppressed;
                    return (
                      <td
                        key={cIdx}
                        className={`p-2.5 text-center border-r border-rule last:border-r-0 transition-colors ${
                          isSupp ? 'hatched-cell' : getCellBg(cell.rate, isSupp)
                        }`}
                        title={isSupp ? "Small cell (n < 20) suppressed" : `n=${cell.n}, events=${cell.events}`}
                      >
                        {isSupp ? (
                          <span className="font-mono text-[10px] text-ink-3 font-normal">—</span>
                        ) : (
                          <div className="font-mono">
                            <span className="font-bold text-[12px] block">
                              {cell.rate !== null ? `${(cell.rate * 100).toFixed(1)}%` : '—'}
                            </span>
                            <span className="text-[9.5px] text-ink-3 block">
                              {cell.events}/{cell.n}
                            </span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
