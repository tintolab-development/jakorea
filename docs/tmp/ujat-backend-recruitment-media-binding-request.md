# UJAT 프로그램 등록 백엔드 수정·검증 요청 프롬프트

> 아래 내용을 백엔드 담당자에게 그대로 전달해 주세요.
>
> 목적은 UJAT 프로그램 등록 플로우에서 모집정보별 섬네일·첨부파일이 실제 모집 row에 저장되는지 검증하고, 배포 환경의 계약이 소스와 다를 때만 백엔드를 수정하는 것입니다. 현재 백엔드 소스에는 관련 row API와 staging 파일 재바인딩 로직이 이미 있으므로, 먼저 실제 배포 계약과 테스트로 확인한 뒤 필요한 부분만 변경해 주세요.

## 1. 작업 배경

UJAT CMS 등록 화면에는 다음 모집정보가 각각 별도 form으로 존재합니다.

- 기관 모집
- 봉사자 상반기 모집
- 봉사자 하반기 모집

각 form의 모집정보 상세에는 다음 파일 필드가 있습니다.

- 섬네일 1개
- 첨부파일 0개 이상

현재 프론트는 파일을 프로그램 생성 전에 upload-first 방식으로 업로드하고, 파일 ID를 draft/overlay에 보관합니다. 프로그램 생성 요청에는 모집 row가 아직 생성되지 않았으므로 row ID를 넣을 수 없습니다.

따라서 처리 순서는 다음과 같습니다.

1. 파일 업로드 완료를 기다린다.
2. UJAT 프로그램을 생성한다.
3. 생성 응답의 모집 row ID와 `recruitTerm`을 확인한다.
4. 생성된 모집 row별로 섬네일과 첨부파일을 PUT한다.
5. 미디어 연결에 실패하면 프론트가 방금 생성한 프로그램을 삭제하여 등록을 실패 처리한다.

중요하게, 모집정보 파일은 프로그램 공통 대표 이미지/공통 첨부가 아니라 UJAT 모집 row별 미디어입니다.

## 2. 현재 프론트가 기대하는 UJAT row 매핑

프론트는 날짜 순서나 배열 index로 row를 찾지 않고, 다음 값을 기준으로 row를 찾습니다.

| UJAT form | overlay prefix | row 조건 |
| --- | --- | --- |
| 기관 모집 | `ujatRecruit.detailInfo` | `recruitmentType = PARTICIPANT` |
| 봉사자 상반기 | `recruitVolunteer.h1.detailInfo` | `recruitmentType = VOLUNTEER`, `recruitTerm = FIRST_HALF` |
| 봉사자 하반기 | `recruitVolunteer.h2.detailInfo` | `recruitmentType = VOLUNTEER`, `recruitTerm = SECOND_HALF` |

프론트가 사용하는 요청은 다음과 같습니다.

```http
PUT /api/admin/programs/{programId}/recruitments/{recruitmentId}/thumbnail
Content-Type: application/json

{"fileObjectId": 501}
```

```http
PUT /api/admin/programs/{programId}/recruitments/{recruitmentId}/attachments
Content-Type: application/json

{"fileObjectIds": [601, 602]}
```

첨부파일 요청은 전체 교체 의미입니다.

- 배열 순서를 `display_order`로 저장한다.
- `[]`는 해당 row 첨부 전체 삭제다.
- 다른 모집 row의 첨부는 변경하지 않는다.
- 동일 요청을 반복해도 중복 row가 생기지 않는 idempotent 동작이어야 한다.

섬네일 요청은 다음 의미입니다.

- `fileObjectId`가 숫자면 해당 row 섬네일로 교체한다.
- `fileObjectId: null`이면 해당 row 섬네일 연결만 해제한다.
- 파일 object 자체는 기존 파일 보존 정책에 따라 처리한다.

## 3. 반드시 먼저 확인할 현재 백엔드 계약

다음 소스와 실제 배포 API가 일치하는지 확인해 주세요.

- `ProgramRecruitmentRowController`
- `ProgramRecruitmentContentService`
- `ProgramRegistrationStagingFileRebindService`
- `ProgramRecruitmentRowReader`
- `ProgramRecruitmentResponse`
- `GeneralProgramRecruitmentCommandService`
- `ProgramCreateRequest`
- `ProgramRecruitmentRequest`

현재 소스 기준으로 다음 API는 이미 존재합니다.

