# 검색 로그 설정

## 목표

Cloudflare Pages Functions와 D1로 내부 검색어를 저장한다.

저장 대상:

- 검색 버튼 또는 엔터로 실행한 검색어
- 검색 결과 수
- 검색 결과에서 실제 클릭한 항목
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
npx wrangler d1 execute search-analytics-db --remote --file=./schema.sql
```

로컬 개발용:

```powershell
npx wrangler d1 execute search-analytics-db --local --file=./schema.sql
```

로컬 실행:

```powershell
npx wrangler pages dev . --d1 DB=search-analytics-db
```

## 3. 관리자 통계 페이지

관리자 통계 페이지는 토큰 없이 조회한다. 대신 검색엔진에 노출되지 않도록 `noindex`와 `robots.txt` 차단을 적용한다.

공개 링크로 노출하지 말고 운영자만 직접 주소를 보관한다.

## 4. Pages Functions 배포 확인

배포 후 아래 API가 생성된다.

```text
POST /api/search-log
POST /api/search-click
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
- 검색 로그 저장 실패는 사용자 검색 기능을 막지 않는다.
- 입력 중 실시간 검색어는 저장하지 않고, 검색 버튼 또는 엔터 실행 검색어만 저장한다.
