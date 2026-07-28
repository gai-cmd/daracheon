# 대라천 블로그 초안 재편 — 작업 디렉터리

zoellife.com 블로그 draft 재편 작업. **published 4편은 건드리지 않는다.**
규격은 `work/SPEC.md` 가 단일 기준이며, 산출물은 `work/out/<slug>.json` 이다.
재편 후에도 `status` 는 `draft` 로 두고, **발행은 사람이 한다.**

## 이 디렉터리가 생긴 이유 (2026-07-27)

원래 작업은 `/private/tmp/claude-501/.../scratchpad/blog` 에서 진행했는데,
컴퓨터 리부팅 때 macOS 가 `/private/tmp` 를 비우면서 **작업 디렉터리가 통째로 사라졌다.**
규격서·소스 초안·완성 산출물·빌더 스크립트가 전부 함께 없어졌고, 리포에는 아무것도 없었다.

살아 있던 것은 서브에이전트 트랜스크립트 52개뿐이다
(`~/.claude/projects/-Users-gai-personal-works-daerachoen/cc30b3d8-.../subagents/`).
여기에 도구 호출이 전부 기록돼 있어, 파일 변경 이벤트를 **시간순으로 재생**해 작업 상태를 되돌렸다.

**그래서 이 작업은 다시 `/tmp` 에서 하지 않는다.** 리부팅 한 번에 같은 사고가 반복된다.

## 구조

```
recovered/   트랜스크립트에서 뽑은 원본 — 증거용, 수정하지 말 것
work/        실행·작업용 (recovered 를 시드로 재생한 결과)
  SPEC.md      재편 규격서 v1 (0·A~H 전 절)
  in/          소스 초안 59편 = draft 전량
  out/         재편 완료 산출물 59편 = draft 전량
  build_*.py   편별 빌더 스크립트 (out 을 생성하는 코드)
```

### 소스 초안 받아오는 법 (읽기 전용)

`in/` 은 라이브 blob 의 `blogPosts.json` 을 GET 해서 만든다. 쓰기는 하지 않는다.
접근에 필요한 `BLOB_DATA_PREFIX` 는 `.env.local` 에 있고(Vercel 에서는 Sensitive 라 `env pull` 로 안 옴),
공개 베이스는 `https://xpklzng0qyaecv6i.public.blob.vercel-storage.com` 이다.

```
{base}/{BLOB_DATA_PREFIX}/blogPosts.json     전체 63편 (published 4 + draft 59)
{base}/{BLOB_DATA_PREFIX}/blogCategories.json  categoryId → 표시명
```

`in/<slug>.json` 스키마는 `slug · title · excerpt · tags · category · categoryId ·
coverImage · author · content` 9개 키, `indent=2`, 유니코드 그대로.

## 복구 방식과 신뢰도

| 항목 | 방법 | 결과 |
|---|---|---|
| SPEC.md · 소스 초안 | 에이전트 Read 결과를 줄번호로 병합 | 41개 파일, 줄 결손 0 |
| 빌더·산출물 | Write → Edit → Bash 인라인 수정을 시간순 재생 | 605 이벤트, Edit 228건 적용 (불일치 1) |
| 최종 산출물 | 재생된 빌더 실행 | **40/40편 생성, JSON 파손 0** |

검증은 두 방향으로 했다.

1. **산출물** — 에이전트가 스스로 보고한 글자수(`charsAfter`)와 대조. 기록이 있는 36편 중
   **29편 정확히 일치**, 어긋난 7편은 전부 *보고 시점 이후에도 파일 수정이 이어진* 경우로
   확인됐다(보고 시각 < 마지막 수정 시각). 즉 복구본이 최종본이다.
2. **소스 초안** — 나중에 라이브 blob 원본을 받아 복구본 40편과 본문을 직접 대조했다.
   **40/40 완전 일치**. 트랜스크립트 재생이 원본을 그대로 재현한다는 독립 증거이며,
   같은 방식으로 복원한 산출물의 신뢰도도 이 결과가 뒷받침한다.

### 복구되지 않은 것

