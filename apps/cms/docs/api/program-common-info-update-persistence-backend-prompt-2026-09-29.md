# Cursor prompt — 프로그램 공통정보 전체 필드 PATCH→GET 저장 정합성 보장 (JABACK)

| 항목 | 값 |
|---|---|
| 대상 레포 | JABACK |
| 주 API | `PATCH /api/admin/programs/{programId}` |
| 대상 화면 | CMS 프로그램 관리 → 하위 프로그램 상세 → 공통정보 수정 |
| 프로그램 유형 | 일반 기관형·일반 개인형·1사1교·UJAT·교육받은 교사 |
| 우선순위 | P0 — 저장 성공처럼 보이지만 새로고침하면 구값으로 되돌아가는 문제 |
| 작성일 | 2026-09-29 |
| 상태 | 사업 분야 P0는 BE 수정·실 API 재검증 완료. 나머지 전체 필드 수용 조건은 계속 적용 |
| BE handoff | `JABACK/docs/frontend/program-business-area-update-frontend-handoff-2026-09-29.md` |

아래 지시는 **백엔드 레포 JABACK에서 실행**하라.

- 프론트 레포를 수정하지 마라.
- 단일 필드만 임시 예외 처리하지 말고, CMS 공통정보에서 수정 가능한 **모든 필드**에 동일한 PATCH 저장 계약을 적용하라.
- HTTP 2xx는 transaction commit과 canonical 재조회가 성공했을 때만 반환하라.
- 요청값을 응답에 복사해 저장된 것처럼 보이게 하지 마라.
- `serviceDetailJson`, 등록 overlay, 교육받은 교사 config/detail JSON은 UI 복원용 sidecar다. canonical DB 값이 있으면 sidecar 구값이 canonical을 덮지 못하게 하라.

---

## 1. 최초 확정 재현과 해결 상태

아래 실패 결과는 수정 전 재현 기록이다. BE 수정 후 `186010`의
`PATCH {"businessArea":"기업가정신"}` 응답과 직후 GET이 모두 `기업가정신`으로
일치하는 것을 2026-09-29에 다시 확인했다.

근본 원인은 `program_education_setting` DB 트리거가 기존 `business_area_id`를 기준으로
새 `business_field`를 구값으로 되돌린 것이었다. BE는 사업 분야 갱신 시
`business_area_id`를 함께 초기화하여 새 이름으로 FK를 재해석하도록 수정했다.

로컬 JABACK을 재시작한 뒤 실제 관리자 API 로그인으로 확인했다.

### 환경

- API: `http://localhost:8080`
- 관리자: `admin1@jakorea.org`
- 대상 프로그램: `186010`
- 프로그램 유형: `TRAINED_TEACHER`
- 프로그램명: `수정테스트용 교육받은 교사(수정2)`
- 변경 전 사업 분야: `디지털리터러시`

### 요청

```http
PATCH /api/admin/programs/186010
Authorization: Bearer {admin-access-token}
Content-Type: application/json

{
  "businessArea": "기업가정신"
}
```

### 실제 결과

```text
PATCH status: 200
PATCH response.businessArea: 디지털리터러시
immediate GET status: 200
GET response.businessArea: 디지털리터러시
```

같은 서버에서 빈 문자열 요청은 신규 검증 코드가 반영되어 있음을 확인했다.

```http
PATCH /api/admin/programs/186010

{
  "businessArea": ""
}
```

```text
HTTP 400
code: PROGRAM_BUSINESS_AREA_REQUIRED
```

따라서 다음은 확인됐다.

1. 프론트 mock 저장 문제가 아니다.
2. 실제 관리자 인증과 실제 remote API를 사용했다.
3. 재시작된 최신 백엔드 코드가 실행 중이다.
4. `businessArea` JSON 필드는 인식한다.
5. 유효한 값의 PATCH만 200으로 무시되며 canonical 값이 갱신되지 않는다.

