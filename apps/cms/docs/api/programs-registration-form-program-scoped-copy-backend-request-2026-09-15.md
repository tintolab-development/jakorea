# BE 수정 요청 (2026-09-15) — 단독 문서

**작성일:** 2026-09-15  
**문서 성격:** **이 파일만** 보고 구현·검수 가능 (선행/관련 문서 열람 불필요)  
**포함 이슈:**

| # | 우선순위 | 대상 API | 한 줄 |
|---|----------|----------|-------|
| **A** | **P0** | Forms-Surveys · form-templates / form-bindings | 등록·상세에서 편집한 공통/모집/신청 양식이 **공용 카탈로그를 덮어쓰지 않고**, 프로그램별 전용 copy로 종속되어야 함 |
| **B** | **P1** | Programs · create/`serviceDetailJson` | FE가 등록 실입력을 `serviceDetailJson.generalCommonInfo` 등에 실어 보냄 — **round-trip 보존** 확인 |

---

# A. 프로그램 종속 양식 (공용 카탈로그 보호 + copy + binding)

**요청 대상:** Forms-Surveys API · Programs create form-bindings  
**관련 templateCode 예 (공용 시드 — 읽기 전용 원본):**

| 단계 | templateCode 예 |
|------|-----------------|
| 공통(등록) | `registration-general` |
| 모집 | `recruitment-participant-school` / `recruitment-participant-individual` / `recruitment-instructor` / `recruitment-volunteer` |
| 신청 | `application-participant-school` / `application-participant-individual` / `application-instructor` / `application-volunteer` |

---

## A1. 요약

**한 줄:** 프로그램 등록·상세에서 편집한 공통/모집/신청 내용은 **공용 `templateCode` version을 PUT으로 덮어쓰면 안 되고**, 공용 원본을 **copy한 프로그램 전용 template/version**에만 저장·바인딩해야 한다.

| 구분 | 현재(문제) | 기대 |
|------|------------|------|
| 등록 중 모집/신청 저장 | 공용 versionId에 `PUT …/form-template-versions/{id}` | **전용 DRAFT version**에만 PUT |
| 공용 시드 | 편집에 의해 내용 변경됨 | **범용 원본 유지** (다음 등록 초기값) |
| 프로그램 create | `autoApplyDefaultFormBindings: true` → **공용 기본** binding | 편집본 **전용 version**을 프로그램에 binding |
| 프로그램 A 편집 | 공용·프로그램 B에 영향 | **A만** 변경 |

---

## A2. 요구 동작 (계약)

### A2.1 공용 카탈로그 보호

- 시드/`published` 공용 template의 version은 **등록 위저드·프로그램 상세 편집 PUT의 거부**하거나, FE가 공용 versionId로 PUT하지 않도록 **copy 전용 플로우를 강제**한다.
- `GET …/form-templates/by-code/{templateCode}/payload`는 **초기값 로드 전용**(읽기).

### A2.2 copy → 프로그램 전용 양식

- `POST /api/admin/form-templates/{templateId}/versions/copy` (또는 동등)가 **(B) 신규 template + DRAFT version**을 생성함을 OpenAPI에 명시.
- 응답 **필수:** `templateId`, `templateVersionId`, `templateCode` (non-null).
- 등록 시작 또는 등록 완료 직전: 공통·모집(유형별)·신청(유형별) 각각 **필요한 만큼 copy**.

### A2.3 프로그램 form-bindings

- create 성공 후 (또는 create 트랜잭션 내):
  - `POST /api/admin/programs/{programId}/form-bindings`
  - body에 **전용** `templateId` / `templateVersionId` + `formType` / `targetRole` / `targetScope` 등
- `autoApplyDefaultFormBindings: true`만으로 공용 published를 거는 현재 동작은 **등록 편집본 종속과 충돌**하므로:
  - **옵션 1(권장):** create가 “copy된 version id 목록”을 받아 그것으로 binding, 또는  
  - **옵션 2:** create 직후 FE가 전용 version으로 binding POST (원자성·롤백 정책 문서화).

### A2.4 조회 SSOT

- CMS 상세 공통/모집/신청 미리보기·Platform 제출은 **해당 프로그램 binding의 `templateVersionId` payload**를 사용.
- 공용 `by-code`로 상세를 그리면 안 됨.

### A2.5 생성 전 중간 저장

프로그램 id가 아직 없을 때:

- **권장:** 등록 시작 시점에 바로 copy해 받은 `templateVersionId`에만 PUT (고아 draft 정리 정책 포함), 또는  
- **대안:** program-scoped draft API + 완료 시 copy/bind 원자 처리.

어느 쪽이든 **공용 version PUT은 금지**.

---

## A3. 수락 기준 (QA)

1. 프로그램 A에서 신청 양식 문구 수정 → 공용 `application-participant-school` payload 불변.  
2. 신규 등록 시작 시 모집/신청 초기값이 **시드 범용 내용**.  
3. 프로그램 A 상세 신청 미리보기 = A binding version 내용.  
4. 프로그램 B는 A 수정에 영향 없음.  
5. copy 응답에 `templateCode` 항상 존재.  
6. create 실패 시 고아 template/version 정리 또는 문서화된 롤백.

---

## A4. FE 현황 (참고 — 서버 작업과 병행 수정)

