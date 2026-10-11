# CMS api-spec-mock·스타일 위임 이관 SSOT

이관일: 2026-10-10
원본 수: 4

원본 경로 목록:

- `apps/cms/.cursor/rules/data/api-spec-mock.md`
- `apps/cms/.cursor/rules/process/styling-token-refactor-delegation.md`
- `apps/cms/docs/api/api-spec-mock-detailed.md`
- `apps/cms/docs/api/api-spec-mock-extended.md`

---

### Source: `apps/cms/.cursor/rules/data/api-spec-mock.md`

---
priority: medium
always_include: false
category: data
---

# API spec summary (mock era)

실 백엔드 연동·경로·`apiClient` 규칙은 [api-routes-and-client.md](./api-routes-and-client.md) 및 [api-routes-and-client.md (docs)](../../../docs/api/api-routes-and-client.md) 를 참고한다.

> Full contracts live in [api-spec-mock-detailed.md](../../../docs/api/api-spec-mock-detailed.md) and [api-spec-mock-extended.md](../../../docs/api/api-spec-mock-extended.md).

## Global

- **Base path:** `/api`  
- **Format:** `application/json`; dates as ISO strings  
- **Errors:** `400` validation, `404` missing, `500` server  

Shared domain types: see `apps/cms/src/types/domain.ts`.

## Entity index (mock services)

| Domain | Base | Service file |
|--------|------|----------------|
| Sponsor | `/api/sponsors` | `entities/sponsor/api/sponsor-service.ts` — deletion policy: [sponsor-delete-policy.md](../process/sponsor-delete-policy.md) |
| School | `/api/schools` | `entities/school/api/school-service.ts` |
| Instructor | `/api/instructors` | `entities/instructor/api/instructor-service.ts` |
| Program | `/api/programs` | `entities/program/api/program-service.ts` |
| Application | `/api/applications` | `entities/application/api/application-service.ts` |
| Schedule | `/api/schedules` | `entities/schedule/api/schedule-service.ts` |
| Matching | `/api/matchings` | `entities/matching/api/matching-service.ts` |
| Settlement | `/api/settlements` | `entities/settlement/api/settlement-service.ts` |
| Application path | `/api/application-paths` | + `data/mock/application-paths.ts` |
| Report | `/api/reports` | `entities/report/api/report-service.ts` |

**Misc endpoints:** todos, mypage summary, activities — see detailed doc.

## Related

- [mock-data.md](./mock-data.md)  

**Last updated:** 2026-04-21


---

### Source: `apps/cms/.cursor/rules/process/styling-token-refactor-delegation.md`

---
priority: high
always_include: false
category: process
---

# Styling token refactor — developer handoff

**Goal:** Replace hard-coded colors/spacing in CMS CSS/inline styles with tokens from `theme-provider.css` (`var(--*)`). See [styling-tokens.md](../design/styling-tokens.md) and [persona.md](./persona.md).

## Scope

- Tokens live in `src/app/providers/theme-provider.css`.  
- Applies to global CSS, layout, features, pages, and TSX `style={{}}` where values are static.

## Status (summary)

- **P0** — `index.css`, `sidebar.css`, `main-header.css` — done.  
- **P1** — `app-button.css`, `teal-header-modal.css`, `filter-controls-common.css` — done.  
- **P2** — dashboard, program, schedule, auth, headers, modals — largely done per checklist in repo.  
- **P3** — inline styles in TSX: migrate to CSS + `var(--*)` or `style={{ color: 'var(--token)' }}` for high-traffic surfaces.

## Rules

- Third-party overrides: comment exceptions.  
- Missing token → add to `theme-provider.css` first.  
- Ensure `theme-provider.css` loads before consumers that reference tokens.

## Checklist

- [x] P0–P2 major files  
- [ ] P3 inline constants reduced per plan  
- [x] New styles follow [styling-tokens.md](../design/styling-tokens.md)

**Last updated:** 2026-04-21


---

### Source: `apps/cms/docs/api/api-spec-mock-detailed.md`

