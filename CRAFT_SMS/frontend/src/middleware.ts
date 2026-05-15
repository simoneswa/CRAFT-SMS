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
function extractVercelSubdomain(projectPart: string): string | null {
  // 1. Prefer the explicitly configured project name (most reliable)
  const envProjectName = process.env.NEXT_PUBLIC_VERCEL_PROJECT_NAME
  if (envProjectName) {
    console.log(`[middleware] using NEXT_PUBLIC_VERCEL_PROJECT_NAME="${envProjectName}"`)
    return envProjectName
  }

  // 2. Detect Vercel preview patterns and strip suffixes
  //    Pattern: {project-name}-git-{branch}-{username}
  //             {project-name}-pr-{number}-{username}
  //             {project-name}-{12+char-hash}
  const gitPrMatch = projectPart.match(/^(.+?)-(?:git|pr)-/)
  if (gitPrMatch) {
    console.log(`[middleware] vercel git/pr preview, project="${gitPrMatch[1]}"`)
    return gitPrMatch[1]
  }

  // Hash-based preview: ends with 9+ alphanumeric lowercase chars (Vercel deploy hash)
  const hashMatch = projectPart.match(/^(.+?)-([a-z0-9]{9,})$/)
  if (hashMatch) {
    console.log(`[middleware] vercel hash preview, project="${hashMatch[1]}"`)
    return hashMatch[1]
  }

  // 3. Plain production URL: craft-sms.vercel.app → "craft-sms"
  console.log(`[middleware] vercel production URL, project="${projectPart}"`)
  return projectPart
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
    console.log(`[middleware] global path or file detected, skipping rewrite: ${url.pathname}`)
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

  } else if (hostname.includes('.vercel.app')) {
    // Vercel deployment (production or preview)
    const projectPart = hostname.replace('.vercel.app', '').split(':')[0]
    const extracted = extractVercelSubdomain(projectPart)
    if (!extracted) {
      console.log(`[middleware] could not extract vercel subdomain, passing through`)
      return NextResponse.next()
    }
    subdomain = extracted

  } else if (hostname.includes('localhost') || hostname.match(/^\d+\.\d+\.\d+\.\d+/)) {
    // Local dev: school.localhost:3000 → "school"
    const withoutPort = hostname.split(':')[0]
    const localParts = withoutPort.split('.')
    // If it's school.localhost or school.127.0.0.1.nip.io etc.
    if (localParts.length >= 2 && !['localhost', 'www'].includes(localParts[0])) {
      subdomain = localParts[0]
      console.log(`[middleware] localhost/ip subdomain → subdomain="${subdomain}"`)
    }
  }

  // Reject empty, www, or root domain as subdomain
  if (!subdomain || subdomain === 'www' || subdomain === rootDomain) {
    console.log(`[middleware] no valid subdomain detected for rewrite`)
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