- `GET /api/admin/programs/{programId}/recruitments/{recruitmentId}/attachments`
- `PUT /api/admin/programs/{programId}/recruitments/{recruitmentId}/attachments`
- `PUT /api/admin/programs/{programId}/recruitments/{recruitmentId}/thumbnail`
- `DELETE /api/admin/programs/{programId}/recruitments/{recruitmentId}/thumbnail`

현재 row 상세 응답에는 다음 필드가 포함되어야 합니다.

```json
{
  "id": 31,
  "recruitmentType": "VOLUNTEER",
  "recruitTerm": "FIRST_HALF",
  "thumbnailFileObjectId": 502,
  "attachments": [
    {
      "fileObjectId": 602,
      "displayOrder": 0
    }
  ]
}
```

`ProgramRecruitmentResponse`에 이미 row 섬네일 ID와 첨부파일 배열이 있다면 별도 DTO 필드를 추가하지 마세요. 생성 응답 또는 생성 직후 상세 응답에서 row ID와 `recruitTerm`을 받을 수 있는지만 확인해 주세요.

참고로 현재 프론트는 단건 row 섬네일 GET API에 의존하지 않고 프로그램 상세의 `programRecruitments[].thumbnailFileObjectId`와 `attachments`를 사용합니다. 따라서 단건 row 섬네일 GET을 새로 추가하는 것은 필수가 아니며, 실제 배포 OpenAPI에서 row 응답 필드가 누락된 경우에만 보완해 주세요.

## 4. 필요한 백엔드 구현 또는 보완

### 4.1 UJAT 생성 시 모집 row 보장

UJAT 생성 요청이 다음 row를 정확히 생성하는지 확인해 주세요.

- `PARTICIPANT` 기관 모집 row 1개
- `VOLUNTEER + FIRST_HALF` 봉사자 상반기 row 1개
- `VOLUNTEER + SECOND_HALF` 봉사자 하반기 row 1개

각 row는 다음 조건을 만족해야 합니다.

- 생성 응답 또는 생성 직후 상세 응답에 양수 `id`가 있다.
- 봉사자 row의 `recruitTerm`이 각각 `FIRST_HALF`, `SECOND_HALF`다.
- 상반기·하반기 row가 날짜 정렬 또는 생성 순서에 의존하지 않는다.
- `programId`와 `recruitmentId`가 실제 부모-자식 관계다.
- 없는 반기의 form에 미디어가 없는 경우에는 해당 row 미디어 PUT이 필요하지 않다.
- 미디어가 있는 반기의 row가 없으면 조용히 무시하지 말고 명확한 오류를 반환한다.

현재 `ProgramRecruitmentRequest.recruitTerm`이 UJAT volunteer row의 canonical 값이므로, `serviceDetailJson`, form overlay, 날짜값을 파싱하여 반기를 추론하지 마세요.

### 4.2 모집 row 미디어 PUT 계약

다음 검증을 보장해 주세요.

1. `programId`가 존재하고 삭제되지 않은 프로그램이어야 한다.
2. `recruitmentId`가 해당 `programId`의 row여야 한다.
3. 다른 프로그램의 row ID를 섞어 요청하면 `404 RECRUITMENT_NOT_FOUND` 계열로 거부한다.
4. UJAT 및 구조화 모집이 아닌 프로그램에는 기존 정책대로 적용하지 않는다.
5. 관리자 프로그램 수정 권한과 기존 tenant/sponsor 권한 검사를 유지한다.
6. 요청 파일은 다음 조건을 모두 만족해야 한다.
   - `ownerDomain = PROGRAM_CONTENT`
   - `filePurpose = PROGRAM_THUMBNAIL` 또는 `PROGRAM_DETAIL_ATTACHMENT`
   - `uploadStatus = AVAILABLE`
   - `scanStatus = CLEAN`
   - 삭제되지 않은 파일
   - 현재 관리자에게 허용된 파일 접근 범위
7. 섬네일 PUT에는 첨부 목적 파일을 사용할 수 없고, 첨부 PUT에는 섬네일 목적 파일을 사용할 수 없다.
8. 다른 관리자가 업로드한 staging 파일을 소유권 없이 가져갈 수 없어야 한다.

### 4.3 upload-first staging 파일 재바인딩

프로그램 생성 전 업로드 파일은 다음 형태 중 하나일 수 있습니다.

- 신규 계약: `PROGRAM_CONTENT / PROGRAM / ownerId = null`
- 레거시 호환: `PROGRAM_CONTENT / PROGRAM / ownerId = 1`

