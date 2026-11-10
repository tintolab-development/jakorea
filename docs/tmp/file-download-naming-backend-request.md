# [BE 요청] 다운로드 파일명 규칙 서버 적용 및 다운로드 이력 정합성

> 백엔드 담당자(또는 BE 에이전트)에게 그대로 전달하는 요청서입니다.
> 작성: 2026-11-10 · 대상: 홈페이지 어드민 BE(`JAHOMEADMINBACK`), CMS BE(`JABACK`)
> 관련 FE 작업: 브랜치 `keonhee`(미커밋) — 파일명 규칙을 프런트에서 우선 적용함

## 1. 배경

CMS와 홈페이지 어드민에서 내려받는 파일의 이름 규칙이 아래처럼 정해졌습니다.

| 구분 | 규칙 | 예시 |
|---|---|---|
| 엑셀 | `[JA Korea] 도메인명_파일 이름_YYMMDD.xlsx` | `[JA Korea] 홈페이지 어드민_회원 로그인 이력_261110.xlsx` |
| 발급 PDF(CMS) | `[JA Korea] 파일유형명_발급대상자명_YYMMDD.pdf` | `[JA Korea] 초상권 수집·이용 동의서_한서윤_261110.pdf` |
| 발급 PDF(사용자 플랫폼) | `[JA Korea] 수료증_발급대상자명_YYMMDD.pdf` | `[JA Korea] 수료증_한서윤_261110.pdf` |

- 도메인명은 `홈페이지 어드민` 또는 `CMS 어드민`입니다.
- `YYMMDD`
  - 엑셀은 내려받은 날짜(Asia/Seoul)입니다.
  - 발급 PDF는 증명서에 적힌 발급일이고, 재발급하면 재발급일입니다.
- 파일명에 `/`는 쓸 수 없으므로 `,`로 바꿉니다. 예: `버그/이슈 이력` → `버그,이슈 이력`
- **다운로드 이력에도 같은 한글 파일명이 남아야 합니다.**

FE는 "서버 수정 없이 우선 적용" 방침에 따라 아래 두 가지만 처리했습니다.
1. 내려받는 파일 이름을 바꿨습니다.
2. 이력 화면에 표시되는 이름을 바꿨습니다.

DB에 저장되는 이력 값과 서버가 만드는 파일은 그대로라서 아래 문제가 남아 있습니다.

## 2. 현재 문제

### 2-1. 홈페이지 어드민 (필수)

서버가 엑셀 파일명을 영문으로 만들고, 그 이름을 그대로 `homepage.homepage_file_download_log.original_name`에 기록합니다.

| 서버 파일명(현재) | 위치 | 요청 이름 |
|---|---|---|
| `member_login_log_yyyyMMdd_HHmmss.xlsx` | `log/HomepageLogQueryService.java:224` | `회원 로그인 이력` |
| `admin_account_action_log_…` | 같은 파일 `:278` | `관리자 계정 처리 이력` |
| `file_download_log_…` | 같은 파일 `:182` | `파일 다운로드 이력` |
| `privacy_access_log_…` | 같은 파일 `:153` | `개인정보 조회 이력` |
| `system_issue_log_…` | 같은 파일 `:311` | `버그,이슈 이력` |
| `career_talent_applications_…` | `career/CareerTalentApplicationService.java:196` | `인재채용 신청 목록` |
| `talent_applications_…` | `sponsorship/TalentApplicationService.java:191` | `재능기부 신청 목록` |
| `corporate_consultations_…` | `sponsorship/CorporateConsultationService.java:188` | `기업 후원 상담 신청 목록` |

이 구조 때문에 생기는 문제는 다음과 같습니다.
- **감사 기록 불일치:** 사용자가 받은 파일은 한글 이름인데, 이력에는 영문 이름이 남습니다.
- **검색 불가:** 이력의 파일명 검색은 DB 값(`original_name`)으로 하므로 한글로 검색하면 나오지 않습니다.
- **엑셀에 영문 노출:** "파일 다운로드 이력" 엑셀 안의 파일명 열이 영문으로 나올 것으로 보입니다(FE 미확인).
- **FE 대응표 의존:** FE가 영문→한글 대응표(`apps/admin/src/features/file-download-log/api/export-file-name.ts`)로 화면만 바꾸고 있습니다. 새 내보내기가 생기면 영문 그대로 노출됩니다.

