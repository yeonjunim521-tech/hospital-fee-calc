# MEDICost 백엔드 준비 메모

이 폴더는 차후 실시간 데이터베이스를 붙이기 위한 최소 백엔드 골격입니다.

## 실행

```powershell
cd backend
npm start
```

기본 주소는 `http://localhost:8787`입니다. 이 서버로 접속하면 정적 계산기 화면과 API를 같은 출처에서 함께 제공합니다.

## 현재 API

- `GET /api/health`
- `GET /api/nonbenefit/region-prices`
- `GET /api/nonbenefit/code-map`
- `GET /api/nonbenefit/regions`

## 향후 데이터베이스 전환 방식

현재는 프로젝트 루트의 JSON 파일을 읽어 응답합니다. 실시간 데이터베이스를 붙일 때는 `server.js`의 `readJsonFile` 호출부를 데이터베이스 조회 함수로 교체하고, 응답 형태만 유지하면 프론트 계산 로직은 그대로 사용할 수 있습니다.

필수 응답 형태:

```json
{
  "source": "데이터 출처",
  "fetchedAt": "2026-05-23",
  "items": {
    "공식비급여코드": {
      "name": "항목명",
      "effectiveFrom": "적용시작일",
      "regions": {
        "지역코드": {
          "name": "지역명",
          "min": 0,
          "max": 0,
          "avg": 0,
          "median": 0
        }
      }
    }
  }
}
```
