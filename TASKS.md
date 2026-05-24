# 작업 목록

## 운영 규칙

- 이 프로젝트의 작업 목록 파일은 `TASKS.md` 하나만 사용한다.
- 새 작업을 시작할 때는 마지막 작업 하나만 `TASKS.md`에 남긴다.
- 이전 작업 기록은 `docs/TASK_HISTORY.md`에 보관한다.
- 상태 표기:
  - `- [ ]`: 미완료
  - `- [/]`: 진행 중
  - `- [x]`: 완료

## 현재 작업 진행: 프로젝트 구조 정리 및 SEO 랜딩 페이지 추가

목표: `task.md`와 `TASKS.md` 운영을 하나로 통합하고, 프로젝트 파일을 보기 좋게 정리하며, SEO/AEO/GEO 노출을 위한 랜딩 페이지와 보조 파일을 추가한다.

## 작업 범위

- [x] `TASKS.md` 하나만 사용하도록 운영 규칙 변경
- [x] 이전 작업 기록을 `docs/TASK_HISTORY.md`로 이동
- [x] 임시 배포 폴더 `.deploy-pages-10ac6a4` 삭제
- [x] CSV 파일을 `data/raw`로 이동하고 짧은 영문 파일명 적용
- [x] JS/CSS/정적 데이터 파일을 `assets` 하위로 정리
- [x] 문서, DB 스키마, 테스트 파일을 전용 폴더로 이동
- [x] SEO 랜딩 페이지 추가
- [x] `sitemap.xml` 갱신
- [x] `llms.txt`와 데이터 출처 페이지 추가
- [x] 경로 참조 검증 및 문법 검사
- [x] Cloudflare 배포 최신 버전 안내
- [x] 구글/네이버 색인 요청 URL 정리
- [x] AEO/GEO 추가 작업 정리

## 진행 결과

- `TASKS.md`는 마지막 작업 하나만 보이도록 정리했다.
- 이전 작업 기록은 `docs/TASK_HISTORY.md`에 저장했다.
- 임시 배포 폴더 `.deploy-pages-10ac6a4`는 삭제했다.
- CSV 원본 4개는 `data/raw`로 이동하고 짧은 영문 파일명으로 변경했다.
- JS/CSS/정적 데이터 파일은 `assets` 하위로 이동했다.
- 문서, DB 스키마, 테스트 파일은 전용 폴더로 이동했다.
- SEO 랜딩 페이지 5개와 데이터 출처 페이지, `llms.txt`를 추가했다.
- `sitemap.xml`은 새 URL 목록으로 갱신했다.
- 검증: `node --check assets/js/script.js`, `node --check backend/server.js` 통과.
- 검증: `sitemap.xml`에 적힌 로컬 파일 존재 확인 통과.
- 참고: `tests/test_runner.js`는 실행되지만 기존 기대값이 최신 결과보기 게이트 로직과 맞지 않아 일부 FAIL이 남아 있다.
