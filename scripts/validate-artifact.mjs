import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const workerPath = resolve(projectRoot, "dist/server/index.js");
const manifestPath = resolve(projectRoot, "dist/.openai/hosting.json");

const [source, manifest] = await Promise.all([
  readFile(workerPath, "utf8"),
  readFile(manifestPath, "utf8"),
]);
JSON.parse(manifest);

// A data URL forces ESM parsing even though the generated output has no package.json.
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const workerModule = await import(moduleUrl);
assert.equal(
  typeof workerModule.default?.fetch,
  "function",
  `${pathToFileURL(workerPath)} must export default.fetch`,
);

console.log("Artifact is valid ESM and exports default.fetch");
const worker = workerModule.default;
const page = await worker.fetch(new Request('https://local.test/'), {});
assert.equal(page.status, 200);
const html = await page.text();
assert.ok(html.includes('<script type="module">') && html.includes('<style>'));
assert.ok(!html.includes('/assets/'), 'Worker must embed all built assets');
const config = await worker.fetch(new Request('https://local.test/api/config'), {});
assert.deepEqual(await config.json(), { configured: false });
const noKey = await worker.fetch(new Request('https://local.test/api/search', { method: 'POST', body: JSON.stringify({ number: '01089' }) }), {});
assert.equal(noKey.status, 503);
console.log('Built Worker serves embedded React client and API routes');
