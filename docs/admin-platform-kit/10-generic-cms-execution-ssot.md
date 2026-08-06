# 10r1 — 범용 CMS Studio 실행 아키텍처 SSOT (수정본)

> **문서 ID:** 10r1  
> **상태:** **실행 SSOT (Execution)**  
> **기준일:** 2026-08-06  
> **Supersedes (계약 영역):** Downloads 원본  
>   `10-generic-cms-implementation-architecture-cursor-crosscheck.md` 의 §6·§10.2·§12.3·§7.4·extensionIds·Gate 의미  
> **본 문서로 합쳐진 정정:** 문서 12·14·15·16 교차검증 합의  
> **원본 10 보존 용도:** 긴 구현 계획·Cursor 프롬프트 템플릿·전체 Gate 작업 리스트 — 충돌 시 **10r1 계약이 우선**

---

## 0. 사용 규칙

### 0.1 적용 분기

```text
고객별 CRUD 어드민 납품?  → Admin Kit (이 문서 중지)
다고객·schema CMS 제품?  → 이 문서 SSOT
```

### 0.2 저장소

```text
구현 저장소: 신규 generic-cms (별도 레포 권장)
참조 저장소: JaKorea apps/admin 셸·UI 패턴 (구현하지 않음, feature 복사 금지)
```

### 0.3 SSOT 우선순위

```text
1. 승인 제품 요구·보안·BE API 계약
2. 이 문서 10r1 (계약·Gate·경계)
3. 신규 repo ADR
4. cms-admin-ui 수치 규칙
5. 코드
6. AI 관례
```

원본 10 · 11~16 · 이 이전 consensus evidence는 **evidence** 이다. 구현 충돌 시 10r1 우선.

### 0.4 document revision

| 필드 | 값 |
|------|-----|
| revision | 10r1 |
| basedOn | 원본 문서 10 |
| changelog | G0 계약 패치 (capability·preservation·query keys·ExtensionReference·activation·Gate 명칭·raw/validated config) |
| supersedesClaim | 원본 10의 해당 절 |

---

# 1. 제품 결정 (유지)

한 줄: **새 Content Type 추가 시 Core page/feature/router 수정 없이 schema·manifest·extension으로 동작한다.**

- 단일 Studio · schema-driven List/Editor  
- Registry: Field · Route · Menu · Action · Extension  
- API = Repository Adapter 뒤  
- 권한 = capability / available action (role name 비교 금지)  
- extension = build-time allowlist  
- G4 전 “범용 CMS 완성” 선언 금지  

---

# 2. Gate 의미 (확정)

| Gate | 명칭 | 의미 |
|------|------|------|
| G0 | Contract & Boundary | 타입·신뢰 경계·도구 선택 고정 |
| G1 | Studio Shell | 독립 실행 shell |
| G2 | Functional Architecture Prototype | fixture 3 schema CRUD (**production 아님**) |
| G3 | Extension Conformance | Core 수정 없이 custom field |
| G4 | Portable Architecture MVP | profile A/B + cache 격리 (**아키텍처 범용 검증**) |
| G5 | Production Integration Ready | REST/Auth/Authorization/Security/Ops |
| G5.1 | Optional Legacy Adapter | JA 등, 제품 완료 조건 아님 |
| G6 | Product Modules & Promotion | media/workflow/packages |

### Legacy mapping (문서 08 대비)

| 08 (참고) | 10r1 |
|-----------|------|
| G5 JA adopter | G5.1 Optional (비필수) |
| G5 실API 없음 명시 | **G5 = Production Integration** |
| G6 packages | G6 + product modules |

---

# 3. Core 계약 (G0 SSOT)

## 3.1 Version 의미 분리

| 필드 | 의미 |
|------|------|
| `CmsManifest.schemaVersion` | **프로토콜** 호환 (string, 예 `"1"` 또는 semver `"1.0.0"` — repo ADR로 하나 고정) |
| `ContentTypeDefinition.version` | **콘텐츠 스키마** 버전 (number 권장); form/list cache·migration |

알 수 없는 manifest.schemaVersion → bootstrap fail-fast.

## 3.2 Capability 분리

```ts
export interface ContentTypeCapabilities {
  canReadList: boolean;
  canCreate: boolean;
}

export interface EntryCapabilities {
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  availableActions: string[];
}

export interface ContentTypeDefinition {
  id: ContentTypeId;
  key: string;
  version: number;
  name: string;
  titleFieldId: FieldId;
  fields: FieldDefinition[];
  listView?: ListViewDefinition;
  editor?: EditorDefinition;
  capabilities?: ContentTypeCapabilities; // list/create UX
  requiredCapabilities?: string[];        // soft UI hints only
  workflowId?: string;
  localization?: LocalizationDefinition;
}

export interface ContentEntry {
  id: EntryId;
  contentTypeId: ContentTypeId;
  tenantId: TenantId;
  workspaceId?: WorkspaceId;
  locale: LocaleCode;
  values: Record<FieldId, unknown>;
  status: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  capabilities: EntryCapabilities; // never canCreate on entry
}
```

