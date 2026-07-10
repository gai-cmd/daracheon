import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv();
import { list } from '@vercel/blob';

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const PREFIX = 'MISSING_BLOB_DATA_PREFIX/';

type Product = {
  id: string;
  slug: string;
  name: string;
  image?: string;
  gallery?: string[];
};

async function main() {
  if (!TOKEN) { console.error('no token'); return; }
  const { blobs } = await list({ prefix: `${PREFIX}products.json`, limit: 1, token: TOKEN });
  const target = blobs.find((b) => b.pathname === `${PREFIX}products.json`);
  if (!target) { console.error('not found'); return; }
  console.log(`uploadedAt: ${target.uploadedAt}`);
  const r = await fetch(`${target.url}?v=${Date.now()}`, { cache: 'no-store' });
  const data = (await r.json()) as Product[];
  console.log(`product count: ${data.length}`);
  for (const p of data) {
    const g = p.gallery ?? [];
    const videos = g.filter((u) => /\.(mp4|webm|mov)/i.test(u));
    console.log(`\n[${p.slug}] ${p.name}`);
    console.log(`  image: ${p.image?.slice(0, 80) ?? '(none)'}`);
    console.log(`  gallery: ${g.length} items (videos: ${videos.length})`);
    g.forEach((u, i) => console.log(`    ${i}: ${u.slice(0, 110)}`));
  }
}
main().catch(console.error);
