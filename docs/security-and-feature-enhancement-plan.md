# 보안 및 기능 고도화 승인 플랜

## 문서 상태

- 목적: 공개 랜딩·계산기와 관리자 페이지의 보안·정확성·운영 기능을 단계적으로 개선한다.
- 상태: **사용자 승인 대기**
- 구현 여부: 이 문서는 계획만 정의한다. 제품 기능 코드는 수정하지 않았다.
- 점검 기준: 현재 working tree, 전체 실행 파일 39개 보안 검토, 후보 8건 검증, 공개·관리자 정적 UX 감사.
- 시각 감사 제한: GStack Playwright headless shell 설치가 `__dirlock`에 막혀 현재 화면의 실제 반응형·키보드·스크린리더·네트워크 동작은 검증하지 못했다.

## 현재 판단

### 최종 보안 finding

| 우선순위 | 항목 | 영향 | 최소 조치 |
|---|---|---|---|
| P2 | 공개 인기 검색어 API가 원문 건강 검색어를 노출 | 민감한 검색 문구 공개 가능 | 원문 제거, 승인 keyword만 공개, 최소 집계 수 적용 |
| P2 | 관리자 전체 로그 삭제 CSRF | 인증된 관리자 브라우저를 이용한 전체 로그 삭제 | Origin·CSRF token·JSON content-type 검증, 전체 삭제 잠금 |
| P3 | 관리자 검색 후보 생성 CSRF | 후보 queue 오염 | 공통 admin mutation guard 적용 |

### 보안 finding 밖의 필수 hardening

- 공개 검색·클릭·계산 로그 API의 rate limit, dedupe, enum allowlist, 보존기간.
- GA·AdSense·자체 telemetry의 동의 전 차단과 원문 검색어 전송 중단.
- 읽을 수 없는 개인정보 처리방침 복구와 실제 수집 항목·목적·제3자·보존기간 고지.
- 외부 KCD 데이터의 schema, checksum, 출처일, diff threshold 검증.
- `script.js`의 중복 renderer/binder 제거와 실제 초기화 순서를 재현하는 XSS 회귀 테스트.

## 승인 게이트

아래 결정을 승인받은 뒤 구현한다.

1. **실행 범위**: `P0 전체`를 1차 구현 범위로 권장한다.
2. **관리자 기준 화면**: `frontend/admin-search.html`만 운영 화면으로 사용하고 `admin-dashboard-prototype.html`은 배포 대상에서 제외한다.
3. **관리자 인증**: 개인별 신원과 감사기록을 제공하는 Cloudflare Access 전환을 권장한다. 전환 전에는 기존 Basic Auth에 CSRF 방어를 추가한다.
4. **후보 상태 모델**: `pending`, `alias_planned`, `hira_planned`, `completed`, `on_hold`를 사용한다.
5. **기존 상태 이관**: 기존 `approved` row는 자동 완료 처리하지 않고 검토 목록으로 변환한다.
6. **전체 삭제**: backup·미리보기·재인증·감사기록이 생길 때까지 `type=all`을 비활성화한다.
7. **telemetry 동의**: 계산기는 동의 없이 정상 동작하고, GA·AdSense·비필수 자체 로그는 동의 후에만 로드한다.
8. **보존기간 초안**: 검색·클릭 원본 90일, 계산 원본 30일, 후보·감사기록 365일. 법률 확정값이 아니라 제품 기본안이다.
9. **결과 금액 정의**: 현재 `patientTotalPay` 표시를 `실비 환급 전 예상 환자 부담금`으로 명명한다. 병원 총 청구액이 필요하면 별도 값으로 계산한다.

## P0: 배포 전 필수

### P0-S1 관리자 mutation 공통 보안 경계

대상:
- `functions/_middleware.ts`
- `functions/api/admin/delete-log.ts`
- `functions/api/admin/search-candidates.ts`
- `frontend/admin-search.html`

작업:
- 모든 admin 상태 변경 요청에 strict Origin allowlist, CSRF token, `application/json` 강제를 공통 적용한다.
- admin 응답은 `Cache-Control: no-store`로 통일한다.
- client 응답에서 내부 오류 `detail`을 제거하고 server log에만 남긴다.
- 삭제 응답의 wildcard CORS를 제거한다.

완료 기준:
- 외부 Origin, token 없음/불일치, `text/plain`, 잘못된 JSON 요청은 DB 변경 없이 `403` 또는 `415`가 된다.
- 정상 same-origin 요청만 성공한다.

테스트:
- admin guard unit test.
- delete/candidate integration test.
- CSRF 실패 시 D1 `run`/`batch` 미호출 검증.

### P0-S2 공개 검색어·telemetry 개인정보 보호

대상:
- `functions/api/search-log.ts`
- `functions/api/search-click.ts`
- `functions/api/calculation-log.ts`
- `functions/api/top-searches.ts`
- `frontend/assets/js/analytics.js`
- `frontend/assets/js/script.js`
- `frontend/privacy.html`
- `database/schema.sql`

