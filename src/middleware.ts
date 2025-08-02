
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export async function middleware(request: NextRequest) {
  const loggedInUserCookie = request.cookies.get('loggedInUser');
  const userRoleCookie = request.cookies.get('userRole');
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  // If on an auth page, and user is logged in, redirect them away.
  if (isAuthPage && loggedInUserCookie) {
    const role = userRoleCookie?.value;
    if (role && ['admin', 'proveedor', 'cobrador', 'cliente'].includes(role)) {
       const dashboardUrl = new URL(`/dashboard/${role}`, request.url);
       return NextResponse.redirect(dashboardUrl);
    }
  }

  // If user is not on an auth page and is not logged in, redirect to login.
  if (!isAuthPage && !loggedInUserCookie && pathname.startsWith('/dashboard')) {
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

    