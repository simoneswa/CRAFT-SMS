import React from 'react';
import { BookOpen, Trophy, Zap, Clock, ChevronRight } from 'lucide-react';

export function StudentWidget() {
  return (
    <div className="premium-card bg-white/[0.01] border-white/5">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-bold text-white">Course Progress & Assignments</h3>
        <button className="text-teal-400 text-xs font-bold hover:text-teal-300 transition-all flex items-center gap-1">
          Full Academic Report <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      
      <div className="space-y-6">
        {/* Progress Tracker */}
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5">
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Current Term Progress</h4>
          <div className="space-y-4">
            {[
              { subject: 'Advanced Mathematics', score: 94, trend: '+2%' },
              { subject: 'Quantum Physics', score: 88, trend: 'Stable' },
              { subject: 'World History', score: 91, trend: '+5%' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center font-black text-teal-400 text-xs">
                    {item.subject[0]}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white">{item.subject}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-400">{item.score}%</p>
                  <p className="text-[9px] text-gray-600 font-bold uppercase">{item.trend}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assignments */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-teal-500/5 border border-teal-500/10 hover:bg-teal-500/10 transition-colors cursor-pointer group">
            <BookOpen className="w-5 h-5 text-teal-400 mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-xl font-bold text-white mb-1">3</p>
            <p className="text-[10px] font-bold text-teal-500/70 uppercase tracking-widest">Pending Assignments</p>
          </div>
          <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10 hover:bg-purple-500/10 transition-colors cursor-pointer group">
            <Trophy className="w-5 h-5 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-xl font-bold text-white mb-1">Top 5%</p>
            <p className="text-[10px] font-bold text-purple-500/70 uppercase tracking-widest">Class Ranking</p>
          </div>
        </div>
      </div>
    </div>
  );
}
