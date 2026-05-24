# 작업 목록

## 운영 규칙

- 작업 목록 파일은 `TASKS.md` 하나만 사용한다.
- `TASKS.md`에는 현재 작업 하나만 남긴다.
- 이전 작업 기록은 `docs/TASK_HISTORY.md`에 보관한다.
- 상태 표기: `[ ]` 미완료, `[/]` 진행 중, `[x]` 완료

## 현재 작업: 프론트/백엔드 분리, CSV 통계 반영, SEO/AEO/GEO 보강

목표: Cloudflare Pages 정적 프론트엔드와 API 백엔드 구조를 분리하고, 다운로드한 공공데이터 CSV를 요약 데이터로 변환해 계산기에 반영한다. 검색 노출용 보조 파일과 랜딩 콘텐츠도 보강한다.

## 작업 범위

- [x] 프론트엔드 공개 파일을 `frontend/`로 분리
- [x] 백엔드 API 파일은 `backend/`, Pages Functions는 `functions/`로 유지
- [x] CSV 원본에서 통계 JS 파일 생성
- [x] 상병코드 평균 진료비 입력/반영 추가
- [x] 행위코드가 있는 항목은 공공데이터 평균값 우선 반영하는 hook(훅: 연결 지점) 추가
- [x] SEO/AEO/GEO 보조 콘텐츠 추가
- [x] sitemap, 문법, 로컬 파일 참조 검증
- [/] 변경분 commit(커밋), push(푸시)

## 진행 메모

- 이전 commit(커밋) `1d91ca3`은 이미 `origin/main`에 push(푸시) 완료.
- 현재 작업 검증 완료. commit(커밋), push(푸시) 진행 중.
