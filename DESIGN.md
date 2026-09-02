# MEDICost v3.0 Design System

## 1. Atmosphere & Identity

차분하고 검증 가능한 공공 의료정보 도구다. 병원비를 확정한다고 과장하지 않고, 사용자가 공개자료의 범위와 한계를 이해한 뒤 예상 금액을 확인하도록 돕는다. 시그니처는 종이 영수증을 닮은 결과 패널과 옅은 민트빛 데이터 상태선이다.

## 2. Color

| 역할 | 토큰 | 값 | 사용 |
|---|---|---|---|
| 배경 | `--surface-page` | `#f4f8f7` | 전체 배경 |
| 기본 표면 | `--surface-primary` | `#ffffff` | 카드·입력 |
| 보조 표면 | `--surface-secondary` | `#eaf3f1` | 안내·선택 요약 |
| 강조 표면 | `--surface-accent` | `#dff3ee` | 결과·데이터 상태 |
| 진한 표면 | `--surface-strong` | `#0f3d36` | 결과 헤더·CTA |
| 기본 글자 | `--text-primary` | `#17312d` | 제목·본문 |
| 보조 글자 | `--text-secondary` | `#526b66` | 설명 |
| 약한 글자 | `--text-tertiary` | `#71847f` | 메타데이터 |
| 기본 경계 | `--border-default` | `#cfded9` | 카드·입력 |
| 약한 경계 | `--border-subtle` | `#e2ece9` | 구분선 |
| 주 강조 | `--accent-primary` | `#087a68` | 버튼·링크·포커스 |
| 강조 hover | `--accent-hover` | `#056354` | hover |
| 정보 | `--status-info` | `#176b87` | 데이터 안내 |
| 성공 | `--status-success` | `#18794e` | 완료·선택 |
| 경고 | `--status-warning` | `#9a5b00` | 주의 |
| 오류 | `--status-error` | `#b42318` | 입력 오류 |

- 강조색은 상호작용과 상태 전달에만 사용한다.
- 텍스트 대비는 WCAG 2.2 AA를 충족한다.
- 새 색이 필요하면 먼저 이 표에 의미를 정의한다.

## 3. Typography

- 본문: `Noto Sans KR`, `Malgun Gothic`, sans-serif.
- 숫자: `Outfit`, `Noto Sans KR`, sans-serif. 금액에는 tabular numbers를 적용한다.

| 단계 | 크기 | 굵기 | 행간 | 사용 |
|---|---:|---:|---:|---|
| Display | `clamp(2.25rem, 5vw, 4.5rem)` | 800 | 1.08 | Hero |
| H1 | `clamp(1.75rem, 3vw, 2.75rem)` | 800 | 1.2 | 페이지 제목 |
| H2 | `clamp(1.35rem, 2vw, 2rem)` | 700 | 1.3 | 섹션 제목 |
| H3 | `1.125rem` | 700 | 1.4 | 카드 제목 |
| Body/lg | `1.125rem` | 400 | 1.7 | 주요 설명 |
| Body | `1rem` | 400 | 1.65 | 기본 본문 |
| Body/sm | `0.875rem` | 400 | 1.55 | 도움말 |
| Caption | `0.75rem` | 600 | 1.45 | 상태·메타 |

## 4. Spacing & Layout

- 기본 단위는 4px이다.
- 토큰: `--space-1` 4px, `--space-2` 8px, `--space-3` 12px, `--space-4` 16px, `--space-5` 20px, `--space-6` 24px, `--space-8` 32px, `--space-10` 40px, `--space-12` 48px, `--space-16` 64px, `--space-20` 80px, `--space-24` 96px.
- 최대 폭은 1200px, 모바일 좌우 여백은 16px이다.
- 핵심 breakpoint는 768px과 1024px이다. 계산기 광고 배치는 1280px에서 PC 레일로 전환한다.
- 페이지 자체의 가로 스크롤은 허용하지 않는다. 표와 긴 데이터 목록만 내부 스크롤을 사용한다.
- 계산기 셸은 `fixed-sidenav-shell` + `list-detail`이다. 광고 레일은 `auto` 열, 입력·결과 작업면은 항상 `minmax(0, 1fr)` 작업 그리드다.
- 숨긴 광고는 named grid area 밖에 있으므로 입력 카드가 광고 열로 들어가지 않는다. 1280px 이상에서 입력·결과 2열은 남은 폭 전체를 쓴다. 빈 AdFit 칸은 iframe이 없으면 접는다.

## 5. Components

### Header

- 로고, 현재 페이지 링크, 계산 CTA로 구성한다.
- 모바일에서는 메뉴가 자연스럽게 줄바꿈되며 별도 숨김 메뉴를 만들지 않는다.
- 링크는 hover, focus-visible, active 상태를 갖는다.

