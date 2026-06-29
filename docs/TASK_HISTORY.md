# 작업 기록

이 파일은 `TASKS.md`에서 빠진 이전 작업 기록을 보관한다.

## main 대상 PR 생성 및 GitHub 동기화

- commit(커밋): `5310e06 feat: add calculation logs and result gate`
- push(푸시): `origin/feature-search-log`
- PR(변경 요청): GitHub에서 생성 후 `main`에 merge(병합)
- 로컬 `main`은 GitHub 최신 `origin/main` 기준으로 덮어쓰기 완료

## TASKS 최근 3개 작업 유지 규칙 적용

- 기존에는 최근 3개 작업만 `TASKS.md`에 남기도록 변경했다.
- 이번 작업에서 다시 변경: `TASKS.md`에는 마지막 작업 하나만 남기고, 이전 기록은 이 파일에 보관한다.

## 로컬 관리자 토큰 임시 파일 삭제 확인

- `.dev.vars` 파일은 프로젝트 폴더에 존재하지 않았다.
- 관리자 토큰값이 들어간 로컬 환경 파일도 발견되지 않았다.
- `.gitignore`에 `.dev.vars`, `.env`, `.env.*` 제외 설정을 유지했다.
## 병원 종별가산 항목 자동 산정 표시

- 목표: 상급종합병원가산 등 병원 등급별 가산이 자동 계산되도록 정리하고, 결과 상세 내역에 가산 항목을 별도로 표시.
- 확인: `DB.HOSPITAL_CLASS`에 의원 15%, 병원 20%, 종합병원 25%, 상급종합병원 30% 가산율 존재.
- 변경: 급여 항목의 가산 전/후 차이를 계산 상세와 결과 요약에서 확인 가능하게 처리.
- 검증: `node --check frontend\assets\js\script.js`, `node tests\test_runner.js`, `git diff --check` 통과 기록.

## 구글 애드센스 소유권 확인 코드 삽입

- 목표: AdSense(애드센스) 사이트 검토를 위해 배포되는 HTML 페이지의 `<head>`에 애드센스 코드 snippet(스니펫)을 삽입하고 `ads.txt`를 실제 publisher id(게시자 ID)로 갱신.
- 범위: 공개 HTML 페이지에 애드센스 스크립트 삽입, `ads.txt` publisher id 갱신, 삽입 검증 및 Git 상태 확인.
- 메모: 애드센스 client id는 `ca-pub-1927730301151401`.