- `verify.mjs` — 137줄까지만 남아 있다. 그 뒤를 읽은 에이전트가 없어 잘렸고, 지금은 실행되지 않는다.
- `todo.json`, `prod-blog-snapshot.json` — 오케스트레이터만 쓰던 파일이라 트랜스크립트에 없다.
- `build_dose.py` 는 `%` 서식 충돌로 단독 실행이 깨지지만, 재생 과정에서 에이전트의 후속 수정까지
  적용돼 `out/agarwood-oil-daily-dose-2-3mg.json` 은 정상 생성된다(신고 5214자와 일치).

## 진척 (2026-07-27 기준)

**draft 59편 전량 재편 완료 + 59편 전수 검증 통과.**

- 40편: 리부팅으로 소실됐던 것을 트랜스크립트에서 복구
- 19편: 새로 작성
- 이후 기존 40편의 규격 미달을 정리해, **59/59 가 `selfcheck_c.py` FAILURES NONE,
  `numdiff.py` numberDiffClean: True** 상태다.

검증 로그는 `work/.verify/` 에 남겨 두었다(`selfcheck-all.log`, `numdiff-all.log`, `slugs.txt`).
`/tmp` 가 아니라 리포 안이라 리부팅에 살아남는다.

### 정리한 내용 (기존 40편)

**H2 길이 — 규격서 §C-2 (소제목당 400~800자)**

- 하한 미달 71건(18편)을 400자 이상으로 보강했다. 채운 문장은 전부 원문·§A 인용맵·
  이미 글 안에 있던 사실 안에서 나왔고, 대부분 **확인 범위를 한정하는 서술**이다
  (「이 숫자가 답하는 범위는 …까지입니다」, 「이 항목은 확인하지 않았습니다」).
  새 사실이나 새 출처를 끌어들이지 않았다.
- 상한 초과 3건은 분할했다. `vietnam-vs-indonesia-agarwood-origin` 의 849자·1,018자 절은
  각각 종 분포 / 종 차이의 함의, 3층위 정리 / 산지별 시료 연구로 갈랐고,
  `why-aquilaria-agallocha-roxburgh-matters` 의 846자 절은 이미 있던 h3 를 h2 로 올려 나눴다.

**`cham-agarwood-from-farm-to-capsule` — 구조가 깨진 게 아니었다**

당초 「근거·출처에 링크 없음 + `<hr />` 누락 + 1,362자」로 봤지만, 실제로는 링크도 구분선도
원래 있었다. 59편 중 이 편만 소제목을 `근거&middot;출처` 엔티티로, `<hr />` 대신 `<hr>` 로
썼을 뿐이고 검사기가 그래서 절을 인식하지 못했다. 두 표기만 나머지 58편에 맞췄다.
**disclaimer 안의 `&middot;` 는 원문과 바이트 동일이라 그대로 뒀다** (이 편은 소스 초안부터
엔티티를 쓴 유일한 편이다).

**`vietnam-vs-indonesia-agarwood-origin` 수치 누락 — 의도적 삭제였다**

`numdiff` 가 잡은 `304` 는 원문의 「남방초목상(304년)」이다. 재편 과정에서 「여러 역사 문헌이
베트남을 정품 산지로 기록」이라는 문헌 목록 전체를 **확인 불가로 판단해 들어낸** 결과였다.
숫자를 되살리되 주장은 되살리지 않는 쪽을 택했다 — 초안이 근거로 들었던 문헌 목록을 나열하고,
그중 어느 원전도 직접 확인하지 못해 산지 서열의 근거로 옮기지 않았다고 본문에 적었다.

### 사람이 판단할 항목 — 검증해서 처리했다

- **`doi.org/10.2307/1879431`** — CrossRef 조회로 제목·저자·저널·연도 4항목이 모두 맞는 것을
  확인했다(Akerlof, *The Quarterly Journal of Economics*, 1970년 8월). SPEC §A 에 **A9** 으로
  등재하고 검사기 화이트리스트에 넣었다. 침향 성분·효능 근거로는 쓰지 않는다는 단서를 함께 달았다.
