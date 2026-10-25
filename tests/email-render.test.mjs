import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { Resend } from 'resend';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const filename = fileURLToPath(
  new URL('../src/components/emails/verification-link.tsx', import.meta.url)
);
const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
  fileName: filename,
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true,
  },
});
const componentModule = { exports: {} };
new Function('require', 'module', 'exports', outputText)(
  (specifier) => {
    if (specifier === '@/lib/config') {
      return { NEXT_PUBLIC_BASE_URL: 'https://example.invalid' };
    }
    if (specifier.startsWith('../../../locales/')) {
      return require(`../locales/${specifier.split('/').at(-1)}`);
    }
    return require(specifier);
  },
  componentModule,
  componentModule.exports
);

for (const locale of ['en', 'ja']) {
  test(`verification email renders through Resend without HTTP (${locale})`, async () => {
    const client = new Resend('offline-test-key');
    const requests = [];
    client.post = async (url, body) => {
      requests.push({ url, body });
      return { data: { id: 'offline-email' }, error: null };
    };
    const url = 'https://example.invalid/verify?token=offline-test';
    const react = await componentModule.exports.default({ url, locale });
    const result = await client.emails.send({
      from: 'sender@example.invalid',
      to: 'recipient@example.invalid',
      subject: 'Offline rendering test',
      react,
    });
    assert.equal(result.error, null);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, '/emails');
    assert.ok(requests[0].body.html.includes(url));
    assert.match(requests[0].body.html, /AppAgent/);
  });
}
