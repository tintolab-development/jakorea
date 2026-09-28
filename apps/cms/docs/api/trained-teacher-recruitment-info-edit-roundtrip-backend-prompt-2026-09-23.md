# BE 전달 프롬프트 — 교육받은 교사 모집 정보 수정 저장 후 재조회 원복

**작성일:** 2026-09-23  
**상태:** BE 반영 확인 (2026-09-23). 회신: JABACK `docs/frontend/trained-teacher-recruitment-info-edit-roundtrip-frontend-handoff-2026-09-23.md`.  
**문서 성격:** 이 파일만 보고 수정·검수. 변명·우회 금지.  
**우선순위:** P0. 모집 정보 탭에서 고친 값이 저장 직후·재진입에서 구값 또는 `-` 로 돌아간다.  
**대상 화면:** CMS `/programs/trained-teachers?programId=…` LNB **모집 정보** (`tab=institutions`)  
**범위:** `programType=TRAINED_TEACHER` 만  
**비범위:** GENERAL / 1사1교 / UJAT / Gemini 기본 동작 변경 금지. 강사·봉사자 모집 블록 신설 금지.

**선행 (같이 깨지면 이 문서의 수락도 실패):**
- [trained-teacher-common-info-json-replace-wipes-fields-backend-prompt-2026-09-22.md](./trained-teacher-common-info-json-replace-wipes-fields-backend-prompt-2026-09-22.md) — B `trained-teacher/detail` 가 `generalCommonInfo` 를 일지·연수·일정만 남기고 **교체**하면, 모집에서 방금 쓴 `participantRecruitmentInfo` 도 사라진다.
- [trained-teacher-common-recruit-edit-roundtrip-backend-request-2026-09-17.md](./trained-teacher-common-recruit-edit-roundtrip-backend-request-2026-09-17.md) — 모집 비고·교육 대상 상세 SSOT. **본 문서가 모집 탭 계약을 갱신**한다.

**검증 Case:** `186005`(예정). `186001`(완료) 는 `PROGRAM_COMMON_INFO_EDIT_PERIOD_ENDED` 가 정상일 수 있다.  
**FE gate:** JWT + `VITE_REAL_API_MODULES` 에 `programs` (+ trained-teacher surface)

---

## 한줄

교육받은 교사 모집 정보 수정은 **`PATCH /api/admin/programs/{id}` 한 번**이다.  
body 의 top-level 컬럼과 `serviceDetailJson.program.generalCommonInfo.participantRecruitmentInfo` **라벨을 같이** 저장하고, GET 에서 **둘 다 신값**으로 돌려줘야 한다.  
그 다음 공통 정보 저장(B `PATCH …/trained-teacher/detail`)이 `participantRecruitmentInfo` 를 지우면 모집 탭은 다시 `-` 다.

---

## 백엔드 전달용 프롬프트 (복사용)

아래를 BE 이슈/PR 본문에 그대로 붙여 주세요.

````markdown
## 요청 요약

CMS 교육받은 교사 상세(`/programs/trained-teachers?programId=186005`) **모집 정보** 탭에서 필드를 수정·저장한 뒤 재조회하면, 일부 값이 원복되거나 `-` 로 비어 보입니다.

원인 후보는 두 가지입니다. 둘 다 고쳐야 합니다.

1. `PATCH /api/admin/programs/{id}` 가 top-level 컬럼만 반영하고 `serviceDetailJson.program.generalCommonInfo.participantRecruitmentInfo` 를 버리거나, 구 blob 과 deep merge 해서 **구 라벨이 신 컬럼을 이긴다**.
2. 공통 정보 저장의 `PATCH /api/admin/programs/{id}/trained-teacher/detail` 가 같은 `config_jsonb` 의 `generalCommonInfo` 를 일지·연수·일정만 있는 객체로 **교체**해, 모집이 쓴 `participantRecruitmentInfo` 를 지운다.

범위: `programType=TRAINED_TEACHER` 만. GENERAL / 1사1교 / UJAT / Gemini 의 RFC-7396 merge 는 건드리지 말 것.
강사·봉사자 모집 블록(`instructorRecruitmentInfo` / `volunteerRecruitmentInfo`) 을 TT 에 만들지 말 것.

검증은 `186005`(예정). `186001`(완료) 저장 거절 `PROGRAM_COMMON_INFO_EDIT_PERIOD_ENDED` 는 유지.

FE는 mock 없이 remote만 사용합니다.

---

### API

