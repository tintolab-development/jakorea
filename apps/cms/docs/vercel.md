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

## 3. 환경 변수

**Settings → Environment Variables** 에 `apps/cms/.env.example` 기준 값을 넣는다.

권장 (배포에 쓰는 환경에 체크):

| 변수 | 용도 |
|------|------|
| `VITE_API_BASE_URL` | 브라우저가 호출할 API 오리진 (CORS 허용 필요) |
| `VITE_OAUTH_REDIRECT_ORIGIN` | 배포 URL — OAuth Redirect URI와 동일 |
| `VITE_REAL_API_MODULES` | mock→실 API 전환 모듈 목록 (쉼표 구분) |
| `VITE_ADDRESS_API_KEY` | 도로명주소 검색 |
| `VITE_NEIS_API_KEY` | 학교 검색 |

로컬 전용 `VITE_API_SERVER`(Vite 프록시)는 Vercel 빌드에 넣지 않는다.

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
