# Platform 저장 파일 — 있는 API와 없는 화면 API

작성일: 2026-09-23  
대조: Platform `apps/platform` 파일 화면, JABACK 회원·공개 파일 컨트롤러, JAHOMEADMINBACK 공개 홈 파일.  
같이 볼 문서: [cms-stored-file-domain-gaps-backend-cursor-prompt-2026-09-23.md](../../../cms/docs/api/cms-stored-file-domain-gaps-backend-cursor-prompt-2026-09-23.md)  
프론트 레포는 고치지 마라. 이 문서는 백엔드 레포에서 실행한다. CMS 문서에 있는 관리자 API를 여기서 다시 만들지 마라.

## 프롬프트 (복사용)

```
당신은 JA Korea 백엔드(JABACK, Homepage JAHOMEADMINBACK)를 구현한다.
사용자 홈(Platform)이 파일을 올리고 받는 화면을 코드로 대조했다.
공통 업로드, 공개 다운로드 URL, 회원 제출 연결은 이미 있다.
없는 것은 회원 성범죄 증빙을 본인 동의에 붙이는 경로와, 교사회원이 배정 강사 동의서를 받는 조회다.
그 둘만 추가하라. 아래에 「만들지 마라」로 적은 경로는 추가하지 마라.
CMS 문서 cms-stored-file-domain-gaps-backend-cursor-prompt-2026-09-23.md 의 추가 API(프로그램 썸네일, 관리자 출결 증빙)와 금지 목록도 다시 구현하지 마라.

# 이미 있어서 그대로 쓸 API

## 공개 파일 — 응답은 바이트가 아니다

GET /api/portal/public/files/{fileObjectId}/download
응답은 FileDownloadResolveResponse 다. fileObjectId, downloadUrl, expiresAt, requiredHeaders.
클라이언트가 downloadUrl 을 다시 받아 저장한다.
이 GET 이 파일 바이트를 주게 바꾸지 마라. blob 으로 읽히게 Content-Type 을 파일 MIME 으로 바꾸지 마라.

받는 파일: filePurpose 가 NOTICE_ATTACHMENT, PROGRAM_DETAIL_ATTACHMENT, PROGRAM_THUMBNAIL 이고, 공개 공지 또는 게시 프로그램에 연결됐고, CLEAN + AVAILABLE 이며, 민감 파일이 아닌 것.
민감 파일이면 404. 이 거절을 풀지 마라.

인라인 이미지: GET /api/portal/public/files/{fileObjectId}/content
302 로 짧은 URL. purpose 는 NOTICE_INLINE_IMAGE, FAQ_INLINE_IMAGE, PROGRAM_INLINE_IMAGE, PROGRAM_THUMBNAIL.
로컬 raw GET 의 기본 Content-Disposition 은 attachment 다. 미리보기만 inline=1. 서명에 inline 을 넣지 마라.

## 회원 업로드 — 새 presign 을 만들지 마라

multipart 가 아니다.

1. POST /api/portal/me/files/upload-requests
2. 저장소 PUT
3. POST /api/portal/me/files/{fileObjectId}/confirm
4. GET /api/portal/me/files/{fileObjectId} 가 scanStatus=CLEAN, uploadStatus=AVAILABLE 일 때까지 조회

본인 파일 받기: POST /api/portal/me/files/{fileObjectId}/download-requests
응답은 downloadUrl 이다. 바이트 GET 을 추가하지 마라.

MemberPortalFilePolicy 에 이미 있는 용도만 이 파이프라인으로 올린다.
ASSIGNMENT_ATTACHMENT, SURVEY_ATTACHMENT, ABSENCE_EVIDENCE, EXPENSE_RECEIPT, INSTRUCTOR_APPLICATION, ELECTRONIC_SIGNATURE, STUDENT_ROSTER, PORTRAIT_CONSENT, EDUCATION_JOURNAL, INQUIRY_ATTACHMENT.
아래 1번에서 CRIMINAL_HISTORY_EVIDENCE 만 이 목록에 추가한다. 다른 용도를 새로 만들지 마라.

민감 용도(ABSENCE_EVIDENCE, EXPENSE_RECEIPT, INSTRUCTOR_APPLICATION, ELECTRONIC_SIGNATURE, STUDENT_ROSTER, PORTRAIT_CONSENT, CRIMINAL_HISTORY_EVIDENCE)는 공개 GET /download 로 열지 마라.
관리자 수신은 기존 POST /api/admin/files/{fileObjectId}/sensitive-downloads 다음 stream 이다. CMS 문서와 같다.

## 화면별로 이미 연결되는 것

경로·owner·purpose 를 바꾸지 마라.

| 화면 | 메서드와 경로 | 받는 파일 조건 |
|---|---|---|
| 홈 공지 `/notices` | GET /api/public/ja-korea/notices, GET /api/public/ja-korea/notices/{id} | Homepage 공지. 첨부는 attachmentUrl. CMS 공지 저장소가 아니다 |
| 결과 확인 `/results` | GET /api/portal/public/notices?categoryId= | CMS 공개 공지의 결과 카테고리. 첨부는 위 공개 파일 download JSON. 결과 전용 파일 API는 없다 |
| 프로그램 상세 첨부 | GET /api/portal/programs/{programId} 의 attachments[].fileObjectId | PROGRAM_DETAIL_ATTACHMENT. 저장은 공개 파일 downloadUrl |
| 프로그램 썸네일 | 같은 상세의 thumbnail 계열 file id + GET .../content | PROGRAM_THUMBNAIL. 관리자 저장 PUT 은 CMS 문서의 썸네일 API만 쓴다. 여기 다시 만들지 마라 |
| 교육·강의·봉사 안내 첨부 | GET /api/portal/me/program-applications/{applicationType}/{applicationId}/notices/{postId}/attachments/{attachmentId}/download | FileDownloadResolveResponse. 바이트가 아니다 |
| 안내 본문 이미지 | GET .../notices/{postId}/inline-images/{fileObjectId}/content | 302 |
| 투명경영 보고서 | GET /api/public/ja-korea/transparency/reports/{type} 의 downloadUrl, GET /api/public/ja-korea/transparency/reports/{id}/download | 목록은 URL, 단건은 302. 보고서 전용 업로드를 Platform 에 만들지 마라 |
| 임팩트 스토리 첨부 | GET /api/public/impact-story/stories/{id} | imageUrl 이 첨부 publicUrl, attachmentOriginalName 이 파일명. 다운로드 경로를 추가하지 마라 |
| 정산 영수증 | POST /api/portal/me/program-applications/{applicationType}/{applicationId}/expense-receipts | body.fileObjectIds, EXPENSE_RECEIPT. 관리자 생성 POST 는 CMS 문서대로 만들지 마라 |
| 설문·만족도·과제 파일 | POST /api/portal/me/form-responses/{formResponseId}/revisions | fileObjectIdsByQuestion. SURVEY_ATTACHMENT 또는 ASSIGNMENT_ATTACHMENT |
| 결석 사유 파일 | POST /api/portal/me/program-applications/{applicationType}/{applicationId}/schedules/{scheduleId}/absence-reasons | body.fileObjectIds, ABSENCE_EVIDENCE. 관리자 정정 필드 추가는 CMS 문서만 |
| 1:1 문의 첨부 | POST /api/portal/me/inquiries body.fileObjectIds | INQUIRY_ATTACHMENT. 화면 파일 입력은 아직 없다. 문의 첨부 API를 새로 만들지 마라 |
| 동의서 작성 PDF (본인) | POST /api/portal/me/consents/documents/{documentId}/download-requests | 문서 소유 회원만. 본인 검사를 풀지 마라 |
| 전자서명 이미지 | PUT /api/portal/me/signatures/current | ELECTRONIC_SIGNATURE |
| 기업 후원 상담 첨부 | POST /api/public/sponsorship/corporate-consultations/attachments/upload-requests 다음 confirm | Homepage 기업 상담 전용. 재능기부·채용에 쓰지 마라 |

공지, 결과, 프로그램 첨부, 교육 안내, 투명경영, 임팩트, 영수증, 설문, 결석, 문의, 본인 동의서 받기는 위 경로로 가능하다.
Platform 이 아직 mock 이거나 파일명만 들고 있어도 백엔드 경로는 있는 것이다. 그 화면용 새 파일 API를 만들지 마라.

# 만들지 마라

- 새 업로드 파이프라인, 새 presign, multipart 업로드 컨트롤러.
- CMS 문서의 프로그램 썸네일 PUT/GET, 관리자 출결 fileObjectIds, 공지·FAQ·프로그램 첨부 replace, 메일·문자 첨부, 관리자 교육일지, 후원사 로고.
- GET /api/portal/public/files/{id}/download 또는 GET /api/admin/files/{id}/download 가 민감 파일 바이트를 주게 하는 변경.
- 정산 영수증, 설문, 과제, 결석 증빙, 문의 첨부, 투명경영, 임팩트, 결과 확인, 홈 공지용 두 번째 파일 API.
- 기업 상담 첨부 API를 재능기부 신청이나 채용 지원에 연결.
- STUDENT_ROSTER 를 붙이는 학생 명단 API. Platform 학생 명단 탭은 파일 입력이 없다.
- EDUCATION_JOURNAL 회원 제출 API. Platform 에 교육일지 업로드 화면이 없다.
- INSTRUCTOR_APPLICATION 만 받는 강사 신청 첨부 API. 강사 권한 신청 본문은 profile, settlement, termsAgreements 다. 파일은 1번의 성범죄 증빙 필드만 쓴다.
- 성범죄 양식 빈 PDF, 디자인 시스템 이미지 선택, 교재 목록에 원본 파일 API. 양식 PDF 는 프론트 정적 파일이고 교재 화면에 다운로드 버튼이 없다.
- 채용 `/about/careers` 증빙서류, 재능기부 `/support/talent/apply` 첨부. 신청 저장 API 자체가 없다. 파일 API만 만들지 마라. 신청 본문이 생기기 전에는 filePurpose 도 추가하지 마라.

# 추가할 API 1 — 회원이 올리는 성범죄 경력조회 증빙

문제:
Platform 강사 신청 동의 `/mypage/instructor-apply/consent` 의 성범죄 화면은 PDF 또는 이미지를 고른 뒤에만 제출할 수 있다.
TermsAgreementRequest.evidenceFileObjectId 와 에러 CONSENT_EVIDENCE_FILE_REQUIRED 는 이미 있다.
MemberConsentFilledDocumentService.requireEvidenceFile 은 uploaded_by_actor_type=ADMIN 이고 업로더가 CurrentActor.requireAdminId() 일 때만 받는다.
MemberPortalFilePolicy 에는 CRIMINAL_HISTORY_EVIDENCE 가 없다. 회원 POST /api/portal/me/files/upload-requests 는 그 용도를 거절한다.
POST /api/portal/me/consents/documents/{documentId}/complete 의 ConsentCompleteRequest 에는 evidenceFileObjectId 가 없다.
CMS 강사 등록 모달은 관리자 업로드다. 그 ADMIN 업로더 검사를 회원도 통과하게 느슨하게 바꾸지 마라.

구현:

MemberPortalFilePolicy 에 CRIMINAL_HISTORY_EVIDENCE 를 추가하라.
한도는 AdminFileUploadPolicy 와 같다. 20MB, PRIVATE_SENSITIVE, CRIMINAL_HISTORY_1Y, SERVER_RELAY, pdf/jpg/jpeg/png/webp.
업로드 URL 은 기존 POST /api/portal/me/files/upload-requests 만 쓴다.

동의 완료 요청에 필드를 추가하라.

POST /api/portal/me/consents/documents/{documentId}/complete
evidenceFileObjectId: Long  // CRIMINAL_HISTORY_CHECK_CONSENT 를 동의 완료할 때만 필수. 다른 consentType 이면 있으면 400.

POST /api/portal/me/instructor-role-requests
termsAgreements 안의 기존 evidenceFileObjectId 를 회원 본인 파일로 저장하라.
CRIMINAL_HISTORY_CHECK_CONSENT 이고 agreed=true 이면 필수다. agreed=false 이면 파일을 요구하지 마라.
이 저장에서 requireAdminId() 로 회원을 거절하지 마라.

파일 조건:

- filePurpose=CRIMINAL_HISTORY_EVIDENCE
- 업로더는 MEMBER 이고 현재 로그인한 회원
- uploadStatus=AVAILABLE, scanStatus=CLEAN
- 관리자가 올린 파일을 회원 동의에 붙이면 거절
- 회원이 올린 파일을 CMS 관리자 등록의 ADMIN 업로더 검사에 넣지 마라. 두 검사는 갈라 둬라

받기:

- 회원 본인: 기존 POST /api/portal/me/files/{fileObjectId}/download-requests
- 관리자: 기존 sensitive-downloads
- GET /api/portal/public/files/{id}/download 와 GET /api/admin/files/{id}/download 는 계속 거절한다. presign 을 공개 downloadUrl 에 넣지 마라.

에러. 기존 CONSENT_EVIDENCE_FILE_REQUIRED 는 유지하라.
회원 소유 실패는 관리자 문구와 섞지 마라.

- CONSENT_EVIDENCE_FILE_NOT_OWNED_BY_MEMBER
- CONSENT_EVIDENCE_FILE_PURPOSE_MISMATCH
- CONSENT_EVIDENCE_FILE_NOT_AVAILABLE

ClientErrorMessageResolver 에 한글 메시지를 넣어라.
관리자 쪽 CONSENT_EVIDENCE_FILE_NOT_READY_OR_NOT_OWNED 문구는 그대로 둬라.

테스트:

- 회원이 me/files 로 올리고 complete 또는 instructor-role-requests 에 id 를 넣으면 동의 행에 evidence 가 남는다.
- 다른 회원의 파일 id 는 거절한다.
- 관리자 CMS 등록은 여전히 ADMIN 업로더만 받는다.
- 공개 download 는 404 또는 기존 민감 거절이다.

# 추가할 API 2 — 교사회원이 배정 강사 동의서를 받는 조회

문제:
Platform 교육 상세의 배정 강사 카드는 성범죄 경력조회 동의, 행정정보 공동이용 사전 동의 다운로드를 보여 준다.
신청 상세 ApplicationDetailResponse 에는 강사와 동의서 목록이 없다. 화면 데이터는 mock 이고 주소는 `#` 이다.
POST /api/portal/me/consents/documents/{documentId}/download-requests 는 문서 소유 회원만 된다.
학교 회원이 강사 documentId 로 그 경로를 호출하게 본인 검사를 풀지 마라.
공개 파일 download 로 동의서나 증빙 원본을 열지 마라.

