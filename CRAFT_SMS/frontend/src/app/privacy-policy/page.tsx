import React from 'react'
import Link from 'next/link'
import { Logo } from '../../components/ui/Logo'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy & Terms of Service CRAFT SMS',
  description: 'Read the CRAFT SMS Terms of Service, Privacy Policy, Cookie Policy, and Disclaimer. Last updated May 27, 2026.',
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5] text-[var(--edlink-blue-text)]">

      {/* Top Nav */}
      <nav className="border-b border-slate-200 bg-white/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group py-2">
            <Logo variant="full" width={120} height={30} />
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

      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-12 pb-8 border-b border-slate-200">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#007A53]/10 text-[#007A53] text-xs font-bold uppercase tracking-widest mb-5">
            Legal Documentation
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            Terms of Service &amp; Privacy Policy
          </h1>
          <p className="text-[var(--edlink-blue-text)]/70 text-sm font-medium">Last Updated: May 27, 2026</p>
          <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-2xl">
            Welcome to <strong>CRAFT SMS</strong> (&quot;Platform&quot;, &quot;Service&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), an educational communication and school management platform. By accessing or using CRAFT SMS, you agree to comply with these Terms of Service. If you do not agree, please do not use the platform.
          </p>
        </div>

        {/* Table of Contents */}
        <nav className="mb-12 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#007A53] mb-4">Contents</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              ['#about', '1. About CRAFT SMS'],
              ['#eligibility', '2. Eligibility'],
              ['#accounts', '3. User Accounts'],
              ['#acceptable-use', '4. Acceptable Use Policy'],
              ['#data-privacy', '5. Educational Data & Privacy'],
              ['#messaging', '6. Messaging & Notifications'],
              ['#offline', '7. Offline Functionality'],
              ['#ip', '8. Intellectual Property'],
              ['#third-party', '9. Third-Party Services'],
              ['#availability', '10. Service Availability'],
              ['#security', '11. Security'],
              ['#liability', '12. Limitation of Liability'],
              ['#termination', '13. Termination'],
              ['#changes', '14. Changes to Terms'],
              ['#law', '15. Governing Law'],
              ['#contact', '16. Contact Information'],
              ['#privacy', 'Privacy Policy'],
              ['#cookies', 'Cookie Policy'],
              ['#disclaimer', 'Disclaimer'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="text-sm text-[var(--edlink-blue-text)]/70 hover:text-[#007A53] transition-colors py-0.5"
              >
                {label}
              </a>
            ))}
          </div>
        </nav>

        {/* ── Terms of Service ── */}
        <div className="space-y-10">

          <section id="about">
            <h2 className="text-2xl font-bold mb-4 text-slate-900">1. About CRAFT SMS</h2>
            <p className="leading-relaxed mb-6 text-slate-600">
              CRAFT SMS is a digital platform designed to assist schools, students, teachers, administrators, and parents with:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 leading-relaxed ml-2">
              {[
                'Academic communication',
                'Attendance management',
                'School announcements',
                'Assignment distribution',
                'Notifications and alerts',
                'Student workflow management',
                'Internal messaging systems',
                'Administrative coordination',
                'Offline first educational operations',
                'Reduce the workload of Teachers'
              ].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-4 leading-relaxed text-slate-600">The platform may include web, mobile, and integrated backend systems.</p>
          </section>

          <div className="border-t border-slate-100" />

          <section id="eligibility">
            <h2 className="text-2xl font-bold mb-4 text-slate-900">2. Eligibility</h2>
            <p className="leading-relaxed mb-4 text-slate-600">To use CRAFT SMS, you must:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 leading-relaxed ml-2">
              <li>Be authorized by a school, institution, or organization</li>
              <li>Be at least 13 years old or meet the minimum legal age in your country</li>
              <li>Use the platform only for lawful educational or administrative purposes</li>
            </ul>
            <p className="mt-4 leading-relaxed text-slate-600">Schools are responsible for managing student access and guardian permissions where applicable.</p>
          </section>

          <div className="border-t border-slate-100" />

          <section id="accounts">
            <h2 className="text-2xl font-bold mb-4 text-slate-900">3. User Accounts</h2>
            <p className="leading-relaxed mb-4 text-slate-600">Users may be required to create accounts to access certain services. You agree to:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 leading-relaxed ml-2">
              <li>Provide accurate account information</li>
              <li>Maintain the security of your login credentials</li>
              <li>Notify administrators of unauthorized access</li>
              <li>Accept responsibility for activities conducted under your account</li>
            </ul>
            <p className="mt-4 leading-relaxed text-slate-600">CRAFT SMS reserves the right to suspend or terminate accounts involved in suspicious, abusive, or unauthorized activities.</p>
          </section>

          <div className="border-t border-slate-100" />

          <section id="acceptable-use">
            <h2 className="text-2xl font-bold mb-4 text-slate-900">4. Acceptable Use Policy</h2>
            <p className="leading-relaxed mb-4 text-slate-600">You agree <strong>NOT</strong> to:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 leading-relaxed ml-2">
              {[
                'Use the platform for illegal activities',
                'Harass, threaten, or abuse other users',
                'Upload malware, harmful scripts, or malicious code',
                'Attempt unauthorized access to servers or databases',
                'Interfere with platform performance or security',
                'Share misleading academic or administrative information',
                'Use the service for spam or fraudulent communications',
              ].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-4 leading-relaxed text-slate-600">Violation of these rules may result in immediate suspension or permanent termination.</p>
          </section>

          <div className="border-t border-slate-100" />

          <section id="data-privacy">
            <h2 className="text-2xl font-bold mb-4 text-slate-900">5. Educational Data &amp; Privacy</h2>
            <p className="leading-relaxed mb-4 text-slate-600">CRAFT SMS respects the privacy of schools, students, parents, and staff. We may collect:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 leading-relaxed ml-2 mb-4">
              {['Names and contact information', 'Academic records and attendance data', 'Device and login information', 'Messaging and notification logs', 'Usage analytics for system improvement'].map(i => <li key={i}>{i}</li>)}
            </ul>
            <p className="leading-relaxed mb-4 text-slate-600 font-semibold">We do NOT sell personal educational data to third parties.</p>
            <p className="leading-relaxed mb-2 text-slate-600">Data is processed strictly for:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 leading-relaxed ml-2">
              {['Educational operations', 'Platform functionality', 'Security monitoring', 'Communication services', 'System optimization'].map(i => <li key={i}>{i}</li>)}
            </ul>
            <p className="mt-4 leading-relaxed text-slate-600">Schools remain responsible for ensuring compliance with their local educational and data protection laws.</p>
          </section>

          <div className="border-t border-slate-100" />

          <section id="messaging">
            <h2 className="text-2xl font-bold mb-4 text-slate-900">6. Messaging &amp; Notifications</h2>
            <p className="leading-relaxed mb-4 text-slate-600">CRAFT SMS may send:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 leading-relaxed ml-2 mb-4">
              {['SMS alerts', 'Push notifications', 'Academic reminders', 'Administrative announcements', 'Emergency communications'].map(i => <li key={i}>{i}</li>)}
            </ul>
            <p className="leading-relaxed text-slate-600">Users are responsible for ensuring contact details are accurate. Message delivery may depend on third-party telecom providers and internet availability. We do not guarantee uninterrupted delivery at all times.</p>
          </section>

          <div className="border-t border-slate-100" />

          <section id="offline">
            <h2 className="text-2xl font-bold mb-4 text-slate-900">7. Offline Functionality</h2>
            <p className="leading-relaxed mb-4 text-slate-600">Certain features may operate offline and synchronize once internet access becomes available. While we strive to preserve synchronization integrity:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 leading-relaxed ml-2 mb-4">
              <li>Delays may occur</li>
              <li>Conflicts may happen during sync operations</li>
              <li>Temporary inconsistencies may appear across devices</li>
            </ul>
            <p className="leading-relaxed text-slate-600">Users should verify critical academic or administrative data after synchronization.</p>
          </section>

          <div className="border-t border-slate-100" />

          <section id="ip">
            <h2 className="text-2xl font-bold mb-4 text-slate-900">8. Intellectual Property</h2>
            <p className="leading-relaxed mb-4 text-slate-600">All branding, software architecture, workflows, designs, logos, interface systems, and platform technology associated with CRAFT SMS are protected by intellectual property laws. Users may not:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 leading-relaxed ml-2">
              {['Copy the platform', 'Reverse engineer the system', 'Resell unauthorized versions', 'Reproduce proprietary workflows', 'Use CRAFT SMS branding without permission'].map(i => <li key={i}>{i}</li>)}
            </ul>
          </section>

          <div className="border-t border-slate-100" />

          <section id="third-party">
            <h2 className="text-2xl font-bold mb-4 text-slate-900">9. Third-Party Services</h2>
            <p className="leading-relaxed mb-4 text-slate-600">CRAFT SMS may integrate with external providers including:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 leading-relaxed ml-2 mb-4">
              {['Cloud hosting services', 'Authentication systems', 'Notification gateways', 'Analytics platforms', 'Payment processors'].map(i => <li key={i}>{i}</li>)}
            </ul>
            <p className="leading-relaxed text-slate-600">We are not responsible for outages, failures, or policy changes caused by third party providers.</p>
          </section>

          <div className="border-t border-slate-100" />

          <section id="availability">
            <h2 className="text-2xl font-bold mb-4 text-slate-900">10. Service Availability</h2>
            <p className="leading-relaxed mb-4 text-slate-600">We aim to provide reliable uptime, but availability is not guaranteed. Maintenance, updates, security upgrades, or infrastructure failures may temporarily interrupt access. CRAFT SMS may modify or discontinue features without prior notice.</p>
          </section>

          <div className="border-t border-slate-100" />

          <section id="security">
            <h2 className="text-2xl font-bold mb-4 text-slate-900">11. Security</h2>
            <p className="leading-relaxed mb-4 text-slate-600">We implement industry standard security practices to protect platform data. However, no digital platform can guarantee absolute security. Users and institutions are responsible for:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 leading-relaxed ml-2">
              {['Using secure passwords', 'Managing authorized access', 'Protecting school devices', 'Monitoring administrative permissions'].map(i => <li key={i}>{i}</li>)}
            </ul>
          </section>

          <div className="border-t border-slate-100" />

          <section id="liability">
            <h2 className="text-2xl font-bold mb-4 text-slate-900">12. Limitation of Liability</h2>
            <p className="leading-relaxed mb-4 text-slate-600">To the fullest extent permitted by law, CRAFT SMS shall not be liable for:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 leading-relaxed ml-2 mb-4">
              {['Data loss', 'Academic disruptions', 'Communication delays', 'Service interruptions', 'Indirect or consequential damages', 'Unauthorized account access caused by user negligence'].map(i => <li key={i}>{i}</li>)}
            </ul>
            <p className="leading-relaxed text-slate-600">The platform is provided &quot;as is&quot; and &quot;as available.&quot;</p>
          </section>

          <div className="border-t border-slate-100" />

          <section id="termination">
            <h2 className="text-2xl font-bold mb-4 text-slate-900">13. Termination</h2>
            <p className="leading-relaxed mb-4 text-slate-600">We reserve the right to suspend or terminate access if users:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 leading-relaxed ml-2 mb-4">
              {['Violate these Terms', 'Abuse the platform', 'Compromise system security', 'Engage in fraudulent or harmful conduct'].map(i => <li key={i}>{i}</li>)}
            </ul>
            <p className="leading-relaxed text-slate-600">Institutions may also request account deactivation or data removal where applicable.</p>
          </section>

          <div className="border-t border-slate-100" />

          <section id="changes">
            <h2 className="text-2xl font-bold mb-4 text-slate-900">14. Changes to Terms</h2>
            <p className="leading-relaxed text-slate-600">These Terms may be updated periodically. Continued use of the platform after updates constitutes acceptance of the revised Terms. Users are encouraged to review this page regularly.</p>
          </section>

          <div className="border-t border-slate-100" />

          <section id="law">
            <h2 className="text-2xl font-bold mb-4 text-slate-900">15. Governing Law</h2>
            <p className="leading-relaxed text-slate-600">These Terms shall be governed in accordance with applicable local and international digital service laws relevant to the operating jurisdiction of CRAFT SMS and its institutional partners.</p>
          </section>

          <div className="border-t border-slate-100" />

          <section id="contact">
            <h2 className="text-2xl font-bold mb-4 text-slate-900">16. Contact Information</h2>
            <p className="leading-relaxed text-slate-600">For support, legal inquiries, or policy-related concerns, users may contact the CRAFT SMS administrative team through the official platform communication channels provided on the homepage or support portal.</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <a href="mailto:support.craftsms@gmail.com" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#007A53]/10 text-[#007A53] font-semibold text-sm hover:bg-[#007A53]/20 transition-colors">
                support.craftsms@gmail.com
              </a>
              <a href="https://wa.me/231880864187" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#25D366]/10 text-[#16a34a] font-semibold text-sm hover:bg-[#25D366]/20 transition-colors">
                WhatsApp: +231 88 086 4187
              </a>
            </div>
          </section>

          {/* Privacy Policy */}
          <div className="border-t-2 border-slate-200 pt-10 mt-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#007A53]/10 text-[#007A53] text-xs font-bold uppercase tracking-widest mb-6">
              Privacy Policy
            </div>
            <h2 id="privacy" className="text-3xl font-extrabold mb-2 text-slate-900">Privacy Policy</h2>
            <p className="text-sm text-[var(--edlink-blue-text)]/70 mb-8">Last Updated: May 27, 2026</p>
            <p className="leading-relaxed mb-8 text-slate-600">CRAFT SMS values your privacy and is committed to protecting personal and institutional data.</p>

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Information We Collect</h3>
                <p className="leading-relaxed mb-3 text-slate-600">We may collect:</p>
                <ul className="list-disc list-inside space-y-2 text-slate-600 leading-relaxed ml-2">
                  {['Full names', 'Student IDs', 'Email addresses', 'Phone numbers', 'Attendance records', 'Assignment activity', 'Device/browser information', 'Login timestamps', 'System usage analytics'].map(i => <li key={i}>{i}</li>)}
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">How We Use Information</h3>
                <p className="leading-relaxed mb-3 text-slate-600">We use collected information to:</p>
                <ul className="list-disc list-inside space-y-2 text-slate-600 leading-relaxed ml-2">
                  {['Operate educational services', 'Improve platform functionality', 'Deliver notifications', 'Maintain security', 'Provide technical support', 'Generate administrative insights'].map(i => <li key={i}>{i}</li>)}
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Data Sharing</h3>
                <p className="leading-relaxed mb-3 text-slate-600 font-semibold">We do not sell user data.</p>
                <p className="leading-relaxed mb-3 text-slate-600">We may share limited information with:</p>
                <ul className="list-disc list-inside space-y-2 text-slate-600 leading-relaxed ml-2">
                  {['Authorized educational institutions', 'Hosting providers', 'Communication service providers', 'Legal authorities when required by law'].map(i => <li key={i}>{i}</li>)}
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Data Retention</h3>
                <p className="leading-relaxed text-slate-600">Data may be retained for operational, legal, educational, or security purposes. Institutions may request deletion or export of eligible records where applicable.</p>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Security Measures</h3>
                <p className="leading-relaxed mb-3 text-slate-600">We implement:</p>
                <ul className="list-disc list-inside space-y-2 text-slate-600 leading-relaxed ml-2 mb-4">
                  {['Secure authentication systems', 'Access controls', 'Encrypted communications', 'Administrative monitoring', 'Infrastructure protection measures'].map(i => <li key={i}>{i}</li>)}
                </ul>
                <p className="leading-relaxed text-slate-600">Despite these safeguards, users acknowledge that no online system is fully immune from cyber threats.</p>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Children&apos;s Privacy</h3>
                <p className="leading-relaxed text-slate-600">Student accounts managed by schools are subject to institutional supervision and authorization requirements. Parents or guardians may contact schools directly regarding educational records or account concerns.</p>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Policy Updates</h3>
                <p className="leading-relaxed text-slate-600">This Privacy Policy may change over time to reflect system updates, legal requirements, or service improvements. Continued use of CRAFT SMS indicates acceptance of the updated policy.</p>
              </div>
            </div>
          </div>

          {/* Cookie Policy */}
          <div className="border-t-2 border-slate-200 pt-10" id="cookies">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-widest mb-6">
              Cookie Policy
            </div>
            <h2 className="text-3xl font-extrabold mb-4 text-slate-900">Cookie Policy</h2>
            <p className="leading-relaxed mb-4 text-slate-600">CRAFT SMS may use cookies and local storage technologies to:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 leading-relaxed ml-2 mb-4">
              {['Maintain user sessions', 'Improve performance', 'Store offline data', 'Personalize user experience', 'Enhance platform security'].map(i => <li key={i}>{i}</li>)}
            </ul>
            <p className="leading-relaxed text-slate-600">Users may disable cookies through browser settings, though some features may become unavailable.</p>
          </div>

          {/* Disclaimer */}
          <div className="border-t-2 border-slate-200 pt-10" id="disclaimer">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold uppercase tracking-widest mb-6">
              Disclaimer
            </div>
            <h2 className="text-3xl font-extrabold mb-4 text-slate-900">Disclaimer</h2>
            <p className="leading-relaxed text-slate-600">CRAFT SMS is an educational workflow and communication platform. While we strive for reliability and accuracy, institutions remain responsible for validating academic records, announcements, and operational decisions made using the platform.</p>
          </div>

          {/* Footer CTA */}
          <div className="border-t-2 border-slate-200 pt-10 text-center">
            <p className="text-[var(--edlink-blue-text)]/70 text-sm mb-4">© 2026 CRAFT SMS. All Rights Reserved.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#007A53] text-white font-semibold text-sm hover:bg-[#005d40] transition-colors"
            >
              ← Return to Home page
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
