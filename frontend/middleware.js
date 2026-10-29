import { NextResponse } from 'next/server';

/**
 * Lightweight route guard: redirects to /login when no session cookie is present.
 * The backend still verifies the JWT and membership on every API request — this only
 * improves UX and avoids flashing protected UI.
 */
export function middleware(req) {
  const { pathname, search } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get('cf_session')?.value);

  if (pathname.startsWith('/dashboard') && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
