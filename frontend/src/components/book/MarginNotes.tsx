import React from 'react';
import { MessageSquareQuote, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { ExpertReview } from '../../types';

interface MarginNotesProps {
  reviews: ExpertReview[];
}

export const MarginNotes: React.FC<MarginNotesProps> = ({ reviews }) => {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="border border-dashed border-rule p-3 text-[11px] font-mono text-ink-3 italic">
        No clinical margin notes recorded for this item yet. Reviewers can annotate below.
      </div>
    );
  }

  return (
    <div className="space-y-3 font-sans">
      <div className="text-[11px] font-mono uppercase tracking-wider text-ink-3 font-semibold flex items-center gap-1.5">
        <MessageSquareQuote className="w-3.5 h-3.5" />
        <span>Clinical Margin Notes ({reviews.length})</span>
      </div>

      <div className="space-y-2.5">
        {reviews.map((r, i) => (
          <div
            key={r.id || i}
            className="p-3 bg-page-shade border-l-2 border-ink text-xs relative shadow-xs"
          >
            {/* Small connector tick */}
            <div className="absolute -left-1.5 top-3.5 w-1.5 h-1.5 bg-ink rotate-45" />

            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-ink flex items-center gap-1">
                {r.verdict === 'agree' && <CheckCircle2 className="w-3 h-3 text-state-success" />}
                {r.verdict === 'disagree' && <XCircle className="w-3 h-3 text-risk-up" />}
                {r.verdict === 'flag' && <AlertTriangle className="w-3 h-3 text-state-warning" />}
                <span className="capitalize">{r.verdict}</span>
              </span>
              <span className="font-mono text-[10px] text-ink-3">
                {r.reviewer_name} ({r.reviewer_role})
              </span>
            </div>

            <p className="text-ink-2 text-[11.5px] leading-relaxed italic">
              "{r.comment}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
