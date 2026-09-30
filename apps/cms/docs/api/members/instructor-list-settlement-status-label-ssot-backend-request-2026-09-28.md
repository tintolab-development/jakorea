# BE 수정 요청 — 강사 회원 목록·상세 `settlementStatusLabel` FE 8종 SSOT

**작성일:** 2026-09-28  
**문서 성격:** **이 파일만** 보고 구현·검수 가능  
**대상 API (P0):**

- `GET /api/admin/instructors` — 강사 회원 목록 (`listInstructors`)
- `GET /api/admin/users/{memberId}/instructor` — **강사 회원 상세** (`getInstructorMemberDetail`)
- `GET /api/admin/settlements?instructorMemberId=` — **강사 상세 정산 현황 탭** (`listSettlements`)
- 목록·상세 요약 — **`listMetrics.settlementStatusLabel`** (동일 집계·동일 문자열). 탭 건별 — **`statementStatus` + `paymentStatus`** (§3.5)

**관련 (별 계약·이미 snake_case):**

- `GET /api/admin/programs/{programId}/participants?participantType=INSTRUCTOR` — `settlementStatus` UI key  
  → [general-organization-institution-remote-gaps-backend-request-2026-09-16.md §G-2](../general-organization-institution-remote-gaps-backend-request-2026-09-16.md)  
  **회원 목록과 프로그램 참여 강사는 동일 8종 의미·서로 다른 필드명**이지만, **집계 로직·상태 판정은 하나의 도메인 SSOT**로 맞출 것.

**FE SSOT (코드):**

- `apps/cms/src/shared/constants/instructor-settlement-status.ts` — `InstructorSettlementUiStatus` · `INSTRUCTOR_SETTLEMENT_STATUS_LABELS`
- UI 규칙: `apps/cms/.cursor/rules/design/instructor-settlement-status.mdc`

---

## 백엔드 전달용 프롬프트

CMS **강사 회원 목록** 「정산 현황」 열과 **회원 상세 기본정보** 정산 문구가, 대부분 `-` 또는 회색 plain text로만 보인다.

**원인:** 응답 `listMetrics.settlementStatusLabel`이 FE가 정의한 **8종 canonical 한글 라벨**과 다르다.  
FE는 (1) canonical과 **완전 일치**할 때만 공통 색·컴ponent를 쓰고, (2) 알려진 BE 별칭만 임시 매핑한다. 그 외(`정산 전` 등)는 문구만 표시하거나 `-`에 가깝게 보인다.

**요구:** 강사 회원 **목록 enrich·필터·상세 조회**에서 `settlementStatusLabel`을 아래 **8문구 중 하나**로만 내릴 것(또는 해당 없음은 필드 omit / 빈 문자열 — §3).  
**금지:** BE 전용 표기(`정산 전`, `재신청 검토 중`, `계좌 지급 대기 중` 등)를 목록·**상세** API에 계속 내리는 것.  
FE alias·plain fallback에 의존하지 말 것 — **BE 응답이 SSOT**여야 목록·필터·**상세 기본정보 「정산 현황」** 색상이 일치한다.

**상세 필수:** 목록에서 들어오지 않은 **직링크·새로고침**(`GET …/instructor` 단독)에서도 동일 `listMetrics`가 내려와야 한다. OpenAPI상 `MemberDetailResponse`에 `listMetrics`가 없으면 **additive로 추가** (§3.4).

---

## 0. 재현 (2026-09-28 CMS + remote BE)

