import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const config = JSON.parse(
  readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')
);

test('all six configured functions fit the current 1024 MB hosting limit', () => {
  assert.equal(Object.keys(config.functions).length, 6);
  for (const [path, settings] of Object.entries(config.functions)) {
    assert.equal(settings.memory, 1024, path);
  }
});

test('automatic Git deployment is disabled for every branch', () => {
  assert.equal(config.git.deploymentEnabled, false);
});

test('description generation preserves main model fix and fallback', () => {
  const source = readFileSync(
    new URL('../src/lib/llm/utils/generate-contents.ts', import.meta.url),
    'utf8'
  );
  assert.match(source, /model: shouldUseO1Series \? 'o3-mini' : 'gpt-4o'/);
  assert.doesNotMatch(source, /['"]o1-mini['"]/);
});