구현:

GET /api/portal/me/program-applications/{applicationType}/{applicationId}/assigned-instructors
권한: 그 신청을 낸 회원 본인. 신청이 학교·기관 참여(교사)일 때만. 아니면 404 APPLICATION_NOT_FOUND 로 존재 여부를 숨겨라.

200 본문:

instructors: [
  {
    instructorMemberId: number,
    name: string,
    consentDocumentsRequested: boolean,
    consents: [
      {
        consentType: "CRIMINAL_HISTORY_CHECK_CONSENT" | "ADMINISTRATIVE_INFO_CONSENT",
        title: string,
        documentId: number,
        originalFileName: string
      }
    ]
  }
]

consentDocumentsRequested 가 false 이면 consents 는 빈 배열이다. 기관이 확인을 요청하지 않은 강사 파일을 주지 마라.
목록에 downloadUrl 을 넣지 마라. URL 은 아래 POST 에서만 발급한다.
성범죄 증빙 원본 CRIMINAL_HISTORY_EVIDENCE 는 넣지 마라. 학교가 받는 것은 서명 완료 후 렌더된 동의서다.
렌더 파일이 없으면 그 항목을 빼라. 증빙 원본으로 대신 채우지 마라.
다른 동의 종류(초상권, 지급조서, 교육진행자 서약)는 넣지 마라.

