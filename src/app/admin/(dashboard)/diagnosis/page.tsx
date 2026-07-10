import type { Metadata } from 'next';
import { checkEnv } from '@/lib/env-check';

export const metadata: Metadata = {
  title: '진단·대책 현황',
  robots: { index: false, follow: false },
};

// ─────────────────────────────────────────────────────────────
// 이 페이지는 2026-07-07 풀스택 진단의 "살아있는" 대책 현황판이다.
// 대책이 진행되면 아래 데이터 배열의 status 만 바꾸면 화면이 갱신된다.
//   status: 'done'(조치 완료) | 'ops'(운영조치 필요) | 'next'(예정)
// 상세 근거: repo docs/DIAGNOSIS-2026-07-07.md · 백업 운영: docs/BACKUP-LOCAL.md
// ─────────────────────────────────────────────────────────────

const UPDATED = '2026-07-08';

type Sev = 'crit' | 'high' | 'med' | 'low';
type Status = 'done' | 'ops' | 'next';

interface Finding {
  id: string;
  title: string;
  sev: Sev;
  status: Status;
  desc: string;
  fix: string;
}

interface Section {
  num: string;
  title: string;
  intro: string;
  findings: Finding[];
}

const SECTIONS: Section[] = [
  {
    num: '01',
    title: 'P0 — 즉시 조치 보안 · PII',
    intro: '원격에서 악용 가능한 결함. SEC-1·SEC-2는 실제 파일로 직접 확증.',
    findings: [
      {
        id: 'SEC-1', sev: 'high', status: 'done',
        title: '관리자 사용자 API 역할 검사 부재 → 권한 상승',
        desc: 'api/admin/users 의 생성·수정·삭제가 역할을 검사하지 않아 editor 가 스스로를 super_admin 으로 승격 가능.',
        fix: '세 변경 동사에 requireSuperAdmin() 가드 추가.',
      },
      {
        id: 'SEC-2', sev: 'high', status: 'done',
        title: '무인증·GET 방식 프로덕션 콘텐츠 덮어쓰기',
        desc: 'seed-process-tab 가 공개 화이트리스트에 있어 익명 GET/CSRF 로 홈 콘텐츠 변조 가능.',
        fix: '화이트리스트 제거 + GET→POST + super_admin 가드.',
      },
      {
        id: 'DATA-1', sev: 'high', status: 'done',
        title: '고객 PII·자격증명이 공개 Blob URL로 접근 가능',
        desc: '문의·리드·비밀번호 해시·재설정 토큰이 공개 Blob 에 저장되고, 유일 방어인 비밀 prefix 가 소스·문서·로그에 평문 노출. 공개 저장소 기준 2026-04-24 커밋부터 약 11주간 노출, 로테이션 뒤에도 옛 prefix 가 공개 URL 로 200 응답을 계속했다(2026-07-10 재진단에서 확인).',
        fix: '코드: 하드코딩 prefix 제거(잔존 9개 스크립트+AGENTS.md 까지 전수 스크럽)·로그 URL 출력 중단. 운영: prefix 로테이션(7/10) → 옛 prefix 87 blob 삭제(공개 URL 404 검증) → GitHub Actions 시크릿 갱신. 공개 git 이력의 옛 prefix 값은 회수 불가하나 해당 경로에 데이터가 없어 무효.',
      },
      {
        id: 'DATA-1b', sev: 'high', status: 'done',
        title: '노출 기간 중 유출됐을 수 있는 자격증명 대응',
        desc: 'DATA-1 노출 창(2026-04-24 ~ 07-10) 동안 admin-users.json(관리자 3계정 pbkdf2-sha256 10만회·salt 해시)·partner-accounts.json 이 공개 URL 로 열려 있었다. Vercel Blob 은 접근 로그를 제공하지 않아 실제 열람 여부는 증명도 반증도 불가.',
        fix: 'ADMIN_SESSION_SECRET 교체(2026-07-10, 전체 관리자·파트너 세션 무효화). 교체 전 안전성 검증: qr-serials HMAC 주소 의존 레코드 0개·쿠폰은 코드 주소·이벤트는 날짜/ID 주소라 실물 QR 무영향, 깨지는 건 30분 스캔 토큰과 로그인 세션뿐. 비밀번호는 해시 강도(pbkdf2 10만회·salt)를 근거로 유지 결정(사용자 승인, 2026-07-10) — 단 약한 비밀번호는 오프라인 크래킹이 가능하므로 이후 비밀번호 변경 시 강한 값 권장.',
      },
      {
        id: 'SEC-M3', sev: 'med', status: 'done',
        title: 'thesis 잠금 비밀번호 소스 하드코딩',
        desc: '/thesis 비밀번호·토큰이 소스에 기본값으로 박혀 있었음.',
        fix: '리터럴 제거·fail-closed. 배포 전 THESIS_TOKEN·THESIS_PASSWORD env 설정 필요.',
      },
      {
        id: 'SEC-M2', sev: 'med', status: 'done',
        title: 'mirror-url 서버측 fetch SSRF',
        desc: '프로토콜만 검사하고 사설망(169.254.169.254 등) 요청을 막지 않음.',
        fix: 'lib/ssrf.ts 신설 — 사설/루프백/링크로컬 차단 + 리다이렉트 재검증.',
      },
    ],
  },
  {
    num: '02',
    title: '성능 — 로딩 속도',
    intro: '라이브 실측 홈 TTFB 웜 1.4–2.3s(콜드 7.6s). 홈이 no-store 로 전혀 캐싱되지 않던 것이 핵심. P1 Quick Win 적용.',
    findings: [
      {
        id: 'PERF-1', sev: 'crit', status: 'done',
        title: '전 페이지 force-dynamic + 무캐싱 Blob 왕복',
        desc: '레이아웃만으로 3회 직렬 await(최대 6 왕복)가 매 요청 발생. /products 는 165KB pages.json 무캐싱 추가 read.',
        fix: 'Promise.all 병렬화 + Uncached→Safe(캐시) 전환. admin 저장 시 revalidateTag 동기 호출로 신선도 유지.',
      },
      {
        id: 'PERF-3·4', sev: 'high', status: 'done',
        title: 'Google Fonts @import 렌더블로킹 + 이미지 unoptimized',
        desc: '폰트 14굵기 @import(4-hop, preconnect 없음). 공개 이미지 18곳 unoptimized 로 AVIF/WebP·반응형 비활성.',
        fix: '폰트 preconnect 추가, 공개 이미지 unoptimized 18곳 제거. (next/font 이관은 P2)',
      },
      {
        id: 'PERF-6·7', sev: 'low', status: 'done',
        title: '블로그 커버 LCP · 배포 경량화',
        desc: '커버 우선순위 힌트 부재. 루트에 배포 불필요한 대용량 자산.',
        fix: '커버 fetchPriority=high, .vercelignore 대용량 자산 제외.',
      },
    ],
  },
  {
    num: '03',
    title: '데이터 · DB · 백업',
    intro: 'Vercel Blob JSON 저장. db.ts 는 사고 교훈을 코드화한 견고한 설계이나 백업 커버리지·poison 백업·싱글턴 쓰기에 위험.',
    findings: [
      {
        id: 'DATA-3', sev: 'high', status: 'done',
        title: '백업 커버리지 약 40% 누락',
        desc: 'leads·partner-accounts·media-submissions·blogPosts·blogCategories·qr-codes·설정 싱글턴이 어느 티어에도 백업 안 됨.',
        fix: 'DB_FILES·SINGLETON_FILES 전수 확장(실측으로 파일명 교정). 복원도 자동 확장.',
      },
      {
        id: 'DATA-4', sev: 'med', status: 'done',
        title: '장애 중 빈 값을 정상처럼 기록 (poison 백업)',
        desc: '읽기 실패 시 빈 배열 저장 → 복원하면 실데이터 삭제.',
        fix: 'degraded 표시·제외, 복원은 롤백포인트 불완전 시 중단, cron 은 degraded 시 500 알림.',
      },
      {
        id: 'DATA-2', sev: 'med', status: 'done',
        title: '싱글턴 쓰기 경로 stale seed 저하 (pages.json 유실 벡터)',
        desc: 'readSingleUncached 가 장애 시 throw 안 해, Blob 블립 중 저장하면 편집분 유실 가능.',
        fix: 'readSingleForWrite 신설 — Blob 장애 시 throw. pages·company·navigation·announcement·mail-settings·integration-settings 6개 저장 라우트에 적용(장애 중 저장은 503/500 로 중단, stale 덮어쓰기 방지).',
      },
      {
        id: 'DATA-5·8', sev: 'low', status: 'next',
        title: '동시 업데이트 last-writer-wins · O(n) 전체 재기록',
        desc: '같은 레코드 동시 수정 시 유실 가능. 무한 증가·보존정책 없음.',
        fix: '레코드 rev/newest-wins, 아카이빙·QR 롤업 (P3).',
      },
    ],
  },
];

