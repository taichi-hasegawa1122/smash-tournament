import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_TOKEN = 'smash-admin-session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 管理者ページ（ログインページ以外）へのアクセスを保護
  if (pathname.startsWith('/admin') && pathname !== '/admin') {
    const session = request.cookies.get(SESSION_TOKEN);

    if (!session || session.value !== 'authenticated') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // 管理者APIへのアクセスを保護（ログインAPI以外）
  if (pathname.startsWith('/api/admin') && !pathname.includes('/login')) {
    const session = request.cookies.get(SESSION_TOKEN);

    if (!session || session.value !== 'authenticated') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
