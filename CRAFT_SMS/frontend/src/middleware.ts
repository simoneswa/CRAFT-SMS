import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // Define the institutional root domain
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'craftsms.com'
  
  // Extract subdomain securely
  let subdomain = ''
  if (hostname.endsWith(rootDomain)) {
    subdomain = hostname.replace(`.${rootDomain}`, '')
  } else if (hostname.includes('localhost')) {
    subdomain = hostname.split('.')[0]
  }

  // Handle root domain or 'www' (System-level access)
  if (!subdomain || subdomain === rootDomain || subdomain === 'www' || subdomain.includes(':')) {
    return NextResponse.next()
  }

  // Exclude internal paths, static files, api, etc.
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/static') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Rewrite to the subdomain-specific path
  // We expect a folder structure like app/[subdomain]/page.tsx
  console.log(`Rewriting ${hostname}${url.pathname} to /${subdomain}${url.pathname}`)
  return NextResponse.rewrite(new URL(`/${subdomain}${url.pathname}`, request.url))
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
