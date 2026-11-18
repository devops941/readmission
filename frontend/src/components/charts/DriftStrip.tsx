import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface MonthlyDrift {
  month: number;
  psi: number;
  ks_pvalue: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
}

interface FeatureDrift {
  feature: string;
  monthly_drift: MonthlyDrift[];
  max_psi: number;
}

interface DriftStripProps {
  features: FeatureDrift[] | undefined;
  alerts?: Array<{
    feature: string;
    month: number;
    severity: string;
    psi: number;
    message: string;
  }>;
}

export const DriftStrip: React.FC<DriftStripProps> = ({ features, alerts = [] }) => {
  if (!features || features.length === 0) {
    return <div className="text-xs font-mono text-ink-3 p-4">Drift monitoring data not available.</div>;
  }

  // Get cell color based on status
  const getStatusColor = (status: string) => {
    if (status === 'CRITICAL') return 'bg-risk-up text-page font-bold';
    if (status === 'WARNING') return 'bg-state-warning text-ink font-semibold';
    return 'bg-state-success/15 text-state-success';
  };

  return (
    <div className="space-y-4 font-sans border border-rule p-4 bg-page rounded-xs">
      <div className="flex items-center justify-between border-b border-rule pb-2">
        <div>
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
            Feature Population Stability Index (PSI Drift Strip)
          </h4>
          <span className="text-[10px] text-ink-3 font-mono">
            Reference Window: Months 1–18 · Monitoring: Months 19–24
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="flex items-center gap-1 text-state-success">
            <span className="w-2.5 h-2.5 bg-state-success/20 border border-state-success" /> &lt;0.10
          </span>
          <span className="flex items-center gap-1 text-state-warning">
            <span className="w-2.5 h-2.5 bg-state-warning text-ink" /> 0.10–0.25 (Warn)
          </span>
          <span className="flex items-center gap-1 text-risk-up">
            <span className="w-2.5 h-2.5 bg-risk-up text-page" /> &gt;0.25 (Critical)
          </span>
        </div>
      </div>

      {/* Feature Strip Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-rule text-xs">
          <thead>
            <tr className="bg-page-shade border-b border-rule">
              <th className="p-2 text-left font-mono text-[11px] text-ink-2 uppercase border-r border-rule">
                Monitored Feature
              </th>
              {features[0]?.monthly_drift.map((m, i) => (
                <th key={i} className="p-2 text-center font-mono text-[11px] text-ink uppercase border-r border-rule last:border-r-0">
                  M{m.month}
                </th>
              ))}
              <th className="p-2 text-center font-mono text-[11px] text-ink-2 uppercase">Max PSI</th>
            </tr>
          </thead>
          <tbody>
            {features.map((feat, fIdx) => (
              <tr key={fIdx} className="border-b border-rule last:border-b-0 hover:bg-page-shade/30">
                <td className="p-2 font-mono text-[11.5px] font-bold text-ink border-r border-rule whitespace-nowrap">
                  {feat.feature}
                </td>
                {feat.monthly_drift.map((m, mIdx) => (
                  <td
                    key={mIdx}
                    className={`p-2 text-center font-mono border-r border-rule last:border-r-0 transition-colors ${getStatusColor(m.status)}`}
                    title={`M${m.month}: PSI=${m.psi.toFixed(3)}, KS-p=${m.ks_pvalue.toFixed(3)}`}
                  >
                    <span className="text-[11px] block">{m.psi.toFixed(2)}</span>
                  </td>
                ))}
                <td className="p-2 text-center font-mono text-[11px] font-bold text-ink">
                  {feat.max_psi.toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="mt-3 p-3 bg-page-shade border-l-2 border-state-warning space-y-1.5 font-sans">
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-ink uppercase">
            <AlertTriangle className="w-3.5 h-3.5 text-state-warning" />
            <span>Active Automated Monitoring Alerts ({alerts.length})</span>
          </div>
          <div className="space-y-1 text-xs">
            {alerts.slice(0, 3).map((a, i) => (
              <div key={i} className="text-ink-2 font-mono text-[11px]">
                • <strong className="text-ink">{a.severity}:</strong> {a.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