| 호출 | 역할 |
|------|------|
| `PATCH /api/admin/programs/{id}` | **모집 정보 저장 SSOT**. top-level + `serviceDetailJson` envelope |
| `GET /api/admin/programs/{id}` | 재조회. `serviceDetailJson.program.generalCommonInfo.participantRecruitmentInfo` 유지 |
| `PATCH /api/admin/programs/{id}/trained-teacher/detail` | 공통 정보(일지·연수·커리큘럼/일정)만. **모집 키 삭제 금지** |
| `GET /api/admin/programs/{id}/trained-teacher/detail` | `configJson` 에 programs 전체 blob / `participantRecruitmentInfo` 통짜 복사 금지 |

모집 탭 저장 1회에는 programs PATCH 만 나갑니다. 공통 정보 저장 1회에는 programs PATCH 다음 trained-teacher/detail PATCH 가 이어집니다.

`serviceDetailJson` FE envelope:

```json
{
  "schemaVersion": 1,
  "program": {
    "studentListRequired": "required",
    "targetLevels": ["elementary"],
    "educationTargetDetail": "초등학교 5~6학년",
    "resultAnnouncementDate": "2026-11-02T00:00:00.000Z",
    "resultAnnouncementMethod": "이메일 안내",
    "applicationMethod": "홈페이지 신청",
    "otherNotes": "기타사항",
    "generalParticipantTypes": ["school_institution"],
    "generalCommonInfo": {
      "participantRecruitmentInfo": { }
    }
  }
}
```

루트 `serviceDetailJson.generalCommonInfo`(envelope 밖 미러) 는 쓰지 말 것. 있으면 GET 신값과 같아야 하고 구값 금지.

---

### P0 — 모집 필드 GET/PATCH 대칭

화면 조회 SSOT 는 nested `participantRecruitmentInfo` **라벨**입니다. 컬럼만 바꾸고 라벨을 안 주면 FE 가 폴백하더라도, 공통 정보 저장 후 JSON 이 지워지면 다시 깨집니다. **컬럼과 라벨을 같이 echo** 하세요.

| UI | PATCH top-level | PATCH nested `participantRecruitmentInfo` | GET echo |
|----|-----------------|-------------------------------------------|----------|
| 공고 게시 여부 | — | `announcementPublished` boolean + `announcementPublishedLabel` (`게시`/`미게시`) | 동일 |
| 학생 명단 제출 | `studentListRequired` = `required` \| `not_required` | 동일 + `studentListRequiredLabel` (`제출 필요`/`제출 불필요`) | 컬럼·nested 동일 |
| 신청 가능 최대 학급 수 | — | `maxClassCount` number | 동일 |
| 신청 가능 최대 일정 수 | — | `maxScheduleCount` number | 동일 |
| 신청 가능 1일 최대 차시 | — | `maxSessionsPerDay` number | 동일 |
| 배정 가능 최대 강사 수 | — | **항상 `maxAssignableInstructors: 0`**. UI 없음 | GET 도 0. null 로 바꾸지 말 것 |
| 사전 안내 작성 | — | **항상 `preEducationNoticeRequired: false`**. UI 없음 | GET 도 false |
| 프로그램 운영 기간 | `startDate` / `endDate` | `operationPeriodLabel` (표시 문자열) | 컬럼·라벨 둘 다 신값 |
| 참여자 모집 기간 | `applicationStartDate` / `applicationEndDate` | `recruitmentPeriodLabel` | 컬럼·라벨 둘 다 신값 |
| 참여자 모집 현황 | 클라 무시 | — | 서버 일정 기준. 클라 입력 없음 |
| 교육 대상 | `targetLevel` / `targetLevels` enum (`elementary`…) | `educationTarget` / `recruitmentTarget` 한글 라벨 | enum 거절 없이 canonical. 라벨도 신값 |
| 교육 대상 상세 | `educationTargetDetail` | 동일 (`district` 와 분리) | `district` 에 넣지 말 것 |
| 최종 합격자 발표 | `resultAnnouncementDate` / `resultAnnouncementMethod` | `finalAnnouncementLabel` (날짜 \| 방법) | 컬럼·라벨 신값. 날짜만 또는 방법만 있어도 유지 |
| 문의처 기관명 | — | `contactOrganizationName` | GET nested 유지. 문의처 입력란 SSOT |
| 문의처 Tel | `contactPhone` | `inquiryTel` (+ `contactPhone`) | 컬럼·nested 동일 |
| 문의처 E-mail | `contactEmail` | `inquiryEmail` (+ `contactEmail`) | 컬럼·nested 동일 |
| 비고 | `remarks` | `remarks` | **`oneLineIntroduction` 에 쓰지 말 것**. 조회=저장=`remarks` |
| 프로그램 설명 | `description` | (선택) nested `programDescription` | top-level 유지 |
| 모집 안내 | `recruitmentGuide` | (선택) nested `recruitmentGuide` | top-level 유지 |
| 지원 방법 | `applicationMethod` | (선택) nested `applicationMethod` | top-level 유지 |
| 학습 지원 내용 | `learningSupportContent` | (선택) nested `learningSupportContent` | top-level 유지 |
| 추가 내용 HTML | `additionalContentHtml` | (선택) nested `additionalContentHtml` | top-level 유지. 빈 문자열로 구 HTML 을 지울 수 있어야 함 |
| 기타사항 | `otherNotes` (또는 `otherMatters`) | — | **`remarks` 와 분리**. 모집 비고를 otherNotes 로 복사하지 말 것 |
| 썸네일 | `keyVisualImage` | — | 유지 |

