# BE 수정 요청 — 프로그램 목록 4카드 `periodStatus` / 테이블 `lifecycleStatus` 불일치

**작성일:** 2026-09-17  
**상태:** ✅ BE 반영 · FE 핸드오프 적용 (2026-09-17)  
**BE 핸드오프:** JABACK `docs/frontend/programs-list-period-lifecycle-parity-frontend-handoff-2026-09-17.md`  
**우선순위:** P0 — 목록 상단 카드 건수 ≠ 테이블「프로그램 진행 현황」·전체 건수  
**대상 화면:**
- CMS 일반 프로그램 `/programs/general`
- CMS 1사1교 `/programs/company-school`
**대상 API:** `GET /api/admin/programs`  
**관련 문서:**
- [programs-api-integration.md](./programs-api-integration.md) §목록 쿼리·4카드
- [programs-api-backend-gaps.md](./programs-api-backend-gaps.md) §P0 4카드
- [programs-general-list-missing-fields-backend-request-2026-09-15.md](./programs-general-list-missing-fields-backend-request-2026-09-15.md) §B overview-counts
- [company-school-primary-fe-adapter-2026-09-15.md](./company-school-primary-fe-adapter-2026-09-15.md)

## FE 반영 (핸드오프)

| 항목 | 상태 |
|------|------|
| OpenAPI `backend.openapi.json` BE 스냅샷 동기화 | ✅ |
| `ProgramResponse.periodStatus` / `recruitmentStatus` (logs codegen 수동 반영 — orval validation 블로커) | ✅ |
| 4카드 = `periodStatus` `totalElements` (합 강제 정규화 없음) | ✅ 유지 |
| 테이블 라벨 = typed `lifecycleStatus` | ✅ 유지 |
| `RECRUITING` ≠ 참여자 모집 (`recruitmentStatus` 분리) 주석·문서 | ✅ |
| 1사1교 예정 = `SCHEDULED`∪`RECRUITING` | ✅ 기존 FE |

### 로컬 시드 기대 분포 (BE 핸드오프)

| 프로그램 | 예정 | 진행 중 | 완료 |
|----------|------|---------|------|
| GENERAL `168001~168008` | 4 (`168003,168004,168005,168007`) | 3 (`168001,168002,168006`) | 1 (`168008`) |
| COMPANY_SCHOOL `170001~170003` | 1 (`170001`/2027) | 1 (`170002`/2026) | 1 (`170003`/2025) |

CMS UI 기대: 일반 전체 8 · 예정 4 · 진행 3 · 완료 1 (합=8). 1사1교 전체 3 · 예정 1 · 진행 1 · 완료 1.

---

## 백엔드 전달용 프롬프트 (이력)

아래 재현을 기준으로 `GET /api/admin/programs`의 **`periodStatus` 필터 버킷이 서로 배타적이 되도록**, 그리고 **목록 item의 `periodStatus`와 `lifecycleStatus`가 동일 진행 단계로 정합**되도록 수정해 주세요.

CMS FE는 상단 4카드 건수를 `periodStatus`별 `totalElements`로 집계하고, 테이블「프로그램 진행 현황」컬럼은 item의 `lifecycleStatus`(없으면 `periodStatus` 폴백)로 표시합니다. 두 필드·필터가 어긋나면 카드 숫자와 행 라벨·전체 건수가 동시에 틀어집니다. FE는 카드 축을 `periodStatus`로, 행 라벨 축을 typed `lifecycleStatus`로 고정하므로, **서버에서 두 값을 같은 제품 버킷으로 유지**해야 합니다.

---

## 1. 실측 현상 (CMS UI)

### 1.1 일반 프로그램 `/programs/general`

| 카드 | 표시 |
|------|------|
| 전체 | 8 |
| 예정 (`periodStatus=RECRUITING`) | 4 |
| 진행 중 (`periodStatus=IN_PROGRESS`) | 8 |
| 완료 (`periodStatus=COMPLETED`) | 0 |

