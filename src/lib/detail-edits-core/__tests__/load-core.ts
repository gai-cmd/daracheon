// 코어 테스트 공용: public/detail-edit/apply.js 를 새 JSDOM 창에 올려 window.DetailEditCore 를 돌려준다.
// jsdom 은 isomorphic-dompurify 를 통해 들어오는 간접 의존성이다(새 의존성이 아니다).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

// DETAIL_EDIT_APPLY_JS: 변이 점검처럼 다른 사본으로 테스트를 돌릴 때만 쓰는 재정의
export const APPLY_JS_PATH = process.env.DETAIL_EDIT_APPLY_JS || path.resolve(__dirname, '../../../../public/detail-edit/apply.js');

export interface CoreWindow {
  document: Document;
  DOMParser: typeof DOMParser;
  DetailEditCore?: Record<string, unknown> & { sanitize(html: unknown): string; version: string };
  eval(code: string): unknown;
  close(): void;
}

interface JsdomLike {
  JSDOM: new (html: string, options?: Record<string, unknown>) => { window: CoreWindow };
}

export function loadJsdom(): JsdomLike {
  return createRequire(import.meta.url)('jsdom') as JsdomLike;
}

/** 새 창을 만들고 apply.js 를 실행한다. html 로 페이지 본문을 줄 수 있다. */
export function loadCore(html = '<!doctype html><html><head></head><body></body></html>', url = 'https://concepts.example.test/s7_black.html'): CoreWindow & { DetailEditCore: NonNullable<CoreWindow['DetailEditCore']> } {
  const { JSDOM } = loadJsdom();
  // 코어는 fetch 하지 않는 단계라 외부 자원 로딩 없이 스크립트만 실행한다(outside-only: 우리가 eval 한 코드만 돈다).
  const dom = new JSDOM(html, { url, runScripts: 'outside-only' });
  dom.window.eval(fs.readFileSync(APPLY_JS_PATH, 'utf8'));
  if (!dom.window.DetailEditCore) throw new Error('apply.js 가 window.DetailEditCore 를 노출하지 않았습니다.');
  return dom.window as ReturnType<typeof loadCore>;
}