작업:
- `/api/top-searches`에서 raw `query`를 제거하고 승인 keyword/비식별 category만 반환한다.
- 최소 집계 수를 적용하고 PII-like 또는 비승인 자유형 검색어는 공개하지 않는다.
- 공개 write API에 rate limit, dedupe, payload budget, enum allowlist를 적용한다.
- 정확한 user-agent, 산정특례 질환, 상세 항목명, 정확한 금액 등 불필요한 원본 저장을 줄인다.
- 자동 purge와 dry-run, backup·restore 절차를 만든다.
- 동의 전에는 GA·AdSense·비필수 자체 로그를 로드하지 않는다.
- 개인정보 페이지에 수집 항목, 목적, 제3자, 보존기간, 거부·철회 방법을 정상 한글로 공개한다.

완료 기준:
- 최초 방문·거부 상태에서 Google, 광고, 비필수 log API 요청이 0건이다.
- 1~4회 검색어나 민감 문구는 공개 인기 검색어에 나타나지 않는다.
- 보존기간을 넘은 원본 row는 자동 제거되고 비식별 aggregate만 남는다.

테스트:
- `telemetry_consent` request-spy test.
- top-search privacy integration test.
- public write throttle·dedupe·enum test.
- retention 경계 날짜·재실행·부분 실패 test.

### P0-S3 삭제 안전장치와 감사기록

대상:
- `functions/api/admin/delete-log.ts`
- `frontend/admin-search.html`
- 신규 admin audit migration/API

작업:
- 삭제 흐름을 `미리보기 건수 -> 범위·건수 확인 -> 사유 -> 재인증 -> 실행`으로 제한한다.
- server가 예상 건수와 실제 건수를 비교하고 달라지면 중단한다.
- 작업자, 대상, 이전/이후 값, 사유, 시각, 결과를 감사기록에 남긴다.
- prototype의 입력 초기화 동작을 `삭제`로 표시하지 않는다.

완료 기준:
- 삭제 전 대상 table·기간·건수가 보인다.
- 성공 후 실제 삭제 수와 audit ID가 보인다.
- 감사기록 실패 또는 부분 실패는 전체 rollback된다.

### P0-P1 공개 콘텐츠·데이터 정확성 복구

대상:
- `frontend/privacy.html`, `data-sources.html`, `about.html`, `contact.html`
- 공개 calculator guide 페이지 7개
- `frontend/assets/js/medical_statistics.js`
- `scripts/build-medical-statistics.ps1`
- `frontend/index.html`

근거:
- sitemap에 노출된 공개 페이지 11개에 한글·태그 손상이 있다.
- `medical_statistics.js`에 다량의 replacement character가 있고 정상 `외래/입원` key가 없어 통계 lookup 신뢰성이 낮다.
- `병원 예상 총 청구 금액` label에 환자 부담 변수 `patientTotalPay`가 연결돼 의미가 다르다.

작업:
- 정상 이력이 있는 커밋을 참고하되 전체 revert 없이 페이지별로 한글과 HTML을 복구한다.
- 원본 인코딩을 판별해 통계 asset을 재생성하고 출처일·행 수·checksum을 기록한다.
- 결과 label과 계산 변수를 일치시키고 fallback 사용 여부·출처·기준일을 표시한다.
- 입력 전과 결과 옆에 `의료 판단 아님`, `보험금 확정 아님`, `응급 증상은 진료 우선`을 표시한다.

완료 기준:
- 공개 페이지의 replacement character와 깨진 tag가 0건이다.
- 유효한 JSON-LD, 내부 link, sitemap page integrity test가 통과한다.
- 통계 asset에 정상 외래·입원 key와 대표 fixture가 존재한다.
- 금액 label과 실제 변수 의미가 일치한다.

### P0-A1 관리자 통계 정확성

대상:
- `functions/api/admin/search-stats.ts`
- `frontend/admin-search.html`

작업:
- KPI 전체 집계와 상위 목록 `LIMIT 50`을 분리한다.
- `오늘`은 KST 자정 기준, `24시간`은 rolling window, `3/7/30/90일`은 각각 rolling window로 명시한다.
- API가 `period`, `from`, `to`, `timezone`을 반환한다.
- 무결과 횟수·전체 검색수·비율·최근 시각·입력 page·후보 상태를 한 row에서 제공한다.
- 무결과 우선순위는 5회 이상 높음, 2회 이상 중간, 1회 낮음, 넓은 단어 보류로 계산한다.

완료 기준:
- 검색어 종류가 50개를 넘어도 KPI가 원본 SQL aggregate와 일치한다.
- 오늘/24시간/3/7/30/90일 경계가 KST 기준 test를 통과한다.
- `긴급 확인`은 화면에 보이는 일부 row가 아니라 전체 대상 수를 표시한다.

### P0-A2 검색 후보 생명주기

대상:
- `database/schema.sql` 및 신규 migration
- `functions/api/admin/search-candidates.ts`
- `frontend/admin-search.html`