이 문서의 첫 번째 완료 조건은 위 재현이 `기업가정신`으로 저장되는 것이다.

---

## 2. 해결해야 하는 공통 계약

### 2.1 PATCH 의미

모든 공통정보 필드는 다음 규칙을 따른다.

1. 요청에 필드가 있으면 해당 필드만 갱신한다.
2. 요청에 필드가 없으면 기존 값을 유지한다.
3. 명시적 삭제는 기존 `clearFields` 계약으로만 처리한다.
4. 빈 문자열 허용 여부는 필드별 validation 정책에 따르되, 무시하고 200을 반환하지 않는다.
5. 유효하지 않은 마스터·FK·enum은 명확한 4xx code로 실패한다.
6. 단일 필드 PATCH가 다른 필드를 null·기본값·과거 JSON 값으로 되돌리지 않는다.
7. 여러 필드를 한 번에 보내면 모두 같은 transaction에서 반영된다.
8. transaction 중 하나라도 실패하면 전체 rollback하고 2xx를 반환하지 않는다.

### 2.2 저장 성공 응답

PATCH 성공 응답은 다음 순서로 만들어라.

```text
request deserialize
→ validation / authorization / edit-window 검사
→ canonical 테이블 갱신
→ sidecar JSON 동기화
→ flush / commit 가능한 상태 확인
→ canonical query로 같은 ID 재조회
→ ProgramResponse 반환
```

요청 DTO 또는 command 객체를 응답 DTO에 그대로 복사하지 마라.

PATCH 응답과 직후 아래 GET은 필드별로 동일해야 한다.

```http
GET /api/admin/programs/{programId}
```

목록에 노출되는 필드는 목록 GET에서도 같은 canonical 값을 반환해야 한다.

---

## 3. 유형별 적용 범위

다음 유형이 동일한 원칙을 사용해야 한다.

### 일반

- `GENERAL`
- `GENERAL_ORGANIZATION`
- `GENERAL_INDIVIDUAL`

### 특수 유형

- `COMPANY_SCHOOL`
- `UJAT`
- `TRAINED_TEACHER`

유형별로 저장 테이블이나 상세 JSON 구조가 다르더라도 외부 PATCH 계약은 동일해야 한다.

특정 유형에서 마스터값을 찾지 못했을 때 요청을 조용히 무시하는 코드를 금지한다. 예를 들어 교육받은 교사만 `ProgramBusinessAreaNotFoundException`을 삼키고 `patchBusinessArea=false`로 바꾸는 동작은 허용하지 않는다.

---

## 4. 공통정보 필드 저장 매트릭스

아래는 CMS 공통정보 편집에서 PATCH될 수 있는 필드다. 실제 canonical 테이블·컬럼은 백엔드 구현을 확인하여 테스트에 명시하라.

### 4.1 프로그램 식별·표시

- `title` / `nameKo`: 관리명 또는 공고명
- `mainTitle`: 대표 프로그램명
- `titleEn` / `nameEn`: 영문 프로그램명
- `description`: 프로그램 설명
- `oneLineIntroduction` / `summary`: 한 줄 소개
- `textbookName`
- `textbookNameEn`
- `detailedProgramId`
- `educationStructure`
- `teamDivision`

요구사항:

- 교육받은 교사의 공고명·세부명 top-level 컬럼과 nested JSON이 서로 달라지지 않게 한다.
- `detailedProgramId`는 실제 마스터 ID를 저장한다.
- 일정형에서 허용되지 않는 `detailedProgramId`는 기존 명시적 validation으로 실패한다.
- 표시명과 교재명·세부 프로그램명을 임의로 서로 덮어쓰지 않는다.

### 4.2 사업 분야·교육 대상·운영 속성

- `businessArea`
- 입력 호환 alias `businessField`
- `targetLevel`
- `targetLevels`
- `educationProcess`
- `ipOwned`
- `courseDeliveredBy`
- `partnerInvolvement`
- `ips`
- `programCategory`
- `programChannel`
- `type` / `deliveryType`
- `format`
- `category`

