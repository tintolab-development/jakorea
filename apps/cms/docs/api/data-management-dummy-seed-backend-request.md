# 데이터 관리 더미 시드 요청 (BE)

CMS LNB **데이터 관리** 3화면(후원사·교재·세부 프로그램)을 FE mock과 동일하게 검증할 수 있도록 더미 시드를 요청합니다.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-26 |
| **대상 화면** | `/sponsor` · `/textbook` · `/detailed-program` |
| **모듈 플래그** | `VITE_REAL_API_MODULES=sponsors,textbooks,detailedPrograms` |
| **연동 명세** | [data-management-api-integration.md](./data-management-api-integration.md) |
| **갭** | [data-management-api-backend-gaps.md](./data-management-api-backend-gaps.md) |

OpenAPI에 bulk create POST가 없습니다. local profile **Flyway** / `LocalDemoSeedRunner`로 **UPSERT** 해 주세요.

---

## 0. 페이로드

| 도메인 | FE SSOT | 건수 | BE 복붙 |
|--------|---------|------|---------|
| 후원사 | [`sponsor-management-list.ts`](../../src/data/mock/sponsor-management-list.ts) + [`sponsor-management-detail.ts`](../../src/data/mock/sponsor-management-detail.ts) | ~131 + detailSamples | [`sponsors-seed.payload.json`](./sponsors-seed.payload.json) |
| 교재 | [`textbook-mock-store.ts`](../../src/features/textbook/api/textbook-mock-store.ts) `TEXTBOOK_LNB_SEED_ROWS` | 22 | [`textbooks-seed.payload.json`](./textbooks-seed.payload.json) |
| 세부 프로그램 | [`detailed-program-management-list.ts`](../../src/data/mock/detailed-program-management-list.ts) | 13 | [`detailed-programs-seed.payload.json`](./detailed-programs-seed.payload.json) |

재생성(FE):

```bash
cd apps/cms && WRITE_DATA_MANAGEMENT_SEED=1 pnpm test -- src/features/data-management/lib/data-management-seed.test.ts
```

FE 정합: 동일 vitest (env 없이) — payload ↔ mock.

---

## 1. 시드 순서

```text
sponsors_upsert
  → sponsor_contacts (detailSamples[].contacts)
  → yearly_businesses (detailSamples[].yearlyBusinesses)
  → program_histories demo (detailSamples[].programHistories; program FK는 힌트)
textbooks_upsert → material_kits_global (textbookId null, 1회)
detailed_programs_upsert
→ program_seed FK 점검 (후원사·교재·세부 프로그램 이름/ID)
```

---

## 2. 후원사 상세 child (`detailSamples[]`)

목록 `rows[]`와 별도로, **대표 1건**(목록 선두 `sponsor-list-001` / 제이에이코리아)에 상세 mock을 붙입니다.

| child | SSOT export | 건수 | 비고 |
|-------|-------------|------|------|
| `contacts` | `SPONSOR_DETAIL_SEED_CONTACTS` | 3 | lead 1 + assistant 2 |
| `yearlyBusinesses` | `SPONSOR_DETAIL_SEED_YEARLY_BUSINESSES` | 1 | `donationAmount=91500000`, `beneficiaryCount=915` (시안 누적값) |
| `programHistories` | `SPONSOR_DETAIL_SEED_PROGRAM_HISTORIES` | 8 | `participantType`: school / individual / **volunteer** |

`programHistories[].programIdHint`는 FE mock 프로그램 id입니다. DB 프로그램 PK와 맞춰 링크하거나, 로컬 데모용으로 이력만 insert 하세요.

나머지 목록 행은 **목록 필드만** upsert하고, child는 대표 샘플 1건으로 상세 UI를 검증하면 됩니다(전 행에 동일 child 복제 금지).

---

## 3. 중복·충돌 체크리스트 (필수)

### 후원사

1. 사업자등록번호 / 국문명 / 영문명 **정규화 후 unique**.
2. 기존 프로그램 seed의 `sponsorId`(예: CS-28)와 **동일 행이면 UPDATE/UPSERT**, 새 filler는 미사용 id 대역(`suggestedNumericId` 800001…).
3. [`sponsors.ts`](../../src/data/mock/sponsors.ts) 30건(프로그램 폼) ∩ management-list: **이름 매칭으로 1:1 고정 후 시드 1회만**. LNB payload와 폼 mock을 합쳐 insert 하지 말 것.
4. contacts: 주 담당자(`contactType=lead`)는 후원사당 1명.
5. yearly: 동일 `(sponsorId, businessYear)` unique upsert.

### 교재

1. `nameKo`(+사업분야·대상·학년) unique.
2. 실적/프로그램 seed의 `textbookNameKo`와 문자열 일치 행은 **같은 textbookId**로 upsert.
3. 키트는 **전역 1개** (`textbookId` null). 교재 22건마다 kit 복제 금지.

### 세부 프로그램

1. mock `dp-*`는 DB PK로 쓰지 않음 → `suggestedNumericId` (`dp-131` → `900131`).
2. 실적 seed `detailedProgramNameKo`와 이름 충돌 시 **이름 기준 upsert**.
3. 센티널 `__detailed_program_none__` / `__ujat_volunteer_core__`는 **마스터 테이블에 insert 금지**.

### 교차

- 후원사–연도별 후원금 / 담당자는 후원사 PK 확정 후 child seed.
- 프로그램 seed FK는 위 3마스터 upsert 이후에 검증.

---

## 4. 필드 힌트

### 후원사 (`rows[]`)

| payload | API/DB 힌트 |
|---------|-------------|
| `nameKo` / `nameEn` | `SponsorRequest` |
| `organizationKind` | `corporate` \| `foundation` |
| `sponsorshipStatus` | `active` \| `ended` |
| `sponsorshipStartDate` | ISO date |
| `mainContact` | contacts child (주 담당자 1명) |

### 후원사 상세 (`detailSamples[]`)

| payload | API/DB 힌트 |
|---------|-------------|
| `contacts[].contactType` | `lead` \| `assistant` |
| `yearlyBusinesses[].donationAmount` | number |
| `programHistories[].participantType` | `school` \| `individual` \| `volunteer` |
| `programHistories[].lifecycleStatus` | planned / education_in_progress / education_completed |

### 교재 (`rows[]`)

| payload | API/DB 힌트 |
|---------|-------------|
| `nameKo` | `nameKo` |
| `businessArea` / `educationTarget` / `grade` | 목록 필터와 동일 문자열 |
| `useStatus` | `USED` \| `UNUSED` |

### 세부 프로그램 (`rows[]`)

| payload | API/DB 힌트 |
|---------|-------------|
| `suggestedNumericId` | PK |
| `nameKo` | `nameKo` |
| `useYn` | boolean |
| `seedKey` | FE 표시 맵용 (`dp-*`), DB에 저장 불필요 |

---

## 5. 검증

1. `GET /api/admin/sponsors?organizationKind=corporate` — 기업 건수·국문명.
2. 대표 후원사 `GET …/sponsors/{id}` — contacts 3, yearly embed/목록에 91500000·915.
3. `GET …/sponsors/{id}/program-histories` — 8건(또는 링크된 프로그램만), participantType 포함.
4. `GET /api/admin/textbooks?size=500` — 22건.
5. `GET /api/admin/detailed-programs?size=500` — 13건.
6. CMS LNB 3화면 remote 모듈 ON 후 목록·상세 필터 스모크.
7. 프로그램 등록 폼 후원사 옵션이 LNB와 **의도적으로 다를 수 있음**(폼은 options API) — B-5 전까지 혼동 주의.
