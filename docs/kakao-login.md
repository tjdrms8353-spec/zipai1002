# ZipAI 카카오 회원가입·로그인 구현 및 설정 안내

- 문서 작성일: 2026-09-29
- 적용 애플리케이션: Spring Boot 3.5.4 / Java 21 / Gradle
- 인증 방식: OAuth 2.0 Authorization Code 방식의 REST API 로그인

## 1. 구현 목적과 현재 동작

ZipAI의 카카오 기능은 회원가입과 로그인을 별도 버튼으로 나누지 않습니다. 사용자가 `카카오로 계속하기`를 누르면 카카오가 사용자를 인증하고, ZipAI는 전달받은 카카오 고유 사용자 번호를 기준으로 다음과 같이 처리합니다.

1. 처음 방문한 카카오 계정이면 ZipAI 회원과 소셜 연결 정보를 자동 생성합니다.
2. 이전에 연결된 카카오 계정이면 기존 ZipAI 회원으로 로그인합니다.
3. 카카오가 검증한 이메일이 기존 활성 ZipAI 회원과 일치하면 새 회원을 만들지 않고 해당 회원에 카카오 로그인 수단을 연결합니다.
4. 이메일 제공 동의를 받지 못한 경우에도 카카오 고유 사용자 번호를 기반으로 내부 전용 이메일을 만들어 계정을 생성합니다.

실제 인증은 카카오 화면에서 처리되며 ZipAI는 카카오 비밀번호를 받거나 저장하지 않습니다. 실제 로그인 완료 테스트에는 실제 카카오계정이 필요합니다.

## 2. 전체 처리 흐름

```text
로그인 화면의 카카오 버튼 클릭
→ GET /api/auth/oauth/kakao/start
→ 서버가 무작위 state를 세션에 저장
→ 카카오 인증·동의 화면으로 HTTP 302 이동
→ 사용자가 실제 카카오계정으로 로그인하고 동의
→ GET /api/auth/oauth/kakao/callback?code=...&state=...
→ 서버가 세션의 state와 콜백 state 비교
→ 인가 코드를 카카오 액세스 토큰으로 교환
→ 카카오 /v2/user/me에서 고유 ID·이메일·닉네임 조회
→ 신규 회원 생성 또는 기존 회원·소셜 계정 연결
→ ZipAI 로그인 세션 생성
→ /index.html?socialLogin=kakao 로 이동
```

## 3. 관련 코드와 역할

| 파일 | 역할 |
| --- | --- |
| `templates/member/login.html` | `카카오로 계속하기` 버튼 제공 |
| `templates/member/signup.html` | 카카오 방식으로 가입을 시작하는 버튼 제공 |
| `static/js/login.js` | 공급자 활성화 상태를 조회하고 미설정 버튼 비활성화 |
| `src/main/java/com/zipai/web/SocialLoginController.java` | 시작·콜백·공급자 상태 API 제공 |
| `src/main/java/com/zipai/service/SocialLoginService.java` | 인가 URL 생성, 토큰 교환, 사용자 정보 조회, 회원 생성·연결 |
| `src/main/java/com/zipai/domain/OAuthIdentity.java` | 카카오 고유 ID와 ZipAI 회원의 연결 정보 정의 |
| `src/main/java/com/zipai/repository/OAuthIdentityRepository.java` | 공급자와 고유 ID로 연결 계정 조회 |
| `src/main/resources/db/migration/V6__oauth_identities.sql` | 운영 MySQL의 소셜 계정 연결 테이블 생성 |
| `src/main/resources/db/local-demo-schema.sql` | 로컬 H2의 소셜 계정 연결 구조 생성 |
| `src/main/resources/application.yml` | OAuth 환경변수를 Spring 설정으로 연결 |
| `ZipAI-Kakao-Setup.bat` | 로컬 REST API 키와 Client Secret 입력창 실행 |
| `scripts/configure-local-kakao.ps1` | 입력값을 로컬 비공개 설정 파일로 저장 |
| `scripts/start-local-demo.ps1` | 로컬 서버 시작 전에 비공개 설정을 프로세스 환경변수로 적용 |

## 4. 제공 API

### 공급자 활성화 상태

```http
GET /api/auth/oauth/providers
```

설정이 정상이라면 다음과 같이 응답합니다.

```json
{
  "providers": {
    "kakao": true,
    "google": false
  }
}
```

### 카카오 로그인 시작

```http
GET /api/auth/oauth/kakao/start
```

서버는 카카오 인가 주소를 만들고 HTTP 302로 이동시킵니다. `KAKAO_CLIENT_ID`가 없으면 HTTP 503으로 처리합니다.

### 카카오 로그인 콜백

```http
GET /api/auth/oauth/kakao/callback
```

카카오가 `code`와 `state`를 이 주소로 전달합니다. 서버는 토큰 교환과 회원 로그인을 마친 뒤 메인 화면으로 이동시킵니다.

## 5. 데이터 저장 구조

`oauth_identities` 테이블은 다음 핵심 정보를 저장합니다.

```text
user_id             ZipAI 회원 ID
provider            kakao
provider_subject    카카오가 발급한 고유 사용자 ID
provider_email      카카오에서 제공받은 이메일(없을 수 있음)
created_at          연결 생성 시각
updated_at          연결 정보 수정 시각
```

`provider + provider_subject`에는 고유 제약조건이 있어 같은 카카오계정이 여러 ZipAI 회원으로 중복 연결되지 않습니다. 카카오 액세스 토큰과 카카오 비밀번호는 DB에 저장하지 않습니다.

## 6. 적용된 보안 처리

