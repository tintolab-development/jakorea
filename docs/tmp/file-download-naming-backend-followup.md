# [BE 요청 2차] 다운로드 파일명 규칙 — 남은 서버 수정

> 백엔드 담당자(또는 BE 에이전트)에게 그대로 전달하는 프롬프트입니다.
> 작성: 2026-11-10 · 대상: CMS BE(`JABACK` keonhee), 홈페이지 어드민 BE(`JAHOMEADMINBACK`)
> 1차 요청서: `docs/tmp/file-download-naming-backend-request.md` (CMS 반영분 A~F는 FE 연동 완료)

## 0. 공통 규칙 (재확인)

| 구분 | 규칙 |
|---|---|
| 엑셀 | `[JA Korea] 도메인명_파일 이름_YYMMDD.xlsx` — 도메인명 `CMS 어드민` / `홈페이지 어드민` |
| 발급·대상자 파일(PDF·ZIP) | `[JA Korea] 파일유형명_대상자명_YYMMDD.확장자` |
| **업로드 원본(첨부·증빙·과제·동의서·이미지 등) — 2026-11-10 추가** | `[JA Korea] {원본 파일명}_YYMMDD.확장자` (예: `IMG_2235.PNG` → `[JA Korea] IMG_2235_261110.PNG`) |

> **파일 이름 규칙은 모든 다운로드 파일에 적용합니다.** 이미 `[JA Korea]`로 시작하는 이름은 그대로 두고, 그 외 이름은 위 업로드 원본 형식으로 바꿉니다.

- `YYMMDD`
  - 다운로드 파일은 내려받은 날짜(Asia/Seoul)입니다.
  - 발급 PDF는 발급일(재발급 시 재발급일)입니다.
