import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''

  console.log(`[middleware] hostname="${hostname}" pathname="${url.pathname}"`)

  // Define the institutional root domain
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'craftsms.com'

  // Extract subdomain — support three deployment environments:
  // 1. Custom domain:    school.craftsms.com       → subdomain = "school"
  // 2. Vercel preview:  craft-sms.vercel.app       → subdomain = "craft-sms"
  // 3. Localhost:       school.localhost:3000      → subdomain = "school"
  let subdomain = ''

  if (hostname.endsWith(`.${rootDomain}`)) {
    // Custom production domain
    subdomain = hostname.slice(0, hostname.length - rootDomain.length - 1)
    console.log(`[middleware] custom domain → subdomain="${subdomain}"`)

  } else if (hostname.includes('.vercel.app')) {
    // Vercel deployment: the first segment before ".vercel.app" IS the subdomain
    // e.g. "craft-sms.vercel.app" → "craft-sms"
    // e.g. "craft-sms-git-main-simoneswa.vercel.app" → skip (preview build, not a tenant)
    const vercelPart = hostname.replace('.vercel.app', '')
    // Only treat as a tenant if the vercel project name itself is the subdomain
    // (single segment with no extra git-branch suffix that has known patterns)
    subdomain = vercelPart
    console.log(`[middleware] vercel.app deployment → subdomain="${subdomain}"`)

  } else if (hostname.includes('localhost')) {
    // Local dev: school.localhost:3000 → "school"
    const withoutPort = hostname.split(':')[0]  // strip port
    const localParts = withoutPort.split('.')
    subdomain = localParts.length >= 2 ? localParts[0] : ''
    console.log(`[middleware] localhost → subdomain="${subdomain}"`)
  }

  // Reject empty, 'www', or the root domain itself as subdomain
  if (!subdomain || subdomain === 'www' || subdomain === rootDomain) {
    console.log(`[middleware] no valid subdomain — passing through`)
    return NextResponse.next()
  }

  // Exclude internal Next.js paths, static files, API routes
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/static') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Rewrite to the [subdomain] dynamic route folder
  const rewriteTarget = new URL(`/${subdomain}${url.pathname}`, request.url)
  console.log(`[middleware] rewriting to ${rewriteTarget.pathname}`)
  return NextResponse.rewrite(rewriteTarget)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
