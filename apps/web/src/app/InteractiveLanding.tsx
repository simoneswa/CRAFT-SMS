"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, 
  Globe, 
  ArrowRight, 
  ChevronRight, 
  Lock, 
  Calendar, 
  Video, 
  Clock, 
  Bell, 
  BookOpen, 
  Award, 
  Play, 
  X, 
  ExternalLink,
  Shield,
  FileSpreadsheet,
  Users
} from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  description: string | null;
  content: string;
  imageUrl: string | null;
  badgeColor: string | null;
  icon: string | null;
  createdAt: Date | string;
}

interface LeaderboardItem {
  id: string;
  schoolId: string;
  title: string;
  content: string;
  targetId: string | null;
  createdAt: Date | string;
}

interface InteractiveLandingProps {
  newsFeed: NewsItem[];
  initialVideoUrl: string;
  leaderboard: LeaderboardItem | null;
}

export default function InteractiveLanding({ newsFeed, initialVideoUrl, leaderboard }: InteractiveLandingProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Mount check to avoid Next.js SSR hydration warnings on browser elements
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-900 font-semibold">
        Initialising CRAFT SMS...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--promo-bg-canvas)] text-[var(--promo-text-main)] selection:bg-[var(--brand-primary)] selection:text-white antialiased font-sans">
      
      {/* Dynamic Navbar */}
      <nav className="border-b border-[var(--promo-border)] bg-white/80 backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[var(--brand-primary)] border border-sky-500/10 rounded-lg flex items-center justify-center shadow-sm">
              <GraduationCap className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-extrabold tracking-wider text-slate-900">
              CRAFT <span className="text-[var(--brand-primary)]">SMS</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              Sovereign Registry Online
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <button className="bg-slate-900 hover:bg-slate-800 text-white py-2 px-5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer">
                Workspace Login
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Copy Column */}
          <div className="lg:col-span-6 space-y-6">
            <span className="inline-flex border border-sky-200 text-sky-700 bg-sky-50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Unified National System
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight text-slate-900">
              Secure Infrastructure for Educational Records
            </h1>
            <p className="text-[var(--promo-text-muted)] text-base md:text-lg leading-relaxed max-w-xl">
              CRAFT SMS provides educational ministries, school districts, and campuses with robust academic record management, student E-ID verification, and secure business office syncing.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link href="/login">
                <button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white py-3.5 px-7 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5">
                  Authenticate Workspace
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/login">
                <button className="bg-white hover:bg-slate-50 border border-[var(--promo-border)] text-slate-700 py-3.5 px-7 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer shadow-sm">
                  Review Platform Docs
                </button>
              </Link>
            </div>
          </div>

          {/* Dynamic Video Player Column */}
          <div className="lg:col-span-6">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-2xl group aspect-video">
              {!isPlaying ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-[2px] z-10 p-6 text-center">
                  <button 
                    onClick={() => setIsPlaying(true)}
                    className="w-16 h-16 bg-white hover:bg-sky-50 text-[var(--brand-primary)] rounded-full flex items-center justify-center shadow-2xl transition-transform duration-300 hover:scale-110 cursor-pointer"
                  >
                    <Play className="w-7 h-7 fill-current ml-1" />
                  </button>
                  <p className="text-white/95 font-bold mt-4 tracking-wide text-sm flex items-center gap-2">
                    <Video className="w-4.5 h-4.5 text-sky-400" />
                    CRAFT SMS Core Platform Tour
                  </p>
                  <p className="text-white/60 text-xs mt-1 max-w-xs">
                    Live dynamic video URL loaded from PostgreSQL Configuration
                  </p>
                </div>
              ) : null}
              <video 
                src={initialVideoUrl}
                controls={isPlaying}
                autoPlay={isPlaying}
                className="w-full h-full object-cover"
                loop
                muted
              />
            </div>
          </div>

        </div>
      </section>

      {/* Student of the Week Leaderboard Engine (Dynamic Notice Card) */}
      {leaderboard && (
        <section className="max-w-6xl mx-auto px-6 py-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl p-8 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
            {/* Background absolute decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-100/40 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-amber-100/40 rounded-full blur-xl pointer-events-none" />
            
            {/* Trophy Icon Area */}
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 shadow-sm animate-bounce">
              <Award className="w-9 h-9 text-amber-500" />
            </div>

            {/* Content Area */}
            <div className="flex-1 space-y-2 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                  Leaderboard Engine
                </span>
                <span className="text-slate-400 text-xs font-medium">• Automated Recognition</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Student of the Week: {leaderboard.title}
              </h2>
              <p className="text-[var(--promo-text-muted)] text-sm max-w-3xl leading-relaxed">
                {leaderboard.content}
              </p>

              {/* Tracking References */}
              <div className="pt-2 flex flex-wrap justify-center md:justify-start items-center gap-4 text-[11px] font-mono text-slate-500">
                <span className="bg-slate-100 px-2 py-1 rounded">School ID: {leaderboard.schoolId}</span>
                {leaderboard.targetId && (
                  <span className="bg-slate-100 px-2 py-1 rounded">Target Record: {leaderboard.targetId}</span>
                )}
              </div>
            </div>

            {/* Quick action button */}
            <div className="shrink-0 pt-4 md:pt-0">
              <Link href="/login">
                <button className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer">
                  View Leaderboard
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Dynamic News Feed Section */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest bg-sky-50 border border-sky-100 px-2.5 py-1 rounded-full">
              Platform Broadcasts
            </span>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Official Ministry & Platform News Feed
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {newsFeed.length} Announcements
          </span>
        </div>

        {newsFeed.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
            <Globe className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h4 className="text-slate-900 font-bold">No active broadcast announcements</h4>
            <p className="text-slate-500 text-sm mt-1">Super Administrators publish content updates securely via admin panels.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsFeed.map((item) => (
              <div 
                key={item.id} 
                className="inst-card-light flex flex-col justify-between"
                onClick={() => setSelectedNews(item)}
              >
                <div>
                  {/* Decorative Icon */}
                  <div className="w-11 h-11 bg-sky-50 border border-sky-100 rounded-xl flex items-center justify-center mb-5">
                    <Globe className="w-5.5 h-5.5 text-sky-600" />
                  </div>
                  
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-sky-600 bg-sky-50/50 border border-sky-100/50 px-2 py-0.5 rounded">
                    Global Broadcast
                  </span>
                  
                  <h4 className="text-base font-extrabold text-slate-900 mt-3 mb-2 line-clamp-2">
                    {item.title}
                  </h4>
                  
                  <p className="text-[var(--promo-text-muted)] text-xs leading-relaxed line-clamp-3 mb-4">
                    {item.content || item.description}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-[var(--brand-primary)] font-bold flex items-center gap-1 group-hover:underline">
                    Read Details
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Feature Highlights Grid */}
      <section className="bg-slate-100/60 border-y border-slate-200 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h3 className="text-3xl font-black tracking-tight text-slate-900">National Record Management Spine</h3>
            <p className="text-[var(--promo-text-muted)] mt-2">Comprehensive features built to secure academic integrity and workflow efficiency.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center">
                <Shield className="w-5 h-5 text-sky-600" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Full Auditable Event Chain</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Every modification is permanently saved to our custom event store and secured via cryptographic audit hash chains.
              </p>
            </div>
            
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Payment Verification Hub</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                School business administrators upload and verify student bank payment slips with instant multi-tenant syncing.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Student recognition & E-IDs</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Offline-capable local databases index student portfolios, achievements, and active Student of the Week rosters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Details Modal Pop-Up Box */}
      <AnimatePresence>
        {selectedNews && (
          <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-600 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded">
                    Official Broadcast Announcement
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-3 tracking-tight">
                    {selectedNews.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">
                    Published: {new Date(selectedNews.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedNews(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                  {selectedNews.content || selectedNews.description}
                </p>

                {selectedNews.imageUrl && (
                  <div className="rounded-xl overflow-hidden border border-slate-100 shadow-sm aspect-video">
                    <img 
                      src={selectedNews.imageUrl} 
                      alt={selectedNews.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 p-6 border-t border-slate-100 flex items-center justify-between">
                <Link href="/login" className="flex-1 mr-4">
                  <button className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl w-full flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                    Authenticate Workspace to Proceed
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </Link>
                <button 
                  onClick={() => setSelectedNews(null)}
                  className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider py-3.5 px-5 rounded-xl transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}
