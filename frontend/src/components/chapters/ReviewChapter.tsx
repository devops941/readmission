import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { MarginNotes } from '../book/MarginNotes';
import { FoldButton } from '../book/FoldButton';
import { CheckCircle2, XCircle, AlertTriangle, MessageSquare, ArrowRight, ShieldCheck } from 'lucide-react';
import { ExpertReview } from '../../types';

interface ReviewChapterProps {
  onNextChapter: () => void;
}

export const ReviewChapter: React.FC<ReviewChapterProps> = ({ onNextChapter }) => {
  const { activeDataset, user } = useAuth();
  const [activeModelId, setActiveModelId] = useState<string>('');
  const [reviews, setReviews] = useState<ExpertReview[]>([]);

  // Review Form state
  const [targetType, setTargetType] = useState<'global_driver' | 'model_run' | 'record'>('global_driver');
  const [targetId, setTargetId] = useState<string>('prior_admissions_6m');
  const [verdict, setVerdict] = useState<'agree' | 'disagree' | 'flag'>('agree');
  const [comment, setComment] = useState<string>('');
  const [needsInvestigation, setNeedsInvestigation] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!activeDataset) return;
    loadReviews();
  }, [activeDataset]);

  const loadReviews = async () => {
    if (!activeDataset) return;
    try {
      const models = await api.getModels(activeDataset.id);
      const active = models.find((m: any) => m.status === 'active') || models[0];
      if (active) {
        setActiveModelId(active.id);
        const res = await api.getReviews(active.id);
        setReviews(res || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModelId || !comment.trim()) {
      alert('Please enter a clinical review comment.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.submitReview({
        model_id: activeModelId,
        target_type: targetType,
        target_id: targetId,
        verdict,
        comment,
        needs_investigation: needsInvestigation
      });
      setComment('');
      alert('Clinical review submitted and audited.');
      await loadReviews();
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Left Page: Item under Review & Governance Form */}
      <div className="space-y-6">
        <div>
          <h3 className="font-serif text-2xl font-bold text-ink">Clinical Expert Review & Governance</h3>
          <p className="text-xs text-ink-2 mt-1">
            Formalized expert assessment. Clinical reviewers agree, disagree, or flag model explanations as clinically implausible.
          </p>
        </div>

        {/* Item Under Review Card */}
        <div className="p-4 bg-page-shade border border-rule space-y-3 font-sans">
          <span className="font-mono text-[11px] font-bold text-ink uppercase tracking-wider block">
            Target Item Under Review
          </span>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[10.5px] font-mono text-ink-3 uppercase block mb-1">Target Category</label>
              <select
                className="printed-field w-full text-xs font-semibold bg-page"
                value={targetType}
                onChange={(e: any) => setTargetType(e.target.value)}
              >
                <option value="global_driver">Global Feature Driver</option>
                <option value="model_run">Entire Model Architecture</option>
                <option value="record">Specific Historical Record</option>
              </select>
            </div>

            <div>
              <label className="text-[10.5px] font-mono text-ink-3 uppercase block mb-1">Target Identifier</label>
              <input
                className="printed-field w-full text-xs font-mono font-bold"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder="e.g. prior_admissions_6m"
              />
            </div>
          </div>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="border border-rule p-4 bg-page space-y-4 font-sans">
          <span className="font-mono text-xs font-bold text-ink uppercase tracking-wider block">
            Expert Verdict & Findings
          </span>

          {/* Verdict Choices */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setVerdict('agree')}
              className={`p-2.5 rounded border text-xs font-mono flex items-center justify-center gap-1.5 transition-all ${
                verdict === 'agree'
                  ? 'border-state-success bg-state-success/15 text-state-success font-bold'
                  : 'border-rule bg-page-shade text-ink-2 hover:bg-rule'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Agree</span>
            </button>

            <button
              type="button"
              onClick={() => setVerdict('disagree')}
              className={`p-2.5 rounded border text-xs font-mono flex items-center justify-center gap-1.5 transition-all ${
                verdict === 'disagree'
                  ? 'border-risk-up bg-risk-up/15 text-risk-up font-bold'
                  : 'border-rule bg-page-shade text-ink-2 hover:bg-rule'
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span>Disagree</span>
            </button>

            <button
              type="button"
              onClick={() => setVerdict('flag')}
              className={`p-2.5 rounded border text-xs font-mono flex items-center justify-center gap-1.5 transition-all ${
                verdict === 'flag'
                  ? 'border-state-warning bg-state-warning/15 text-state-warning font-bold'
                  : 'border-rule bg-page-shade text-ink-2 hover:bg-rule'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Flag Implausible</span>
            </button>
          </div>

          {/* Comment Field */}
          <div>
            <label className="text-[11px] font-mono text-ink-2 uppercase font-semibold block mb-1">
              Clinical Assessment & Rationales
            </label>
            <textarea
              className="printed-field w-full text-xs font-sans p-2 h-20 resize-none bg-page-shade/30"
              placeholder="State clinical grounding, evidence concordance, or potential documentation artifacts..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </div>

          {/* Needs Investigation Tick */}
          <label className="flex items-center gap-2 text-xs font-mono text-ink cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={needsInvestigation}
              onChange={(e) => setNeedsInvestigation(e.target.checked)}
              className="accent-ink"
            />
            <span>Mark variable as "Needs Clinical Investigation" in Data Dictionary</span>
          </label>

          <div className="pt-2">
            <FoldButton type="submit" disabled={isSubmitting}>
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Recording Review...' : 'Commit Expert Review Note'}</span>
            </FoldButton>
          </div>
        </form>

        <div className="pt-2">
          <FoldButton onClick={onNextChapter}>
            <span>Next: Chapter 8 · Export & Colophon</span>
            <ArrowRight className="w-4 h-4" />
          </FoldButton>
        </div>
      </div>

      {/* Right Page: Clinical Margin Notes Stream */}
      <div className="space-y-5">
        <div className="border border-rule p-4 bg-page rounded-xs">
          <MarginNotes reviews={reviews} />
        </div>

        <div className="p-4 bg-page-shade border border-rule space-y-2 text-xs font-sans">
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-ink uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-state-success" />
            <span>Audit Trail & Governance Standard</span>
          </div>
          <p className="text-ink-2 leading-relaxed">
            All reviews are signed cryptographically with reviewer identity, timestamped, and stored permanently in MongoDB Atlas. Reviewers govern model credibility without making real-time clinical decisions.
          </p>
        </div>
      </div>
    </div>
  );
};