사업 분야 요구사항:

- canonical 저장소는 `program_education_setting.business_field`다.
- 공식 요청 필드는 `businessArea`다.
- `businessField`는 입력 호환 alias다.
- 둘 다 있으면 JSON 필드 순서와 무관하게 `businessArea`가 우선한다.
- `경제금융`, `진로취업`, `기업가정신`, `디지털리터러시`를 현재 로컬 마스터에서 확인했다.
- 유효한 마스터값을 200으로 무시하지 않는다.
- PATCH 응답과 GET은 `program_education_setting.business_field`를 우선한다.
- 상세 JSON의 과거 `businessArea`는 fallback일 뿐 canonical 값을 덮지 못한다.

교육 대상 요구사항:

- 단수 `targetLevel`과 배열 `targetLevels`의 우선순위를 명시하고 기존 계약대로 유지한다.
- 배열 변경·삭제가 이전 단수값 때문에 되돌아오지 않게 한다.
- 프로그램 교육 설정과 상세 JSON이 서로 다른 값을 반환하지 않게 한다.

### 4.3 사업 운영·모집 기간

- `startDate`
- `endDate`
- `businessStartDate`
- `businessEndDate`
- `businessPeriod`
- `applicationStartDate`
- `applicationEndDate`
- `recruitments[]`
- 강사 모집 기간
- 봉사자 모집 기간
- 결과 발표일·발표 방법

요구사항:

- CMS가 선택한 실제 날짜를 저장하고 임의로 연도 시작·종료일로 합성하지 않는다.
- 날짜형은 서울 달력일 기준을 유지한다.
- 일반 프로그램의 유형별 모집 창은 `recruitments[]` canonical 계약을 우선한다.
- 공통정보만 수정할 때 모집 기간·모집 상태를 재전송하거나 덮어쓰지 않는다.
- 모집 시작 후 편집 제한은 기존 edit-window 정책을 유지하되, 허용된 공통정보 필드까지 무시하지 않는다.

### 4.4 후원사·담당자

- `sponsorId`
- `sponsors[]`
- 후원사 담당자 ID
- `managerName`
- `contactName`
- `contactPhone`
- `contactEmail`

요구사항:

- `sponsors[]`가 canonical이면 legacy `sponsorId`와 우선순위를 명시한다.
- 담당자 여러 명을 한 명으로 축소하지 않는다.
- GET 마스킹 문자열을 저장 원문으로 다시 쓰지 않는다.
- 후원사만 수정할 때 다른 담당자 배정을 삭제하지 않는다.

### 4.5 장소·기관

- `schoolId`
- `district`
- `institutionType`
- `venue`
- `venueKind`
- `venueDetail`

요구사항:

- 장소 구분과 직접 입력 상세 장소를 분리한다.
- `venueKind=other`의 상세값과 학교 내·외부 enum이 서로 덮어쓰지 않게 한다.
- top-level 컬럼과 nested `generalCommonInfo`의 우선순위를 고정한다.

### 4.6 KPI·인원

- `totalParticipants`
- `finalSchools`
- `finalClasses`
- `maleParticipants`
- `femaleParticipants`
- `generalVolunteers`
- `staffVolunteers`
- `returningVolunteers`
- `generalTeachers`
- `educatedTeachers`
- `instructors`

요구사항:

- KPI 숫자 `0`을 미입력으로 보지 않는다.
- top-level canonical KPI가 있으면 stale nested KPI가 덮지 못한다.
- 사업 분야 등 다른 필드만 수정할 때 KPI가 0 또는 null로 초기화되지 않는다.
- 개인형 프로그램의 학교·학급 KPI 정책은 기존 FE/BE 계약을 유지한다.

### 4.7 일정·커리큘럼

- `rounds[]`
- `schedules[]`
- 커리큘럼 회차
- 일정 행
- 일정명
- 교육 날짜·시간
- 교육 형태
- 참여 방식
- 사전교육 행
- 지역별 정원
- 반기 일정
- 불가일

