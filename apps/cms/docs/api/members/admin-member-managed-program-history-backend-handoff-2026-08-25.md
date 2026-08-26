# 관리자 상세 — 프로그램 담당 이력 API 스키마 보완 — 백엔드 전달

**작성일:** 2026-08-25  
**문서 유형:** **백엔드 수정 요청** (목록 API 스키마 확장 · 필터)  
**우선순위:** P1 (UI `-` placeholder 제거 · 필터 정합)  
**요청 대상:** Members API  
**관련 FE:** `admin-managed-program-history.tsx` · `map-member-admin-program.ts` · `useMemberAdminProgramsQuery` · `members-api-client.ts`  
**OpenAPI subset:** `apps/cms/openapi/members.openapi.json`

---

## 0. 백엔드 전달 필수 묶음 (본 문서 위치)

> [members/README.md §필수 묶음](./README.md#회원-상세-이력정산--백엔드-전달-필수-묶음) 7개 문서를 **한 zip**으로 전달합니다.

| # | 문서 | 본 문서와의 관계 |
|---|------|------------------|
| 1~3 | member-program-history · instructor · school | (타 회원 유형) |
| 4 | **본 문서** | 관리자 — ADM-001~007 |
| 5~6 | bulk-download · settlement UI fields | (관리자 담당 이력 **미해당**) |
| 7 | [cms-table-bulk-delete-api-backend-handoff.md](../cms-table-bulk-delete-api-backend-handoff.md) | **포함** — **ADM-007** = §5.1 **#15** 담당 프로그램 일괄 삭제 |

---

## 1. 요약

**질문:** CMS **관리자 상세** LNB 「프로그램 담당 이력」에서 **프로그램 진행 현황** · **참여자 모집 인원** · **교육 대상** 등이 remote 모드에서 `-`로 보이는 이유는 BE가 `"-"`/`null`을 내려주기 때문인가?

**답:** **아니오.** 현재 OpenAPI item 스키마에 **해당 필드가 존재하지 않음**. FE는 mock처럼 가짜 값을 넣지 않고 **미제공 시 `-` 표시** (2026-08-25 FE remote 1차 연동 정책).

| 영역 | 서버 조회 | UI 세부 일치 | BE 수정 ID |
|------|-----------|--------------|------------|
| 목록 · 프로그램명·진행년도 | ✓ (부분) | ◐ | ADM-001 |
| 목록 · 진행 현황 배지 | ✗ | ✗ | **ADM-002** |
| 목록 · 참여자 모집 인원 | ✗ | ✗ | **ADM-003** |
| 목록 · 참여자 유형 | ✗ | ✗ | **ADM-004** |
| 목록 · 교육 대상 | ✗ | ✗ | **ADM-005** |
| 목록 · server-side 필터 | ✗ | ◐ (client only) | ADM-006 |
| 이력 삭제 · 단건 | ✓ | ✓ | — (DELETE 연동됨) |
| 이력 삭제 · **일괄** | ✗ | ✗ | **ADM-007** ([bulk-delete §5.1 #15](../cms-table-bulk-delete-api-backend-handoff.md)) |

범례: ✓ 일치 · ◐ 부분 일치 · ✗ 불일치

---

## 2. 화면 범위

| 항목 | 값 |
|------|-----|
| 경로 | CMS 회원 목록 → **관리자** 상세 풀페이지 → LNB **프로그램 담당 이력** |
| 주체 ID | **`adminAccountId`** (SSOT) · fallback `memberId` (legacy path) |
| 컴ponent | `AdminManagedProgramHistory` |
| mock | `programRoles` · `programService` — **remote ON 시 미사용** |

### 2.1 LNB · API path (FE 2026-08-25)

| 조건 | 목록 GET | 삭제 DELETE |
|------|----------|-------------|
| `adminAccountId` 있음 (**일반**) | `GET /api/admin/admin-accounts/{adminAccountId}/program-roles` | `DELETE .../program-roles/{programId}` |
| `memberId`만 있음 (legacy) | `GET /api/admin/users/{memberId}/admin-programs` | `DELETE .../admin-programs/{programId}` |

관리자 목록 row는 **`adminAccountId`만** 포함하는 경우가 많음 → **admin-accounts path가 SSOT**.

### 2.2 테이블 열 (UI 1:1)

| UI 열 | remote 현재 | BE 필드 (요청) |
|-------|-------------|----------------|
| No. | ✓ (client) | — |
| 프로그램명 | ✓ `programName` | `programName` (기존) |
| 진행년도 | ◐ `assignedAt` 연도 | **ADM-001** `programStartDate` 또는 `progressYear` |
| **프로그램 진행 현황** | **`-`** | **ADM-002** `lifecycleStatus` |
| **참여자 모집 인원** | **`-`** | **ADM-003** `approvedStudentCount` + `recruitmentCapacity` |
| **참여자 유형** | **`-`** (또는 lifecycle 추론 1종) | **ADM-004** `participantType` |
| **교육 대상** | **`-`** | **ADM-005** `targetLevel` |

### 2.3 필터 (현재 client-side · server-side 권장 ADM-006)

| UI 필터 | query (권장) |
|---------|--------------|
| 프로그램명 | `title` 또는 `programName` (부분 일치) |
| 진행년도 | `year` (4자리 int) |
| 프로그램 진행 현황 | `lifecycleStatus` |
| 참여자 유형 | `participantType` |
| 교육 대상 | `targetLevel` |
| 페이지 | `page`, `size` (FE 1차: `size=200`) |

---

## 3. 현재 OpenAPI (✗ — UI 불충분)

### 3.1 공통 item 스키마

`MemberAdminProgramResponse` · `AdminProgramAssignmentResponse` — **동일 5필드**

| 필드 | 타입 | FE 사용 |
|------|------|---------|
| `assignmentId` | int64 | row 보조 id |
| `programId` | int64 | row id · 삭제 path · 프로그램 상세 이동 |
| `programName` | string | 프로그램명 열 |
| `assignmentRole` | string | 담당 역할 (OWNER 등) — **참여자 유형 아님** |
| `assignedAt` | date-time | 진행년도 **interim** (`assignedAt` 연도) |

**미포함 (UI `-` 원인):** `lifecycleStatus`, `approvedStudentCount`, `recruitmentCapacity`, `participantType`, `targetLevel`, `programStartDate`

### 3.2 FE 매핑 (interim)

`map-member-admin-program.ts` — OpenAPI 필드 + **확장 필드 optional** (`MemberAdminProgramResponseExtended` 패턴).  
BE 스키마 반영 후 FE mapper 수정 **최소화** (필드명 SSOT만 맞추면 됨).

---

## 4. 서버 수정 요청 목록 (SSOT)

| ID | 우선 | 화면/기능 | 현재 (갭) | **서버 수정 요청** | AC |
|----|------|-----------|-----------|-------------------|-----|
| **ADM-001** | P1 | 진행년도 | `assignedAt` 배정일 연도 사용 — 프로그램 시작 연도와 불일치 가능 | item에 `programStartDate`(ISO date) **또는** `progressYear`(int) | 목록만으로 `YYYY년` = 프로그램 시작 연도 |
| **ADM-002** | **P1** | **프로그램 진행 현황** | 필드 없음 → FE `-` | `lifecycleStatus` enum — CMS `ProgramLifecycleStatus` ↔ BE 매핑表 | staging에서 배지 100% 재현 ([§5.1](#51-lifecyclestatus--cms-배지)) |
| **ADM-003** | **P1** | **참여자 모집 인원** | 필드 없음 → FE `-` | `approvedStudentCount`(int) · `recruitmentCapacity`(int) | UI `"12 / 20"` · 모집 cap 없으면 `approvedStudentCount`만 |
| **ADM-004** | P1 | 참여자 유형 (열·필터) | `assignmentRole` ≠ 참여자 유형 | `participantType`: `SCHOOL` \| `VOLUNTEER` \| `INDIVIDUAL` (또는 BE enum + 매핑表) | 필터·열 라벨 일치 |
| **ADM-005** | **P1** | **교육 대상** | 필드 없음 → FE `-` | `targetLevel`: `ELEMENTARY` \| `MIDDLE` \| `HIGH` \| `UNIVERSITY` \| `ADULT` (또는 CMS `TargetLevel` 매핑) | UI 「초등학생」 등 라벨 |
| **ADM-006** | P2 | 필터 | URL query client filter only | ADM-002~005 필드 기준 **server-side** query (`title`, `year`, `lifecycleStatus`, `participantType`, `targetLevel`) | 필터 선택 시 API 건수 = UI 건수 |
| **ADM-007** | P2 | **이력 일괄 삭제** | UI `이력 삭제` · 단건 DELETE **N회** 또는 미연동 | [cms-table-bulk-delete §5.1 #15](../cms-table-bulk-delete-api-backend-handoff.md) — `POST .../admin-accounts/{adminAccountId}/program-roles/bulk-delete` `{ programIds[] }` (legacy path 동등) | 선택 행 1회 bulk · 부분 실패 UX |

### 4.1 BE 회신 요청

각 ADM ID에 **Accepted / Alternative / Deferred / Rejected** 회신.

---

## 5. 제안 응답 스키마 (item 확장)

`MemberAdminProgramResponse` · `AdminProgramAssignmentResponse` **동일 item** 유지 (두 path SSOT 일치).

```json
{
  "assignmentId": 1001,
  "programId": 42,
  "programName": "2026 경제교육",
  "assignmentRole": "OWNER",
  "assignedAt": "2026-01-15T09:00:00Z",
  "programStartDate": "2026-03-01",
  "progressYear": 2026,
  "lifecycleStatus": "EDUCATION_IN_PROGRESS",
  "approvedStudentCount": 12,
  "recruitmentCapacity": 30,
  "participantType": "SCHOOL",
  "targetLevel": "MIDDLE"
}
```

### 5.1 `lifecycleStatus` ↔ CMS 배지

FE: `getEnrollmentDisplayStatusFromProgramLifecycle(lifecycleStatus)` → `StatusBadge` (`domain=programEnrollment`).

| BE `lifecycleStatus` (제안) | CMS `ProgramLifecycleStatus` |
|----------------------------|------------------------------|
| `PLANNED` | `planned` |
| `RECRUITING_STUDENTS` | `recruiting_students` |
| `RECRUITING_VOLUNTEERS` | `recruiting_volunteers` |
| `VOLUNTEER_RECRUITMENT_PLANNED` | `volunteer_recruitment_planned` |
| `EDUCATION_IN_PROGRESS` | `education_in_progress` |
| `MATCHING_COMPLETED` | `matching_completed` |
| `EDUCATION_COMPLETED` | `education_completed` |
| `RECRUITMENT_CLOSED` | `recruitment_closed` |
| `CANCELLED` | `cancelled` |

> BE enum 확정 후 OpenAPI example + 매핑表 PR 첨부 (REQ-002 / PH-002와 동일 방식).

### 5.2 `participantType` ↔ UI 라벨

| BE | UI |
|----|-----|
| `SCHOOL` (또는 `INSTITUTION`) | 학교/기관 |
| `VOLUNTEER` | 봉사자 |
| `INDIVIDUAL` | 개인 학습자 |

### 5.3 `targetLevel` ↔ UI 라벨

| BE | UI |
|----|-----|
| `ELEMENTARY` | 초등학생 |
| `MIDDLE` | 중학생 |
| `HIGH` | 고등학생 |
| `UNIVERSITY` | 대학생 |
| `ADULT` | 성인 |

---

## 6. 이미 연동된 API (참고)

| Method | Path | FE 용도 |
|--------|------|---------|
| GET | `/api/admin/admin-accounts/{adminAccountId}/program-roles` | **관리자 상세 목록 SSOT** |
| GET | `/api/admin/users/{memberId}/admin-programs` | legacy member path |
| DELETE | `.../admin-accounts/{adminAccountId}/program-roles/{programId}` | 이력 삭제 (단건) |
| DELETE | `.../users/{memberId}/admin-programs/{programId}` | legacy 삭제 |

**미연동 (본 필수 묶음 #7):** 선택 행 **일괄 삭제** → **ADM-007** · [cms-table-bulk-delete-api-backend-handoff.md §5.1 #15](../cms-table-bulk-delete-api-backend-handoff.md)

---

## 7. FE 후속 (ADM 완료 후)

| ADM | FE 파일 | 상태 (2026-08-25) |
|-----|---------|-------------------|
| ADM-001~005 | `map-member-admin-program.ts` | 확장 필드 매핑 **준비됨** · OpenAPI codegen 후 타입 반영 |
| ADM-001~005 | `admin-managed-program-history.tsx` | remote `-` placeholder · BE 필드 수신 시 자동 표시 |
| ADM-006 | `admin-managed-program-table.config.ts` | client filter → server query 전환 |
| — | `useMemberAdminProgramsQuery` | adminAccountId path **✅** |

---

## 8. BE 스모크 검증 (AC)

- [ ] **ADM-002:** 관리자 상세 → 담당 프로그램 이력 — 모든 행 **진행 현황 배지** non-empty (해당 fixture)
- [ ] **ADM-003:** `approvedStudentCount` / `recruitmentCapacity` → UI `"N / M"` 일치
- [ ] **ADM-005:** `targetLevel` → UI 교육 대상 라벨
- [ ] **ADM-004:** 참여자 유형 열·필터
- [ ] **ADM-001:** `progressYear` 또는 `programStartDate` → 진행년도 ≠ `assignedAt` 연도 (데이터 있는 경우)
- [ ] **ADM-006:** 필터 조합별 `totalElements` = UI 건수

---

## 9. 관련 문서

| 문서 | 용도 |
|------|------|
| [members/README.md §필수 묶음](./README.md#회원-상세-이력정산--백엔드-전달-필수-묶음) | BE zip 구성 SSOT (#4 본 문서 · #7 bulk-delete) |
| [admin-member-server-modification-request-2026-08-12.md](./admin-member-server-modification-request-2026-08-12.md) | 관리자 계정 CRUD · `adminAccountId` |
| [cms-table-bulk-delete-api-backend-handoff.md §5.1 #15](../cms-table-bulk-delete-api-backend-handoff.md) | **ADM-007** 담당 프로그램 bulk-delete |
| [member-program-history-ui-api-parity-backend-handoff-2026-08-25.md §3 REQ-002](./member-program-history-ui-api-parity-backend-handoff-2026-08-25.md) | 진행 현황 enum 매핑表 (공통 SSOT) |

---

**Last updated:** 2026-08-25 (ADM-007 bulk-delete를 필수 묶음 #7에 통합 · §0 추가)
