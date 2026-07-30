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
- 스펙은 `tests/e2e/fixtures/test` 를 import 합니다.
  - **테스트 로깅**: 모든 테스트의 시작/종료·소요시간·mutation POST payload가
    `test-results/e2e-test-log-store.json` 에 남고
    [`/e2e-error-log`](http://localhost:3000/e2e-error-log) «테스트 로깅» 탭에서 확인할 수 있습니다.
  - **에러 로깅**: 실패하거나 `/api/*` 4xx/5xx 가 있으면 터미널에 출력되고
    `test-results/e2e-error-log-latest.json` · [`/e2e-error-log?tab=error`](http://localhost:3000/e2e-error-log?tab=error)
    «에러 로깅» 탭에 남습니다. (Vite 재시작 필요할 수 있음)

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

## 프로그램관리 E2E Phase 로드맵

프로그램 관리 LNB 5축(일반 · 1사1교 · UJAT · Gemini · 교육받은 교사)을 **Phase 단위**로 확장합니다.  
기존 일반 등록/수정/상세 · 1사1교 등록/수정 · UJAT 지역/수정 스펙은 유지하고, 빈 카테고리부터 채웁니다.

| Phase | 범위 | 상태 |
|-------|------|------|
| **1** | 전 카테고리 목록·셸 스모크 (`list/`) | **구현됨** |
| **2** | 1사1교 상세 smoke · LNB 격리(봉사자 없음) | **구현됨** |
| **3** | UJAT 등록 + 상세 smoke | **구현됨** |
| **4** | UJAT 상세 심화(봉사·교육진행·설문) | **구현됨** |
| **5** | Gemini 찾아가는 연수 | **구현됨** |
| **6** | Gemini 실적 관리 | **구현됨** |
| **7** | 교육받은 교사 목록·상세 smoke | **구현됨** |
| **8** | 교육받은 교사 심화(기관신청·교육일지) | **구현됨** |

시드 SSOT: [`docs/api/be-handoff-program-dummy-seeds/`](../api/be-handoff-program-dummy-seeds/README-BE.md)

---

## 3-list. Phase 1 — 전 카테고리 목록·셸 스모크

| 항목 | 내용 |
|------|------|
| 스펙 | `tests/e2e/flows/programs/list/program-categories-list-smoke.spec.ts` |
| POM | `program-list-smoke.page.ts` |
| 시드 stub | `gemini-seed-titles.ts` · `trained-teachers-seed-titles.ts` (+ 기존 일반/1사1교/UJAT seed titles) |
| 검증 | 7개 LNB 라우트: 인증 셸 · heading · 목록 마커 · 테이블/empty. featured 시드가 있으면 상세/모달 soft open, 없으면 annotation |

| # | 경로 |
|---|------|
| 1.1 | `/programs/general` |
| 1.2 | `/programs/company-school` |
| 1.3 | `/programs/ujat` |
| 1.4 | `/programs/ujat/regions` |
| 1.5 | `/programs/gemini/visiting-training` |
| 1.6 | `/programs/gemini/performance` |
| 1.7 | `/programs/trained-teachers` |

시드/상세 API가 없어도 **목록 셸은 통과**해야 합니다. 상세 오픈만 annotation으로 남깁니다.

### 일반 (headless)

```bash
pnpm --filter cms test:e2e:programs:list
```

### UI로 확인

```bash
pnpm --filter cms test:e2e:programs:list:ui
```

### headed

```bash
pnpm --filter cms test:e2e:programs:list:headed
```

### debug

```bash
pnpm --filter cms exec playwright test tests/e2e/flows/programs/list --project=chromium --debug
```

---

## 3. 프로그램 — 일반 프로그램 신규 등록

| 항목 | 내용 |
|------|------|
| 스펙 | `tests/e2e/flows/programs/general-program-registration.spec.ts` |
| POM | `tests/e2e/pages/general-program-registration.page.ts` |
| 헬퍼 | `tests/e2e/pages/form-helpers.ts` |
| 검증 | **1) 등록 완료** → **2) 목록에서 작성 프로그램 행 확인** (`describe.serial`) |