요구사항:

- 수정한 행만 반영되고 미수정 행은 유지된다.
- 행 삭제·축소 후 orphan 인덱스나 JSON 행이 다시 나타나지 않는다.
- 배열 순서와 회차 번호를 안정적으로 재인덱싱한다.
- 일정형·커리큘럼형 전환 규칙을 기존 validation과 맞춘다.
- UJAT의 mock 기본 일정·정원을 실데이터로 저장하지 않는다.
- 공통정보만 수정할 때 일정·커리큘럼 전체를 교체하지 않는다.

### 4.8 임금·정산

- `wagePolicies[]`
- `paymentItems[]`
- 임금 등급 행
- 지급 항목
- 공제 항목
- `settlementRuleId`

요구사항:

- 공통정보 일부 수정으로 기존 임금·지급·공제 행을 삭제하지 않는다.
- 변경된 행은 PATCH 직후 응답과 GET에서 동일하다.
- 1사1교·교육받은 교사의 config/detail JSON 병합이 canonical 정산 테이블을 되돌리지 않는다.

### 4.9 설문·지원·부가정보

- 설문 메뉴 키
- `studentListRequired`
- 인터뷰 사용 여부
- `applicationPathId`
- `additionalContentHtml`
- `recruitmentGuide`
- `learningSupportContent`
- `remarks`
- `educationTargetDetail`
- `keyVisualImage`
- `attachmentFileNames`
- `adminAssignments`

요구사항:

- 부분 PATCH에서 보내지 않은 부가정보를 제거하지 않는다.
- 첨부파일 배열은 명시적으로 보낸 경우에만 교체한다.
- HTML·파일 정책과 기존 보안 검증을 우회하지 않는다.

---

## 5. canonical과 sidecar 우선순위

### 5.1 공통 원칙

canonical 컬럼·관계 테이블이 존재하는 필드는 다음 순서로 조회한다.

```text
canonical DB column/relation
→ 호환 projection
→ legacy serviceDetailJson/configJson fallback
```

다음 순서는 금지한다.

```text
stale serviceDetailJson/configJson
→ canonical DB 덮어쓰기
```

### 5.2 `serviceDetailJson`

- 부분 PATCH body에 `serviceDetailJson`이 없으면 기존 JSON을 유지한다.
- JSON이 있으면 RFC-7396 또는 유형별 명시 계약대로 병합한다.
- canonical 필드의 최신 요청값을 JSON에 mirror할 수는 있으나, JSON mirror가 canonical 쓰기를 대체하면 안 된다.
- canonical update 후 `syncFromStoredDetail` 같은 후처리가 실행된다면 canonical 필드를 역으로 구값으로 덮지 않는지 검증한다.
- `ProgramServiceDetailRequestNormalizer.merge`와 `applyCanonicalMasterFields` 결과를 테스트에서 직접 확인한다.

### 5.3 교육받은 교사 A/B 저장

교육받은 교사는 다음 두 저장·조회 계층이 있을 수 있다.

- A: 공용 programs PATCH/GET
- B: trained-teacher config/detail PATCH/GET

규칙:

1. A에서 저장한 최신 canonical 필드를 B의 과거 config가 덮지 않는다.
2. B 실패 후에도 A에서 성공한 최신 값은 유지된다.
3. A PATCH 응답을 만든 뒤 stale B를 재병합하지 않는다.
4. 공고명·세부명·사업 분야·KPI·테이블 필드의 top-level/nested 값을 동기화한다.

---

## 6. 우선 조사할 백엔드 경로

최소한 다음 경로를 실제 호출 순서대로 추적하라.

