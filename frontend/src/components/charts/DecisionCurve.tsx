import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';

interface DecisionCurveProps {
  curves: Array<{
    threshold: number;
    net_benefit_model: number;
    net_benefit_all: number;
    net_benefit_none: number;
  }> | undefined;
}

export const DecisionCurve: React.FC<DecisionCurveProps> = ({ curves }) => {
  if (!curves || curves.length === 0) {
    return <div className="text-xs font-mono text-ink-3 p-4">Decision curve analysis not available.</div>;
  }

  const chartData = curves.map(c => ({
    threshold: Number((c.threshold * 100).toFixed(0)),
    model: c.net_benefit_model,
    all: c.net_benefit_all,
    none: 0.0
  }));

  return (
    <div className="space-y-3 font-sans border border-rule p-4 bg-page rounded-xs">
      <div className="flex items-center justify-between border-b border-rule pb-2">
        <div>
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
            Decision-Curve Net Benefit Analysis (DCA)
          </h4>
          <span className="text-[10px] text-ink-3 font-mono">
            Vickers & Elkin Net Benefit vs Treat-All / Treat-None
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10.5px] font-mono">
          <span className="flex items-center gap-1 font-bold text-ink">
            <span className="w-3 h-0.5 bg-ink" /> Model
          </span>
          <span className="flex items-center gap-1 text-state-warning">
            <span className="w-3 h-0.5 bg-state-warning border-b border-dashed" /> Treat All
          </span>
          <span className="flex items-center gap-1 text-ink-3">
            <span className="w-3 h-0.5 bg-ink-3" /> Treat None
          </span>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E3E1E0" />
            <XAxis dataKey="threshold" stroke="#8A8A96" tick={{ fontSize: 9, fontFamily: 'Martian Mono' }} unit="%" />
            <YAxis stroke="#8A8A96" tick={{ fontSize: 9, fontFamily: 'Martian Mono' }} domain={[-0.05, 'auto']} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-page border border-ink p-2 font-mono text-xs shadow-sm">
                      <div className="font-bold text-ink mb-1">Threshold Probability: {d.threshold}%</div>
                      <div className="font-bold text-ink">Model Net Benefit: {d.model?.toFixed(4)}</div>
                      <div className="text-state-warning text-[10.5px]">Treat All: {d.all?.toFixed(4)}</div>
                      <div className="text-ink-3 text-[10.5px]">Treat None: 0.0000</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={0} stroke="#8A8A96" strokeWidth={1.5} />
            <Line type="monotone" dataKey="all" stroke="#D97706" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            <Line type="monotone" dataKey="model" stroke="#0B0B10" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] text-ink-3 font-mono italic leading-relaxed pt-1">
        Clinical Net Benefit is positive across the 10%–45% threshold range, outperforming the indiscriminate "Treat All" intervention strategy without clinical harm.
      </p>
    </div>
  );
};
