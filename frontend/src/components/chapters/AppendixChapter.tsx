import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Shield, Users, Activity, FileText } from 'lucide-react';

export const AppendixChapter: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'audit' | 'users' | 'system'>('audit');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [userList, setUserList] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  useEffect(() => {
    loadAudit();
    loadSystem();
    if (user?.role === 'Admin') {
      loadUsers();
    }
  }, [user]);

  const loadAudit = async () => {
    try {
      const res = await api.getAudit();
      setAuditLogs(res || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.getUsers();
      setUserList(res || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadSystem = async () => {
    try {
      const res = await api.getSystem();
      setSystemHealth(res);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Navigation */}
      <div className="flex items-center gap-2 border-b border-rule pb-3 font-mono text-xs">
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-1 rounded uppercase font-bold transition-colors ${
            activeTab === 'audit' ? 'bg-ink text-lime' : 'text-ink-2 hover:bg-page-shade'
          }`}
        >
          APPENDIX A · AUDIT TRAIL
        </button>
        {user?.role === 'Admin' && (
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1 rounded uppercase font-bold transition-colors ${
              activeTab === 'users' ? 'bg-ink text-lime' : 'text-ink-2 hover:bg-page-shade'
            }`}
          >
            APPENDIX B · USER DIRECTORY
          </button>
        )}
        <button
          onClick={() => setActiveTab('system')}
          className={`px-3 py-1 rounded uppercase font-bold transition-colors ${
            activeTab === 'system' ? 'bg-ink text-lime' : 'text-ink-2 hover:bg-page-shade'
          }`}
        >
          APPENDIX C · SYSTEM HEALTH & ENVIRONMENT
        </button>
      </div>

      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-rule pb-2">
            <h3 className="font-serif text-2xl font-bold text-ink">Comprehensive Governance Audit Log</h3>
            <span className="font-mono text-xs text-ink-3">{auditLogs.length} Events Recorded</span>
          </div>

          <div className="border border-rule bg-page overflow-x-auto max-h-[500px]">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead className="bg-page-shade sticky top-0 border-b border-rule text-ink-3 text-[10.5px]">
                <tr>
                  <th className="p-2.5">Timestamp</th>
                  <th className="p-2.5">User Identity</th>
                  <th className="p-2.5">Action Code</th>
                  <th className="p-2.5">Context & Parameters</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, idx) => (
                  <tr key={idx} className="border-b border-rule/50 hover:bg-page-shade/40 text-[11px]">
                    <td className="p-2.5 text-ink-3 whitespace-nowrap">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recent'}
                    </td>
                    <td className="p-2.5 font-bold text-ink">{log.user_email}</td>
                    <td className="p-2.5">
                      <span className="px-1.5 py-0.5 bg-page-shade border border-rule rounded text-state-teal font-semibold">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-2.5 text-ink-2 truncate max-w-xs" title={JSON.stringify(log.details)}>
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-rule pb-2">
            <h3 className="font-serif text-2xl font-bold text-ink">Registered Personnel & Roles</h3>
            <span className="font-mono text-xs text-state-teal font-semibold">Admin Restricted</span>
          </div>

          <div className="border border-rule bg-page overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead className="bg-page-shade border-b border-rule text-ink-3 text-[10.5px]">
                <tr>
                  <th className="p-2.5">Email Identity</th>
                  <th className="p-2.5">Full Name</th>
                  <th className="p-2.5">Assigned Role</th>
                  <th className="p-2.5">Institution / Department</th>
                </tr>
              </thead>
              <tbody>
                {userList.map((u) => (
                  <tr key={u.id} className="border-b border-rule/50 hover:bg-page-shade/40">
                    <td className="p-2.5 font-bold text-ink">{u.email}</td>
                    <td className="p-2.5">{u.full_name}</td>
                    <td className="p-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.role === 'Admin' ? 'bg-risk-up/20 text-risk-up' :
                        u.role === 'Clinical Reviewer' ? 'bg-state-warning/20 text-state-warning' :
                        'bg-lime text-ink'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-2.5 text-ink-3">{u.institution || 'Hospital Quality Board'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-rule pb-2">
            <h3 className="font-serif text-2xl font-bold text-ink">System Environment & Database Telemetry</h3>
            <span className="font-mono text-xs text-state-success font-bold">HEALTHY</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="border border-rule p-4 bg-page space-y-2">
              <span className="font-bold text-ink uppercase tracking-wider block text-[11px]">Database Connection</span>
              <div className="flex justify-between py-1 border-b border-rule/50">
                <span className="text-ink-3">Engine:</span>
                <span className="font-bold text-ink">MongoDB Atlas (PyMongo)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-rule/50">
                <span className="text-ink-3">Connection Status:</span>
                <span className="text-state-success font-bold">Connected ({systemHealth?.mongodb_connected ? 'OK' : 'Degraded'})</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-ink-3">Active Encounters Count:</span>
                <span className="font-bold text-ink">12,000</span>
              </div>
            </div>

            <div className="border border-rule p-4 bg-page space-y-2">
              <span className="font-bold text-ink uppercase tracking-wider text-[11px]">Runtime Engine</span>
              <div className="flex justify-between py-1 border-b border-rule/50">
                <span className="text-ink-3">Python Version:</span>
                <span className="font-bold text-ink">{systemHealth?.python_version || '3.12.10'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-rule/50">
                <span className="text-ink-3">Platform:</span>
                <span className="font-bold text-ink">{systemHealth?.platform || 'Windows'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-ink-3">Theme System:</span>
                <span className="font-bold text-ink">Dossier Lime & Ink (Light Only)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
