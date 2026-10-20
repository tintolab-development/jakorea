# Platform 교육현황 — 결석 사유 증빙 파일 업로드 백엔드 연동 확인

| 항목    | 값                                                             |
| ------- | -------------------------------------------------------------- |
| 작성일  | 2026-10-20                                                     |
| 대상    | Platform 마이페이지 교육현황 결석 사유 제출 모달               |
| FE 상태 | 업로드·제출 플로우 구현 완료                                   |
| BE 상태 | 신규 API 불필요. 파일 목적값·첨부 정책·스모크 테스트 확인 필요 |
| OpenAPI | 관련 Portal 파일 업로드/결석 사유 제출 경로 존재               |

## 0. 확인 결과

현재 프론트는 회원 포탈 공통 파일 업로드 플로우를 사용한다.

1. 업로드 요청 URL 발급
2. 발급된 `uploadUrl`로 파일 바이트 업로드
3. 파일 업로드 확정
4. `CLEAN` + `AVAILABLE` 상태까지 조회
5. 반환된 `fileObjectId[]`를 결석 사유 제출 body에 전달

결석 증빙 파일 목적값은 백엔드 파일 목적 정의에 맞춰 `ABSENCE_EVIDENCE`로 정렬했다.
기존 프론트의 `ABSENCE_REASON_EVIDENCE`는 백엔드 목적값과 일치하지 않아 업로드 요청이 거부될 수 있는 값이었다.

로컬 백엔드에 인증 없이 다음 경로를 호출한 결과는 모두 `401`이었다. 인증 라우트가 정상적으로 등록되어 있음을 확인했으며, 실제 업로드 성공 여부는 로그인 회원 토큰과 파일이 필요하다.

- `POST /api/portal/me/files/upload-requests`
- `POST /api/portal/me/program-applications/{applicationType}/{applicationId}/schedules/{scheduleId}/absence-reasons`

## 1. 사용 API

| 순서 | Method      | Path                                                                                                           | 용도                              |
| ---: | ----------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------- |
|    1 | POST        | `/api/portal/me/files/upload-requests`                                                                         | 회원 파일 업로드 URL 발급         |
|    2 | 응답 method | 응답의 `uploadUrl`                                                                                             | Object Storage 파일 바이트 업로드 |
|    3 | POST        | `/api/portal/me/files/{fileObjectId}/confirm`                                                                  | 파일 업로드 확정                  |
|    4 | GET         | `/api/portal/me/files/{fileObjectId}`                                                                          | 보안 검사 상태 확인               |
|    5 | POST        | `/api/portal/me/program-applications/{applicationType}/{applicationId}/schedules/{scheduleId}/absence-reasons` | 결석 사유 및 증빙 ID 제출         |

## 2. 요청 계약

### 2.1 파일 업로드 요청

```json
{
  "filePurpose": "ABSENCE_EVIDENCE",
  "originalFileName": "absence-proof.jpg",
  "contentType": "image/jpeg",
  "fileSize": 123456
}
```

프론트 제한:

- JPG/JPEG, PNG
- 파일당 최대 20MB
- 결석 사유 제출당 최대 20개

### 2.2 결석 사유 제출

```json
{
  "reason": "개인 사유로 교육에 참석하지 못했습니다.",
  "fileObjectIds": [12345, 12346]
}
```

`reason`은 필수이며 최대 2,000자, `fileObjectIds`는 선택이며 최대 20개다. 파일이 없으면 `fileObjectIds`를 생략한다.

## 3. 백엔드 확인 요청

신규 컨트롤러나 신규 path를 추가하는 작업은 아니다. 아래 정책이 현재 로컬·스테이징 백엔드에 동일하게 적용되는지만 확인해 주세요.

1. `filePurpose=ABSENCE_EVIDENCE`를 회원 포탈 업로드 목적값으로 허용
2. 결석 증빙 파일의 JPG/JPEG/PNG 및 파일당 20MB 정책 적용
3. 결석 사유 제출 시 로그인 회원 본인이 업로드한 파일만 허용
4. 파일 상태가 `CLEAN` 및 `AVAILABLE`인 경우에만 `fileObjectIds` 연결 허용
5. 다른 목적값 파일, 다른 회원 파일, 미확정·검사 중 파일 연결 거부
6. `fileObjectIds` 20개 초과 요청 거부
7. 연결된 파일의 목적값이 `ABSENCE_EVIDENCE`인지 검증

## 4. OpenAPI 보완 요청

현재 `AbsenceReasonSubmissionRequest.fileObjectIds`의 `maxItems=20`과 `reason.maxLength=2000`은 반영되어 있다. 다만 회원 포탈 파일 업로드 요청의 `filePurpose`가 일반 `string`으로만 노출되어 목적값 계약이 명확하지 않다.

가능하면 OpenAPI에 다음 내용을 명시해 주세요.

- `filePurpose` 허용값에 `ABSENCE_EVIDENCE` 추가
- `ABSENCE_EVIDENCE` 설명: 결석 사유 증빙, JPG/JPEG/PNG, 파일당 20MB
- 결석 사유 제출의 `fileObjectIds`는 본인 소유·`CLEAN`·`AVAILABLE` 파일만 허용한다는 설명
- 목적값·소유권·파일 상태 위반 시의 최종 HTTP 상태 및 `error.code`

## 5. 백엔드 전달용 프롬프트

