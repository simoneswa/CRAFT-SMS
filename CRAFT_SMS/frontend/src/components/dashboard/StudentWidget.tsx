import React, { useState, useEffect } from 'react';
import { BookOpen, Trophy, Zap, Clock, ChevronRight, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/providers/TenantProvider';

export function StudentWidget() {
  const [grades, setGrades] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { school } = useTenant();

  useEffect(() => {
    const loadStudentData = async () => {
      if (!school) return;
      try {
        setIsLoading(true);
        // Fetch recent grades for the student
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          throw new Error('Not authenticated');
        }

        const { data, error: fetchError } = await supabase
          .from('grades')
          .select('id, score, max_score, class_subject_id')
          .eq('school_id', school.id)
          .eq('student_id', session.user.id)
          .limit(3);

        if (fetchError) throw fetchError;
        setGrades(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load student data');
      } finally {
        setIsLoading(false);
      }
    };
    loadStudentData();
  }, [school]);

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
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 min-h-[150px]">
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Current Term Progress</h4>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-20">
               <div className="w-6 h-6 border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-20 text-center">
              <AlertTriangle className="w-6 h-6 text-rose-500 mb-2" />
              <p className="text-sm text-gray-400">Progress data unavailable.</p>
            </div>
          ) : grades.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-4">No recent grades available.</p>
          ) : (
            <div className="space-y-4">
              {grades.map((item, i) => {
                const percentage = item.max_score ? Math.round((item.score / item.max_score) * 100) : item.score;
                return (
                <div key={item.id || i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center font-black text-teal-400 text-xs">
                      S
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">Subject {i + 1}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">{percentage}%</p>
                    <p className="text-[9px] text-gray-600 font-bold uppercase">Stable</p>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>

        {/* Assignments */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-teal-500/5 border border-teal-500/10 hover:bg-teal-500/10 transition-colors cursor-pointer group">
            <BookOpen className="w-5 h-5 text-teal-400 mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-xl font-bold text-white mb-1">0</p>
            <p className="text-[10px] font-bold text-teal-500/70 uppercase tracking-widest">Pending Assignments</p>
          </div>
          <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10 hover:bg-purple-500/10 transition-colors cursor-pointer group">
            <Trophy className="w-5 h-5 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-xl font-bold text-white mb-1">Top 10%</p>
            <p className="text-[10px] font-bold text-purple-500/70 uppercase tracking-widest">Class Ranking</p>
          </div>
        </div>
      </div>
    </div>
  );
}
