
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export async function middleware(request: NextRequest) {
  const loggedInUserCookie = request.cookies.get('loggedInUser');
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  // If user is logged in, redirect them from auth pages to their dashboard.
  if (isAuthPage && loggedInUserCookie) {
    const userRoleCookie = request.cookies.get('userRole');
    const role = userRoleCookie?.value;
    if (role && ['admin', 'proveedor', 'cobrador', 'cliente'].includes(role)) {
       const dashboardUrl = new URL(`/dashboard/${role}`, request.url);
       return NextResponse.redirect(dashboardUrl);
    }
  }

  // If user is on a protected dashboard page and is not logged in, redirect to login.
  if (pathname.startsWith('/dashboard') && !loggedInUserCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname); // Optional: add a redirect after login
    return NextResponse.redirect(loginUrl);
  }
 
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
