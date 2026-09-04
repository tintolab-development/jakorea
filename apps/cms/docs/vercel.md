# CMS Vercel 배포

모노레포 `apps/cms`를 **별도 Vercel 프로젝트**로 연결하고, **`development` 브랜치**에 머지되면 Production 배포가 나가도록 설정한다.

## 1. Vercel 프로젝트 생성

1. [Vercel Dashboard](https://vercel.com) → **Add New… → Project**
2. GitHub `tintolab-development/jakorea` 연결
3. **Root Directory** → `apps/cms` (Edit → 선택 후 Continue)
4. Framework Preset: **Vite** (자동 감지 또는 `vercel.json`의 `framework`)
5. 아래 Build 설정이 `apps/cms/vercel.json`과 일치하는지 확인 후 Deploy

| 항목 | 값 |
|------|-----|
| Root Directory | `apps/cms` |
| Install Command | `cd ../.. && HUSKY=0 pnpm install` |
| Build Command | `cd ../.. && pnpm turbo run build --filter=cms` |
| Output Directory | `dist` |
| Ignored Build Step | `cd ../.. && npx turbo-ignore cms --fallback=HEAD^1` |

> `turbo-ignore`는 cms(및 의존 패키지) 변경이 없으면 배포를 스킵한다.

## 2. Production = `development`

**Settings → Environments → Production** 의 Branch Tracking을 `development`로 설정한다.

- `development` 에 push/merge → **Production** 배포
- 그 외 브랜치 PR → Preview

## 3. 환경 변수 · 실서버 고정

**배포 API 오리진 SSOT**

| 계층 | 역할 |
|------|------|
| `apps/cms/.env.production` (커밋) | `vite build` 기본값 — `VITE_API_BASE_URL=https://d3r1iaa0sy4tcq.cloudfront.net` |
| `src/shared/lib/api-remote-env.ts` | Production에서 localhost/127.0.0.1 무시 → CloudFront 강제 |
| Vercel Environment Variables | 위보다 우선. **localhost를 넣지 말 것** |

권장 Vercel 값 (Production / Preview 모두, `apps/cms/.env.example` 참고):

| 변수 | 용도 |
|------|------|
| `VITE_API_BASE_URL` | `https://d3r1iaa0sy4tcq.cloudfront.net` (실서버) |
| `VITE_OAUTH_BACKEND_ORIGIN` | 동일 CloudFront (Admin SSO) |
| `VITE_REAL_API_MODULES` | mock→실 API 전환 모듈 목록 (쉼표 구분) — `.env.production`과 동기화 |
| `VITE_ADDRESS_API_KEY` | 도로명주소 검색 |
| `VITE_NEIS_API_KEY` | 학교 검색 |

- `VITE_API_SERVER` / `VITE_OAUTH_REDIRECT_ORIGIN=http://localhost:…` 는 **Vercel에 넣지 않는다** (로컬 전용).
- OAuth 프론트 redirect는 배포 시 `window.location.origin`을 쓴다.
- 배포 확인: 번들/Network에 `d3r1iaa0sy4tcq.cloudfront.net` 이 보이고 `127.0.0.1` / `localhost:8080` 이 없어야 한다.

### Admin SSO (카카오/네이버/구글) 체크리스트

프론트는 `/login/social/complete`까지 오면 라우팅은 정상이다. IdP·백엔드 설정이 깨지면 query만 `FAILED`로 온다.

1. **IdP Redirect URI**에 CloudFront 콜백이 있어야 한다 (localhost만 있으면 Vercel은 IdP에서 거절되거나 잘못된 앱으로 간다).

   - `https://d3r1iaa0sy4tcq.cloudfront.net/api/admin/auth/sso/kakao/callback`
   - `https://d3r1iaa0sy4tcq.cloudfront.net/api/admin/auth/sso/naver/callback`
   - `https://d3r1iaa0sy4tcq.cloudfront.net/api/admin/auth/sso/google/callback`

2. **백엔드 `frontendReturnUrl` allowlist**에 배포 주소가 있어야 한다.

   - `https://jakorea-cms.vercel.app`
   - (로컬) `http://localhost:3000`

3. **`ADMIN_SSO_PROVIDER_VERIFICATION_FAILED`** 는 프론트 URL 오연결이 아니라 CloudFront 백엔드 ↔ IdP token/userinfo 문제다. 로컬 `127.0.0.1:8080`만 통과하는 경우와 구분한다.

4. **로컬에서 Vercel과 같게 재현** (`apps/cms/.env.local`):

   ```bash
   VITE_API_SERVER=https://d3r1iaa0sy4tcq.cloudfront.net
   VITE_OAUTH_BACKEND_ORIGIN=https://d3r1iaa0sy4tcq.cloudfront.net
   VITE_API_BASE_URL=
   ```

   Vite 재시작 후 소셜 로그인을 치면 실서버 OAuth를 탄다. 그때도 실패하면 로컬 FE가 아니라 실서버 OAuth다.

추가로 Node/pnpm 인식이 불안하면:

| 변수 | 값 |
|------|------|
| `ENABLE_EXPERIMENTAL_COREPACK` | `1` |
| `HUSKY` | `0` |

## 4. Deployment Protection (공개 접근)

외부에서 URL로 접근하려면 **Settings → Deployment Protection → Require Log In** 을 끈다.  
Preview만 막고 Production만 공개하려면 Standard Protection 범위를 조정한다.

## 5. 로컬에서 프로젝트 링크 (선택)

```bash
cd apps/cms
npx vercel link
npx vercel pull --yes --environment=production
```

`.vercel/` 는 로컬 전용 — Git에 커밋하지 않는다.

## 6. 배포 확인

1. feature → `development` PR 머지
2. Vercel Deployments 에서 Production 빌드 성공 확인
3. SPA 딥링크(예: `/programs/...`) 새로고침 시 `index.html` rewrite로 404가 나지 않는지 확인

## 7. 빌드 실패 트러블슈팅

### `Cannot find module '@jakorea/ui'`

| 원인 | 조치 |
|------|------|
| **Production Branch가 `main`** | **Production Branch = `development`** |
| **Build Command가 `pnpm build`만** | `vercel.json`과 동일하게 설정하거나 `prebuild` 포함 `package.json` 사용 |
| **Install이 `apps/cms`만** | Install Command: `cd ../.. && HUSKY=0 pnpm install` |

권장 Dashboard 값 (`vercel.json` 미적용 시):

- Install: `cd ../.. && HUSKY=0 pnpm install`
- Build: `cd ../.. && pnpm turbo run build --filter=cms`  
  또는 Root `apps/cms`에서 `pnpm build` (`prebuild`가 workspace 패키지를 먼저 빌드)

### `tsc` 관련

CMS production build는 **`vite build`** 만 실행한다. 타입 검사는 `pnpm typecheck` / CI에서 수행한다.

## 관련 파일

- `apps/cms/vercel.json` — 빌드·ignore·SPA rewrite
- `apps/platform/docs/vercel.md` — Platform 배포 (별도 Vercel 프로젝트)
- `apps/admin/docs/vercel.md` — Homepage Admin 배포 (별도 Vercel 프로젝트)