### 2-2. CMS (권장)

CMS 서버는 이미 자체 로그 엑셀에 규칙을 쓰고 있습니다(`LogManagementService.java:602` `logExportFileName`). 남은 문제는 다음과 같습니다.

1. **과거 이력 이름이 규칙 이전 형식**
   - 예: `교재 목록_20261109.xlsx`, `수료증_한서윤_261110.pdf`, `버그&이슈 이력_…`
   - FE가 화면에서만 바꿔 보여 줍니다. 그래서 검색과 "파일 다운로드 이력" 엑셀(`fileDownloadHistoryExport`)에는 옛 이름이 그대로 나옵니다.
2. **`unknown-file`**
   - 파일명이 없을 때 SQL이 넣는 값입니다(`LogManagementService.java:329`, `:371`).
   - 1365 봉사시간 등록 양식 등 서버 기록 건에서 보입니다.
3. **발급 PDF 날짜**
   - 규칙상 날짜는 발급일·재발급일인데, FE는 대부분 다운로드 날짜를 씁니다. 발급일을 응답으로 받지 못하기 때문입니다.
   - 대상: 수료증, 활동인증서, 강의보고서, 지급조서, 초상권 동의서
4. **클라이언트 이력 API의 `/` 처리**
   - `POST /api/admin/logs/file-access/client`의 `fileName`은 FE가 이미 `/`→`,`로 바꿔 보냅니다.
   - 서버에는 이 방어 처리가 없습니다.

### 2-3. 사용자 플랫폼 (권장)

수료증 파일명의 날짜를 발급일로 맞추려면 `issuedAt`이 필요합니다.
- FE는 발급 직후 다운로드할 때만 발급 응답의 `issuedAt`을 씁니다.
- 이미 발급된 수료증을 다시 내려받을 때는 다운로드 날짜를 씁니다.

## 3. 요청 사항

### 3-1. [필수] 홈페이지 어드민 엑셀 파일명 규칙 적용

- 위 8종의 파일명을 `[JA Korea] 홈페이지 어드민_{요청 이름}_{yyMMdd}.xlsx`로 바꿔 주세요.
  - 날짜는 `Asia/Seoul` 기준입니다.
  - 기존 `HH mm ss`는 빼 주세요.
  - CMS `logExportFileName`과 같은 방식입니다.
- `Content-Disposition`과 `recordLogExport`/`recordXlsxExport`에 **같은 값**이 들어가야 합니다.
  - 지금도 같은 변수를 쓰므로 이름 생성부만 바꾸면 됩니다.
- `Content-Disposition`에는 `filename*=UTF-8''…`(RFC 5987)를 넣어 주세요. 필요하면 ASCII `filename=` fallback을 함께 넣어 주세요.
- `ApplicationListExcelExporter.fileName(prefix, instant)`가 공통이라면 한 곳에서 바꾸면 됩니다.

### 3-2. [권장] 기존 이력 데이터 일괄 변경 (양쪽 BE)

검색과 이력 엑셀까지 맞추려면 기존 행을 한 번 마이그레이션해야 합니다. 운영 반영 여부는 정책 확인 후 결정해 주세요.

- **홈페이지 어드민:** `original_name`이 `^{영문키}_\d{8}_\d{6}\.xlsx$`인 행 → `[JA Korea] 홈페이지 어드민_{한글}_{yyMMdd}.xlsx`
- **CMS:** `file_access_log.display_file_name` 중 서버 생성 파일만 바꿉니다.
  - 대상: 클라이언트 생성 엑셀(`{이름}_{yyyyMMdd}.xlsx`), `CERTIFICATE_ISSUE` PDF
  - `[JA Korea] …` 형식으로 바꾸고, `버그&이슈` → `버그,이슈`도 함께 바꿔 주세요.
  - 변환 규칙은 FE `apps/cms/src/features/logs/lib/download-log-file-name.ts`와 같습니다.
- **업로드 원본은 바꾸지 않습니다.**
  - 대상: `file_object.original_file_name`(사용자 첨부, 증빙, 제출 동의서, 이미지)
  - 날짜가 없는 과거 생성 파일도 원본과 구분할 수 없으면 그대로 둡니다.