row 미디어 PUT에서 위 staging 파일을 받으면 다음을 원자적으로 처리해야 합니다.

1. 파일 소유자와 업로드한 관리자 권한을 검증한다.
2. 파일 목적을 검증한다.
3. 파일 소유권을 `PROGRAM_CONTENT / PROGRAM_RECRUITMENT / recruitmentId`로 변경한다.
4. 연결 테이블의 owner 정보도 동일 row로 변경한다.
5. 섬네일은 `program_recruitment.thumbnail_file_object_id`에 연결한다.
6. 첨부는 `program_recruitment_attachment`에 순서와 함께 연결한다.

파일 소유권 변경과 DB 연결 변경 중 하나만 성공한 상태가 남지 않도록 트랜잭션 경계를 확인해 주세요. 이미 row에 소유된 파일을 다시 PUT하는 경우에는 정상적인 교체 요청으로 허용해야 합니다.

staging 파일을 다른 row가 먼저 claim한 경우에는 기존 소유권을 덮어쓰지 말고 안정적인 오류 코드로 거부해야 합니다.

### 4.4 전체 교체·중복·동시성 정책

첨부 PUT은 전체 교체 API이므로 다음을 명시하고 테스트해 주세요.

- 기존 대상 row 첨부만 삭제 후 요청 순서로 다시 연결한다.
- 다른 row의 첨부는 절대 삭제하지 않는다.
- `[]`는 정상적인 clear 요청이다.
- 파일 ID가 중복되면 기존 정책을 명확히 한다. 권장 정책은 요청을 400으로 거부하거나, 현재 구현처럼 순서를 보존한 dedupe를 OpenAPI에 명시하는 것입니다.
- 같은 요청을 반복해도 첨부 연결이 누적되지 않는다.
- 동시에 두 관리자가 같은 staging 파일을 서로 다른 row에 연결할 때 한 요청만 성공해야 한다.
- 실패 시 기존 대상 row의 미디어가 부분적으로 깨지지 않아야 한다.

### 4.5 프로그램 삭제 및 프론트 rollback 호환

프론트는 생성 후 미디어 연결 중 오류가 발생하면 생성된 프로그램 DELETE를 호출합니다.

다음 상태가 남지 않는지 확인해 주세요.

- 삭제된 프로그램의 `program_recruitment_attachment` 잔여 연결
- 삭제된 row의 `thumbnail_file_object_id` 잔여 연결
- 삭제된 프로그램에 매달린 row owner 파일
- staging 파일이 영구 orphan 상태로 남는 현상

기존 삭제 정책상 파일 object를 물리 삭제하지 않는다면, 해당 파일의 soft-delete/orphan 정리 정책과 담당 배치가 무엇인지 문서화해 주세요. 프로그램 DELETE가 row 연결을 cascade하지 않는다면 백엔드 보완이 필요합니다.

HTTP 요청 여러 개를 하나의 DB 트랜잭션으로 묶으라는 의미는 아닙니다. 현재 프론트의 rollback 계약이 안전하게 동작하도록 삭제 후 데이터 정합성을 확인해 주세요.

## 5. 관리자 등록 form 및 draft-only 필드 점검

UJAT 등록 플로우의 다음 6개 form을 대상으로 create → detail GET → update → detail GET round-trip을 수행해 주세요.

1. 공통정보
2. 기관 모집정보
3. 봉사자 상반기 모집정보
4. 봉사자 하반기 모집정보
5. 기관 신청정보
6. 봉사자 신청정보

다음 필드군이 프로그램 생성 후 실제 사용되는 저장소에 보존되는지 확인해 주세요.

- 기본정보
- KPI
- 급여
- 교육 일정
- 정원 및 지역
- 모집 row별 운영/모집 기간
- 모집 row별 설명·안내·신청방법·담당자
- 기관/봉사자 신청 form binding
- 동적 학년·반·수업시간 block ID
- form `editorState`
- 비활성 탭의 draft 및 overlay

각 필드에 대해 다음 표를 작성해 주세요.

| form | field/path | create 저장 위치 | update 저장 위치 | detail GET 응답 위치 | draft-only 여부 | 결과 |
| --- | --- | --- | --- | --- | --- | --- |

판정 기준은 다음과 같습니다.

