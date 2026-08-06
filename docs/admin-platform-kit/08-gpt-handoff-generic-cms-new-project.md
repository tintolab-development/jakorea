# GPT 핸드오프 — 범용 CMS(Studio) 신규 착수·이식 가이드

> **목적:** 이 한 문서를 GPT(또는 Cursor Agent)에 주고, JaKorea monorepo **자산을 선별 이식**해 **새 프로젝트(범용 CMS Studio)** 를 시작하게 한다.  
> **검증일:** 2026-08-06  
> **입력 문서 교차검증:** Downloads `05/06/07` + 로컬 `docs/admin-platform-kit/01~06` + 실제 `apps/*` · `packages/*`

---

## 0. 이 문서를 쓰는 방법 (GPT 지시문)

```text
당신은 JaKorea frontend monorepo를 참고해 범용 CMS Studio를 신규 구축한다.
반드시 이 문서(08)의 결정·금지·이식 체크리스트를 따른다.
구현 전: 작업 분류(Admin Platform | CMS Core | Extension | Adapter | Config)를 출력한다.
구현 중: core가 apps/cms feature·extension·JA 용어를 import하지 않는다.
구현 후: §10 정적 검사 + typecheck/lint/build 결과를 요약한다.
```

**필수 참고 경로 (레포 절대 경로 기준):**

| 우선 | 내용 |
|------|------|
| 이 문서 `08` | 교차검증 결론 + 착수 절차 (SSOT for handoff) |
| Downloads/또는 동등 사본 `05-generic-cms-...` | Core 계약·Registry·수직 슬라이스·Cursor §19 |
| Downloads/또는 동등 사본 `06-jakorea-monorepo-generic-cms-...` | monorepo 역할·Phase·JA 분류 |
| Downloads `07-...validation-report` | 왜 구 05/06(Admin Kit clone)이 범용 제품에 불합격인지 |
| `.cursor/rules/cms-admin-ui/**` | UI 수치·필터·테이블 (유지 SSOT) |
| `apps/admin` | **셸·Cms\* UI 복사 of record** |
| `apps/cms` | 요구 분석·shared 패턴만. **feature 통째 복사 금지** |

구버전 로컬 문서 `05-frontend-architecture...` / `06-jakorea-monorepo-adoption` 은 **Admin Kit 복제 전략**이다. 범용 CMS 목표에서는 **폐지/참고**이며, 07 보고서와 05 v2 결론을 따른다.

---

## 1. 교차검증 판정 (한 장 요약)

### 1.1 세 문서 상호 정합

| 문서 | 역할 | 내부 일관성 |
|------|------|-------------|
| **07** | 구 Admin-Kit 문서(프로젝트별 app 복제) **불합격** 판정 + P0 이슈 목록 | 합격 — 진단 문서 |
| **05 v2** | 범용 CMS Core 아키텍처·Registry·첫 슬라이스·Cursor 프로토콜 | 합격 — 제품 SSOT |
| **06 v2** | JaKorea monorepo에서 `apps/cms-studio` 구축 실행 규약 | 합격 — 07/05와 정합 |

07의 P0(1~8)는 05 v2가 전부 재정의한다. 06 v2는 그 결정을 monorepo Phase/Gate(G0~G6)로 실행한다. **세 문서는 서로 모순되지 않으며, “Admin Kit 복제” vs “범용 Studio” 중 후자를 제품 목표로 고정한다.**

### 1.2 우리 monorepo와의 적합성

