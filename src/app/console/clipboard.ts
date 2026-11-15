// 클립보드 쓰기 (SPEC-CONSOLE-001 copyText 에서 분리, SPEC-CONSOLE-002 REQ-CS2-020 / design.md §2.7).
// 보안 컨텍스트의 클립보드 API 를 먼저 쓰고, 없거나 거절되면 보이지 않는 임시 textarea 로 복사한 뒤
// 같은 작업 안에서 지운다. 값을 보이는 요소에 넣는 경로는 없다.

export interface ClipboardEnv {
  clipboard?: { writeText: (text: string) => Promise<void> };
  secure: boolean;
  doc: Document;
}

function browserEnv(): ClipboardEnv {
  return { clipboard: navigator.clipboard, secure: window.isSecureContext, doc: document };
}

function fallbackCopy(text: string, doc: Document): boolean {
  // 열린 대화상자 안이면 그 안에 붙인다(모달 밖 요소는 선택되지 않음).
  const host = doc.querySelector<HTMLElement>('dialog[open]') ?? doc.querySelector<HTMLElement>('[data-admin-root="console"]') ?? doc.body;
  const ta = doc.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.setAttribute('aria-hidden', 'true');
  ta.tabIndex = -1;
  ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0';
  host.append(ta);
  ta.select();
  let ok = false;
  try {
    ok = doc.execCommand('copy');
  } catch {
    ok = false;
  }
  ta.remove();
  return ok;
}

// @MX:NOTE: [AUTO] 콘솔의 모든 복사(자격증명 포함)가 지나는 한 곳. 값을 상태나 보이는 요소에 남기지 않는다 (REQ-CS2-020).
/** 복사에 성공하면 true. */
export async function writeClipboard(text: string, env: ClipboardEnv = browserEnv()): Promise<boolean> {
  if (env.clipboard && env.secure) {
    try {
      await env.clipboard.writeText(text);
      return true;
    } catch {
      // 포커스를 잃었거나 권한이 없으면 대체 경로로
    }
  }
  return fallbackCopy(text, env.doc);
}
