
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export async function middleware(request: NextRequest) {
  const loggedInUserCookie = request.cookies.get('loggedInUser');
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  // If user is logged in and tries to access an auth page, redirect to a default dashboard
  if (loggedInUserCookie && isAuthPage) {
    // We don't know the role here, so redirect to a generic dashboard path.
    // The dashboard layout will handle role-specific routing.
    // Let's send them to a base path they are likely to have access to.
    const dashboardUrl = new URL('/dashboard/proveedor', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // If user is not logged in and tries to access a protected dashboard page, redirect to login
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
