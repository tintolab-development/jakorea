---
priority: medium
category: process
---

# UJAT 프로그램 상세 — 기관 신청 > 기관 신청 목록

**Scope:** `ujat-program-detail-fullpage-modal` → LNB **기관 신청** → **신청 기관** (`inst_all`)  
**Code:** `application-institution/list/list.tsx`, `list/columns.tsx`, `education-schedule.ts`, `ujat-institution-application-mock.ts`, `list/use-list.ts`

**관련 탭:** [UJAT 프로그램 상세 — 모집 정보 3탭](./ujat-program-detail-recruitment-tabs.md)  
**신청 폼:** 템플릿 `application-ujat-school` — **UJAT 프로그램 학교 신청 폼** (`UJAT-institution` → `ujat-program-application-preferred-education-schedule-paragraph.tsx` · **교육 진행 희망일**)

---

## 화면 위치

| LNB | `tab` | 역할 |
|-----|-------|------|
| 기관 신청 > **신청 기관** | `inst_all` | 신청 목록·일괄 임시 배정·반려 (본 문서) |
| 기관 신청 > **신청 기관 임시 배정** | `inst_schedule_assign` | **상세 임시 배정** — [기획](./ujat-institution-schedule-assign-spec.md) |
| 기관 신청 > **임시 배정 기관 확인** | `inst_schedule_confirm` | 임시 배정 결과 확인 — [기획](./ujat-institution-schedule-confirm-spec.md) |

---

## 테이블 열 순서 (좌 → 우)

고정·스크롤 열 이후 **「총 신청 학급 수」 열의 우측**부터 날짜 열이 이어진다.

| 순서 | 열 | 비고 |
|------|-----|------|
| (선택) | 체크박스 | 일괄 액션 |
| 1 | No. | 역순 번호 |
| 2 | 신청 기관명 | |
| 3 | **임시 배정 현황** | ~~임시 배정 평가~~ |
| 4 | 학년 별 신청 학급 수 | `1학년 N학급 \| …` |
| 5 | **총 신청 학급 수** | 학년별 학급 수 합산 · `N학급` |
| 6… | **날짜 열** (아래 §) | 프로그램 진행일마다 1열 |
| 마지막 | 신청 교사명 | |

---

## 날짜 열 (교육 진행일)

### 열 헤더

- **정의:** 해당 **UJAT 프로그램이 진행되는 날짜**마다 독립 열 1개.
- **헤더 표기:** `M월 D일` (예: `4월 24일`).
- **데이터 소스:** 관리자가 프로그램 등록·교육 일정에서 설정한 **진행 가능일 / 세션 일자** 목록.  
  - mock: `UJAT_INSTITUTION_EDUCATION_PERIOD_MOCK` 기간 내 금요일 (`listFridayIsoDatesInPeriod`) — **API 연동 시 프로그램 실제 진행일 배열로 교체** (금요일만이 아닐 수 있음).
- **코드:** `UJAT_INSTITUTION_SCHEDULE_COLUMNS`, slot key = ISO `YYYY-MM-DD`.

### 셀 값 `O` / `-`

| 표시 | 의미 |
|------|------|
| **`O`** | 해당 기관이 **[UJAT 프로그램 학교 신청 폼]** 참여 신청 시 선택한 **「교육 진행 희망일」**에 포함된 날짜 |
| **`-`** | 해당 날짜 미선택 |

- 신청 폼 단락: `ujat-program-application-preferred-education-schedule-paragraph.tsx` (**교육 진행 희망일**).
- 목록 행: `scheduleSlots[isoDate] === 'O'`.
- 캘린더 뷰: `O`인 날짜만 일정 이벤트 (`ujat-institution-application-calendar-events.ts`).

### 총 신청 학급 수 (참고)

- **정의:** 해당 기관이 신청한 **모든 학년** 학급 수 **합산**.
- **표시:** `N학급`.
- **데이터:** `gradeClassCounts` 합 = `totalClassCount` · `sumGradeClassCounts()`.

---

## 임시 배정 열 · 상태

| 상태값 | UI 라벨 |
|--------|---------|
| `evaluation_pending` | 평가 대기 |
| `temp_rejected` | 임시 반려 |
| `temp_assigned` | **임시 배정** |
| `application_rejected` | 신청 반려 |

- 열 제목: **「임시 배정 현황」** (구 「임시 배정 평가」). 필터 라벨과 동일.
- 배지: `UjatInstitutionApplicationStatusBadge`.

---

## 일괄 액션 — [선택 임시 배정]

