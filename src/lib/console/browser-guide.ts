// 자동 입력 끄기 안내 (SPEC-CONSOLE-002 REQ-CS2-018/019, design.md §2.6).
// 이 사이트는 브라우저 설정을 바꿀 수 없다. 사용자 에이전트로 브라우저를 짐작해 그 브라우저의 끄는 순서를
// 보여 주고, 데스크톱에서는 설정 주소를 복사해 줄 뿐이다. 주소·메뉴 이름은 브라우저 버전마다 다를 수 있다.

export type GuideBrowser = 'chrome' | 'edge' | 'whale' | 'safari' | 'firefox' | 'other';

export interface BrowserInfo {
  browser: GuideBrowser;
  mobile: boolean;
}

/** sessionStorage 키: 이번 브라우저 세션에 "나중에"를 눌렀다 (CS2-D6). */
export const GUIDE_LATER_KEY = 'zoel-console:autofill-guide-later';

/** 판별 순서가 중요하다: Edge·Whale 의 UA 에도 Chrome/ 이 들어 있다. */
export function detectBrowser(ua: string): BrowserInfo {
  const u = ua || '';
  const mobile = /Mobi|Android|iPhone|iPad/.test(u);
  let browser: GuideBrowser = 'other';
  if (/Edg\/|EdgA\/|EdgiOS\//.test(u)) browser = 'edge';
  else if (/Whale\//.test(u)) browser = 'whale';
  else if (/Firefox\/|FxiOS\//.test(u)) browser = 'firefox';
  else if (/CriOS\/|Chrome\//.test(u)) browser = 'chrome';
  else if (/Safari\//.test(u)) browser = 'safari';
  return { browser, mobile };
}

/** 데스크톱 브라우저의 비밀번호 설정 주소. 웹 페이지는 이 주소로 이동할 수 없어 복사만 한다. */
const SETTINGS_URLS: Partial<Record<GuideBrowser, string>> = {
  chrome: 'chrome://password-manager/settings',
  edge: 'edge://settings/passwords',
  whale: 'whale://settings/passwords',
  firefox: 'about:preferences#privacy',
};

/** 안내 묶음 키와 단계 수. 문구는 i18n `guide.steps.<key>.s1..sN`. */
const STEP_COUNTS = {
  chrome: 3,
  edge: 3,
  whale: 3,
  firefox: 3,
  safari: 3,
  other: 2,
  mChrome: 3,
  mSafari: 2,
  mOther: 2,
} as const;
type GuideKey = keyof typeof STEP_COUNTS;

export interface BrowserGuide {
  key: GuideKey;
  /** 브라우저 이름 문구 키. */
  nameKey: string;
  /** 복사해 줄 설정 주소. Safari·모바일·기타는 null(메뉴 경로만 보여 줌). */
  settingsUrl: string | null;
  /** 순서대로 보여 줄 단계 문구 키. */
  steps: string[];
}

export function guideFor(info: BrowserInfo): BrowserGuide {
  let key: GuideKey;
  if (info.mobile) key = info.browser === 'chrome' ? 'mChrome' : info.browser === 'safari' ? 'mSafari' : 'mOther';
  else key = info.browser;
  const steps = Array.from({ length: STEP_COUNTS[key] }, (_, i) => `guide.steps.${key}.s${i + 1}`);
  return {
    key,
    nameKey: `guide.names.${info.browser}${info.mobile ? 'M' : ''}`,
    settingsUrl: info.mobile ? null : SETTINGS_URLS[info.browser] ?? null,
    steps,
  };
}

/** 첫 자동 표시 여부: 확인하지 않았고 이번 세션에 "나중에"를 누르지 않았을 때만. */
export function shouldAutoOpenGuide({ ack, laterThisSession }: { ack: boolean; laterThisSession: boolean }): boolean {
  return !ack && !laterThisSession;
}
