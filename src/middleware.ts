
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {
  const loggedInUserCookie = request.cookies.get('loggedInUser');
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  // If user is logged in, redirect away from auth pages to their dashboard
  if (loggedInUserCookie && isAuthPage) {
    // We don't know the role here, so redirect to a generic dashboard path.
    // The dashboard layout will handle the specific role-based redirection if needed.
    return NextResponse.redirect(new URL('/dashboard/proveedor', request.url)); // Default redirect
  }

  // If user is not logged in and tries to access a protected route, redirect to login
  if (!loggedInUserCookie && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is trying to access the root, redirect to login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
 
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip all internal paths (_next) and static files
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
