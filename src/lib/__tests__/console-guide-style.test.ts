import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import postcss from 'postcss';
import AutofillGuideDialog from '../../app/console/AutofillGuideDialog';
import { UiProvider } from '../../app/console/ui-context';

// SPEC-CONSOLE-002 AC-CS2-029 (REQ-CS2-028): 자동 입력 끄기 안내의 단계는 번호가 보이는 <ol> 이다.
// 전역 CSS 가 목록 기호를 지우므로 .guideSteps 에 list-style decimal 을 직접 둔다.
const css = postcss.parse(readFileSync(path.resolve(__dirname, '../../app/console/console.module.css'), 'utf8'));

describe('안내 단계 번호 (AC-CS2-029)', () => {
  it('.guideSteps 규칙에 list-style decimal', () => {
    const decls: string[] = [];
    css.walkRules((r) => {
      if (r.selectors.includes('.guideSteps')) r.walkDecls((d) => void decls.push(`${d.prop}: ${d.value}`));
    });
    expect(decls.some((d) => /^list-style(-type)?: decimal\b/.test(d))).toBe(true);
  });

  it('단계는 한국어·영어 모두 <ol> 안의 <li>', () => {
    for (const lang of ['ko', 'en'] as const) {
      const html = renderToStaticMarkup(
        createElement(UiProvider, { lang }, createElement(AutofillGuideDialog, { info: { browser: 'chrome', mobile: false }, onAck: () => {}, onLater: () => {}, onCopyAddress: () => {} }))
      );
      const ol = html.match(/<ol[^>]*>([\s\S]*?)<\/ol>/);
      expect(ol?.[0]).toMatch(/guideSteps/);
      expect(ol?.[1].match(/<li\b/g)?.length).toBeGreaterThanOrEqual(2);
    }
  });
});
