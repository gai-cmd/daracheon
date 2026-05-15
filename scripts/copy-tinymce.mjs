/**
 * TinyMCE 7 self-host 셋업.
 *
 * node_modules/tinymce 의 정적 자산(skins, icons, themes, models, plugins, langs)을
 * public/tinymce/ 로 복사한다. 클라이언트에서 TinyMCE 가 base_url='/tinymce' 로
 * skin CSS, plugin JS 등을 동적 로드한다.
 *
 * dev/build 직전에 자동 실행되도록 package.json 의 predev/prebuild 에 연결.
 * public/tinymce 는 .gitignore 에 추가 — 빌드 산출물.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'node_modules', 'tinymce');
const DST = path.join(ROOT, 'public', 'tinymce');

async function copyDir(src, dst) {
  await fs.mkdir(dst, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const ent of entries) {
    const s = path.join(src, ent.name);
    const d = path.join(dst, ent.name);
    if (ent.isDirectory()) {
      await copyDir(s, d);
    } else if (ent.isFile()) {
      await fs.copyFile(s, d);
    }
  }
}

async function main() {
  try {
    await fs.access(SRC);
  } catch {
    console.warn('[copy-tinymce] node_modules/tinymce 가 없음. npm install 필요. 건너뜀.');
    return;
  }

  // dst 가 이미 최신이면 스킵
  try {
    await fs.access(path.join(DST, 'tinymce.min.js'));
    console.log('[copy-tinymce] public/tinymce 이미 존재 — 스킵');
    return;
  } catch {
    /* 처음 또는 비어있음 */
  }

  console.log('[copy-tinymce] copying TinyMCE assets → public/tinymce ...');
  await fs.rm(DST, { recursive: true, force: true });
  // tinymce 패키지 루트 자체를 복사 (tinymce.min.js + skins + plugins + themes + ...)
  await copyDir(SRC, DST);
  console.log('[copy-tinymce] done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
