import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // TODO: 개발 모드 끝나면 || 1 삭제 (디버깅용으로 추가함)
  const token = request.cookies.get('access_token')?.value || 1;

  const isWorkspaceRoute = request.nextUrl.pathname.startsWith('/workspace');
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');

  if ((isWorkspaceRoute && !token) || (isDashboardRoute && !token)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('modal', 'login-required');
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/workspace/:path*', '/dashboard/:path*'],
};
