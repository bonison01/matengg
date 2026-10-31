import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never gate the login page itself, or this becomes a redirect loop.
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Only guard /admin/* — everything else passes through untouched.
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const adminToken = request.cookies.get('admin_token')?.value;

  if (!adminToken) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};