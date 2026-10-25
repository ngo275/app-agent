import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// Fail closed: previews, local builds, and missing target metadata never migrate.
export function shouldMigrateAfterBuild(env) {
  return (
    env.VERCEL === '1' &&
    env.VERCEL_ENV === 'production' &&
    env.VERCEL_GIT_COMMIT_REF === 'main'
  );
}

export function runPostbuild(env, migrate) {
  if (!shouldMigrateAfterBuild(env)) return { skipped: true, status: 0 };
  const result = migrate();
  if (result.error) throw result.error;
  return { skipped: false, status: result.status ?? 1 };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const result = runPostbuild(process.env, () =>
    spawnSync(
      process.execPath,
      ['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
      { stdio: 'inherit' }
    )
  );
  if (result.skipped) {
    console.log(
      'Skipping automatic DB migration outside the Vercel production main build.'
    );
  }
  process.exitCode = result.status;
}
