/**
 * Prebuild CLI: refresh /data/db/*.json seeds from Vercel Blob.
 *
 * Wired via `package.json#scripts.prebuild` so `next build` runs this
 * automatically. Fail-soft: any unexpected error is logged and exits 0
 * so the build is never blocked by seed sync issues — the existing
 * (stale) seed stays in place and the app still works.
 */

import { syncSeedFromBlob } from '../src/lib/seed-sync';

async function main() {
  const t0 = Date.now();
  try {
    const result = await syncSeedFromBlob();
    if (result.reason) {
      console.log(`[seed-sync] ${result.reason}`);
      return;
    }
    console.log(
      `[seed-sync] attempted=${result.attempted} written=${result.written} ` +
        `skipped=${result.skipped} errors=${result.errors} (${Date.now() - t0}ms)`
    );
    for (const f of result.files) {
      if (f.status === 'written') {
        console.log(`  ✓ ${f.name}: ${f.bytes}B (uploadedAt=${f.uploadedAt ?? '—'})`);
      } else if (f.status === 'skipped-not-in-blob') {
        console.log(`  — ${f.name}: not in blob (falling back to bundled seed as-is)`);
      } else {
        console.warn(`  ✗ ${f.name}: ${f.error}`);
      }
    }
  } catch (err) {
    console.warn(`[seed-sync] unexpected error — build continues with existing seed:`, err);
  }
}

main();