참고: 등록은 `POST /api/admin/programs` **실 API만** 사용합니다(스텁 없음). 백엔드 오류 시 테스트가 실패합니다.  
대표 프로그램명(국문)이 생성 `title`·목록에 반영됩니다.  
POM은 기본 경로(개인·커리큘럼형·단일 회차)에서 공통·모집(참여자/강사/봉사자)·신청(참여자/강사/봉사자) 탭의 텍스트·셀렉트·날짜·라디오·체크박스·상세 textarea를 채웁니다.  
스펙은 등록과 목록 확인을 **별도 test**로 나누며, 2단계는 1단계의 `programId`·제목을 이어받습니다.

백엔드 에러(예: `DATABASE_ERROR`)가 나면 DEV에서 Mock API에 상황·에러 코드가 자동 기록됩니다.  
단, **Playwright 테스트 브라우저와 직접 연 Chrome의 localStorage는 분리**되어 있습니다.  
실패 시 터미널에 `========== E2E 백엔드 에러 로그 ==========` 블록이 출력되고,  
`apps/cms/test-results/e2e-error-log-latest.json` · HTML 리포트 attachment에도 남습니다.  
공유 스토어(`e2e-error-log-store.json`)에도 기록되어 [`/e2e-error-log?tab=error`](http://localhost:3000/e2e-error-log?tab=error)에서 볼 수 있습니다.

테스트 진행·`POST /api/admin/programs` 등 mutation **payload**는 `e2e-test-log-store.json` /
[`/e2e-error-log`](http://localhost:3000/e2e-error-log) «테스트 로깅» 탭에서 확인합니다.

네트워크 캡처는 응답 body 파싱이 끝날 때까지 기다린 뒤 덤프하며, axios가 남긴 localStorage 건도 병합합니다.  
(과거에는 teardown 타이밍 때문에 테스트에서 난 4xx/5xx보다 로그가 적게 남을 수 있었습니다.)


등록·수정·상세는 **각각 별도 스크립트**로 실행합니다. 한 번에 묶지 않습니다.

### 일반 (headless)

```bash
pnpm --filter cms test:e2e:programs:registration
```

### UI로 확인

```bash
pnpm --filter cms test:e2e:programs:registration:ui
```

### headed

```bash
pnpm --filter cms test:e2e:programs:registration:headed
```

### debug

```bash
pnpm --filter cms exec playwright test tests/e2e/flows/programs/general-program-registration.spec.ts --project=chromium --debug
```

---

## 3b. 프로그램 — 일반 프로그램 수정

| 항목 | 내용 |
|------|------|
| 스펙 | `tests/e2e/flows/programs/general-program-edit.spec.ts` |
| POM | `tests/e2e/pages/general-program-edit.page.ts` |
| 헬퍼 | `tests/e2e/pages/form-helpers.ts` |
| 대상 | BE 시드 **`[수정 가능] 일반 프로그램 더미`** (신규 등록 없음) |
| 검증 | **1) 더미 열기** → **2) 공통** → **3) 모집** → **4) 신청 양식** → **5) 상세·목록** → **6) 진행 현황 참여 기관·강사·봉사자 mock 목록** (`describe.serial`) |

전제: 더미가 목록에 있고, lifecycle이 **프로그램 진행 예정**이며 **사업 시작일 이전**이어야 「정보 수정」이 가능합니다.  
대표 프로그램명(국문)은 시드 식별용으로 **변경하지 않습니다**. 영문·공고용명·장소·KPI·임금·모집 탭 필드 등을 갱신한 뒤 `PATCH /api/admin/programs/{id}` 성공을 기다립니다.  
모집 정보는 참여자 / 강사 / 봉사자 서브탭마다 수정·저장합니다.  
**6)** 진행 현황 목록은 `programProgress` remote가 비어 있으면 FE mock 폴백(기관·강사·봉사자)으로 건수·행을 확인합니다.

등록 스펙과 **별도 실행**합니다 (`test:e2e:programs:edit`).

### 일반 (headless)

```bash
pnpm --filter cms test:e2e:programs:edit
```

### UI로 확인

```bash
pnpm --filter cms test:e2e:programs:edit:ui
```

### headed

```bash
pnpm --filter cms test:e2e:programs:edit:headed
```

### debug

```bash
pnpm --filter cms exec playwright test tests/e2e/flows/programs/general-program-edit.spec.ts --project=chromium --debug
```

---

