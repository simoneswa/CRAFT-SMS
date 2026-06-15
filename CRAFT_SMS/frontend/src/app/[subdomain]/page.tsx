// Server component — required wrapper to export generateStaticParams.
// "use client" files cannot export generateStaticParams.
// This thin shell tells Next.js which [subdomain] values to pre-render
// during the static export build phase.
import SchoolDashboardClient from './_SchoolDashboard'

export default function SubdomainPage() {
  console.log("BUILD TRACE: SubdomainPage rendered");
  return <SchoolDashboardClient />
}
