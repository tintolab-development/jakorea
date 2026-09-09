# CMS FE — 로컬 Admin 소셜 로그인(SSO) 점검 요청

이 프론트 레포(`apps/cms`)에서만 확인·수정하라. BE 레포는 수정하지 마라.
질문은 화면/라우트/env가 코드로 안 찾아질 때만.

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-09-07 |
| 범위 | CMS Admin 소셜 로그인(SSO) · 로컬 |
| 증상 원인(가설) | IdP 콘솔 `redirect_uri` ≠ BE callback (`localhost:8080` vs `127.0.0.1:8080`) |
| FE env | 이미 정리됨. **더 고칠 OAuth 값 없음** (아래 정답과 다르면만 수정) |

---

## 증상

- 로컬에서 Google / Kakao / Naver 소셜 로그인 시 IdP 에러
  - Google: `Error 400: redirect_uri_mismatch`
  - Kakao: `KOE006` (Admin Settings Issue)
  - Naver: “JA코리아 서비스 설정 오류로 로그인할 수 없습니다”
- 실서버(CloudFront)는 정상
- BE `.env` / CMS FE `.env` 는 로컬용으로 정리된 상태

---

## BE 계약 (변경 없음)

Admin SSO는 FE가 IdP를 직접 호출하지 않는다.

1. `POST /api/admin/auth/sso/login` (로그인)  
   또는 연결: `POST /api/admin/me/sso/accounts` (Bearer + startOAuth)
2. 응답 `authorizationUrl` 로 `window.location.assign`
3. IdP `redirect_uri` 는 **항상 BE callback**:
   `{VITE_OAUTH_BACKEND_ORIGIN}/api/admin/auth/sso/{provider}/callback`
4. 콜백 성공 후 FE return → `adminSsoSessionId` consume

- IdP `redirect_uri` ≠ FE origin
- `VITE_OAUTH_REDIRECT_ORIGIN` 은 **frontendReturnUrl origin** 용이다 (IdP redirect_uri 아님)

---

## env 파일 역할 (혼동 금지)

| 파일 | 역할 | 로컬 SSO |
|------|------|----------|
| `.env` | 로컬 실사용 | `localhost:8080` + `socialAuth` → 정답 |
| `.env.example` | 템플릿 | 설명용 |
| `.env.local` | `.env`보다 우선 | OIDC만이면 OAuth 영향 없음. **CloudFront 값 넣지 말 것** |
| `.env.local.example` | CloudFront 재현용 | **`.env.local`로 복사 금지** (실서버 BE로 붙음) |
| `.env.ngrok.example` | ngrok용 | ngrok BE일 때만 |
| `.env.production` | 배포 | CloudFront 고정 → 정상 |

---

## 현재 로컬 정답 env (`apps/cms/.env`)

```env
VITE_API_SERVER=http://localhost:8080
VITE_OAUTH_BACKEND_ORIGIN=http://localhost:8080
VITE_OAUTH_REDIRECT_ORIGIN=http://localhost:3000
VITE_API_BASE_URL=

# Client ID만. Client Secret 금지 (토큰 교환은 BE)
VITE_GOOGLE_CLIENT_ID=...
VITE_KAKAO_CLIENT_ID=...
VITE_NAVER_CLIENT_ID=...

# 필수: socialAuth / socialAuthLogin 포함
VITE_REAL_API_MODULES=...,socialAuth,socialAuthLogin,...
```

### 금지 / 주의

- `VITE_OAUTH_EXCHANGE_MODE=mock` 사용 금지 (폐기). remote면 BE `authorizationUrl`만 사용
- `VITE_*_CLIENT_SECRET` FE 금지
- `.env.local.example` → `.env.local` 복사 금지 (CloudFront 혼입)
- `.env.ngrok.example` 은 ngrok BE일 때만
- `localhost` ≠ `127.0.0.1` (OAuth 완전 일치)

### 혼동 포인트

| 변수 | 의미 |
|------|------|
| `VITE_OAUTH_REDIRECT_ORIGIN=http://localhost:3000` | FE 복귀 (`frontendReturnUrl`) |
| `VITE_OAUTH_BACKEND_ORIGIN=http://localhost:8080` | IdP에 등록할 **origin** |
| 실제 IdP `redirect_uri` | `http://localhost:8080/api/admin/auth/sso/{kakao\|naver\|google}/callback` |