- **`dh.aks.ac.kr`** — 페이지를 직접 받아 본문에서 인용문
  「소송(蘇頌)은 다음과 같이 말했다. "교지(交趾, 베트남 북부)의 밀향수(蜜香樹)이다"」를
  글자 그대로 확인했다. 각주에 소송 = 1019~1101, 『본초도경』 편찬자로 명시돼 있다.
  위키가 아니라 **한국학중앙연구원의 『이운지』 역주 자료**이고, 본문 귀속 형식도
  K7(동국대 칼럼)과 같은 2차 출처 방식이라 **원 사료 교체 없이 유지**하기로 했다.
  SPEC §A 에 **K8** 으로 등재했다.
- 함께 **K9**(신광호 외 2011, koreascience.kr)도 등재했다. 이미 본문에서 쓰이고 검사기
  화이트리스트에도 있었는데 §A 에는 없었다. **PDF 본문을 열지 못했다는 사실을 명시**해 두었다.

### 오탐 — 검사기를 고쳤다

`first-person 저희/제가/우리` 8건은 전부 **문제가 · 주제가 · 규제가** 안의 `제가` 였다.
원인은 검사기가 공백을 모두 지운 문자열에서 검사해 어절 경계가 사라진 것이다.
태그만 벗기고 공백은 남기는 `prose()` 를 추가하고 앞 음절이 한글이면 걸리지 않게
고쳤다(`(?<![가-힣])`). 실제 1인칭 사용은 59편 어디에도 없다.

## 남은 일

- 재편된 59편을 사이트에 반영하는 일은 아직 하지 않았다. `status` 는 draft 유지이고 발행은 사람 몫이다
  (2026-07-27 사용자 판단: 지금은 반영하지 않는다).
- **이 디렉터리는 git 에 올라가 있지 않다** (`marketing/blog-rewrite/` 전체가 untracked).
  리부팅에는 살아남지만 디스크 사고에는 대비가 없다. 커밋 여부는 사람이 정한다.
- `out/vietnam-vs-indonesia-agarwood-origin.json` 만 §G 의 7개 키 외에
  `author`·`category`·`categoryId`·`coverImage` 를 더 갖고 있다. 값은 `in/` 과 바이트 동일이라
  해가 없어 그대로 뒀다. 반영 스크립트가 이 키들을 덮어쓰기에 쓴다면 확인이 필요하다.

<details><summary>이전 상태 — 재편 미착수 19편 (완료됨)</summary>

- **재편 미착수 19편** — 소스 초안은 `work/in/` 에 전부 들어와 있고, 산출물만 없다.

  ```
  3000-years-of-agarwood-history            agarwood-in-five-incenses-ohyang
  agarwood-active-compounds-explained       agarwood-in-gyeongokgo-tradition-meets-science
  agarwood-as-superior-herb-shennong        agarwood-in-research-papers
  agarwood-daily-rhythm-morning-to-night    agarwood-trade-tang-song-yuan-ming
  agarwood-in-bible-and-buddhist-scriptures emotion-vs-reason-luxury-buying
  agarwood-in-daily-life-through-history    extraction-method-shapes-aroma-72h-distillation
  heavy-metal-free-safety-testing           origin-changes-agarwood-compounds-gcms
  home-cafe-agarwood-tea-ritual             status-good-agarwood-psychology
  intro-to-incense-culture-chwihyang        why-agarwood-added-last-hu-xia
  meaning-of-agarwood-108-prayer-beads
  ```

  카테고리는 침향 역사·문화 8편, 침향 과학·연구 7편, 침향 생활·활용 4편이다.
  과학·연구 7편은 §A 인용맵 밖의 출처를 끌어들이기 쉬운 주제라 날조 금지 규칙을 특히 조심해야 한다.

</details>

## 주의

- `work/out/*.json` 을 사이트에 밀어 넣기 전에 SPEC §H 자체 검증 항목을 다시 확인할 것.
- 루트에 있던 빌더 4개(`_build_a1.py`·`_build_a2.py`·`build1.py`·`build2.py`)는 `blog/in/...` 상대경로를
  쓴다. 다시 돌리려면 `work/` 안에서 `ln -s . blog` 를 만든 뒤 실행하고, 끝나면 지운다
  (자기 참조 심링크라 파일 탐색이 무한 재귀에 빠질 수 있다).
