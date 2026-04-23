# 후속 작업 TODO (Deferred)

> 작성일: 2026-04-23
> 상태: 자료 준비 중(Opus 4.7 별도 진행) — 준비 완료 후 실제 작업 예정

---

## 1. 공식 자산(Assets) 통합 — www.zoellife.com 용 이미지·사진·인증서

### 자료 출처
- Google Drive 폴더: https://drive.google.com/drive/folders/1267o0Nf_0aX2cZcGiAHo-rGtD3SssRtF
- 현재 상태: Opus 4.7 이 위 드라이브를 정리 중. 정리 완료되면 아래 작업 진행.

### 해야 할 일

**A. 자산 인벤토리 & 매핑**
- [ ] 드라이브의 모든 파일 열람 후 카테고리별 분류
  - 제품 사진 (각 제품별 메인/갤러리)
  - 브랜드 사진 (농장/공장/인력)
  - 인증서 스캔본 (CITES, HACCP, GMP, 식약처 등 배지와 매칭)
  - 로고/브랜드 에셋
  - 홈쇼핑 방송 썸네일
- [ ] 각 파일별로 "현재 사이트의 어디에 쓰일 것인가" 매핑 표 작성

**B. 현재 누락된 자산 식별**
현 하드코딩/placeholder 상태인 곳들:
- [ ] `/products/[slug]` 각 제품의 갤러리 이미지 (일부는 `lh3.googleusercontent.com` 링크로 되어 있음 — 최적화 필요)
- [ ] `/process` 농장/공장 사진
- [ ] `/company` 회사 연혁 사진·로고
- [ ] `/brand-story` 브랜드 스토리 이미지
- [ ] `/about-agarwood` 침향 관련 이미지
- [ ] `/home-shopping` 방송별 썸네일
- [ ] 홈 Hero 배경 이미지 (현재 assets.floot.app — 자체 에셋으로 교체)
- [ ] 인증서 배지 옆 실물 스캔 이미지 (CITES/HACCP 등)

**C. 업로드 경로**
- 모든 이미지는 `/admin/(media 탭)` 또는 `/admin/pages/*` 의 업로드 필드로 투입
- Vercel Blob 로 전송되어 `https://<storeId>.public.blob.vercel-storage.com/...` 에 public URL 생성
- 관리자가 DB 를 통해 바꿀 수 있어야 함 — **절대 하드코딩 금지**
- 현재 CSP 헤더의 `img-src` 에 `https://*.public.blob.vercel-storage.com` 이미 포함되어 있으므로 문제없이 렌더됨.

**D. 이미지 최적화 정책**
- Next.js `<Image>` 컴포넌트 사용 (현재 일부만 사용 중)
- 원본 해상도 ≤ 2048px, WebP 변환 권장
- 중요 제품 이미지는 Cloudinary 로도 복제해 CDN 이중화 고려

**E. 데이터 연결 구조**
- 관리자 입력 필드 → `pages.json` 또는 `products.json` 의 이미지 URL 필드
- 공개 페이지 렌더링 시 해당 필드를 `<Image src={...} />` 로 소비
- 빈 값일 때 fallback 기본 이미지 정의 (관리자가 삭제해도 페이지 깨지지 않도록)

---

## 2. 마케팅 전략 문서

### 참고 자료 (Facebook)
- https://www.facebook.com/share/r/18amqArPp8/?mibextid=wwXIfr
- https://www.facebook.com/share/p/1CDtz83xoc/?mibextid=wwXIfr

### 작성할 문서
- [ ] `docs/marketing-strategy.md` (신규 작성)
  - 브랜드 포지셔닝 (premium agarwood, 과학적 검증, 25년 연구)
  - 타깃 세그먼트 (예: 50-60대 건강 관심층, 프리미엄 선물용, 명상·웰니스)
  - 핵심 메시지 (4-Point Verification: 원산지·원료·제조·시험)
  - Facebook 영상에서 확인된 소구점 반영
  - 채널 믹스: 홈쇼핑(TV) · 자체 웹(SEO) · SNS · 검색광고
  - 콘텐츠 캘린더 템플릿
  - KPI (전환율·문의·방송 시청·재구매)
- [ ] `docs/` 폴더 내 마케팅 전용 서브폴더 구성
  - `docs/marketing/assets-inventory.md` — 드라이브 자산 리스트
  - `docs/marketing/strategy.md` — 전략 요약
  - `docs/marketing/campaigns/` — 캠페인별 기획서

### 프로세스
1. Facebook 2개 URL 에서 영상·게시물 확인 (브랜드 톤·기존 캠페인 파악)
2. 드라이브 자산 인벤토리와 대조
3. 지금 사이트 콘텐츠(홈·브랜드스토리·제품·리뷰)와 어긋나는 톤·메시지 조정
4. 전략 문서 초안 → 사용자 검토 → 확정

---

## 3. 연계 체크 — 자산 투입 후 재점검할 것

드라이브 자산 투입 + 마케팅 전략 확정 후 아래 재점검:
- [ ] 모든 공개 페이지의 이미지가 관리자 편집 가능한 경로인지 재확인
- [ ] 새 배지/인증이 홈 `certs` 섹션에 추가되었는지 (지금은 /products 페이지 하단과 공유됨)
- [ ] 하드코딩된 placeholder 이미지가 모두 제거되었는지 grep 으로 검증
  - `https://assets.floot.app` 검색 → 0건이어야 함
  - `lh3.googleusercontent.com` → Cloudinary 또는 자체 Blob 으로 교체
  - `images.unsplash.com` → 최종 브랜드 자산으로 교체
- [ ] SEO 메타 이미지(OG image) 도 자체 브랜드 이미지로 갱신

---

## 작업 규칙 (재확인)

1. **하드코딩 금지** — 이미지 URL 은 반드시 DB 필드로 관리
2. **관리자↔프론트 1:1 연동** — 새 필드 추가 시 admin UI 와 공개 페이지 동시 반영
3. **DB 변경 전 스냅샷** — `/admin/backup` 에서 수동 스냅샷 후 대규모 콘텐츠 교체
4. **CSP 검증** — 새 이미지 호스트 추가 시 `next.config.ts` 의 `img-src` 에도 추가