| 주장 (05/06 v2) | 레포 실측 | 적용 가능? |
|-----------------|-----------|------------|
| of record 셸 = `apps/admin` | admin = FSD + Theme/Query/Alert + layout + Cms\* + `useListFilterUrl` | **Yes** — shell 이식 원본 |
| admin에 auth 없음 | `AuthProvider`/`ProtectedRoute` 없음, mock GNB | **Partial** — Studio는 admin 복제 시 auth 반드시 추가 (06 명시) |
| CMS feature 복사 금지 | `features/program|settlement|template|user` 수천 파일 + mock 이중 경로 | **Yes — 금지 정당** |
| `packages/form-*` runtime 후보 | form-schema/catalog/surface + form-template-runtime (DetailInfoForm, host) | **Partial** — **작성 폼/약관 A4 템플릿 중심**, generic CMS field registry와 1:1 아님. **개념·일부 UI 차용**, core 스키마 재설계 필요 |
| `@jakorea/rich-text` field 후보 | Tiptap 래퍼 | **Yes** — field renderer 후보 |
| `@jakorea/domain` | 교육 enum | **No in core** — JA extension only |
| `@jakorea/ui` = DS | Button 수준 최소 | **No** — DS 본체는 admin/cms `shared/ui` |
| 단일 `apps/cms-studio` | **존재하지 않음** | **신규 생성 필요** |
| Extension registry | 없음 | **신규 설계 필요** |
| Tenant/manifest | CMS는 단일 조직 admin, multi-tenant 아님 | **신규 모델 + BE 계약 필요** |
| backend capability SSOT | CMS는 프론트 role/permission 테이블이 강함 | **BE 협의 전 프론트 capability 스텁 허용**, 장기 BE SSOT |
| UI SSOT | `.cursor/rules/cms-admin-ui/*` 성숙 | **Yes 유지** |
| pnpm + turbo monorepo | 있음 | **Yes** — `apps/cms-studio` 추가가 자연스러움 |

### 1.3 목표 전략 결정 (고정)

```text
제품 목표:  범용 CMS Studio (단일 앱 + manifest + extension)
비목표:     고객마다 apps/<name> + 리소스별 CRUD feature 복제
기반:       Admin Platform Kit (admin shell/UI)
제품 코어:  schema-driven ContentType → Dynamic Entry
JA 기존 CMS: adopter/extension 후보, big-bang 교체 금지
```

**짧은 납품 1건·스키마 CMS가 아니라 “업무 어드민 CRUD N개” 만 필요하면**  
→ 05 v2가 아니라 **구 Admin Kit 문서(로컬 01~04 + 구05)** 가 맞다.  
그 경우 이 08 문서의 Studio 절차를 **과설계**로 쓰지 말 것. (07이 말하는 “조건부 불합격” = 목표에 따라 다름)

**범용 제품 / multi-tenant·다고객 CMS를 원하면 이 08 + 05/06 v2 필수.**

### 1.4 07 P0 이슈 ↔ 우리 레포 현황 매핑

| ID | 07 이슈 | 레포 현황 | Studio 착수 시 조치 |
|----|---------|-----------|---------------------|
| P0-1 | 프로젝트별 app | admin/cms 분리 제품 | **`apps/cms-studio` 하나** 생성 |
| P0-2 | feature per resource | cms program… | Studio는 **generic entry feature**만 |
| P0-3 | Item CRUD 검증 | admin hero-banner 등 | **Dynamic Entry + 3 conformance schema** |
| P0-4 | form opt-in | form-* 선택·JA template | **Field Registry를 Core 필수** |
| P0-5 | app 메뉴 하드코딩 | 거대 menu-config | **manifest + route/menu registry** |
| P0-6 | 정적 role table | cms permissions | **capability 문자열 + BE SSOT**(스텁 가능) |
| P0-7 | extension 경계 없음 | 전 앱 monolit | **bootstrap만 extension 등록, core 역import 금지** |
| P0-8 | JA only 검증 | JA만 존재 | **profile-generic A/B** 필수 (G4) |

### 1.5 유지해도 되는 기존 규약 (07 §4 = 05 v2 유지분)

스택·FSD 방향·URL applied filter·query keys·invalidate·page axios 금지·UI 수치·multi-layer auth UX·silent fail 금지·typecheck/lint/build — **그대로 재사용.**

---

## 2. 산출물 목표 (DoD)

다음을 모두 통과하면 “범용 CMS 착수 성공(G2 이상)”이다. G4 전에 “완성 제품” 선언 금지.

```text
G0  ContentType/Field/Manifest/Extension/Repository 타입 + 역의존 규칙 문서화
G1  apps/cms-studio: auth→tenant→manifest→registry seal→router 기동, validate 통과
G2  content type A/B/C를 **같은** list/editor page로 CRUD (schema 파일만 교체)
G3  custom field 1개가 registry 등록만으로 동작 (core switch 0)
G4  JA 없는 second manifest profile 통과
G5  (선택) JA route 1개 adapter 연결
G6  (나중) cms-runtime / extension-sdk 패키지 추출
```