### Receipt preview and result

- Hero 미리보기와 실제 결과가 동일한 영수증 문법을 사용한다.
- 로딩 전에는 가짜 금액을 표시하지 않고 “선택 후 표시”라고 쓴다.
- 실제 결과는 환자 실부담, 예상 범위, 환급 전 부담, 종별가산을 계층화한다.
- 결과 해석은 상위 비용 항목 3개와 공개자료·보험 반영 기준만 짧게 설명하며, 계산 공식이나 의료 판단을 추가하지 않는다.

### Stepper

- 3단계: 필수 조건, 선택 조건, 보험·결과 확인.
- 현재 단계는 `aria-current="step"`, 상태 변경은 `aria-live`로 알린다.
- 이전/다음 이동은 입력 상태를 보존하며 누락 시 첫 필드로 focus를 이동한다.

### Selection tile

- radio/checkbox 자체가 실제 접근성 입력이며 타일은 label이다.
- default, hover, checked, focus-visible, disabled 상태를 제공한다.
- 최소 터치 영역은 44px이다.

### Search combobox

- 입력, 지우기, 검색, 결과 목록, 빈 결과, 오류 상태를 포함한다.
- 기존 DOM ID와 검색 로직을 유지한다.

### Consent panel

- 모두 허용, 필수만, 설정을 제공한다.
- 분석과 광고는 각각 독립적으로 끌 수 있고 기본값은 false다.
- 푸터에서 언제든 다시 열 수 있다.

### Monetization strip

- 홈의 계산 입력·결과 밖 안내 영역에만 AdFit과 쿠팡 배너를 둔다.
- 광고 슬롯은 점선 장식이 아니라 기존 표면색과 경계선으로 구분한다.
- 375px에서 세로로 쌓이고, 본문 가로 스크롤을 만들지 않는다.
- 1280px 초과에서는 왼쪽 AdFit 160×600과 오른쪽 쿠팡 120×400을 사용한다.
- 769~1280px에서는 쿠팡 680×140, 768px 이하에서는 쿠팡 250×250을 계산기 아래에 사용하며 숨겨진 쿠팡 위젯은 호출하지 않는다.
- 쿠팡 스크립트가 차단되거나 광고가 없으면 확인된 제휴 링크를 fallback(대체 링크)으로 표시한다.

### Notice and support panel

- 정보·경고·오류 상태는 아이콘뿐 아니라 문구와 색으로 함께 구분한다.

## 6. Motion & Interaction

- micro 120ms ease-out, standard 220ms ease-in-out를 사용한다.
- motion은 버튼 누름, 단계 전환, 패널 열림처럼 상태 변화에만 사용한다.
- `transform`, `opacity`만 애니메이션한다.
- `prefers-reduced-motion: reduce`에서는 부드러운 스크롤과 비필수 전환을 제거한다.

## 7. Depth & Surface

- 전략: mixed.
- 대부분의 구조는 옅은 표면색과 경계선으로 구분한다.
- 결과 영수증, 검색 결과, 동의 설정처럼 실제로 떠 있는 요소만 녹색 계열 그림자를 사용한다.
- 동일 계층의 카드에 과도한 그림자를 반복하지 않는다.

## 8. Accessibility Constraints & Accepted Debt

### Constraints

- WCAG 2.2 AA, 본문 대비 4.5:1, 큰 글자 3:1.
- 모든 입력에 label, 모든 상호작용에 visible focus, 모든 동적 상태에 적절한 live region을 제공한다.
- 200% 확대와 375px 폭에서 기능 손실이 없어야 한다.
- 키보드만으로 계산·검색·동의 변경을 완료할 수 있어야 한다.
- 실제 청구액 확정이나 의료 판단으로 오해되는 문구를 사용하지 않는다.

### Inclusive personas

- 모바일에서 급히 비용 범위를 확인하는 초행 사용자.
- 저시력으로 200% 확대와 높은 텍스트 가독성이 필요한 사용자.
- 마우스 없이 키보드로 단계형 폼을 이용하는 사용자.
- 의료 용어에 익숙하지 않아 단계와 오류 복구가 명확해야 하는 사용자.

### Accepted Debt

| 항목 | 위치 | 이유 | 종료 조건 |
|---|---|---|---|
| 비용별 SEO 페이지의 구형 디자인 | 메인 외 계산 안내 페이지 | v3.0 1차 범위에서 제외 | 후속 공개 페이지 통합 작업 |
| 기존 계산 스크립트의 전역 함수 | `frontend/assets/js/script.js` | DOM ID와 계산 계약 보존이 우선 | 별도 로직 모듈화 작업 |