- 예정+진행+완료 = **12 > 전체 8** → `periodStatus` 필터가 **배타 분할이 아님**(동일 프로그램이 복수 버킷에 포함되거나, 필터 구현이 OR/중복 집계).
- 테이블「프로그램 진행 현황」은 **8행 모두「프로그램 진행 중」** (`lifecycleStatus` → UI `IN_PROGRESS` 버킷).
- 따라서 카드「예정 4」와 행 라벨이 동시에 성립할 수 없음 → **목록 item의 `lifecycleStatus`와 `periodStatus` 불일치** 또는 **RECRUITING 필터가 IN_PROGRESS 행을 포함**.

### 1.2 1사1교 `/programs/company-school`

| 카드 | 표시 |
|------|------|
| 전체 | 3 |
| 예정 (`SCHEDULED`∪`RECRUITING`) | 1 |
| 진행 중 (`IN_PROGRESS`) | 3 |
| 완료 (`COMPLETED`) | 1 |

- 예정+진행+완료 = **5 > 전체 3** → 동일하게 버킷 겹침.
- 테이블 진행 현황 라벨과 카드「진행 중 3」이 일치하지 않음.

### 1.3 FE가 이미 맞춘 부분 (1사1교)

1사1교 **예정** 카드와 **예정** 목록 필터는 FE에서 `SCHEDULED`∪`RECRUITING` 합집합(id 중복 제거)으로 정합했습니다.  
**일반·1사1교 공통으로 남은 문제는 BE `periodStatus` 배타성 + `lifecycleStatus` 정합**입니다.

---

## 2. FE 계약 (변경하지 말 것)

### 2.1 4카드 ↔ 목록 필터

| UI 카드 / URL `status` | GENERAL `periodStatus` | COMPANY_SCHOOL `periodStatus` |
|------------------------|------------------------|-------------------------------|
| 전체 | (생략) | (생략) |
| 예정 `scheduled` | `RECRUITING` | `SCHEDULED` **또는** `RECRUITING` (합집합) |
| 진행 중 `in_progress` | `IN_PROGRESS` | `IN_PROGRESS` |
| 완료 `completed` | `COMPLETED` | `COMPLETED` |

요청 예:

```http
GET /api/admin/programs?programType=GENERAL&page=0&size=1
GET /api/admin/programs?programType=GENERAL&page=0&size=1&periodStatus=RECRUITING
GET /api/admin/programs?programType=GENERAL&page=0&size=1&periodStatus=IN_PROGRESS
GET /api/admin/programs?programType=GENERAL&page=0&size=1&periodStatus=COMPLETED

GET /api/admin/programs?programType=COMPANY_SCHOOL&page=0&size=1
GET /api/admin/programs?programType=COMPANY_SCHOOL&page=0&size=20&periodStatus=SCHEDULED
GET /api/admin/programs?programType=COMPANY_SCHOOL&page=0&size=20&periodStatus=RECRUITING
GET /api/admin/programs?programType=COMPANY_SCHOOL&page=0&size=1&periodStatus=IN_PROGRESS
GET /api/admin/programs?programType=COMPANY_SCHOOL&page=0&size=1&periodStatus=COMPLETED
```

### 2.2 테이블「프로그램 진행 현황」표시 매핑 (typed lifecycle)

| `lifecycleStatus` (권장) | UI 라벨 |
|--------------------------|---------|
| `scheduled` / `recruiting_students` | 프로그램 진행 예정 |
| `in_progress` | 프로그램 진행 중 |
| `completed` | 프로그램 진행 완료 |

`periodStatus` → 동일 UI 버킷 폴백:

| `periodStatus` | typed lifecycle 폴백 |
|----------------|----------------------|
| `SCHEDULED` | `scheduled` |
| `RECRUITING` | `recruiting_students` |
| `IN_PROGRESS` / `RUNNING` | `in_progress` |
| `COMPLETED` / `ENDED` | `completed` |

