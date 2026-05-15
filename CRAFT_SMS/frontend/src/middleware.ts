import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Extracts the tenant subdomain from a Vercel hostname.
 *
 * Vercel URL patterns:
 *   Production:  craft-sms.vercel.app              → "craft-sms"
 *   Git preview: craft-sms-git-main-user.vercel.app → "craft-sms"  (strip git suffix)
 *   PR preview:  craft-sms-pr-42-user.vercel.app    → "craft-sms"  (strip pr suffix)
 *   Hash deploy: craft-sms-abc123def.vercel.app     → "craft-sms"  (strip hash suffix)
 *
 * Uses NEXT_PUBLIC_VERCEL_PROJECT_NAME env var as canonical fallback if set.
 */
/**
 * Checks if a hostname is a Vercel deployment (production or preview).
 *
 * Tenant extraction is BYPASSED for these domains to ensure that:
 * 1. The root production URL (e.g., craft-sms.vercel.app) loads the landing page.
 * 2. Preview URLs (e.g., craft-sms-git-main...vercel.app) load the landing page.
 *
 * Tenants should use custom domains (school.craftsms.com) or local subdomains for testing.
 */
function isVercelDomain(hostname: string): boolean {
  return hostname.includes('.vercel.app')
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''

  console.log(`[middleware] hostname="${hostname}" pathname="${url.pathname}"`)

  // Define the institutional root domain
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'craftsms.com'

  // List of paths that should NEVER be rewritten (Global pages)
  const globalPaths = ['/login', '/signup', '/docs', '/api', '/_next', '/static', '/favicon.ico']
  if (globalPaths.some(path => url.pathname.startsWith(path)) || url.pathname.includes('.')) {
    return NextResponse.next()
  }

  let subdomain = ''

  if (hostname.endsWith(`.${rootDomain}`)) {
    // Custom production domain: school.craftsms.com → "school"
    subdomain = hostname.slice(0, hostname.length - rootDomain.length - 1)
    console.log(`[middleware] custom domain → subdomain="${subdomain}"`)

  } else if (hostname === rootDomain || hostname.startsWith(`www.${rootDomain}`)) {
    // Root domain — no subdomain
    console.log(`[middleware] root domain, passing through`)
    return NextResponse.next()

  } else if (isVercelDomain(hostname)) {
    // Vercel deployment (production or preview)
    // EXCLUSION: Do not extract tenants from .vercel.app domains.
    // This prevents preview hostnames from being treated as tenant slugs.
    console.log(`[middleware] vercel domain detected, bypassing tenant extraction`)
    return NextResponse.next()

  } else if (hostname.includes('localhost') || hostname.match(/^\d+\.\d+\.\d+\.\d+/)) {
    // Local dev: school.localhost:3000 → "school"
    const withoutPort = hostname.split(':')[0]
    const localParts = withoutPort.split('.')
    
    // If it's school.localhost (2 parts) or school.127.0.0.1.nip.io (multiple parts)
    // But NOT just localhost (1 part) or 127.0.0.1 (4 parts of an IP)
    const isIp = withoutPort.match(/^\d+\.\d+\.\d+\.\d+$/)
    
    if (localParts.length >= 2 && !isIp && !['localhost', 'www'].includes(localParts[0])) {
      subdomain = localParts[0]
      console.log(`[middleware] local subdomain detected: ${subdomain}`)
    }
  }

  // Reject empty, www, or root domain as subdomain
  if (!subdomain || subdomain === 'www' || subdomain === rootDomain) {
    return NextResponse.next()
  }

  // --- Smart Mapping for Tenant Routes ---
  // The current app structure is app/[subdomain]/dashboard/...
  // But users might navigate to /students, /grades, etc.
  
  let targetPath = url.pathname
  const tenantDashboardRoutes = [
    '/students', '/grades', '/gradebook', '/attendance', 
    '/finance', '/gamification', '/news', '/settings', 
    '/academic', '/analytics', '/report-card'
  ]

  // If the path is a known tenant route but doesn't have /dashboard prefix, add it.
  // This ensures /students maps to /school/dashboard/students
  if (tenantDashboardRoutes.some(r => url.pathname.startsWith(r)) && !url.pathname.startsWith('/dashboard')) {
    targetPath = `/dashboard${url.pathname}`
    console.log(`[middleware] smart mapping: ${url.pathname} -> ${targetPath}`)
  }

  // Final Rewrite to [subdomain] dynamic route
  const rewriteTarget = new URL(`/${subdomain}${targetPath}`, request.url)
  console.log(`[middleware] rewriting → ${rewriteTarget.pathname}`)
  return NextResponse.rewrite(rewriteTarget)
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
