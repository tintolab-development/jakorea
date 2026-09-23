# CMS 저장 파일 — 있는 API와 없는 도메인 API

작성일: 2026-09-23  
대조: CMS `apps/cms/src/shared/lib/admin-file-upload/purposes.ts`, JABACK `AdminFileUploadPolicy`, 파일·도메인 컨트롤러.  
프론트 레포는 고치지 마라. 이 문서는 백엔드 레포에서 실행한다.

## 프롬프트 (복사용)

```
당신은 JA Korea CMS Java 백엔드(JABACK)를 구현한다.
CMS가 파일을 올리고 다시 받는 흐름을 코드로 대조했다. 공통 파일 API는 이미 있다.
없는 것은 화면의 파일을 도메인 행에 붙이는 API 두 개다. 그 둘만 추가하라.
아래에 「만들지 마라」로 적은 경로는 추가하지 마라.

# 이미 있어서 그대로 쓸 API

공통 업로드는 multipart가 아니다.

1. POST /api/admin/files/upload-requests
2. 저장소 PUT
3. POST /api/admin/files/{fileObjectId}/confirm
4. GET /api/admin/files/{fileObjectId} 가 scanStatus=CLEAN, uploadStatus=AVAILABLE 일 때까지 조회

filePurpose 허용 목록은 AdminFileUploadPolicy.POLICIES 와 CMS ADMIN_FILE_PURPOSE 가 같다. 용도를 새로 만들지 마라.

원본 저장:

- 민감하지 않은 파일: GET /api/admin/files/{fileObjectId}/download
  응답은 바이트가 아니라 FileDownloadResolveResponse.downloadUrl 이다.
- 민감 파일(downloadStrategy=SERVER_RELAY): GET /download 와 POST /download-requests 는 SENSITIVE_FILE_RELAY_REQUIRED 로 거절한다.
  받는 경로는 POST /api/admin/files/{fileObjectId}/sensitive-downloads 다음
  POST /api/admin/files/{fileObjectId}/sensitive-downloads/stream 이다.
  SERVER_RELAY 용도: STUDENT_ROSTER, PORTRAIT_CONSENT, CRIMINAL_HISTORY_EVIDENCE, EXPENSE_RECEIPT, ELECTRONIC_SIGNATURE, INSTRUCTOR_APPLICATION, ABSENCE_EVIDENCE.
  이 거절을 풀거나 GET /download 가 민감 파일 바이트를 주게 바꾸지 마라.

인라인 미리보기: GET /api/admin/files/{fileObjectId}/content
로컬 raw GET 은 기본 Content-Disposition=attachment 다. 미리보기만 inline=1 을 붙인다. 서명에 inline 을 넣지 마라.

도메인 연결이 이미 있는 것. 경로·owner·purpose 를 바꾸지 마라.

| 화면 | 메서드와 경로 | 받는 파일 조건 |
|---|---|---|
| 공지 첨부 | GET/PUT /api/admin/content/notices/{noticeId}/attachments | NOTICE_ATTACHMENT, owner CONTENT/NOTICE/{숫자 noticeId}, CLEAN+AVAILABLE |
| 공지 본문 이미지 | GET/PUT /api/admin/content/notices/{noticeId}/inline-images | NOTICE_INLINE_IMAGE |
| FAQ 본문 이미지 | GET/PUT /api/admin/content/faqs/{faqId}/inline-images | FAQ_INLINE_IMAGE, owner CONTENT/FAQ/{숫자 faqId} |
| 문의 첨부 | GET /api/admin/inquiries/{inquiryId}/attachments | 조회만. CMS는 올리지 않는다 |
| 프로그램 상세 첨부 | GET/PUT /api/admin/programs/{programId}/attachments | PROGRAM_DETAIL_ATTACHMENT, ownerDomain=PROGRAM_CONTENT, ownerType=PROGRAM, ownerId=프로그램 숫자 PK, attachment_type=GENERAL |
| 프로그램 본문 이미지 | GET/PUT /api/admin/programs/{programId}/inline-images | PROGRAM_INLINE_IMAGE |
| 프로그램 게시글 첨부 | GET/PUT /api/admin/programs/{programId}/posts/{postId}/attachments | PROGRAM_POST_ATTACHMENT |
| 프로그램 게시글 본문 이미지 | GET/PUT .../posts/{postId}/inline-images | PROGRAM_POST_INLINE_IMAGE |
| 메일 템플릿 첨부 | POST/DELETE /api/admin/notification-templates/{templateId}/attachments | MAIL_TEMPLATE_ATTACHMENT, owner NOTIFICATION/EMAIL_TEMPLATE/{templateId}. CMS files/attachments 바인딩이 아니다 |
| 문자 MMS | 같은 notification-templates 첨부 | MMS_IMAGE, owner NOTIFICATION/SMS_TEMPLATE/{templateId}, JPEG, 파일명 45자 이하 |
| 후원사 로고 | sponsor 생성·수정 logoFileId | SPONSOR_LOGO. 일괄은 POST /api/admin/sponsors/logo-download/jobs |
| 교육일지 | POST /api/admin/programs/{programId}/trained-teacher/education-journals body.fileObjectId | EDUCATION_JOURNAL, CLEAN+AVAILABLE, 업로더가 그 관리자이거나 owner PROGRAM/TRAINED_TEACHER_EDUCATION_JOURNAL |
| 교육일지 받기 | GET .../education-journals/{journalId}/download | fileObjectId 와 downloadEndpoint=/api/admin/files/{id}/download |
| 강의보고서 일괄 | GET /api/admin/programs/{programId}/lecture-reports/download | generated-file job. async 가 꺼져 있으면 render 후 fileObjectId 와 downloadUrl 을 준다. async 가 켜져 있으면 fileObjectId 가 null 인 채 job 을 준다. 그때는 기존 GET /api/admin/generated-files/jobs/{jobId} 로 완료를 본다. 두 번째 다운로드 API를 만들지 마라 |
| 성범죄 증빙 | 회원 동의 filled-document 의 evidenceFileObjectId | CRIMINAL_HISTORY_EVIDENCE. 다운로드는 sensitive-downloads |
| 영수증 회원 제출 | POST /api/portal/me/program-applications/{applicationType}/{applicationId}/expense-receipts | body.fileObjectIds, EXPENSE_RECEIPT |
| 영수증 관리자 | GET /api/admin/programs/{programId}/expense-receipts, GET /api/admin/expense-receipts/{receiptId}, PATCH .../review | 조회·승인·반려만 |
| 회원 결석 사유 | POST /api/portal/me/program-applications/{applicationType}/{applicationId}/schedules/{scheduleId}/absence-reasons | body.fileObjectIds |
| 결석 사유 관리자 조회 | GET /api/admin/programs/{programId}/absence-reasons | 회원 제출 행. fileObjectIds 를 돌려 준다 |
| 양식 제출 파일 | 포탈 form response 의 fileObjectIdsByQuestion | form_submission_file. CMS 화면 업로드와 별개다 |

공지·FAQ·문의·메일·문자 이력·교육일지·후원 로고·강의보고서의 원본 저장은 위 경로로 가능하다.
GET /download 가 거절하는 민감 파일은 sensitive-downloads 로 가능하다.

# 만들지 마라

- 새 filePurpose, 새 업로드 파이프라인, 새 presign 방식.
- PORTRAIT_CONSENT, SURVEY_ATTACHMENT, ASSIGNMENT_ATTACHMENT, ELECTRONIC_SIGNATURE 용 CMS 전용 연결 API.
  CMS 화면은 이 용도로 파일을 올리지 않는다. 초상권·지급조서·동의서·인증서 PDF 는 브라우저가 만든 파일이고 파일 객체가 아니다.
- 알림톡 ALIMTALK_BANNER_IMAGE, ALIMTALK_ITEM_IMAGE 업로드 API.
  CMS 알림톡 화면은 imageUrl 을 보기만 한다. 업로드 호출이 없다. NHN/템플릿 동기화 이미지를 파일 객체로 복제하지 마라.
- 관리자 영수증 생성 POST.
  생성은 회원 포탈 expense-receipts 에 있다. CMS 정산 제출 모달은 아직 mock 이라 fileObjectId 를 그 API에 보내지 않는다. 관리자 대행 제출은 이번 범위가 아니다.
- 인증서 배경 전용 API.
  CertificateAdminController 는 발급·고유번호·정책만 있다. CERTIFICATE_ASSET 업로드 정책은 있다.
  배경이 양식 템플릿 문서 JSON 이면 기존 템플릿 저장이 그 fileObjectId 를 지우지 않게만 하라. 새 경로를 만들지 마라.
- 프로그램 상세 첨부의 owner 를 PROGRAM/PROGRAM/1 로 느슨하게 바꾸지 마라.
  맞는 owner 는 PROGRAM_CONTENT / PROGRAM / {프로그램 숫자 PK} 다. ownerId=1 은 CMS가 아직 프로그램 id 없이 올리는 값이다. 백엔드가 그 값을 받아 주면 다른 프로그램 파일과 섞인다.
- 교재 관리, 세부 프로그램 관리, 파일 다운로드 이력 화면에 원본 파일 API를 붙이지 마라. 이력 화면은 로그와 엑셀만 있다.

# 추가할 API 1 — 프로그램 대표 이미지

문제:
홈페이지 조회는 program_attachment.attachment_type 이 THUMBNAIL, POSTER, KEY_VISUAL, MAIN_IMAGE 인 행의 file_id 를 썸네일로 쓴다.
(HomepageProgramQueryService)
관리자 PUT /api/admin/programs/{programId}/attachments 는 PROGRAM_DETAIL_ATTACHMENT 만 받고 attachment_type=GENERAL 만 넣는다.
같은 메서드는 요청에 없는 program_attachment 행을 전부 지운다. 썸네일 행이 있어도 상세 첨부 교체 때 지워진다.
대표 이미지를 저장하는 관리자 API는 없다.
CMS 등록·상세는 PROGRAM_THUMBNAIL 로 업로드만 하고 이 연결을 호출하지 못한다.

구현:

PUT /api/admin/programs/{programId}/thumbnail
권한: 기존 프로그램 첨부 교체와 같다. PROGRAM_WRITE, CRUD_PROGRAM_EDIT.
body: { "fileObjectId": 123 } 또는 null 이면 대표 이미지를 지운다.

조건:

- filePurpose=PROGRAM_THUMBNAIL
- ownerDomain=PROGRAM_CONTENT, ownerType=PROGRAM, ownerId=해당 프로그램 숫자 PK
- uploadStatus=AVAILABLE, scanStatus=CLEAN
- 하나면 된다. 기존 THUMBNAIL/POSTER/KEY_VISUAL/MAIN_IMAGE 행은 교체하거나 삭제하고, GENERAL 상세 첨부는 건드리지 마라.
- 저장 attachment_type 은 THUMBNAIL 로 고정하라.

같이 고칠 것:

PUT /api/admin/programs/{programId}/attachments 의 삭제는 attachment_type 이 GENERAL 이거나 null 인 행만 하라.
THUMBNAIL, POSTER, KEY_VISUAL, MAIN_IMAGE 는 상세 첨부 교체로 지우지 마라.
목록 GET /api/admin/programs/{programId}/attachments 도 GENERAL 만 돌려라. 썸네일은 아래 GET 으로 분리하라.

GET /api/admin/programs/{programId}/thumbnail
200: { "fileObjectId": number | null, "originalFileName": string | null, "contentType": string | null, "fileSize": number | null, "downloadPath": "/api/admin/files/{id}/download" | null }
없으면 fileObjectId=null. 404로 프로그램을 찾지 못한 것과 구분하라. 프로그램이 없으면 404 PROGRAM_NOT_FOUND.

에러 코드는 기존 PROGRAM_ATTACHMENT_* 와 섞지 마라.

- PROGRAM_THUMBNAIL_FILE_NOT_FOUND
- PROGRAM_THUMBNAIL_FILE_PURPOSE_MISMATCH
- PROGRAM_THUMBNAIL_FILE_OWNER_MISMATCH
- PROGRAM_THUMBNAIL_FILE_NOT_AVAILABLE

ClientErrorMessageResolver 에 한글 메시지를 넣어라.
OpenAPI 에 두 매핑을 추가하라.
테스트: 썸네일 저장 후 상세 첨부 replace 를 해도 썸네일 행이 남고, 홈 조회 thumbnailFileObjectId 가 그 파일이다.
다른 프로그램의 파일을 넣으면 403.
CLEAN 이 아니면 409.

# 추가할 API 2 — 관리자 출결 정정 증빙

문제:
CMS 출결 정정은 ABSENCE_EVIDENCE 를 올린 뒤 evidenceFileObjectIds 를 만든다.
관리자 저장은 PUT /api/admin/program-schedules/{scheduleId}/attendances 다.
AttendanceItemRequest 필드는 participantId, status, absenceReason, arrivalTime 뿐이다. 파일 id 를 넣을 곳이 없다.
회원 포탈 absence-reasons 는 fileObjectIds 를 받지만 회원 인증이다. 관리자 정정이 그 경로를 쓰면 안 된다.
관리자 목록 GET /api/admin/programs/{programId}/absence-reasons 는 회원 제출만 보여 준다.

구현:

AttendanceItemRequest 에 선택 필드를 추가하라.

fileObjectIds: List<Long>  // 없거나 빈 배열이면 증빙 없음. null 이면 기존 증빙을 유지하지 말고, 이번 요청에 파일이 없는 정정으로 보아라. 최대 5개.

정정이 결석·사유 있음이고 fileObjectIds 가 있으면, 회원 제출과 같은 absence reason 저장소에 관리자 작성 행을 남겨라.
구분 컬럼이 없으면 reviewedByAdminId 또는 actor 로 관리자 작성을 표시하라. 회원 제출 행을 지우지 마라.
새 리비전으로 쌓고 latest 만 관리자 목록에 나오게 하라.

각 id 조건:

- filePurpose=ABSENCE_EVIDENCE
- ownerDomain=PROGRAM, ownerType=ATTENDANCE, ownerId=해당 schedule 의 숫자 id. 프로그램 id 나 1 이 아니다.
- AVAILABLE, CLEAN
- 업로더가 현재 관리자
- 민감 파일이므로 목록에는 fileObjectId 와 originalFileName 만 주고, 바이트는 기존 sensitive-downloads 로만 받는다. downloadUrl 에 presign 을 넣지 마라.

출석·지각만 바꾸고 사유가 없으면 fileObjectIds 가 있어도 400 ABSENCE_EVIDENCE_NOT_ALLOWED.
목적·owner 가 틀리면 400 ABSENCE_EVIDENCE_FILE_MISMATCH.
준비되지 않았으면 409 ABSENCE_EVIDENCE_FILE_NOT_AVAILABLE.
개수 초과는 400 ABSENCE_EVIDENCE_TOO_MANY.

목록 항목 AbsenceReasonAdminListItemResponse 는 이미 fileObjectIds 가 있다. 관리자 작성 행도 그 목록에 포함하라.
파일명도 필요하면 originalFileNames 를 ids 와 같은 순서로 추가하라. 기존 회원 행은 파일명이 없으면 null 을 허용하라.

테스트:

- 관리자가 fileObjectIds 로 정정하면 GET absence-reasons 에 그 id 가 있다.
- ownerId 가 1 이거나 다른 스케줄이면 거절한다.
- GET /api/admin/files/{id}/download 는 여전히 SENSITIVE_FILE_RELAY_REQUIRED 다.
- sensitive-downloads 로 원본을 받을 수 있다.

# 완료 조건

1. 위 「이미 있어서 그대로 쓸 API」의 경로와 거절 코드가 그대로다.
2. 썸네일 PUT/GET 이 GENERAL 첨부와 서로 지우지 않는다.
3. 관리자 출결 정정이 ABSENCE_EVIDENCE id 를 저장하고 목록에서 돌려 준다.
4. 「만들지 마라」 항목의 컨트롤러를 추가하지 않았다.
5. 로컬 시드로 썸네일 1건, 관리자 출결 증빙 1건을 넣어 두 조회가 빈 값이 아니게 하라. prod 마이그레이션에는 넣지 마라.
```