# JAKorea CMS Mock 기반 API 명세 (상세 버전)

> 이 문서는 현재 CMS 프론트엔드 코드(`entities/*/api`, `entities/*/model`, `data/mock/*`, `types/domain.ts`)와  
> [MVP_ROADMAP_V4_DETAILED.md](../roadmap/MVP_ROADMAP_V4_DETAILED.md) 및 요구사항 명세에 정의된 **기본 기능**을 기준으로 한  
> **실제 Mock 서비스와 1:1로 매핑 가능한 상세 API 스펙**입니다.

**참고**: 개발 시 빠른 참조를 원하시면 [API 명세 요약](../.cursor/rules/data/api-spec-mock.md)을 참고하세요.

---

## 0. 공통 규칙

- **Base URL**: `/api`
- **형식**
  - Request / Response Body: `application/json`
  - 날짜/시간: ISO 8601 문자열 (예: `"2025-01-20T10:00:00.000Z"`)
- **에러 처리 (공통 가이드)**
  - `404 Not Found`: 리소스 미존재
  - `400 Bad Request`: 유효성 오류(Zod 스키마 위반 등)
  - `500 Internal Server Error`: 예기치 못한 서버 오류

### 0.1 공통 타입 (요약)

- `UUID`: 문자열
- `Status`: `'active' | 'inactive' | 'pending' | 'completed' | 'cancelled'`
- `DateValue`: ISO 문자열

도메인 전체 정의는 `apps/cms/src/types/domain.ts` 참고.

---

## 1. 스폰서(Sponsor) API

- 도메인 타입: `Sponsor` (`types/domain.ts`)
- Mock 서비스: `entities/sponsor/api/sponsor-service.ts`

리소스 경로: `/api/sponsors`

### 1.1 목록 조회

- **GET** `/api/sponsors`
- **Query**
  - (현재 Mock 기준: 없음, 추후 `name` 검색 등 확장 가능)
- **Response** `200 OK`

```json
[
  {
    "id": "sponsor-001",
    "name": "기업 A",
    "description": "설명",
    "contactInfo": "연락처",
    "securityMemo": "보안 메모",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-02T00:00:00.000Z"
  }
]
```

### 1.2 단건 조회

#### Marker lines (excerpt)
```
리소스 경로: `/api/schools`
리소스 경로: `/api/instructors`
리소스 경로: `/api/programs`
      "programId": "prog-001",
서버는 각 회차에 `id`, `programId`를 부여하고 `createdAt`, `updatedAt`을 설정.
- **PATCH** `/api/programs/{programId}/rounds/{roundId}`
  - `Partial<Omit<ProgramRound, 'id' | 'programId'>>`
리소스 경로: `/api/applications`
  - `programId?: UUID`
  "programId": "prog-001",
  "programId": "prog-001",
리소스 경로: `/api/schedules`
  - `programId?: UUID`
  "programId": "prog-001",
  "programId": "prog-001",
    "programId": "prog-001",
리소스 경로: `/api/matchings`
  - `programId?: UUID`
  "programId": "prog-001",
  "programId": "prog-001",
리소스 경로: `/api/settlements`
  - `programId?: UUID`
  "programId": "prog-001",
## 9. 신청 경로(ApplicationPath) API (기본)
> V3 Phase 7에서 정의된 신청 경로 타입.  
리소스 경로: `/api/application-paths`
  - `programId?: UUID`
  "programId": "prog-001",
리소스 경로: `/api/reports`
  "programId": "prog-001", // 프로그램 보고서일 경우
  - `programId?: UUID`
> 자세한 UI 요건은 `MVP_ROADMAP_V2.md` / `V3.md`의 Phase 5 및 `mypage.ts`, `todos.ts`, `activities.ts` 참고.
- **GET** `/api/todos?userId={userId}`
- **PATCH** `/api/todos/{id}`
  - `primaryStatus`, `todos`, `upcomingSchedules`, `historySummary` 등 반환
```

---

### Source: `apps/cms/docs/api/api-spec-mock-extended.md`

