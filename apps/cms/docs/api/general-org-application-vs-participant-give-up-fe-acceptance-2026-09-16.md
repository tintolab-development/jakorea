# FE 수용 — 일반(기관) 신청 vs 참여 · 활동 포기

**작성일:** 2026-09-16  
**BE 핸드오프:** `JABACK/docs/frontend/general-org-application-vs-participant-give-up-frontend-handoff-2026-09-16.md`  
**대상:** CMS 일반 프로그램 · `programType` 기관 참여

---

## 화면·API 분리 (FE 준수)

| 화면 | API | 활동 포기 |
|------|-----|-----------|
| 기관 신청 목록/상세 | `organization-applications` | **없음** (승인/반려/승인취소만) |
| 진행 현황 > 참여 기관 목록/상세 | `participants?participantType=ORGANIZATION` | **`POST …/participants/{participantId}/give-up`** + `{ reason }` |

- 신청 상세와 참여 상세를 같은 availableActions/헤더로 묶지 않음.
- `organization-applications/{id}/give-up` **호출하지 않음**.

---

## FE 구현 요약

| 항목 | 위치 |
|------|------|
| give-up client | `program-progress-api-client.ts` → `giveUpProgramParticipantRemote` |
| service | `admin-program-progress-service.ts` → `giveUpGeneralParticipatingInstitution` |
| list adapter | `mapParticipantToParticipatingSchoolRow` — `giveUpAt` / `participantStatus=GIVE_UP` → `activityWithdrawn`, `availableActions` 느슨 매핑 |
| 상세 확인 | `school-detail-fullpage-view.tsx` — remote ON 시 API + institutions query invalidate |
| `reason` | 일정 선택 모달의 선택 라벨 (`기관명 · 일정라벨`) |
| 버튼 게이트 | `availableActions`에 `GIVE_UP` (필드 없으면 `!activityWithdrawn` 폴백) |
| 목록 UI | `activityWithdrawn` 행 `cms-data-table__row--disabled` |

---

## Codegen 갭

`ParticipantListItemResponse`(Orval)에 아직 `availableActions` 없음.  
FE는 런타임 필드를 읽어 매핑한다. OpenAPI 반영 후 codegen 재생성 권장.

---

## 수용 기준 체크

- [x] 신청 기관 상세에 활동 포기 버튼 없음
- [x] 참여 기관 상세에만 활동 포기 · remote 시 participants give-up 호출
- [x] 포기 후 목록 refetch로 `activityWithdrawn` / `giveUpAt` 반영
- [ ] 168002/168004 시드 QA — BE `bootRun` 시드 + CMS remote ON으로 수동 확인