- 관리자 프로그램 데이터는 프로그램 상세, 모집 row, typed form binding 또는 명시된 editor state에 보존되어야 한다.
- 단순히 브라우저 local draft 또는 임시 overlay에만 남는 필드는 누락으로 본다.
- `editorState`, `uiState`, `overlay`, `editorMeta`, `clientMeta`는 신청자 업무 데이터와 혼합하지 않는다.
- 비활성 탭의 값도 최종 create/update 요청에 포함되는지 확인한다.
- 생략된 값과 명시적 빈 값/null의 의미를 기존 API 계약대로 보존한다. 임의의 기본값을 만들지 않는다.
- 프로그램 ID별 예외나 form 제목 문자열 파싱으로 저장 위치를 결정하지 않는다.

## 6. 수료증 첨부 필드 처리

`이전 UJAT 활동 기수 → 수료증 첨부`는 관리자 프로그램 등록 파일이 아니라 최종 지원자가 제출하는 신청서 응답으로 취급해야 합니다.

백엔드에서 다음을 확인해 주세요.

- `previousTermFileNames`를 프로그램 생성/수정 DTO의 업무 데이터로 저장하지 않는다.
- 관리자 form template/editor state에 지원자별 실제 파일 object ID를 넣지 않는다.
- 지원자 제출 파일은 기존 `fileObjectIdsByQuestion` 계약으로 저장한다.
- 질문 key와 form response ID 기준으로 파일을 연결한다.
- 지원자 파일의 소유자·목적·상태·접근권한 검증을 기존 런타임 정책으로 수행한다.
- 관리자 프로그램 생성 요청에 수료증 파일 ID를 추가하지 않는다.

`FormRevisionRequest`의 `fileObjectIdsByQuestion`과 `FormSubmissionFileService`가 현재 계약이라면 이를 유지하고, 관리자 등록 경로와 신청자 제출 경로를 서로 연결하는 임시 fallback을 추가하지 마세요.

## 7. 오류 계약

기존 프로젝트의 `ApiResponse` 및 오류 변환 방식을 사용해 주세요. 새 문자열 오류를 무분별하게 추가하지 말고 현재 코드의 안정적인 오류 코드를 재사용하세요.

최소한 다음 케이스가 구분되어야 합니다.

| 케이스 | 기대 상태 |
| --- | --- |
| 존재하지 않는 program/row 또는 부모 불일치 | 404, `RECRUITMENT_NOT_FOUND` 계열 |
| 파일 ID 없음/삭제됨 | 404, 기존 file-not-found 계열 |
| purpose 불일치 | 400, 기존 purpose-mismatch 계열 |
| 다른 관리자 또는 다른 리소스 소유 파일 | 403, 기존 owner-mismatch 계열 |
| 업로드/바이러스 검사 미완료 | 409, 기존 not-available 계열 |
| 프로그램 수정 권한 없음 | 기존 권한 오류 |
| 신청자가 있는 모집 row 삭제/변경 제한 | 기존 409 정책 |

응답 envelope, 오류 JSON 구조, `field`/`code` 규칙은 기존 API와 동일하게 유지해 주세요.

## 8. 테스트 요구사항

다음 테스트를 추가하거나 기존 테스트가 이미 있으면 실제 배포 경로까지 실행해 주세요.

### 모집 row 미디어

- UJAT 기관 row에 staging 섬네일 연결
- UJAT 기관 row에 staging 첨부 연결
- 봉사자 `FIRST_HALF` row에만 상반기 미디어 연결
- 봉사자 `SECOND_HALF` row에만 하반기 미디어 연결
- 동일 파일을 날짜 순서가 다른 row에 연결할 때 `recruitTerm` 기준으로 올바른 row 선택
- 기관·상반기·하반기 세 row의 미디어가 서로 섞이지 않음
- 섬네일 교체 및 `null` clear
- 첨부 전체 교체, 순서 보존, 빈 배열 clear
- 다른 모집 row의 기존 첨부/섬네일 보존
- 생성 전 `ownerId = null` staging 파일 재바인딩
- 레거시 `ownerId = 1` staging 파일 재바인딩
- 다른 관리자 staging 파일 claim 거부
- 다른 목적 파일 거부
- CLEAN/AVAILABLE이 아닌 파일 거부
- 부모 프로그램이 다른 row ID 거부
- 동일 PUT 반복 시 중복 연결 없음
- 두 요청이 같은 staging 파일을 동시에 claim할 때 단일 성공

### 생성·상세 round-trip

