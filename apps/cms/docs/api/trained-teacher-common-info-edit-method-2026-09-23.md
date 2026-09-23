# 교육받은 교사 공통 정보 — 수정이 안 되던 필드를 고친 방법

**작성일:** 2026-09-23  
**대상:** CMS `/programs/trained-teachers` 상세 LNB **공통 정보** (`programType=TRAINED_TEACHER`)  
**문서 성격:** 이미 프론트·백에 전달한 핸드오프를 모은 **수정 방법 정리**. 새 백엔드 요청이 아니다.  
**범위:** 교육받은 교사만. 일반 / 1사1교 / UJAT / Gemini 기본 저장은 이 방법으로 바꾸지 않았다.

화면의 「정보 수정」 버튼이 잠긴 경우(`PROGRAM_COMMON_INFO_EDIT_PERIOD_ENDED`, 진행 중·완료)는 이 문서 밖이다. 여기서 말하는 “수정이 안 되던 필드”는 **편집은 되는데 저장 후 재조회에서 예전 값으로 돌아가거나 비는 필드**다.

---

## 한줄

공통 정보 저장은 API가 **두 번**이다.  
공고명·세부명·후원·장소·KPI는 `PATCH /api/admin/programs/{id}` 에 쓰고, 교육일지·교육연수·커리큘럼/일정은 그 다음 `PATCH …/trained-teacher/detail` 에만 쓴다.  
같은 JSON 칸을 두 API가 같이 쓰면서, 서버가 기존 blob과 **합치거나** 뒤 요청으로 **통째로 바꿔** 앞 요청의 키가 지워졌다.  
프론트는 필드마다 “어느 컬럼 / 어느 nested 키”인지 나누고, 조회할 때 **방금 저장한 컬럼이 nested 구값을 이기게** 했다. 백엔드에는 JSON을 합치지 말고, 뒤 API는 자기가 맡은 키만 덮으라고 요청했다.

---

## 왜 일부만 수정된 것처럼 보였나

저장 1회는 항상 이 순서다.

| 순서 | API | 프론트가 넣는 것 |
|---|---|---|
| A | `PATCH /api/admin/programs/{id}` | 기본정보·후원·KPI·교육 장소·커리큘럼/일정 테이블. `serviceDetailJson` |
| B | `PATCH /api/admin/programs/{id}/trained-teacher/detail` | 교육일지·교육연수·커리큘럼/일정만. `configJson` |

두 응답이 같은 `generalCommonInfo` 칸을 건드리는데 규칙이 달랐다.

1. **합치기 (2026-09-21 ~ 09-22 초).** A가 새 값을 `program.generalCommonInfo`에 넣어도, 서버가 예전 blob과 deep merge 해서 루트 `generalCommonInfo`에 구 후원사·구 공고명·구 교재명이 남았다. 화면은 nested 구값을 읽어서 헤더(`title`)만 바뀐 것처럼 보였다.
2. **통째 교체 (2026-09-22, 프로그램 `186034`).** B가 일지·연수·일정 4개 키만 있는 객체로 `generalCommonInfo`를 **갈아끼웠다**. A가 방금 쓴 `announcementTitle`, `detailedProgramName`, `sponsorManagementIds`, `venueKind`, `venueDetail`, `kpi`가 GET에서 사라졌다. top-level `title`만 살고 `textbookName` / `venue`는 `null`이었다.

그래서 “이 필드는 수정이 안 된다”로 보였다. 입력 잠금이 아니라 **저장 위치와 재조회 우선순위가 어긋난 것**이다.

---

## 수정 방법

### 1. 필드를 두 갈래로 나눈다

폼 이름은 화면 라벨을 따른다. 저장 wire는 백엔드 컬럼 이름을 따른다.

