# 이미지 슬롯 매핑 가이드

> 페이지별 모든 이미지 슬롯 ↔ 관리자 메뉴 위치 매핑.
> 현재 부적절한 이미지가 들어있는 슬롯은 이 가이드대로 관리자에서 교체하면 됩니다.
> 작성일: 2026-04-24 · Drive 자료: https://drive.google.com/drive/folders/1267o0Nf_0aX2cZcGiAHo-rGtD3SssRtF

---

## 업로드 원칙

1. **하드코딩 금지** — 모든 이미지는 관리자 UI 의 업로드 버튼(ImageUploadField)을 통해 DB(pages.json / products.json) 에 저장됩니다.
2. **저장 위치** — 업로드하면 자동으로 Vercel Blob 에 올라가고 DB 는 해당 URL 만 보관합니다. Drive 직접 링크·Cloudinary·로컬 경로 등은 지양.
3. **저장 즉시 반영** — 관리자 화면에서 저장 버튼을 누르면 공개 페이지에 3초 내 반영됩니다(revalidatePath 자동 호출).
4. **CSP 허용 도메인** — `next.config.ts` 의 `img-src` 에 `*.public.blob.vercel-storage.com` · `res.cloudinary.com` · `img.youtube.com` · `i.ytimg.com` 등이 포함됨. 그 외 외부 호스트 이미지는 렌더 안 됨.

---

## 1) /brand-story — 브랜드 이야기 (6개 탭)

관리자 메뉴: **홈편집 아님 → `/admin/pages/brand-story`**
또는 관리자 사이드바 → "브랜드 이야기"

### 탭 1 — 브랜드 스토리

| 슬롯 | 관리자 위치 | 권장 Drive 폴더 | 비고 |
|---|---|---|---|
| Hero 배경 | "Hero · 히어로" → 배경 이미지 | `pic/브랜드_대라천` 에서 대표 컷 | 히어로 전체폭에 깔리는 배경 |
| **농장 사진 (5개)** | "탭 1 · 브랜드 스토리 — 농장 네트워크" → 각 카드의 "농장 사진" | 하띤·동나이·냐짱·푸국·람동 각 농장 컷 | ✨ 새로 추가된 필드 — 이전엔 편집 불가였음 |

### 탭 2 — 대라천 침향 현장

| 슬롯 | 관리자 위치 | 권장 Drive 폴더 |
|---|---|---|
| 현장 이미지 (최대 3개) | "탭 2 · 대라천 침향 현장" → 현장 이미지 | `pic` 에서 농장 현장 와이드샷 3장 |

### 탭 3 — 대라천 침향 역사

이미지 슬롯 없음 (타임라인 텍스트만).

### 탭 4 — 다양한 인증

| 슬롯 | 관리자 위치 | 권장 Drive 폴더 |
|---|---|---|
| 인증서 이미지 + 인증명 (N개) | "탭 4 · 다양한 인증" → 인증 이미지 추가 | `doc` 또는 `docs` 의 CITES / HACCP / OCOP / ISO / 특허증 스캔본 |

### 탭 5 — 검증된 품질

| 슬롯 | 관리자 위치 | 권장 Drive 폴더 |
|---|---|---|
| 품질 이미지 (최대 2개) | "탭 5 · 검증된 품질" → 품질 이미지 | 시험성적서·QC 사진 |

### 탭 6 — 생산 공정

| 슬롯 | 관리자 위치 | 권장 Drive 폴더 |
|---|---|---|
| 공정 이미지 (최대 2개) | "탭 6 · 생산 공정" → 공정 이미지 | `pic` 에서 가공·증류 현장 |
| 공정 영상 | **코드에서 id 필드로 참조** — `processTab.videoChapters[].videos[].id` | Drive 영상 파일 ID (공유 URL 의 `/d/<id>/` 부분만) |

**공정 영상 주의**: 현재 videoChapters 편집 UI 가 없을 수 있음. Drive 에 영상을 "링크 아는 모두에게 공개" 로 설정한 후 파일 ID 를 코드로 수동 입력해야 할 수 있음. 필요하면 추가 admin UI 구현 요청.

---

## 2) /about-agarwood — 침향 이야기 (5개 탭)

관리자 메뉴: **"침향 이야기"** → `/admin/pages/about-agarwood`

### 탭 1 — 침향이란?

| 슬롯 | 관리자 위치 | 권장 Drive 폴더 |
|---|---|---|
| 히어로 배경 이미지 | "Hero · 히어로" → 히어로 배경 이미지 | `pic` 에서 침향 수지 클로즈업 또는 침향목 |

이 탭의 나머지 (정의·형성·특별한 이유·효능)는 텍스트만.

### 탭 2, 3 — 문헌·논문

이미지 슬롯 없음 (텍스트·링크만).

### 탭 4 — 매체에 실린 침향

| 슬롯 | 관리자 위치 | 권장 Drive 폴더 |
|---|---|---|
| 매체 보도 썸네일 (N개) | "매체 보도 목록" → 각 항목의 "썸네일 이미지 (선택)" | 해당 매체 기사 스크린샷 또는 로고 |

### 탭 5 — 고객이 남긴 침향

| 슬롯 | 관리자 위치 | 권장 Drive 폴더 |
|---|---|---|
| 고객 프로필 이미지 (N개) | "고객 후기 목록" → 각 항목의 "프로필 이미지 (선택)" | 고객 동의 받은 초상 또는 실루엣 |

---

## 3) /products — 제품 소개

사용자 언급: **"현재 있는 이미지는 제품이 아님"**

관리자 메뉴: **"제품 소개"** → `/admin/products`

### 제품별 이미지

