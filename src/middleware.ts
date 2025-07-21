
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getUserRole } from '@/lib/actions';
 
export async function middleware(request: NextRequest) {
  const loggedInUserCookie = request.cookies.get('loggedInUser');
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  if (loggedInUserCookie && isAuthTriagePage) {
    const userId = loggedInUserCookie.value;
    const role = await getUserRole(userId);
    const dashboardUrl = request.nextUrl.clone();
    
    if (role) {
      dashboardUrl.pathname = `/dashboard/${role}`;
    } else {
      dashboardUrl.pathname = '/login'; 
    }
    return NextResponse.redirect(dashboardUrl);
  }

  if (!loggedInUserCookie && pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
 
  if (loggedInUserCookie && pathname.startsWith('/dashboard')) {
    const userId = loggedInUserCookie.value;
    const role = await getUserRole(userId);
    const expectedPath = `/dashboard/${role}`;
    if (pathname.startsWith('/dashboard') && !pathname.startsWith(expectedPath)) {
        const url = request.nextUrl.clone();
        url.pathname = expectedPath;
        return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