| 화면 | 폼 | A `programs` body | A nested (`program.generalCommonInfo`) | B `detail` |
|---|---|---|---|---|
| 공고용 프로그램명 | `announcementTitle` | `title` (값은 동일) | `announcementTitle` | 넣지 않음 |
| 대표 프로그램명 국문/영문 | `mainTitle` / `titleEn` | `mainTitle` / `titleEn` | 넣지 않음. `title`과 별개 | 넣지 않음 |
| 세부 프로그램명 | `detailedProgramName` | `textbookName` | `detailedProgramName`만. nested `textbookName` 키는 제거 | 넣지 않음 |
| 사업 분야 | `businessArea` | 마스터명 그대로 (`경제금융` 등) | 넣지 않음 | 넣지 않음 |
| 후원사·담당자 | `sponsorManagementIds` + contact id | `sponsorId`(대표 1) + `sponsors[]` **행 전부** | `sponsorManagementIds`, `sponsorManagerContactIds` (`후원사id::담당자id`) | 넣지 않음 |
| 교육 장소 | `venueKind` `inside` / `outside` / `other` | 안·밖은 `institutionType`. 기타는 컬럼을 비우고 `venue`에 문구 | `venueKind`, `venueDetail` | 넣지 않음 |
| 교육과정 / IP / Course / Partner | 각 컬럼명 | top-level 컬럼 | 선택값은 nested에도 유지 (미러로 지우지 않음) | 넣지 않음 |
| KPI | `kpiFinal*` | `totalParticipants`, `educatedTeachers` + nested `kpi` | `kpi` | **넣지 않음.** configJson의 옛 kpi로 덮지 않음 |
| 커리큘럼 차시 / 일정 행 | draft | nested `curriculumSessions` 또는 `scheduleDetails` | 같은 테이블 | 같은 테이블만 overlay |
| 교육일지·교육연수 | draft 플래그 | 연수 ON/OFF 컬럼은 A가 덮지 않음 | — | `teacherTrainingEnabled`, `educationJournalEnabled`, 일정명 |

일정 행의 `name`에 공고명(`title`)을 복사하지 않는다. `교육받은교사(수정3)`과 `교육받은교사(수정4)`는 다른 필드다.  
`scheduleDetails`를 `curriculumSessions`로 합치거나 `name`을 `title`로 줄이지 않는다. `progressTimeSummary`(`15:43 ~ 16:43`)도 그대로 둔다.

교육 장소 **기타**는 `institutionType`에 해당하는 값이 없다. 예전에 남은 `inside_school`만 보면 화면이 기관 안으로 돌아간다. 기타 저장은 `institutionType`을 비우고 nested `venueKind=other`와 `venue` / `venueDetail`을 같이 남긴다.

후원사는 `sponsorId` 컬럼 하나가 전체가 아니다. 같은 후원사에 담당자가 두 명이면 `sponsors[]`에 행이 두 개다. 후원사 id로 접어서 담당자 1명만 남기면 실패다.

사업 분야는 `경제` / `진로` / `기타`를 보내지 않는다. 마스터명 `경제금융` / `진로취업` / `기업가정신` / `디지털리터러시`만 보낸다. 그 외는 `PROGRAM_BUSINESS_AREA_NOT_FOUND`.

### 2. A의 JSON에서 프로그램 컬럼 복제를 뺀다

`serviceDetailJson`은 이 envelope만 보낸다.

```json
{
  "schemaVersion": 1,
  "program": {
    "generalCommonInfo": {}
  }
}
```

루트 `generalCommonInfo`와, JSON 루트에 `title` / `sponsorId` / `textbookName`을 평탄 복제하는 것은 프론트가 보내지 않는다. 서버가 붙이면 다음 저장에서 구값이 다시 섞인다.

nested `generalCommonInfo`에 **프로그램 컬럼 이름**이 들어가면 저장 전에 지운다. 구값이 그 키에 남기 때문이다.

지우는 키: `title`, `titleEn`, `mainTitle`, `textbookName`, `sponsorId`, `venue`, `managerName`, `businessArea`, `institutionType`, `teacherTrainingScheduleName` 등.

**지우면 안 되는 키** (이건 공통 정보 값이다): `announcementTitle`, `detailedProgramName`, `sponsorManagementIds`, `sponsorManagerContactIds`, `venueKind`, `venueDetail`, `kpi`, `scheduleDetails`, `curriculumSessions`, `educationProcess`, `ipOwned`, `courseDeliveredBy`, `partnerInvolvement`.

구현: `sanitizeTrainedTeacherCommonInfo` — `apps/cms/src/features/program/trained-teachers/api/service-detail-json.ts`  
wire 조립: `mapTrainedTeacherToUpdateRequest` — `apps/cms/src/features/program/trained-teachers/api/adapters.ts`  
폼 → 패치: `detailEditValuesToProgramPatch` — `apps/cms/src/features/program/shared/model/program-detail-edit-schema.ts`

### 3. B는 맡은 키만 덮는다

`configJson.generalCommonInfo`에 프론트가 넣는 키는 아래뿐이다.

- `educationJournalEnabled`
- `teacherTrainingEnabled`
- `teacherTrainingScheduleName` (ON이면 `교육 연수`, OFF이면 `""`)
- `curriculumSessions` / `scheduleDetails` (있을 때만)
- `educationScheduleLines` / `educationScheduleMode` / `educationScheduleRange` (있을 때만)

공고명·세부명·후원 id·장소·KPI는 B에 넣지 않는다.  
교육 연수 OFF인데 일정명 `"교육 연수"`가 남아 있으면, 다음 저장에서 `teacherTrainingScheduleName: ""`로 비운다. 사용자가 입력한 **일정 행 `name`** 은 그 문구 그대로 둔다. `"교육 연수"`로 되돌리지 않는다.

