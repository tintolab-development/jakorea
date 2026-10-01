# Cursor prompt — 로컬 시드가 모집 행 문구·첨부를 지우지 않게 (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.
프론트 레포를 고치지 마라. Homepage Admin(`JAHOMEADMINBACK`)도 고치지 마라.

| 항목 | 값 |
|------|-----|
| 대상 | 로컬 시드가 `program_recruitment` 를 지운 뒤 다시 만들면서, CMS에서 저장한 모집별 값이 홈페이지 상세에서 사라지는 문제 |
| 작성일 | 2026-10-01 |
| 선행 | `program-recruitment-independent-management-backend-prompt-2026-10-01.md` 의 행 컬럼·행 첨부·포털 조회는 이미 있다. 다시 만들지 마라 |

---

## 고치지 마라

포털과 저장 API는 이미 모집 행 단위다.

- `HomepageProgramQueryService`: `GENERAL` / `GENERAL_INDIVIDUAL` / `GENERAL_ORGANIZATION` / `UJAT` 이고 `recruitmentId` 가 있으면 제목은 그 행 `announcement_title`(없으면 프로그램 공고명), 요약·설명·안내·지원 방법·학습 지원·추가 내용·비고·문의처·썸네일·첨부는 그 행만. 비어 있으면 프로그램 컬럼으로 채우지 않는다.
- `ProgramRecruitmentRowCommandService`: 요청에 `id` 가 있는 행만 고친다. 빠뜨린 행은 유지한다. `null`/키 생략은 유지, `""` 는 비운다.
- Flyway로 컬럼·`program_recruitment_attachment` 를 또 만들지 마라.

프론트는 모집 탭 저장 시 그 행의 `id` 와 문구·문의처·기간만 PATCH 한다. 프로그램 `description` / `recruitmentGuide` / `additionalContentHtml` / `generalCommonInfo.announcementTitle` 에는 넣지 않는다.

---

## 증상

CMS에서 168241(참여자) 공고명·안내·첨부를 저장해도, 백엔드를 다시 띄우면 홈페이지 상세 `GET /api/portal/programs/168004?recruitmentId=168241` 에서 그 값이 없다. 168242·168243 도 같은 프로그램 첨부를 같이 갖는다.

원인:

1. `LocalDemoGeneralPrimaryCaseSeedContributor.clearScenarioRows` 가 `DELETE FROM program_recruitment WHERE program_id = ?` 를 한다. `program_recruitment_attachment` 는 `ON DELETE CASCADE` 로 같이 지워진다.
2. `seedRecruitment` 가 같은 id를 문구·`application_type`·썸네일·첨부 없이 다시 INSERT 한다. `ON CONFLICT` 도 유형·상태·기간만 갱신한다.
3. 이어서 `LocalDemoRecruitmentRowBackfill.copyMissingRowFiles` 가 프로그램 `program_attachment` 를 **첨부가 없는 모든 모집 행**에 복사하고, 썸네일이 비면 프로그램 썸네일을 모든 행에 넣는다. 모집별 파일이 한 벌로 섞인다.
4. UJAT도 같다. `LocalDemoUjatPrimaryCaseSeedContributor.clearScenarioRows` 가 `DELETE FROM program_recruitment` 를 하고, `UjatProgramSeedWriter` 의 INSERT `ON CONFLICT` 가 `start_at` / `end_at` 를 시드 값으로 덮어쓴다. 하반기 행(182213) 기간이 상반기·시드 기간으로 돌아간다.

---

## 수정

`GENERAL` / `GENERAL_*` / `UJAT` 로컬 시드만 해당한다. 1사1교·교육받은 교사·Gemini 시드는 그대로 둔다.

### 1. 이미 있는 모집 행은 지우지 않는다

`clearScenarioRows` 에서 아래 프로그램의 `DELETE FROM program_recruitment` 를 빼라.

- 일반 Primary Case `168001`–`168008` (`LocalDemoGeneralPrimaryCaseSeedContributor`)
- UJAT Primary Case (`LocalDemoUjatPrimaryCaseSeedContributor`, 프로그램 `182101` 포함)

행이 없을 때만 INSERT 한다. 이미 있으면 시드가 아래 컬럼을 UPDATE 하지 않는다.

- `application_type`
- `announcement_title`, `summary`, `program_description`, `recruitment_guide`, `application_method`, `learning_support_content`, `additional_content_html`, `remarks`
- `contact_name`, `contact_phone`, `contact_email`
- `thumbnail_file_object_id`
- `start_at`, `end_at` (UJAT 하반기 행 포함)
- `program_recruitment_attachment` 행

상태·모집 유형·`target_type` 처럼 시나리오 식별에 필요한 값만, **그 컬럼이 비어 있을 때** 채운다. CMS가 저장한 기간·문구를 시드 기본값으로 되돌리지 마라.

### 2. 프로그램 첨부를 모집 행에 복사하지 않는다

`LocalDemoRecruitmentRowBackfill.copyMissingRowFiles` 를 일반 Primary Case·UJAT 시드에서 호출하지 마라.

- 행 첨부가 없으면 `[]` 로 둔다.
- 행 `thumbnail_file_object_id` 가 없으면 null 로 둔다. 프로그램 썸네일로 채우지 마라.

`retireSupersededProgramApplicationBindings` 는 유지한다. 같은 신청 유형의 RECRUITMENT 바인딩이 활성인데 PROGRAM 신청 바인딩을 다시 `active_yn=true` 로 만들지 마라. `defaultFormBindingInternalService.applyForTrustedCaller` 가 그 PROGRAM 바인딩을 되살리면, 호출 직후 retire 가 끄는지 확인하고, 끄지 못하면 apply 쪽에서 행 바인딩이 있는 유형은 PROGRAM 바인딩을 만들지 마라.

---

## 수용 기준

백엔드를 수정한 뒤 **한 번 더 기동**하고 아래를 확인한다. 기동 전에 저장한 값이 기동 후에도 같아야 한다.

1. `168004` / `168241` 에 `announcementTitle`, `programDescription`, `recruitmentGuide`, 문의처, 행 첨부를 저장한다.
2. 프로세스 재시작 후  
   `GET /api/portal/programs/168004?recruitmentId=168241&applicationType=ORGANIZATION`  
   의 `title`, `description`, `recruitmentGuide`, `contactName`, `attachments` 가 저장값과 같다.
3. 같은 프로그램 `168242`, `168243` 상세의 문구·문의처·첨부·썸네일은 168241 과 다르지 않게 유지된다. 168241 첨부가 둘에 복사되어 있으면 실패다.
4. `182101` 봉사자 하반기 `182213` 의 `startAt`/`endAt` 를 바꾸고 재시작해도 `182212` 기간은 그대로다. `182213` 도 시드 날짜로 되돌아가지 않는다.
5. 행 문구가 비어 있는 상세는 그 항목이 null 이다. 프로그램 `description` 으로 채우지 않는다. 제목만 행 `announcement_title` 이 없을 때 프로그램 공고명을 쓴다.
