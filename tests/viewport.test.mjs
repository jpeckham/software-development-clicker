import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript'
};

const gameRoot = resolve('game');
const server = createServer(async (request, response) => {
  const requestedPath = request.url === '/' ? '/index.html' : request.url;
  const filePath = join(gameRoot, decodeURIComponent(requestedPath));

  try {
    const file = await readFile(filePath);
    response.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] ?? 'application/octet-stream' });
    response.end(file);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});

await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
const { port } = server.address();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
await page.goto(`http://127.0.0.1:${port}/`);
await page.waitForSelector('#stats .stat');

const dimensions = await page.evaluate(() => ({
  viewportWidth: window.innerWidth,
  viewportHeight: window.innerHeight,
  scrollWidth: document.documentElement.scrollWidth,
  scrollHeight: document.documentElement.scrollHeight,
  bodyWidth: document.body.scrollWidth,
  bodyHeight: document.body.scrollHeight,
  headingHeight: document.querySelector('h1')?.getBoundingClientRect().height ?? 0,
  headerText: document.querySelector('.eyebrow')?.textContent?.trim() ?? '',
}));

await browser.close();
server.close();

assert.ok(
  dimensions.scrollWidth <= dimensions.viewportWidth,
  `expected no horizontal overflow, got ${JSON.stringify(dimensions)}`
);

assert.ok(
  dimensions.scrollHeight <= dimensions.viewportHeight,
  `expected full game to fit inside 1024x768, got ${JSON.stringify(dimensions)}`
);

assert.ok(
  dimensions.headingHeight <= 1,
  `expected large game title to be hidden in the embed, got ${JSON.stringify(dimensions)}`
);

assert.equal(dimensions.headerText, 'Software Development Clicker');
assert.notEqual(dimensions.headerText, 'Incremental engineering management');

console.log('viewport fit test passed');
