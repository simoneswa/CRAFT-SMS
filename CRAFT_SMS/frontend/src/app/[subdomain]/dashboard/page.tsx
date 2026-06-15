// Server component wrapper for the [subdomain]/dashboard route.
// Required: Next.js static export needs generateStaticParams here so the build
// worker has a valid string ID for this dynamic segment's pages.
import TenantDashboardClient from './_TenantDashboard'

export default function DashboardPage() {
  console.log("BUILD TRACE: DashboardPage rendered");
  return <TenantDashboardClient />
}
