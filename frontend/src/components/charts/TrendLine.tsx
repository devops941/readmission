import React from 'react';
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendItem } from '../../types';

interface TrendLineProps {
  data: TrendItem[];
}

export const TrendLine: React.FC<TrendLineProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-xs font-mono text-ink-3 p-4">No monthly trend data available.</div>;
  }

  const chartData = data.map(d => ({
    month: `M${d.month}`,
    monthNum: d.month,
    rate: Number((d.rate * 100).toFixed(1)),
    ci_lower: Number((d.ci_lower * 100).toFixed(1)),
    ci_upper: Number((d.ci_upper * 100).toFixed(1)),
    range: [Number((d.ci_lower * 100).toFixed(1)), Number((d.ci_upper * 100).toFixed(1))],
    n: d.n,
    events: d.events
  }));

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between border-b border-rule pb-2">
        <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
          Monthly Readmission Trajectory (Discharge Months 1–24)
        </h4>
        <span className="text-[10px] font-mono text-ink-3">SHADED BAND: 95% WILSON CI</span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E3E1E0" vertical={false} />
            <XAxis dataKey="month" stroke="#8A8A96" tick={{ fontSize: 10, fontFamily: 'Martian Mono' }} />
            <YAxis stroke="#8A8A96" tick={{ fontSize: 10, fontFamily: 'Martian Mono' }} unit="%" domain={[0, 'auto']} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-page border border-ink p-2.5 shadow-lg font-mono text-xs">
                      <div className="font-bold text-ink mb-1">{d.month} (Month {d.monthNum})</div>
                      <div>Readmission Rate: <strong>{d.rate}%</strong></div>
                      <div className="text-[10px] text-ink-3">95% CI: [{d.ci_lower}% – {d.ci_upper}%]</div>
                      <div className="text-[10px] text-ink-3">Sample: {d.events} / {d.n} encounters</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Shaded confidence band */}
            <Area type="monotone" dataKey="range" stroke="none" fill="#D4F73C" fillOpacity={0.25} />
            {/* Observed trajectory line */}
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#0B0B10"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#0B0B10', strokeWidth: 1.5, stroke: '#D4F73C' }}
              activeDot={{ r: 5, fill: '#D4F73C', stroke: '#0B0B10', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