- 감사 로그 원본 보존 정책상 수정이 어렵다면 알려 주세요. 그 경우 FE 화면 변환을 유지하고, 이력 엑셀에만 같은 변환을 적용하는 방안을 협의하겠습니다.

### 3-3. [권장] CMS `unknown-file` 제거

- 서버가 기록하는 다운로드(1365 등록 양식 등)에도 `display_file_name`을 규칙 이름으로 저장해 주세요.
  - 예: `[JA Korea] CMS 어드민_1365 봉사시간 등록 양식_{yyMMdd}.xlsx`
- `unknown-file`이 남는 경로가 더 있으면 함께 알려 주세요.

### 3-4. [권장] 발급 PDF 날짜 기준 제공

아래 둘 중 하나를 선택해 주세요.
- **A. 서버가 파일명을 내려줌(권장):** 발급 PDF 다운로드 응답의 `Content-Disposition`에 규칙 이름을 넣어 주세요. FE는 헤더 값을 그대로 씁니다.
- **B. 발급일 필드 제공:** 발급 조회와 다운로드 가능 여부 응답에 `issuedAt`(재발급 시 재발급 일시)을 넣어 주세요. FE가 이름을 만듭니다.

대상 범위:
- CMS: 수료증, 활동인증서, 강의보고서, 지급조서, 초상권 수집·이용 동의서
- 사용자 플랫폼: 수료증

### 3-5. [선택] `/file-access/client` 파일명 방어

- 저장 전에 `fileName`의 `/`, `\`를 `,`로 바꿔 주세요.
- FE도 이미 바꿔 보내므로 동작은 같고, 다른 클라이언트에 대한 방어용입니다.

## 4. FE 현재 처리 (BE 반영 전 임시)

| 앱 | 처리 | 파일 |
|---|---|---|
| 홈페이지 어드민 | 서버 헤더를 무시하고 한글 이름으로 저장 | `apps/admin/src/features/logs/shared/lib/download-binary.ts`, 각 `features/*/api/service.ts` |
| 홈페이지 어드민 | 이력 화면에서 영문→한글 표시 변환 | `apps/admin/src/features/file-download-log/api/export-file-name.ts`, `mappers.ts` |
| CMS | 클라이언트 생성 파일명 규칙 적용, 이력 API로 한글 이름 전송 | `apps/cms/src/shared/utils/file-download.ts` (`generateFilename`, `sanitizeDownloadFileName`) |
| CMS | 과거 이력 표시 변환 | `apps/cms/src/features/logs/lib/download-log-file-name.ts`, `logs-adapters.ts` |
| 플랫폼 | 수료증 이름, 발급 직후에만 `issuedAt` 사용 | `apps/platform/.../certificate-download-file-name.ts` |

BE를 반영한 뒤 FE에서 할 일은 다음과 같습니다.
- 홈페이지 어드민: 서버 `Content-Disposition`을 다시 쓰도록 되돌리고, 영문→한글 대응표를 제거합니다.
- 이미 규칙대로 된 이름은 FE 표시 변환을 그대로 통과하므로, BE 반영 순서와 상관없이 깨지지 않습니다.

## 5. 완료 기준

- [ ] 홈페이지 어드민 엑셀 8종의 응답 헤더와 이력 DB 값이 같은 규칙 이름이다.
- [ ] 홈페이지 어드민 이력에서 한글 파일명으로 검색된다.
- [ ] 양쪽 "파일 다운로드 이력" 엑셀의 파일명 열이 화면 표시와 같다.
- [ ] CMS 이력에 `unknown-file`이 새로 생기지 않는다.
- [ ] 발급 PDF 파일명 날짜가 발급일(재발급 시 재발급일)이다.
- [ ] 파일명에 `/`가 포함되지 않는다.
- [ ] OpenAPI(orval) 스키마 변경이 있으면 갱신되어 있다.

## 6. 확인이 필요한 점

- 감사 로그(이력) 기존 행 수정이 정책상 허용되는지 확인해 주세요.
- 홈페이지 어드민 "파일 다운로드 이력" 엑셀 안의 파일명 열이 실제로 영문인지는 FE가 파일을 열어 확인하지 않았습니다.
- 1365 등록 양식 외에 `unknown-file`로 기록되는 서버 경로가 있는지 확인해 주세요.