---

## 3. monorepo에서 신규 앱 위치

```text
jakorea/
├─ apps/
│  ├─ cms-studio/          ← NEW (목표 제품)
│  ├─ admin/               ← shell of record (건드리지 않고 복사 원본)
│  ├─ cms/                 ← JA 제품 (읽기 전용 참고)
│  ├─ platform/            ← preview adapter 후보 (선택)
│  └─ lms/                 ← 금지 시드
├─ packages/               ← form-*, rich-text, utils 등 opt-in
├─ extensions/             ← NEW 권장 (또는 apps/cms-studio/src/extensions)
│  ├─ jakorea/             ← JA 전용 (지연)
│  └─ conformance-sample/  ← G2~G4 fixture
└─ config/
   └─ cms-boundary-terms.txt  ← NEW (JA 용어 차단 목록)
```

물리 패키지 `packages/cms-*`는 **G0~G2까지 앱 내부 contract로 충분**. 추출은 G6.

Workspace:

1. `apps/cms-studio/package.json` name `cms-studio`
2. root `package.json`에 `"cms-studio": "pnpm --filter cms-studio dev"` (선택)
3. turbo가 `apps/*` 스캔이면 추가 설정 최소

---

## 4. 이식 원본 — 파일 단위 (상세)

### 4.1 반드시 복사 (Admin shell)

`apps/admin` → `apps/cms-studio`로 복사 후 **홈페이지 도메인 전부 삭제.**

| From (`apps/admin`) | To (`apps/cms-studio`) | 비고 |
|---------------------|------------------------|------|
| `package.json` | 이름 `cms-studio`, port 변경, 불필요 dnd 제거 가능 | deps 최소 세트 확인 |
| `vite.config.ts` | path `@/*` 유지, proxy 조정 | |
| `tsconfig*.json` | 유지 | |
| `index.html` | 타이틀 변경 | |
| `src/main.tsx` | 유지 후 provider 확장 | §5 bootstrap |
| `src/index.css` | 유지 | |
| `src/app/providers/*` | 유지 | Auth/Tenant/Manifest/Registry 추가 |
| `src/widgets/layout/*` | 유지 | 메뉴를 registry/manifest 구독으로 |
| `src/shared/ui/**` | **전부** | CmsButton, modal, data-table, filter CSS |
| `src/shared/lib/use-list-filter-url.ts` | 유지 | dynamic list |
| `src/shared/lib/use-table-search.ts` | 유지 | |
| `src/shared/lib/query-client.ts` | 유지 | tenant 스코프 invalidate 정책 추가 |
| `src/shared/instance/axios-instance.ts` | 유지 | token + tenant header 슬롯 |
| `src/shared/constants/*` | filter/table/modal-z | colors |
| `src/shared/lib/api-remote-env.ts` | 통합 → `shared/config/environment.ts` 권장 | feature가 env 직독 금지 |

**삭제할 admin 잔재:**

```text
src/features/**          전부 (hero-banner, ja-korea-*, popup…)
src/entities/**          homepage entities
src/pages/main/**
src/pages/ja-korea/**
src/pages/design-system  (선택 유지)
src/shared/config/menu-config 본문 — 형태만 남기고 manifest 연동
```

### 4.2 선택 복사 (CMS shared — 파일 단위만)

admin에 없고 Studio에 필요한 경우 `apps/cms/src/shared`에서 **파일 단위** 이식. 금지: feature 폴더.

| 후보 | 이유 |
|------|------|
| `PermissionButton` / access hooks 골격 | capability 기반 UX |
| ProtectedRoute 패턴 | auth guard |
| detail fullpage modal (필요 시) | 설정류 화면 |
| alert/confirm 이미 admin에 있으면 중복 이식 금지 | |

### 4.3 Auth — CMS 선별 (골격만)

`apps/cms/src/features/auth` 에서:

- store/session 패턴
- login page 구조
- refresh interceptor 의도

**제외:** JA MFA 카피, social/identity 강결합(필요할 때만 package), CMS role table 본문.

Studio 목표 session 형태:

