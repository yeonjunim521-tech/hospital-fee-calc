# 작업 목록

## 운영 규칙
- 작업 목록 파일은 `TASKS.md` 하나만 사용한다.
- `TASKS.md`에는 현재 작업 하나만 남긴다.
- 이전 작업 기록은 `docs/TASK_HISTORY.md`에 보관한다.
- 상태 표기: `[ ]` 미완료, `[/]` 진행 중, `[x]` 완료

## 현재 작업: 구글 애드센스 소유권 확인 코드 삽입

목표: AdSense(애드센스) 사이트 검토를 위해 배포되는 HTML 페이지의 `<head>`에 애드센스 코드 snippet(스니펫)을 삽입하고 `ads.txt`를 실제 publisher id(게시자 ID)로 갱신한다.

## 작업 범위
- [x] 현재 HTML/ads.txt 구조 확인
- [x] 공개 HTML 페이지에 애드센스 스크립트 삽입
- [x] `ads.txt` publisher id 갱신
- [x] 삽입 검증 및 Git 상태 확인

## 진행 메모
- 기존 작업트리에 `data/raw` 삭제와 `docs/security-scans/` 변경이 이미 있다. 이번 작업에서는 건드리지 않는다.
- 애드센스 client id: `ca-pub-1927730301151401`