## 3c. 프로그램 — 일반 프로그램 상세 (LNB smoke · 신청 · 진행 · 설문)

| 항목 | 내용 |
|------|------|
| 스펙 | `tests/e2e/flows/programs/detail/*.spec.ts` |
| POM | `general-program-detail.page.ts` · `general-program-applications.page.ts` · `general-program-seed-titles.ts` |
| 시드 | CASE-10 FULL LNB 우선, 없으면 `[수정 가능] 일반 프로그램 더미` · P0~P2 CASE title (`P0_SEED_TITLES` 등) |
| 검증 | **smoke** LNB/탭/딥링크 → **신청** 승인·Phase2 심화 → **진행** Phase3 기관/개인 → **설문** Phase4 audience · **P0 variant LNB** |

신청 정보 **양식 수정**은 수정 스펙(3b) 5단계에서 커버합니다 (`양식 수정` → form-template 저장, PATCH programs 아님).

신청 목록에 BE 시드 행이 없으면 해당 케이스는 목록 로드만 통과하고 annotation으로 사유를 남깁니다.  
P0~P2 CASE title이 목록에 없으면 `test.skip`합니다.

### Phase별 스펙

| Phase | 스펙 | 시드 의존 | 검증 요약 |
|-------|------|-----------|-----------|
| **1** P0 LNB 잠금 | `detail/general-program-variant-lnb.spec.ts` | CASE-01~09 (`P0_SEED_TITLES` + FE `【유형·N】` alias) | 기관↔개인 LNB on/off · multi 회차 · CASE-06 희망일정 숨김 · CASE-09 IPS |
| **2** 신청 심화 | `detail/general-program-applications.spec.ts` | FULL LNB / CASE-03 / CASE-21 | 필터·상세·봉사 2depth·면접 배정 모달 · 면접 on/off |
| **3** 진행 | `detail/general-program-progress.spec.ts` | FULL LNB + CASE-01/03 | 기관 목록·상세 탭 · 개인 출석/과제/게시글 · 참여자 상세 |
| **4** 설문 audience | `detail/general-program-survey-managers.spec.ts` | CASE-10/13/14 · CASE-19/20/24 | none/single/full · 만족도 참여자/교사·학생/봉사자 |
| smoke | `detail/general-program-detail-smoke.spec.ts` | FULL LNB → 수정 더미 | 딥링크·탭 URL |

시드 title SSOT: `tests/e2e/pages/general-program-seed-titles.ts` · BE 문서 [`general-program-dummy-seed-backend-request.md`](../api/general-program-dummy-seed-backend-request.md) §1·§9.

```bash
pnpm --filter cms test:e2e:programs:detail
pnpm --filter cms test:e2e:programs:detail:ui
pnpm --filter cms test:e2e:programs:detail:headed

# Phase 단위
pnpm --filter cms exec playwright test tests/e2e/flows/programs/detail/general-program-variant-lnb.spec.ts --project=chromium
pnpm --filter cms exec playwright test tests/e2e/flows/programs/detail/general-program-applications.spec.ts --project=chromium
pnpm --filter cms exec playwright test tests/e2e/flows/programs/detail/general-program-progress.spec.ts --project=chromium
pnpm --filter cms exec playwright test tests/e2e/flows/programs/detail/general-program-survey-managers.spec.ts --project=chromium
```

---

## 3d. 프로그램 — 1사1교 프로그램 신규 등록

| 항목 | 내용 |
|------|------|
| 스펙 | `tests/e2e/flows/programs/company-school-registration.spec.ts` |
| POM | `tests/e2e/pages/company-school-registration.page.ts` |
| 헬퍼 | `tests/e2e/pages/form-helpers.ts` |
| 라우트 | `/programs/company-school` (`registrationFormVariant=economy`) |
| 검증 | **1) 등록 완료** → **2) 목록 확인** (`describe.serial`) |

고정 축: **학교/기관 × 커리큘럼형 × 단일 회차** · **봉사자 탭 없음**.  
제목: `Playwright 1사1교 테스트·{hash}` (일반 `Playwright 테스트(…)`와 충돌 방지).  
등록은 `POST /api/admin/programs` **실 API만** 사용합니다. 모달 타이틀은 `1사1교 프로그램 등록`.

등록·수정은 **각각 별도 스크립트**로 실행합니다.