```ts
type CmsSession = {
  user: { id: string; name: string; email?: string }
  tenantIds: string[]
  activeTenantId: string
  activeWorkspaceId?: string
  capabilities: string[]  // "content:read", "content:create", …
}
```

role 이름 `MASTER|ADMIN` 을 UI 전역 비교에 쓰지 말 것.

### 4.4 packages — 연결 방식

| Package | Studio 사용법 |
|---------|----------------|
| `@jakorea/utils` | 날짜 등 — 직접 dep |
| `@jakorea/rich-text` | **field type `richText` renderer** — Field Registry 등록 |
| `@jakorea/form-schema` / `form-template-runtime` | **당장 Core 스키마 SSOT로 쓰지 말 것.** 이후 detail-table 레이아웃·작성폼 extension에 차용. ContentType field model은 05 v2 `FieldDefinition` 신규 타입 |
| `@jakorea/location` | taxonomy/region 필요 시 extension |
| `@jakorea/identity-verification` / `social-auth` | auth extension |
| `@jakorea/domain` | **core dep 금지** |

### 4.5 절대 이식 금지

```text
apps/cms/src/features/program/**
apps/cms/src/features/settlement*/**
apps/cms/src/features/template/**   (JA 제품 템플릿; 폴더명 "template" 자체는 금지어 아님)
apps/cms/src/features/user/** 동의·약관 정책
apps/cms/src/data/mock/**
VITE_REAL_API_MODULES 매트릭스
CMS menu-config 본문 (~1500 lines)
CMS permissions MASTER+program roles 본문
apps/lms/**
```

---

## 5. `apps/cms-studio` 목표 트리 (생성 순서)

05 v2 §9 기준 축약 + 구현 순서.

```text
apps/cms-studio/src/
  main.tsx
  app/
    providers/          # Theme, Query, Alert, Auth, Tenant, Manifest, Registry
    bootstrap/
      load-manifest.ts
      resolve-tenant.ts
      register-builtins.ts
      register-extensions.ts   # ONLY place that imports extensions
      seal-registry.ts
    registry/
      field-registry.ts
      route-registry.ts
      action-registry.ts
      extension-registry.ts
      menu-registry.ts
    router/
    components/protected-route.tsx
  pages/
    dashboard/
    content-type-list/     # optional early
    content-list/          # /content/:contentTypeId  ONE page
    content-editor/        # new + :entryId  ONE page
    media-library/         # P2
    settings/
    login/
  widgets/
    layout/                # from admin
    dynamic-form/
    dynamic-list/
  features/
    auth/
    tenant-switch/
    content-model/         # load ContentTypeDefinition
    content-entry/         # repository + hooks + query-keys
    media/                 # later
  entities/
    session/ tenant/ content-type/ content-entry/ field-definition/
  extensions/
    index.ts               # build-time allowlist export
    conformance-sample/    # fields demo
  shared/
    config/environment.ts
    config/query-defaults.ts
    instance/axios-instance.ts
    lib/
    ui/                    # from admin
```

**Content type마다 pages/features 폴더를 만들지 않는다.**

---

## 6. Core 계약 (구현 첫 커밋에 고정)

### 6.1 최소 TypeScript 계약 파일

한 곳에 모을 것 (예: `src/entities/*/model/types.ts` 또는 나중 `packages/cms-contracts`):

```text
TenantId, WorkspaceId, ContentTypeId, EntryId, FieldId, LocaleCode
ContentTypeDefinition  (fields[], titleField, listView?, capabilities?, workflowId?)
FieldDefinition        (type string, validation, ui, settings)
ContentEntry           (values Record, status, version, locale)
ListViewDefinition
CmsManifest            (schemaVersion, product brand, enabledModules, navigation?, extensions[])
CmsExtension           (fields?, routes?, menuItems?, actions?, setup?)
FieldTypeRegistration  (input, display, normalize, serialize, validate, defaultValue)
EntryRepository        (list/get/create/update/remove/executeAction)
EntryCapabilities      (canRead/Create/Update/Delete, actions[])
CmsSession
CmsApiError            (fieldErrors, conflict versions)
```

### 6.2 Core routes (하드코딩 허용 목록)