- 로그인 요청마다 예측하기 어려운 UUID `state`를 생성합니다.
- `state`와 공급자 이름을 서버 세션에 저장합니다.
- 콜백에서 요청값과 세션값이 모두 일치해야 로그인을 진행합니다.
- 일치하지 않으면 요청을 중단하여 로그인 CSRF를 방지합니다.
- REST API 키와 Client Secret은 소스 코드가 아니라 환경변수로 주입합니다.
- 카카오가 검증한 이메일만 기존 ZipAI 계정 자동 연결에 사용합니다.
- 비활성·탈퇴 계정에는 소셜 로그인을 허용하지 않습니다.
- 공급자 액세스 토큰과 리프레시 토큰을 데이터베이스에 보관하지 않습니다.

## 7. 카카오 Developers 설정

카카오 Developers에서 ZipAI 앱을 만든 뒤 다음을 설정합니다.

1. `카카오 로그인`의 활성화 설정을 `ON`으로 변경합니다.
2. `앱 → 플랫폼 키 → REST API 키`에서 REST API 키를 확인합니다.
3. 같은 REST API 키 화면에서 Client Secret을 발급하고 활성화합니다.
4. 동의항목에서 닉네임과 카카오계정 이메일을 설정합니다.
5. REST API 키의 Redirect URI에 사용하는 환경의 콜백 주소를 정확히 등록합니다.

로컬 콜백:

```text
http://127.0.0.1:4173/api/auth/oauth/kakao/callback
```

현재 Render 콜백:

```text
https://zipai-jb4z.onrender.com/api/auth/oauth/kakao/callback
```

프로토콜, 도메인, 포트, 경로와 마지막 슬래시가 실제 요청 주소와 정확히 같아야 합니다.

## 8. 배포 환경 설정

Render의 `Environment` 화면에 다음 세 값을 등록합니다.

```text
PUBLIC_BASE_URL=https://zipai-jb4z.onrender.com
KAKAO_CLIENT_ID=카카오_REST_API_키
KAKAO_CLIENT_SECRET=카카오_Client_Secret
```

실제 값은 문서, GitHub, `application.yml`, `.env.example`에 입력하지 않습니다. Render 환경변수를 저장한 뒤 재배포해야 실행 중인 Spring Boot 프로세스가 값을 읽습니다.

배포 확인 주소:

```text
https://zipai-jb4z.onrender.com/api/auth/oauth/providers
https://zipai-jb4z.onrender.com/templates/member/login.html
```

## 9. 로컬 설정과 실행

PowerShell 명령이나 Windows 환경변수 화면을 직접 사용할 필요는 없습니다.

1. `ZipAI-Kakao-Setup.bat`을 더블클릭합니다.
2. 카카오 REST API 키와 Client Secret을 입력하고 `Save`를 누릅니다.
3. 실행 중인 서버가 있다면 `ZipAI-Stop.bat`으로 종료합니다.
4. `ZipAI-Start.bat`을 실행합니다.
5. 아래 상태 주소에서 `kakao: true`인지 확인합니다.

```text
http://127.0.0.1:4173/api/auth/oauth/providers
```

로컬 설정은 다음 파일에 저장됩니다.

```text
.runtime/zipai-local-oauth.json
```

`.runtime/`은 `.gitignore`에 등록되어 있습니다. 이 파일에는 실제 Secret이 평문으로 들어 있으므로 외부에 공유하거나 전달용 ZIP에 포함하면 안 됩니다.

## 10. 회원가입과 로그인 구분

카카오 OAuth에는 ZipAI용 별도 회원가입 버튼이 필요하지 않습니다.

| 상황 | 처리 결과 |
| --- | --- |
| 처음 접속한 카카오 고유 ID | ZipAI 회원 자동 생성 후 로그인 |
| 이미 연결된 카카오 고유 ID | 연결된 ZipAI 회원으로 로그인 |
| 검증 이메일이 기존 회원과 일치 | 기존 회원에 카카오 로그인 수단 연결 |
| 이메일 제공 없음 | 카카오 고유 ID 기반 내부 이메일로 신규 회원 생성 |
| 회원 상태가 비활성 또는 탈퇴 | 로그인 거부 |

## 11. 오류 확인

| 증상 | 확인할 내용 |
| --- | --- |
| 버튼이 비활성화됨 | `/api/auth/oauth/providers`에서 `kakao`가 `true`인지 확인 |
| 카카오 `KOE004` | 카카오 로그인 활성화 설정이 `ON`인지 확인 |
| 카카오 `KOE006` | Redirect URI가 `PUBLIC_BASE_URL`로 만들어진 콜백과 정확히 같은지 확인 |
| 로그인 후 다시 로그인 화면 | 브라우저 쿠키 허용, HTTPS의 `COOKIE_SECURE=true`, 동일 도메인 흐름 확인 |
| 공급자 통신 실패 | Render 외부 네트워크, REST API 키, Client Secret 활성화 상태 확인 |
| 로컬에서만 `kakao: false` | `ZipAI-Kakao-Setup.bat` 저장 후 서버를 완전히 종료·재시작했는지 확인 |

## 12. 현재 범위와 추후 보강 항목

현재 구현은 회원가입·로그인과 ZipAI 세션 생성을 지원합니다. 아래 기능은 별도 확장 범위입니다.

- 카카오 연결 해제 API와 회원탈퇴 시 카카오 연결 해제
- 카카오계정까지 함께 로그아웃하는 기능
- 소셜 계정 연결·해제 관리 화면
- 카카오 프로필 변경 동기화
- 운영용 개인정보 처리방침과 동의 이력 고도화
- OAuth 성공·실패 감사 로그와 운영 모니터링