---

## 3. 요청 사항

### 3.1 `periodStatus` 필터 — 상호 배타

동일 `programType`·동일 기타 필터 조건에서:

1. `periodStatus`를 생략한 `totalElements`를 **전체**로 둔다.
2. `RECRUITING`(및 COMPANY_SCHOOL의 `SCHEDULED`) / `IN_PROGRESS` / `COMPLETED`에 속하는 프로그램 집합은 **서로 교집합이 없어야** 한다.
3. 수용 기준 (GENERAL):

```text
count(RECRUITING) + count(IN_PROGRESS) + count(COMPLETED) ≤ count(전체)
```

이상적으로는 임시저장·기타 상태가 없다면 합 = 전체.  
**합 > 전체는 버그**로 간주한다.

4. COMPANY_SCHOOL도 동일:

```text
count(SCHEDULED ∪ RECRUITING) + count(IN_PROGRESS) + count(COMPLETED) ≤ count(전체)
```

`SCHEDULED`와 `RECRUITING` 사이 교집합도 없어야 한다(같은 id가 두 값으로 중복 카운트되면 안 됨).

### 3.2 목록 item 필드 정합

각 list item에 대해:

1. `periodStatus`와 `lifecycleStatus`를 **둘 다** 내려준다(가능하면).
2. 두 값이 §2.2 표의 **같은 UI 버킷**을 가리켜야 한다.
   - 예: `periodStatus=RECRUITING`이면 `lifecycleStatus`는 `recruiting_students`(또는 `scheduled`)만 허용. `in_progress` 금지.
   - 예: `periodStatus=IN_PROGRESS`이면 `lifecycleStatus`는 `in_progress`만 허용.
3. Primary/로컬 demo seed(일반 · 1사1교 ONE-01/02/03)도 위 규칙에 맞게 수정한다.

### 3.3 (선택) overview-counts API

카드용으로 4회 목록 호출 대신 1회 집계 API를 제공해도 된다.  
계약은 [programs-general-list-missing-fields-backend-request-2026-09-15.md](./programs-general-list-missing-fields-backend-request-2026-09-15.md) §B와 동일해야 하며, **버킷 경계는 §3.1과 동일**해야 한다.

---

## 4. 수용 기준 (QA)

- [ ] GENERAL: `RECRUITING`+`IN_PROGRESS`+`COMPLETED`의 `totalElements` 합 ≤ 전체 `totalElements`
- [ ] COMPANY_SCHOOL: `(SCHEDULED∪RECRUITING)`+`IN_PROGRESS`+`COMPLETED` 합 ≤ 전체
- [ ] `periodStatus=RECRUITING`(또는 SCHEDULED)로 조회한 모든 item의 진행 UI 버킷이 **예정**
- [ ] `periodStatus=IN_PROGRESS`로 조회한 모든 item의 진행 UI 버킷이 **진행 중**
- [ ] CMS `/programs/general` · `/programs/company-school`에서 카드 숫자와 해당 카드 클릭 후 목록 행「프로그램 진행 현황」라벨이 모순되지 않음
- [ ] OpenAPI/`periodStatus` enum · seed 주석에 배타 규칙 명시

---

## 5. FE 측 참고 (수정 범위)

| 항목 | 상태 |
|------|------|
| 1사1교 예정 카드·목록 `SCHEDULED`∪`RECRUITING` 집합 정합 | FE 반영 (`1c-1s/api/list-params.ts`, `service.ts`) |
| 일반 4카드 `RECRUITING`/`IN_PROGRESS`/`COMPLETED` | 계약 유지 — **BE 배타·정합 필요** |
| 테이블 라벨 SSOT = typed `lifecycleStatus` | 유지 — **BE가 period와 맞출 것** |

FE만으로 카드 합 > 전체·행 라벨 불일치를 고칠 수 없습니다. 서버 필터·필드 정합이 필요합니다.
