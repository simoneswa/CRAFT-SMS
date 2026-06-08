import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Platform Operations Guide — CRAFT SMS',
  description: 'Read the CRAFT SMS Platform Operations Guide. Last updated May 27, 2026.',
}

export default function GuidesPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5] text-[var(--edlink-blue-text)]">
      {/* Top Nav */}
      <nav className="border-b border-slate-200 bg-white/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/craft-logo.png" alt="CRAFT SMS Logo" className="h-8 w-auto object-contain block" />
            <span className="font-bold text-slate-900 text-lg tracking-tight">
              CRAFT <span className="text-[#007A53]">SMS</span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm font-semibold text-[#007A53] hover:text-[#005d40] transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12 bg-[#FAF8F5] text-[var(--edlink-blue-text)]">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">CRAFT SMS — Platform Operations Guide</h1>
        <p className="text-sm text-[var(--edlink-blue-text)]/70 mb-6">Last Updated: May 27, 2026</p>
        
        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900">SECTION: Introduction</h2>
          <p className="mb-4 leading-relaxed text-slate-600">CRAFT SMS (Centralized Resource for Academic & Financial Tracking) is a next-generation school management platform designed for African educational institutions.</p>
          <p className="mb-2 leading-relaxed text-slate-600">The platform combines:</p>
          <ul className="list-disc pl-6 mb-6 text-slate-600 space-y-1">
            <li>Academic management</li>
            <li>Student tracking</li>
            <li>Financial systems</li>
            <li>Real-time communication</li>
            <li>Offline-first synchronization</li>
            <li>Multi-tenant architecture</li>
            <li>Enterprise-grade security</li>
          </ul>
          <p className="mb-6 leading-relaxed text-slate-600">CRAFT SMS is optimized for low-bandwidth environments and supports schools operating in both urban and rural internet conditions.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900">SECTION: Quickstart</h2>
          <p className="mb-2 leading-relaxed text-slate-600 font-semibold">Requirements:</p>
          <ul className="list-disc pl-6 mb-4 text-slate-600 space-y-1">
            <li>Node.js 20+</li>
            <li>PostgreSQL</li>
            <li>Supabase Project</li>
            <li>Railway or VPS deployment</li>
            <li>Modern browser</li>
          </ul>
          <p className="mb-2 leading-relaxed text-slate-600 font-semibold">Installation Steps:</p>
          <ol className="list-decimal pl-6 mb-4 text-slate-600 space-y-1">
            <li>Clone repository</li>
            <li>Install dependencies</li>
            <li>Configure environment variables</li>
            <li>Run database migrations</li>
            <li>Start frontend and backend services</li>
          </ol>
          <p className="mb-2 leading-relaxed text-slate-600 font-semibold">Development:</p>
          <p className="mb-1 leading-relaxed text-slate-600">Frontend: <code className="bg-slate-200 px-1 py-0.5 rounded text-[var(--edlink-blue-text)]">npm run dev</code></p>
          <p className="mb-4 leading-relaxed text-slate-600">Backend: <code className="bg-slate-200 px-1 py-0.5 rounded text-[var(--edlink-blue-text)]">uvicorn main:app --reload</code></p>
          <p className="mb-2 leading-relaxed text-slate-600 font-semibold">Production Deployment:</p>
          <p className="mb-1 leading-relaxed text-slate-600">Frontend: Vercel, Netlify</p>
          <p className="mb-6 leading-relaxed text-slate-600">Backend: Railway, Docker VPS, Render</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900">SECTION: Architecture</h2>
          <p className="mb-4 leading-relaxed text-slate-600">CRAFT SMS follows a distributed multi-tenant architecture.</p>
          <p className="mb-2 leading-relaxed text-slate-600 font-semibold">Core Stack:</p>
          <ul className="list-disc pl-6 mb-4 text-slate-600 space-y-1">
            <li>Frontend: Next.js</li>
            <li>Backend: FastAPI</li>
            <li>Database: PostgreSQL</li>
            <li>Realtime: Supabase</li>
            <li>Auth: JWT + RLS</li>
            <li>Offline Cache: IndexedDB</li>
            <li>Sync Engine: Service Worker Layer</li>
          </ul>
          <p className="mb-6 leading-relaxed text-slate-600">Each institution operates as an isolated tenant with dedicated security boundaries.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-6 text-slate-900 border-b pb-2">CORE CONCEPTS</h2>
          
          <h3 className="text-xl font-bold mt-6 mb-3 text-slate-900">SECTION: Multi-Tenancy</h3>
          <p className="mb-2 leading-relaxed text-slate-600">Each school in CRAFT SMS is treated as a secure tenant.</p>
          <p className="mb-2 leading-relaxed text-slate-600"><strong>Features:</strong> Dedicated subdomains, Isolated database rows, Tenant-aware authentication, Independent branding, Scoped permissions, School-level analytics.</p>
          <p className="mb-6 leading-relaxed text-slate-600"><strong>Example:</strong> school-a.craftsms.app, school-b.craftsms.app</p>

          <h3 className="text-xl font-bold mt-6 mb-3 text-slate-900">SECTION: Row Level Security (RLS)</h3>
          <p className="mb-2 leading-relaxed text-slate-600">CRAFT SMS uses PostgreSQL Row Level Security.</p>
          <p className="mb-2 leading-relaxed text-slate-600"><strong>Benefits:</strong> Prevents cross-school data leaks, Secure per-user access, Backend-enforced authorization, Zero-trust architecture. Every query is filtered using: tenant_id, role permissions, ownership policies.</p>

          <h3 className="text-xl font-bold mt-6 mb-3 text-slate-900">SECTION: Offline Sync</h3>
          <p className="mb-2 leading-relaxed text-slate-600">CRAFT SMS is designed for unstable internet environments.</p>
          <p className="mb-6 leading-relaxed text-slate-600"><strong>Offline capabilities:</strong> Cached dashboards, Local attendance capture, Queue-based synchronization, Conflict resolution engine, Background sync workers. The platform automatically syncs once internet becomes available.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-6 text-slate-900 border-b pb-2">SYSTEM MODULES</h2>
          <ul className="list-disc pl-6 mb-6 text-slate-600 space-y-2">
            <li><strong>Student Management:</strong> Enrollment, Student profiles, Guardian record, Attendance tracking, Academic history, Class assignments.</li>
            <li><strong>Teacher Portal:</strong> Mark attendance, Upload grades, Send announcements, Create assignments, Message parents, Access analytics.</li>
            <li><strong>Parent Portal:</strong> Attendance alerts, Fee notifications, Assignment updates, Performance reports, School announcements.</li>
            <li><strong>Financial System:</strong> Payment tracking, Receipt generation, Outstanding balances, Financial analytics, Payment gateway integrations.</li>
            <li><strong>Messaging System:</strong> Contains an internal messaging engine supporting SMS, Push notifications, Internal messaging, Email alerts, and Emergency broadcasts. Features queue retry systems and offline dispatching.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-6 text-slate-900 border-b pb-2">SECURITY & DEPLOYMENT</h2>
          <ul className="list-disc pl-6 mb-6 text-slate-600 space-y-2">
            <li><strong>Authentication:</strong> JWT Access Tokens, Refresh Tokens, Role-based permissions, Session isolation, Secure cookie storage.</li>
            <li><strong>Data Protection:</strong> HTTPS encryption, Database isolation, API validation, Rate limiting, Device fingerprint monitoring, Audit logging.</li>
            <li><strong>Frontend Variables:</strong> NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-6 text-slate-900 border-b pb-2">API DOCUMENTATION & ADMINISTRATION</h2>
          <ul className="list-disc pl-6 mb-6 text-slate-600 space-y-2">
            <li><strong>Authentication API:</strong> POST /api/auth/login, POST /api/auth/refresh, POST /api/auth/logout.</li>
            <li><strong>Students API:</strong> GET /api/students, POST /api/students, PATCH /api/students/:id, DELETE /api/students/:id.</li>
            <li><strong>Attendance API:</strong> POST /api/attendance/check-in, GET /api/attendance/report.</li>
            <li><strong>Super Admin Features:</strong> Tenant creation, School management, Platform analytics, Global monitoring, Subscription management, System logs.</li>
            <li><strong>School Admin Features:</strong> Manage students, Manage teachers, Generate reports, Configure grading systems, Handle communications.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-6 text-slate-900 border-b pb-2">PERFORMANCE & ROADMAP</h2>
          <p className="mb-6 leading-relaxed text-slate-600">Optimized for low-RAM devices, slow internet, mobile-first usage, progressive loading, and edge caching. Planned features include AI academic analytics, voice announcements, biometric attendance, offline desktop mode, AI grading assistant, and national exam integration.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-6 text-slate-900 border-b pb-2">SUPPORT SECTION</h2>
          <p className="mb-6 leading-relaxed text-slate-600"><strong>Support Channels:</strong> Technical Support, Deployment Assistance, School Onboarding, Infrastructure Consultation, Security Audits.</p>
        </section>

      </div>
    </main>
  );
}
