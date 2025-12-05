import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/properties',
  '/leads',
  '/calendar',
  '/messages',
  '/reports',
  '/settings',
];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];

/**
 * Validates JWT token in middleware (Edge Runtime compatible)
 * Uses 'jose' library which works in Edge Runtime unlike 'jsonwebtoken'
 */
async function validateToken(token: string): Promise<boolean> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET not configured');
      return false;
    }

    const secretKey = new TextEncoder().encode(secret);
    await jwtVerify(token, secretKey);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get('auth-token')?.value;

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if the route is an auth route
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Validate token for protected routes
  if (isProtectedRoute) {
    if (!authToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify the token is valid, not just present
    const isValidToken = await validateToken(authToken);
    if (!isValidToken) {
      // Clear invalid token and redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('auth-token');
      return response;
    }
  }

  // Redirect to dashboard if accessing auth routes while authenticated
  if (isAuthRoute && authToken) {
    const isValidToken = await validateToken(authToken);
    if (isValidToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // If token is invalid, clear it and allow access to auth routes
    const response = NextResponse.next();
    response.cookies.delete('auth-token');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
