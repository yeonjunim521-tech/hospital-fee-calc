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

## 3. Cloudflare Pages 환경변수 설정

Cloudflare Pages 프로젝트 설정에서 환경변수를 추가한다.

```text
ADMIN_TOKEN=관리자_비밀_토큰
```

`wrangler.toml`에는 관리자 토큰을 넣지 않는다.

이번 작업에서 생성한 후보 토큰:

```text
SN0XVlNuNSMBlpAnMNa2vLTUZXC9qKieomXg2YfaHN8
```

배포 후 `/admin-search`에서 이 값을 입력해 통계를 조회한다. 필요하면 Cloudflare Pages 환경변수에서 언제든 새 값으로 교체한다.

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

관리자 토큰 입력 후 최근 7일, 30일, 90일, 365일 통계를 볼 수 있다.

관리자 페이지는 `robots.txt`와 `noindex`로 검색 노출을 막는다. 보안은 API의 `ADMIN_TOKEN` 인증이 담당한다.

## 주의

- 주민등록번호, 전화번호, 이메일 형태 검색어는 API에서 저장하지 않는다.
- 검색 로그 저장 실패는 사용자 검색 기능을 막지 않는다.
- 입력 중 실시간 검색어는 저장하지 않고, 검색 버튼 또는 엔터 실행 검색어만 저장한다.