작업:
- 기존 후보 ID를 update하고 상태 변경마다 새 row를 insert하지 않는다.
- `memo`, `priority`, `action_type`, `target_item_id`, `official_hira_code`, `version`, `completed_at`을 저장한다.
- 완료에는 target code와 배포 후 검색 성공 증거가 필요하고, 보류에는 사유가 필요하다.
- optimistic concurrency 또는 version 비교로 동시 수정 충돌을 막는다.

완료 기준:
- 새로고침 후 memo·상태·연결 code가 유지된다.
- 허용되지 않은 상태 전환, 중복 후보, 완료 조건 누락은 거부된다.
- 모든 전환 이력을 actor 기준으로 재구성할 수 있다.

### P0-A3 관리자 키보드·표 접근성

작업:
- 클릭 전용 `<tr>` 대신 실제 button을 사용한다.
- table `caption`, header `scope`, period `aria-pressed`, status `aria-live`를 적용한다.
- 저장·오류 후 focus를 보존하고 mobile table wrapper를 keyboard로 접근 가능하게 한다.

완료 기준:
- mouse 없이 기간 선택, row 선택, 후보 저장, 상태 확인이 가능하다.
- 200% 확대와 375/768/1280px에서 기능 손실이 없다.

## P1: 핵심 사용성·운영 고도화

### 공개 랜딩·계산기

1. 병원 등급, 진료 형태, 지역의 3개 필수 선택을 기본 흐름으로 둔다.
2. 상병코드, 치료 항목, 보험은 고급 옵션으로 단계 노출한다.
3. `idle/loading/ready/success/partial/error` 상태를 명시하고 초기 `0원`, `alert`, console-only error를 제거한다.
4. 검색·초기화·renderer를 하나씩만 남기고 중복 전역 함수와 다중 `DOMContentLoaded` override를 제거한다.
5. 상병 DB와 통계 asset을 선택 기능 진입 시 lazy-load한다.
6. `fieldset/legend`, label, tab state, `aria-live`, 결과 focus 이동, 44px touch target, reduced-motion을 적용한다.

완료 기준:
- 첫 사용자가 3회 선택과 결과보기로 기본 견적에 도달한다.
- 동일 click/Enter에 검색·로그·계산이 한 번만 실행된다.
- 중복 전역 search 함수 0개, DOM ready 초기화 1개다.
- 기본 계산은 선택 데이터 load 실패와 무관하게 동작한다.

### 관리자 운영

1. 자유 텍스트 item ID 대신 HIRA/내부 항목 검색·선택을 제공한다.
2. 여러 무결과 표현을 한 후보의 alias로 묶고 배포된 `keywords` 반영을 검증한다.
3. 현재 period/filter/status를 그대로 반영하는 안전한 CSV export를 제공한다.
4. CSV formula injection을 막고 민감 원본 field는 기본 export에서 제외한다.
5. 개인별 관리자 신원과 생성·수정·완료·보류·삭제·export audit trail을 제공한다.

완료 기준:
- alias 추가 전 0건, 배포 후 지정 항목 1건 이상을 반환하는 회귀 test가 있다.
- 화면 aggregate와 CSV aggregate가 일치하고 한글·쉼표·줄바꿈·수식 문자가 안전하다.

## P2: 유지보수·효과 측정

1. 후보 완료 전후 동일 기간의 검색수, 무결과율, 클릭률을 비교한다.
2. 11개 공개 페이지를 단일 콘텐츠 원본과 정적 template으로 생성한다.
3. 데이터 생성 CI에 encoding, source date, row count, checksum, representative code match gate를 둔다.
4. KCD 외부 source에 schema·code regex·source hash·대량 변경 threshold를 적용한다.
5. 정확성·개인정보·접근성 P0/P1 완료 후 landing visual redesign을 별도 승인한다.

## 구현 순서

1. 승인 게이트 확정.
2. P0 보안 경계와 전체 삭제 차단.
3. 공개 콘텐츠·통계 asset·금액 의미 복구.
4. admin KPI와 후보 schema migration.
5. admin 운영 화면 단일화와 접근성.
6. consent·retention·audit 자동화.
7. P1 alias/HIRA, CSV, public flow 단순화, JS 중복 제거.
8. P2 효과 추적과 데이터 CI.
9. 브라우저 차단 해제 후 실제 screenshot, responsive, keyboard, screen reader, Network, E2E 검증.

## 승인 후 작업 방식

- 보안 수정과 제품 기능을 별도 branch/PR로 나눈다.
- 각 단계는 RED test -> 최소 구현 -> regression/QA -> review 순서로 진행한다.
- 공개 페이지의 AdSense는 유지하되 consent와 CSP 정책 안에서 로드한다.
- 관리자 페이지에는 광고·GA script를 넣지 않는다.
- DB migration 전 backup과 rollback plan을 먼저 검증한다.
- 사용자 승인 없이 이 문서의 기능 변경을 시작하지 않는다.
