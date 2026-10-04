import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // 1. Security Headers (Modern web standard)
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('X-Frame-Options', 'DENY') // Prevent clickjacking
  response.headers.set('X-Content-Type-Options', 'nosniff') // Prevent MIME sniffing
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)')
  
  // Content Security Policy (Allows OpenStreetMap frame and geolocation)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; font-src 'self'; frame-src 'self' https://www.openstreetmap.org; connect-src 'self' https://*.tile.openstreetmap.org https://nominatim.openstreetmap.org; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"
  )

  // 2. Strict CSRF Origin Check for mutating API endpoints
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      const origin = request.headers.get('origin')
      const host = request.headers.get('host')

      // Compare Origin against Host
      if (origin) {
        try {
          const originUrl = new URL(origin)
          if (originUrl.host !== host) {
            return new NextResponse(
              JSON.stringify({ error: "CSRF Attack Blocked: Origin Host Mismatch." }),
              { status: 403, headers: { 'Content-Type': 'application/json' } }
            )
          }
        } catch {
          return new NextResponse(
            JSON.stringify({ error: "CSRF Attack Blocked: Malformed Origin." }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          )
        }
      } else {
        // Fallback to checking Referer if Origin is omitted
        const referer = request.headers.get('referer')
        if (referer) {
          try {
            const refererUrl = new URL(referer)
            if (refererUrl.host !== host) {
              return new NextResponse(
                JSON.stringify({ error: "CSRF Attack Blocked: Referer Host Mismatch." }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
              )
            }
          } catch {
             return new NextResponse(
              JSON.stringify({ error: "CSRF Attack Blocked: Malformed Referer." }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
          }
        } else {
          // No Origin and No Referer -> strict deny for mutations
          return new NextResponse(
            JSON.stringify({ error: "CSRF Attack Blocked: Missing Origin/Referer Headers." }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          )
        }
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    // Apply middleware to all routes except static assets
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