## JAKorea CMS Mock 기반 API 명세 (Extended Version)

> 이 문서는 `API_SPEC_MOCK_BASED.md`의 **기본 Mock 호환 스펙**을 확장하여,  
> [MVP_ROADMAP_V4_DETAILED.md](../roadmap/MVP_ROADMAP_V4_DETAILED.md) 및 요구사항에 정의된 확장·고도화 범위의  
> **신규/고도화 요구사항을 모두 포함한 API 설계 초안**입니다.  
> 실제 백엔드 구현 시, 여기서 정의된 엔드포인트 중 우선순위를 논의하여 MVP → 확장 순으로 단계적 구현을 권장합니다.

---

## 0. 전제 및 네이밍 규칙

- Base 스펙 (`API_SPEC_MOCK_BASED.md`)에 있는 엔드포인트는 그대로 유지합니다.
- Extended 버전은 **주로 추가 엔드포인트/파라미터/응답 필드**를 정의합니다.
- Base와 중복되는 내용은 간단히 “Base 참조”로 표기합니다.

### 0.1 상태/역할 관련 공통 원칙 (사용자 화면 프롬프트 기반)

`MVP_ROADMAP_V2.md` / `V3.md`의 공통 UI 원칙을 API 관점에 맞게 정리:

- **상태는 Enum 기반으로만 전달**하고, 프론트는 이 Enum을 그대로 **문장/문구로 매핑**해야 함.
- **서버가 상태를 결정**하고, 프론트는 절대 Enum을 추론/생성하지 않음.
- `reason_public`은 의미 변경/요약 없이 그대로 노출해야 하므로, API에서 별도 필드로 제공.
- CTA 대상 URL은 `targetUrl`로 서버에서 내려주고, 프론트는 **경로만 사용**(의미 판단 X).

---

## 1. 정산 관리 고도화 (Phase 4.2)

> V3: Phase 4.2 “정산 관리 고도화”
>
> - 월별 정산, 강사별 정산 상세, 지급조서 생성/다운로드, 승인 워크플로우, 일사일교 룰 반영 등

Base의 `/api/settlements` 스펙을 확장합니다.

### 1.1 월별 정산 목록

- **GET** `/api/settlements/monthly`
- **Query**
  - `year`: 숫자 (예: `2025`)
  - `month`: 숫자 (1~12)
  - `programId?: UUID`

- **Response** `200 OK`

```json
{
  "year": 2025,
  "month": 1,
  "summary": {
    "totalSettlements": 35,
    "totalAmount": 123456789,
    "byStatus": {
      "pending": 5,
      "calculated": 10,
      "approved": 8,
      "paid": 10,
      "cancelled": 2
    }
  },
  "items": [

#### Marker lines (excerpt)
```
      "programId": "prog-001",
  - `programId?: UUID`
      "programId": "prog-001",
- **리소스 경로**: `/api/settlement-rules`
  - `programId?: UUID`
    "programId": "prog-001",
  "programIds": ["prog-001", "prog-002"],
  - `programId?: UUID`
  "programIds": ["prog-001", "prog-002"],
- **리소스 경로**: `/api/doc-templates`
## 3. 신청 경로 관리 (Phase 7)
### 3.1 프로그램별 신청 경로 설정
- **GET** `/api/programs/{programId}/application-path`
  - 해당 프로그램의 활성화된 신청 경로 0~1개 반환
- **PUT** `/api/programs/{programId}/application-path`
  "programId": "prog-001",
  "programId": "prog-001",
  "programId": "prog-001",
  - `programId?`, `region?`, `specialCategory?`
      "programId": "prog-001",
  "programId": "prog-001",
  - `type?`, `userId?`, `programId?`
  "programId": "prog-001",
- **리소스 경로**: `/api/certificate-templates`
  - `GET /api/mypage/summary` (primaryStatus, todos, upcomingSchedules, historySummary)
  - `GET /api/todos/{id}`, `PATCH /api/todos/{id}` + `targetUrl` 기반 내비게이션
```

---
