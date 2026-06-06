import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Activity, ShieldCheck, Settings, AlertTriangle } from 'lucide-react';
import { fetchAPI } from '../../lib/api';

export function AdminWidget() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Assuming there's a recent activity endpoint; fallback to audit logs if missing
        const data = await fetchAPI('/admin/audit-logs').catch(() => []);
        setLogs(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || 'Failed to load activity');
        setLogs([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer group">
          <Users className="w-5 h-5 text-teal-400 mb-2" />
          <p className="text-sm font-bold text-white">Student Directory</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Manage Records</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer group">
          <BookOpen className="w-5 h-5 text-blue-400 mb-2" />
          <p className="text-sm font-bold text-white">Faculty Control</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Assignments</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer group">
          <Activity className="w-5 h-5 text-purple-400 mb-2" />
          <p className="text-sm font-bold text-white">Academic Audits</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Term Reports</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer group">
          <ShieldCheck className="w-5 h-5 text-emerald-400 mb-2" />
          <p className="text-sm font-bold text-white">User Approvals</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Pending: 0</p>
        </div>
      </div>

      <div className="premium-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Recent System Activity</h3>
          <Settings className="w-4 h-4 text-gray-500" />
        </div>
        <div className="space-y-4 min-h-[100px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-full py-4">
               <div className="w-6 h-6 border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <AlertTriangle className="w-6 h-6 text-rose-500 mb-2" />
              <p className="text-sm text-gray-400">Activity feed unavailable.</p>
            </div>
          ) : logs.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-4">No recent activity found in your institution.</p>
          ) : (
            logs.slice(0, 5).map((log, i) => (
              <div key={log.id || i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-300">{log.action || 'Unknown Action'}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">By {log.actor?.full_name || 'System'}</p>
                </div>
                <span className="text-xs font-bold text-teal-500/70">
                  {log.created_at ? new Date(log.created_at).toLocaleDateString() : 'Just now'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