- **버튼:** 목록 상단 **「선택 임시 배정」** (`handleBulkTempAssign`).
- **시안 흐름:** `04. 일괄 임시 배정 안내`(9998:170445) 확인 → 선택 기관 상태 `temp_assigned`. 상세 단건은 `09-1. 임시 배정 안내 팝업`(10011:26249) → `09-2. 임시 배정 완료 팝업`(10011:27109, 「배정 완료 / 배정되었습니다.」)이 **상세 위**에 뜨고 → `10. 임시 배정`(10011:29600) 상세(신청 반려 / 임시 배정 취소 / 개인정보 상세보기)로 바뀐다.
- **구현:** 안내 팝업 확인 → `POST /api/admin/programs/{programId}/ujat/organization-applications/temporary-assignments` `{ applicationIds }`(단건도 길이 1, operationId `assignTemporaryOrganizationApplications`). **일정 배정 탭으로 자동 이동하지 않는다.** 서버는 `temporaryAssignmentStatus`만 `TEMP_ASSIGNED`로 두고 교육일 슬롯·기관 확인 알림은 만들지 않는다(`temporaryScheduleAssigned: false`).
- **선택 단계 차단:** 평가 대기(`evaluation_pending`) 행만 보낸다. 평가 대기가 없으면 「평가 대기 상태의 기관만 임시 배정할 수 있습니다.」 안내 후 팝업을 열지 않는다(임시 반려·신청 반려·이미 임시 배정 행 제외).
- **응답(부분 성공 200):** `{ requestedCount, successCount, failureCount, processed[], failures[] }`. `processed` 값으로 목록 캐시를 맞추고 팝업을 닫으면 재조회한다.
  - 실패 없음 + `successCount ≥ 1` → 「배정 완료 / 배정되었습니다.」
  - 실패 있음 → 「일부 처리 실패」(성공 0건이면 「처리 실패」) · `배정 N건 · 실패 M건` + `· 기관명: failures[].message`. **message는 서버 문구 그대로**(code로 분기, 재작성 금지).
  - 전체 400(`UJAT_TEMPORARY_ASSIGNMENT_APPLICATION_REQUIRED`/`_INVALID`)·403(`PERMISSION_DENIED`)은 기존 CMS 오류 안내(`readApiErrorAlertMessage`·전역 403 안내).
- **상세 배정:** 학급·교육일 등 **세부 배정은 [신청 기관 임시 배정]** 탭에서 기존 `PUT …/{applicationId}/temporary-schedule`로 저장한다. 상태만 임시 배정(일정 미배정)된 기관도 학교 선택 후보에 나온다(`schedule-assign/utils.ts` `listAssignableSchoolsForDate`). 저장 후에도 `temporaryAssignmentStatus`는 `TEMP_ASSIGNED`, `temporaryScheduleAssigned`만 `true`.
- **코드:** `api/temporary-assignments.ts`(로컬 타입 — OpenAPI 재생성 시 generated로 교체), `list/use-list.ts` `confirmBulkTempAssign`, `detail/detail-page.tsx`, `api/use-institution-application-detail.ts` `tempAssignRemote`/`tempAssignCancelRemote`.

### 임시 배정 상태 구분 (`temporaryScheduleAssigned`)

목록 `GET /api/admin/programs/{programId}/organization-applications`·상세 `GET /api/admin/organization-applications/{applicationId}`의 추가 필드 `temporaryScheduleAssigned`(`boolean | null`)가 일정 미배정/배정 완료 구분 SSOT다. `scheduleConfirmStatus`·`institutionConfirmationStatus`로 나누지 않는다.

| temporaryAssignmentStatus | temporaryScheduleAssigned | 화면(배지) | 상세 버튼 |
|---|---|---|---|
| `null` 또는 `EVALUATION_PENDING` | `null` | 평가 대기 | 신청 반려 · 임시 반려 · 임시 배정 · 개인정보 |
| `TEMP_ASSIGNED` | `false` | 임시 배정(일정 미배정) | 신청 반려 · 임시 배정 취소 · 개인정보 |
| `TEMP_ASSIGNED` | `true` | 임시 배정(일정 배정 완료, `CHECKING` 등) | 기존 유지(기관 확인 상태에 따라 최종 승인 등) |
| `TEMP_REJECTED` | `null` | 임시 반려 | 신청 반려 · 임시 반려 취소 · 개인정보 |

- 평가 대기 배지·필터는 `null`과 `EVALUATION_PENDING`을 같이 포함한다(`applications-adapters.ts` `mapOrgStatusToTempAssignment`).
- 일정 미배정 상세는 `ujat-institution-approval-workflow.ts`에서 주 버튼(`open_schedule_assign`·`final_approve`)을 열지 않는다.

### 임시 배정 취소 — 호출 분기

| 상세 상태 | 호출 | 결과 |
|---|---|---|
| `TEMP_ASSIGNED` + `temporaryScheduleAssigned === false` | `POST …/temporary-assignments:cancel` `{ applicationIds }` (operationId `cancelTemporaryOrganizationAssignments`) | `EVALUATION_PENDING`, `temporaryScheduleAssigned: null` |
| `TEMP_ASSIGNED` + 활성 슬롯 있음(`true`) | 기존 `PUT …/{applicationId}/temporary-schedule` `{ slots: [] }` | 일정 해제, `temporaryAssignmentStatus: null` |

