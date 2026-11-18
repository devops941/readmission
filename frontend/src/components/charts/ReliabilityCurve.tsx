import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { ModelMetrics } from '../../types';

interface ReliabilityCurveProps {
  calibratedMetrics: ModelMetrics | null;
  uncalibratedMetrics: ModelMetrics | null;
}

export const ReliabilityCurve: React.FC<ReliabilityCurveProps> = ({
  calibratedMetrics,
  uncalibratedMetrics
}) => {
  if (!calibratedMetrics || !calibratedMetrics.reliability_bins) {
    return <div className="text-xs font-mono text-ink-3 p-4">Calibration reliability data not available.</div>;
  }

  const calBins = calibratedMetrics.reliability_bins || [];
  const uncalBins = uncalibratedMetrics?.reliability_bins || [];

  const chartData = calBins.map((bin, i) => {
    const uncalBin: any = uncalBins[i] || {};
    return {
      bin: bin.bin,
      predCal: Number((bin.predicted_prob * 100).toFixed(1)),
      obsCal: Number((bin.observed_rate * 100).toFixed(1)),
      obsUncal: uncalBin.observed_rate !== undefined ? Number((uncalBin.observed_rate * 100).toFixed(1)) : null,
      count: bin.count
    };
  });

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between border-b border-rule pb-2">
        <div>
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
            Probability Calibration Curve (Reliability Bins)
          </h4>
          <span className="text-[10px] font-mono text-ink-3">
            Brier: {uncalibratedMetrics?.brier_score.toFixed(3) || '—'} → <strong className="text-risk-down">{calibratedMetrics.brier_score.toFixed(3)}</strong> · ECE: {uncalibratedMetrics?.ece.toFixed(4) || '—'} → <strong className="text-risk-down">{calibratedMetrics.ece.toFixed(4)}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="flex items-center gap-1 text-risk-calibrated font-semibold">
            <span className="w-2.5 h-0.5 bg-risk-calibrated" /> Calibrated
          </span>
          <span className="flex items-center gap-1 text-state-warning">
            <span className="w-2.5 h-0.5 bg-state-warning border-b border-dashed" /> Raw Model
          </span>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E3E1E0" />
            <XAxis dataKey="predCal" stroke="#8A8A96" tick={{ fontSize: 9, fontFamily: 'Martian Mono' }} unit="%" />
            <YAxis stroke="#8A8A96" tick={{ fontSize: 9, fontFamily: 'Martian Mono' }} unit="%" domain={[0, 100]} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-page border border-ink p-2 font-mono text-xs shadow-sm">
                      <div className="font-bold text-ink mb-1">Bin #{d.bin} (n={d.count})</div>
                      <div>Mean Predicted: {d.predCal}%</div>
                      <div className="text-risk-calibrated font-bold">Observed (Calibrated): {d.obsCal}%</div>
                      {d.obsUncal !== null && (
                        <div className="text-state-warning text-[10px]">Observed (Raw): {d.obsUncal}%</div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Ideal diagonal line */}
            <ReferenceLine stroke="#8A8A96" strokeDasharray="4 4" segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]} />
            {/* Raw uncalibrated curve */}
            {uncalBins.length > 0 && (
              <Line type="monotone" dataKey="obsUncal" stroke="#D97706" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 2 }} />
            )}
            {/* Calibrated curve */}
            <Line type="monotone" dataKey="obsCal" stroke="#65A30D" strokeWidth={2.5} dot={{ r: 3, fill: '#65A30D' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
