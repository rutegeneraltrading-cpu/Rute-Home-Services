import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create Supabase client for middleware
  const supabase = createMiddlewareClient(request);

  // Get current user (handle offline/network errors gracefully)
  let user:
    | Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user']
    | null = null;
  let authFetchFailed = false;

  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  } catch (error) {
    authFetchFailed = true;
  }

  const hasAuthCookie = request.cookies
    .getAll()
    .some(
      (cookie) =>
        cookie.name.startsWith('sb-') && cookie.name.includes('auth-token'),
    );

  // Public routes
  const publicRoutes = ['/login', '/signup', '/'];
  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api');

  // ============================================
  // UNAUTHENTICATED USERS
  // ============================================
  if (!user) {
    // If auth fetch failed (offline) but auth cookie exists, allow the request
    if (authFetchFailed && hasAuthCookie) {
      return NextResponse.next();
    }
    // Allow public routes
    if (isPublicRoute) {
      return NextResponse.next();
    }
    // Redirect to login if accessing protected route
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ============================================
  // AUTHENTICATED USERS - GET ROLE
  // ============================================
  let profile: { role: string } | null = null;
  let profileFetchFailed = false;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('auth_id', user.id)
      .single();

    if (error) {
      throw error;
    }

    profile = data as { role: string } | null;
  } catch (error) {
    profileFetchFailed = true;
  }

  const userRole = profile?.role;

  if (!userRole) {
    // If role fetch failed (offline), allow access without redirect
    if (profileFetchFailed) {
      return NextResponse.next();
    }
    console.warn('User has no role assigned:', user.id);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ============================================
  // ROLE-BASED ROUTING
  // ============================================

  // Authenticated users should not access /login or /signup
  if (pathname === '/login' || pathname === '/signup') {
    if (userRole === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    } else {
      return NextResponse.redirect(new URL('/user', request.url));
    }
  }

  // ADMIN ONLY: /admin routes
  if (pathname.startsWith('/admin')) {
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/user', request.url));
    }
  }

  // USER/WORKER ONLY: /user routes
  if (pathname.startsWith('/user')) {
    if (userRole === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // ROOT: redirect to appropriate dashboard
  if (pathname === '/') {
    if (userRole === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    } else {
      return NextResponse.redirect(new URL('/user', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
