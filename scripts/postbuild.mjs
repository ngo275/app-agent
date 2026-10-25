// Kept as a safe no-op for callers using the former build hook.
// Migrations are explicit: yarn db:migrate:deploy, with the intended database.
export function shouldMigrateAfterBuild() {
  return false;
}

export function runPostbuild() {
  return { skipped: true, status: 0 };
}
