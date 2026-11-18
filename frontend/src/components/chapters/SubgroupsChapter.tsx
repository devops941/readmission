import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { FoldButton } from '../book/FoldButton';
import { Scale, ArrowRight, AlertTriangle, ShieldCheck } from 'lucide-react';

interface SubgroupsChapterProps {
  onNextChapter: () => void;
}

export const SubgroupsChapter: React.FC<SubgroupsChapterProps> = ({ onNextChapter }) => {
  const { activeDataset } = useAuth();
  const [activeModelId, setActiveModelId] = useState<string>('');
  const [sensitiveVar, setSensitiveVar] = useState<string>('insurance');
  const [subgroupData, setSubgroupData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!activeDataset) return;
    loadActiveModel();
  }, [activeDataset]);

  const loadActiveModel = async () => {
    if (!activeDataset) return;
    try {
      const models = await api.getModels(activeDataset.id);
      const active = models.find((m: any) => m.status === 'active') || models[0];
      if (active) {
        setActiveModelId(active.id);
        fetchSubgroups(active.id, sensitiveVar);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSubgroups = async (modelId: string, byVar: string) => {
    setLoading(true);
    try {
      const res = await api.getSubgroups(modelId, byVar, 0.20);
      setSubgroupData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVarChange = (v: string) => {
    setSensitiveVar(v);
    if (activeModelId) {
      fetchSubgroups(activeModelId, v);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Left Page: Disparity Gaps & Epistemic Guidance */}
      <div className="space-y-6">
        <div>
          <h3 className="font-serif text-2xl font-bold text-ink">Subgroup Calibration & Disparities</h3>
          <p className="text-xs text-ink-2 mt-1">
            Audit model discrimination, calibration slope, and false positive rates across demographic and payer strata.
          </p>
        </div>

        {/* Stratum Selector Words */}
        <div className="space-y-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink-3 font-semibold block">
            Select Sensitive Stratum to Inspect
          </span>
          <div className="flex flex-wrap gap-2 font-mono text-xs">
            {[
              { id: 'insurance', label: 'PAYER TYPE (INSURANCE)' },
              { id: 'race_ethnicity', label: 'RACE / ETHNICITY' },
              { id: 'sex', label: 'SEX' },
              { id: 'age_band', label: 'AGE BANDS' },
              { id: 'primary_dx_group', label: 'DIAGNOSIS SERVICE LINE' }
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => handleVarChange(v.id)}
                className={`px-3 py-1.5 rounded transition-colors uppercase font-bold ${
                  sensitiveVar === v.id ? 'bg-ink text-lime' : 'bg-page-shade text-ink-2 hover:bg-rule'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Disparity Gap Metrics */}
        {subgroupData && (
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="p-3 bg-page border border-rule text-center font-mono">
              <span className="text-[10px] text-ink-3 block uppercase">Equal Opportunity (TPR Gap)</span>
              <span className="text-lg font-bold text-ink">{subgroupData.tpr_disparity_gap?.toFixed(3)}</span>
            </div>
            <div className="p-3 bg-page border border-rule text-center font-mono">
              <span className="text-[10px] text-ink-3 block uppercase">Equalized Odds (FPR Gap)</span>
              <span className="text-lg font-bold text-ink">{subgroupData.fpr_disparity_gap?.toFixed(3)}</span>
            </div>
            <div className="p-3 bg-page border border-rule text-center font-mono">
              <span className="text-[10px] text-ink-3 block uppercase">AUROC Disparity Gap</span>
              <span className="text-lg font-bold text-ink">{subgroupData.auroc_disparity_gap?.toFixed(3)}</span>
            </div>
          </div>
        )}

        {/* Findings Narrative */}
        {subgroupData?.narrative && (
          <div className="p-4 bg-page-shade border-l-2 border-state-teal font-sans text-xs text-ink-2 space-y-2">
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-ink uppercase">
              <Scale className="w-3.5 h-3.5 text-state-teal" />
              <span>Statistical Disparity Finding</span>
            </div>
            <p className="leading-relaxed italic">{subgroupData.narrative}</p>
          </div>
        )}

        {/* Small Cell Suppression Rule Callout */}
        <div className="p-3.5 bg-page border border-rule text-xs font-mono text-ink-3 space-y-1">
          <span className="font-bold text-ink block uppercase text-[10.5px]">Small-Cell Governance Standard</span>
          <p>
            Any subgroup cell with <strong>n &lt; 20</strong> or <strong>events &lt; 5</strong> is automatically suppressed and hatched in the table to prevent unstable estimators and protect patient privacy.
          </p>
        </div>

        <div className="pt-2">
          <FoldButton onClick={onNextChapter}>
            <span>Next: Chapter 6 · Monitoring & Drift</span>
            <ArrowRight className="w-4 h-4" />
          </FoldButton>
        </div>
      </div>

      {/* Right Page: Subgroup Table with Hatched Suppressed Rows */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-rule pb-2">
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
            Subgroup Performance Ledger: {sensitiveVar}
          </h4>
          <span className="text-[10px] font-mono text-ink-3">EVALUATION THRESHOLD: 0.20</span>
        </div>

        {loading ? (
          <div className="p-12 border border-rule bg-page text-center font-mono text-xs text-ink-3">
            Auditing subgroup calibration metrics across {sensitiveVar}...
          </div>
        ) : (
          <div className="border border-rule bg-page overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead className="bg-page-shade border-b border-rule text-ink-3 text-[10.5px]">
                <tr>
                  <th className="p-2">Subgroup</th>
                  <th className="p-2">N</th>
                  <th className="p-2">Events</th>
                  <th className="p-2">AUROC</th>
                  <th className="p-2">Calib Slope</th>
                  <th className="p-2">TPR</th>
                  <th className="p-2">FPR</th>
                  <th className="p-2">PPV</th>
                </tr>
              </thead>
              <tbody>
                {(subgroupData?.subgroups || []).map((sg: any, idx: number) => {
                  const isSupp = sg.suppressed;
                  return (
                    <tr
                      key={idx}
                      className={`border-b border-rule/50 ${isSupp ? 'hatched-cell' : 'hover:bg-page-shade/40'}`}
                      title={isSupp ? sg.reason : ''}
                    >
                      <td className="p-2 font-bold text-ink truncate max-w-[120px]">{sg.group}</td>
                      <td className="p-2">{sg.n}</td>
                      <td className="p-2">{sg.events}</td>
                      <td className="p-2">{isSupp ? '—' : sg.auroc?.toFixed(3)}</td>
                      <td className="p-2">{isSupp ? '—' : sg.calibration_slope?.toFixed(2)}</td>
                      <td className="p-2">{isSupp ? '—' : `${(sg.tpr * 100).toFixed(1)}%`}</td>
                      <td className="p-2">{isSupp ? '—' : `${(sg.fpr * 100).toFixed(1)}%`}</td>
                      <td className="p-2">{isSupp ? '—' : `${(sg.ppv * 100).toFixed(1)}%`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-3 bg-page-shade border border-rule text-[11px] font-mono text-ink-3 italic">
          Calibration slope near 1.0 reflects accurate probability scaling across diverse patient populations. Miscalibration highlights clinical sub-populations requiring specialized post-acute coordination.
        </div>
      </div>
    </div>
  );
};
