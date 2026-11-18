import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FoldButton } from '../book/FoldButton';
import { PrintedField } from '../book/PrintedField';
import { BookOpen, UserPlus, ArrowLeft } from 'lucide-react';

interface RegisterSpreadProps {
  onSwitchToLogin: () => void;
}

export const RegisterSpread: React.FC<RegisterSpreadProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Analyst' | 'Clinical Reviewer' | 'Admin'>('Analyst');
  const [institution, setInstitution] = useState('Hospital Health System');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await register({
        full_name: fullName,
        email,
        password,
        role,
        institution
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-desk flex flex-col justify-center items-center p-4 sm:p-6 md:p-8 font-sans">
      <div className="w-full max-w-4xl bg-page shadow-book border border-rule grid grid-cols-1 md:grid-cols-2 relative min-h-[580px]">
        {/* Left Page: Registry Instructions */}
        <div className="flex flex-col justify-between p-8 sm:p-10 border-b md:border-b-0 md:border-r border-rule/70 bg-page">
          <div className="space-y-5">
            <div className="inline-block px-2.5 py-1 bg-lime text-ink font-mono text-[10px] font-bold uppercase tracking-wider">
              REGISTRATION SPREAD · REQUEST A READING CARD
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl text-ink font-bold tracking-tight">
              Institutional Reader Registration
            </h1>

            <p className="font-serif text-base text-ink-2 italic leading-relaxed">
              Access to de-identified hospital readmission patterns and governance audits.
            </p>

            <div className="p-4 bg-page-shade border border-rule space-y-2 text-xs font-sans text-ink-2">
              <span className="font-bold text-ink uppercase tracking-wider font-mono text-[10.5px] block">
                User Roles & Scopes:
              </span>
              <ul className="space-y-1.5 list-disc pl-4 text-[11.5px]">
                <li><strong>Analyst:</strong> Explore rates, train prospective models, calibrate probabilities, and inspect SHAP.</li>
                <li><strong>Clinical Reviewer:</strong> Audit drivers, inspect disparities, write margin reviews, and flag implausible associations.</li>
                <li><strong>Admin:</strong> System diagnostics, personnel management, and governance audit trail.</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-rule/50 flex items-center justify-between text-[11px] font-mono text-ink-3">
            <button
              onClick={onSwitchToLogin}
              className="text-state-teal font-semibold hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </button>
            <span>p. iii</span>
          </div>
        </div>

        {/* Right Page: Registration Form */}
        <div className="flex flex-col justify-between p-8 sm:p-10 bg-page">
          <div className="space-y-5">
            <div className="border-b border-rule/60 pb-2 flex items-center justify-between">
              <h2 className="font-serif text-2xl font-bold text-ink">Reader Profile</h2>
              <UserPlus className="w-4 h-4 text-ink-3" />
            </div>

            {error && (
              <div className="p-3 bg-risk-up/10 border-l-2 border-risk-up text-xs font-mono text-risk-up">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 font-sans">
              <PrintedField
                label="Full Name & Clinical Degree"
                placeholder="Dr. Alex Rivera, MD"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <PrintedField
                label="Institutional Email"
                type="email"
                placeholder="alex.rivera@hospital.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono font-semibold uppercase text-ink-2 block mb-1">
                    Requested Role
                  </label>
                  <select
                    className="printed-field w-full text-xs font-bold bg-page"
                    value={role}
                    onChange={(e: any) => setRole(e.target.value)}
                  >
                    <option value="Analyst">Analyst</option>
                    <option value="Clinical Reviewer">Clinical Reviewer</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <PrintedField
                  label="Hospital / Department"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  required
                />
              </div>

              <PrintedField
                label="Passphrase (min 8 characters)"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <div className="pt-2">
                <FoldButton type="submit" disabled={isLoading} className="w-full justify-center">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isLoading ? 'Creating Reading Card...' : 'Issue Reading Card & Enter'}</span>
                </FoldButton>
              </div>
            </form>
          </div>

          <div className="pt-4 border-t border-rule/50 flex justify-between text-[11px] font-mono text-ink-3">
            <span>DE-IDENTIFIED RESEARCH ONLY</span>
            <span>p. iv</span>
          </div>
        </div>
      </div>
    </div>
  );
};
