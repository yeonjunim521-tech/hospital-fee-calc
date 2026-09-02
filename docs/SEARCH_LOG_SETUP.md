# 검색 로그 설정

## 목표

Cloudflare Pages Functions와 D1로 내부 검색어를 저장한다.

저장 대상:

- 검색 버튼 또는 엔터로 실행한 검색어
- 검색 결과 수
- 결과 없는 검색어

## 1. D1 데이터베이스 생성

Cloudflare 대시보드 또는 Wrangler로 D1 데이터베이스를 만든다.

```powershell
npx wrangler d1 create search-analytics-db
```

생성 후 출력되는 `database_id`를 `wrangler.toml`의 `database_id`에 넣는다.

## 2. 스키마 적용

원격 D1에 테이블을 만든다.

```powershell
npx wrangler d1 execute search-analytics-db --remote --file=./database/schema.sql
```

로컬 개발용:

```powershell
npx wrangler d1 execute search-analytics-db --local --file=./database/schema.sql
```

로컬 실행:

```powershell
npx wrangler pages dev . --d1 DB=search-analytics-db
```

## 3. 관리자 통계 페이지

관리자 통계 페이지와 `/api/admin/*`는 `ADMIN_BASIC_AUTH` secret(비밀값)으로 보호한다.
Cloudflare Pages 환경 변수에 `사용자이름:비밀번호` 형식의 값을 secret으로 등록한다. 값 자체는 저장소나 문서에 기록하지 않는다.

```powershell
npx wrangler pages secret put ADMIN_BASIC_AUTH
```

같은 출처의 관리자 POST 요청만 허용한다. 외부 자동화 도구는 실제 사이트 Origin 헤더를 명시해야 한다.

## 4. Pages Functions 배포 확인

배포 후 아래 API가 생성된다.

```text
POST /api/search-log
POST /api/visit-log
GET /api/admin/search-stats
```

## 5. 관리자 페이지

배포 후 접속:

```text
https://hospital-fee-calc.pages.dev/admin-search
```

최근 7일, 30일, 90일, 365일 통계를 볼 수 있다.

관리자 페이지는 `robots.txt`와 `noindex`로 검색 노출을 막는다. 단, 주소를 아는 사람은 조회할 수 있으므로 공개 링크로 노출하지 않는다.

## 주의

- 주민등록번호, 전화번호, 이메일 형태 검색어는 API에서 저장하지 않는다.
- 검색·방문 통계에 동의하지 않으면 로그를 전송하지 않으며 `aggregate` 대체 검색어도 만들지 않는다.
- 항목 클릭 로그는 더 이상 새로 수집하지 않는다. 기존 기록은 30일 보존 규칙에 따라 만료된다.
- `telemetry_rate_limits`를 포함한 최신 `database/schema.sql`을 원격 D1에 적용한 뒤 Pages를 배포한다.
- 검색 로그 저장 실패는 사용자 검색 기능을 막지 않는다.
- 입력 중 실시간 검색어는 저장하지 않고, 검색 버튼 또는 엔터 실행 검색어만 저장한다.
