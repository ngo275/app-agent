import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

function loadSource(path, stubs = {}, env = {}) {
  const { outputText } = ts.transpileModule(read(path), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  });
  const module = { exports: {} };
  const localRequire = (name) => {
    if (name in stubs) return stubs[name];
    if (name.startsWith('@/')) throw new Error(`Unstubbed dependency: ${name}`);
    return require(name);
  };
  new Function('require', 'module', 'exports', 'process', outputText)(
    localRequire,
    module,
    module.exports,
    { env }
  );
  return module.exports;
}

test('unconfigured local install defaults to free mode and localhost', () => {
  const config = loadSource('src/lib/config.ts');
  assert.equal(config.NEXT_PUBLIC_FREE_PLAN_ENABLED, 'true');
  assert.equal(config.NEXT_PUBLIC_BASE_URL, 'http://localhost:3000');
  assert.equal(config.RESEND_API_KEY, '');
  assert.equal(config.EMAIL_FROM, '');
});

test('build/install/start scripts never run migrations and local servers bind loopback', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts.postbuild, undefined);
  assert.equal(pkg.scripts['db:migrate:deploy'], 'prisma migrate deploy');
  for (const name of [
    'preinstall',
    'install',
    'postinstall',
    'prepare',
    'prebuild',
    'build',
    'postbuild',
    'prestart',
    'start',
    'poststart',
  ]) {
    assert.doesNotMatch(pkg.scripts[name] || '', /migrate/);
  }
  assert.match(pkg.scripts.dev, /--hostname 127\.0\.0\.1/);
  assert.match(pkg.scripts.start, /--hostname 127\.0\.0\.1/);
});

for (const route of ['manage', 'upgrade']) {
  test(`free mode blocks billing ${route} before auth, DB, or Stripe calls`, async () => {
    const unexpected = () => {
      throw new Error('External dependency must not run');
    };
    const module = loadSource(
      `src/app/api/teams/[teamId]/billing/${route}/route.ts`,
      {
        '@/lib/config': { NEXT_PUBLIC_FREE_PLAN_ENABLED: 'true' },
        '@/lib/auth': { validateTeamAccess: unexpected },
        '@/lib/payment/stripe': { stripeInstance: unexpected },
        '@/types/errors': { handleAppError: unexpected },
      }
    );
    assert.equal(
      (
        await module.POST(new Request('http://localhost/api/billing'), {
          params: Promise.resolve({ teamId: 'test' }),
        })
      ).status,
      404
    );
  });
}

test('free mode rejects Stripe webhooks before parsing or invoking integrations', async () => {
  const unexpected = () => {
    throw new Error('External dependency must not run');
  };
  const module = loadSource('src/app/api/webhook/stripe/route.ts', {
    '@/lib/config': { NEXT_PUBLIC_FREE_PLAN_ENABLED: 'true' },
    '@/lib/payment/stripe': { stripeInstance: unexpected },
    '@/lib/payment/stripe/webhook/checkout-session-completed': {},
    '@/lib/payment/stripe/webhook/customer-subscription-deleted': {},
    '@/lib/payment/stripe/webhook/customer-subscription-updated': {},
    'next/headers': { headers: unexpected },
  });
  assert.equal((await module.POST({ text: unexpected })).status, 404);
});

test('retired analytics cron responds without any database or API dependency', async () => {
  const module = loadSource('src/app/api/cron/analytics/route.ts');
  assert.equal((await module.GET()).status, 410);
});

test('production email sign-in surfaces delivery failure instead of reporting success', async () => {
  const failure = new Error('test delivery failure');
  const module = loadSource(
    'src/lib/emails/send-verification-request.ts',
    {
      '@/components/emails/verification-link': {
        __esModule: true,
        default: async () => null,
      },
      '@/lib/resend': {
        sendEmail: async () => {
          throw failure;
        },
      },
    },
    { NODE_ENV: 'production' }
  );
  await assert.rejects(
    module.default({
      locale: 'en',
      email: 'test@example.invalid',
      url: 'http://localhost',
    }),
    failure
  );
});

test('auth keeps real sessions, uses provider configuration, and avoids retired cookie domain', () => {
  const auth = read('src/lib/auth.ts');
  assert.match(auth, /PrismaAdapter\(prisma\)/);
  assert.match(auth, /session: \{ strategy: 'jwt' \}/);
  assert.match(auth, /GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET/);
  assert.doesNotMatch(
    auth,
    /allowDangerousEmailAccountLinking|\.app-agent\.ai/
  );
  assert.match(auth, /process\.env\.NODE_ENV === 'development'/);
  assert.match(auth, /throw new UnauthorizedError\('No session'\)/);
});

test('sample environment has no reusable auth secret and disables billing by default', () => {
  assert.match(read('.env.sample'), /^NEXTAUTH_SECRET=$/m);
  assert.match(read('.env.sample'), /^NEXT_PUBLIC_FREE_PLAN_ENABLED=true$/m);
});

for (const method of ['GET', 'POST']) {
  test(`unauthenticated teams ${method} responds 401 without database access`, async () => {
    const errors = loadSource('src/types/errors.ts');
    const module = loadSource('src/app/api/teams/route.ts', {
      'next-auth': { getServerSession: async () => null },
      '@/lib/prisma': {
        __esModule: true,
        default: new Proxy(
          {},
          {
            get: () => {
              throw new Error('Database must not be touched');
            },
          }
        ),
      },
      '@/lib/auth': { authOptions: {} },
      '@/types/errors': errors,
    });
    const response = await module[method](
      new Request('http://localhost/api/teams')
    );
    assert.equal(response.status, 401);
    assert.equal((await response.json()).code, 'UNAUTHORIZED');
  });
}

for (const next of [
  'https://external.invalid/',
  '//external.invalid/',
  '%2F%2Fexternal.invalid',
  '%',
  'https://localhost.evil.invalid/',
  'http://localhost:3000/dashboard/account',
  '/login',
  '/dashboard/../../login',
]) {
  test(`authenticated login rejects unsafe redirect ${next}`, async () => {
    const { NextRequest } = require('next/server');
    const middleware = loadSource('src/lib/middleware/app.ts', {
      '@/lib/config': { NEXTAUTH_SECRET: 'test-only' },
      'next-auth/jwt': {
        getToken: async () => ({ email: 'test@example.invalid' }),
      },
    }).default;
    const request = new NextRequest(
      `http://localhost:3000/login?next=${encodeURIComponent(next)}`
    );
    const response = await middleware(request);
    assert.equal(
      response.headers.get('location'),
      'http://localhost:3000/dashboard'
    );
  });
}

test('authenticated login preserves same-origin callback', async () => {
  const { NextRequest } = require('next/server');
  const middleware = loadSource('src/lib/middleware/app.ts', {
    '@/lib/config': { NEXTAUTH_SECRET: 'test-only' },
    'next-auth/jwt': {
      getToken: async () => ({ email: 'test@example.invalid' }),
    },
  }).default;
  const response = await middleware(
    new NextRequest('http://localhost:3000/login?next=%2Fdashboard%2Faccount')
  );
  assert.equal(
    response.headers.get('location'),
    'http://localhost:3000/dashboard/account'
  );
});
