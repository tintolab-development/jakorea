# 교육받은 교사 진행 현황 수정·포기·제외

OpenAPI를 갱신했습니다. 경로가 2개 늘었으므로 codegen을 다시 생성합니다. 교재 배송 상태 필드는 없습니다.

## 회신

- 활동 포기는 **B**. `POST /api/admin/programs/{programId}/trained-teacher/organization-applications/{applicationId}/give-up`. 참여자 `participantId` give-up은 쓰지 않습니다.
- 진행 현황 제외는 `POST .../organization-applications/{applicationId}/remove-from-progress`. 교육일지 또는 `COMPLETED` 완료 증빙이 있으면 **409** `TRAINED_TEACHER_PROGRESS_EVIDENCE_EXISTS`.
- 교재 배송 상태는 제공하지 않습니다. `textbookName`은 신청에 지정한 교재명입니다.
- `educationCompletionCount`는 해당 신청의 `COMPLETED` 완료 행 수입니다. `performance-summary.organizationApplicationCount`는 승인 신청 수이며 완료 수가 아닙니다.
- `PATCH /api/admin/organization-applications/{applicationId}`는 `TRAINED_TEACHER`를 받습니다. 2026-09-28의 `ORGANIZATION_APPLICATION_EDIT_PROGRAM_TYPE_UNSUPPORTED`는 그 이전 서버가 유형을 막아서 난 응답입니다. CMS를 재기동한 뒤 같은 신청으로 다시 호출합니다.

## 1. 신청 정보 수정

`PATCH /api/admin/organization-applications/{applicationId}`

- 대상은 승인된 `TRAINED_TEACHER` 기관 신청입니다. 본문은 기존 기관 신청 수정과 같습니다.
- 저장 후 `GET /api/admin/programs/{programId}/trained-teacher/organization-applications`와 상세, 그리고 같은 신청의 상세 응답에 반영됩니다.
- `requestedClassCount`, `requestedStudentCount`, `requestedGrade`, `applicationReason`, `otherRequests`, `teacherPhone`, `teacherEmail`, `textbookId`를 보냅니다.
- 교사 변경은 `teacherMemberId`만 사용합니다. `teacherName`만 보내면 **400** `ORGANIZATION_APPLICATION_TEACHER_NAME_REQUIRES_MEMBER_ID`.
- `textbookId`는 교재 마스터 id입니다. 목록 `textbookName`은 그 교재명입니다. `null`은 해당 없음입니다.
- `requestedEducationFormat`은 `ONLINE`, `OFFLINE`, `HYBRID`만 받습니다.
- 이 PATCH는 `preferredScheduleBlocks`, 교육일지, 교육 완료를 지우지 않습니다.
- 컴퓨터실, 대기실, 식사, 주차 필드는 본문에 있으면 저장됩니다. 교육받은 교사 화면에서 쓰지 않으면 보내지 않습니다.

## 2. 활동 포기

```http
POST /api/admin/programs/{programId}/trained-teacher/organization-applications/{applicationId}/give-up
```

```json
{ "stopScheduleId": 186501, "reason": "기관 사정으로 이후 교육을 진행하지 않음" }
```

- `stopScheduleId`는 그 프로그램의 일정 id입니다. 다른 프로그램 일정이면 **422** `GIVE_UP_STOP_SCHEDULE_NOT_IN_PROGRAM`.
- 성공 시 `applicationStatus`는 `APPROVED`입니다. `activityWithdrawn`은 `true`, `giveUpAt`은 시각, `giveUpStopScheduleId`는 요청한 일정, `progressLabel`은 `활동 포기`입니다.
- 승인 건수(`performance-summary.organizationApplicationCount`)에는 그대로 포함됩니다. 진행 중 표시는 `progressLabel`이 `활동 포기`인 행을 빼서 계산합니다.
- 이미 포기한 신청을 다시 호출하면 **409** `TRAINED_TEACHER_ACTIVITY_ALREADY_GIVEN_UP`.
- 교육일지와 완료 증빙은 삭제하지 않습니다.

## 3. 진행 현황에서 제외

```http
POST /api/admin/programs/{programId}/trained-teacher/organization-applications/{applicationId}/remove-from-progress
```

```json
{ "reason": "중복 등록된 학교 행 제거" }
```

- 성공 시 `applicationStatus`는 `APPROVAL_CANCELLED`입니다. `status=APPROVED`로 거른 목록에서 빠집니다.
- 증빙이 있으면 409 본문 `code`는 `TRAINED_TEACHER_PROGRESS_EVIDENCE_EXISTS`이고 `details.journalCount`, `details.educationCompletionCount`가 있습니다.
- 행을 물리 삭제하지 않고 `PENDING`으로 되돌리지 않습니다.

## 4. 교육 완료

기존 API를 그대로 씁니다.

- 등록: `POST /api/admin/programs/{programId}/trained-teacher/education-completions`
- 취소: `POST /api/admin/programs/{programId}/trained-teacher/education-completions/{completionId}/cancel`
- 목록 칸의 숫자는 응답 `educationCompletionCount`입니다. 취소된 완료는 빠집니다.

## 5. 교육일지 일괄 다운로드

`POST /api/admin/programs/{programId}/trained-teacher/education-journals/bulk-download`

- `journalIds`를 생략하거나 `[]`이면 `organizationApplicationId` 범위의 전체 일지입니다. 신청 id도 없으면 프로그램 전체입니다.
- 그 신청 밖의 `journalIds`는 **422** `TRAINED_TEACHER_JOURNAL_IDS_NOT_IN_SCOPE`.
- 파일이 있으면 `downloadEndpoint`는 `.../bulk-download/jobs`입니다. 이 경로와 이후 `/api/admin/files/{fileObjectId}/download`는 관리자 인증이 필요합니다. 공개 URL을 만들지 않습니다.
