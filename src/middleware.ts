
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export async function middleware(request: NextRequest) {
  const loggedInUserCookie = request.cookies.get('loggedInUser');
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  // If user is logged in and tries to access an auth page, redirect to dashboard
  if (loggedInUserCookie && isAuthPage) {
    const dashboardUrl = new URL('/dashboard/proveedor', request.url); // Default dashboard
    return NextResponse.redirect(dashboardUrl);
  }

  // If user is not logged in and tries to access a dashboard page, redirect to login
  if (!loggedInUserCookie && pathname.startsWith('/dashboard')) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
 
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
