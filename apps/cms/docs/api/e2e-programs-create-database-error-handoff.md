# 일반 프로그램 등록 · `DATABASE_ERROR` — 백엔드 수정 요청

CMS E2E **일반 프로그램 신규 등록** 시 `POST /api/admin/programs` 가 **HTTP 500 / `DATABASE_ERROR`** 를 반환합니다.  
FE는 스텁 없이 실 API만 호출하므로, 이 오류가 해소되기 전까지 `test:e2e:programs` 목록 검증(등록 후 목록 행)이 실패합니다.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-07-20 |
| **도메인** | `programs` |
| **우선순위** | **P0** |
| **화면** | `/programs/general?new=1` → 「프로그램 등록 완료」 |
| **Method / Path** | `POST /api/admin/programs` |
| **에러 코드** | `DATABASE_ERROR` |
| **HTTP** | `500` |
| **FE remote** | `VITE_REAL_API_MODULES` 에 `programs` |
| **관련 계약** | [programs-create-api-backend-handoff.md](./programs-create-api-backend-handoff.md) · [programs-registration-flow-api-backend-handoff.md](./programs-registration-flow-api-backend-handoff.md) |
| **인덱스** | [e2e-backend-fixes-index.md](./e2e-backend-fixes-index.md) |

---

## 1. 관측 요약

| | |
|---|---|
| **상황(FE 로그)** | 일반 프로그램 등록 · 신청 정보 / 등록 완료 |
| **요청** | `POST /api/admin/programs` |
| **응답 메시지(관측)** | `database operation failed` (또는 래퍼 `DATABASE_ERROR: …`) |
| **재현** | `pnpm --filter cms test:e2e:programs` |

응답 예시 형태(공통 ApiResponse 래퍼):

```json
{
  "success": false,
  "data": null,
  "message": "DATABASE_ERROR: database operation failed",
  "error": {
    "code": "DATABASE_ERROR",
    "message": "database operation failed",
    "field": null,
    "traceId": "<서버 traceId>"
  }
}
```

> `traceId` 는 실행마다 다릅니다. 최신 값은 E2E 실패 시 터미널·`e2e-error-log-latest.json`·`/e2e-error-log` 에서 확인하세요.

---

## 2. FE가 보내는 body (핵심 필드)

매퍼: `mapGeneralProgramToCreateRequest`  
(`features/program/general/api/adapters/general-program-adapters.ts`)

| 필드 | FE 전송 | 비고 |
|------|---------|------|
| `programType` | `"GENERAL"` | 필수 |
| `sponsorId` | **string** (목록에서 고른 후원사 id) | OpenAPI string · FE는 `String(sponsorId)` |
| `title` / `mainTitle` | E2E 고유 국문 제목 | |
| `titleEn` | 영문 제목 | |
| `category` | `"individual"` 등 | CMS 카테고리 |
| `lifecycleStatus` | 등록 스냅샷 기준 (예: recruiting 계열) | |
| `startDate` / `endDate` | ISO datetime | |
| `businessStartDate` / `businessEndDate` | create 전용 · start/end mirror | |
| `applicationStartDate` / `applicationEndDate` | ISO | |
| `rounds[]` | 회차 배열 | schedule 매핑 대상 |
| `autoApplyDefaultFormBindings` | `true` | 양식 바인딩 BE 자동 |
| `serviceDetailJson` | CMS nested JSON string | round-trip 기대 |
| `contactEmail` / `contactPhone` / `venue` 등 | 위저드 입력 | |

**E2E에서 확인된 전제**

- 요청에 **실존 후원사 `sponsorId`** 가 포함됨 (목록 API에서 선택).
- FE apply form-bindings 호출 **없음** (`autoApplyDefaultFormBindings: true` 에 의존).

---

## 3. 의심 포인트 (BE 점검 요청)

OpenAPI·기존 핸드오프상 create 계약은 “완료”로 표기되어 있으나, **스테이징/로컬 실호출에서 DB 계층 500**이 납니다. 아래를 우선 확인해 주세요.

1. **`sponsorId` 타입·FK** — string으로 온 id가 DB 컬럼/조인에서 실패하는지  
2. **`rounds[]` ↔ schedule 영속** — 회차 insert 시 FK·NOT NULL·날짜 제약  
3. **`autoApplyDefaultFormBindings`** — 기본 양식 바인딩 트랜잭션/시드 부재로 롤백되는지  
4. **`serviceDetailJson` / `category` / `lifecycleStatus`** — 컬럼·체크 제약·enum 불일치  
5. **사업 기간(`business*`) vs 회차 기간** — 회차가 사업 기간 밖이면 DB 트리거/체크가 터지는지  
6. **서버 로그** — 동일 `traceId` 의 SQLException / constraint name 공유

기존 create 계약 문서의 체크리스트 중 미완:

- [ ] 스테이징 수동 QA (JWT create → list → detail) — [programs-create-api-backend-handoff.md §7](./programs-create-api-backend-handoff.md)

---

## 4. 기대 동작 (수락 기준)

| # | 시나리오 | 기대 |
|---|----------|------|
| 1 | CMS 위저드 「프로그램 등록 완료」 | `POST /api/admin/programs` **1회**, `success: true` |
| 2 | 응답 | 안정적 프로그램 id (`data.id` 또는 동등) |
| 3 | 직후 목록 | `GET` 목록에 방금 등록한 `title` 행 존재 |
| 4 | 실패 시 | `DATABASE_ERROR` 대신 **원인 필드·제약**이 드러나는 4xx 또는 명확한 business error code |

---

## 5. FE 임시 대응

| 항목 | 상태 |
|------|------|
| 성공 스텁 | **사용 안 함** (실 API만) |
| E2E | BE 수정 전 `test:e2e:programs` 실패 가능 |
| 에러 가시화 | `/e2e-error-log` · 터미널 덤프 |

---

## 6. 연락·재현 정보

```bash
pnpm --filter cms test:e2e:programs
# 실패 시: apps/cms/test-results/e2e-error-log-latest.json
# 또는 http://localhost:3000/e2e-error-log
```

**Last updated:** 2026-07-20