B를 공고명까지 같이 실어 보내던 시도가 있었다 (2026-09-22 wipe 문서). 서버가 B body로 객체를 통째로 바꾸면 A 키가 사라졌기 때문이다. 그 방식은 `configJson`이 programs JSON의 두 번째 복본이 되어, 구값이 다시 붙었다. **지금 코드는 overlay 키만 보낸다.** A 필드가 지워지지 않게 하는 쪽은 서버다. B 저장이 `generalCommonInfo`를 일지·연수·일정 객체로 교체하면 안 되고, 위 키만 갱신하고 나머지 A 키는 그대로 둬야 한다.

구현: `narrowTrainedTeacherInfoConfigCommonInfo` / `mapTrainedTeacherInfoSaveToRequest` — `apps/cms/src/features/program/trained-teachers/api/info-detail-adapters.ts`

화면 저장 순서 (`common-info-view.tsx` `handleSave`):

1. `onBeforePersist` → A `programs` PATCH (KPI·공고·세부·장소·커리큘럼/일정 draft 포함)
2. 일지·연수·차시·일정이 바뀐 경우에만 `onPersist` → B `detail` PATCH

KPI만 바꾼 저장은 B를 호출하지 않는다.

### 4. 조회는 방금 저장한 컬럼을 우선한다

GET 안에 구값과 신값이 같이 있어도 화면이 구값으로 돌아가지 않게, 읽는 순서를 고정했다.

| 화면 | 우선 |
|---|---|
| 공고용 프로그램명 | top-level `title`, 없을 때만 nested `announcementTitle` |
| 세부 프로그램명 | `detailedProgramName`, 그다음 `textbookName`, 그다음 nested |
| 교육 장소 종류 | nested `venueKind`가 `inside` / `outside` / `other`이면 그 값. 없을 때만 `institutionType` |
| 기타 장소 문구 | top-level `venue`, 없을 때만 nested `venueDetail` |
| 후원사 | `GET …/sponsors` 행 전부. JSON 루트 구 id가 대표 `sponsorId`를 덮지 않음 |
| KPI | programs / nested `kpi`. `configJson`의 옛 kpi는 덮지 않음 |
| 커리큘럼·일정 행 | 두 JSON을 행 단위로 합친다. 한쪽이 이름·진행 시간을 빼도, 다른 쪽에 값이 있으면 그 값을 남긴다 |
| JSON 이중 복본 | `program.generalCommonInfo`를 읽고, 루트 `generalCommonInfo`는 전자가 없을 때만 |

구현: `mapTrainedTeacherDetailToProgram` (`adapters.ts`), `mergeTrainedTeacherInfoDetailIntoProgram` (`info-detail-adapters.ts`).

이 조회 우선순위는 **화면이 구값으로 보이는 것**을 줄인다. 서버 blob에 구 복본이 계속 붙거나 B가 A 키를 지우면, 다음 저장에서 다시 섞인다. 그래서 백엔드 계약이 같이 필요하다.

---

## 백엔드에 요청한 계약

전달 문서의 요구를 한곳에 모으면 아래다. `TRAINED_TEACHER`만. 일반 프로그램의 JSON merge는 바꾸지 말 것.

1. A `serviceDetailJson`은 요청 body로 **교체**. 기존 blob과 deep merge 금지. 루트 `generalCommonInfo` 미러 금지. envelope `{ schemaVersion: 1, program: { … } }` 유지.
2. 재조회 `title` = nested `announcementTitle`. `textbookName` = top-level `detailedProgramName` = nested `detailedProgramName`.
3. B `configJson`에 programs JSON을 통째로 복사하지 않는다. B가 안 보낸 키(공고명·세부명·후원·장소·KPI·`participantRecruitmentInfo`)를 **삭제하지 않는다.** deep merge로 구 차시를 되살리지도 않는다. 맡은 키만 overlay.
4. A nested 커리큘럼/일정과 B `configJson` 테이블은 같은 신값. `scheduleDetails[0].name`에 `title`을 복사하지 않는다.
5. `teacherTrainingEnabled: false` + `teacherTrainingScheduleName: ""` 이면 일정명 컬럼을 비운다. `"교육 연수"`를 다시 넣지 않는다.
6. `sponsors[]`는 행 전부 저장·조회. 같은 `sponsorId`에 담당자 여러 명 허용. `GET …/sponsors`가 그 행을 그대로 돌려준다.
7. `venueKind=other`이면 `institutionType`을 비우고 `venue` / `venueDetail`을 유지. 남은 `inside_school`로 장소 종류를 기관 안으로 바꾸지 않는다.
8. 목록 `GET /api/admin/programs?programType=TRAINED_TEACHER`의 `textbookName`, `venue`, `managerName`(후원사 담당자, 생성 관리자 아님)은 상세와 같다.

