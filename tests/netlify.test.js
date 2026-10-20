import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { config } from '../netlify/functions/api.mjs';

test('Netlify routes the existing API and keeps the key server-side', async () => {
  const saved = process.env.FAVORIT_API_KEY;
  try {
    process.env.FAVORIT_API_KEY = 'server-only-test-key';
    const response = await handler(new Request('https://partfinder.netlify.app/api/config'));
    assert.deepEqual(await response.json(), { configured: true });
    delete process.env.FAVORIT_API_KEY;
    const missing = await handler(new Request('https://partfinder.netlify.app/api/search', {
      method: 'POST', body: JSON.stringify({ number: '01089' }),
    }));
    assert.equal(missing.status, 503);
    assert.deepEqual(await missing.json(), { error: 'Empty key!' });
    assert.equal(config.path, '/api/*');
  } finally {
    if (saved === undefined) delete process.env.FAVORIT_API_KEY;
    else process.env.FAVORIT_API_KEY = saved;
  }
});