TT 제약 (저장·GET 모두):

- `generalParticipantTypes` = `["school_institution"]` 고정
- `instructorRecruitmentInfo` / `volunteerRecruitmentInfo` **없음** (빈 객체도 만들지 말 것)
- `maxAssignableInstructors` = 0, `preEducationNoticeRequired` = false

**수용 기준 (P0):**
1. `186005` 모집 탭에서 위 표의 **저장 필드를 각각** 바꾼 뒤 저장 → `GET /programs/{id}` 재조회 시 **동일 신값**. nested 라벨이 구값/`-` 이면 실패.
2. 모집만 저장해도 공통정보 필수값(설명·후원사·학습지원 등) 누락으로 400 나지 않음.
3. `remarks` 저장 후 GET `remarks` 유지. `oneLineIntroduction` 으로 바꿔서 비고가 비면 실패.
4. `educationTargetDetail` 저장 후 GET 이 `district` 만 채우고 상세가 비면 실패.
5. `maxAssignableInstructors` 가 0 이 아닌 값으로 echo 되면 실패 (TT 는 강사 배정 UI 없음).
6. 모집 저장 직후 공통 정보를 한 번 저장해도 `participantRecruitmentInfo` 키가 **그대로** 있다. 일지·연수·일정만 남은 객체로 바뀌면 실패.

---

### P0 — JSON 교체/wipe (모집 키가 사라지는 경로)

`config_jsonb` 를 programs PATCH 와 trained-teacher/detail PATCH 가 같이 씁니다.

해야 하는 동작:

- A `PATCH /programs/{id}`: 요청 `serviceDetailJson` envelope 로 **교체**. 구 blob 과 deep merge 금지. 요청에 있는 `participantRecruitmentInfo` 는 그대로 저장.
- B `PATCH …/trained-teacher/detail`: 일지·연수·커리큘럼/일정 키만 **overlay**. A가 넣은 `participantRecruitmentInfo`, `announcementTitle`, `sponsorManagementIds`, `venueKind` 등을 **지우지 말 것**.
- GET programs 의 `serviceDetailJson` 은 `{ schemaVersion, program }` envelope. 루트 `generalCommonInfo` 미러 금지.

deep merge 로 구 공고명·구 모집 기간 라벨을 되살리는 것도 금지입니다.

---

### P0 — 모집 전용 PATCH 검증

모집 탭 body 에는 공통정보 필수값(후원사 담당자명, 프로그램 설명, 학습 지원 등)이 비어 있을 수 있습니다.  
이 때문에 400 을 내면 모집 저장이 조용히 실패합니다.

허용:

- 모집 상한·기간·대상·문의처·비고·상세 HTML 부분 저장
- `studentListRequired` / `targetLevels` / `applicationStartDate` 등 모집 필드만 있어도 2xx

거절하지 말 것 (TT 모집 PATCH):

- 공통정보 `description` / `learningSupportContent` / `managerName` 공백
- `sponsors` 생략 (기존 후원 배정 유지)
- `maxAssignableInstructors` 생략 → 서버가 0 으로 정규화

거절해도 되는 것:

- 완료 Case 전체 잠금 (`PROGRAM_COMMON_INFO_EDIT_PERIOD_ENDED`) — 현행 유지
- `businessArea` 가 마스터에 없음 — 모집 탭은 사업 분야를 안 보냄. 구값을 유지하고 400 내지 말 것

---

