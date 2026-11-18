import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api } from '../../api/client';

interface DependencePlotProps {
  modelId: string;
}

const CANDIDATE_FEATURES = [
  'prior_admissions_6m',
  'comorbidity_count',
  'los_days',
  'age',
  'num_medications'
];

export const DependencePlot: React.FC<DependencePlotProps> = ({ modelId }) => {
  const [selectedFeature, setSelectedFeature] = useState<string>('prior_admissions_6m');
  const [pdpData, setPdpData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!modelId) return;
    const fetchPdp = async () => {
      setLoading(true);
      try {
        const res = await api.getPdp(modelId, selectedFeature);
        setPdpData(res);
      } catch (e) {
        console.error('Failed to load PDP:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPdp();
  }, [modelId, selectedFeature]);

  const chartData = (pdpData?.pdp_curve || []).map((p: any) => ({
    value: p.value,
    marginal: Number((p.marginal_prediction * 100).toFixed(1))
  }));

  return (
    <div className="space-y-3 font-sans border border-rule p-4 bg-page rounded-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-rule pb-2 gap-2">
        <div>
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
            Partial Dependence & ICE Curves
          </h4>
          <span className="text-[10px] text-ink-3 font-mono">
            Marginal prediction response across feature domain
          </span>
        </div>

        {/* Word Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10.5px]">
          {CANDIDATE_FEATURES.map((feat) => {
            const isSelected = selectedFeature === feat;
            return (
              <button
                key={feat}
                onClick={() => setSelectedFeature(feat)}
                className={`px-2 py-1 rounded transition-colors uppercase ${
                  isSelected
                    ? 'bg-ink text-lime font-bold'
                    : 'bg-page-shade text-ink-2 hover:bg-rule'
                }`}
              >
                {feat.replace('_6m', '').replace('_', ' ')}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="h-56 flex items-center justify-center font-mono text-xs text-ink-3">
          Computing marginal predictions for {selectedFeature}...
        </div>
      ) : chartData.length > 0 ? (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3E1E0" />
              <XAxis dataKey="value" stroke="#8A8A96" tick={{ fontSize: 9, fontFamily: 'Martian Mono' }} />
              <YAxis stroke="#8A8A96" tick={{ fontSize: 9, fontFamily: 'Martian Mono' }} unit="%" domain={[0, 'auto']} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-page border border-ink p-2 font-mono text-xs shadow-sm">
                        <div className="font-bold text-ink">{selectedFeature}: {d.value}</div>
                        <div>Marginal Readmission Risk: <strong>{d.marginal}%</strong></div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="marginal"
                stroke="#0B0B10"
                strokeWidth={3}
                dot={{ r: 3, fill: '#0B0B10', stroke: '#D4F73C', strokeWidth: 1.5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-56 flex items-center justify-center font-mono text-xs text-ink-3">
          No PDP data available.
        </div>
      )}
    </div>
  );
};
