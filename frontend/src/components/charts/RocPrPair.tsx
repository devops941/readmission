import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { ModelMetrics } from '../../types';

interface RocPrPairProps {
  metrics: ModelMetrics | null;
  baselinePrevalence?: number;
}

export const RocPrPair: React.FC<RocPrPairProps> = ({ metrics, baselinePrevalence = 0.18 }) => {
  if (!metrics || !metrics.roc_curve) {
    return <div className="text-xs font-mono text-ink-3 p-4">Model discrimination curves not available.</div>;
  }

  const rocData = metrics.roc_curve.map(p => ({
    fpr: Number((p.fpr * 100).toFixed(1)),
    tpr: Number((p.tpr * 100).toFixed(1)),
    diagonal: Number((p.fpr * 100).toFixed(1))
  }));

  const prData = (metrics.pr_curve || []).map(p => ({
    recall: Number((p.recall * 100).toFixed(1)),
    precision: Number((p.precision * 100).toFixed(1))
  }));

  return (
    <div className="space-y-4 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ROC Curve */}
        <div className="border border-rule p-3 bg-page rounded-xs space-y-2">
          <div className="flex items-center justify-between border-b border-rule pb-1.5">
            <span className="font-mono text-xs font-bold text-ink">ROC Discrimination</span>
            <span className="font-mono text-xs font-bold bg-lime px-1.5 py-0.5 rounded text-ink">
              AUROC {metrics.auroc.toFixed(3)}
            </span>
          </div>
          <div className="text-[10px] font-mono text-ink-3">
            95% Bootstrap CI: [{metrics.auroc_ci?.[0]?.toFixed(3) || '—'} – {metrics.auroc_ci?.[1]?.toFixed(3) || '—'}]
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E1E0" />
                <XAxis dataKey="fpr" stroke="#8A8A96" tick={{ fontSize: 9, fontFamily: 'Martian Mono' }} unit="%" />
                <YAxis dataKey="tpr" stroke="#8A8A96" tick={{ fontSize: 9, fontFamily: 'Martian Mono' }} unit="%" domain={[0, 100]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-page border border-ink p-2 font-mono text-[11px] shadow-sm">
                          <div>FPR (1 - Specificity): {d.fpr}%</div>
                          <div>TPR (Sensitivity): {d.tpr}%</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine stroke="#8A8A96" strokeDasharray="4 4" segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]} />
                <Line type="monotone" dataKey="tpr" stroke="#0B0B10" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PR Curve */}
        <div className="border border-rule p-3 bg-page rounded-xs space-y-2">
          <div className="flex items-center justify-between border-b border-rule pb-1.5">
            <span className="font-mono text-xs font-bold text-ink">Precision-Recall (PR)</span>
            <span className="font-mono text-xs font-bold bg-page-shade border border-rule px-1.5 py-0.5 rounded text-ink">
              AUPRC {metrics.auprc.toFixed(3)}
            </span>
          </div>
          <div className="text-[10px] font-mono text-ink-3">
            95% Bootstrap CI: [{metrics.auprc_ci?.[0]?.toFixed(3) || '—'} – {metrics.auprc_ci?.[1]?.toFixed(3) || '—'}]
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={prData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E1E0" />
                <XAxis dataKey="recall" stroke="#8A8A96" tick={{ fontSize: 9, fontFamily: 'Martian Mono' }} unit="%" />
                <YAxis dataKey="precision" stroke="#8A8A96" tick={{ fontSize: 9, fontFamily: 'Martian Mono' }} unit="%" domain={[0, 100]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-page border border-ink p-2 font-mono text-[11px] shadow-sm">
                          <div>Recall: {d.recall}%</div>
                          <div>Precision (PPV): {d.precision}%</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={baselinePrevalence * 100} stroke="#D97706" strokeDasharray="4 4" label={{ value: 'Prevalence', fill: '#D97706', fontSize: 9 }} />
                <Line type="monotone" dataKey="precision" stroke="#059669" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
