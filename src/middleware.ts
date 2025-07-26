
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export async function middleware(request: NextRequest) {
  const loggedInUserCookie = request.cookies.get('loggedInUser');
  const userRoleCookie = request.cookies.get('userRole');
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  // If user is not logged in and tries to access a protected dashboard page, redirect to login
  if (!loggedInUserCookie && pathname.startsWith('/dashboard')) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If user is logged in and tries to access an auth page, redirect to their correct dashboard
  if (loggedInUserCookie && isAuthPage) {
    const role = userRoleCookie?.value;
    if (role && ['admin', 'proveedor', 'cobrador', 'cliente'].includes(role)) {
       const dashboardUrl = new URL(`/dashboard/${role}`, request.url);
       return NextResponse.redirect(dashboardUrl);
    }
    // If role is somehow invalid or missing, it's safer to just proceed to the auth page
    // where they can log in again. Or redirect them to logout first. Let's just proceed.
  }
 
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
