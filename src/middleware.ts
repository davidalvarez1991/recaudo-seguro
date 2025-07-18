
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {
  const loggedInUserCookie = request.cookies.get('loggedInUser');
  const pathname = request.nextUrl.pathname;

  // Allow access to login/register pages regardless of login state
  if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname === '/') {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-next-pathname', pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // If trying to access dashboard but not logged in, redirect to login
  if (pathname.startsWith('/dashboard') && !loggedInUserCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-next-pathname', pathname);
 
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  });
}

export const config = {
  matcher: [
    // Skip all internal paths (_next) and static files
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
