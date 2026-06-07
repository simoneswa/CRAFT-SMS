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
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'craftsms.com'

  // 1. Pathname Exclusions (Run FIRST — protect ALL static/system paths)
  const globalPaths = ['/login', '/signup', '/docs', '/api', '/_next', '/favicon.ico', '/public']
  if (globalPaths.some(path => url.pathname.startsWith(path)) || url.pathname.includes('.')) {
    return NextResponse.next()
  }

  console.log(`[MIDDLEWARE_AUDIT] Host: ${hostname} | Path: ${url.pathname}`)

  // 2. Hostname Exclusions (Bypass Tenant Rewriting COMPLETELY)
  const isVercel = hostname.includes('.vercel.app')
  const isFirebase = hostname.includes('.web.app') || hostname.includes('.firebaseapp.com')
  const isRoot = hostname === rootDomain || hostname === `www.${rootDomain}`
  const isLocalRoot = hostname === 'localhost:3000' || hostname === '127.0.0.1:3000' || hostname === 'localhost' || hostname === '127.0.0.1'

  if (isVercel || isFirebase || isRoot || isLocalRoot) {
    console.log(`[MIDDLEWARE_BYPASS] Reason: System/Root Host | Host: ${hostname}`)
    return NextResponse.next()
  }

  // 3. Tenant Extraction (Only for custom domains or prefixed local domains)
  let subdomain = ''

  if (hostname.endsWith(`.${rootDomain}`)) {
    // custom-school.craftsms.com -> "custom-school"
    subdomain = hostname.slice(0, hostname.length - rootDomain.length - 1)
  } else if (hostname.includes('localhost') || hostname.match(/^\d+\.\d+\.\d+\.\d+/)) {
    // school.localhost:3000 -> "school"
    const withoutPort = hostname.split(':')[0]
    const parts = withoutPort.split('.')
    const isIp = withoutPort.match(/^\d+\.\d+\.\d+\.\d+$/)

    if (parts.length >= 2 && !isIp && !['localhost', 'www'].includes(parts[0])) {
      subdomain = parts[0]
    }
  }

  // 4. Final Validation Bypass
  if (!subdomain || subdomain === 'www' || subdomain === 'api') {
    console.log(`[MIDDLEWARE_BYPASS] Reason: Invalid Subdomain | Subdomain: "${subdomain}"`)
    return NextResponse.next()
  }

  // 5. Smart Mapping for Tenant Modules
  let targetPath = url.pathname
  const tenantModules = [
    '/students', '/grades', '/gradebook', '/attendance', 
    '/finance', '/gamification', '/news', '/settings', 
    '/academic', '/analytics', '/report-card'
  ]

  if (tenantModules.some(m => url.pathname.startsWith(m)) && !url.pathname.startsWith('/dashboard')) {
    targetPath = `/dashboard${url.pathname}`
  }

  // 6. Execute Rewrite
  const rewriteTarget = request.nextUrl.clone()
  rewriteTarget.pathname = `/${subdomain}${targetPath}`
  
  console.log(`[MIDDLEWARE_REWRITE] Subdomain: ${subdomain} | From: ${url.pathname} | To: ${rewriteTarget.pathname}`)
  
  return NextResponse.rewrite(rewriteTarget)
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - _next/data (Next.js data routes)
     * - favicon.ico, public assets
     * - Any path with a file extension (.js, .css, .png, etc)
     */
    '/((?!_next/static|_next/image|_next/data|favicon\.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|woff|woff2|ttf|map)$).*)',
  ],
}