- `POST …/temporary-rejections:cancel`은 `TEMP_REJECTED` 전용 — 임시 배정 취소에 쓰지 않는다.
- 취소 POST도 부분 성공 200 — 실패면 `failures[].message`를 그대로 안내하고 재조회한다.
- 상태만 임시 배정하는 POST와 취소 POST는 알림을 보내지 않는다. 기관 확인 요청 알림(`UJAT_ORGANIZATION_SCHEDULE_SUBMITTED`)은 일정 PUT 저장 때 발송된다.

### 기타 일괄 버튼

| 버튼 | 안내 팝업(시안) | 결과 상태 | 완료 팝업 |
|------|----------------|-----------|-----------|
| 선택 신청 반려 | `02. 프로그램 신청 일괄 반려 안내 팝업`(9998:168903) | `application_rejected` | 「반려 완료 / 반려되었습니다.」 |
| 선택 임시 반려 | `03. 일괄 임시 반려 안내 팝업`(9998:169674) | `temp_rejected` | 「임시 반려 완료 / 선택한 (N개) 기관에 임시 반려가 반영되었습니다.」 — 시안에 일괄 완료 팝업 프레임이 없어 기존 문구 유지 |

결정 모달: `list/action-modal.tsx` · `PermissionModal` (`variant`: reject / approve) — 신청 반려, 기관 승인(임시 배정 기관 확인 상세). 임시 반려·임시 배정·각 취소 안내는 `temporary-action-modal.tsx`(`temporary-action-copy.ts`).

### 신청 기관 상세 — 임시 처리 후 동작

상세에서 실행한 **임시 반려 · 임시 반려 취소 · 임시 배정 취소 · 신청 반려**는 성공 시 **목록으로 이동하지 않고 상세에 머문다.** 완료 팝업을 상세 위에 띄우고, 상세·임시 일정 쿼리 무효화(서버 재조회)로 임시 배정 현황 배지와 버튼이 바뀐다.

| 동작 | 시안 | 완료 팝업 |
|------|------|-----------|
| 임시 반려 | `06-1` 안내(10011:25797) → `06-2` 완료(10011:26779) → `07. 임시 반려`(10011:30068) | 「반려 완료 / 반려되었습니다.」 |
| 임시 반려 취소 | `08` 안내(10011:30540) — 완료 팝업 프레임 없음 | 기존 「임시 반려 취소 완료 / 임시 반려가 취소되어 평가 대기로 돌아갔습니다.」 |
| 임시 배정 취소 | `11` 안내(10011:31476) — 완료 팝업 프레임 없음 | 기존 「임시 배정 취소 완료 / 임시 배정이 취소되어 평가 대기로 돌아갔습니다.」 (호출 분기는 위 표) |
| 신청 반려 | `12` 안내(10011:25137) | 「반려 완료 / 반려되었습니다.」 |
| 임시 배정 | `09-1` → `09-2` → `10` | 「배정 완료 / 배정되었습니다.」 — `POST temporary-assignments`, 팝업을 닫으면 상세 재조회 |

- 일정 저장 이후 기관이 수정 요청한 임시 배정(`REVISION_REQUESTED`)의 주 버튼은 기존대로 [신청 기관 임시 배정] 탭으로 이동한다(상태 POST 대상 아님).

---

## 구현 메모

- 테이블 `scroll.x`: 선택 + 본문 열 너비 합(좌측 `fixed` 없음) + `92px × 날짜 열 수`.
- API 연동 시:
  - 프로그램 **진행일 목록** → 날짜 열 동적 생성.
  - 기관별 **교육 진행 희망일** → `O`/`-` 매핑.
  - **선택 임시 배정** → `POST temporary-assignments`(상태만), 일정은 `PUT temporary-schedule`.
- 필터 「임시 배정 현황」: 상태 라벨과 동일 용어 유지.

---

## 신청 기관 상세 — 기본 정보

- **레이아웃:** `DetailInfoForm` — (1) **임시 배정 현황**, (2) **기본 정보**.
- **교육 진행 희망일:** 상세 조회에 신청 폼과 동일한 날짜 목록 표시 (`ujat-institution-application-detail-view.tsx`).
- **임시 배정 현황 색:** 목록과 동일 배지 CSS.
- **개인정보 마스킹** (`personalInfoRevealed` 전): Tel·M 가운데 4자리 `*`, E-mail `@` 앞 3자리+`***`. 기관 소재지·상세 주소는 마스킹 없음.

---

## TODO (코드 ↔ 기획 갭)

- [x] 열 제목 **`임시 배정 현황`** (`ujat-institution-application-columns.tsx` · 필터와 동일)
- [ ] 날짜 열: mock 금요일 → **프로그램 진행일** API
- [x] `temp_assign` 확인 → 상태만 `POST temporary-assignments` (교육일·학급 배정 데이터는 [신청 기관 임시 배정] 탭 `PUT temporary-schedule`)
- [x] `inst_schedule_assign` 상세 배정 UI — [ujat-institution-schedule-assign-spec.md](./ujat-institution-schedule-assign-spec.md)

---

**Last updated:** 2026-11-16