### 일반 (headless)

```bash
pnpm --filter cms test:e2e:programs:company-school:registration
```

### UI로 확인

```bash
pnpm --filter cms test:e2e:programs:company-school:registration:ui
```

### headed

```bash
pnpm --filter cms test:e2e:programs:company-school:registration:headed
```

### debug

```bash
pnpm --filter cms exec playwright test tests/e2e/flows/programs/company-school-registration.spec.ts --project=chromium --debug
```

---

## 3e. 프로그램 — 1사1교 상세 풀페이지 수정

| 항목 | 내용 |
|------|------|
| 스펙 | `tests/e2e/flows/programs/company-school-edit.spec.ts` |
| POM | `company-school-edit.page.ts` · `company-school-detail.page.ts` · `company-school-seed-titles.ts` |
| 대상 | BE 시드 **`[수정 가능] 1사1교 프로그램 더미`** (CS-EDIT · 신규 등록 없음) |
| 검증 | **1) 더미 열기** → **2) 공통** → **3) 모집 학교** → **4) 모집 강사** → **5) 신청 학교** → **6) 신청 강사** → **7) 상세·목록** → **8) 진행 현황(학교·강사)** (`describe.serial`) |

전제: 더미가 목록에 있고, lifecycle이 **프로그램 진행 예정**이며 **사업 시작일 이전**이어야 「정보 수정」이 가능합니다.  
대표 프로그램명(국문)은 시드 식별용으로 **변경하지 않습니다**.  
모집·신청은 **학교/기관·강사만** — 봉사자 탭 부재를 assert합니다.  
시드 레시피: [`company-school-program-dummy-seed-backend-request.md`](../api/company-school-program-dummy-seed-backend-request.md) §5b CS-EDIT.

등록 스펙과 **별도 실행**합니다 (`test:e2e:programs:company-school:edit`).

### 일반 (headless)

```bash
pnpm --filter cms test:e2e:programs:company-school:edit
```

### UI로 확인

```bash
pnpm --filter cms test:e2e:programs:company-school:edit:ui
```

### headed

```bash
pnpm --filter cms test:e2e:programs:company-school:edit:headed
```

### debug

```bash
pnpm --filter cms exec playwright test tests/e2e/flows/programs/company-school-edit.spec.ts --project=chromium --debug
```

---

## 3e2. Phase 2 — 1사1교 상세 smoke · LNB 격리

| 항목 | 내용 |
|------|------|
| 스펙 | `tests/e2e/flows/programs/company-school/detail/*.spec.ts` |
| POM | `company-school-detail.page.ts` · `company-school-seed-titles.ts` |
| 시드 | CS-01 (`HSBC/HKU…`) 우선 → CS-EDIT `[수정 가능] 1사1교 프로그램 더미` |
| 검증 | **smoke** LNB/탭/딥링크 · **LNB 격리** 봉사자·합반·과제·출석/게시글 부재 · 기관·강사만 |

시드가 없으면 해당 스펙은 `test.skip`합니다. 수정 스펙(3e)과 **별도 실행**합니다.

```bash
pnpm --filter cms test:e2e:programs:company-school:detail
pnpm --filter cms test:e2e:programs:company-school:detail:ui
pnpm --filter cms test:e2e:programs:company-school:detail:headed

# 단위
pnpm --filter cms exec playwright test tests/e2e/flows/programs/company-school/detail/company-school-detail-smoke.spec.ts --project=chromium
pnpm --filter cms exec playwright test tests/e2e/flows/programs/company-school/detail/company-school-lnb-isolation.spec.ts --project=chromium
```

카테고리별 스크립트만 모아 둔 목록: [`program-e2e-scripts-by-lnb.md`](./program-e2e-scripts-by-lnb.md)

---

## 3f. 프로그램 — UJAT 교육 지역 관리 CRUD

| 항목 | 내용 |
|------|------|
| 스펙 | `tests/e2e/flows/programs/ujat-education-regions-crud.spec.ts` |
| POM | `tests/e2e/pages/ujat-education-regions.page.ts` |
| 대상 | `/programs/ujat/regions` |
| 검증 | **1) 목록 진입** → **2) 등록(C)+중복명** → **3) 조회·필터(R)** → **4) 인라인 수정(U)** → **5) 순서 변경** → **6) 삭제(D)** (`describe.serial`) |

