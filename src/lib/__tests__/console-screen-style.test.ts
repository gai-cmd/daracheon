import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

// SPEC-CONSOLE-001 AC-CON-022 / AC-CON-023 / design.md §6.2 as a standing test: the console screen
// stays out of the site's dark-theme tokens and global class names, renders nothing outside its own
// root, and loads no external asset. Kept outside src/app/console and src/lib/console so the
// acceptance greps over those folders do not match the patterns written here.
const CONSOLE_DIR = path.resolve(__dirname, '../../app/console');
const LIB_DIR = path.resolve(__dirname, '../console');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return name === '__tests__' ? [] : sourceFiles(full);
    return /\.(tsx?|css)$/.test(name) ? [full] : [];
  });
}

const consoleFiles = sourceFiles(CONSOLE_DIR);
const read = (f: string) => readFileSync(f, 'utf8');

describe('console screen style isolation', () => {
  it('has the expected screen files', () => {
    const names = consoleFiles.map((f) => path.relative(CONSOLE_DIR, f));
    for (const n of ['layout.tsx', 'page.tsx', 'login/page.tsx', 'ConsoleApp.tsx', 'console.module.css']) expect(names).toContain(n);
  });

  it('uses no site design token and no :root rule', () => {
    for (const f of consoleFiles) expect(read(f), f).not.toMatch(/var\(--lx-|:root/);
  });

  it('uses no plain global class name, no <footer> and no portal', () => {
    for (const f of consoleFiles) {
      expect(read(f), f).not.toMatch(/className="(card|page|container|shell|nav|topbar|hero|step|footer)\b|<footer|createPortal/);
    }
  });

  it('marks its roots with data-admin-root="console"', () => {
    const app = read(path.join(CONSOLE_DIR, 'ConsoleApp.tsx'));
    expect(app).toContain('data-admin-root="console"');
    const login = consoleFiles.filter((f) => f.includes(`${path.sep}login${path.sep}`)).map(read).join('\n');
    expect(login).toContain('data-admin-root="console"');
  });

  it('declares the studio palette as fixed literals on the module root', () => {
    const css = read(path.join(CONSOLE_DIR, 'console.module.css'));
    expect(css).toMatch(/#faf8f3/i);
    expect(css).toMatch(/#f2efe8/i);
    expect(css).toMatch(/#1f6f5c/i);
  });

  it('references no external image, font, icon or CDN', () => {
    const files = [...consoleFiles, ...sourceFiles(LIB_DIR)];
    for (const f of files) {
      expect(read(f), f).not.toMatch(/https?:\/\/[^"' ]+\.(png|jpe?g|svg|webp|woff2?|ico)|favicon|s2\/favicons|cdn\./);
    }
  });

  it('keeps no seeded internal address or the workshop wiki address in code', () => {
    const files = [...consoleFiles, ...sourceFiles(LIB_DIR)];
    for (const f of files) {
      expect(read(f), f).not.toMatch(/drive\.google\.com\/drive\/folders\/|docs\.google\.com\/spreadsheets\/d\/|slack\.com\/archives\/|zoel-workshop\.vercel\.app\/apps\/wiki/);
    }
  });
});

describe('site chrome', () => {
  it('ChromeGate hides the public header and footer on /console', () => {
    const gate = read(path.resolve(__dirname, '../../components/layout/ChromeGate.tsx'));
    expect(gate).toMatch(/IMMERSIVE_PREFIXES = \[[^\]]*'\/console'/);
  });
});