수락을 실패한 실측 (로컬 `186034`, `updatedAt` `2026-09-22T01:33:39Z`): 저장 직후 `generalCommonInfo`가 `educationJournalEnabled`, `teacherTrainingEnabled`, `teacherTrainingScheduleName`, `scheduleDetails`만 남음. `title`만 `교육받은교사(수정4)`이고 `textbookName` / `venue`는 `null`.

---

## 전달 문서 (시간순)

| 날짜 | 문서 | 이 문서에서 가져온 것 |
|---|---|---|
| 2026-09-17 | [trained-teacher-common-recruit-edit-roundtrip-backend-request-2026-09-17.md](./trained-teacher-common-recruit-edit-roundtrip-backend-request-2026-09-17.md) | 필드별 wire. 공고용=`title`, 세부명=`textbookName`, 장소=`institutionType`+`venue`, 사업 분야 마스터명, 후원 `sponsors[]`. 검증 Case `186005`. |
| 2026-09-21 | [trained-teacher-common-info-json-mirror-backend-prompt-2026-09-21.md](./trained-teacher-common-info-json-mirror-backend-prompt-2026-09-21.md) | JSON 이중 복본. 루트 구값 vs `program.generalCommonInfo` 신값. PATCH는 교체. 목록 echo. 연수 OFF면 일정명 clear. |
| 2026-09-22 | [trained-teacher-common-info-field-roundtrip-backend-prompt-2026-09-22.md](./trained-teacher-common-info-field-roundtrip-backend-prompt-2026-09-22.md) | A/B 필드 SSOT. 조회 시 top-level이 nested 구값을 이김. B에 후원·공고·세부명·KPI를 넣지 않음. |
| 2026-09-22 | [trained-teacher-common-info-json-replace-wipes-fields-backend-prompt-2026-09-22.md](./trained-teacher-common-info-json-replace-wipes-fields-backend-prompt-2026-09-22.md) | B가 객체를 교체하면 A 키가 사라짐. overlay만 허용. `186034` 실패 JSON. |
| 2026-09-22 | [trained-teacher-sponsor-venue-roundtrip-backend-prompt-2026-09-22.md](./trained-teacher-sponsor-venue-roundtrip-backend-prompt-2026-09-22.md) | 담당자 복수 행. 장소 `other`가 `inside_school`로 돌아가는 조건. |
| 2026-09-23 | [trained-teacher-recruitment-info-edit-roundtrip-backend-prompt-2026-09-23.md](./trained-teacher-recruitment-info-edit-roundtrip-backend-prompt-2026-09-23.md) | 모집 정보. 공통 정보 B 교체가 `participantRecruitmentInfo`까지 지우면 모집 탭도 빈다. **BE 반영됨.** |

백엔드가 프론트에 회신했다고 적힌 파일 (이 저장소에는 없음, JABACK 쪽):

- `trained-teacher-common-info-roundtrip-frontend-handoff-2026-09-17.md`
- `trained-teacher-common-info-field-roundtrip-frontend-handoff-2026-09-22.md`
- `trained-teacher-recruitment-info-edit-roundtrip-frontend-handoff-2026-09-23.md`

09-22 회신은 “A는 envelope로 교체, B는 overlay”라고 했으나, 같은 날 `186034` GET은 overlay가 아니라 **객체 교체**였다. wipe 문서가 그 간극을 적는다.

---

## 코드 위치

| 파일 | 역할 |
|---|---|
| `apps/cms/src/features/program/trained-teachers/ui/common-info/common-info-view.tsx` | 저장 버튼. A 다음, 필요할 때만 B |
| `apps/cms/src/features/program/shared/model/program-detail-edit-schema.ts` | 폼 필드 → `title` / `textbookName` / `venueKind` / 후원 id |
| `apps/cms/src/features/program/trained-teachers/api/service-detail-json.ts` | A JSON. 컬럼 미러 제거, `announcementTitle`·`detailedProgramName` 유지 |
| `apps/cms/src/features/program/trained-teachers/api/adapters.ts` | A PATCH body, GET → 화면 (컬럼 우선) |
| `apps/cms/src/features/program/trained-teachers/api/info-detail-adapters.ts` | B PATCH는 overlay 키만. 조회 병합 시 빈 값이 일정명·시간을 지우지 않음 |
| `apps/cms/src/features/program/trained-teachers/api/service.ts` | `updateTrainedTeacherProgram` (A), `updateTrainedTeacherProgramInfoDetail` (B) |

관련 테스트: `adapters.test.ts`, `info-detail-adapters.test.ts`, `service-detail-json` 쪽 recruitment 제약 테스트.
