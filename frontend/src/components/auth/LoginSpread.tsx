import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FoldButton } from '../book/FoldButton';
import { PrintedField } from '../book/PrintedField';
import { HighlightMark } from '../book/HighlightMark';
import { ShieldAlert, BookOpen, KeyRound, Sparkles, ArrowRight } from 'lucide-react';

interface LoginSpreadProps {
  onSwitchToRegister: () => void;
}

export const LoginSpread: React.FC<LoginSpreadProps> = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-desk flex flex-col justify-center items-center p-4 sm:p-6 md:p-8 font-sans">
      <div className="w-full max-w-4xl bg-page shadow-book border border-rule grid grid-cols-1 md:grid-cols-2 relative min-h-[580px]">
        {/* Subtle page edge lines */}
        <div className="hidden md:block absolute left-0 top-0 bottom-0 w-1 bg-page border-r border-rule/50" />
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-8 -translate-x-1/2 pointer-events-none shadow-gutter z-10" />

        {/* Left Page: Title & Research Statement */}
        <div className="flex flex-col justify-between p-8 sm:p-10 border-b md:border-b-0 md:border-r border-rule/70 bg-page">
          <div className="space-y-5">
            <div className="inline-block px-2.5 py-1 bg-lime text-ink font-mono text-[10px] font-bold uppercase tracking-wider">
              DOSSIER SPREAD · OPEN-BOOK SIGN IN
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl text-ink font-bold tracking-tight leading-tight">
              ReadmitExplain <span className="italic font-normal text-ink-2">AI</span>
            </h1>

            <p className="font-serif text-base text-ink-2 italic leading-relaxed">
              Explainable Hospital Readmission Pattern & Risk Analysis Platform
            </p>

            <div className="p-4 bg-page-shade border border-rule space-y-2 text-xs font-sans">
              <p className="text-ink-2 leading-relaxed">
                A multi-page research dossier engineered for healthcare quality analysts and clinical reviewers to investigate{' '}
                <HighlightMark variant="lime">population-level 30-day readmission drivers</HighlightMark> on de-identified inpatient cohorts.
              </p>
            </div>

            {/* Caveat Notice */}
            <div className="p-3 bg-page border-l-2 border-state-warning text-[10.5px] font-mono text-ink-3 space-y-1">
              <div className="font-bold text-ink flex items-center gap-1 uppercase">
                <ShieldAlert className="w-3.5 h-3.5 text-state-warning" />
                <span>Research & Quality Standard</span>
              </div>
              <p className="italic">
                Explanations show statistical association, not causation. Strictly not intended for individual real-time clinical decisions.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-rule/50 text-[11px] font-mono text-ink-3">
            <span>p. i · TITLE PAGE</span>
          </div>
        </div>

        {/* Right Page: Printed Sign-In Form */}
        <div className="flex flex-col justify-between p-8 sm:p-10 bg-page">
          <div className="space-y-6">
            <div className="border-b border-rule/60 pb-2 flex items-center justify-between">
              <h2 className="font-serif text-2xl font-bold text-ink">Sign in to the Dossier</h2>
              <BookOpen className="w-4 h-4 text-ink-3" />
            </div>

            {error && (
              <div className="p-3 bg-risk-up/10 border-l-2 border-risk-up text-xs font-mono text-risk-up">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 font-sans">
              <PrintedField
                label="Registered Institutional Email"
                type="email"
                placeholder="analyst@readmitexplain.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <PrintedField
                label="Security Passphrase"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <div className="pt-2">
                <FoldButton type="submit" disabled={isLoading} className="w-full justify-center">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{isLoading ? 'Verifying Credentials...' : 'Open the Dossier'}</span>
                </FoldButton>
              </div>
            </form>

            {/* Demo Quick-Fill Buttons */}
            <div className="pt-2 space-y-2 border-t border-rule">
              <div className="text-[10px] font-mono text-ink-3 uppercase font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-state-warning" />
                <span>Quick-Fill Demo Credentials:</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
                <button
                  type="button"
                  onClick={() => handleQuickFill('analyst@readmitexplain.local', 'Analyst@2026!')}
                  className="p-1.5 bg-page-shade hover:bg-lime border border-rule text-ink rounded text-center transition-colors truncate"
                  title="Lead Healthcare Quality Analyst"
                >
                  Analyst
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('reviewer@readmitexplain.local', 'Reviewer@2026!')}
                  className="p-1.5 bg-page-shade hover:bg-lime border border-rule text-ink rounded text-center transition-colors truncate"
                  title="Dr. Sarah Mitchell, MD (Clinical Reviewer)"
                >
                  Reviewer
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin@readmitexplain.local', 'Admin@2026!Readmit')}
                  className="p-1.5 bg-page-shade hover:bg-lime border border-rule text-ink rounded text-center transition-colors truncate"
                  title="System Administrator"
                >
                  Admin
                </button>
              </div>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-xs font-mono text-state-teal hover:underline font-semibold"
              >
                Need access? Request a reading card ▸
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-rule/50 flex justify-between text-[11px] font-mono text-ink-3">
            <span>SECURE JWT + BCRYPT</span>
            <span>p. ii</span>
          </div>
        </div>
      </div>
    </div>
  );
};
