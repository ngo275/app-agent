import assert from 'node:assert/strict';
import test from 'node:test';
import createEmailProvider from '../src/lib/auth/email-provider.ts';

test('HTTP provider retains the existing email identity and token lifetime', () => {
  const sendVerificationRequest = async () => {};
  const options = { sendVerificationRequest };
  const provider = createEmailProvider(options);
  assert.equal(provider.id, 'email');
  assert.equal(provider.type, 'email');
  assert.equal(provider.name, 'Email');
  assert.equal(provider.maxAge, 86_400);
  assert.equal(provider.options, options);
});

test('HTTP provider delegates to the supplied sender without SMTP', async () => {
  const calls = [];
  const provider = createEmailProvider({
    sendVerificationRequest: async (request) => {
      calls.push(request);
    },
  });
  const request = {
    identifier: 'test@example.invalid',
    url: 'https://example.invalid/test',
  };
  await provider.sendVerificationRequest(request);
  assert.deepEqual(calls, [request]);
});
