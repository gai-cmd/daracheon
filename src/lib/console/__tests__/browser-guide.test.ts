import { describe, expect, it } from 'vitest';
import { detectBrowser, guideFor, shouldAutoOpenGuide } from '../browser-guide';
import { translate } from '../i18n';

// SPEC-CONSOLE-002 AC-CS2-018 (자동 표시 판정), AC-CS2-019 (브라우저 판별과 안내표).
// 공개된 표준 UA 문자열 형태만 쓴다.
const UA = {
  chrome: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
  whale: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Whale/3.28.266.14 Safari/537.36',
  firefox: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:132.0) Gecko/20100101 Firefox/132.0',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
  chromeAndroid: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  iphoneSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  iphoneChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.90 Mobile/15E148 Safari/604.1',
  unknown: 'curl/8.4.0',
};

describe('detectBrowser', () => {
  it.each([
    ['chrome', { browser: 'chrome', mobile: false }],
    ['edge', { browser: 'edge', mobile: false }],
    ['whale', { browser: 'whale', mobile: false }],
    ['firefox', { browser: 'firefox', mobile: false }],
    ['safari', { browser: 'safari', mobile: false }],
    ['chromeAndroid', { browser: 'chrome', mobile: true }],
    ['iphoneSafari', { browser: 'safari', mobile: true }],
    ['iphoneChrome', { browser: 'chrome', mobile: true }],
    ['unknown', { browser: 'other', mobile: false }],
  ] as const)('%s', (k, want) => {
    expect(detectBrowser(UA[k])).toEqual(want);
  });

  it('Edge·Whale 은 chrome 으로 판별되지 않는다', () => {
    expect(detectBrowser(UA.edge).browser).not.toBe('chrome');
    expect(detectBrowser(UA.whale).browser).not.toBe('chrome');
  });
});

describe('guideFor', () => {
  it('데스크톱 Chrome·Edge·Whale·Firefox 는 설정 주소가 있다', () => {
    expect(guideFor({ browser: 'chrome', mobile: false }).settingsUrl).toBe('chrome://password-manager/settings');
    expect(guideFor({ browser: 'edge', mobile: false }).settingsUrl).toBe('edge://settings/passwords');
    expect(guideFor({ browser: 'whale', mobile: false }).settingsUrl).toBe('whale://settings/passwords');
    expect(guideFor({ browser: 'firefox', mobile: false }).settingsUrl).toBe('about:preferences#privacy');
  });

  it('Safari·모바일·기타는 설정 주소가 없다', () => {
    expect(guideFor({ browser: 'safari', mobile: false }).settingsUrl).toBeNull();
    expect(guideFor({ browser: 'other', mobile: false }).settingsUrl).toBeNull();
    for (const b of ['chrome', 'edge', 'whale', 'firefox', 'safari', 'other'] as const) {
      expect(guideFor({ browser: b, mobile: true }).settingsUrl, b).toBeNull();
    }
  });

  it('모든 경우의 단계 문구가 한·영 사전에 있다', () => {
    for (const b of ['chrome', 'edge', 'whale', 'firefox', 'safari', 'other'] as const) {
      for (const mobile of [false, true]) {
        const g = guideFor({ browser: b, mobile });
        expect(g.steps.length, `${b}/${mobile}`).toBeGreaterThanOrEqual(2);
        for (const k of [...g.steps, g.nameKey]) {
          for (const lang of ['ko', 'en'] as const) expect(translate(lang, k), `${lang}:${k}`).not.toBe(k);
        }
      }
    }
  });
});

describe('shouldAutoOpenGuide', () => {
  it('확인하지 않았고 이번 세션에 나중에를 누르지 않았을 때만 true', () => {
    expect(shouldAutoOpenGuide({ ack: false, laterThisSession: false })).toBe(true);
    expect(shouldAutoOpenGuide({ ack: false, laterThisSession: true })).toBe(false);
    expect(shouldAutoOpenGuide({ ack: true, laterThisSession: false })).toBe(false);
    expect(shouldAutoOpenGuide({ ack: true, laterThisSession: true })).toBe(false);
  });
});
