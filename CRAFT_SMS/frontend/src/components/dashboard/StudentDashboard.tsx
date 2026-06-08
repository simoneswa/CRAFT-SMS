"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Home, MessageSquare, Compass, Bell, ChevronDown,
  Search, Calendar, User, Clock, CheckSquare, BookOpen,
  Eye, GraduationCap
} from 'lucide-react'
import { useAuth } from '../../providers/AuthProvider'
import { useTenant } from '../../providers/TenantProvider'
import { CraftLogo } from '../ui/CraftLogo'

const WEEK_DAYS: { day: string; num: string }[] = []

const TODO_ITEMS: {
  icon: any;
  iconBg: string;
  iconColor: string;
  title: string;
  course: string;
  deadline: string;
}[] = []

const COURSES: {
  name: string;
  department: string;
  instructor: string;
  time: string;
  attendance: number;
  totalSessions: number;
  tags: string[];
}[] = []

function getTagStyle(tag: string) {
  if (tag.includes('Project')) return 'bg-amber-50 text-amber-600'
  if (tag.includes('Case')) return 'bg-cyan-50 text-cyan-600'
  return 'bg-indigo-50 text-indigo-600'
}

export default function StudentDashboard() {
  const params = useParams()
  const subdomain = params?.subdomain as string
  const { profile } = useAuth()
  const { school } = useTenant()
  const [activeTab, setActiveTab] = useState<'academic' | 'personal'>('academic')
  const [searchQuery, setSearchQuery] = useState('')
  const [semester, setSemester] = useState('2025/2026 Even')

  const todayIndex = 5 // Saturday as "active" day

  const filteredCourses = COURSES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.instructor.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 font-sans">
      {/* 1. GLOBAL NAVIGATION BAR */}
      <nav className="bg-[#10b981] text-white px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <CraftLogo className="h-8 w-auto invert" />
            <div className="border-l border-white/30 pl-2 text-xs text-emerald-100">
              <p className="font-bold">{school?.name || 'School'}</p>
              <p className="text-[10px] opacity-80">Student Portal</p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-1 font-medium text-sm">
            <Link href={`/${subdomain}/dashboard`}>
              <button className="flex items-center space-x-1 bg-white/10 px-3 py-1.5 rounded-md">
                <Home size={16} /> <span>Home page</span>
              </button>
            </Link>
            <Link href={`/${subdomain}/dashboard/news`}>
              <button className="flex items-center space-x-1 hover:bg-white/10 px-3 py-1.5 rounded-md opacity-90">
                <Calendar size={16} /> <span>Timeline &amp; News</span>
              </button>
            </Link>
            <Link href={`/${subdomain}/dashboard/messages`}>
              <button className="flex items-center space-x-1 hover:bg-white/10 px-3 py-1.5 rounded-md opacity-90">
                <MessageSquare size={16} /> <span>Chat</span>
              </button>
            </Link>
            <button className="flex items-center space-x-1 hover:bg-white/10 px-3 py-1.5 rounded-md opacity-90">
              <Compass size={16} /> <span>Explore</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative cursor-pointer p-1.5 hover:bg-white/10 rounded-full">
            <Bell size={20} />
            <span className="absolute top-1 right-1 bg-amber-500 text-[10px] font-bold px-1 rounded-full text-white">1</span>
          </div>
          <div className="flex items-center space-x-2 border-l border-white/20 pl-4 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-emerald-700 overflow-hidden border border-white flex items-center justify-center text-white font-bold text-xs">
              {(profile?.full_name || 'S')[0]}
            </div>
            <div className="hidden sm:block text-left text-xs">
              <p className="font-bold leading-tight">{profile?.full_name || 'STUDENT'}</p>
              <p className="text-[10px] opacity-70">Student</p>
            </div>
            <ChevronDown size={14} className="opacity-80" />
          </div>
        </div>
      </nav>

      {/* MAIN TWO-COLUMN CONTAINER */}
      <div className="max-w-[1400px] mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* 2. LEFT SIDEBAR */}
        <aside className="lg:col-span-3 space-y-6">
          {/* Schedule Widget */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm">This Week&apos;s Schedule</h3>
              <span className="text-[11px] text-slate-400 font-medium">Today: June 14, 2026</span>
            </div>

            {/* 7 Day Strip */}
            <div className="grid grid-cols-7 gap-1 text-center mb-6 text-xs border-b border-slate-100 pb-3">
              {WEEK_DAYS.map(({ day, num }, i) => (
                <div
                  key={num}
                  className={`p-1 ${i === todayIndex ? 'bg-emerald-50 rounded-md border border-emerald-200' : ''}`}
                >
                  <p className={`text-[10px] ${i === todayIndex ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>{day}</p>
                  <p className={`mt-0.5 ${i === todayIndex ? 'font-black text-emerald-600' : 'font-semibold text-slate-700'}`}>{num}</p>
                </div>
              ))}
            </div>

            {/* Empty State Schedule */}
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-2 text-slate-300">
                <Calendar size={28} />
              </div>
              <p className="text-xs text-slate-400 max-w-[180px]">There are no classes scheduled on this date.</p>
            </div>
          </div>

          {/* Todo List Widget */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center space-x-2 mb-4">
              <h3 className="font-bold text-sm">Needs to be done</h3>
              <span className="bg-rose-100 text-rose-600 font-bold text-xs px-1.5 py-0.5 rounded-full">{TODO_ITEMS.length}</span>
            </div>

            <div className="space-y-4">
              {TODO_ITEMS.map((item, i) => (
                <div key={i} className="flex items-start space-x-3 p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                  <div className={`p-2 ${item.iconBg} ${item.iconColor} rounded-lg mt-0.5`}>
                    <item.icon size={16} />
                  </div>
                  <div className="text-xs">
                    <h4 className="font-bold text-slate-800">{item.title}</h4>
                    <p className="text-slate-400 text-[11px] font-medium">{item.course}</p>
                    <p className="text-rose-500 font-medium mt-1 text-[10px]">{item.deadline}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* 3. MAIN CONTENT AREA */}
        <main className="lg:col-span-9 space-y-6">
          {/* Tabs Control */}
          <div className="border-b border-slate-200 flex space-x-6 text-sm font-semibold">
            <button
              className={`pb-2 px-1 ${activeTab === 'academic' ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
              onClick={() => setActiveTab('academic')}
            >
              Academic Class
            </button>
            <button
              className={`pb-2 px-1 ${activeTab === 'personal' ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
              onClick={() => setActiveTab('personal')}
            >
              Personal Class
            </button>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by course, class code, or lecturer name"
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div className="relative">
              <select
                value={semester}
                onChange={e => setSemester(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option>2025/2026 Even</option>
                <option>2025/2026 Odd</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={14} />
            </div>
          </div>

          {/* Grid Layout for Academic Classes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCourses.map((course, i) => {
              const pct = course.totalSessions > 0
                ? Math.round((course.attendance / course.totalSessions) * 100)
                : 0
              return (
                <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm hover:text-emerald-600 cursor-pointer">{course.name}</h3>
                    <p className="text-[11px] text-slate-400 font-medium">{course.department}</p>

                    {/* Learning tags */}
                    <div className="flex flex-wrap gap-1.5 my-4">
                      {course.tags.map((tag, ti) => (
                        <span key={ti} className={`text-[10px] font-bold px-2 py-0.5 rounded ${getTagStyle(tag)}`}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-500 mb-6">
                      <div className="flex items-center space-x-2">
                        <User size={13} className="text-slate-400" />
                        <span>{course.instructor}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock size={13} className="text-slate-400" />
                        <span>{course.time}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Footer */}
                  <div className="border-t border-slate-100 pt-3 text-xs">
                    <div className="flex justify-between items-center mb-1 text-[11px] text-slate-400">
                      <span>Attendance: {course.attendance} of {course.totalSessions} sessions</span>
                      <span className="font-bold text-slate-600">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredCourses.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-100 p-12 text-center text-slate-400 text-sm">
              <Search size={28} className="mx-auto mb-3 opacity-40" />
              <p>No courses match your search.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