전제: auth.setup 세션 · `VITE_REAL_API_MODULES`에 `ujatEducationRegions`(권장).  
이름은 `Playwright 교육지역·{timestamp}` 고유명으로 생성·삭제하며 **기본 마스터(서울 등)는 수정·삭제하지 않습니다.**  
POST/DELETE는 Cat3 Option A — BE 미지원 시 해당 단계가 실패합니다.

일반·1사1교 스펙과 **별도 실행**합니다 (`test:e2e:programs:ujat:regions`).

### 일반 (headless)

```bash
pnpm --filter cms test:e2e:programs:ujat:regions
```

### UI로 확인

```bash
pnpm --filter cms test:e2e:programs:ujat:regions:ui
```

### headed

```bash
pnpm --filter cms test:e2e:programs:ujat:regions:headed
```

### debug

```bash
pnpm --filter cms exec playwright test tests/e2e/flows/programs/ujat-education-regions-crud.spec.ts --project=chromium --debug
```

---

## 3f2. Phase 3 — UJAT 신규 등록 + 상세 smoke

| 항목 | 내용 |
|------|------|
| 등록 스펙 | `tests/e2e/flows/programs/ujat-program-registration.spec.ts` |
| 등록 POM | `ujat-program-registration.page.ts` |
| 상세 스펙 | `tests/e2e/flows/programs/ujat/detail/ujat-program-detail-smoke.spec.ts` |
| 상세 POM | `ujat-program-detail.page.ts` · `ujat-program-seed-titles.ts` |
| 시드 | `[수정 가능] UJAT 프로그램 더미` → `[UJAT더미]…` → FE mock 목록 title |
| 검증 | **등록** serial 완료·목록 · **smoke** 공통/모집·기관·봉사·교육진행·담당자 LNB · 강사 LNB 부재 |

```bash
pnpm --filter cms test:e2e:programs:ujat:registration
pnpm --filter cms test:e2e:programs:ujat:detail
pnpm --filter cms test:e2e:programs:ujat:detail:ui
pnpm --filter cms test:e2e:programs:ujat:detail:headed
```

카테고리별 스크립트: [`program-e2e-scripts-by-lnb.md`](./program-e2e-scripts-by-lnb.md)

---

## 3f3. Phase 4 — UJAT 상세 심화 (봉사·교육진행·설문)

| 항목 | 내용 |
|------|------|
| 스펙 | `ujat/detail/ujat-program-volunteer-screening.spec.ts` · `…-education-progress.spec.ts` · `…-survey-managers.spec.ts` |
| POM | `ujat-program-detail.page.ts` (`openAnyTabs` · `expectListOrEmptyShell`) |
| 시드 | Phase 3와 동일 (`UJAT_DETAIL_SEED_CANDIDATES`) · 행 없으면 empty 셸 통과 |
| 검증 | **기관** inst_* · **상/하반기 봉사** vh* · **교육진행** edu_h1_* / edu_h2 / edu_summary · **설문·담당자** · 강사 LNB 부재 |

```bash
pnpm --filter cms test:e2e:programs:ujat:detail:deep
pnpm --filter cms test:e2e:programs:ujat:detail:deep:ui
pnpm --filter cms test:e2e:programs:ujat:detail:deep:headed
# 또는 Phase 3 smoke 포함 전체 상세
pnpm --filter cms test:e2e:programs:ujat:detail
```

---

## 3f4. Phase 5 — Gemini 찾아가는 연수

| 항목 | 내용 |
|------|------|
| 스펙 | `gemini/visiting-training/list-tabs-smoke` · `recruitment-detail-smoke` · `approved-detail-smoke` · `lnb-isolation` |
| POM | `gemini-visiting-training.page.ts` · `gemini-seed-titles.ts` |
| 시드 | BE `[Gemini더미]…` → FE mock Coding Bootcamp / 찾아가는 연수 · 승인 기관명 |
| 검증 | **모집/승인 탭** · 모집 LNB(info·institutions·managers) · 승인 LNB(info·instructors·managers) · 봉사/교육진행/설문 부재 |

```bash
pnpm --filter cms test:e2e:programs:gemini:visiting
pnpm --filter cms test:e2e:programs:gemini:visiting:ui
pnpm --filter cms test:e2e:programs:gemini:visiting:headed
```