```text
/login
/
/content-types                 (optional P1)
/content/:contentTypeId
/content/:contentTypeId/new
/content/:contentTypeId/:entryId
/media                         (P2)
/settings
```

이 외 customer/`program` path를 **core 상수로 추가하지 않음.**

### 6.3 Bootstrap 순서 (실패 시 fail-fast UI)

```text
1 env validate
2 Auth session (loading ≠ unauthenticated)
3 Tenant resolve
4 Manifest load (unknown schemaVersion → block)
5 register-builtins (field types, core routes)
6 register-extensions (allowlist only)
7 collide / version check
8 registry.seal()
9 build router from registry + capability filter
10 render
```

### 6.4 Query key (필수 context)

```text
['cms', tenantId, 'entries', contentTypeId, 'list', normalizedFilters]
['cms', tenantId, 'entries', contentTypeId, 'detail', entryId, locale]
```

tenant 전환 시 **관련 cache 제거 또는 키 분리.**

### 6.5 Repository — UI는 endpoint 모름

G2 단계 fixture adapter:

```ts
// features/content-entry/api/fixture-repository.ts
// implements EntryRepository; 동일 타입; TODO 제거 조건 명시
```

실 API 시:

```ts
// adapters/rest-entry-repository.ts
// axios는 여기 또는 shared instance, pages/widgets 금지
```

---

## 7. Field Registry — 최소 구현 스펙

### 7.1 Built-in types (G2)

```text
text, textarea, number, boolean, date, select
(+ media OR relation 중 1)
```

### 7.2 Registry API

```ts
fieldRegistry.register(registration: FieldTypeRegistration)
fieldRegistry.get(type: string): FieldTypeRegistration | undefined
// unknown → safe fallback component OR editor fail-fast with code
// register after seal → throw
```

### 7.3 Dynamic form/list

- **Form:** ContentTypeDefinition.fields map → registry.input  
- **List columns:** listView.columns OR defaults from titleField/status/updatedAt + registry.display  
- **Filters:** listView.filters + `useListFilterUrl` (cms-admin-ui 수치)  
- **금지:** `switch (field.type)` 가 page/widget/feature에 분산 (registry 구현 파일만 허용)

### 7.4 form-template-runtime과의 관계 (중요)

```text
JA form-template-runtime ≈ 고정 DetailInfoForm 격자 + 작성폼 템플릿
CMS Studio Field Registry ≈ ContentType 스키마 엔진

→ G2에서는 자체 FieldRenderer + antd/CmsInput 사용.
→ 레이아웃 토큰/DetailInfoForm 패턴은 P2+ 선택 차용.
→ 기존 JA 동의/이수증 템플릿을 Core ContentType으로 승격 금지.
```

---

## 8. Conformance fixture (범용성 증명)

### 8.1 Content types (JSON 또는 TS const — **core condition 금지**)

| key | 목적 | 예시 필드 |
|-----|------|-----------|
| `article-test` | 문서 | title(text), body(textarea), publishedAt(date) |
| `catalog-test` | 카탈로그 | name, price(number), category(select) |
| `event-test` | 이벤트 | title, startsAt(date), capacity(number) |

### 8.2 Manifest profiles

| Profile | brand | types | extension |
|---------|-------|-------|-----------|
| profile-generic-a | Brand A | article + catalog | none or sample |
| profile-generic-b | Brand B | event | custom field type 1 |

**동일 commit, core source diff 없이** 두 profile이 G4 통과해야 함.

### 8.3 Boundary terms (`config/cms-boundary-terms.txt`)

```text
JA Korea
UJAT
Gemini
1C-1S
교육받은 교사
지급조서
정산
```

core `app|pages|widgets|features|entities|shared` 에서 0건 (extension/fixture 제외).

---

## 9. 단계별 작업 지시 (GPT/개발자 실행 순서)

### Phase 0 — 계약만 (코드 최소)

1. 이 문서 + 05 v2 계약 타입 파일 생성  
2. `cms-boundary-terms.txt`  
3. ADR 한 장: “단일 Studio, app-clone 금지”  
4. BE 인터뷰 리스트: Entry API, capability, manifest endpoint (없으면 fixture 범위 합의)