목록 “등록” 버튼 → `ContentTypeCapabilities.canCreate`.  
행 수정/삭제 → `EntryCapabilities`.

## 3.3 FieldDefinition (요약)

```ts
export interface FieldDefinition {
  id: FieldId;       // ContentEntry.values key, immutable
  key: string;
  type: string;      // registry key
  label: string;
  required?: boolean;
  readOnly?: boolean;
  defaultValue?: unknown;
  validation?: unknown; // raw; runtime schema parse G1+
  ui?: unknown;
  settings?: unknown;
  localized?: boolean;
}
```

## 3.4 Round-trip preservation (G0 차단 · 데이터 안전)

```text
Unknown field (Registry miss):
  - optional → Editor에 read-only / Unsupported 표시 가능; values 유지
  - required → 저장 차단

Update semantics (택 1 이상을 ADR로 고정):
  A) PATCH: known changed fields only; server merges; unknown server-side values preserved
  B) PUT with client reassembly: payload must include ALL prior values including unknown keys
  C) Server merge flag: client sends full known values + "preserveUnknown: true"

금지:
  - known fields only serialize → full replace → silent drop of unknown optional values

필수 테스트:
  - fixture schema + unknown optional key survival after edit of another field
  - extension removed / schema downgrade round-trip
```

## 3.5 Extension 계약

### Raw (manifest / wire 입력 경계)

```ts
export interface RawExtensionReference {
  id: string;
  versionRange?: string;
  required?: boolean;
  /** 입력 경계에서는 unknown 허용 */
  config?: unknown;
}

export interface CmsManifest {
  schemaVersion: string;
  profileId: ProfileId;
  brand: { name: string; logoUrl?: string };
  enabledModules: string[];
  navigation?: NavigationDefinition[];
  contentTypeSources: ContentTypeSource[];
  extensions: RawExtensionReference[]; // string[] 금지
}
```

### Resolved (Extension 실행 경계)

```ts
export interface ResolvedExtensionReference<TConfig = unknown> {
  id: string;
  required: boolean;
  version: string; // resolved package version
  config: TConfig; // schema parse 완료만
}
```

### 활성 조건 (4중 교집합)

```text
activation =
  manifest RawExtensionReference present
  ∩ build-time bundled allowlist (id → package)
  ∩ core / versionRange compatibility
  ∩ extension config runtime schema validation PASS

rules:
  required missing/incompatible/invalid config → bootstrap fail-fast
  optional fail → degraded mode (documented UI)
  config cast as T without parse → forbidden
```

Extension registry register 시점에는 `ResolvedExtensionReference`만 허용.

## 3.6 EntryRepository

원본 10과 동일 의도:

```ts
list / get / create / update / remove / executeAction
```

UI·page·widget은 axios/Orval 금지. Adapter 내부만 HTTP client.

---

# 4. Query keys (도메인별)

## 4.1 Factory (G0 계약)

| Factory | 필수 context | 비고 |
|---------|--------------|------|
| `cmsKeys.session()` | 없음 | tenant 확정 전 |
| `cmsKeys.manifest(tenantId, profileId)` | tenant, profile | |
| `cmsKeys.contentTypes(tenantId, workspaceId?, locale?)` | tenant | workspace optional |
| `cmsKeys.contentType(tenantId, workspaceId?, locale, contentTypeId, schemaVersion)` | + type + version | schema bump 무효화 |
| `cmsKeys.entryLists(tenantId, workspaceId?, locale, contentTypeId)` | root for lists | |
| `cmsKeys.entryList(ctx, normalizedFilters)` | + page/sort/filters | applied URL only |
| `cmsKeys.entryDetail(ctx, entryId)` | + entryId | |
| `cmsKeys.actions(ctx, entryId)` | + entryId | if cached separately |
| `cmsKeys.media…` / relation | 해당 도메인 문서화 | G6 전 stub 가능 |

규칙: **동일 context bag을 모든 factory에 강제하지 않는다.**

## 4.2 Invalidation map (최소)

| 이벤트 | invalidate / remove |
|--------|-------------------|
| logout / unauthenticated | 모든 cmsQueries removeQueries |
| tenant switch | 이전 tenant prefix remove |
| profile / manifest reload | manifest + contentTypes + lists |
| schema version change | contentType + entryList + entryDetail that type |
| entry create/update/delete | that type lists + detail |
| locale switch | locale-bearing keys only |

---

# 5. Registry & Field (요약)

