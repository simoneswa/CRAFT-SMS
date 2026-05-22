import React from 'react';
import { Users, BookOpen, Activity, ShieldCheck, Settings } from 'lucide-react';

export function AdminWidget() {
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
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Pending: 12</p>
        </div>
      </div>

      <div className="premium-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Recent System Activity</h3>
          <Settings className="w-4 h-4 text-gray-500" />
        </div>
        <div className="space-y-4">
          {[
            { action: 'Grade published for Grade 10 Math', user: 'Mr. Smith', time: '10 mins ago' },
            { action: 'New student enrollment verified', user: 'Admissions Dept', time: '1 hour ago' },
            { action: 'Term 1 financial report exported', user: 'Business Office', time: '3 hours ago' }
          ].map((log, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-300">{log.action}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">By {log.user}</p>
              </div>
              <span className="text-xs font-bold text-teal-500/70">{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