---

## 3f5. Phase 6 — Gemini 실적 관리

| 항목 | 내용 |
|------|------|
| 스펙 | `gemini/performance/list-smoke` · `filter-smoke` · `isolation` |
| POM | `gemini-performance.page.ts` · `gemini-seed-titles.ts`(GPERF 강사·장소) |
| 시드 | GPERF-01 `홍길동` 등 · 행 없으면 필터 soft-skip |
| 검증 | **목록 셸** · 필터(강사·연수방식·장소·연수일) · 등록 file input · 찾아가는 연수 탭 부재 |

```bash
pnpm --filter cms test:e2e:programs:gemini:performance
pnpm --filter cms test:e2e:programs:gemini:performance:ui
pnpm --filter cms test:e2e:programs:gemini:performance:headed
```

---

## 3f6. Phase 7 — 교육받은 교사 목록·상세 smoke

| 항목 | 내용 |
|------|------|
| 스펙 | `trained-teachers/list-smoke` · `detail/detail-smoke` · `detail/lnb-isolation` |
| POM | `trained-teachers-detail.page.ts` · `trained-teachers-seed-titles.ts` |
| 시드 | TT-01 FE mock title · `[TT더미]…` · TT-02~08 |
| 검증 | **목록 셸** · 정보(공통·모집·신청) · 기관신청·진행·담당자 · **강사/봉사 LNB 부재** |

```bash
pnpm --filter cms test:e2e:programs:trained-teachers
pnpm --filter cms test:e2e:programs:trained-teachers:ui
pnpm --filter cms test:e2e:programs:trained-teachers:headed
```

---

## 3f7. Phase 8 — 교육받은 교사 심화 (기관신청·교육일지)

| 항목 | 내용 |
|------|------|
| 스펙 | `detail/institution-applications-deep` · `detail/education-journal-progress` |
| POM | `trained-teachers-detail.page.ts` (`tryOpenFirstInstitutionRow` · journal · performance summary) |
| 시드 | TT-A-* 기관 · TT-J-* 일지 · TT-P-01 실적 요약 — 없으면 soft-skip |
| 검증 | **기관 신청 목록** · 기관 상세(신청/일지) · **진행·실적 요약** · journal 딥링크 |

```bash
pnpm --filter cms test:e2e:programs:trained-teachers:deep
pnpm --filter cms test:e2e:programs:trained-teachers:deep:ui
pnpm --filter cms test:e2e:programs:trained-teachers:deep:headed
# Phase 7 포함 전체
pnpm --filter cms test:e2e:programs:trained-teachers
```

---

## 3g. 프로그램 — UJAT 상세 풀페이지 수정

| 항목 | 내용 |
|------|------|
| 스펙 | `tests/e2e/flows/programs/ujat-program-edit.spec.ts` |
| POM | `ujat-program-edit.page.ts` · `ujat-program-seed-titles.ts` |
| 대상 | BE 시드 **`[수정 가능] UJAT 프로그램 더미`** (신규 등록 없음) |
| 검증 | **1) 더미 열기** → **2) 공통** → **3) 모집(참여자·상/하반기 봉사자)** → **4) 신청 목록 셸** → **5) 상세·목록** → **6) 진행 상반기 참여 기관 셸** (`describe.serial`) |

전제: 더미가 `/programs/ujat` 목록에 있고 「정보 수정」이 가능해야 합니다. 없으면 1단계에서 `test.skip` 후 후속 단계도 skip합니다.  
대표 프로그램명(국문)은 시드 식별용으로 **변경하지 않습니다.**  
UJAT 상세 LNB에는 일반 프로그램의 「신청 정보 양식 수정」탭이 없어 **4)는 기관·봉사자 신청 목록 셸**만 검증합니다.  
모집 서브탭: `recruit_participant` / `recruit_volunteer_h1` / `recruit_volunteer_h2` (강사 탭 없음).

일반·1사1교 수정 스펙과 **별도 실행**합니다 (`test:e2e:programs:ujat:edit`).

### 일반 (headless)

```bash
pnpm --filter cms test:e2e:programs:ujat:edit
```

### UI로 확인

```bash
pnpm --filter cms test:e2e:programs:ujat:edit:ui
```

