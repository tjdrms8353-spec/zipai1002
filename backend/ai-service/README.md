# ZipAI AI service

등기부등본 OCR과 라이프스타일 기반 매물 추천을 Spring Boot 또는 Node.js API에서 분리해 실행하기 위한 Python 서비스 영역입니다.

- `app/api`: OCR/추천 HTTP 엔드포인트
- `app/core`: 설정, 로깅, 보안 등 공통 기반
- `app/schemas`: 요청/응답 데이터 모델
- `app/services`: OCR 파싱 및 추천 알고리즘
- `tests`: 서비스 단위·통합 테스트

프레임워크와 모델이 확정되면 의존성 파일과 실행 진입점을 추가합니다.