```text
[Platform] 교육현황 > 교육 일정 > 결석 사유 제출 증빙 파일 연동 계약 확인 요청

신규 API path를 추가하지 말고, 아래 기존 회원 포탈 API의 정책과 OpenAPI 명세를 확인·보완해 주세요.

대상 API:
- POST /api/portal/me/files/upload-requests
- PUT {uploadUrl} (응답의 method와 requiredHeaders 사용)
- POST /api/portal/me/files/{fileObjectId}/confirm
- GET /api/portal/me/files/{fileObjectId}
- POST /api/portal/me/program-applications/{applicationType}/{applicationId}/schedules/{scheduleId}/absence-reasons

1. 파일 업로드 목적값
- filePurpose=ABSENCE_EVIDENCE를 회원 포탈 업로드 허용 목적값으로 처리해 주세요.
- ABSENCE_REASON_EVIDENCE라는 목적값은 사용하지 않습니다.
- ownerDomain, ownerType, ownerId는 요청 body로 받지 말고 인증된 회원으로 결정해 주세요.

2. 결석 증빙 파일 정책
- JPG/JPEG: contentType=image/jpeg
- PNG: contentType=image/png
- 파일당 최대 20 * 1024 * 1024 bytes
- 한 결석 사유 제출당 fileObjectIds 최대 20개
- PDF, WEBP, GIF, DOCX 등은 거부해 주세요.
- 파일명 확장자와 contentType이 불일치하면 거부해 주세요.

3. 업로드 상태 전이
- upload-request 응답에 fileObjectId, uploadUrl, method, requiredHeaders를 반환해 주세요.
- confirm 요청의 fileSize와 contentType을 필수로 검증해 주세요.
- GET 파일 상태가 scanStatus=CLEAN 및 uploadStatus=AVAILABLE이 된 경우에만 제출 연결을 허용해 주세요.
- 레거시 uploadStatus=CONFIRMED를 지원해야 한다면 CLEAN과 함께만 허용해 주세요.
- PENDING_UPLOAD, PREPARED, CONFIRM_REQUESTED, PENDING_SCAN, INFECTED, FAILED,
  QUARANTINED, 삭제·만료 상태는 결석 사유 제출 연결을 허용하지 말아 주세요.

4. 결석 사유 제출 검증
- reason은 trim 기준 필수이며 최대 2,000자입니다.
- fileObjectIds가 없으면 파일 없이 사유만 제출할 수 있어야 합니다.
- 연결된 모든 fileObjectId가 현재 인증 회원 소유인지 확인해 주세요.
- 모든 연결 파일의 filePurpose가 ABSENCE_EVIDENCE인지 확인해 주세요.
- 모든 연결 파일이 허용 확장자·MIME, 20MB 이하, CLEAN/AVAILABLE인지 확인해 주세요.
- 파일이 20개를 초과하면 거부해 주세요.

5. 오류 계약
- 업로드 요청: MEMBER_FILE_PURPOSE_NOT_ALLOWED,
  MEMBER_FILE_TYPE_NOT_ALLOWED, MEMBER_FILE_SIZE_EXCEEDED, 401
- confirm: MEMBER_FILE_CONFIRM_NOT_ALLOWED, MEMBER_FILE_NOT_OWNED, 401
- 결석 사유 제출: INVALID_ABSENCE_REASON, VALIDATION_FAILED,
  SUBMISSION_FILE_PURPOSE_NOT_ALLOWED, MEMBER_FILE_TYPE_NOT_ALLOWED,
  INVALID_VALUE, 401, 403, 409
- error.code와 HTTP status가 위 기준으로 일관되게 반환되도록 해 주세요.

6. OpenAPI
- MemberPortalFileUploadRequest.filePurpose에 ABSENCE_EVIDENCE 허용값과 설명을 명시해 주세요.
- ABSENCE_EVIDENCE 설명에 JPG/JPEG/PNG 및 파일당 20MB 정책을 명시해 주세요.
- confirm의 fileSize/contentType 필수 조건을 명시해 주세요.
- 결석 사유 제출 fileObjectIds의 maxItems=20과 소유권·목적값·CLEAN/AVAILABLE 검증을 설명에 명시해 주세요.

완료 후 다음을 회신해 주세요.
- 로컬/스테이징에서 인증 회원 기준 각 API 호출 결과
- 실제 응답의 fileObjectId, uploadUrl, method, requiredHeaders
- 업로드 후 CLEAN/AVAILABLE 전이 결과
- 결석 사유 제출 응답의 submissionId, scheduleId, reviewStatus
- OpenAPI 갱신 여부 및 관련 error.code 목록
```

## 6. 인수 테스트

인증된 일반 회원 계정과 실제 교육 일정으로 다음을 확인한다.

1. JPG/PNG 파일 업로드 요청이 `ABSENCE_EVIDENCE`로 성공한다.
2. Storage 업로드와 confirm 이후 파일 상태가 `CLEAN` + `AVAILABLE`이 된다.
3. 반환된 `fileObjectId`를 포함한 결석 사유 제출이 `200`으로 성공한다.
4. 제출 응답의 `fileObjectIds`, `submissionId`, `scheduleId`, `reviewStatus`가 반환된다.
5. 파일 없이 사유만 제출할 수 있다.
6. 20MB 초과, JPG/PNG 외 파일은 거부된다.
7. 21개 파일, 다른 회원 파일, 다른 `filePurpose` 파일은 거부된다.
8. 파일 보안 검사 실패·타임아웃 시 결석 사유 제출이 실행되지 않는다.
9. 제출 성공 후 교육 일정 조회에서 결석 사유 상태가 갱신된다.

## 7. FE 구현 위치

- 파일 업로드 공통 처리: `src/features/mypage/instructor-apply/api/member-file-upload.ts`
- 결석 사유 모달: `src/features/mypage/education/schedules/ui/absence-reason-modal.tsx`
- 결석 사유 제출 API: `src/features/mypage/education/applications/api/activity-client.ts`
- 제출 mutation/cache 갱신: `src/features/mypage/education/applications/api/activity-hooks.ts`
