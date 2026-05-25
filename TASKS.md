# 작업 목록

## 운영 규칙

- 작업 목록 파일은 `TASKS.md` 하나만 사용한다.
- `TASKS.md`에는 현재 작업 하나만 남긴다.
- 이전 작업 기록은 `docs/TASK_HISTORY.md`에 보관한다.
- 상태 표기: `[ ]` 미완료, `[/]` 진행 중, `[x]` 완료

## 현재 작업: 직접선택 목록 글자색 수정

목표: `치료 및 검사 항목 추가`에서 중분류 선택 후 나오는 항목 목록의 글자가 흰 배경과 겹쳐 안 보이는 문제를 고친다.

## 작업 범위

- [x] 목록 DOM/CSS 위치 확인
- [x] 직접선택 목록 전용 글자색/배경색 고정
- [x] 문법/test(테스트) 검증
- [/] commit(커밋), push(푸시)

## 진행 메모

- 원인: `#hierarchical-items-list`는 흰 배경인데, 내부 항목이 공통 `.search-result-item`의 밝은 글자색을 상속함.
- 조치: 직접선택 목록 내부 항목만 어두운 글자색으로 고정했다.
- 검증: `node --check frontend\assets\js\script.js`, `node tests\test_runner.js` 통과.
