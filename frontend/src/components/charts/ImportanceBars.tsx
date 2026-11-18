import React from 'react';

interface PermutationItem {
  feature: string;
  mean_importance: number;
  std_importance: number;
  ci_lower: number;
  ci_upper: number;
}

interface ImportanceBarsProps {
  data: PermutationItem[] | undefined;
}

export const ImportanceBars: React.FC<ImportanceBarsProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-xs font-mono text-ink-3 p-4">Permutation feature importance not available.</div>;
  }

  const topFeatures = data.slice(0, 10);
  const maxImp = Math.max(...topFeatures.map(d => d.mean_importance), 0.05);

  return (
    <div className="space-y-3 font-sans border border-rule p-4 bg-page rounded-xs">
      <div className="flex items-center justify-between border-b border-rule pb-2">
        <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
          Permutation Feature Importance (AUROC Drop)
        </h4>
        <span className="text-[10px] font-mono text-ink-3">TEST SPLIT · 3x REPEATS</span>
      </div>

      <div className="space-y-2 pt-1">
        {topFeatures.map((item, idx) => {
          const widthPct = Math.min(100, (item.mean_importance / maxImp) * 100);

          return (
            <div key={idx} className="space-y-1 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono font-bold text-ink truncate max-w-[200px]" title={item.feature}>
                  {idx + 1}. {item.feature}
                </span>
                <span className="font-mono text-[10.5px] text-ink-2">
                  <strong className="text-ink">Δ AUROC {item.mean_importance.toFixed(4)}</strong>
                  <span className="text-ink-3 ml-1.5">(±{item.std_importance.toFixed(4)})</span>
                </span>
              </div>

              <div className="h-3.5 bg-page-shade border border-rule relative overflow-hidden rounded-xs">
                <div
                  className="h-full bg-ink transition-all duration-300"
                  style={{ width: `${Math.max(2, widthPct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
