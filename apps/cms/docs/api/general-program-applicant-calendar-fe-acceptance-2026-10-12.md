# 일반 프로그램 — 기관·강사 신청 캘린더 FE 수용 기준 (2026-10-12)

**상태:** 미해결 (QA 2026-10-12 — 기관 캘린더 일정 없음, 강사 캘린더 기관 정보 부족)  
**범위:** CMS 일반 프로그램 상세 LNB `기관 신청 목록` / `강사 신청 목록` — **리스트 뷰 ↔ 캘린더 뷰**  
**대표 검증 프로그램:** `programId=186092` (학교 / 기관 / 봉사 / 복수 회차 [ 기관 ])

---

## 1. 증상 요약

| 구분 | 리스트 뷰 | 캘린더 뷰 (기대) | 현재 (2026-10-12) |
| --- | --- | --- | --- |
| **기관 신청** | N건 표시 (예: 3건) | 신청별 희망 교육일이 월간/주간 셀·우측 카드에 표시 | 캘린더·우측 패널 **비어 있음** (일정 이벤트 0건) |
| **강사 신청** | 강사명 등 표시 | 셀·툴팁·우측 카드에 **강사명** + **희망 기관명** | 강사명은 일부 표시되나 **기관명 `-` / 누락**, 툴팁·카드 간 불일치 |

**URL 주의:** `institutionApplicationView=calendar` 와 `instructorApplicationView=calendar` 를 **동시에** 두면 과거에 뷰 param 정리·데이터 로딩이 꼬일 수 있음. 검증 시 **LNB별로 단일 view param**만 사용한다.

---

## 2. SSOT — 일정·기관명은 어디서 오는가

### 2.1 기관 신청 캘린더

캘린더 이벤트는 FE가 아래 중 **캘린더에 쓸 수 있는 날짜**를 찾을 때만 생성한다.

1. **목록** `GET /api/admin/programs/{programId}/organization-applications`  
   - `preferredEducationSchedules[]` (startAt/endAt 또는 dateText 등)  
   - 또는 목록/상세에 이미 채워진 `sessions[]` (캘린더용 date / scheduleLabel)
2. **보강(하이드레이트)** `GET /api/admin/organization-applications/{applicationId}/requested-schedules`  
   - Admin SSOT — 1사1교·일반 기관 신청 희망일정과 동일 계열  
   - 캘린더 진입 시 목록에 날짜가 없으면 FE가 신청 건별로 호출 후 `sessions`에 병합

**186092 실측 (로컬 BE, 인증 세션):**

- 기관 신청 ID 예: `1691247`, `1691245`, `1691243`
- 목록 3건 모두 `preferredEducationSchedules: []`, `sessions: []`
- 캘린더 진입 시 `requested-schedules` **신청당 1회 → 200 + `[]`**
- → **FE 이벤트 0건은 API payload와 일치** (BE가 일정을 projection 하지 않은 상태)

### 2.2 강사 신청 캘린더

- **강사 목록** `GET /api/admin/programs/{programId}/instructor-applications`
  - `preferredOrganizations[]` — 일·기관 bucket에 **매칭** (`scheduleId` ↔ `schoolId`, 또는 `organizationName` + 기간)
  - FE 매핑: `mapInstructorPreferredOrganizationsToPreferredSchools` → row.`preferredSchools`
- **기관 목록** `GET /api/admin/programs/{programId}/organization-applications` (강사 LNB 캘린더 진입 시 **동시 로드**)
  - `sessions[]` — **배정 확정** (`CONFIRMED` / `TEMP_ASSIGNED`) + `scheduleId` + `startAt` 만 캘린더 셀 SSOT
  - FE 매핑: `mapOrganizationApplicationListSessionsToConfirmedSessions` → row.`confirmedListAssignmentSessions`

**강사 캘린더 UI 규칙 (FE):**

- 월간 셀: **`{기관명} | {지역}`** (`formatInstitutionRegionForTableDisplay`)
- 셀 호버: **학교명** + `{지역} | {차시·시간} | 신청 : N명` (일정은 기관 confirmed session, N은 매칭된 강사 신청 수)
- 우측 카드: 강사별 행(기존) — bucket당 `calendarInstitutionInstructors`
- `organizationName`이 null/빈값이면 표시 fallback: **`기관 미지정`**

---

## 3. FE 구현 위치 (참고)

| 영역 | 경로 |
| --- | --- |
| URL view param | `apps/cms/src/features/program/general/hooks/application-list-view-params.ts` |
| 신청 목록·캘린더 데이터 | `apps/cms/src/features/program/shared/ui/program-detail/applicant-list/use-applicants-detail.ts` |
| 캘린더 이벤트 매핑 | `apps/cms/src/features/program/shared/ui/program-detail/applicant-list/applicant-calendar-events.ts` |
| 강사 기관명 해석 | `resolveInstructorCalendarInstitutionName`, `calendarBucketSchoolName` |
| 기관 일정 hydrate | `apps/cms/src/features/program/general/api/organization-application-schedules-hydrate.ts` |
| 기관 adapter | `apps/cms/src/features/program/general/api/adapters/general-applications-adapters.ts` (`resolveOrganizationApplicationAssignmentSessions`, `preferredEducationSchedules` 우선) |
| 강사 preferred | `apps/cms/src/features/program/general/lib/map-instructor-preferred-organizations.ts` |
| 캘린더 UI | `applicant-calendar-view.tsx`, `applicant-general-calendar-list-rows.ts`, `calendar-sub-right-list.tsx` |