- UJAT 생성 응답에 PARTICIPANT와 두 VOLUNTEER row ID가 모두 있음
- 각 volunteer row의 `recruitTerm`이 정확함
- 생성 후 row 미디어 PUT 직후 상세 GET에 `thumbnailFileObjectId`와 `attachments`가 반영됨
- 프로그램 상세/포털 응답에서 UJAT row 미디어가 프로그램 공통 미디어로 대체되지 않음
- 미디어 연결 실패 후 프론트 rollback DELETE 시 row 연결과 orphan 상태 확인

### form/draft 저장

- 6개 form의 필드가 create → GET → update → GET에서 보존됨
- 비활성 탭 값이 최종 create/update에 누락되지 않음
- overlay/editorState가 의도된 form binding에 보존됨
- 지원자 수료증 파일은 관리자 프로그램 저장이 아니라 `fileObjectIdsByQuestion`으로만 저장됨
- `previousTermFileNames`가 프로그램 업무 데이터로 저장되지 않음

가능하면 다음 계층을 모두 검증해 주세요.

- Service unit test
- MockMvc API test
- PostgreSQL/Testcontainers integration test
- OpenAPI runtime/schema contract test

## 9. OpenAPI 및 프론트 호환

백엔드 계약이 변경되는 경우에만 다음을 수행해 주세요.

1. Controller annotation과 request/response schema를 갱신한다.
2. OpenAPI snapshot을 갱신한다.
3. 생성 클라이언트/타입을 갱신한다.
4. 프론트 `ProgramRecruitmentResponse` 및 row media client와 호환되는지 확인한다.
5. 기존 프로그램 공통 첨부/대표 이미지 API와 일반 프로그램 row API를 회귀 검증한다.

현재 프론트가 기대하는 핵심 응답 필드는 다음과 같습니다.

- `programRecruitments[].id`
- `programRecruitments[].recruitmentType`
- `programRecruitments[].recruitTerm`
- `programRecruitments[].thumbnailFileObjectId`
- `programRecruitments[].attachments[]`

현재 소스와 배포 API가 모두 이 계약을 만족한다면 DTO나 DB migration을 추가하지 말고 테스트와 배포 확인 결과만 남겨 주세요.

## 10. 수정하지 말아야 할 범위

- Naver OAuth client ID/secret 또는 callback URL 변경
- 프로그램 공통 대표 이미지/공통 첨부를 UJAT 모집 row 미디어 대신 사용하는 fallback 추가
- 날짜 순서, 배열 index, overlay 문자열 파싱으로 상·하반기 row를 추론하는 로직 추가
- `previousTermFileNames`를 관리자 프로그램 데이터로 승격
- 지원자 파일을 관리자 staging 파일로 재사용
- 기존 일반 프로그램의 공통 미디어 처리 정책 변경
- 프론트가 이미 처리하는 생성 후 rollback을 무시한 채 부분 성공을 정상 완료로 처리
- 실제 누락 증거 없이 새로운 테이블/컬럼/migration 추가

## 11. 완료 보고 형식

작업 후 다음 형식으로 보고해 주세요.

```md
## 결과
- [ ] 배포 백엔드가 row 미디어 API 계약과 일치함
- [ ] UJAT 생성 응답에 세 모집 row의 id/recruitTerm이 포함됨
- [ ] staging 파일이 대상 row로 재바인딩됨
- [ ] row별 섬네일/첨부 전체 교체가 동작함
- [ ] 미디어 실패/삭제 rollback 후 orphan 상태 없음
- [ ] 6개 form round-trip 검증 완료
- [ ] 수료증 파일이 fileObjectIdsByQuestion 런타임 계약으로만 저장됨

## 실제 수정 파일
- path/to/file

## 테스트
- command: ...
- result: ...

## API 확인 결과
- request/response example
- status/error code example

## 미해결 사항
- 환경 또는 배포 버전 차이
- 재현 절차
- 백엔드/프론트 중 추가 조치가 필요한 부분
```

## 12. 최종 판단 기준

다음 세 조건을 모두 만족하면 백엔드 코드 변경 없이 “현재 계약 유지, 검증 완료”로 종료해도 됩니다.

1. UJAT 생성 후 세 모집 row의 ID와 `recruitTerm`을 프론트가 받을 수 있다.
2. row별 thumbnail/attachments PUT이 staging 파일을 올바른 row로 재바인딩한다.
3. 6개 form의 영속 필드와 지원자 runtime 파일 계약이 round-trip 테스트로 확인된다.

이 중 하나라도 실제 배포 환경에서 실패하면 실패한 조건만 수정하고, 수정 이유·오류 코드·테스트 증거를 완료 보고에 남겨 주세요.
