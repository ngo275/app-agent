import { NextRequest, NextResponse } from 'next/server';

export default async function PostHogMiddleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = url.pathname.startsWith('/ingest/static/')
    ? 'us-assets.i.posthog.com'
    : 'us.i.posthog.com';
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('host', hostname);

  // Handle OPTIONS method for CORS preflight
  if (req.method === 'OPTIONS') {
    return new NextResponse('', {
      status: 200,
    });
  }

  url.protocol = 'https';
  url.hostname = hostname;
  url.port = '443';
  url.pathname = url.pathname.replace(/^\/ingest/, '');

  return NextResponse.rewrite(url, {
    headers: requestHeaders,
  });
}