다운로드는 바이트 API를 새로 만들지 마라.

POST /api/portal/me/program-applications/{applicationType}/{applicationId}/assigned-instructors/{instructorMemberId}/consents/{documentId}/download-requests
body: 기존 MemberPortalFileDownloadRequest 와 같이 purpose 문자열.
응답: 기존 FileDownloadResponse. fileObjectId, downloadUrl, expiresAt, requiredHeaders.

조건:

- 호출자는 그 신청의 교사 회원
- instructorMemberId 는 그 프로그램에 배정된 강사
- documentId 는 그 강사의 완료 문서이고 consentType 은 위 두 개뿐
- 렌더 파일이 CLEAN + AVAILABLE

소유자용 POST /api/portal/me/consents/documents/{documentId}/download-requests 의 본인 검사는 그대로 둬라.

에러:

- APPLICATION_NOT_FOUND
- ASSIGNED_INSTRUCTOR_NOT_FOUND
- ASSIGNED_INSTRUCTOR_CONSENT_NOT_VISIBLE
- ASSIGNED_INSTRUCTOR_CONSENT_NOT_READY

ClientErrorMessageResolver 에 한글 메시지를 넣어라.
OpenAPI 에 GET 과 POST 를 추가하라.

테스트:

- 확인 요청된 강사의 완료 동의서만 목록에 있고, download-requests 가 downloadUrl 을 준다.
- 다른 신청, 다른 강사, 미완료 문서, 증빙 원본 id 는 거절한다.
- 강사 본인의 /consents/documents/{id}/download-requests 는 학교 회원에게 여전히 거절된다.
- 공개 파일 download 로는 그 파일이 열리지 않는다.

# 완료 조건

1. 「이미 있어서 그대로 쓸 API」의 경로와 응답 모양이 그대로다. 공개 download 는 JSON downloadUrl 이다.
2. CMS 문서의 관리자 API와 금지 항목을 새로 만들지 않았다.
3. 회원이 기존 me/files 로 CRIMINAL_HISTORY_EVIDENCE 를 올리고 본인 성범죄 동의에 연결할 수 있다. CMS 관리자 등록은 ADMIN 업로더만 받는다.
4. 교사회원 배정 강사 조회가 완료된 동의서만 보여주고, 그 신청 안의 download-requests 로만 URL 을 준다.
5. 채용·재능기부 파일 API, 영수증·설문·공지·결과·투명경영의 두 번째 파일 API를 만들지 않았다.
6. 로컬 시드로 회원 성범죄 증빙 1건, 교사 신청에 배정 강사 동의서 1건을 넣어 두 조회가 빈 값이 아니게 하라. prod 마이그레이션에는 넣지 마라.
```
