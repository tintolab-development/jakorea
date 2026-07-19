# CMS Playwright E2E — 플로우별 실행 스크립트

CMS E2E는 `apps/cms/tests/e2e/`에 두고, `@playwright/test`로 실행합니다.  
패키지 매니저는 **pnpm workspace** (`pnpm --filter cms …`)를 사용합니다.

## 사전 준비

```bash
# Chromium 브라우저 설치 (최초 1회 또는 Playwright 업데이트 후)
pnpm --filter cms test:e2e:install
```

- 로컬 기본 URL: `http://localhost:3000` (`E2E_BASE_URL`로 변경 가능)
- `playwright.config.ts`의 `webServer`가 `pnpm dev`를 기동합니다. 이미 떠 있으면 재사용합니다.
- **인증**: `auth.setup.ts` 가 DEV **어드민 자동 입력** + MFA `000000` 으로 **1회** 로그인하고
  `tests/e2e/.auth/admin.json`(storageState)에 저장합니다. 이후 스펙은 이 세션을 재사용합니다.
- 스펙은 `tests/e2e/fixtures/test` 를 import 합니다. 실패하거나 `/api/*` 4xx/5xx 가 있으면
  터미널에 **E2E 백엔드 에러 로그**가 출력되고 `test-results/e2e-error-log-latest.json` 에 저장됩니다.
  같은 로그는 DEV Mock API 스토어에도 남아 [`/e2e-error-log`](http://localhost:3000/e2e-error-log)에서
  확인할 수 있습니다. (Vite 재시작 필요할 수 있음)

백엔드 전달용으로 정리한 E2E 관측 이슈: [**e2e-backend-fixes-index.md**](../api/e2e-backend-fixes-index.md)

### `NETWORK_ERROR` / 30s 타임아웃이 많이 보일 때

- **원인**: BE 또는 ngrok 등이 응답하지 않을 때 axios가 30초 후 포기합니다. 대시보드처럼 API를 한꺼번에 치면 로그가 폭주합니다.
- **확인**: BE·터널 기동 여부, `curl`/`httpie`로 `/api/admin/users` 등 단일 요청이 오는지.
- **FE**: 타임아웃 로그는 60초간 1건으로 합치고, 회원·프로그램 E2E는 대시보드를 건너뜁니다. 근본 해결은 인프라 복구입니다. 상세는 인덱스 문서의 «NETWORK_ERROR» 절.

---

## 공통 스크립트

| 용도 | 명령 |
|------|------|
| 전체 E2E | `pnpm --filter cms test:e2e` |
| Playwright UI (전체 스펙 브라우저에서 탐색) | `pnpm --filter cms test:e2e:ui` |
| headed (실제 브라우저 창) | `pnpm --filter cms test:e2e:headed` |
| step debug | `pnpm --filter cms test:e2e:debug` |
| HTML 리포트 | `pnpm --filter cms test:e2e:report` |
| 브라우저 설치 | `pnpm --filter cms test:e2e:install` |

모노레포 루트에서도 일부 가능합니다.

```bash
pnpm test:e2e
pnpm test:e2e:smoke
```

---

## 1. 스모크 — 로그인 페이지 로드

| 항목 | 내용 |
|------|------|
| 스펙 | `tests/e2e/smoke/application-loads.spec.ts` |
| 검증 | `/login` 타이틀·이메일·비밀번호·로그인하기 버튼 |

### 일반 (headless)

```bash
pnpm --filter cms test:e2e:smoke
```

### UI로 확인

```bash
pnpm --filter cms test:e2e:smoke:ui
```

### headed

```bash
pnpm --filter cms test:e2e:smoke:headed
```

### 직접 경로 지정

```bash
pnpm --filter cms exec playwright test tests/e2e/smoke --project=chromium
pnpm --filter cms exec playwright test tests/e2e/smoke --project=chromium --ui
pnpm --filter cms exec playwright test tests/e2e/smoke --project=chromium --headed
```

---

## 2. 인증 — setup 로그인·MFA + 세션 복원

| 항목 | 내용 |
|------|------|
| Setup | `tests/e2e/auth.setup.ts` — 자동 입력 → MFA `000000` → storageState 저장 |
| 세션 파일 | `tests/e2e/.auth/admin.json` (gitignore) |
| 스펙 | `tests/e2e/flows/auth/login-to-dashboard.spec.ts` — **저장된 세션**으로 대시보드 진입 |
| POM | `tests/e2e/pages/login.page.ts` |

`chromium` 프로젝트는 `dependencies: ['setup']` 후 `storageState`를 씁니다. 프로그램·회원 스펙은 로그인 단계를 반복하지 않습니다.

### 일반 (headless)

```bash
pnpm --filter cms test:e2e:auth
```

### UI로 확인

```bash
pnpm --filter cms test:e2e:auth:ui
```

### headed

```bash
pnpm --filter cms test:e2e:auth:headed
```

### debug

```bash
pnpm --filter cms exec playwright test --project=setup --debug
```

---

## 3. 프로그램 — 일반 프로그램 신규 등록

| 항목 | 내용 |
|------|------|
| 스펙 | `tests/e2e/flows/programs/general-program-registration.spec.ts` |
| POM | `tests/e2e/pages/general-program-registration.page.ts` |
| 헬퍼 | `tests/e2e/pages/form-helpers.ts` |
| 검증 | **저장된 세션** → LNB 일반 프로그램 → 신규 등록 → 공통/모집/신청 작성 → **실 API** 등록 완료 → 목록에 작성 프로그램 행 확인 |

참고: 등록은 `POST /api/admin/programs` **실 API만** 사용합니다(스텁 없음). 백엔드 오류 시 테스트가 실패합니다.  
대표 프로그램명(국문)이 생성 `title`·목록에 반영됩니다.

백엔드 에러(예: `DATABASE_ERROR`)가 나면 DEV에서 Mock API(`localStorage`)에 상황·에러 코드가 자동 기록됩니다.  
단, **Playwright 테스트 브라우저와 직접 연 Chrome의 localStorage는 분리**되어 있습니다.  
실패 시 터미널에 `========== E2E 백엔드 에러 로그 ==========` 블록이 출력되고,  
`apps/cms/test-results/e2e-error-log-latest.json` · HTML 리포트 attachment에도 남습니다.  
공유 스토어(`e2e-error-log-store.json`)에도 기록되어 [`/e2e-error-log`](http://localhost:3000/e2e-error-log)에서 볼 수 있습니다.

네트워크 캡처는 응답 body 파싱이 끝날 때까지 기다린 뒤 덤프하며, axios가 남긴 localStorage 건도 병합합니다.  
(과거에는 teardown 타이밍 때문에 테스트에서 난 4xx/5xx보다 로그가 적게 남을 수 있었습니다.)


### 일반 (headless)

```bash
pnpm --filter cms test:e2e:programs
```

### UI로 확인

```bash
pnpm --filter cms test:e2e:programs:ui
```

### headed

```bash
pnpm --filter cms test:e2e:programs:headed
```

### debug

```bash
pnpm --filter cms exec playwright test tests/e2e/flows/programs --project=chromium --debug
```

---

## 4. 회원 — 회원 목록 CRUD (권한 관리 제외)

회원 관리 → **회원 목록** 하위만 대상입니다. **회원 권한 관리**(권한 승인·관리자 권한 설정)는 제외합니다.

| kind | 스펙 | 메뉴 |
|------|------|------|
| `all` | `member-crud.spec.ts` | 전체 회원 |
| `institutions` | `school-member-crud.spec.ts` | 학교(교사) 회원 |
| `instructors` | `instructor-member-crud.spec.ts` | 강사 회원 |
| `admins` | `admin-member-crud.spec.ts` | 관리자 회원 (등록 CRUD — 현재 skip) |
| `admins` 권한 유형 | `admin-permission-type.spec.ts` | 목록 드롭다운 권한 유형 변경·원복 |

| 항목 | 내용 |
|------|------|
| POM | `tests/e2e/pages/member-crud.page.ts` (`MemberListCrudPage`) |
| 공유 플로우 | `tests/e2e/flows/members/member-list-crud-flow.ts` |
| 권한 유형 POM | `tests/e2e/pages/admin-permission-type.page.ts` |
| 검증 | 로그인 → LNB → kind별 목록 → 등록·조회·수정·삭제 |
| 권한 유형 | 기존 관리자 행 드롭다운 → `PATCH …/admin-accounts/{id}/role` → 배지 갱신 후 원복 |
| 이름 | **틴토랩-*** (고유 suffix; 학교는 기관명) |

실 API: `POST …/pre-register` · `PATCH …/users/{id}` · `POST …/users/{id}/delete` · 권한 유형은 `PATCH …/admin-accounts/{adminId}/role` (`members` 모듈).

참고: `pre-register` 스키마에 `role`이 없어 학교·강사·관리자 등록 후 **해당 kind 목록에 안 보일 수** 있습니다. E2E는 등록은 kind 모달에서 하고, 목록에 없으면 **전체 회원**에서 조회·수정·삭제를 이어갑니다. 로그인은 `auth.setup` storageState를 재사용합니다.

학교 등록은 JUSO 주소 검색 키(`VITE_ADDRESS_API_KEY`)가 없거나 검색 실패 시 Form에 도로명 주소를 직접 주입합니다.

**관리자 회원 CRUD**는 등록 API를 `createAdmin`으로 연결했으나, 목록·삭제까지 users ID와 맞물리는지 BE 확인 전이어서 `test.skip` 유지입니다.

**관리자 권한 유형 변경**은 등록과 무관하게 목록에 있는 관리자 행으로 검증합니다. (마스터 계정·`ADMIN_WRITE` 필요)

### 일반 (headless)

```bash
pnpm --filter cms test:e2e:members
```

### UI로 확인

```bash
pnpm --filter cms test:e2e:members:ui
```

### headed

```bash
pnpm --filter cms test:e2e:members:headed
```

### debug

```bash
pnpm --filter cms exec playwright test tests/e2e/flows/members --project=chromium --debug
```

---

## 플로우 한눈에 보기

| 플로우 | headless | UI | headed |
|--------|----------|-----|--------|
| 스모크 | `test:e2e:smoke` | `test:e2e:smoke:ui` | `test:e2e:smoke:headed` |
| 인증 | `test:e2e:auth` | `test:e2e:auth:ui` | `test:e2e:auth:headed` |
| 일반 프로그램 등록 | `test:e2e:programs` | `test:e2e:programs:ui` | `test:e2e:programs:headed` |
| 회원 목록 CRUD (4 kind, 권한 관리 제외) | `test:e2e:members` | `test:e2e:members:ui` | `test:e2e:members:headed` |
| 전체 | `test:e2e` | `test:e2e:ui` | `test:e2e:headed` |

모두 `pnpm --filter cms` 접두사를 붙입니다.

예:

```bash
pnpm --filter cms test:e2e:auth:ui
pnpm --filter cms test:e2e:programs:ui
pnpm --filter cms test:e2e:members:ui
```

---

## UI 모드 사용 팁

1. `*:ui` 실행 → Playwright Test UI가 열림  
2. 왼쪽에서 **폴더가 아니라 개별 테스트 케이스**(예: `어드민 자동 입력 후 MFA를…`)를 선택  
3. ▶ 실행 중에는 가운데 미리보기에 실제 페이지가 보임 (**실행이 끝난 뒤에는 컨텍스트가 닫혀 `about:blank`가 정상**)  
4. 끝난 뒤에도 화면을 보려면:
   - 왼쪽 **Actions** 목록에서 `goto` / `click` 등 각 스텝을 클릭 → 그때의 스냅샷이 표시됨  
   - 상단 타임라인을 드래그해도 동일  
5. Actions가 비어 있으면 상위 폴더(`auth`)만 선택된 경우가 많음 → 리프 테스트를 다시 선택  

로컬(`CI` 아님)에서는 `playwright.config.ts`가 **성공 시에도** `trace` / `screenshot` / `video`를 남기도록 설정되어 있습니다.

### 화면만 보고 싶을 때 (추천)

```bash
# 실제 Chromium 창이 뜨며 클릭·입력이 보임
pnpm --filter cms test:e2e:auth:headed

# 한 스텝씩 멈추며 확인
pnpm --filter cms exec playwright test tests/e2e/flows/auth --project=chromium --debug
```

리포트만 다시 보려면:

```bash
pnpm --filter cms test:e2e:report
```

---

## 디렉터리 구조

```
apps/cms/tests/e2e/
├── auth.setup.ts                   # 어드민 로그인·MFA 1회 → .auth/admin.json
├── smoke/                          # 비로그인 로그인 페이지 로드
├── flows/
│   ├── auth/                       # 세션 복원 → 대시보드
│   ├── programs/                   # 일반 프로그램 등록 (세션 재사용)
│   └── members/                    # 회원 목록 CRUD (세션 재사용)
├── fixtures/                       # 공통 test (백엔드 에러 로그 자동 덤프)
├── helpers/                        # API 에러 캡처·덤프 · auth-paths
└── pages/                          # Page Object · form helpers
```

규칙: 모노레포 `.cursor/rules/playwright-e2e.mdc`

**Last updated:** 2026-07-20
