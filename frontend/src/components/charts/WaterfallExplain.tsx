import React from 'react';
import { LocalWaterfallItem } from '../../types';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface WaterfallExplainProps {
  encounterId: string;
  predictedRisk: number;
  baseValue: number;
  waterfall: LocalWaterfallItem[];
  narrative?: string;
}

export const WaterfallExplain: React.FC<WaterfallExplainProps> = ({
  encounterId,
  predictedRisk,
  baseValue,
  waterfall,
  narrative
}) => {
  return (
    <div className="space-y-4 font-sans border border-rule p-4 bg-page rounded-xs">
      <div className="flex items-center justify-between border-b border-rule pb-2">
        <div>
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
            SHAP Waterfall: Encounter {encounterId}
          </h4>
          <span className="text-[10px] text-ink-3 font-mono">
            Additive contribution from base reference rate to model risk estimate
          </span>
        </div>
        <div className="text-right font-mono text-xs">
          <span className="text-ink-3 text-[10px] block">FINAL ESTIMATE</span>
          <span className="font-bold text-base text-ink bg-lime px-2 py-0.5 rounded">
            {(predictedRisk * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {narrative && (
        <div className="p-3 bg-page-shade border-l-2 border-ink text-xs font-sans text-ink-2 italic leading-relaxed">
          {narrative}
        </div>
      )}

      {/* Waterfall steps */}
      <div className="space-y-2 pt-1 font-mono text-xs">
        {/* Base value step */}
        <div className="flex items-center justify-between p-2 bg-page-shade border border-rule">
          <span className="font-semibold text-ink-2">E[f(x)] Baseline Population Rate</span>
          <span className="font-bold text-ink">{(baseValue * 100).toFixed(1)}%</span>
        </div>

        {/* Feature contribution steps */}
        <div className="space-y-1.5 pl-2 border-l-2 border-rule">
          {waterfall.map((item, idx) => {
            const isUp = item.direction === 'UP';
            const contribPct = (item.contribution * 100);

            return (
              <div
                key={idx}
                className="flex items-center justify-between p-1.5 hover:bg-page-shade/60 rounded text-[11.5px] transition-colors"
              >
                <div className="flex items-center gap-1.5 truncate max-w-[220px]">
                  {isUp ? (
                    <ArrowUp className="w-3.5 h-3.5 text-risk-up flex-shrink-0" />
                  ) : (
                    <ArrowDown className="w-3.5 h-3.5 text-risk-down flex-shrink-0" />
                  )}
                  <span className="font-semibold text-ink truncate" title={item.feature}>
                    {item.feature}
                  </span>
                  <span className="text-[10px] text-ink-3">
                    ({item.feature_value})
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`font-bold ${isUp ? 'text-risk-up' : 'text-risk-down'}`}>
                    {isUp ? '+' : ''}{contribPct.toFixed(2)}%
                  </span>
                  <span className="text-[10px] text-ink-3 w-12 text-right">
                    → {(item.cumulative * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Final output */}
        <div className="flex items-center justify-between p-2 bg-ink text-page font-bold">
          <span>f(x) Model Risk Estimate</span>
          <span className="text-lime text-sm">{(predictedRisk * 100).toFixed(1)}%</span>
        </div>
      </div>

      <div className="text-[10px] font-mono text-ink-3 italic pt-1 border-t border-rule/50">
        Additivity verified: Baseline + ∑(SHAP attribution) = {(predictedRisk * 100).toFixed(1)}%. Shows statistical association, not medical causation.
      </div>
    </div>
  );
};
