import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || '';

async function getRole(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = decodeURIComponent(token);
    const { payload } = await jwtVerify(decoded, new TextEncoder().encode(JWT_SECRET));
    return payload.role || null;
  } catch (e) {
    return null;
  }
}

function redirect(request, pathname) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';
  return NextResponse.redirect(url);
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const role = await getRole(request);

  if (pathname.startsWith('/admin')) {
    if (role !== 'admin') return redirect(request, role ? '/dashboard' : '/auth/login');
  }

  if (pathname.startsWith('/coach')) {
    if (role !== 'coach' && role !== 'admin') return redirect(request, role ? '/dashboard' : '/auth/login');
  }

  if (pathname.startsWith('/dashboard')) {
    if (!role) return redirect(request, '/auth/login');
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/coach/:path*', '/dashboard/:path*'],
};