| 화면           | 경로                                         | 증상                                                                                           |
| -------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 강사 회원 목록 | `/admㅔ.in/users?kind=instructors`           | 정산 현황 대부분 `-` 또는 무색 plain                                                           |
| 동일 API       | `GET /api/admin/instructors`                 | `listMetrics.settlementStatusLabel` 다수가 FE 8종과 불일치                                     |
| **강사 상세**  | `/admin/users?…&detail_user=…` (강사)        | 기본정보 「정산 현황」 — `settlementStatusView` → **`user.listMetrics.settlementStatusLabel`** |
| **상세 API**   | `GET /api/admin/users/{memberId}/instructor` | (현행) `listMetrics` 미기재·미매핑 시 목록 병합값에만 의존 → **직접 진입 시 `-`/무색**         |
| 예외           | 특정 회원(예: 황범진)                        | `지급 정정 요청` — FE canonical과 일치 → 색상 정상                                             |

**관측된 BE 라벨 (비 exhaustive):**

| BE 현재 문자열      | FE canonical 라벨              | FE UI key                         |
| ------------------- | ------------------------------ | --------------------------------- |
| `재신청 검토 중`    | `지급조서 재신청`              | `payment_statement_reapplication` |
| `계좌 지급 대기 중` | `확인 대기 중`                 | `awaiting_confirmation`           |
| `정산 전`           | **`해당 없음`** (§2.1 BE 확인) | `none`                            |
| `지급 정정 요청`    | `지급 정정 요청`               | `payment_correction_requested` ✅ |

---

## 1. FE 8종 — 유일 허용 한글 라벨 (목록·상세 표시)

OpenAPI `settlementStatusLabel`은 today `type: string`이다. **허용 값은 아래 8개 한글 문자열로 고정**한다(공백·철자 포함, 아래 표와 **바이트 단위 동일**).

| #   | `InstructorSettlementUiStatus` (snake_case) | **반드시 내려줄 `settlementStatusLabel`** |
| --- | ------------------------------------------- | ----------------------------------------- |
| 1   | `payment_statement_reapplication`           | 지급조서 재신청                           |
| 2   | `awaiting_confirmation`                     | 확인 대기 중                              |
| 3   | `partial_confirmation`                      | 확인 진행 중                              |
| 4   | `payment_statement_verified`                | 지급조서 확인 완료                        |
| 5   | `account_paid`                              | 계좌 지급 완료                            |
| 6   | `none`                                      | 해당 없음                                 |
| 7   | `application_rejected`                      | 신청 반려                                 |
| 8   | `payment_correction_requested`              | 지급 정정 요청                            |

**주의 (FE와 혼동 금지):**

- `확인 진행**중**` (띄어쓰기) — canonical. 구 표기 `확인 진행중`(붙임)은 FE가 일부 화면에서만 호환; **BE는 canonical만** 내려줄 것.
- `확인 대기 중` ≠ `계좌 지급 대기 중` — 후자는 **폐기**하고 전자로 통일.

---

## 2. BE 내부 상태 → canonical 매핑 (마이그레이션)

집계·DB enum·워크플로 이름이 무엇이든, **API 경계에서** 위 8라벨로 변환한다.

### 2.1 확인 필요 (BE ↔ PM)

| BE 관측 라벨 | FE 제안 canonical    | 비고                                                                                    |
| ------------ | -------------------- | --------------------------------------------------------------------------------------- |
| `정산 전`    | `해당 없음` (`none`) | 정산 이력·진행 건 없음 의미로 가정. 다른 의미면 BE가 8종 중 하나로 재정의 후 본 표 갱신 |

### 2.2 확정 치환 (FE alias 제거 목표)

| BE 레거시 / 현재 표기 | → `settlementStatusLabel`                    |
| --------------------- | -------------------------------------------- |
| `재신청 검토 중`      | 지급조서 재신청                              |
| `계좌 지급 대기 중`   | 확인 대기 중                                 |
| (기타 비 canonical)   | §1 표에 없으면 **버그** — 8종 중 하나로 수정 |

---

## 3. 필드·필터 계약

### 3.1 응답 — `UserListRowMetrics`

| 필드                    | 타입 (현행) | 요구                                                                                                        |
| ----------------------- | ----------- | ----------------------------------------------------------------------------------------------------------- |
| `settlementStatusLabel` | `string?`   | §1 **8문구 중 하나** 또는 omit/`""` (미집계·해당 없음 정책에 따라 `해당 없음` vs omit — **팀 하나로 고정**) |