| 슬롯 | 관리자 위치 | 권장 Drive 폴더 |
|---|---|---|
| Product.image (대표) | 각 제품 "편집" → 이미지 | **`브랜드_대라천`** 폴더 (제품 사진) 또는 `1MOLjYw8W-XB3YqwaZZY_e4IQG8BtE5wy` 의 해당 제품 컷 |
| Product.gallery[] (갤러리) | 각 제품 "편집" → 갤러리 이미지 추가 | 제품별 여러 각도 컷 |

### 제품 공통 인증 배지 (페이지 하단 4개)

`/products` 하단 "모든 제품은 국제 인증으로 증명된 진품" 섹션.

| 슬롯 | 관리자 위치 | 권장 Drive 폴더 |
|---|---|---|
| 인증 배지 4개 | **홈 편집 과 공유** → `/admin/pages/home` 의 "Certifications · 8개 인증 칩" 섹션 | 홈페이지와 동일 배지 사용 (한 곳에서 편집하면 홈·제품 양쪽에 반영) |

---

## 4) /media — 침향 농장 이야기 (미디어)

사용자가 "침향 농장 이야기" 로 지칭한 메뉴. 관리자 사이드바: **"침향 농장 이야기"** → `/admin/media`

| 슬롯 | 관리자 위치 | 권장 Drive 폴더 |
|---|---|---|
| 미디어 썸네일 | 각 미디어 항목 "편집" → 이미지 | `mov` 폴더의 영상 썸네일, `pic` 폴더의 사진, `docs` 폴더의 기사 스캔 |

**타입별 구분**:
- `video` → YouTube 썸네일(`img.youtube.com/vi/<id>/maxresdefault.jpg`) 또는 Drive 캡처본
- `photo` → `pic` 폴더
- `article` · `press` → 기사 스크린샷

---

## 5) / (홈페이지)

관리자 메뉴: **"홈편집"** → `/admin/pages/home`

| 슬롯 | 관리자 위치 |
|---|---|
| Hero 배경 | "Hero · 메인 히어로" → 배경 이미지 |
| 4-Point Verification 카드 | 텍스트만 (이미지 없음) |
| Verified 3카드 | 텍스트만 |
| Agarwood 3카드 | 텍스트만 (이미지 없음) |
| Benefits 6카드 | 텍스트만 (아이콘은 스타일에서 자동) |
| Process 6단계 | 텍스트만 |
| Certifications 8개 배지 | "Certifications · 8개 인증 칩" → 마크(이니셜)·이름·부제 (현재 텍스트만. 실제 인증 로고 이미지는 슬롯 없음) |

---

## 실전 작업 절차 (교체 순서 제안)

### Step 1. 가장 눈에 띄는 오류부터
1. `/admin/products` → 각 제품에서 대표 이미지·갤러리 교체 (사용자 언급한 우선순위)
2. `/admin/pages/brand-story` → 탭 1 "농장 네트워크" 에 농장 사진 5개 업로드
3. `/admin/pages/brand-story` → 탭 2 "대라천 침향 현장" 이미지 3개 교체
4. `/admin/pages/brand-story` → 탭 4 "인증" 섹션 인증서 스캔 교체

### Step 2. 탭별 마감
5. `/admin/pages/brand-story` → 탭 5·6 품질·공정 이미지 교체
6. `/admin/pages/about-agarwood` → 히어로 배경 교체
7. `/admin/media` → 현재 있는 `DEFAULT_MEDIA` fallback 을 실제 미디어로 대체

### Step 3. 확인
8. 배포 기다릴 것 없이 각 페이지 새로고침으로 즉시 반영 확인
9. 저장 전 / 후 스크린샷 비교
10. 완료 후 `/admin/backup` 에서 수동 스냅샷 1회 찍어 롤백 포인트 생성

---

## Drive 파일을 관리자 업로드로 옮기는 방법

1. Drive 에서 해당 이미지 **다운로드** (우클릭 → 다운로드) → 로컬 컴퓨터 저장
2. 관리자 해당 슬롯의 업로드 버튼 클릭 → 방금 다운로드한 파일 선택
3. Vercel Blob 으로 자동 업로드 → URL 이 DB 에 저장됨
4. 저장 버튼 클릭 → 공개 페이지 즉시 반영

### 자동화 옵션 (향후)
Drive ↔ Vercel Blob 자동 동기화 스크립트 필요하면:
- Claude Code 세션에서 `/mcp` 실행 → "claude.ai Google Drive" 인증 완료
- 이후 해당 세션에서 Drive 파일 직접 읽고 Blob 업로드 가능
- 현재 세션 유효 중에만 사용 가능, 세션 종료 시 재인증 필요

---

## 현재 코드가 DB 로만 완벽 연결된 것 (하드코딩 없음)

✅ `src/app/brand-story/BrandStoryClient.tsx` — 전 이미지 DB 기반  
✅ `src/app/about-agarwood/AboutAgarwoodClient.tsx` — 전 이미지 DB 기반  
✅ `src/app/products/page.tsx` — 제품 배열 DB 기반 (DEFAULT_PRODUCTS 는 비상용 fallback)  
✅ `src/app/products/[slug]/page.tsx` — 제품 상세 DB 기반  
✅ `src/app/media/page.tsx` — 미디어 DB 기반 (DEFAULT_MEDIA 는 비상용 fallback)

## DEFAULT_* 폴백 배열 정리 (선택)

공개 페이지 코드의 `DEFAULT_PRODUCTS`, `DEFAULT_MEDIA` 등은 "DB 가 완전히 비어있을 때 공개 페이지가 빈 화면이 되지 않도록 하는 비상용". Blob 에 한 건이라도 저장되면 이 fallback 은 사용되지 않음. 삭제해도 되지만, 안전망 차원에서 유지 권장.