**Stop if:** 고객별 app 복제 요구가 제품 결정이면 전략 재협의.

### Phase 1 — Shell (G1)

1. admin 셸 복사 → 도메인 삭제  
2. package name/port/env  
3. Providers 확장: Auth + Tenant + Manifest + Registry (stub OK)  
4. Layout 메뉴를 registry 결과 구독  
5. login 최소, protected layout  
6. `pnpm --filter cms-studio validate`  

**DoD:** 홈/빈 dashboard, 메뉴 2~3 generic, JA 폴더 0.

### Phase 2 — Dynamic Entry (G2)

1. `ContentTypeDefinition` loader (fixture)  
2. pages: content-list, content-editor (generic)  
3. widgets: dynamic-list, dynamic-form  
4. features/content-entry: service(Repository), hooks, query-keys  
5. built-in field registry 6+ types  
6. URL filter + cms-data-table + modal CRUD  
7. capabilities stub → hide create/delete  
8. conformance 3 schema 전부 동일 page 동작  

**DoD:** 05 v2 §17.3 체크리스트 전부.

### Phase 3 — Extension field (G3)

1. `extensions/conformance-sample` 에 `type: "rating"` 등 등록  
2. bootstrap allowlist  
3. core files **미수정**으로 schema에 필드 추가  

### Phase 4 — Second profile (G4)

1. profile-b brand/manifest  
2. automated or scripted switch  
3. cache isolation on tenant switch  

### Phase 5 — JA adopter (G5, 선택·지연)

1. JA 요구 1개 “generic metadata로 되는지” 평가표  
2. Yes → content type schema  
3. No → `extensions/jakorea`  
4. adapter: 기존 CMS DTO → EntryRepository  
5. **기존 apps/cms 화면 big-bang 이동 금지**

### Phase 6 — P2 product modules

media, taxonomy, locale, workflow actions metadata, revision, preview adapter — 05 v2 §15, roadmap P2.

---

## 10. Cursor / GPT 정적 검사 (반드시 실행)

```bash
STUDIO=apps/cms-studio
CORE="$STUDIO/src/pages $STUDIO/src/widgets $STUDIO/src/features $STUDIO/src/entities $STUDIO/src/shared"

# core → extension/JA/apps
rg -n "apps/(cms|admin)/src|@jakorea/domain|extensions/jakorea|@/extensions" $CORE
# bootstrap 등록 파일만 extension import 예외 — 수동 확인

# JA product folders
find "$STUDIO/src" -type d \( -name program -o -name settlement -o -name payment -o -name trained-teachers \)

# boundary terms
# while read term; do rg -n -F "$term" $CORE; done < config/cms-boundary-terms.txt

# page/widget axios
rg -n "axios\.|api\.(get|post|put|patch|delete)" "$STUDIO/src/pages" "$STUDIO/src/widgets"

# field.type switch diffusion
rg -n "switch\s*\([^)]*field\.type" "$STUDIO/src" -g "*.tsx"

# env scatter
rg -n "import\.meta\.env" "$STUDIO/src" -g "!**/environment.ts"

# silent catch
rg -n "catch\s*\([^)]*\)\s*\{\s*\}" "$STUDIO/src"

pnpm --filter cms-studio typecheck
pnpm --filter cms-studio lint
pnpm --filter cms-studio build
```

기대: core 경로 0건 위반 + validate pass.

---

## 11. 안티패턴 (GPT가 자주 하는 실수)

| 실수 | 올바른 대안 |
|------|-------------|
| `features/article`, `features/product` 생성 | generic content-entry + schema |
| cms program feature “유사 목록” 복사 | 목록 셸만 admin에서; 데이터는 schema |
| menu에 고객사 이름 하드코딩 | manifest navigation |
| `if (contentType.key === 'event-test')` | schema ui / listView |
| form-template-runtime을 ContentType 엔진으로 교체 | Field Registry 신규; runtime은 선택 레이아웃 |
| admin homepage feature 포함 | 삭제 후 Studio |
| multi-tenant 없이 “범용 완성” 선언 | G4 second profile 필수 |
| BE 없이 capability 무시 | stub capability 객체로라도 guard |
| remote plugin URL 로드 | build-time allowlist only |

---