**기관 — 일정 없을 때 UX (FE, 배포 여부는 브랜치/커밋에 따름):**

- 신청 건수 > 0 이고 캘린더 이벤트 0건이면 우측 빈 상태 문구로  
  «신청은 있으나 교육 일정(preferredEducationSchedules·requested-schedules)이 없어 캘린더에 표시할 수 없습니다.»

---

## 4. 백엔드 수용 기준 (미충족 시 FE로 해결 불가)

### 4.1 기관

- [ ] 목록 `organization-applications` 에 **최소 1건**이라도 `preferredEducationSchedules` 또는 파싱 가능한 `sessions` 날짜 포함  
  **또는**
- [ ] `GET .../organization-applications/{id}/requested-schedules` 가 신청서에 기록된 희망일정과 동일한 non-empty 배열 반환
- [ ] 일정 항목에 캘린더가 쓸 `startAt`/`endAt`(또는 `dateText`/`scheduleLabel`) 중 하나는 유효

### 4.2 강사

- [ ] `preferredOrganizations[]` 각 항목에 캘린더 bucket용 **`startAt`/`endAt` 또는 `dateRangeLabel`**
- [ ] **`organizationName`** = 실제 신청 기관명 (학교명 등). `programName` / 프로그램 제목으로 채우지 않음
- [ ] 기관명을 아직 모르면 null 허용 — FE는 `기관 미지정` 표시

---

## 5. FE 수용 테스트 (해결 후 체크리스트)

### 5.1 공통

- [ ] 프로그램 상세 → 기관 LNB → 리스트 뷰 건수 = 캘린더에 반영되는 **신청 수** (일정 있는 건만 셀에 표시)
- [ ] `리스트 뷰로 보기` / 캘린더 전환 시 URL param 단일 유지 (`institutionApplicationView` 또는 `instructorApplicationView`만)
- [ ] 캘린더 진입 시 무한 로딩·전체 멈춤 없음

### 5.2 기관 (`186092` 또는 일정이 있는 시드)

- [ ] 월간 셀에 기관명·차시 요약 표시
- [ ] 날짜 클릭 → 우측 카드에 해당 일 기관 신청 목록
- [ ] Network: `requested-schedules`가 빈 배열이 **아닌** 경우 셀에 날짜 생성

### 5.3 강사 (`186092`)

- [ ] Network: `organization-applications` + `instructor-applications` 동시 로드 (강사 캘린더)
- [ ] 월간 셀 = **기관명 | 지역** (배정 확정 `sessions[]` 있는 일정만)
- [ ] 툴팁 = 학교명 + 지역 | 일정 | 신청 N명
- [ ] 동일 날·동일 기관·세션 bucket에 복수 강사 시 우측 카드 N줄

### 5.4 자동 테스트

```bash
cd apps/cms && pnpm exec vitest run \
  src/features/program/shared/ui/program-detail/applicant-list/applicant-calendar-events.test.ts \
  src/features/program/general/lib/map-instructor-preferred-organizations.test.ts \
  src/features/program/general/hooks/application-list-view-params.test.ts
```

---

## 6. BE 검증용 curl (관리자 세션 쿠키 필요)

```bash
# 기관 목록
GET /api/admin/programs/186092/organization-applications?page=0&size=20

# 기관 희망일정 (신청 ID별)
GET /api/admin/organization-applications/{applicationId}/requested-schedules

# 강사 목록
GET /api/admin/programs/186092/instructor-applications?page=0&size=20
```

응답 JSON에서 `preferredEducationSchedules`, `sessions`, `requested-schedules` body, `preferredOrganizations` 필드를 스크린샷·첨부와 대조한다.

---

## 7. 판정 (2026-10-12)

| 이슈 | 주 담당 | FE 상태 | 해결 조건 |
| --- | --- | --- | --- |
| 기관 캘린더 빈 화면 | **BE** (일정 projection) | hydrate·enrich·빈 상태 안내 준비 | requested-schedules 또는 목록 preferred 일정 non-empty |
| 강사 기관 `-` / 불일치 | **BE** (organizationName) + **FE** (bucket 기관명 전달) | 로컬 수정 진행·QA 미완 | BE organizationName 정확 + FE `calendarBucketSchoolName` 배포 후 재QA |

**이 문서는 미해결 이슈의 FE/BE 계약·QA SSOT이다.** BE 반영 후 이 체크리스트를 갱신하고 «상태» 줄을 해결로 바꾼다.

**Last updated:** 2026-10-12