**P1 (권장 additive):** `settlementStatus` — OpenAPI `enum` 8 snake_case keys (§1 표 1열).

- 목록·필터·i18n 변경 시 라벨만 바꿀 수 있음.
- 프로그램 `participants[].settlementStatus`와 **동일 enum 이름** 사용.

### 3.2 요청 — `GET /api/admin/instructors`

| Query              | FE가 보내는 값 (2026-09-28)                  | BE 기대                                                                         |
| ------------------ | -------------------------------------------- | ------------------------------------------------------------------------------- |
| `settlementStatus` | **canonical 한글 라벨** (예: `확인 대기 중`) | §1 8문구와 **동일 문자열**로 필터. 레거시 BE 라벨로 필터하면 FE 선택값과 불일치 |

FE 구현:

- 필터 옵션: `apps/cms/src/shared/config/instructor-list-filter-options.ts` — `value` = `INSTRUCTOR_SETTLEMENT_STATUS_LABELS[status]`
- 호출: `apps/cms/src/entities/user/api/user-service.ts` → `fetchInstructorsPageRemote({ settlementStatus })`

**「해당 없음」 필터:** FE는 행이 `''` · `'-'` · `해당 없음` 모두 포함. BE는 omit/`해당 없음`/`정산 전` 등을 **`해당 없음` 하나로 normalize**해 주면 필터·표시가 맞는다.

### 3.3 `GET /api/admin/users` (참고)

일부 탭에서 `settlementStatus` 쿼리를 함께 쓸 수 있다. **강사 디렉터리 SSOT는 `listInstructors`와 동일 규칙**을 적용할 것.

### 3.4 `GET /api/admin/users/{memberId}/instructor` — 강사 상세 (P0)

| 항목                         | 요구                                                                                                                                            |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **응답 위치 (택1, 팀 고정)** | **`member.listMetrics`** (`UserListRowMetrics`) **권장** — 목록 row와 동일 shape · 또는 `InstructorMemberDetailResponse` **루트** `listMetrics` |
| **`settlementStatusLabel`**  | §1 8문구 중 하나 (목록 row와 **memberId 기준 동일 문자열**)                                                                                     |
| **집계**                     | `listInstructors` enrich와 **같은 서비스/쿼리** — 목록만 맞고 상세가 다르거나 비어 있으면 안 됨                                                 |
| **직링크**                   | 목록 캐시 없이 상세만 호출해도 「정산 현황」 표시 가능                                                                                          |

**FE 소비 (BE 검수 시 참고):**

| UI                               | 코드                                                                                               |
| -------------------------------- | -------------------------------------------------------------------------------------------------- |
| 회원 상세 기본정보 「정산 현황」 | `apps/cms/src/features/user/detail/ui/user-basic-info/status/index.tsx` — `settlementStatusView`   |
| 강사 섹션 / 편집 폼 readOnly     | `instructor-section.tsx`, `instructor-detail-edit-form.tsx`                                        |
| 상세 mapper                      | `mapInstructorMemberDetailToUser` — `member.listMetrics` / 루트 `listMetrics` → `user.listMetrics` |

**병합 정책 (FE):** 목록→상세 진입 시 `mergeListUserWithFetchedDetail`이 상세에 `settlementStatusLabel`이 없으면 **목록 값을 유지**한다. BE는 상세 GET에 **항상** 내려 **목록·상세·새로고침이 같게** 할 것.

### 3.5 강사 상세 「정산 현황」탭 — 정산 건별 목록 (P0)

