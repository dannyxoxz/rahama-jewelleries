import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, '..');
const projectRoot = path.resolve(frontendRoot, '..');
const publicImages = path.join(frontendRoot, 'public', 'images');
const backendCatalogue = path.join(projectRoot, 'backend', 'data', 'products.json');
const frontendCatalogue = path.join(frontendRoot, 'src', 'data', 'products.json');
const concurrency = 5;

const products = JSON.parse(await fs.readFile(backendCatalogue, 'utf8'));
await fs.mkdir(publicImages, { recursive: true });

function extensionFrom(url, contentType = '') {
  const pathname = new URL(url).pathname;
  const ext = path.extname(pathname).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'].includes(ext)) return ext === '.jpeg' ? '.jpg' : ext;
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('webp')) return '.webp';
  if (contentType.includes('avif')) return '.avif';
  return '.jpg';
}

async function downloadProduct(product) {
  if (!/^https:\/\//i.test(product.image)) {
    if (product.image.startsWith('/images/')) return { ok: true, skipped: true };
    return { ok: false, name: product.name, reason: 'Unsupported image URL' };
  }
  const filenameBase = String(product.id || product.name)
    .toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
  try {
    const response = await fetch(product.image, { redirect: 'follow' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const type = response.headers.get('content-type') || '';
    if (!type.startsWith('image/')) throw new Error(`The URL returned ${type || 'non-image content'}`);
    const ext = extensionFrom(product.image, type);
    const filename = `${filenameBase}${ext}`;
    const destination = path.join(publicImages, filename);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 100) throw new Error('Downloaded file is unexpectedly small');
    await fs.writeFile(destination, bytes);
    product.image = `/images/${filename}`;
    return { ok: true, filename };
  } catch (error) {
    return { ok: false, name: product.name, reason: error.message };
  }
}

let next = 0;
let completed = 0;
let downloaded = 0;
const failures = [];
async function worker() {
  while (next < products.length) {
    const index = next++;
    const result = await downloadProduct(products[index]);
    completed++;
    if (result.ok && result.filename) downloaded++;
    if (!result.ok) failures.push(result);
    process.stdout.write(`\rProcessed ${completed}/${products.length} | downloaded ${downloaded} | failed ${failures.length}`);
  }
}
await Promise.all(Array.from({ length: Math.min(concurrency, products.length) }, worker));
process.stdout.write('\n');

// Update both copies so the frontend fallback and API catalogue use the same local paths.
const serialised = JSON.stringify(products, null, 2) + '\n';
await fs.writeFile(backendCatalogue, serialised, 'utf8');
await fs.writeFile(frontendCatalogue, serialised, 'utf8');

if (failures.length) {
  const report = path.join(frontendRoot, 'image-import-failures.json');
  await fs.writeFile(report, JSON.stringify(failures, null, 2) + '\n');
  console.error(`\n${failures.length} image(s) could not be imported. Details: ${report}`);
  console.error('The affected products keep their original Cloudinary URLs so they still display online.');
} else {
  console.log('All catalogue images were imported successfully.');
}
console.log(`Images folder: ${publicImages}`);
console.log('Local image paths were saved to both product catalogues.');
