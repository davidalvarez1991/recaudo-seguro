
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {
  const loggedInUserCookie = request.cookies.get('loggedInUser');
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  // If user is logged in and tries to access an auth page, redirect them away.
  // We can redirect to a generic dashboard path, the layout will handle the rest.
  if (loggedInUserCookie && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard/proveedor', request.url)); 
  }

  // If user is not logged in and tries to access a protected dashboard route,
  // redirect them to the login page.
  if (!loggedInUserCookie && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
 
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except for internal Next.js assets and static files.
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
