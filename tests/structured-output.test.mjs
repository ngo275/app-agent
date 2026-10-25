// Run with: node --test tests/structured-output.test.mjs
// Exercise the real utility schemas and SDK parser without credentials or HTTP.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const sourceRoot = fileURLToPath(new URL('../src/', import.meta.url));
const apps = [
  { title: 'Planner', description: 'Plan your tasks' },
  { title: 'Weather', description: 'Check the forecast' },
];
const contents = {
  title: 'Planner',
  subtitle: 'Plan your day',
  description: 'Organize your daily tasks.',
};

// Keep the source schemas, prompts, and utility result handling under test.
// Only the shared OpenAI client is replaced; config/secrets are never loaded.
function loadUtility(filename, client) {
  const cache = new Map();
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
      fileName: filename,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    });
    const localRequire = (specifier) => {
      if (specifier === '@/lib/llm/openai') {
        return { __esModule: true, default: client, zodResponseFormat };
      }
      if (specifier.startsWith('@/') || specifier.startsWith('.')) {
        const target = specifier.startsWith('@/')
          ? path.join(sourceRoot, specifier.slice(2))
          : path.resolve(path.dirname(filename), specifier);
        return load(`${target}.ts`);
      }
      return require(specifier);
    };
    new Function('require', 'module', 'exports', outputText)(
      localRequire,
      module,
      module.exports
    );
    return module.exports;
  }
  return load(path.join(sourceRoot, 'lib/llm/utils', `${filename}.ts`));
}

function fixture(filename, payload, refusal = null, finishReason = 'stop') {
  const requests = [];
  const client = new OpenAI({
    apiKey: 'offline-test-key',
    baseURL: 'https://offline.invalid/v1',
    maxRetries: 0,
    fetch: async (url, init) => {
      assert.equal(String(url), 'https://offline.invalid/v1/chat/completions');
      const body = JSON.parse(init.body);
      requests.push(body);
      return new Response(
        JSON.stringify({
          id: 'offline-completion',
          object: 'chat.completion',
          created: 0,
          model: body.model,
          choices: [
            {
              index: 0,
              finish_reason: finishReason,
              message: {
                role: 'assistant',
                content: refusal ? null : JSON.stringify(payload),
                refusal,
              },
            },
          ],
        }),
        { headers: { 'content-type': 'application/json' } }
      );
    },
  });
  return { utility: loadUtility(filename, client), requests };
}

const cases = [
  {
    file: 'extract-keywords',
    method: 'extractKeywords',
    args: ['Planner', 'Plan your tasks'],
    payload: { keywords: ['planner', 'tasks'] },
    expected: { keywords: ['planner', 'tasks'] },
    model: 'gpt-4.1-mini',
  },
  {
    file: 'extract-keywords',
    method: 'extractKeywordsFromTitleAndDescription',
    args: ['Planner', 'Plan your tasks', 'en-US'],
    payload: { keywords: ['planner', 'tasks'] },
    expected: ['planner', 'tasks'],
    model: 'gpt-4.1-mini',
  },
  ...['localeSanityCheck', 'keywordFinalSanityCheck'].map((method) => ({
    file: 'locale-sanity-check',
    method,
    args: ['en-US', ['planner', 'tasks']],
    payload: { indices: [1, 2] },
    expected: [1, 2],
    model: 'gpt-4.1-mini',
  })),
  {
    file: 'filter-apps',
    method: 'filterApps',
    args: ['Planner', 'Plan your tasks', apps],
    payload: { reasoningSteps: ['Same purpose'], indices: [1] },
    expected: [apps[0]],
    model: 'gpt-4.1',
  },
  {
    file: 'rerank-keywords',
    method: 'rerankKeywords',
    args: [
      'Planner',
      'Plan your tasks',
      'en-US',
      [{ keyword: 'tasks', competitors: [apps[0]] }],
    ],
    payload: { keywords: ['tasks'] },
    expected: ['tasks'],
    model: 'gpt-4.1-mini',
  },
  {
    file: 'generate-aso-keywords',
    method: 'generateAsoKeywords',
    args: ['en-US', 'Planner', 'Plan your tasks'],
    payload: { keywords: ['planner', 'tasks'] },
    expected: ['planner', 'tasks'],
    model: 'gpt-4.1',
  },
  ...['APPSTORE', 'GOOGLEPLAY'].map((store) => ({
    file: 'generate-contents',
    method: 'generateContents',
    label: store,
    args: [
      'en-US',
      'Planner',
      [],
      ['title', 'subtitle', 'description'],
      undefined,
      undefined,
      undefined,
      undefined,
      store,
    ],
    payload: contents,
    expected: contents,
    model: 'gpt-4.1',
  })),
];

for (const entry of cases) {
  test(`${entry.method} ${entry.label ?? ''} retains strict schema and parsed output`, async () => {
    const { utility, requests } = fixture(entry.file, entry.payload);
    assert.deepEqual(
      await utility[entry.method](...entry.args),
      entry.expected
    );
    assert.equal(requests.length, 1);
    assert.equal(requests[0].model, entry.model);
    const format = requests[0].response_format;
    assert.equal(format.type, 'json_schema');
    assert.equal(format.json_schema.strict, true);
    const schema = format.json_schema.schema;
    assert.equal(schema.type, 'object');
    assert.equal(schema.additionalProperties, false);
    assert.deepEqual(schema.required, Object.keys(entry.payload));
    for (const [key, value] of Object.entries(entry.payload)) {
      const property = schema.properties[key];
      assert.equal(property.type, Array.isArray(value) ? 'array' : 'string');
      if (Array.isArray(value)) {
        assert.equal(property.items.type, typeof value[0]);
      }
    }
    if (entry.label === 'APPSTORE') {
      assert.match(schema.properties.title.description, /30 characters/);
      assert.match(
        schema.properties.description.description,
        /4000 characters/
      );
    }
  });

  test(`${entry.method} ${entry.label ?? ''} preserves refusal handling`, async () => {
    const { utility } = fixture(entry.file, null, 'Offline refusal');
    await assert.rejects(utility[entry.method](...entry.args), {
      code: 'LLM_REFUSAL',
    });
  });
}

test('the SDK rejects structured output with invalid array elements', async () => {
  const { utility } = fixture('generate-aso-keywords', { keywords: [123] });
  await assert.rejects(
    utility.generateAsoKeywords('en-US', 'Planner', 'Plan your tasks'),
    { name: 'ZodError' }
  );
});

test('the SDK rejects truncated structured output', async () => {
  const { utility } = fixture('generate-aso-keywords', {}, null, 'length');
  await assert.rejects(
    utility.generateAsoKeywords('en-US', 'Planner', 'Plan your tasks'),
    /length limit/
  );
});

test('empty extraction inputs do not make an API request', async () => {
  const { utility, requests } = fixture('extract-keywords', {});
  assert.deepEqual(
    await utility.extractKeywordsFromTitleAndDescription('', '', 'en-US'),
    []
  );
  assert.equal(requests.length, 0);
});