const ARCH: { id: string; title: string; sev: string; phase: string }[] = [
  { id: 'ARCH-1', title: '자동화 테스트 62개 — auth·totp·ssrf·백업암호화·QR + db 동시성(outbox·tombstone·부활차단·유실복원). 과거 유실사고급 로직 커버', sev: 'Critical', phase: '진행중' },
  { id: 'ARCH-2', title: 'CI 품질 게이트 추가 — push/PR 시 typecheck+test(.github/workflows/ci.yml). ESLint 도입은 잔여', sev: 'High', phase: '진행중' },
  { id: 'ARCH-3', title: '환경변수 50개 산개 · 검증 config 부재', sev: 'High', phase: 'P4' },
  { id: 'ARCH-4', title: '에러 바운더리 추가 완료 (렌더 에러 시 사이트 폴백). Sentry·Blob 저하 알림은 P4', sev: 'High', phase: '진행중' },
  { id: 'ARCH-6', title: '고아 라우트 /products-v2 · 레거시 zoel-life-source', sev: 'Medium', phase: 'P4' },
];

const ROADMAP: { badge: string; done: boolean; title: string; desc: string }[] = [
  { badge: '1 · 완료', done: true, title: 'P0 보안 · PII', desc: '권한 상승·무인증 쓰기·PII prefix·thesis·SSRF 패치 적용(미배포)' },
  { badge: '2 · 완료', done: true, title: 'P1 성능 Quick Win', desc: '읽기 병렬화·캐시 전환, 이미지 최적화, 폰트 preconnect, 배포 경량화' },
  { badge: 'B · 완료', done: true, title: '백업 강화', desc: '서버 커버리지 전수 확장·poison 방지, 로컬 Mac 백업 + 정기 실행' },
  { badge: '3 · 다음', done: false, title: 'P2 성능 심화', desc: '폰트 next/font 이관, 콘텐츠 라우트 ISR 전환, db.ts list() 제거' },
  { badge: '4 · 다음', done: false, title: 'P3 데이터 신뢰성', desc: '복호화·무결성 리허설 통과(87/87). 남음: 서버측 QR prefix 아카이버, 라이브 복원 리허설(스테이징 대상), 레코드 버저닝' },
  { badge: '5 · 진행중', done: false, title: 'P4 품질 기반', desc: 'vitest 테스트·CI 게이트·에러 바운더리 완료. 남음: 테스트 확대(동시성·백업), ESLint, env 검증 모듈, Sentry·Blob 저하 알림' },
];

