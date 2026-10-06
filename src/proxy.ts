import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy (dulu "middleware" sebelum Next 16): hanya memasang header keamanan.
 *
 * Pengecekan CSRF sengaja TIDAK di sini. Semua endpoint mutasi lewat `route()` di
 * `src/server/api.ts`, yang mencocokkan header Origin dengan `APP_URL` atau origin
 * request. Membandingkan Origin dengan header Host di sini rapuh: di balik reverse
 * proxy, Host sering berbeda dari yang dilihat browser dan semua POST jadi 403.
 */
export function proxy(_request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");

  // 'unsafe-eval' hanya dibutuhkan oleh React/Next saat development (HMR, source map).
  const scriptSrc =
    process.env.NODE_ENV === "production"
      ? "script-src 'self' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data: https:",
      "font-src 'self'",
      "frame-src 'self' https://www.openstreetmap.org",
      "connect-src 'self' https://*.tile.openstreetmap.org https://nominatim.openstreetmap.org",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  );

  return response;
}

export const config = {
  matcher: [
    // Semua rute kecuali aset statis.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