콘솔의 `http://localhost:3000/oauth/{provider}` 는 FE return path 성격. **Admin SSO IdP redirect_uri가 아님.**

---

## IdP 콘솔에 등록해야 하는 Redirect URI (로컬)

BE/FE가 보내는 값과 **문자열 완전 일치**.

### 필수 (현재 BE/FE 기준)

```text
http://localhost:8080/api/admin/auth/sso/google/callback
http://localhost:8080/api/admin/auth/sso/kakao/callback
http://localhost:8080/api/admin/auth/sso/naver/callback
```

### 선택 (`127.0.0.1`도 쓸 경우)

```text
http://127.0.0.1:8080/api/admin/auth/sso/google/callback
http://127.0.0.1:8080/api/admin/auth/sso/kakao/callback
http://127.0.0.1:8080/api/admin/auth/sso/naver/callback
```

실서버용 CloudFront/ngrok callback은 유지.

---

## FE 코드 확인 체크리스트

- [ ] 소셜 버튼이 BE `authorizationUrl`만 쓰는지  
      (`login-social-section` → `cmsSocialAuthClient.startLogin` → `window.location.assign`)
- [ ] FE가 kauth / nid / accounts.google 을 Client ID로 **직접 조립하지 않는지**
- [ ] remote SSO 실패 시 FE IdP authorize로 **폴백하지 않는지** (`@jakorea/social-auth` startLogin)
- [ ] `isSocialAuthLoginRemoteEnabled()` === true  
      (`socialAuth` 또는 `socialAuthLogin` ∈ `VITE_REAL_API_MODULES`)
- [ ] body `redirectUri` / backend origin = `http://localhost:8080/.../callback`
- [ ] `frontendReturnUrl` origin = `http://localhost:3000` (BE allowlist)
- [ ] env 변경 후 **Vite dev 서버 재시작**

---

## 브라우저 확인 (DEV)

소셜 클릭 시 콘솔:

```text
[social-auth] backend oauth redirect_uri=http://localhost:8080/api/admin/auth/sso/{provider}/callback
```

주소창 IdP URL의 `redirect_uri=` 쿼리가 위와 **동일한지** 확인.

다르면:

- FE가 mock / 직접 IdP 호출 중이거나
- `VITE_OAUTH_BACKEND_ORIGIN` / `VITE_API_SERVER` 가 다른 origin

---

## 비즈니스 규칙 (연동 해제)

- Admin 소셜 로그인은 **이미 연결된** `admin_social_account`만 가능
- 연동 전부 해제 상태면: 비밀번호 로그인 → 설정에서 소셜 연결 → 그다음 소셜 로그인
- 연결 전 로그인 시도 시 IdP 통과 후에도 BE `ADMIN_SOCIAL_ACCOUNT_NOT_LINKED` 가능
- 지금 증상(KOE006 / `redirect_uri_mismatch` / Naver 서비스 설정)은 **연결 해제 문제가 아니라 IdP redirect_uri 불일치**

---

## 요청 (이 에이전트가 할 일)

1. `apps/cms/.env` / `.env.local` / `.env.example` / `.env.production` 이 위 표·정답과 같은지 확인  
   (mock / secret / CloudFront 혼입 있으면 제거·주석 정리)
2. Vite 재시작 안내 + 소셜 클릭 시 실제 `redirect_uri` 쿼리 확인 방법 정리
3. IdP 콘솔에 `localhost:8080` BE callback 3개 등록이 **필수**임을 응답에 명시  
   (`127.0.0.1`만 있으면 부족)
4. 코드상 FE 직접 IdP 조립·remote 폴백이 남아 있으면 **고친다** (env만으로 안 되면)
5. 그래도 실패 시 BE에 넘길 정보 포맷을 응답에 적어라:
   - provider별 주소창 URL 전체
   - DevTools `[social-auth]` 로그

### 완료 회신 템플릿

```text
Admin SSO 로컬 점검
- .env: API_SERVER / OAUTH_BACKEND = localhost:8080 · secret/mock 없음 · socialAuth 포함: (Y/N)
- .env.local CloudFront 혼입: (Y/N)
- remote login enabled: (Y/N)
- FE 직접 IdP / mock fallback: (없음 / 수정함)
- IdP 콘솔에 등록 필요 URI 3개: (위에 재기재)
- 브라우저에서 확인할 redirect_uri= : http://localhost:8080/api/admin/auth/sso/{provider}/callback
```