```text
ProgramAdminController.updateProgram
→ ProgramWriteCommandMapper.toUpdateCommand
→ ProgramServiceDetailRequestNormalizer.effective*
→ ProgramCommandService.updateProgram
→ ProgramEducationConfigurationService.patchSetting
→ serviceDetailCommandService.patchServiceDetail / replaceServiceDetail
→ generalProgramCanonicalProjectionService.syncFromStoredDetail
→ ProgramQueryService.getProgram
```

사업 분야 재현에서는 다음 값을 단계마다 로깅 또는 테스트 assertion으로 확인하라.

```text
ProgramUpdateRequest.businessArea
ProgramUpdateRequest.businessField
ProgramUpdateCommand.businessArea
requestedBusinessArea
patchBusinessArea
canonicalBusinessArea
program_education_setting.business_field (patchSetting 직후)
serviceDetailJson 내부 businessArea
ProgramQueryService base.businessArea
최종 ProgramResponse.businessArea
```

임시 로그를 운영 코드에 남기지 말고 테스트 assertion 또는 로컬 진단 로그로 확인하라.

특히 다음 가능성을 배제하라.

- request → command mapper에서 필드 누락
- `patchSetting` 이후 후처리가 구값으로 재덮어쓰기
- transaction 내 다른 projection sync가 동일 테이블을 갱신
- PATCH 응답 query가 다른 행·다른 테이블을 읽음
- 유형별 예외 처리에서 `patch*=false`로 조용히 변경
- config/detail 병합에서 과거 JSON 우선
- 캐시가 transaction commit 전 결과를 반환

---

## 7. 필수 자동화 테스트

### 7.1 필드별 단독 PATCH

공통정보 편집 가능 필드 각각에 대해 parameterized integration test를 작성하라.

각 테스트는 아래 전체 왕복을 검증한다.

```text
초기 DB seed
→ 한 필드만 PATCH
→ HTTP 2xx
→ PATCH response assertion
→ 같은 transaction 외부에서 동일 ID GET
→ canonical DB 직접 조회
→ 미수정 필드 전체 불변 assertion
```

필드별 테스트에서 단순히 mapper 결과만 확인하지 마라. 실제 DB와 controller HTTP 응답을 검증하라.

### 7.2 전체 일괄 PATCH

각 프로그램 유형마다 편집 가능한 공통정보 필드를 서로 다른 새 값으로 한 번에 보낸다.

검증:

- 모든 필드가 새 값
- 누락 필드 없음
- 타입 변환 오류 없음
- PATCH 응답과 GET 동일
- canonical DB와 JSON mirror 동일
- 미대상 모집·일정·신청 데이터 불변

### 7.3 부분 PATCH 보존

사업 분야만 PATCH하고 다음 필드가 이전 값 그대로인지 확인한다.

- 제목·대표명
- 운영 기간·모집 기간
- 후원사·담당자
- 교육 대상
- KPI
- 일정·커리큘럼
- 임금·지급·공제
- 설문·첨부·안내 HTML

다른 대표 필드도 동일 방식으로 한 번씩 단독 PATCH한다.

### 7.4 배열·행 테스트

- 일정 행 한 개 수정
- 일정 행 여러 개 일괄 수정
- 행 삭제
- 행 추가
- 순서 변경
- 커리큘럼 회차 축소
- 임금 행 수정·삭제
- 후원사 담당자 여러 명 유지

PATCH→GET 후 삭제한 행이 JSON fallback에서 부활하지 않아야 한다.

### 7.5 실패·rollback 테스트

- 빈 필수값
- 미등록 사업 분야
- 미등록 세부 프로그램 ID
- 허용되지 않는 enum
- 수정 기간 제한 위반
- B config/detail 저장 실패

실패 시:

- 명확한 4xx/5xx
- canonical DB 불변
- sidecar JSON 불변
- 성공 알림을 유발할 2xx 금지

---

## 8. 실제 API 검증 시나리오

### 8.1 사업 분야

로컬 마스터를 먼저 조회한다.

```http
GET /api/admin/textbook-business-areas?page=0&size=100
```

현재 확인된 값:

```text
경제금융
진로취업
기업가정신
디지털리터러시
```

