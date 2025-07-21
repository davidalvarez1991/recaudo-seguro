
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {
  const loggedInUserCookie = request.cookies.get('loggedInUser');
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  if (loggedInUserCookie && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard/proveedor'; // Redirect to a generic dashboard path
    return NextResponse.redirect(url);
  }

  if (!loggedInUserCookie && pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
 
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except for internal Next.js assets and static files.
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
