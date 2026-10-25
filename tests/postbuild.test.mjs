import assert from 'node:assert/strict';
import test from 'node:test';
import { runPostbuild } from '../scripts/postbuild.mjs';

const production = {
  VERCEL: '1',
  VERCEL_ENV: 'production',
  VERCEL_GIT_COMMIT_REF: 'main',
};
const cases = [
  ['production main', production, false],
  ['preview main', { ...production, VERCEL_ENV: 'preview' }, false],
  [
    'preview branch',
    {
      ...production,
      VERCEL_ENV: 'preview',
      VERCEL_GIT_COMMIT_REF: 'feature/test',
    },
    false,
  ],
  [
    'production review branch',
    {
      ...production,
      VERCEL_GIT_COMMIT_REF: 'chore/appagent-runtime-security-2026-10',
    },
    false,
  ],
  [
    'missing branch metadata',
    { ...production, VERCEL_GIT_COMMIT_REF: undefined },
    false,
  ],
  ['local or missing target metadata', {}, false],
  ['outside Vercel', { ...production, VERCEL: undefined }, false],
];
for (const [name, env, expected] of cases) {
  test(`postbuild migration guard: ${name}`, () => {
    let calls = 0;
    const result = runPostbuild(env, () => {
      calls++;
      return { status: 0 };
    });
    assert.equal(calls, Number(expected));
    assert.deepEqual(result, { skipped: !expected, status: 0 });
  });
}
test('even a production build never calls the migration callback', () => {
  const result = runPostbuild(production, () => {
    throw new Error('Automatic migration must never run');
  });
  assert.deepEqual(result, { skipped: true, status: 0 });
});
