import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { DriftStrip } from '../charts/DriftStrip';
import { FoldButton } from '../book/FoldButton';
import { Activity, ArrowRight, Bell, CheckCircle2, Clock } from 'lucide-react';

interface MonitorChapterProps {
  onNextChapter: () => void;
}

export const MonitorChapter: React.FC<MonitorChapterProps> = ({ onNextChapter }) => {
  const { activeDataset } = useAuth();
  const [activeModelId, setActiveModelId] = useState<string>('');
  const [driftData, setDriftData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!activeDataset) return;
    loadMonitorData();
  }, [activeDataset]);

  const loadMonitorData = async () => {
    if (!activeDataset) return;
    setLoading(true);
    try {
      const models = await api.getModels(activeDataset.id);
      const active = models.find((m: any) => m.status === 'active') || models[0];
      if (active) {
        setActiveModelId(active.id);
        const [d, p] = await Promise.all([
          api.getDrift(active.id),
          api.getPerformance(active.id)
        ]);
        setDriftData(d);
        setPerformanceData(p);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Left Page: Drift Summary, Thresholds & Registry */}
      <div className="space-y-6">
        <div>
          <h3 className="font-serif text-2xl font-bold text-ink">Model & Distribution Drift Monitor</h3>
          <p className="text-xs text-ink-2 mt-1">
            Track prospective feature stability and prospective predictive discrimination over sequential discharge months.
          </p>
        </div>

        {/* Monitoring Framework Narrative */}
        <div className="p-4 bg-page-shade border border-rule font-serif text-sm text-ink leading-relaxed space-y-2">
          <p>
            Reference baseline is anchored in <strong>Months 1–18 (Training Period)</strong>. Prospective monitoring windows examine <strong>Months 19–24</strong> using Population Stability Index (PSI) and two-sample Kolmogorov-Smirnov tests.
          </p>
          <div className="text-[11px] font-mono text-ink-3 pt-1 border-t border-rule/60">
            Automated alerts trigger when feature distribution shifts exceed statistical safety bounds.
          </div>
        </div>

        {/* Alert Thresholds Card */}
        <div className="border border-rule p-4 bg-page space-y-3 font-mono text-xs">
          <div className="flex items-center gap-1.5 font-bold text-ink uppercase">
            <Bell className="w-3.5 h-3.5 text-state-warning" />
            <span>Configured PSI Alert Thresholds</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div className="p-2.5 bg-state-warning/15 border border-state-warning rounded-xs">
              <span className="font-bold text-state-warning block">Moderate Drift Warning</span>
              <span className="text-ink font-bold text-sm">PSI ≥ 0.100</span>
              <span className="text-[10px] text-ink-3 block mt-0.5">Flags prospective distribution shift</span>
            </div>
            <div className="p-2.5 bg-risk-up/15 border border-risk-up rounded-xs">
              <span className="font-bold text-risk-up block">Critical Alert & Retrain</span>
              <span className="text-ink font-bold text-sm">PSI ≥ 0.250</span>
              <span className="text-[10px] text-ink-3 block mt-0.5">Demands governance committee review</span>
            </div>
          </div>
        </div>

        {/* Performance Tracking Over Time Table */}
        {performanceData?.monthly_history && (
          <div className="border border-rule bg-page overflow-hidden">
            <div className="p-2.5 bg-page-shade font-mono text-[11px] font-bold text-ink uppercase border-b border-rule flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-state-teal" />
              <span>Prospective Monthly Discrimination History</span>
            </div>
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead className="border-b border-rule text-ink-3 text-[10px]">
                  <tr>
                    <th className="p-2">Month</th>
                    <th className="p-2">Encounters</th>
                    <th className="p-2">AUROC</th>
                    <th className="p-2">Brier</th>
                    <th className="p-2">Obs Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.monthly_history.map((row: any) => (
                    <tr key={row.month} className="border-b border-rule/50 hover:bg-page-shade/40 text-[11px]">
                      <td className="p-2 font-bold text-ink">Month {row.month}</td>
                      <td className="p-2">{row.n_encounters}</td>
                      <td className="p-2 font-bold text-state-teal">{row.auroc?.toFixed(3)}</td>
                      <td className="p-2 text-ink-2">{row.brier_score?.toFixed(3)}</td>
                      <td className="p-2 text-ink">{(row.observed_prevalence * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="pt-2">
          <FoldButton onClick={onNextChapter}>
            <span>Next: Chapter 7 · Clinical Expert Review</span>
            <ArrowRight className="w-4 h-4" />
          </FoldButton>
        </div>
      </div>

      {/* Right Page: Feature Drift Strip Heatmap */}
      <div className="space-y-5">
        {loading ? (
          <div className="p-12 border border-rule bg-page text-center font-mono text-xs text-ink-3">
            Analyzing prospective population stability across monitoring windows...
          </div>
        ) : driftData ? (
          <DriftStrip features={driftData.features} alerts={driftData.alerts} />
        ) : (
          <div className="p-8 border border-rule bg-page text-center font-mono text-xs text-ink-3">
            No drift telemetry recorded for this model run.
          </div>
        )}
      </div>
    </div>
  );
};
