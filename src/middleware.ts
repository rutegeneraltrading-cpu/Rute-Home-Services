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

  // Routes that are always accessible (API, static files, etc)
  const alwaysAccessible =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static');

  if (alwaysAccessible) {
    return NextResponse.next();
  }

  // Auth pages - only accessible when NOT logged in
  const authPages = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
  ];
  const isAuthPage = authPages.some((page) => pathname.startsWith(page));

  // Protected admin/user routes
  const isAdminRoute = pathname.startsWith('/admin');
  const isUserRoute = pathname.startsWith('/user');

  // ============================================
  // UNAUTHENTICATED USERS
  // ============================================
  if (!user) {
    // If auth fetch failed (offline) but auth cookie exists, allow the request
    // FIX: Don't redirect to login when network is offline but cookie exists
    if (authFetchFailed && hasAuthCookie) {
      return NextResponse.next();
    }

    // Allow auth pages when not logged in
    if (isAuthPage) {
      return NextResponse.next();
    }

    // Allow public routes (home and other pages)
    // FIX: Only protect /admin and /user routes, all others are accessible
    if (!isAdminRoute && !isUserRoute) {
      return NextResponse.next();
    }

    // Redirect to login only if accessing protected routes (/admin or /user)
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

  // FIX: If role fetch failed (network offline), allow access without redirect
  if (!userRole) {
    if (profileFetchFailed && hasAuthCookie) {
      // Network is down but user is logged in - allow access
      return NextResponse.next();
    }
    console.warn('User has no role assigned:', user.id);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ============================================
  // AUTHENTICATED USERS - ROUTING
  // ============================================

  // FIX: Authenticated users cannot access auth pages - redirect to dashboard
  if (isAuthPage) {
    if (userRole === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    } else {
      return NextResponse.redirect(new URL('/user', request.url));
    }
  }

  // ADMIN ONLY: /admin routes
  if (isAdminRoute) {
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/user', request.url));
    }
  }

  // USER/WORKER ONLY: /user routes
  if (isUserRoute) {
    if (userRole === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // FIX: Logged in users can access "/" - don't auto-redirect them
  // "/" remains accessible for both logged in and non-logged in users
  // Logged in users will see it as home, non-logged in users will also see home
  // They can still navigate to /admin or /user as needed

  // All other routes are accessible for authenticated users
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
