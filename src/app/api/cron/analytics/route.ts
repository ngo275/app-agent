import { NextResponse } from 'next/server';

// The former hosted cron mutated external accounts across all teams without
// user authentication. It is not part of the local-first application.
export async function GET() {
  return new NextResponse('Hosted analytics cron has been retired', {
    status: 410,
  });
}
