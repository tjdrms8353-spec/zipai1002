# 백엔드 운영 안내

Spring Boot 카카오 OAuth의 Render 환경변수, Redirect URI, 로컬 설정과 점검 방법은 [카카오 로그인 구현 안내](kakao-login.md)를 참고하세요.

## 환경변수

- `PORT`: 서버 포트, 기본값 `4173`
- `HOST`: 바인딩 주소, 로컬 기본값 `127.0.0.1`
- `COOKIE_SECURE`: HTTPS 운영 환경에서는 반드시 `true`
- `ZIPAI_DB_PATH`: SQLite 파일의 절대 또는 실행 디렉터리 기준 경로
- `ZIPAI_BACKUP_DIR`: DB 백업 파일 저장 경로
- `PUBLIC_DATA_SERVICE_KEY`: 공공데이터포털 일반 인증키

외부 접속을 허용하는 운영 환경은 `HOST=0.0.0.0`으로 설정하고, Node 서버 앞에 HTTPS를 종료하는 리버스 프록시를 둡니다. 이때 `COOKIE_SECURE=true`를 적용합니다.

## 실행과 검사

```text
node server.js
node scripts/backend-integration-test.js
```

통합 테스트는 임시 DB를 사용하므로 운영 DB를 변경하지 않습니다.

## SQLite 백업

```text
node scripts/backup-database.js
```

스크립트는 WAL 체크포인트 후 타임스탬프가 포함된 별도 SQLite 파일을 생성합니다. 운영에서는 스케줄러로 정기 실행하고, 백업 디렉터리를 서버와 다른 저장소에 추가 복제해야 합니다. 복구 훈련과 보관 기간도 별도로 정합니다.

## 적용된 보호

- 서버 DB 세션과 `HttpOnly`, `SameSite=Lax` 쿠키
- 역할 기반 관리자 API 권한 검사
- 변경 API의 브라우저 `Origin` 검사
- 인증 및 일반 API 요청 횟수 제한
- 입력 길이와 허용 상태값 검사
- 보안 응답 헤더
- `.env`, SQLite, 백엔드 소스와 내부 자료의 정적 파일 노출 차단

다중 서버 운영 시 메모리 기반 요청 제한을 Redis 등의 공유 저장소 기반으로 교체해야 합니다. 개인정보 보관·파기 정책, 중앙 로그 수집, 침해 모니터링과 실제 HTTPS 인증서 구성은 배포 환경에서 별도로 완료합니다.

## 카카오 OAuth 운영 설정

Spring Boot 카카오 로그인은 다음 환경변수를 사용합니다.

```text
PUBLIC_BASE_URL=https://zipai-jb4z.onrender.com
KAKAO_CLIENT_ID=카카오_REST_API_키
KAKAO_CLIENT_SECRET=카카오_Client_Secret
```

Render의 Environment에 실제 값을 등록하고 재배포합니다. 실제 Secret은 `render.yaml`, GitHub, Markdown 문서에 기록하지 않습니다. 카카오 Developers의 REST API 키 Redirect URI에는 `https://zipai-jb4z.onrender.com/api/auth/oauth/kakao/callback`을 등록합니다.

배포 후 `https://zipai-jb4z.onrender.com/api/auth/oauth/providers`에서 `kakao: true`인지 확인하고 로그인 화면에서 실제 카카오계정으로 동의·자동 가입·재로그인 과정을 검사합니다. OAuth 실패 시 Render 로그에서 콜백 시각의 요청을 확인하되 인가 코드나 토큰을 로그에 남기지 않습니다.

현재 구현은 카카오 액세스·리프레시 토큰을 DB에 저장하지 않습니다. 따라서 장기 카카오 API 호출이나 카카오계정 로그아웃·연결 해제는 별도 기능으로 구현해야 합니다.
