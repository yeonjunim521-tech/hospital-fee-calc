# MEDICost 개인정보·분석 최소수집 설계

## 상태

- 작업명: 상업 공개 전 개인정보·분석 P0 개선
- 대상 브랜치: `codex/result-insights`
- 승인 방향: 최소수집 + 30일 자동삭제
- 제품 표기: `MEDICost v3.0` 유지

## 목표

계산 기능은 동의 없이 유지하면서, 분석 동의 후에도 원시 검색어·질병명·상세 시술·정확한 금액·User-Agent를 저장하거나 외부 분석 도구로 보내지 않게 한다. 선택 분석 데이터는 30일 뒤 자동 삭제하고, 동의 철회 즉시 이후 분석·광고 전송을 중단한다.

## 범위

1. Google Analytics 이벤트에서 원시 검색어와 항목명을 제거한다.
2. 동의 저장 시 분석·광고 스크립트의 현재 상태를 동의값과 일치시킨다.
3. 자체 telemetry를 검색 결과 수·검색 범위·계산 조건의 비식별 집계값으로 축소한다.
4. 검색·계산 telemetry API에 동일한 IP 기준 시간당 제한과 입력 크기 제한을 적용한다.
5. 검색·클릭·계산 로그를 30일 보관한 뒤 관리자가 실행할 수 있는 purge API로 삭제한다.
6. 개인정보 처리 안내에 실제 처리 항목, 목적, 보유기간, 철회 방법, 운영 문의 경로를 명시한다.

## 제외 범위

- 계산 공식, 의료 데이터, 실손보험 환급 계산 변경
- 기존 결과 해석 카드와 빠른 계산 흐름 변경
- Cloudflare 계정의 실제 secret, WAF, D1 배포·백업 설정 변경
- 법률 자문 또는 의료광고 심의
- 기존 누적 D1 데이터를 자동 변환하는 migration

## 데이터 경계

### 브라우저에서 외부로 보내는 분석 정보

Google Analytics에는 다음만 보낸다.

- `search`: 결과 수, 검색 범위, 현재 경로
- `search_no_result`: 검색 범위, 현재 경로
- `search_result_click`: 항목 그룹, 현재 경로
- `calculation`: 병원 등급, 진료 형태, 지역 코드, 보험 적용 여부, 결과 금액 구간, 현재 경로

원시 검색어, 항목명, 상병명, 산정특례 질환, 상세 시술, 정확한 금액은 보내지 않는다.

### 서버 telemetry 보관 정보

서버는 다음 값만 저장한다.

- 검색: 검색 범위, 결과 수, 현재 경로
- 클릭: 항목 그룹, 현재 경로
- 계산: 병원 등급, 진료 형태, 지역 코드, 입원일 수 구간, 보험 적용 여부, 결과 금액 구간, 현재 경로
- 속도 제한: IP 해시와 시간 창의 요청 수

원시 검색어, User-Agent, 산정특례 질환, 상세 항목 배열, 보험 세대, 정확한 비용은 저장하지 않는다.

## 동의 동작

1. 최초 방문과 필수만 사용 상태에서는 GA, AdSense, 자체 telemetry 요청이 모두 없다.
2. 분석 허용 시에만 GA와 자체 telemetry를 시작한다.
3. 광고 허용 시에만 AdSense를 시작한다.
4. 분석 또는 광고를 철회하면 해당 스크립트 태그를 제거하고 이후 이벤트·telemetry 호출을 막는다.
5. 이미 제3자 스크립트가 전송한 쿠키·요청을 과거로 되돌리지는 못하므로, 철회는 이후 전송 중단으로 안내한다.

## 서버 보호와 보존

- 검색·클릭·계산 API는 `CF-Connecting-IP`를 SHA-256 해시한 키로 시간당 30회까지만 허용한다.
- 각 요청은 허용된 문자열 열거값, 숫자 범위, 200자 이하 경로만 받는다.
- 30일보다 오래된 로그는 인증된 관리자 전용 purge API가 삭제한다.
- purge는 삭제 대상 수를 응답하며, 실제 배포에서는 별도 스케줄러 또는 운영 절차로 매일 실행한다.
- `ADMIN_BASIC_AUTH`와 Cloudflare WAF·스케줄러 설정은 코드 밖 운영 체크리스트로 남긴다.

## 개인정보 안내와 문의

`privacy.html`은 다음을 명시한다.

- 운영 주체 표기와 개인정보·데이터 오류 문의용 이메일 자리
- 처리 목적, 실제 수집 항목, 30일 보유기간, 삭제 방식
- Google Analytics·AdSense의 선택 동의와 철회 후 동작
- 개인 식별정보·진료기록·보험 문서를 입력하지 말아야 한다는 안내

문의 이메일은 아직 확정되지 않았으므로 실제 주소를 임의로 넣지 않는다. 연락처 확정 전에는 `문의 채널 준비 중`으로 표시하고, 개인정보 안내의 최종 공개 전 필수 운영 항목으로 표시한다.

## 변경 파일 경계

- `frontend/assets/js/consent.js`: 동의 철회 시 스크립트와 이벤트 상태 동기화
- `frontend/assets/js/analytics.js`: 동의된 비식별 GA 이벤트만 전송
- `frontend/assets/js/script.js`: telemetry payload와 GA event payload 최소화
- `functions/api/search-log.ts`, `search-click.ts`, `calculation-log.ts`: 비식별 payload·공통 속도 제한
- `database/schema.sql`: 축소된 telemetry schema와 30일 purge 대상 인덱스
- `functions/api/admin/purge-telemetry.ts`: 관리자 전용 보존기간 삭제 endpoint
- `frontend/privacy.html`, `frontend/contact.html`: 실제 처리 안내와 문의 상태
- `tests/api_security_regression.mjs`, `tests/frontend_v3_shell.test.js`, `tests/frontend_v3_browser.test.js`: 동의·payload·속도 제한·화면 회귀

## 검증 기준

1. 분석 거부·철회 상태에서 Google, 광고, `/api/search-log`, `/api/search-click`, `/api/calculation-log` 요청이 없다.
2. GA와 자체 API payload에 `search_term`, 원시 query, User-Agent, 질병명, 상세 항목명, 정확한 금액이 없다.
3. 각 telemetry API는 31번째 동일 IP 요청을 `429`로 거부한다.
4. 30일 초과 fixture는 purge로 삭제되고, 30일 이내 fixture는 유지된다.
5. 기본 계산, 검색, 보험 계산, 결과 해석 카드, 375/768/1280px 화면 회귀가 통과한다.

## 위험과 운영 전제

- 코드만으로 실제 Cloudflare secret, WAF, D1 backup, 스케줄러 설정을 검증할 수 없다.
- 개인정보처리방침의 운영 주체·문의 이메일은 실제 사업자 정보가 확정되어야 최종 공개할 수 있다.
- 30일은 제품 기본값이며 법률 자문을 대체하지 않는다.
