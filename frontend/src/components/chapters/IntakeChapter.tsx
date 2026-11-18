import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { FoldButton } from '../book/FoldButton';
import { PrintedField } from '../book/PrintedField';
import { HighlightMark } from '../book/HighlightMark';
import { UploadCloud, CheckCircle2, AlertTriangle, ShieldCheck, FileSpreadsheet, Trash2, Edit3, Plus, ArrowRight } from 'lucide-react';
import { Encounter, DictionaryItem } from '../../types';

interface IntakeChapterProps {
  onNextChapter: () => void;
}

export const IntakeChapter: React.FC<IntakeChapterProps> = ({ onNextChapter }) => {
  const { activeDataset, refreshDatasets } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'ledger' | 'dictionary'>('upload');

  // Upload & Scan state
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [deIdConfirmed, setDeIdConfirmed] = useState(true);
  const [dropPhi, setDropPhi] = useState(true);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Ledger state
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New record form state
  const [formRecord, setFormRecord] = useState<Partial<Encounter>>({
    encounter_id: `ENC-${Math.floor(100000 + Math.random() * 900000)}`,
    age: 65,
    sex: 'Female',
    insurance: 'Medicare',
    admission_type: 'Emergency',
    primary_dx_group: 'Circulatory',
    comorbidity_count: 2,
    prior_admissions_6m: 1,
    prior_ed_visits_6m: 0,
    los_days: 4,
    num_medications: 8,
    num_procedures: 1,
    discharge_disposition: 'Home',
    followup_scheduled: 1,
    discharge_month: 24,
    readmit_30d: 0
  });

  // Dictionary state
  const [dictionary, setDictionary] = useState<DictionaryItem[]>([]);

  useEffect(() => {
    if (!activeDataset) return;
    loadEncounters();
    loadDictionary();
  }, [activeDataset]);

  const loadEncounters = async () => {
    if (!activeDataset) return;
    setLedgerLoading(true);
    try {
      const res = await api.getEncounters(activeDataset.id, 0, 50);
      setEncounters(res.records || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLedgerLoading(false);
    }
  };

  const loadDictionary = async () => {
    if (!activeDataset) return;
    try {
      const res = await api.getDictionary(activeDataset.id);
      setDictionary(res || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded || !activeDataset) return;
    setFile(uploaded);
    setIsScanning(true);
    setScanResult(null);
    setImportStatus(null);
    try {
      const res = await api.uploadDatasetFile(activeDataset.id, uploaded);
      setScanResult(res);
    } catch (err: any) {
      alert(`Upload scan failed: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleCommitImport = async () => {
    if (!activeDataset || !scanResult) return;
    try {
      const res = await api.commitImport(activeDataset.id, scanResult.staging_id, dropPhi);
      setImportStatus(`Successfully committed ${res.inserted_records} encounters. Total: ${res.total_records}`);
      await refreshDatasets();
      await loadEncounters();
      setScanResult(null);
      setFile(null);
    } catch (err: any) {
      alert(`Commit error: ${err.message}`);
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDataset) return;
    try {
      await api.addEncounter(activeDataset.id, formRecord);
      alert(`Encounter ${formRecord.encounter_id} saved successfully!`);
      // Reset with new ID
      setFormRecord({
        ...formRecord,
        encounter_id: `ENC-${Math.floor(100000 + Math.random() * 900000)}`
      });
      await loadEncounters();
      await refreshDatasets();
    } catch (err: any) {
      alert(`Failed to add record: ${err.message}`);
    }
  };

  const handleDeleteEncounter = async (encId: string) => {
    if (!activeDataset || !confirm(`Delete record ${encId}?`)) return;
    try {
      await api.deleteEncounter(activeDataset.id, encId);
      await loadEncounters();
      await refreshDatasets();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Chapter Sub-Navigation Switcher (in words) */}
      <div className="flex items-center gap-2 border-b border-rule pb-3 font-mono text-xs">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-3 py-1 rounded transition-colors uppercase ${
            activeTab === 'upload' ? 'bg-ink text-lime font-bold' : 'text-ink-2 hover:bg-page-shade'
          }`}
        >
          1.1 & 1.2 · CSV / EXCEL INTAKE & PHI SCAN
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-3 py-1 rounded transition-colors uppercase ${
            activeTab === 'ledger' ? 'bg-ink text-lime font-bold' : 'text-ink-2 hover:bg-page-shade'
          }`}
        >
          1.3 · RECORD ENTRY & LEDGER
        </button>
        <button
          onClick={() => setActiveTab('dictionary')}
          className={`px-3 py-1 rounded transition-colors uppercase ${
            activeTab === 'dictionary' ? 'bg-ink text-lime font-bold' : 'text-ink-2 hover:bg-page-shade'
          }`}
        >
          1.4 · DATA DICTIONARY
        </button>
      </div>

      {/* Tab 1: Upload & PHI Scan */}
      {activeTab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Page: Instructions & Drop Area */}
          <div className="space-y-5">
            <h3 className="font-serif text-2xl font-bold text-ink">Bring in De-Identified Encounters</h3>
            <p className="text-xs text-ink-2 leading-relaxed">
              Upload historical hospital encounter data (CSV or Excel). Every upload is scanned automatically by our
              regex and heuristic PHI scanner before any commit to ensure zero re-identifiable data is processed.
            </p>

            {/* Drop Area */}
            <div className="border-2 border-dashed border-ink/40 p-8 text-center bg-page-shade hover:bg-page transition-colors rounded-xs relative cursor-pointer">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <UploadCloud className="w-10 h-10 text-ink-2 mx-auto mb-3" />
              <div className="font-mono text-xs font-bold text-ink mb-1">
                {file ? file.name : 'Drop encounter CSV or Excel file here'}
              </div>
              <div className="text-[11px] text-ink-3 font-mono">
                Supports up to 50MB · Automatic Column Mapping & PHI Scanner
              </div>
            </div>

            {/* Test Messy File Helper */}
            <div className="p-3 bg-page border border-rule text-xs font-mono text-ink-2 flex items-center justify-between">
              <span>Test file ready: <code>backend/data/synthetic_messy.csv</code></span>
              <span className="text-state-warning font-semibold">Contains intentional test PHI</span>
            </div>

            {/* De-identification Confirmation */}
            <label className="flex items-start gap-2.5 text-xs text-ink cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={deIdConfirmed}
                onChange={(e) => setDeIdConfirmed(e.target.checked)}
                className="mt-0.5 accent-ink"
              />
              <span className="leading-snug">
                I formally confirm that this dataset contains only <strong>de-identified historical records</strong> with
                relative month indices and zero patient identifiable information.
              </span>
            </label>

            {isScanning && (
              <div className="p-4 bg-lime/20 border border-lime text-xs font-mono text-ink animate-pulse">
                Running PHI scan and Pydantic validation across all rows...
              </div>
            )}

            {importStatus && (
              <div className="p-3 bg-state-success/15 border border-state-success text-xs font-mono text-state-success">
                ✓ {importStatus}
              </div>
            )}
          </div>

          {/* Right Page: PHI Findings & Column Mapping Ledger */}
          <div className="space-y-5">
            {scanResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-rule pb-2">
                  <h4 className="font-mono text-xs font-bold uppercase text-ink">
                    Intake Scan Report: {scanResult.filename}
                  </h4>
                  <span className="font-mono text-xs text-state-teal font-semibold">
                    {scanResult.total_rows.toLocaleString()} rows · {scanResult.total_columns} cols
                  </span>
                </div>

                {/* PHI Findings Alert */}
                {scanResult.has_critical_phi ? (
                  <div className="p-4 bg-risk-up/10 border-l-4 border-risk-up space-y-2">
                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-risk-up">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{scanResult.phi_findings.length} PROTECTED HEALTH INFORMATION (PHI) FINDINGS DETECTED</span>
                    </div>
                    <p className="text-xs text-ink-2 leading-relaxed">
                      Our automated detector identified potential direct identifiers (names, phones, emails, or SSNs).
                      To preserve privacy, commit is <strong>blocked</strong> unless these columns are dropped.
                    </p>
                    <label className="flex items-center gap-2 text-xs font-mono font-bold text-ink pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dropPhi}
                        onChange={(e) => setDropPhi(e.target.checked)}
                        className="accent-risk-up"
                      />
                      <span>Drop identified PHI columns automatically prior to ingest</span>
                    </label>
                  </div>
                ) : (
                  <div className="p-3 bg-state-success/10 border-l-4 border-state-success text-xs font-mono text-state-success flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>PHI Scan Passed: No direct patient identifiers detected.</span>
                  </div>
                )}

                {/* Suggested Mapping Table */}
                <div className="border border-rule bg-page overflow-hidden">
                  <div className="p-2.5 bg-page-shade font-mono text-[11px] font-bold text-ink uppercase border-b border-rule">
                    Column Mapping to Standard Data Dictionary
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    <table className="w-full text-left font-mono text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-rule text-ink-3 text-[10px]">
                          <th className="p-2">File Column</th>
                          <th className="p-2">Target Dictionary Variable</th>
                          <th className="p-2 text-right">Confidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scanResult.suggested_mappings.map((m: any, idx: number) => (
                          <tr key={idx} className="border-b border-rule/50 hover:bg-page-shade/40">
                            <td className="p-2 font-bold text-ink truncate max-w-[130px]">{m.file_column}</td>
                            <td className="p-2 text-state-teal">{m.suggested_variable || <span className="text-ink-3 italic">Unmapped</span>}</td>
                            <td className="p-2 text-right">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${m.confidence > 0.8 ? 'bg-state-success/15 text-state-success' : 'bg-page-shade text-ink-3'}`}>
                                {(m.confidence * 100).toFixed(0)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <FoldButton
                    onClick={handleCommitImport}
                    disabled={!deIdConfirmed || (scanResult.has_critical_phi && !dropPhi)}
                  >
                    <span>Commit Valid Encounters</span>
                    <ArrowRight className="w-4 h-4" />
                  </FoldButton>
                </div>
              </div>
            ) : (
              <div className="border border-rule p-6 bg-page text-center space-y-3 font-mono text-xs text-ink-3">
                <FileSpreadsheet className="w-8 h-8 mx-auto text-ink-3" />
                <p>Upload a file on the left spread to inspect schema mappings and PHI findings.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Record Form & Ledger */}
      {activeTab === 'ledger' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Page: In-App Printed Record Form */}
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-bold text-ink">In-App Encounter Record Entry</h3>
            <p className="text-xs text-ink-2">
              Enter or update single patient encounters using printed fields with immediate validation.
            </p>

            <form onSubmit={handleAddRecord} className="space-y-3 font-sans border border-rule p-4 bg-page">
              <div className="grid grid-cols-2 gap-3">
                <PrintedField
                  label="Encounter ID"
                  value={formRecord.encounter_id || ''}
                  onChange={(e) => setFormRecord({ ...formRecord, encounter_id: e.target.value })}
                  required
                />
                <PrintedField
                  label="Age (Years)"
                  type="number"
                  min="0"
                  max="120"
                  value={formRecord.age ?? ''}
                  onChange={(e) => setFormRecord({ ...formRecord, age: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono font-semibold uppercase text-ink-2 block mb-1">Sex</label>
                  <select
                    className="printed-field w-full text-xs"
                    value={formRecord.sex || 'Female'}
                    onChange={(e) => setFormRecord({ ...formRecord, sex: e.target.value })}
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-mono font-semibold uppercase text-ink-2 block mb-1">Insurance</label>
                  <select
                    className="printed-field w-full text-xs"
                    value={formRecord.insurance || 'Medicare'}
                    onChange={(e) => setFormRecord({ ...formRecord, insurance: e.target.value })}
                  >
                    <option value="Medicare">Medicare</option>
                    <option value="Medicaid">Medicaid</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono font-semibold uppercase text-ink-2 block mb-1">Primary Diagnosis</label>
                  <select
                    className="printed-field w-full text-xs"
                    value={formRecord.primary_dx_group || 'Circulatory'}
                    onChange={(e) => setFormRecord({ ...formRecord, primary_dx_group: e.target.value })}
                  >
                    <option value="Circulatory">Circulatory</option>
                    <option value="Respiratory">Respiratory</option>
                    <option value="Digestive">Digestive</option>
                    <option value="Diabetes/Endocrine">Diabetes/Endocrine</option>
                    <option value="Injury/Poisoning">Injury/Poisoning</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-mono font-semibold uppercase text-ink-2 block mb-1">Discharge Disposition</label>
                  <select
                    className="printed-field w-full text-xs"
                    value={formRecord.discharge_disposition || 'Home'}
                    onChange={(e) => setFormRecord({ ...formRecord, discharge_disposition: e.target.value })}
                  >
                    <option value="Home">Home</option>
                    <option value="Home Health">Home Health</option>
                    <option value="SNF/Rehab">SNF/Rehab</option>
                    <option value="AMA">Against Medical Advice (AMA)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <PrintedField
                  label="Comorbidities"
                  type="number"
                  min="0"
                  value={formRecord.comorbidity_count ?? ''}
                  onChange={(e) => setFormRecord({ ...formRecord, comorbidity_count: parseInt(e.target.value) || 0 })}
                />
                <PrintedField
                  label="Prior Admits (6m)"
                  type="number"
                  min="0"
                  value={formRecord.prior_admissions_6m ?? ''}
                  onChange={(e) => setFormRecord({ ...formRecord, prior_admissions_6m: parseInt(e.target.value) || 0 })}
                />
                <PrintedField
                  label="LOS (Days)"
                  type="number"
                  min="1"
                  value={formRecord.los_days ?? ''}
                  onChange={(e) => setFormRecord({ ...formRecord, los_days: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-mono font-semibold uppercase text-ink-2 block mb-1">Follow-up Scheduled</label>
                  <select
                    className="printed-field w-full text-xs"
                    value={formRecord.followup_scheduled ?? 1}
                    onChange={(e) => setFormRecord({ ...formRecord, followup_scheduled: parseInt(e.target.value) })}
                  >
                    <option value={1}>1 (Yes, scheduled)</option>
                    <option value={0}>0 (No follow-up)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-mono font-semibold uppercase text-ink-2 block mb-1">30-Day Readmitted (Label)</label>
                  <select
                    className="printed-field w-full text-xs font-bold text-ink"
                    value={formRecord.readmit_30d ?? 0}
                    onChange={(e) => setFormRecord({ ...formRecord, readmit_30d: parseInt(e.target.value) })}
                  >
                    <option value={0}>0 (Not readmitted)</option>
                    <option value={1}>1 (Readmitted &lt;= 30d)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3">
                <FoldButton type="submit">
                  <Plus className="w-4 h-4" />
                  <span>Save Encounter Record</span>
                </FoldButton>
              </div>
            </form>
          </div>

          {/* Right Page: Ledger Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-rule pb-2">
              <h4 className="font-mono text-xs font-bold uppercase text-ink">
                Encounter Ledger Archive ({encounters.length} loaded)
              </h4>
              <span className="text-[10px] font-mono text-ink-3">INLINE EDITABLE · VIRTUALIZED</span>
            </div>

            <div className="border border-rule bg-page overflow-x-auto max-h-[480px]">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead className="bg-page-shade sticky top-0 border-b border-rule text-ink-3 text-[10.5px]">
                  <tr>
                    <th className="p-2">ID</th>
                    <th className="p-2">Age/Sex</th>
                    <th className="p-2">Diagnosis</th>
                    <th className="p-2">Prior Adm</th>
                    <th className="p-2">Readmit</th>
                    <th className="p-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {encounters.map((enc) => (
                    <tr key={enc.encounter_id} className="border-b border-rule/50 hover:bg-page-shade/40">
                      <td className="p-2 font-bold text-ink">{enc.encounter_id}</td>
                      <td className="p-2">{enc.age} {enc.sex.charAt(0)}</td>
                      <td className="p-2 truncate max-w-[100px]" title={enc.primary_dx_group}>{enc.primary_dx_group}</td>
                      <td className="p-2">{enc.prior_admissions_6m}</td>
                      <td className="p-2">
                        {enc.readmit_30d === 1 ? (
                          <span className="px-1.5 py-0.5 bg-risk-up/15 text-risk-up font-bold rounded">1 (YES)</span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-state-success/15 text-state-success font-semibold rounded">0 (NO)</span>
                        )}
                      </td>
                      <td className="p-2 text-right">
                        <button
                          onClick={() => handleDeleteEncounter(enc.encounter_id)}
                          className="p-1 hover:text-risk-up text-ink-3"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Data Dictionary */}
      {activeTab === 'dictionary' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-rule pb-2">
            <div>
              <h3 className="font-serif text-2xl font-bold text-ink">Clinical Data Dictionary & Leakage Flags</h3>
              <p className="text-xs text-ink-2">
                Defines variable roles (feature, label, sensitive, excluded) and enforces strict leakage protection.
              </p>
            </div>
            <span className="font-mono text-xs text-state-teal font-semibold">
              {dictionary.length} Standard Variables
            </span>
          </div>

          <div className="border border-rule bg-page overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead className="bg-page-shade border-b border-rule text-ink-3 text-[10.5px]">
                <tr>
                  <th className="p-2.5">Variable</th>
                  <th className="p-2.5">Clinical Group</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Role</th>
                  <th className="p-2.5">Leakage Guard</th>
                  <th className="p-2.5">Clinical Description</th>
                </tr>
              </thead>
              <tbody>
                {dictionary.map((item, idx) => (
                  <tr key={idx} className="border-b border-rule/50 hover:bg-page-shade/40">
                    <td className="p-2.5 font-bold text-ink">{item.variable}</td>
                    <td className="p-2.5 capitalize text-ink-2">{item.clinical_group}</td>
                    <td className="p-2.5 text-ink-3">{item.type}</td>
                    <td className="p-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.role === 'label' ? 'bg-risk-up/20 text-risk-up' :
                        item.role === 'feature' ? 'bg-lime text-ink' :
                        item.role === 'sensitive' ? 'bg-state-warning/20 text-state-warning' :
                        'bg-page-shade text-ink-3'
                      }`}>
                        {item.role}
                      </span>
                    </td>
                    <td className="p-2.5">
                      {item.leakage_flag ? (
                        <span className="px-1.5 py-0.5 bg-risk-up text-page rounded text-[10px] font-bold">
                          BLOCKED (LEAKAGE)
                        </span>
                      ) : (
                        <span className="text-state-success text-[10px]">Safe</span>
                      )}
                    </td>
                    <td className="p-2.5 text-ink-2 font-sans text-xs">{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
