"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Settings, 
  Save, 
  Ticket, 
  Video, 
  ArrowLeft, 
  ShieldAlert, 
  CheckCircle2, 
  Globe, 
  UserPlus, 
  FileSpreadsheet, 
  Search, 
  TrendingUp 
} from 'lucide-react';
import { updateVideoUrl, publishAnnouncement, publishLeaderboard } from './actions';

interface SlipItem {
  id: string;
  schoolId: string;
  slipNumber: string;
  amount: any; // Decimal type
  status: string;
  createdAt: Date | string;
}

interface SuperAdminClientProps {
  initialVideoUrl: string;
  slips: SlipItem[];
}

export default function SuperAdminClient({ initialVideoUrl, slips }: SuperAdminClientProps) {
  // Video state
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl);
  const [videoSaving, setVideoSaving] = useState(false);
  const [videoSaved, setVideoSaved] = useState(false);

  // Announcement state
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annImageUrl, setAnnImageUrl] = useState('');
  const [annPublishing, setAnnPublishing] = useState(false);
  const [annSuccess, setAnnSuccess] = useState(false);

  // Leaderboard state
  const [leaderTitle, setLeaderTitle] = useState('');
  const [leaderContent, setLeaderContent] = useState('');
  const [leaderSchoolId, setLeaderSchoolId] = useState('');
  const [leaderTargetId, setLeaderTargetId] = useState('');
  const [leaderPublishing, setLeaderPublishing] = useState(false);
  const [leaderSuccess, setLeaderSuccess] = useState(false);

  // Slip ledger filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Handle Video URL Update
  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;
    setVideoSaving(true);
    try {
      await updateVideoUrl(videoUrl);
      setVideoSaved(true);
      setTimeout(() => setVideoSaved(false), 3000);
    } catch (err) {
      alert('Failed to update video URL');
    } finally {
      setVideoSaving(false);
    }
  };

  // Handle Announcement Publication
  const handlePublishAnn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    setAnnPublishing(true);
    try {
      await publishAnnouncement(annTitle, annContent, annImageUrl);
      setAnnSuccess(true);
      setAnnTitle('');
      setAnnContent('');
      setAnnImageUrl('');
      setTimeout(() => setAnnSuccess(false), 3000);
    } catch (err) {
      alert('Failed to publish announcement');
    } finally {
      setAnnPublishing(false);
    }
  };

  // Handle Leaderboard Publication
  const handlePublishLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaderTitle.trim() || !leaderContent.trim() || !leaderSchoolId.trim()) return;
    setLeaderPublishing(true);
    try {
      await publishLeaderboard(leaderTitle, leaderContent, leaderSchoolId, leaderTargetId);
      setLeaderSuccess(true);
      setLeaderTitle('');
      setLeaderContent('');
      setLeaderSchoolId('');
      setLeaderTargetId('');
      setTimeout(() => setLeaderSuccess(false), 3000);
    } catch (err) {
      alert('Failed to publish Student of the Week leaderboard notice');
    } finally {
      setLeaderPublishing(false);
    }
  };

  // Filter slips list based on search term
  const filteredSlips = slips.filter(slip => 
    slip.slipNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    slip.schoolId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    slip.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 p-8 font-sans antialiased selection:bg-sky-600 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb & Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6 gap-4">
          <div>
            <Link href="/" className="inline-flex items-center gap-1.5 text-sky-600 hover:text-sky-700 text-xs font-bold uppercase tracking-wider mb-3 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Sovereign Workspace
            </Link>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-sky-600" />
              Sovereign Super Admin Portal
            </h1>
            <p className="text-slate-500 text-sm mt-1">Platform Content Management Engine & Support Dashboard</p>
          </div>
          <div className="bg-sky-50 text-sky-700 border border-sky-200 px-4 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-2 self-start md:self-center">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></span>
            ACTIVE DATABASE PIPELINE
          </div>
        </div>

        {/* Dynamic Homepage CMS Settings forms */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Form controls */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Video Frame Config Form */}
            <form onSubmit={handleSaveVideo} className="inst-card-light shadow-md bg-white">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <Video className="w-5.5 h-5.5 text-sky-600" />
                <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-950">Dynamic Video Stream Controller</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Homepage Video Source URL</label>
                  <input 
                    type="url" 
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 transition-all font-mono"
                    placeholder="https://example.com/stream.mp4"
                  />
                  <p className="text-[11px] text-slate-400 mt-2">Binds the landing page video player src parameter dynamically in PostgreSQL</p>
                </div>
                
                <button 
                  type="submit"
                  disabled={videoSaving}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {videoSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {videoSaving ? 'Updating Feed...' : videoSaved ? 'Configuration Saved!' : 'Update Video URL'}
                </button>
              </div>
            </form>

            {/* Global Notice Card announcement form */}
            <form onSubmit={handlePublishAnn} className="inst-card-light shadow-md bg-white">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <Globe className="w-5.5 h-5.5 text-emerald-600" />
                <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-950">Publish Global Broadcast</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Announcement Title</label>
                  <input 
                    type="text" 
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 transition-all"
                    placeholder="E.g., Mid-Term Assessment Deadline Schedule"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Announcement content details</label>
                  <textarea 
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    required
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 transition-all resize-none"
                    placeholder="Enter full details of the administrative announcement..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Illustration media path URL (Optional)</label>
                  <input 
                    type="url" 
                    value={annImageUrl}
                    onChange={(e) => setAnnImageUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 transition-all font-mono"
                    placeholder="https://images.unsplash.com/photo-..."
                  />
                </div>

                <button 
                  type="submit"
                  disabled={annPublishing}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {annSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Globe className="w-4 h-4" />}
                  {annPublishing ? 'Publishing Notice...' : annSuccess ? 'Announcement Broadcasted!' : 'Broadcast Announcement'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Form controls */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Student of Week Leaderboard notice form */}
            <form onSubmit={handlePublishLeader} className="inst-card-light shadow-md bg-white">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <TrendingUp className="w-5.5 h-5.5 text-amber-500" />
                <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-950">Student recognition engine</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Student Full Name</label>
                  <input 
                    type="text" 
                    value={leaderTitle}
                    onChange={(e) => setLeaderTitle(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 transition-all"
                    placeholder="E.g., Sarah Jenkins"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Achievements & Criteria Summary</label>
                  <textarea 
                    value={leaderContent}
                    onChange={(e) => setLeaderContent(e.target.value)}
                    required
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 transition-all resize-none"
                    placeholder="Outstanding performance in calculus assessment and perfect behavior..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">School Node identifier (School ID)</label>
                  <input 
                    type="text" 
                    value={leaderSchoolId}
                    onChange={(e) => setLeaderSchoolId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 transition-all font-mono"
                    placeholder="e.g., d9b0f6eb-46b5-4b08-8e6a-72efb6f5cfbb"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Student Profile Tracking ID (Optional)</label>
                  <input 
                    type="text" 
                    value={leaderTargetId}
                    onChange={(e) => setLeaderTargetId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 transition-all font-mono"
                    placeholder="UUID of the student profile"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={leaderPublishing}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl transition-all flex items-center gap-2 w-full justify-center cursor-pointer disabled:opacity-50"
                >
                  {leaderSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {leaderPublishing ? 'Publishing Award...' : leaderSuccess ? 'Student Recognized!' : 'Approve Student of the Week'}
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Slips Technical Support Ledger section */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-5 gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-slate-950 flex items-center gap-2">
                <FileSpreadsheet className="w-5.5 h-5.5 text-emerald-600" />
                Institutional Payment Support Log
              </h3>
              <p className="text-slate-500 text-xs">
                Global administrative readonly access ledger to inspect multi-tenant bank payment slips.
              </p>
            </div>
            
            {/* Search Input bar */}
            <div className="relative max-w-sm w-full">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-900 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 transition-all"
                placeholder="Search slip code, status, or school..."
              />
            </div>
          </div>

          {filteredSlips.length === 0 ? (
            <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-900 text-sm">No payment slips recorded</h4>
              <p className="text-xs text-slate-500 mt-1">Payment slips are synced securely from local campus business portals.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-150">
              <table className="min-w-full divide-y divide-slate-150 text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Slip Number</th>
                    <th className="px-6 py-4">School ID Node</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status State</th>
                    <th className="px-6 py-4">Registration Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 bg-white">
                  {filteredSlips.map((slip) => (
                    <tr key={slip.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">{slip.slipNumber}</td>
                      <td className="px-6 py-4 font-mono text-slate-500">{slip.schoolId}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        ${Number(slip.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          slip.status === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : slip.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {slip.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(slip.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