## 12. BE / OpenAPI 체크리스트 (프론트 병행)

BE 없으면 fixture로 G2까지 가능. 실연동 전 합의:

```text
[ ] GET  /manifest?tenant=
[ ] GET  /content-types , GET /content-types/:id
[ ] GET  /content-types/:id/entries?filters
[ ] POST/PUT/PATCH/DELETE entry
[ ] GET  /me → capabilities[]
[ ] (opt) POST preview, GET revisions, media upload
[ ] error shape: code, message, fieldErrors, conflict.version
```

Repository interface가 SSOT. 생성 Orval client는 **adapter 계층**에만; widgets가 Orval 직접 import 금지.

---

## 13. 의사결정 트리 (착수 전 1회)

```text
Q1. 다고객·콘텐츠 모델 런타임이 제품 목표인가?
  NO → Admin Kit 복제 (01~04, apps/<name>, Item CRUD). 이 08 중지.
  YES → Q2

Q2. monorepo 안인가 밖인가?
  IN  → apps/cms-studio 추가 (이 문서 §3~9)
  OUT → empty Vite monorepo or standalone; admin shared/ui 복사 + 동일 Core 계약

Q3. BE 준비?
  NO  → fixture Repository, G2 먼저
  YES → adapter + OpenAPI

Q4. JA 교육 도메인 포함?
  NO  → extension/jakorea 스킵
  YES → G5 이후, core 금지
```

---

## 14. GPT용 첫 프롬프트 템플릿 (복붙)

```text
문서:
- docs/admin-platform-kit/08-gpt-handoff-generic-cms-new-project.md (우선)
- (또는) Downloads의 05-generic / 06-jakorea-generic / 07-validation
- .cursor/rules/cms-admin-ui/**

목표: apps/cms-studio 생성, 범용 schema-driven CMS (프로젝트별 app/feature 복제 금지)

Phase 1 작업:
1. apps/admin 셸 선별 복사 후 homepage features/entities/pages 삭제
2. package name cms-studio, validate 통과
3. Auth/Tenant/Manifest/Registry provider stub + bootstrap order
4. core routes skeleton only

금지: apps/cms feature 복사, @jakorea/domain in core, content-type별 page

출력: 작업 분류, 파일 계획, 완료 후 validate 결과.
```

G2 프롬프트 시: “Dynamic Entry §6~8 계약 + conformance 3 schema + §10 rg”

---

## 15. 교차검증 최종 표 (GPT가 재보고할 때)

| 항목 | 판정 | 비고 |
|------|------|------|
| 05 v2 vs 06 v2 | Align | monorepo 실행 = Studio |
| 07 vs 05/06 v2 | Align | 구 Admin Kit 목표면 07 P0 “의도적 불합격” 정상 |
| 05 v2 vs 실제 admin | Applicable with gaps | auth/tenant 추가 필수 |
| 05 v2 vs 실제 cms | Patterns only | feature 비이식 |
| form-* as Field Engine | Not direct | registry 신규 |
| admin-ui 즉시 패키지화 | Defer | G6 / 반복 후 |
| 이 monorepo에서 Studio 가능 | **Yes** | `apps/cms-studio` greenfield + admin shell |
| JA CMS를 Studio로 즉시 대체 | **No** | G5 adapter, strangler |

---

## 16. 한 페이지 완료 정의

```text
[ ] 전략 = 범용 Studio (app clone 아님)
[ ] apps/cms-studio exists, JA feature paths = 0
[ ] admin UI shell/UI/list hooks present
[ ] registry seal + builtin fields
[ ] ONE list page + ONE editor page serve ≥3 content types
[ ] fixture or real EntryRepository
[ ] capability guards wired
[ ] second profile OR path-to-G4 planned
[ ] §10 checks pass
[ ] no packages/cms-* required yet
[ ] BE contracts listed or stubbed
```

**완료 선언 문구:**  
“동일 CMS Core가 schema/manifest/extension으로 제품 차이 수용하며, 새 content type 추가에 core page/feature 수정이 없다.”

---

**Last updated:** 2026-08-06  
**유지:** git 비추적 권장 (`docs/admin-platform-kit/` ignore). GPT 세션에 파일 첨부 또는 이 경로 지시.
