import { NextResponse } from 'next/server';

/**
 * Route guard & legacy URL redirector:
 * - Redirects legacy `/dashboard/admin*` to `/admin/dashboard`
 * - Redirects legacy `/dashboard*` to `/user/dashboard` (or `/user/*`)
 * - Protects `/admin/*` and `/user/*` when no session cookie is present.
 */
export function middleware(req) {
  const { pathname, search } = req.nextUrl;

  // Redirect legacy /dashboard/* URLs to the new /admin/* and /user/* folder routes
  if (pathname === '/dashboard/admin' || pathname.startsWith('/dashboard/admin/')) {
    const url = req.nextUrl.clone();
    const tab = url.searchParams.get('tab');
    url.searchParams.delete('tab');
    const subRoute =
      tab && ['users', 'visit', 'plans', 'subscriptions', 'settings'].includes(tab)
        ? tab
        : 'dashboard';
    url.pathname = `/admin/${subRoute}`;
    return NextResponse.redirect(url);
  }

  if (pathname === '/dashboard') {
    const url = req.nextUrl.clone();
    url.pathname = '/user/dashboard';
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith('/dashboard/')) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace(/^\/dashboard\//, '/user/');
    return NextResponse.redirect(url);
  }

  const hasSession = Boolean(req.cookies.get('cf_session')?.value);

  if ((pathname.startsWith('/admin') || pathname.startsWith('/user')) && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*', '/admin/:path*', '/user/:path*'],
};
