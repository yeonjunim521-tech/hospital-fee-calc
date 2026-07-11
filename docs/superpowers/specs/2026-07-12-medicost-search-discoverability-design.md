# MEDICost 검색 발견성 설계

## 목표

`https://hospital-fee-calc.pages.dev/`를 공식 주소로 유지하면서 Google, Naver, Bing과 AI 검색이 공개 계산 안내 페이지를 정확히 수집하고 해석할 수 있게 한다. 서비스는 무료로 유지하며 광고는 계산 흐름을 방해하지 않는 정보 페이지에만 배치할 수 있는 자리를 마련한다.

검색 순위, 색인 시점, AI 답변의 인용은 외부 서비스의 판단이므로 보장 대상이 아니다.

## 현재 문제

- 7개 공개 계산 안내 페이지의 한글 제목, 설명, 본문, 일부 JSON-LD가 깨져 있다.
- `llms.txt`와 `DESIGN.md`에도 한글 인코딩 손상이 있어 AI 크롤러와 유지보수자가 내용을 신뢰성 있게 읽기 어렵다.
- sitemap의 `lastmod`가 실제 변경일과 맞지 않는다.

## 범위

### 공개 계산 안내 페이지

대상은 다음 7개 파일이다.

- `frontend/hospital-cost-calculator.html`
- `frontend/er-cost-calculator.html`
- `frontend/mri-cost-calculator.html`
- `frontend/ct-cost-calculator.html`
- `frontend/endoscopy-cost-calculator.html`
- `frontend/hospitalization-cost-calculator.html`
- `frontend/noncovered-medical-cost.html`

각 페이지는 고유한 한국어 `title`, meta description, H1, 도입문, 핵심 안내, FAQ를 가진다. 모든 문구는 실제 계산기와 공개 데이터 범위를 넘지 않으며, 진단·치료 조언이나 실제 청구금액 확정 표현을 사용하지 않는다.

### 구조화 데이터와 GEO

- 페이지에 보이는 내용과 동일한 `WebPage` JSON-LD를 둔다.
- 실제 FAQ가 있는 페이지에만 `FAQPage` JSON-LD를 둔다.
- JSON-LD에는 계산기 페이지 주소, 무료 이용, 데이터 한계, 참조용 예상 범위라는 성격을 사실대로 반영한다.
- `frontend/llms.txt`를 정상 UTF-8 한국어로 복구하고, 공개 URL·데이터 출처·서비스 한계를 짧고 명확하게 제공한다.
- AI 검색을 조작하는 문구, 숨김 키워드, 자동 대량 생성 콘텐츠는 추가하지 않는다.

### 크롤링과 대표 주소

- `frontend/robots.txt`는 공개 페이지 수집 허용과 관리자 경로 차단을 유지한다.
- `frontend/sitemap.xml`에는 대표 URL만 두고 실제 수정일만 `lastmod`에 반영한다.
- 안내 페이지와 메인 계산기 사이의 내부 링크를 유지·보강해 사용자가 바로 계산기로 이동할 수 있게 한다.
- Bing 및 IndexNow 제출에 필요한 정적 키 파일과 제출 대상 URL 목록을 준비한다. 실제 외부 제출은 배포 후 소유자 계정에서 수행한다.

### 광고 준비

- 계산 입력과 결과 확인 전후에는 광고 슬롯을 추가하지 않는다.
- 안내 페이지에서 문맥을 해치지 않는 본문 중간과 하단에만 광고용 컨테이너를 둔다.
- 실제 광고 네트워크 설정, 광고 코드 연결, 사용자 동의 정책 변경은 이 작업 범위에서 제외한다.

## 구현 경계

- 계산 공식, 의료 데이터, API, D1 스키마, 관리자 기능은 변경하지 않는다.
- 사용자 작업 중인 개인정보·텔레메트리 변경을 수정하거나 되돌리지 않는다.
- 새 의료 콘텐츠 페이지를 대량 생성하지 않는다.
- 현재 `pages.dev` 주소를 canonical과 sitemap의 유일한 기준으로 사용한다.

## 검증

1. 모든 대상 HTML 파일의 UTF-8 한글 title, description, H1, canonical, robots 메타를 확인한다.
2. JSON-LD가 유효 JSON이며 화면 텍스트와 모순되지 않는지 검사한다.
3. sitemap의 URL이 공개 canonical과 일치하는지 검사한다.
4. 자동 테스트를 실행한다.
5. 실제 Chrome에서 데스크톱과 모바일 화면으로 안내 페이지에서 계산기로 이동하는 흐름을 확인한다.

## 배포 후 운영 체크리스트

- Google Search Console에 sitemap을 제출하고 URL 검사 요청을 한다.
- Naver Search Advisor에 사이트를 등록하고 robots/sitemap 수집을 요청한다.
- Bing Webmaster Tools에 sitemap을 제출하고 IndexNow 키를 등록한 뒤 변경 URL을 제출한다.
- 광고 네트워크 승인 전 개인정보처리방침, 동의 흐름, 광고 정책을 별도 검토한다.
