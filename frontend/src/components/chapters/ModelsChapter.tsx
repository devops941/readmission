import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { RocPrPair } from '../charts/RocPrPair';
import { ReliabilityCurve } from '../charts/ReliabilityCurve';
import { ThresholdSlider } from '../charts/ThresholdSlider';
import { DecisionCurve } from '../charts/DecisionCurve';
import { FoldButton } from '../book/FoldButton';
import { ModelRun } from '../../types';
import { Cpu, ArrowRight, Play, CheckCircle2, Award } from 'lucide-react';

interface ModelsChapterProps {
  onNextChapter: () => void;
}

export const ModelsChapter: React.FC<ModelsChapterProps> = ({ onNextChapter }) => {
  const { activeDataset } = useAuth();
  const [spreadMode, setSpreadMode] = useState<'EVALUATION' | 'THRESHOLDS_COMPARE'>('EVALUATION');

  const [models, setModels] = useState<ModelRun[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [activeModel, setActiveModel] = useState<ModelRun | null>(null);

  // In-prose training form state
  const [algorithm, setAlgorithm] = useState<string>('gradient_boosting');
  const [calibrationMethod, setCalibrationMethod] = useState<string>('isotonic');
  const [isTraining, setIsTraining] = useState<boolean>(false);

  useEffect(() => {
    if (!activeDataset) return;
    loadModels();
  }, [activeDataset]);

  const loadModels = async () => {
    if (!activeDataset) return;
    try {
      const list = await api.getModels(activeDataset.id);
      setModels(list);
      if (list.length > 0) {
        const primary = list.find((m: any) => m.status === 'active') || list[0];
        setSelectedModelId(primary.id);
        const detailed = await api.getModel(primary.id);
        setActiveModel(detailed);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectModel = async (id: string) => {
    setSelectedModelId(id);
    try {
      const detailed = await api.getModel(id);
      setActiveModel(detailed);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTrainNew = async () => {
    if (!activeDataset) return;
    setIsTraining(true);
    try {
      const res = await api.trainModel(activeDataset.id, {
        algorithm,
        calibration_method: calibrationMethod,
        train_months: Array.from({ length: 18 }, (_, i) => i + 1),
        calib_months: [19, 20, 21],
        test_months: [22, 23, 24],
        use_class_weight: true,
        random_seed: 42
      });
      alert(`Model trained successfully!`);
      await loadModels();
      if (res.model_id) {
        await handleSelectModel(res.model_id);
      }
    } catch (err: any) {
      alert(`Training error: ${err.message}`);
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Spread View Switcher */}
      <div className="flex items-center justify-between border-b border-rule pb-3 font-mono text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSpreadMode('EVALUATION')}
            className={`px-3 py-1 rounded transition-colors uppercase font-bold ${
              spreadMode === 'EVALUATION' ? 'bg-ink text-lime' : 'text-ink-2 hover:bg-page-shade'
            }`}
          >
            3.1 · TRAINING & PROBABILITY CALIBRATION
          </button>
          <button
            onClick={() => setSpreadMode('THRESHOLDS_COMPARE')}
            className={`px-3 py-1 rounded transition-colors uppercase font-bold ${
              spreadMode === 'THRESHOLDS_COMPARE' ? 'bg-ink text-lime' : 'text-ink-2 hover:bg-page-shade'
            }`}
          >
            3.2 · THRESHOLDS, DECISION CURVES & LEADERBOARD
          </button>
        </div>

        {/* Model Switcher */}
        {models.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-ink-3">INSPECTING:</span>
            <select
              className="printed-field text-xs font-bold text-ink bg-page"
              value={selectedModelId}
              onChange={(e) => handleSelectModel(e.target.value)}
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.algorithm} ({m.calibration_method}) {m.status === 'active' ? '★ ACTIVE' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {spreadMode === 'EVALUATION' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Page: In-Prose Training Form */}
          <div className="space-y-6">
            <div>
              <h3 className="font-serif text-2xl font-bold text-ink">Model Architecture & Time Splits</h3>
              <p className="text-xs text-ink-2 mt-1">
                Configure prospective validation on strictly chronological discharge periods to guard against temporal leakage.
              </p>
            </div>

            {/* Training Form in Prose */}
            <div className="p-5 bg-page-shade border border-rule font-serif text-base text-ink leading-relaxed space-y-4">
              <div className="text-[11px] font-mono uppercase tracking-wider text-ink-3 font-semibold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-state-teal" />
                <span>Prospective Specification Sentence</span>
              </div>

              <p>
                Train a{' '}
                <select
                  className="printed-field font-sans text-xs font-bold bg-page px-1 py-0.5 mx-1"
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value)}
                >
                  <option value="gradient_boosting">[Gradient Boosting Ensemble]</option>
                  <option value="random_forest">[Random Forest Classifier]</option>
                  <option value="logistic_regression">[L2 Regularized Logistic Regression]</option>
                </select>{' '}
                model on historical discharge months{' '}
                <span className="font-bold underline decoration-dotted text-ink font-sans text-xs">[1–18 (Train Split)]</span>,
                calibrate probabilities using{' '}
                <select
                  className="printed-field font-sans text-xs font-bold bg-page px-1 py-0.5 mx-1"
                  value={calibrationMethod}
                  onChange={(e) => setCalibrationMethod(e.target.value)}
                >
                  <option value="isotonic">[Isotonic Non-Parametric Regression]</option>
                  <option value="sigmoid">[Platt Sigmoid Scaling]</option>
                  <option value="none">[Uncalibrated Raw Scores]</option>
                </select>{' '}
                on discharge months{' '}
                <span className="font-bold underline decoration-dotted text-ink font-sans text-xs">[19–21 (Calibration Split)]</span>,
                and evaluate prospective discrimination on months{' '}
                <span className="font-bold underline decoration-dotted text-ink font-sans text-xs">[22–24 (Test Split)]</span>.
              </p>

              <div className="pt-2">
                <FoldButton onClick={handleTrainNew} disabled={isTraining}>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isTraining ? 'Fitting Trees & Calibrating...' : 'Fit Prospective Model'}</span>
                </FoldButton>
              </div>
            </div>

            {/* Excluded Features with Leakage Reasons */}
            <div className="border border-rule p-4 bg-page space-y-2.5 font-mono text-xs">
              <span className="font-bold text-ink uppercase tracking-wider text-[11px] block">
                Leakage Guard Report (Hard-Excluded Columns)
              </span>
              <div className="space-y-1.5 text-[11px] text-ink-2">
                <div className="p-1.5 bg-risk-up/10 text-risk-up rounded flex justify-between">
                  <span>days_to_readmit</span>
                  <span className="italic">Target outcome leakage (post-discharge event)</span>
                </div>
                <div className="p-1.5 bg-page-shade rounded flex justify-between text-ink-3">
                  <span>encounter_id, _id</span>
                  <span>Administrative non-generalizable identifier</span>
                </div>
                <div className="p-1.5 bg-page-shade rounded flex justify-between text-ink-3">
                  <span>discharge_month</span>
                  <span>Time index reserved strictly for chronological splitting</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <FoldButton onClick={onNextChapter}>
                <span>Next: Chapter 4 · Explanations (SHAP)</span>
                <ArrowRight className="w-4 h-4" />
              </FoldButton>
            </div>
          </div>

          {/* Right Page: Evidence (ROC/PR & Reliability Curves) */}
          <div className="space-y-5">
            {activeModel ? (
              <div className="space-y-5">
                <RocPrPair metrics={activeModel.metrics || null} />
                <ReliabilityCurve
                  calibratedMetrics={activeModel.calibrated_metrics || activeModel.metrics || null}
                  uncalibratedMetrics={activeModel.uncalibrated_metrics || null}
                />
              </div>
            ) : (
              <div className="p-8 border border-rule bg-page text-center font-mono text-xs text-ink-3">
                No trained model selected. Train or select a model on the left spread.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Spread 3.2: Threshold Slider, Decision Curve & Leaderboard */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-5">
            <ThresholdSlider metricsList={activeModel?.threshold_metrics} />
            <DecisionCurve curves={activeModel?.decision_curves} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-rule pb-2">
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
                Model Leaderboard & Comparative Audit
              </h4>
              <span className="text-[10px] font-mono text-ink-3">IDENTICAL TIME-BASED TEST SPLIT</span>
            </div>

            <div className="border border-rule bg-page overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead className="bg-page-shade border-b border-rule text-ink-3 text-[10.5px]">
                  <tr>
                    <th className="p-2.5">Algorithm</th>
                    <th className="p-2.5">Calibration</th>
                    <th className="p-2.5">AUROC</th>
                    <th className="p-2.5">Brier</th>
                    <th className="p-2.5">ECE</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((m) => {
                    const isSelected = m.id === selectedModelId;
                    const metrics: any = m.metrics || {};
                    return (
                      <tr
                        key={m.id}
                        onClick={() => handleSelectModel(m.id)}
                        className={`border-b border-rule/50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-lime/30 font-bold' : 'hover:bg-page-shade/40'
                        }`}
                      >
                        <td className="p-2.5 capitalize text-ink">
                          {m.algorithm.replace('_', ' ')}
                        </td>
                        <td className="p-2.5 capitalize text-ink-2">{m.calibration_method}</td>
                        <td className="p-2.5 text-ink font-bold">{metrics.auroc ? metrics.auroc.toFixed(3) : '—'}</td>
                        <td className="p-2.5 text-ink-2">{metrics.brier_score ? metrics.brier_score.toFixed(3) : '—'}</td>
                        <td className="p-2.5 text-state-teal">{metrics.ece ? metrics.ece.toFixed(4) : '—'}</td>
                        <td className="p-2.5">
                          {m.status === 'active' ? (
                            <span className="px-1.5 py-0.5 bg-lime text-ink text-[10px] font-bold rounded">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="text-ink-3 text-[10px] uppercase">{m.status}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-page-shade border border-rule space-y-2 text-xs font-sans">
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-ink">
                <Award className="w-3.5 h-3.5 text-state-warning" />
                <span>Parsimony Standard (One Standard Error Rule)</span>
              </div>
              <p className="text-ink-2 leading-relaxed">
                Gradient Boosting achieves the highest discrimination (AUROC 0.702), while Isotonic calibration reduces Expected Calibration Error (ECE) to under 0.04 without losing discriminative power.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