### P1 — PATCH 응답 = GET detail

저장 직후 `GET /programs/{id}` 를 생략할 수 있게 PATCH 200 body 를 GET detail 과 같은 shape 로 주세요.  
최소한 `serviceDetailJson.program.generalCommonInfo.participantRecruitmentInfo` 와 top-level 모집 컬럼이 GET 과 같아야 합니다.

---

### 검증 체크리스트 (BE)

- [ ] `186005` 모집: 공고 게시, 학생 명단, 학급/일정/차시 상한, 운영·모집 기간, 교육 대상·상세, 합격 발표, 문의처(기관명·Tel·Email), 비고 각각 저장→GET 동일
- [ ] 상세 정보: 설명·모집 안내·지원 방법·학습 지원·추가 HTML·기타사항·썸네일 저장→GET 동일
- [ ] GET nested `maxAssignableInstructors` === 0, `preEducationNoticeRequired` === false, `instructorRecruitmentInfo` 없음
- [ ] 모집 저장 후 공통 정보 저장 → GET 에 `participantRecruitmentInfo` 유지
- [ ] `remarks` ≠ `otherNotes` ≠ `oneLineIntroduction`
- [ ] `educationTargetDetail` ≠ `district`
- [ ] 모집 PATCH 가 공통정보 필수 누락으로 400 안 남
- [ ] `186001` 완료 Case 저장 거절 코드 유지

### 비범위

- 일반/UJAT/Gemini/1사1교 기본 계약 변경
- TT 강사·봉사자 모집 탭
- FE mock 시드 복원
````

---

## FE가 이미 한 일 (2026-09-23 · 깨지지 않게 유지)

| 항목 | FE |
|------|-----|
| 저장 패치 | `detailEditValuesToProgramPatch` 가 기간·대상·명단·문의처·발표 **라벨을 nested 에 같이 씀** |
| TT 강사 수 | UI 숨김. patch/serialize `maxAssignableInstructors: 0`, `preEducationNoticeRequired: false` |
| TT 상한 | 최대 일정 수·1일 차시 **항상 노출** (등록 폼과 동일) |
| 문의처 기관명 | 수정 가능. nested `contactOrganizationName` |
| 수정 검증 | TT 모집 탭만 화면 필수 필드 검사 + 전화번호 형식. 공통정보 필수값은 모집 저장을 막지 않음 |
| 조회 폴백 | nested 라벨이 비면 TT 만 컬럼(`applicationStartDate` 등)으로 표시. **B가 JSON 을 지우면 폴백도 한계** |

관련 코드:

| 파일 | 역할 |
|------|------|
| `features/program/shared/model/program-detail-edit-schema.ts` | form → Program patch + 라벨 |
| `features/program/trained-teachers/api/adapters.ts` | `mapTrainedTeacherToUpdateRequest` |
| `features/program/trained-teachers/api/service-detail-json.ts` | envelope serialize, 강사 수 0 고정 |
| `features/program/general/lib/program-recruitment-save-fields.ts` | `programTrainedTeachersRecruitmentSaveSchema` |
| `features/program/general/lib/participant-recruitment-display.ts` | 조회 라벨 SSOT + TT 컬럼 폴백 |
| `features/program/general/ui/detail-modal/info/participant-recruitment-info-view.tsx` | 모집 탭 UI |

## FE 측 후속 (BE 반영 후)

BE 회신 요지: 모집 PATCH는 envelope **키 단위 overlay**. 보낸 `participantRecruitmentInfo` 객체는 **교체**(구 라벨 deep merge 없음). B detail은 일지·연수·일정만 overlay, `participantRecruitmentInfo` 복사·삭제 없음. codegen rename 없음.

FE 정렬 (2026-09-23):

- `mapTrainedTeacherToUpdateRequest` 가 top-level `remarks` / `educationTargetDetail` / `studentListRequired` 를 컬럼과 envelope에 같이 보냄. `oneLineIntroduction` 과 섞지 않음.
- GET 은 컬럼 우선, nested 문의처 기관명 유지. B GET merge 가 모집 객체를 지우지 않음.

브라우저 QA:

- [ ] `186005` 모집 탭 저장 → 모달 닫고 재진입 → 전 필드 신값
- [ ] 모집 저장 후 공통 정보 저장 → 모집 라벨 유지
- [ ] OpenAPI `serviceDetailJson` 설명만 갱신되면 선택적 codegen. 필드명 변경 없음

**Last updated:** 2026-09-23 (BE 회신 반영)
