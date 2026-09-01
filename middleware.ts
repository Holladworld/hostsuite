import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Admin route protection is handled client-side via the useAdmin hook.
// The @supabase/supabase-js client stores sessions in localStorage, not cookies,
// so Edge middleware cannot read the session. This file is kept to avoid
// a Next.js build error from the matcher config.

export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