| 항목        | 내용                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **API**     | `GET /api/admin/settlements?instructorMemberId={memberId}` (페이지네이션) — FE: `fetchSettlementsPageRemote`                                       |
| **화면**    | `instructor-payment-tab.tsx` — 테이블·캘린더·탭 필터(8종 snake_case value)                                                                         |
| **FE 매핑** | `resolveSettlementUiStatus(item)` — `SettlementListItemResponse.statementStatus` + `paymentStatus` → 8종 UI key → `InstructorSettlementStatusText` |

**BE 요구 (건당 행):**

| 축        | OpenAPI (현행)                                                | → FE UI key (§1 표 1열)                                                |
| --------- | ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 지급조서  | `statementStatus`: `WAITING_CONFIRM` · `ISSUED` · `REQUESTED` | `awaiting_confirmation`                                                |
| 지급조서  | `REAPPLICATION` · `RESUBMITTED`                               | `payment_statement_reapplication`                                      |
| 지급조서  | `PARTIAL` · `PARTIAL_CONFIRMED`                               | `partial_confirmation`                                                 |
| 지급조서  | `CONFIRMED` (+ payment 아래 참고)                             | `payment_statement_verified` 또는 `awaiting_confirmation`              |
| 지급조서  | `REJECTED`                                                    | `application_rejected`                                                 |
| 지급조서  | `CORRECTION_REQUESTED`                                        | `payment_correction_requested`                                         |
| 계좌 지급 | `paymentStatus`: `PAID`                                       | `account_paid`                                                         |
| 계좌 지급 | `CONFIRMED` + `statementStatus` `CONFIRMED`                   | `payment_statement_verified` (일부 확인은 statement `PARTIAL*`)        |
| 계좌 지급 | `WAITING_PAYMENT` + `statementStatus` `CONFIRMED`             | `awaiting_confirmation` (**「계좌 지급 대기」 별도 한글 invent 금지**) |
| 계좌 지급 | `CORRECTION_REQUESTED`                                        | `payment_correction_requested`                                         |

**금지:** 정산 탭 전용 한글 라벨 필드(`정산 전`, `재신청 검토 중` 등)를 invent — **FE는 8종 공통 컴ponent 라벨만** 표시.

**P1 (권장 additive):** `SettlementListItemResponse.settlementUiStatus` — §1 snake_case enum. 있으면 FE는 axes 매핑 대신 **우선 사용**(목록 요약 `settlementStatus`와 동일 enum).

**부가 필드:** `institutionName` — 탭 「참여 기관명」 열에 사용. 비어 있으면 FE `-`.

---

## 4. OpenAPI 변경 체크리스트

- [ ] `UserListRowMetrics.settlementStatusLabel` — `description`에 8 allowed literals 명시 (또는 `enum`)
- [ ] `(P1)` `UserListRowMetrics.settlementStatus` — `enum`: 8 snake_case keys
- [ ] `listInstructors` query `settlementStatus` — description: **FE는 canonical 한글 라벨 전달**; enum 8 literals 또는 enum key + 하위 호환
- [ ] **`MemberDetailResponse.listMetrics`** — `UserListRowMetrics` ref 추가 (**강사 상세 `member`에 포함**)
- [ ] (대안) **`InstructorMemberDetailResponse.listMetrics`** — 루트 additive
- [ ] `getInstructorMemberDetail` response example — `settlementStatusLabel: "확인 대기 중"` 등
- [ ] `SettlementListItemResponse` — `statementStatus` / `paymentStatus` enum·description §3.5와 일치
- [ ] `(P1)` `SettlementListItemResponse.settlementUiStatus` — 8 snake_case keys
- [ ] `members.openapi.json` · `settlement.openapi.json` 갱신 후 FE codegen

---

## 5. 금지 · 비범위

- **금지:** 목록·상세·정산 탭 어디에도 FE 8종 외 임의 한글 invent (`정산 전`, `재신청 검토 중`, `계좌 지급 대기 중` 등)
- **금지:** canonical과 다른 문자열을 내려놓고 FE가 맞추게 두기
- **P0 포함:** (1) 회원 **요약** `listMetrics.settlementStatusLabel` (2) 상세 **정산 탭** 건별 axes → §3.5 매핑이 8종과 일치하는 값
- **비범위:** 정산 관리 전역 화면 전체 리팩터 — 본 문서는 **강사 회원 CMS** 소비 경로 SSOT

