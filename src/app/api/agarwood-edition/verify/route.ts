import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/leads';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const baseUrl = request.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/agarwood-edition?error=missing_token`, 302);
  }

  const result = await verifyToken(token);
  if ('error' in result) {
    const err = result.error;
    return NextResponse.redirect(`${baseUrl}/agarwood-edition?error=${err}`, 302);
  }

  return NextResponse.redirect(
    `${baseUrl}/edition/${encodeURIComponent(result.token)}/agarwood`,
    302
  );
}
