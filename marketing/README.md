# 대라천 · 마케팅 (침향 AI 콘텐츠 파이프라인)

대라천 침향 제품군(침향환 · 원액 · 침향차 · 훈향목) 마케팅을 위한 AI 콘텐츠 생산 파이프라인 작업 공간.

## 바로가기
- **설계서 (웹, 플로우차트 포함)**: https://claude.ai/code/artifact/c85edf1c-4d27-48ca-a5eb-782564d3316c
- **설계서 (로컬 md)**: [침향-AI-콘텐츠-파이프라인-설계서.md](./침향-AI-콘텐츠-파이프라인-설계서.md)
- **인턴 프로그램 매뉴얼**: https://agarwooding-manual.vercel.app/ (로컬: `../intern-program`)
- **대라천 사이트**: https://daracheon-tryn.vercel.app
- **Agarwooding 미디어**: https://agarwooding-media.vercel.app

## 핵심 원칙 (설계서 요약)
1. 생산은 자동화, 업로드는 수동 (자동 발행 금지)
2. 효능성 키워드 보수 운용 (키워드당 월 20건 미만) · 문화/라이프스타일 키워드 계정당 50~60건
3. 배치 분할: 20건 → 4~5회 (풀 로직 2h, 재생산 30min)
4. Python 후검증 + 사람 컨펌 게이트 필수
5. 직원 위임은 "키워드 리스트 + 명령어 + 엔터"까지만