---

## 6. 검수 시나리오 (BE self-check)

1. `GET /api/admin/instructors?page=0&size=50` — 모든 `listMetrics.settlementStatusLabel` ∈ §1 8문구 ∪ {omit, `""`} (정책 고정)
2. `settlementStatus=확인 대기 중` — 응답 rows 전부 `settlementStatusLabel` = `확인 대기 중` (또는 동일 UI key 집합)
3. `settlementStatus=해당 없음` — `정산 전`·빈 metrics 등 **레거시 none 케이스** 포함
4. `settlementStatus=지급조서 재신청` — 구 `재신청 검토 중` 회원 포함
5. 동일 `memberId` — `listInstructors` row `listMetrics.settlementStatusLabel` === `GET …/instructor` **`member.listMetrics.settlementStatusLabel`** (또는 루트 `listMetrics`)
6. **직링크** — 목록 API 없이 `GET …/instructor`만 호출해도 §1 canonical 라벨·omit 정책 충족
7. CMS UI — 강사 상세 기본정보 「정산 현황」 문구·색상이 목록 열과 일치
8. `GET /api/admin/settlements?instructorMemberId=` — 각 row axes가 §3.5에 따라 8종 UI와 대응 (REAPPLICATION → 재신청 UI, CONFIRMED+WAITING_PAYMENT → 확인 대기 중 등)
9. CMS — 강사 상세 **정산 현황 탭** 테이블·캘린더·필터가 동일 8종 색·라벨
10. (선택) 프로그램 참여 강사 `settlementStatus=awaiting_confirmation` ↔ 동일 회원 `확인 대기 중` 의미 일치

---

## 7. FE 후속 (BE 배포 후)

- `INSTRUCTOR_SETTLEMENT_MEMBER_LIST_LABEL_ALIASES` 및 plain fallback 축소 가능
- `(P1)` `settlementUiStatus` 수신 시 `resolveSettlementUiStatus` axes 폴백 축소

---

## 8. 프롬프트 (복사용)

```text
JA Korea CMS — 강사 회원 목록 정산 현황 BE SSOT

문서: apps/cms/docs/api/members/instructor-list-settlement-status-label-ssot-backend-request-2026-09-28.md

작업:
1) listInstructors + GET /api/admin/users/{memberId}/instructor (강사 상세) — 동일 enrich.
   listMetrics.settlementStatusLabel 을 FE 8종 한글과 바이트 단위로 맞출 것:
   지급조서 재신청 | 확인 대기 중 | 확인 진행 중 | 지급조서 확인 완료 | 계좌 지급 완료 | 해당 없음 | 신청 반려 | 지급 정정 요청
   상세는 member.listMetrics (또는 InstructorMemberDetailResponse.listMetrics) 로 OpenAPI·응답에 포함.

2) 레거시 표기 치환:
   재신청 검토 중 → 지급조서 재신청
   계좌 지급 대기 중 → 확인 대기 중
   정산 전 → 해당 없음 (PM 확인 후 고정)

3) Query settlementStatus 는 FE가 canonical 한글 라벨을 보냄. 동일 8문구로 필터.

4) (권장) UserListRowMetrics.settlementStatus / SettlementListItemResponse.settlementUiStatus enum 8 snake_case.

5) GET /api/admin/settlements?instructorMemberId= — statementStatus+paymentStatus 가 §3.5 매핑과 일치. invent 한글 라벨 금지.

OpenAPI: members + settlement subset. 검수 §6 (목록·상세·정산 탭).
```

**Last updated:** 2026-09-28 (강사 상세 §3.4 · 정산 탭 §3.5)
