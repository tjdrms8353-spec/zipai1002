# ZipAI backend workspace

이 디렉터리는 경량 Node.js API와 Python AI/OCR 보조 서비스를 관리합니다.

- 루트의 `*-api.js`, `auth.js`, `database.js`: 현재 `server.js`가 직접 사용하는 Node.js API
- `node/`: 기존 API를 계층형 구조로 점진적으로 분리하기 위한 확장 영역
- `ai-service/`: OCR 및 라이프스타일 추천을 담당할 독립 Python 서비스 골격

운영용 Spring Boot 애플리케이션은 프로젝트 표준에 따라 `src/main` 아래에 위치합니다.

Spring Boot에 구현된 카카오 회원가입·로그인의 상세 흐름과 설정 방법은 [`docs/kakao-login.md`](../docs/kakao-login.md)를 참고하세요.

카카오 로그인은 `SocialLoginController`와 `SocialLoginService`가 담당합니다. `/api/auth/oauth/kakao/start`에서 카카오 인증 화면으로 이동하고 `/api/auth/oauth/kakao/callback`에서 인가 코드 교환, 사용자 조회, 최초 자동 가입 또는 기존 계정 연결, ZipAI 세션 생성을 처리합니다. 연결 정보는 운영 Spring Boot DB의 `oauth_identities` 테이블에 저장하며 카카오 비밀번호와 공급자 토큰은 저장하지 않습니다.

실행 환경에는 `PUBLIC_BASE_URL`, `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`이 필요합니다. 로컬에서는 `ZipAI-Kakao-Setup.bat`, Render에서는 서비스의 Environment 화면을 사용합니다. 설정 후 `/api/auth/oauth/providers`의 `kakao` 값으로 활성화 상태를 확인합니다.

