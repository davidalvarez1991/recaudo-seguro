
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getUserRole } from '@/lib/actions';
 
export async function middleware(request: NextRequest) {
  const loggedInUserCookie = request.cookies.get('loggedInUser');
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  if (loggedInUserCookie && isAuthPage) {
    const userId = loggedInUserCookie.value;
    const role = await getUserRole(userId);
    const dashboardUrl = request.nextUrl.clone();
    
    if (role) {
      dashboardUrl.pathname = `/dashboard/${role}`;
    } else {
      // Fallback to a generic dashboard or home if role not found
      // or handle potential error
      dashboardUrl.pathname = '/'; 
    }
    return NextResponse.redirect(dashboardUrl);
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