테스트 프로그램 `186010`:

```http
PATCH /api/admin/programs/186010

{
  "businessArea": "기업가정신"
}
```

기대:

```text
PATCH response.businessArea = 기업가정신
GET response.businessArea = 기업가정신
program_education_setting.business_field = 기업가정신
```

### 8.2 반복 변경

같은 프로그램에서 순서대로 변경한다.

```text
디지털리터러시
→ 기업가정신
→ 진로취업
→ 경제금융
```

각 단계마다 PATCH 응답, GET, DB가 일치해야 한다.

### 8.3 유형별 실제 ID

로컬 DB에서 개인정보 없는 테스트 프로그램을 유형별로 선택한다. 존재하지 않는 ID를 문서에 고정하지 마라.

```text
GENERAL_ORGANIZATION 1건
GENERAL_INDIVIDUAL 1건
COMPANY_SCHOOL 1건
UJAT 1건
TRAINED_TEACHER curriculum 1건
TRAINED_TEACHER schedule 1건
```

테스트 전에 원본 JSON과 canonical 값을 백업하고, 검증 종료 후 필요한 경우 원값으로 복구한다.

---

## 9. 금지 사항

- 요청을 무시하고 200 반환
- PATCH 응답에 요청값만 복사
- 특정 프로그램 ID 하드코딩
- 교육받은 교사만 예외적으로 validation 무시
- FE가 두 번 PATCH하도록 요구
- FE 캐시로 백엔드 저장 실패를 숨김
- canonical 대신 `serviceDetailJson`을 최종 SSOT로 사용
- 부분 PATCH에서 전체 상세 JSON 교체
- 미수정 배열·테이블 행 삭제
- 기존 모집·신청·일정 정책 완화
- 테스트를 mapper 단위에서 끝내고 실제 DB round-trip 생략

---

## 10. 수용 조건

1. 프로그램 유형 전체에서 공통정보의 모든 편집 가능 필드를 개별 수정할 수 있다.
2. 모든 편집 가능 필드를 한 번에 일괄 수정할 수 있다.
3. PATCH 2xx 응답은 실제 canonical DB commit 결과다.
4. PATCH 응답과 직후 같은 ID GET이 모든 수정 필드에서 동일하다.
5. 브라우저 새로고침 후에도 수정값이 유지된다.
6. 미전송 필드는 기존 값이 유지된다.
7. `clearFields` 외의 누락·빈 값으로 필드가 삭제되지 않는다.
8. canonical 값이 stale sidecar JSON/config에 의해 되돌아가지 않는다.
9. 교육받은 교사 A/B 병합에서 A의 최신 값이 유지된다.
10. 배열 행 추가·수정·삭제·재정렬이 PATCH→GET 후 동일하다.
11. 한 필드 수정이 모집·일정·KPI·임금 등 다른 영역을 바꾸지 않는다.
12. 실패 시 명확한 오류와 전체 rollback을 보장한다.
13. 사업 분야 `186010` 재현이 `기업가정신`으로 정상 저장된다.
14. 유형별 integration test와 실제 로컬 API smoke 결과가 모두 통과한다.

---

## 11. 완료 보고 형식

완료 답변에 아래 내용을 포함하라.

1. 실제 근본 원인
   - request mapping
   - command mapping
   - canonical DB update
   - sidecar overwrite
   - projection/query
   - transaction/cache 중 해당 위치
2. 수정한 클래스·메서드 목록
3. 필드별 canonical 테이블·컬럼 매트릭스
4. 유형별 단독 PATCH 테스트 수와 결과
5. 유형별 전체 일괄 PATCH 테스트 결과
6. 배열·행 삭제 및 재인덱싱 테스트 결과
7. 실패·rollback 테스트 결과
8. 실제 API PATCH→GET smoke 결과
9. 프로그램 `186010` 사업 분야 변경 결과
10. 데이터 마이그레이션 또는 백필 필요 여부