### headed

```bash
pnpm --filter cms test:e2e:programs:ujat:edit:headed
```

### debug

```bash
pnpm --filter cms exec playwright test tests/e2e/flows/programs/ujat-program-edit.spec.ts --project=chromium --debug
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
| 일반 프로그램 등록 | `test:e2e:programs:registration` | `test:e2e:programs:registration:ui` | `test:e2e:programs:registration:headed` |
| 일반 프로그램 수정 | `test:e2e:programs:edit` | `test:e2e:programs:edit:ui` | `test:e2e:programs:edit:headed` |
| 일반 프로그램 상세 | `test:e2e:programs:detail` | `test:e2e:programs:detail:ui` | `test:e2e:programs:detail:headed` |
| UJAT 교육 지역 CRUD | `test:e2e:programs:ujat:regions` | `test:e2e:programs:ujat:regions:ui` | `test:e2e:programs:ujat:regions:headed` |
| UJAT 상세 smoke · Phase4 심화 | `test:e2e:programs:ujat:detail` | `test:e2e:programs:ujat:detail:ui` | `test:e2e:programs:ujat:detail:headed` |
| UJAT 상세 심화만 | `test:e2e:programs:ujat:detail:deep` | `test:e2e:programs:ujat:detail:deep:ui` | `test:e2e:programs:ujat:detail:deep:headed` |
| Gemini 찾아가는 연수 | `test:e2e:programs:gemini:visiting` | `test:e2e:programs:gemini:visiting:ui` | `test:e2e:programs:gemini:visiting:headed` |
| Gemini 실적 관리 | `test:e2e:programs:gemini:performance` | `test:e2e:programs:gemini:performance:ui` | `test:e2e:programs:gemini:performance:headed` |
| 교육받은 교사 | `test:e2e:programs:trained-teachers` | `test:e2e:programs:trained-teachers:ui` | `test:e2e:programs:trained-teachers:headed` |
| 교육받은 교사 심화 | `test:e2e:programs:trained-teachers:deep` | `test:e2e:programs:trained-teachers:deep:ui` | `test:e2e:programs:trained-teachers:deep:headed` |
| UJAT 상세 풀페이지 수정 | `test:e2e:programs:ujat:edit` | `test:e2e:programs:ujat:edit:ui` | `test:e2e:programs:ujat:edit:headed` |
| 회원 목록 CRUD (4 kind, 권한 관리 제외) | `test:e2e:members` | `test:e2e:members:ui` | `test:e2e:members:headed` |
| 전체 | `test:e2e` | `test:e2e:ui` | `test:e2e:headed` |

모두 `pnpm --filter cms` 접두사를 붙입니다.

예:

```bash
pnpm --filter cms test:e2e:auth:ui
pnpm --filter cms test:e2e:programs:registration:ui
pnpm --filter cms test:e2e:programs:edit:ui
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
│   ├── programs/                   # 일반·1사1교·UJAT·Gemini·교육받은 교사
│   │   ├── list/                   # Phase 1 전 카테고리 목록·셸 스모크
│   │   ├── company-school/detail/  # Phase 2 1사1교 상세 smoke · LNB 격리
│   │   ├── ujat/detail/            # Phase 3 smoke + Phase 4 심화
│   │   ├── gemini/visiting-training/  # Phase 5 찾아가는 연수
│   │   ├── gemini/performance/        # Phase 6 실적 관리
│   │   ├── trained-teachers/          # Phase 7 smoke + Phase 8 심화
│   │   ├── general-program-*.spec.ts
│   │   ├── company-school-*.spec.ts
│   │   ├── ujat-program-registration.spec.ts
│   │   ├── ujat-education-regions-crud.spec.ts
│   │   ├── ujat-program-edit.spec.ts
│   │   └── detail/                 # 일반 상세 LNB smoke·신청·진행·설문
│   └── members/                    # 회원 목록 CRUD (세션 재사용)
├── fixtures/                       # 공통 test (백엔드 에러 로그 자동 덤프)
├── helpers/                        # API 에러 캡처·덤프 · auth-paths · with-authenticated-page
└── pages/                          # Page Object · form helpers · seed titles
```

규칙: 모노레포 `.cursor/rules/playwright-e2e.mdc`

**Last updated:** 2026-07-30