const CHANGELOG: { date: string; text: string }[] = [
  { date: '2026-07-10', text: 'DATA-1b 처리 — ADMIN_SESSION_SECRET 신규 생성·교체(전 세션 무효화). 교체 전 파급 검증: 이 시크릿이 파트너 세션·QR 시리얼 HMAC 주소·QR 추적 토큰의 폴백으로도 쓰임을 확인, qr-serials 레코드 0개(실물 QR 무영향)를 백업 매니페스트로 검증 후 실행. 비밀번호는 해시 강도 근거로 유지(사용자 결정). 백업 암호화 키·새 시크릿은 Apple 암호 앱 보관.' },
  { date: '2026-07-10', text: 'DATA-1 종결 — 옛 prefix 87 blob 삭제. 재진단에서 옛 prefix 가 삭제 전까지 공개 URL 로 inquiries·admin-users·partner-accounts 를 200 으로 계속 서빙했고, HEAD 의 9개 스크립트+AGENTS.md 에 prefix 값이 남아 있었음을 확인. 삭제 전 옛 prefix 전량(스냅샷 포함 87개)을 암호화 백업·복호화 검증하고, 신 prefix 와 대조해 "구에만 있는 파일 0개"(무손실)를 증명한 뒤 실행. 삭제 후 공개 URL 404·라이브 사이트 200 검증. 소스 전수 스크럽 + GitHub Actions BLOB_DATA_PREFIX 시크릿 갱신(옛 값이 남아 있어 시드 커밋 시 삭제된 경로 부활 위험이었음).' },
  { date: '2026-07-10', text: '로컬 백업(Tier 4) 실가동 — 최초 실행 51/51 파일 AES-256-GCM 암호화 저장, launchd 매일 03:00 등록·즉시 1회 테스트(exit 0). 복호화 리허설로 sha256 전량 일치·JSON 파싱 전량 성공 확인(백업이 실제로 복원 가능함을 증명). 백업 디렉터리·파일 권한을 0700/0600 으로 코드에 고정(PII·비밀번호 해시 보호).' },
  { date: '2026-07-10', text: 'BLOB_DATA_PREFIX 로테이션 실행 완료 — 노출됐던 옛 prefix에서 새 값으로 87 blob 복사·sha256 전량 일치 검증 후 Vercel env 교체·재배포. 사이트 정상·데이터 무손실 확인.' },
  { date: '2026-07-09', text: 'thesis env 설정·재배포로 /thesis 잠금 해제(라이브 검증). BLOB_DATA_PREFIX 로테이션 도구(scripts/rotate-blob-prefix.mjs) 신설 — 복사 전용·기본 dry-run·삭제 별도 가드.' },
  { date: '2026-07-08', text: 'db 동시성 테스트 추가(ARCH-1) — 인메모리 Blob 목으로 outbox·tombstone·부활 차단·유실 복원·stale 베이스 거부를 검증. 과거 유실사고급 로직 커버, 단위 테스트 62개.' },
  { date: '2026-07-08', text: '환경변수 점검 모듈 + /admin/diagnosis 연동(값 비노출). 오늘 /thesis 401(env 누락)처럼 설정 누락을 즉시 확인.' },
  { date: '2026-07-08', text: '보안·성능·백업·안정성·품질 종합 대책 프로덕션 배포 완료(main). 백업 암호화·QR 서명 회귀 테스트 추가.' },
  { date: '2026-07-08', text: '품질 기반: vitest 도입 + 단위 테스트(auth·totp·ssrf) 통과, CI 게이트(typecheck+test) 추가로 회귀를 머지 전에 차단.' },
  { date: '2026-07-08', text: '안정성 대책: 에러 바운더리(error.tsx·global-error.tsx) 추가로 렌더 에러 시 사이트 폴백, DATA-2 싱글턴 저장 무결성(readSingleForWrite) 6개 라우트 적용.' },
  { date: '2026-07-08', text: '백업 체계 강화(서버 커버리지 전수 + 로컬 Mac 백업 신설), 진단 현황판 관리자 메뉴 추가.' },
  { date: '2026-07-08', text: 'P1 성능 Quick Win 6건 적용 (읽기 병렬화·캐시 전환·이미지 최적화·폰트 preconnect).' },
  { date: '2026-07-07', text: 'P0 보안 5건 패치 적용. 풀스택 진단 보고서 작성.' },
];