- 등록 위저드가 공용 version에 `PUT` 중 → **FE도 copy 대상으로 전환 필요** (A 계약 전까지 이중 PUT(`registration-general` + 신청 template)은 **서로 다른 공용 version**에 대한 현 동작이며, 공용 오염 증상과 동일 계열).
- 공통정보 **도메인 필드**는 Programs create의 `serviceDetailJson`으로 보내는 FE 매핑을 보강함 (아래 B). 2026-09-15 기준 포함: `partnerInvolvement`, `paymentItems`(미선택→`해당없음`), `detailedProgramName`, `sponsorManagerLine`(표시 문구).
- 모집 **도메인 필드**(기간·공고 게시 등)는 아직 create에 전량 미매핑 — 양식 copy(A)와 별도로 Programs 필드/`serviceDetailJson` 확장 합의 가능.
- 모집 **양식 draft**가 `overlay: {}`로 나가면 모집 UI 입력이 form-template에 안 실림 — **공용 PUT 구조(A)와 별개로 FE flush 이슈**일 수 있음. A 착수 시 FE copy 전환과 함께 점검.

---

# B. `serviceDetailJson` / create round-trip (공통정보)

**요청 대상:** `POST /api/admin/programs` · `GET /api/admin/programs/{id}` · (동일 키) `PATCH`  
**한 줄:** FE가 등록 overlay를 `generalCommonInfo`(KPI·임금·커리큘럼·공고용명·장소·IPS·후원 등)에 실어 보냄. BE는 **저장·상세 조회 시 유실 없이** 돌려줄 것.  
**범위 밖:** 양식 schema 문구·단락 편집은 **A(form-template copy/binding)** — B는 프로그램 도메인 스냅샷만.

### B1. FE가 채우는 주요 경로 (create body)

| 위치 | 예시 필드 |
|------|-----------|
| top-level | `title`, `mainTitle`, `titleEn`, `startDate`/`endDate`, `businessArea`, `institutionType`, `venue`, `ipOwned`, `courseDeliveredBy`, `educationProcess`, `partnerInvolvement`, `ips`, KPI counts 등 |
| `serviceDetailJson.generalCommonInfo` | `announcementTitle`, `detailedProgramName`, `venueDetail`, `sponsorManagementIds`, **`sponsorManagerLine`**, `educationScheduleMode`/`Lines`, `educationFormLabel`/`*ScheduleDetail`, `participationMethod`, `ipsTypeSummary`, `curriculumSessions[]`, `scheduleDetails[]`, `wageGradeRows`, `paymentItems`/`deductionItems`, `kpi` |

### B1.1 `sponsorManagerLine` 계약 (FE·표시 SSOT)

| | |
|--|--|
| **의미** | 공통정보 「후원사 담당자」**표시 문구** |
| **형식** | `직책 이름 \| 연락처` (예: `팀장 김담당 \| 010-1234-5678`). 마스킹은 BE/조회 정책에 따름 |
| **금지** | contact ref (`{sponsorId}::{contactId}` 등)를 이 필드에 넣지 않음 — FE create 매퍼도 ref를 line으로 쓰지 않음 |
| **관련 id** | 선택은 `sponsorManagementIds`(및 필요 시 contact id는 FE overlay/상세 수정 쪽). line은 **복제용 스냅샷 문자열** |
| **BE** | create/PATCH로 받은 문자열을 GET `serviceDetailJson`에 **그대로 보존**. id로 재해석·덮어쓰기 불필요(FE가 이미 표시용으로 보냄) |

### B2. BE 확인

- [ ] create 요청의 nested `generalCommonInfo`가 GET detail `serviceDetailJson`에 **동일하게** 존재  
- [ ] 알 수 없는 키는 버리지 말고 **보존**(또는 OpenAPI에 허용 스키마 문서화)  
- [ ] `businessStartDate`/`businessEndDate`는 기존처럼 `startDate`/`endDate` mirror 유지  
- [ ] `sponsorManagerLine`·`paymentItems`·`detailedProgramName`·`partnerInvolvement` create→GET 유지  
- [ ] PATCH 공통정보 수정 시 동일 키 round-trip (등록 create와 키 집합 불일치 없게)

### B3. 수락

동일 JWT로 create → GET 후, 등록 시 넣은 `kpi`·`wageGradeRows`·`curriculumSessions`(또는 `scheduleDetails`)·`announcementTitle`·`sponsorManagerLine`(표시 문구)·`paymentItems`가 상세에 보임.

---

## 관련 FE 코드 (참고)

| 역할 | 경로 |
|------|------|
| 등록 → Program 매핑 | `apps/cms/src/features/program/general/lib/registration-overlay-to-program.ts` |
| create 스냅샷 | `apps/cms/src/features/program/general/lib/registration-local-save.ts` |
| create body | `apps/cms/src/features/program/general/api/adapters/general-program-adapters.ts` |
| 상세 공통정보 PATCH 매핑 | `apps/cms/src/features/program/general/model/common-info-edit-schema.ts` · `hooks/use-common-info-save.ts` |
| form draft PUT (현 문제 경로) | `persistWritingFormTemplateDraft` / `use-program-participant-application-editor` |
| form-bindings 타입 | OpenAPI `ProgramFormBindingRequest` |

---

## 이 문서에 넣지 않는 항목

| 항목 | 이유 |
|------|------|
| navigation `VOLUNTEER_APPLICATIONS` 등 LNB | 별도 문서 `programs-navigation-volunteer-lnb-participant-types-backend-request-2026-09-15.md` |
| 후원사 담당자 `id::id` 노출 | **FE create 매핑 버그로 수정함** — BE 추가 API 불필요(B1.1 보존만) |
| 모집 기간 등 도메인 create 전량 | A4 메모 — 합의 후 Programs/`serviceDetailJson` 확장 문서로 분리 가능 |
