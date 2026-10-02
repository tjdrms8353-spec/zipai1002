# 홈픽부동산 Footer 작업 문서

## 파일 구조

```text
footer.html
static/
├─ css/
│  ├─ common.css
│  └─ footer.css
└─ images/
   └─ favicon.svg
```

## 구현 내용

- 홈픽부동산 브랜드 CTA, 회사 정보, 사이트맵, 고객센터, 정책 링크, SNS 영역 구성
- 실제 공공 부동산 서비스 5개를 패밀리사이트로 연결
  - 국토교통부 실거래가 공개시스템
  - 대한민국 법원 인터넷등기소
  - HUG 안심전세포털
  - LH 청약플러스
  - 마이홈포털
- 우측 하단 TOP 버튼 및 CSS `scroll-behavior` 적용
- SVG 파비콘 추가
- Font Awesome 6.7.2 CDN 아이콘 사용
- Google Fonts CDN으로 제목용 `IBM Plex Sans KR`, 본문용 `Noto Sans KR` 사용

## 디자인 토큰

`static/css/common.css`에 공통 변수를 정의했다.

- Primary: `#2468e8`
- Navy: `#13284c`
- Sky: `#edf4ff`
- Heading: `IBM Plex Sans KR`
- Body: `Noto Sans KR`

## 반응형 기준

Bootstrap 5 중단점을 그대로 사용했다.

| 구분 | 너비 | 컨테이너 |
|---|---:|---:|
| sm | 576px | 540px |
| md | 768px | 720px |
| lg | 992px | 960px |
| xl | 1200px | 1140px |
| xxl | 1400px | 1320px |

- `767.98px` 이하에서는 사이트맵을 숨긴다.
- 모바일에서는 브랜드, 고객센터, 패밀리사이트 및 회사 정보를 중앙 정렬한다.
- md에서는 패밀리사이트 영역을 전체 폭으로 배치하고 lg부터 3열 레이아웃으로 복귀한다.

## 적용 방법

다른 페이지에 적용할 때 `footer.html`의 `<footer class="homepick-footer">...</footer>`와 TOP 버튼을 옮기고, `<head>`에 다음 리소스를 연결한다.

1. Google Fonts CDN
2. Font Awesome CDN
3. `static/css/footer.css`
4. `static/images/favicon.svg`

`footer.css`에서 `common.css`를 `@import`하므로 페이지에서 `common.css`를 중복 연결할 필요는 없다.

## 실제 운영 전 교체 항목

아래 항목은 회사의 확정 정보로 교체해야 한다.

- 대표자명
- 사업자등록번호
- 통신판매업 신고번호
- 사업장 주소
- 고객센터 연락처와 운영시간
- 이메일, SNS, 약관 링크