const SEV_LABEL: Record<Sev, string> = { crit: 'Critical', high: 'High', med: 'Medium', low: 'Low' };
const SEV_BAR: Record<Sev, string> = {
  crit: 'border-l-[#bd3a2c]', high: 'border-l-[#c26a1c]', med: 'border-l-[#a9851b]', low: 'border-l-[#4d7495]',
};
const SEV_CHIP: Record<Sev, string> = {
  crit: 'bg-[#f6e3df] text-[#bd3a2c]', high: 'bg-[#f7e7d6] text-[#b25e14]',
  med: 'bg-[#f4ecd3] text-[#8a6c12]', low: 'bg-[#e3ecf3] text-[#3f6485]',
};
const STATUS_META: Record<Status, { label: string; cls: string }> = {
  done: { label: '조치 완료', cls: 'bg-[#dcefe3] text-[#2f7a4c]' },
  ops: { label: '운영조치 필요', cls: 'bg-[#f7e7d6] text-[#b25e14]' },
  next: { label: '예정', cls: 'bg-gray-100 text-gray-500' },
};

function Chip({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide ${className}`}>
      {children}
    </span>
  );
}

export default function DiagnosisPage() {
  // 라이브 환경변수 점검(값 노출 없이 설정 여부만). 서버 컴포넌트라 실제 운영 env 를 읽는다.
  const env = checkEnv();

  const stats = [
    { n: '8', l: 'Critical / High', c: 'text-[#bd3a2c]' },
    { n: '10', l: 'Medium', c: 'text-[#a9851b]' },
    { n: '16', l: '대책 적용 · 배포 완료', c: 'text-[#2f7a4c]' },
    { n: '76', l: 'API 라우트', c: 'text-gray-800' },
    { n: '19', l: 'Blob 컬렉션', c: 'text-gray-800' },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-[#a2761c]">
          Full-Stack Diagnostic · Confidential
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">진단 · 대책 현황</h1>
        <p className="mt-3 max-w-2xl text-[15px] text-gray-600">
          보안 · 데이터/DB · 성능 · 구조 4개 축 진단과 대책 진행 상황을 실시간으로 반영하는 현황판입니다.
          상세 근거는 <code className="rounded bg-gray-100 px-1 py-0.5 text-[0.85em]">docs/DIAGNOSIS-2026-07-07.md</code>,
          백업 운영은 <code className="rounded bg-gray-100 px-1 py-0.5 text-[0.85em]">docs/BACKUP-LOCAL.md</code>.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-gray-400">
          <span>진단 2026-07-07</span>
          <span>갱신 {UPDATED}</span>
          <span>대상 daerachoen (Next.js 15 · Vercel · Blob JSON)</span>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.l} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className={`text-3xl font-bold tabular-nums ${s.c}`}>{s.n}</div>
            <div className="mt-1 text-[12px] text-gray-500">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Status banner */}
      <div className="mb-8 rounded-xl border border-gray-200 border-l-4 border-l-[#3c8659] bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">조치 현황 (프로덕션 배포 완료 · 2026-07-08)</h3>
        <ul className="grid gap-2 text-[14px] text-gray-600">
          {[
            'P0 보안 5건 — 권한 상승·무인증 쓰기·PII prefix·하드코딩 비밀번호·SSRF',
            'P1 성능 6건 — 읽기 병렬화·캐시 전환, 이미지 최적화, 폰트 preconnect',
            '백업 강화 — 서버 커버리지 전수 확장, poison 방지, 로컬(Mac) 백업 도구 신설',
            '안정성 — 에러 바운더리(렌더 에러 시 사이트 폴백) + 싱글턴 저장 무결성(DATA-2)',
            '품질 기반 — 단위 테스트 62개(+db 동시성: outbox·tombstone·부활차단·유실복원) + CI 게이트',
          ].map((t) => (
            <li key={t} className="relative pl-6 before:absolute before:left-0 before:font-bold before:text-[#3c8659] before:content-['✓']">
              {t}
            </li>
          ))}
          <li className="relative pl-6 text-[#b25e14] before:absolute before:left-0 before:font-bold before:content-['→']">
            운영조치 대기 — 아래 환경변수 점검의 누락 항목(thesis env 등), prefix 로테이션, 로컬 백업 첫 실행, CI workflow 스코프
          </li>
        </ul>
      </div>

      {/* 환경변수 점검 (라이브·값 비노출) */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900">환경변수 점검 (현재 운영 환경 · 값 비노출)</h3>
          <span className="font-mono text-[13px] tabular-nums text-gray-500">
            {env.presentCount}/{env.totalCount} 설정됨
          </span>
        </div>
        {env.missingCritical.length === 0 && env.missingFeature.length === 0 ? (
          <p className="relative pl-6 text-[14px] text-[#2f7a4c] before:absolute before:left-0 before:font-bold before:content-['✓']">
            핵심 · 기능 환경변수가 모두 설정되어 있습니다.
          </p>
        ) : (
          <div className="grid gap-2">
            {[...env.missingCritical, ...env.missingFeature].map((v) => (
              <div key={v.name} className="flex flex-wrap items-center gap-2 border-b border-dashed border-gray-100 pb-2 last:border-0 last:pb-0">
                <Chip className={v.severity === 'critical' ? 'bg-[#fbe9e7] text-[#bd3a2c]' : 'bg-[#fdf3e2] text-[#a9851b]'}>
                  {v.severity === 'critical' ? '핵심 누락' : '기능 누락'}
                </Chip>
                <code className="font-mono text-[13px] font-semibold text-gray-800">{v.name}</code>
                <span className="text-[13px] text-gray-500">{v.purpose}</span>
                <span className="w-full pl-1 text-[12.5px] text-[#b25e14]">→ {v.ifMissing}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sections */}
      {SECTIONS.map((sec) => (
        <section key={sec.num} className="mb-10">
          <div className="mb-3 flex items-baseline gap-3 border-b-2 border-gray-800 pb-2">
            <span className="font-mono text-[13px] font-semibold text-[#a2761c]">{sec.num}</span>
            <h2 className="text-xl font-bold text-gray-900">{sec.title}</h2>
          </div>
          <p className="mb-4 text-[14px] text-gray-500">{sec.intro}</p>

          <div className="grid gap-3">
            {sec.findings.map((f) => (
              <div key={f.id} className={`rounded-lg border border-gray-200 border-l-4 bg-white p-4 shadow-sm ${SEV_BAR[f.sev]}`}>
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[12.5px] font-bold text-gray-800">{f.id}</span>
                  <span className="min-w-[200px] flex-1 text-[15px] font-semibold text-gray-900">{f.title}</span>
                  <Chip className={SEV_CHIP[f.sev]}>{SEV_LABEL[f.sev]}</Chip>
                  <Chip className={STATUS_META[f.status].cls}>{STATUS_META[f.status].label}</Chip>
                </div>
                <p className="text-[14px] text-gray-600">{f.desc}</p>
                <p className="mt-2 border-t border-dashed border-gray-200 pt-2 text-[14px] text-gray-600">
                  <span className="mr-1.5 text-[12px] font-bold uppercase tracking-wide text-[#2f7a4c]">Fix</span>
                  {f.fix}
                </p>
              </div>
            ))}
          </div>

          {sec.num === '03' && (
            <div className="mt-4 rounded-xl border border-gray-200 border-l-4 border-l-[#a2761c] bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-[#8a6410]">신규 백업 체계 (2026-07-08)</h3>
              <ul className="grid gap-2 text-[14px] text-gray-600">
                {[
                  'Tier 1–3(Blob·GitHub·이메일) 커버리지 전수 확장 + poison 방지',
                  'Tier 4 로컬(Mac) 백업 — npm run backup:local, 전체 prefix 훑어 QR 레코드·tombstone까지 보존',
                  'launchd 정기 실행(매일 03:00) + 운영 안내서(복원 절차 포함)',
                  'dry-run 으로 프로덕션 51개 blob 인식 확인(읽기 전용)',
                ].map((t) => (
                  <li key={t} className="relative pl-6 before:absolute before:left-0 before:font-bold before:text-[#a2761c] before:content-['•']">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ))}

      {/* Architecture table */}
      <section className="mb-10">
        <div className="mb-3 flex items-baseline gap-3 border-b-2 border-gray-800 pb-2">
          <span className="font-mono text-[13px] font-semibold text-[#a2761c]">04</span>
          <h2 className="text-xl font-bold text-gray-900">구조 · 코드 품질</h2>
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left text-[14px]">
            <thead>
              <tr className="bg-gray-50 text-[12px] uppercase tracking-wide text-gray-500">
                <th className="whitespace-nowrap px-4 py-2.5">ID</th>
                <th className="whitespace-nowrap px-4 py-2.5">항목</th>
                <th className="whitespace-nowrap px-4 py-2.5">심각도</th>
                <th className="whitespace-nowrap px-4 py-2.5">단계</th>
              </tr>
            </thead>
            <tbody>
              {ARCH.map((a) => (
                <tr key={a.id} className="border-t border-gray-100">
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-gray-500">{a.id}</td>
                  <td className="px-4 py-2.5 text-gray-700">{a.title}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-gray-600">{a.sev}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-gray-500">{a.phase}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Roadmap */}
      <section className="mb-10">
        <div className="mb-3 flex items-baseline gap-3 border-b-2 border-gray-800 pb-2">
          <span className="font-mono text-[13px] font-semibold text-[#a2761c]">05</span>
          <h2 className="text-xl font-bold text-gray-900">우선순위 로드맵</h2>
        </div>
        <div className="grid gap-2.5">
          {ROADMAP.map((p) => (
            <div key={p.title} className="grid grid-cols-[auto_1fr] items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <span className={`whitespace-nowrap rounded-md px-2.5 py-1 font-mono text-[12px] font-bold ${p.done ? 'bg-[#dcefe3] text-[#2f7a4c]' : 'bg-[#f7e7d6] text-[#b25e14]'}`}>
                {p.badge}
              </span>
              <div>
                <b className="block text-[15px] text-gray-900">{p.title}</b>
                <span className="text-[14px] text-gray-500">{p.desc}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-gray-200 bg-[#f7e7d6]/50 p-5">
          <b className="text-[#b25e14]">배포 전 운영 조치 (코드로 불가 · 승인 필요)</b>
          <p className="mt-2 text-[14px] text-gray-600">
            ① BLOB_DATA_PREFIX 로테이션 — 기존 prefix 가 git 히스토리에 남아 코드 수정만으로 해소 안 됨.
            ② THESIS_TOKEN·THESIS_PASSWORD env 설정 — 없으면 /thesis 잠김.
            ③ 로컬 백업용 .env.local 에 BLOB_DATA_PREFIX(+권장 BACKUP_ENCRYPTION_KEY) 추가 후 npm run backup:local 첫 실행.
            ④ 검토 후 배포(main 푸시).
          </p>
        </div>
      </section>

      {/* Changelog */}
      <section className="mb-6">
        <div className="mb-3 flex items-baseline gap-3 border-b-2 border-gray-800 pb-2">
          <span className="font-mono text-[13px] font-semibold text-[#a2761c]">06</span>
          <h2 className="text-xl font-bold text-gray-900">변경 이력</h2>
        </div>
        <ul className="grid gap-2">
          {CHANGELOG.map((c, i) => (
            <li key={i} className="flex gap-3 text-[14px]">
              <span className="w-24 shrink-0 font-mono text-gray-400">{c.date}</span>
              <span className="text-gray-600">{c.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 border-t border-gray-200 pt-4 text-[13px] text-gray-400">
        진단·대책 현황판 · 갱신 {UPDATED} · 대책 진행 시 이 페이지가 계속 업데이트됩니다.
      </p>
    </div>
  );
}
