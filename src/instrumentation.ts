/**
 * 서버 기동 시 1회 실행되는 Next.js instrumentation 훅 (진단 ARCH-3).
 *
 * 그동안 환경변수 누락은 해당 기능이 처음 호출될 때에야 fail-closed 로
 * 드러났다 (예: THESIS_TOKEN 미설정 → /thesis 401 을 한참 뒤에 발견).
 * 여기서 부팅 직후 전 레지스트리를 점검해 로그에 크게 남긴다.
 *
 * 의도적으로 throw 하지 않는다 — critical 누락이어도 사이트의 나머지는
 * 동작해야 하고, 각 기능은 이미 자체 fail-closed 가드를 가진다. 이 훅의
 * 역할은 "조용한 저하"를 "부팅 로그의 명시적 경고"로 바꾸는 것.
 * 값은 절대 출력하지 않는다 (env-check 는 존재 여부만 본다).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  // 빌드 산출물 준비 단계가 아닌 실제 서버 기동에서만 의미 있는 점검이지만,
  // 빌드 시에도 같은 env 로 프리렌더가 돌므로 경고 자체는 유용하다.
  try {
    const { checkEnv } = await import('@/lib/env-check');
    const report = checkEnv();
    if (report.missingCritical.length > 0) {
      console.error(
        `[env] ❌ CRITICAL 환경변수 누락 ${report.missingCritical.length}건: ` +
          report.missingCritical.map((i) => `${i.name}(${i.ifMissing})`).join(', ') +
          ' — /admin/diagnosis 의 환경변수 점검에서 상세 확인'
      );
    }
    if (report.missingFeature.length > 0) {
      console.warn(
        `[env] ⚠ 기능성 환경변수 누락 ${report.missingFeature.length}건: ` +
          report.missingFeature.map((i) => i.name).join(', ')
      );
    }
    console.log(
      `[env] 점검 완료 — ${report.presentCount}/${report.totalCount} 설정됨` +
        (report.missingCritical.length === 0 ? ' (critical 전부 충족)' : '')
    );
  } catch (err) {
    console.warn('[env] 부팅 점검 실패(치명 아님):', err);
  }
}