- 파일명의 `/`, `\`는 `,`로 바꿉니다.
- **브라우저에 저장되는 파일명(`Content-Disposition`)과 다운로드 이력에 남는 파일명은 같아야 합니다.**
- `Content-Disposition`에는 `filename*=UTF-8''…`(RFC 5987)를 넣어 주세요. 필요하면 ASCII `filename=` fallback을 함께 넣어 주세요.

## 1-0. [필수] 업로드 원본 다운로드 — 서버 이력·응답 파일명 (CMS·홈페이지 어드민·사용자 플랫폼)

**FE 반영 (2026-11-10, 미커밋)**
- 세 앱의 공통 저장 함수에서 `[JA Korea]`로 시작하지 않는 이름을 `[JA Korea] {원본}_YYMMDD.확장자`로 바꿔 저장합니다.
  - CMS: `downloadBlob`, `downloadFile`
  - 홈페이지 어드민: `downloadFile`, 보호 첨부 저장, 보고서·공시 첨부
  - 플랫폼: `downloadAttachment` 외 9곳
- CMS가 클라이언트 이력(`POST /api/admin/logs/file-access/client`)을 남기는 다운로드는 이력도 규칙 이름입니다.

**남은 문제:** 서버가 이력을 남기는 다운로드는 이력에 **원본 이름**이 그대로 남습니다. 저장 파일명과 다르게 됩니다.

| 앱 | 서버 이력 경로 (예) | 현재 이력 이름 |
|---|---|---|
| CMS | 민감파일 claim→stream(`DOWNLOAD_COMPLETED`), 불참 사유 증빙, 봉사자 심사 증빙, 초상권 동의서 원본, 지출증빙 relay | `file_object.original_file_name` (예: `IMG_2235.PNG`, `과제_보고서.txt`) |
| 홈페이지 어드민 | 인재채용·재능기부·기업 후원상담 보호 첨부(`POST …/attachments/{id}/download`) | 원본 이름 (예: `이력서.pdf`) |
| 사용자 플랫폼 | 포털 서명 다운로드·첨부 | 서버 기록 여부·이름을 알려 주세요 |

**요청**
1. **이력 조회 시점 변환 확장 (1차 D항과 같은 방식, 저장값은 그대로).** 파일 다운로드 이력 목록·검색·엑셀에서 `[JA Korea]`로 시작하지 않는 모든 파일명을 `[JA Korea] {확장자 뺀 원본}_{기록일 yyMMdd, Asia/Seoul}.{확장자}`로 내려 주세요.
   - 기록일이 다운로드일이므로 FE 저장 파일명과 같아집니다.
   - 확장자 판정 기준(FE와 동일): 마지막 `.` 뒤가 영숫자 1~10자이면 확장자로 봅니다. 아니면 확장자 없이 이름 끝에 `_{yyMMdd}`만 붙입니다.
   - 대상: CMS(`file_access_log`) — 1차 D항에서 원본으로 남겨 둔 업로드 원본 포함. 홈페이지 어드민(`homepage_file_download_log`). 검색은 저장값·규칙 이름 둘 다 매칭.
2. **파일 응답 헤더.** 업로드 원본을 내려주는 엔드포인트의 `Content-Disposition`도 같은 규칙 이름(다운로드일 기준)으로 내려 주세요. FE가 blob으로 받는 경로는 FE가 이름을 바꾸지만, 아래처럼 **링크로 직접 여는 경로는 서버 헤더 이름이 그대로 저장됩니다.**
   - CMS 정산 > 지급 산출근거 상세 > 영수증 링크(`payment-order-calculation-basis-detail-shared.tsx`의 `url` 분기, `target=_blank`)
   - 서명 URL(presigned)로 바로 여는 경로가 있으면 해당 객체의 `response-content-disposition`
   - 대상 컨트롤러(코드 검색 기준): `FileAdminController`, `ProgramExecutionAdminController`(불참 사유 첨부), `MemberPortalConsentController`, `UjatVolunteerConsentPortalController`, `MemberPortalUjatClassAssignmentController`, `BulkFileDownloadAdminController`, 홈페이지 어드민 보호 첨부 컨트롤러
3. **고정 영문·일반 이름.** 아래 이름도 규칙 이름으로 바꿔 주세요. FE도 저장할 때 `[JA Korea] {이름}_YYMMDD`로 바꾸지만, 서버 이력이 있으면 맞춰야 합니다.
   - `participant-certificates.zip`, `student-certificates.zip`(5항), `assignment-files-…zip`(3항)
   - 플랫폼: `ujat-volunteer-consents.zip`, `학생 초상권 동의서.zip`의 서버 헤더 이름

## 1. [필수] CMS 실적데이터 엑셀 — 영문 파일명

**현재 상태 (로컬 2026-11-10 확인)**
- `GET /api/admin/performance-records/export?exportType=EXCEL`의 응답 헤더가 `Content-Disposition: attachment; filename="performance_all_pall_v4.xlsx"`입니다.
- 파일 다운로드 이력에도 같은 이름이 저장됩니다.
  - 예: `file_access_log` id 189598, `resource_type=PERFORMANCE_EXPORT`, `display_file_name=performance_all_pall_v4.xlsx`
- 코드 위치
  - `performance/service/PerformanceLedgerExportService.java:158`: `"performance_" + educationMonth|all + …` 형식으로 이름을 만듭니다.
  - `performance/controller/PerformanceAdminController.java:224`: ASCII `filename="…"`만 내려 줍니다.

**요청**
1. 다운로드 파일명과 이력 파일명을 `[JA Korea] CMS 어드민_실적데이터_{yyMMdd}.xlsx`로 바꿔 주세요. 날짜는 다운로드일이고 Asia/Seoul 기준입니다.
   - 동기(200) 응답의 헤더에 적용해 주세요.
   - 비동기(202 → generated-file job → sensitive download) 경로의 생성 파일 원본명과 이력에도 같은 규칙을 적용해 주세요.
   - `p…_v{n}` 같은 내부 버전·필터 식별자가 필요하면 `performance_export_history`에만 두고, 사용자에게 보이는 이름에서는 빼 주세요. 버전을 이름에 남겨야 하는 정책이면 알려 주세요.
2. 파일 다운로드 이력 조회 변환(1차 D항)에 `PERFORMANCE_EXPORT`를 추가해 주세요. 과거 행 `performance_*.xlsx`는 `[JA Korea] CMS 어드민_실적데이터_{기록일 yyMMdd}.xlsx`로 내려 주세요. 엑셀 export와 검색도 같은 기준입니다.

**FE 현재 처리:** 서버 헤더 이름이 `[JA Korea]`로 시작하지 않으면 FE가 `[JA Korea] CMS 어드민_실적데이터_YYMMDD.xlsx`로 저장합니다. 그래서 지금은 **저장 파일명과 이력 파일명이 서로 다릅니다.** BE를 반영하면 FE는 서버 헤더 이름을 그대로 씁니다(FE 변경 불필요).

## 2. [필수] 홈페이지 어드민 엑셀 8종 — 1차 요청서 3-1 미반영

- 1차 요청서 3-1항 그대로입니다. `HomepageLogQueryService.java` 5종과 `ApplicationListExcelExporter.fileName(...)` 3종이 대상입니다.
- 서버가 `system_issue_log_yyyyMMdd_HHmmss.xlsx` 같은 영문 이름을 헤더와 `homepage_file_download_log.original_name`에 저장합니다.

| 서버 파일명(현재) | 요청 이름 |
|---|---|
| `member_login_log_…` | `[JA Korea] 홈페이지 어드민_회원 로그인 이력_{yyMMdd}.xlsx` |
| `admin_account_action_log_…` | `…_관리자 계정 처리 이력_…` |
| `file_download_log_…` | `…_파일 다운로드 이력_…` |
| `privacy_access_log_…` | `…_개인정보 조회 이력_…` |
| `system_issue_log_…` | `…_버그,이슈 이력_…` |
| `career_talent_applications_…` | `…_인재채용 신청 목록_…` |
| `talent_applications_…` | `…_재능기부 신청 목록_…` |
| `corporate_consultations_…` | `…_기업 후원 상담 신청 목록_…` |

과거 이력은 CMS 1차 D항처럼 조회 시점에 변환해 주세요. 목록, 검색, 이력 엑셀이 모두 대상입니다.

**FE 현재 처리(임시)**
- 저장 파일명은 FE가 한글로 만들고 서버 헤더는 무시합니다.
- 이력 화면은 FE 대응표(`apps/admin/src/features/file-download-log/api/export-file-name.ts`)로 화면 표시만 바꿉니다.
- BE를 반영하면 FE는 헤더 사용으로 되돌리고 대응표를 제거하겠습니다.

## 3. [권장] CMS 과제 일괄 ZIP 파일명

- **현재**
  - `member/service/MemberAssignmentBundleService.java:226~234`가 `과제_{프로그램명}_{마스킹 참여자명}.zip`을 만듭니다. `[JA Korea]`와 날짜가 없습니다.
  - ASCII fallback은 `assignment-files-{memberId}-{applicationId}.zip`입니다.
- **요청:** `[JA Korea] 참여자_과제_{참여자명}_{yyMMdd}.zip`으로 바꿔 주세요. 다운로드일, Asia/Seoul 기준입니다.
  - FE fallback 이름과 같은 형식입니다.
  - 프로그램명을 꼭 넣어야 하면 `[JA Korea] 참여자_과제_{참여자명}_{프로그램명}_{yyMMdd}.zip`도 가능합니다. 정책을 알려 주세요.
  - 참여자명 마스킹 여부는 현재 정책(`PrivacyMaskingSupport.maskName`)을 따르되, 결과를 알려 주세요.
- **FE 현재 처리:** 서버 이름이 `[JA Korea]`로 시작하지 않으면 FE가 `[JA Korea] 참여자_과제_{참여자명}_YYMMDD.zip`으로 저장합니다. 이력은 서버가 파일별로 기록하므로 영향이 없습니다.

## 4. [권장] BE OpenAPI 스냅샷 갱신

- `JABACK/openapi/backend.openapi.json`에 1차 반영 필드가 아직 없습니다.
  - `CertificateSerialAllocateResponse.issuedAt`
  - `Ujat1365SemesterRegistrationFormRequest.fileName`
  - `Ujat1365RegistrationFormRequest` 스키마
- FE는 실행 중인 서버 스키마를 부분 병합해서 생성했습니다. 이 상태에서 `pnpm --filter cms generate:api`를 돌리면 BE 스냅샷이 덮어써서 필드가 빠집니다.
- 스냅샷을 갱신할 때 `Ujat1365SemesterRegistrationFormRequest.semesterType`이 **required**로 남아 있는지 확인해 주세요. 현재 live 스키마에서는 required가 빠져 있습니다.

## 5. [확인 필요] 증명서 일괄 ZIP — 파일명과 응답 계약

- **서버**
  - `CertificateAdminController` `POST /api/admin/certificates/issues/bulk-download`가 ZIP을 바로 응답하고, 파일명은 `participant-certificates.zip`입니다.
  - `/issues/bulk-download/roster`와 `ProgramStudentRosterPortalController`는 `student-certificates.zip`입니다.
- **CMS FE**
  - 회원 상세 > 증명서 일괄 발급(`apps/cms/src/features/user/api/certificates-api-client.ts`)은 같은 엔드포인트의 응답을 `{ downloadEndpoint }` JSON으로 기대합니다.
  - 받은 뒤 `[JA Korea] 증명서_일괄_{YYMMDD}.zip`으로 저장합니다.
  - **코드상 응답 형식이 어긋나 보입니다(실제 호출은 미확인).** 현재 계약이 무엇인지 알려 주세요.
- **요청**
  - ZIP 파일명을 `[JA Korea] 증명서_일괄_{yyMMdd}.zip`으로 맞춰 주세요. roster는 `[JA Korea] 수료증_일괄_{yyMMdd}.zip` 등 정책 이름을 알려 주세요.
  - 이 다운로드가 파일 다운로드 이력에 어떤 이름으로 남는지 알려 주세요.

## 6. [후속] 1차 요청서 5항 그대로

1. **1365 서버 이력에 분류 정보 기록:** `downloadKind`(`VOLUNTEER_1365_HOURS_EXPORT`)와 `containedPiiTypes`(`NAME` 등)를 기록해 주세요. 완료되면 FE는 클라이언트 이력(`/file-access/client`)을 빼서 다운로드 1회당 이력 1건으로 정리합니다. 지금은 2건입니다.
2. **포털 수료증 재다운로드용 `issuedAt`:** 사용자 플랫폼에서 재다운로드할 때 발급일을 쓸 수 있도록 발급 이력·가용성 응답에 `issuedAt`을 넣어 주세요. 지금은 발급 직후에만 발급일을 쓰고, 재다운로드는 다운로드일을 씁니다.

## 7. 완료 기준

- [ ] 업로드 원본: 세 앱 모두 이력 목록·검색·엑셀에 `[JA Korea] {원본}_{yyMMdd}.확장자`로 보이고, 링크로 직접 받는 파일도 헤더 이름이 규칙 이름이다.
- [ ] 실적데이터 엑셀: 저장 파일명 = 이력 파일명 = `[JA Korea] CMS 어드민_실적데이터_{yyMMdd}.xlsx`. 과거 `performance_*` 이력도 변환된다.
- [ ] 홈페이지 어드민 8종: 헤더와 `original_name`이 규칙 이름이다. 과거 이력은 조회·검색·엑셀에서 변환된다.
- [ ] 과제 일괄 ZIP: 헤더가 규칙 이름이다.
- [ ] BE OpenAPI 스냅샷에 신규 필드가 있다(`semesterType` required 유지).
- [ ] 증명서 일괄 ZIP 응답 계약과 파일명이 확인된다.
- [ ] 모든 응답 파일명에 `/`가 없다.

## 8. 참고 — FE 반영 현황 (2026-11-10, 미커밋)

| 항목 | FE 처리 |
|---|---|
| 1365 반기 양식 | DOWNLOAD 요청에 `fileName` 전송 → 서버 이력 규칙 이름 확인 |
| 수료증·참가인증서·활동인증서·양식 관리 인증서 | `issuedAt`으로 PDF 발급일과 파일명 날짜 일치(Asia/Seoul) |
| 강의보고서 PDF | 파일명 날짜 = `submittedAt`(Asia/Seoul) |
| 지급조서 | 서버 헤더 이름 사용, 대체 이름도 규칙 형식 |
| CMS 파일 다운로드 이력 | FE 표시 변환을 제거하고 서버 변환값을 그대로 표시 |
| 실적데이터·과제 ZIP | 서버 이름이 규칙이 아니면 FE 규칙 이름으로 저장(BE 반영 시 자동으로 서버 이름 사용) |
| CMS 로그 엑셀 3종, 참여학생명단 샘플 | 날짜 Asia/Seoul 기준, 규칙 이름 |
| 업로드 원본 (세 앱) | 공통 저장 함수에서 `[JA Korea] {원본}_YYMMDD.확장자`로 저장. CMS 클라이언트 이력도 같은 이름 |