- FieldTypeRegistration: Input, Display, normalize, serialize, validate, getDefaultValue  
- field.type switch: **registry 구현 / schema compiler 외 금지**  
- contentType.key 조건문: **Core 전역 검사 대상**; allowlist: schema compiler · registry · migration adapter only  

---

# 6. Bootstrap 순서

```text
env → auth → tenant/profile → manifest (schemaVersion) →
content schemas → register builtins →
resolve extensions (4-way) → seal registries →
router/menu compose → render
```

상태 분리: initializing / unauthenticated / loading-manifest / incompatible / registry-failure / ready.

---

# 7. 경계·검증

## 7.1 Import 방향

```text
core pages/widgets/features/entities/shared -X→ extension impl
shared -X→ features/pages
entities -X→ features
adapters -X→ pages/widgets private
bootstrap/register-extensions.ts ONLY places import extensions
```

G0: ESLint boundaries / dependency-cruiser **선택**.  
G1: CI 강제.

## 7.2 rg 보조 스크립트

- `register-extensions.ts` glob exclude 유지  
- `rg | rg` 금지: 각 명령 exit 2 전파 / 임시 파일 후 필터  
- regex만으로 Gate 합격 금지  

## 7.3 Content-type condition scan

- G0: allowlist 정책 문서화  
- G1/G2 전: Core 전역 scan 구현  

---

# 8. G0 / G1·G2 체크리스트

### G0 (계약·정책 — 시작 전 닫기)

```text
[ ] 10r1 commit in new repo docs/architecture
[ ] Capability 분리 타입
[ ] Preservation / update merge ADR
[ ] ExtensionReference raw+resolved + 4-way activation
[ ] Query key table + invalidation map
[ ] Boundary tool choice
[ ] Pipefail script fix intent
[ ] Gate naming + legacy map
[ ] Condition allowlist policy
```

### G1 / G2 전 (구현)

```text
[ ] Core-wide condition scan + real allowlist paths
[ ] Boundary CI on
[ ] dependency closure evidence format
[ ] G1 unit minimal: seal, version reject, bootstrap states
[ ] validation/ui/settings runtime schemas
[ ] fixture names per 10r1 / 원본 10 fixtures
```

### G2 DoD (fixture)

3 schemas · one list page · one editor · no per-type pages · no page axios · preservation tests green.

### G4 DoD

profile A/B same commit · no Core diff · cache isolation.

### G5 DoD

REST · real auth/capability · no secrets in logs · security checklist.

---

# 9. JaKorea 이식 (요약)

| 허용 | 금지 |
|------|------|
| admin providers, layout, Cms*, list filter hooks | features/program, settlement, JA template product |
| form-* 레이아웃 참고 | form-* as Field Engine |
| rich-text as field candidate | `@jakorea/domain` in Core |
| — | VITE_REAL_API_MODULES / data/mock matrix |

이식 PR에 full commit SHA + command log 없으면 monorepo “실측” 주장 금지 (UNVERIFIED).

---

# 10. 원본 10 참조 맵

충돌 시 **이 문서 10r1 우선**. 그 외 상세:

| 주제 | 원본 10 |
|------|---------|
| 디렉터리 트리 · FSD | §4–5 |
| Dynamic List URL | §10 |
| Dynamic Editor UX | §11 |
| Auth layers | §12 (canCreate는 이 문서) |
| Security | §14 |
| Conformance fixtures 이름 | §16 (새 repo는 이 문서 fixture명 고정) |
| Gate 작업 단계 장문 | §17 (의미는 이 문서 §2) |
| Cursor 프롬프트 · PR 양식 | §18–23 |
| 정적검사 스크립트 초안 | §19 (pipe/exclude 주의는 이 문서 §7) |

---

# 11. Evidence 계보

```text
10 (원본)  → 상세 설계·프롬프트 (비 SSOT if conflict)
11~16      → validation evidence
10r1       → **실행 SSOT**
15         → consensus 초안 → 10r1 존재 후 강등 가능
```

### Evidence 수렴 상태

```text
수정 요구 합의: 완료 (12–16)
실행 SSOT 파일: 10r1 = 본 문서 (생성)
신규 repo 커밋 + TypeScript scaffold 동기화: 아직 제품 작업
→ “구현 착수 Gate 닫힘” 선언은 10r1 + G0 checklist 닫힌 뒤
```

---

# 12. Cursor / GPT 구현 전 고정 출력

```text
[Gate] G0 | G1 | …
[SSOT] 10r1 path + revision
[분류] Core | Extension | Adapter | Config | UI Platform
[계약 변경] yes/no + 절
[금지] per-type page · core→ext · page axios · role name · unsafe config cast
```

---

**Last updated:** 2026-08-06  
**파일 (이 monorepo 로컬):** `docs/admin-platform-kit/10-generic-cms-execution-ssot.md`  
**신규 CMS repo 권장 경로:** `docs/architecture/10-generic-cms-execution-ssot.md`
