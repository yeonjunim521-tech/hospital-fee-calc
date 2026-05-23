# 클라우드플레어 페이지 배포 순서

## 목표

빠른 정적 웹앱 배포와 검색 노출 준비.

## 클라우드플레어 설정값

- 서비스: 클라우드플레어 페이지
- 저장소: `yeonjunim521-tech/hospital-fee-calc`
- 프로젝트명: `hospital-fee-calc`
- 배포 브랜치: `main`
- 프레임워크: 없음
- 빌드 명령: 비움
- 빌드 출력 폴더: `/`
- 루트 폴더: `/`

## 배포 후 확인할 주소

예상 주소:

```text
https://hospital-fee-calc.pages.dev/
```

실제 주소가 다르면 아래 파일의 주소를 실제 주소로 교체해야 한다.

- `index.html`
- `robots.txt`
- `sitemap.xml`
- `hospital-cost-calculator.html`
- `er-cost-calculator.html`
- `about.html`
- `privacy.html`
- `contact.html`

## 검색 등록 순서

1. 구글 서치 콘솔에 사이트 등록
2. 네이버 서치어드바이저에 사이트 등록
3. `https://hospital-fee-calc.pages.dev/sitemap.xml` 제출
4. 메인 페이지 색인 요청
5. 랜딩 페이지 색인 요청

## 광고 준비

애드센스 또는 카카오 애드핏 승인 후 `ads.txt`를 실제 광고 계정 값으로 교체한다.
