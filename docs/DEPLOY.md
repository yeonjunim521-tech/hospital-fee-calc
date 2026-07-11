# Cloudflare Pages 배포 메모

## 현재 구조

- 프론트엔드(frontend, 화면 파일): `frontend/`
- 백엔드(backend, API 서버): `backend/`
- Cloudflare Pages Functions(API 함수): `functions/`
- D1 schema(데이터베이스 구조): `database/schema.sql`
- 원본 공공데이터 CSV: `data/raw/`

## Cloudflare Pages 설정

- repository(저장소): `yeonjunim521-tech/hospital-fee-calc`
- project(프로젝트): `hospital-fee-calc`
- branch(브랜치): `main`
- build command(빌드 명령): 비움
- build output directory(빌드 출력 폴더): `frontend`

`wrangler.toml`도 `pages_build_output_dir = "frontend"`로 맞춰야 한다.

## 색인 요청

검색엔진에는 sitemap 자체만 색인 요청하는 것이 아니라 sitemap 제출 후 주요 페이지 URL을 색인 요청한다.

- sitemap 제출: `https://hospital-fee-calc.pages.dev/sitemap.xml`
- 주요 URL 색인 요청: 메인, 병원비, 응급실, MRI, CT, 입원비, 비급여, 데이터 출처 페이지

## D1 적용

```powershell
npx wrangler d1 execute search-analytics-db --remote --file=./database/schema.sql
```

`telemetry_rate_limits`를 포함한 최신 schema가 적용됐는지 확인한 뒤 Pages를 배포한다. schema 적용은 Pages 배포와 별개다.

## 관리자 보안 설정

Cloudflare Pages secret에 `ADMIN_BASIC_AUTH`를 `사용자이름:비밀번호` 형식으로 등록한다. 실제 값은 저장소·문서·로그에 남기지 않는다.

```powershell
npx wrangler pages secret put ADMIN_BASIC_AUTH
```

관리자 POST API는 같은 출처의 Origin 헤더만 허용한다. 브라우저 밖의 관리 도구는 이 보호 경로를 직접 호출하지 않는다.
