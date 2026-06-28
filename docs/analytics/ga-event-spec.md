# GA4 이벤트 명세

이 문서는 병원/의료비 계산기 앱에서 사용하는 GA4(Google Analytics 4, 구글 애널리틱스 4) 이벤트 정의만 정리한다. 대시보드 UI, 리포트, BigQuery 스키마는 범위 밖이다.

## 범위

- 대상: 검색, 검색 결과 클릭, 계산 완료
- 기준: 현재 코드에 이미 들어간 이벤트 이름
- 원칙: 이벤트는 사용자의 명시적 행동에서만 발생시키고, 자동 반복 전송은 피한다

## 이벤트 목록

### `search`

- 언제 발화: 사용자가 검색을 실행해 결과 목록이 계산되었을 때
- 필수 파라미터:
  - `search_term`: 사용자가 입력한 검색어
  - `result_count`: 매칭된 결과 수
  - `search_scope`: 검색 범위 또는 탭 식별자
- 선택 파라미터:
  - `page_path`: 현재 페이지 경로
- 목적: 어떤 검색어가 실제로 사용되는지, 그리고 검색 결과가 얼마나 잘 나오는지 본다

### `search_no_result`

- 언제 발화: `search` 결과가 0건일 때만 추가로 발화
- 필수 파라미터:
  - `search_term`: 사용자가 입력한 검색어
  - `search_scope`: 검색 범위 또는 탭 식별자
- 선택 파라미터:
  - `page_path`: 현재 페이지 경로
- 목적: 사용자가 원하는 항목을 못 찾는 검색어를 따로 모아 개선 우선순위를 잡는다

### `search_result_click`

- 언제 발화: 검색 결과 카드나 항목을 사용자가 클릭했을 때
- 필수 파라미터:
  - `search_term`: 클릭 직전의 검색어
  - `item_code`: 선택한 항목 코드 또는 타입
  - `item_name`: 선택한 항목명
  - `item_group`: 선택한 항목의 분류
- 선택 파라미터:
  - `page_path`: 현재 페이지 경로
- 목적: 검색 후 실제로 어떤 항목이 선택되는지 보고, 검색 품질과 노출 품질을 함께 확인한다

### `calculator_complete`

- 언제 발화: 계산 결과가 최종 확정되었을 때
- 필수 파라미터:
  - `hospital_class`: 병원 유형
  - `treatment_type`: 치료 유형
  - `has_insurance`: 보험 적용 여부(`yes`/`no`)
  - `has_sanjeong`: 산정특례 정보 유무(`yes`/`no`)
  - `selected_tests`: 선택된 검사 수
  - `selected_surgeries`: 선택된 수술 수
  - `selected_procedures`: 선택된 처치 수
  - `final_cost`: 최종 환자 부담금
  - `total_cost`: 총 진료비
  - `refund_cost`: 환급/환불 기준 금액
- 선택 파라미터:
  - `page_path`: 현재 페이지 경로
- 목적: 계산기 사용 완료율과 결과 규모를 보고, 어떤 조건 조합에서 계산이 끝나는지 이해한다

## 권장 사항

- `page_path`는 GA4 기본 값(`page_location`, `page_path`)과 중복될 수 있으니, 장기적으로는 제거를 검토해도 된다.
- `has_sanjeong`는 내부 약어라서, 나중에 코드 정리 시 `has_sanjeong_info`처럼 더 풀어서 쓰는 이름으로 바꾸는 것을 권장한다.
- 숫자 값(`result_count`, `selected_*`, `final_cost`, `total_cost`, `refund_cost`)은 문자열이 아니라 숫자로 보내는 현재 방식이 적절하다.
- 이벤트 이름은 현재 코드와 동일하게 유지하는 것이 좋다. 리네임은 과거 데이터 비교를 깨뜨릴 수 있다.

## 구현 메모

- 현재 코드에 맞는 이벤트명: `search`, `search_no_result`, `search_result_click`, `calculator_complete`
- 이 문서는 스펙 문서만 다루며, 코드 변경은 하지 않는다
