# 관리자 권한 설정 — UI(스크린샷) ↔ API 정합 요청

**대상 화면:** CMS `/admin/settings/permissions` (관리자 권한 설정)  
**작성일:** 2026-07-30  
**우선순위:** P1 (화면·권한 동작 SSOT)  
**관련 FE:**  
- `apps/cms/src/pages/admin/settings/permission-customization-page.tsx`  
- `apps/cms/src/pages/admin/settings/admin-permission-settings-ui-data.ts`  
**관련 갭:** [members-api-backend-gaps-2026-07-23.md](./members-api-backend-gaps-2026-07-23.md) §6  
**연동 명세:** [members-api-integration-2026-07-23.md](./members-api-integration-2026-07-23.md) §권한 설정  

**기존 API:**

| Method | Path | 현 단계 |
|--------|------|---------|
| GET | `/api/admin/admin-permissions` | **필수** (카탈로그) |
| GET | `/api/admin/admin-roles` | **필수** |
| GET | `/api/admin/admin-roles/{roleCode}/permissions` | **필수** (역할별 부여 상태) |
| PUT | `/api/admin/admin-roles/{roleCode}/permissions` | **이번 범위 밖** (고도화) |

---

## 0. 범위 (필독) — 수정 vs 부여

| | 이번 요청 | 비고 |
|---|-----------|------|
| **역할·권한 수정(편집)** | ❌ **불필요** | CMS에서 체크 변경·저장(PUT) UI/API 연동 **하지 않음**. 체크박스는 전부 disabled |
| **역할별 권한 부여 상태** | ✅ **필수** | 화면 체크 표시 **및** 실제 API 가드가 스크린샷(역할별 매트릭스)과 **동일**해야 함 |
| **카탈로그(항목·라벨·5열)** | ✅ **필수** | `allPermissions`가 스크린샷 항목과 같아야 함 |

정리:

1. **지금 BE에 요구하는 것**  
   - 역할(MASTER/PM/PARTNER/VIEWER)마다 **이미 seed된 부여 목록**이 스크린샷·§4와 같을 것  
   - `GET …/{roleCode}/permissions`의 `grantedPermissions` = 그 부여 목록  
   - 해당 역할 계정으로 CMS API 호출 시 **부여된 권한만 통과**, 미부여는 거부  
2. **지금 요구하지 않는 것**  
   - 권한 매트릭스를 CMS에서 바꿔 저장하는 기능  
   - PUT body / 편집 UX / 변경 이력 UI

> “역할 수정은 안 해도 된다” ≠ “권한 부여를 대충 맞춰도 된다”.  
> **수정 UI는 스킵**하되, **부여(granted) 데이터·런타임 권한은 스크린샷과 일치**해야 한다.

---

## 1. 목표

스크린샷 UI와 API가 **같은 권한 카탈로그·같은 부여 상태**를 보도록 맞춘다.  
(편집 기능이 아니라 **조회 + 실제 권한 적용**의 SSOT.)

| 구분 | 요구 |
|------|------|
| 레이아웃 | 역할 탭 4개 × **고정 5열 카테고리** × 스크린샷과 동일한 항목·라벨 |
| 부여 표시 | 역할별 체크 = **부여**, 미체크 = **미부여** ← `grantedPermissions`와 1:1 |
| 부여 동작 | 위 매트릭스가 **실제 CMS API 권한 검사**에도 동일 적용 |
| 현 단계 UX | 체크박스 **전부 disabled**. **PUT/저장 UI 없음** (고도화 때) |
| 데이터 | FE mock이 아니라 **API `grantedPermissions`가 SSOT** |

현재 FE는 API 카탈로그 정합 전까지 **스크린샷형 로컬 UI**를 사용한다.  
원인: **UI 카탈로그(FE id)와 API permission `code` / `domain`이 1:1이 아님.**

---

## 2. 현재 불일치 요약

| | FE UI (스크린샷 복구본) | 현재 API |
|---|---|---|
| 항목 id | `crud_program_open` 등 UI 전용 | `AdminPermissionResponse.code` |
| 그룹 | 5개 한글 카테고리 고정 | `domain` 문자열 동적 |
| 라벨 | 스크린샷 한글 | `name` (불일치 가능) |
| 역할 탭 | 마스터 / PM / 파트너 / 뷰어 | `roleCode` — FE는 `MASTER` / `PM` / `PARTNER` / `VIEWER` **임시 가정** |

→ BE에 **카탈로그·역할코드·역할별 기본 granted**를 스크린샷 기준으로 확정해 달라는 요청.

---

## 3. BE 요청 사항 (확정 필요)

### 3.1 `roleCode` 확정

| UI 탭 | 요구 `roleCode` | 확인 |
|-------|-----------------|------|
| 마스터 | `MASTER` | [ ] |
| PM | `PM` | [ ] |
| 파트너 | `PARTNER` | [ ] |
| 뷰어 | `VIEWER` | [ ] |

`GET /api/admin/admin-roles`에 위 4개가 모두 존재해야 함.  
다르면 **정확한 enum + OpenAPI** 회신.

### 3.2 권한 카탈로그 SSOT

`GET /api/admin/admin-permissions` 및  
`GET /api/admin/admin-roles/{roleCode}/permissions`의 `allPermissions`가 아래를 만족해야 함.

1. **항목 집합 = 스크린샷(및 아래 §3.3) 전체** (누락/추가 시 FE·기획 합의 후 반영)
2. **`domain` 값 = 아래 5개만**, 순서도 동일
3. **`name` = 스크린샷 라벨과 동일** (FE는 `name`을 그대로 표시 가능해야 함)
4. **`code` = 안정적·고유** (아래 제안 code 사용 권장; 변경 시 매핑표 필수)
5. 동일 `domain` 내 **정렬 순서 = 스크린샷 위→아래** (`sortOrder` 필드 추가 권장)

#### 제안 `domain` (고정 5)

| sort | domain (API) | UI 열 제목 |
|------|--------------|------------|
| 1 | `CRUD` | 등록·수정·삭제 권한 |
| 2 | `PII` | 개인정보 열람 |
| 3 | `SCREEN_VIEW` | 화면 열람 |
| 4 | `FILE_DOWNLOAD` | 파일 다운로드 |
| 5 | `MISC` | 기타 |

### 3.3 권한 항목 목록 (스크린샷 SSOT)

BE가 이미 쓰는 code가 있으면 **회신 매핑표**로 대체. 없으면 제안 code 채택 요청.  
`FE UI id`는 현재 프론트 로컬 카탈로그 id이다.

#### A. `CRUD` — 등록·수정·삭제 권한

| code (제안) | name | FE UI id |
|-------------|------|----------|
| `CRUD_PROGRAM_OPEN` | 프로그램 개설 | `crud_program_open` |
| `CRUD_PROGRAM_DELETE` | 프로그램 삭제 | `crud_program_delete` |
| `CRUD_PROGRAM_EDIT` | 프로그램 정보 수정 | `crud_program_edit` |
| `CRUD_MEMBER_REGISTER` | 회원 등록 | `crud_member_register` |
| `CRUD_MEMBER_DELETE` | 회원 삭제 | `crud_member_delete` |
| `CRUD_MEMBER_EDIT` | 회원 정보 수정 | `crud_member_edit` |
| `CRUD_NOTICE_FAQ_INQUIRY_CREATE` | 공지사항 & FAQ & 문의 등록 | `crud_notice_faq_inquiry_create` |
| `CRUD_NOTICE_FAQ_INQUIRY_DELETE` | 공지사항 & FAQ & 문의 삭제 | `crud_notice_faq_inquiry_delete` |
| `CRUD_NOTICE_FAQ_INQUIRY_EDIT` | 공지사항 & FAQ & 문의 수정 | `crud_notice_faq_inquiry_edit` |
| `CRUD_SPONSOR_CREATE` | 후원사 등록 | `crud_sponsor_create` |
| `CRUD_SPONSOR_DELETE` | 후원사 삭제 | `crud_sponsor_delete` |
| `CRUD_SPONSOR_EDIT` | 후원사 수정 | `crud_sponsor_edit` |
| `CRUD_TEMPLATE_CREATE` | 템플릿 등록 | `crud_template_create` |
| `CRUD_TEMPLATE_DELETE` | 템플릿 삭제 | `crud_template_delete` |
| `CRUD_TEMPLATE_EDIT` | 템플릿 수정 | `crud_template_edit` |
| `CRUD_TEXTBOOK_PROGRAM_CREATE` | 교재 및 세부 프로그램명 등록 | `crud_textbook_program_create` |
| `CRUD_TEXTBOOK_PROGRAM_DELETE` | 교재 및 세부 프로그램명 삭제 | `crud_textbook_program_delete` |
| `CRUD_TEXTBOOK_PROGRAM_EDIT` | 교재 및 세부 프로그램명 수정 | `crud_textbook_program_edit` |

#### B. `PII` — 개인정보 열람

| code (제안) | name | FE UI id |
|-------------|------|----------|
| `PII_RRN` | 주민등록번호 확인 | `pii_rrn` |
| `PII_GENDER_DOB` | 성별 및 생년월일 확인 | `pii_gender_dob` |
| `PII_ACCOUNT` | 계좌정보 확인 | `pii_account` |
| `PII_ADDRESS` | 주소지 확인 | `pii_address` |
| `PII_CONTACT_EMAIL` | 연락처 및 이메일 확인 | `pii_contact_email` |
| `PII_EDUCATION` | 학력사항 확인 | `pii_school_info` |
| `PII_SOCIAL` | 연동 소셜계정 확인 | `pii_social` |
| `PII_CONSENT` | 정보 동의 항목 확인 | `pii_consent` |
| `PII_CONSENT_DOCUMENT` | 정보 동의 항목 동의서 확인 | `pii_consent_document` |

#### C. `SCREEN_VIEW` — 화면 열람

| code (제안) | name | FE UI id |
|-------------|------|----------|
| `SCREEN_INSTRUCTOR_RESUME` | 강사이력서 | `fv_instructor_resume` |
| `SCREEN_PROGRAM_PARTICIPATION` | 프로그램 참여 이력 | `fv_program_participation` |
| `SCREEN_SETTLEMENT` | 정산 내역 | `fv_settlement` |
| `SCREEN_STUDENT_ASSIGNMENT` | 학생 과제 | `fv_student_assignment` |
| `SCREEN_EDU_PLAN_DIARY` | 교육계획서 및 교육일지 | `fv_edu_plan_diary` |
| `SCREEN_LECTURE_REPORT` | 강의 보고서 | `fv_lecture_report` |
| `SCREEN_SURVEY_AND_RESULT` | 만족도조사 및 설문조사 결과 | `fv_survey_and_result` |
| `SCREEN_SATISFACTION_RESULT` | 만족도조사 결과 | `fv_survey_result` |
| `SCREEN_RESULT_REPORT` | 결과보고서 | `fv_result_report` |
| `SCREEN_SETTLEMENT_APPLICATION` | 정산 신청서 | `fv_settlement_doc` |
| `SCREEN_PAYMENT_STATEMENT` | 지급조서(산출 내역서) | `fv_payment_doc` |
| `SCREEN_EDU_ACTIVITY_CERT` | 교육진행자 활동인증서 | `fv_edu_activity_cert` |
| `SCREEN_CERTIFICATE` | 수료증 & 참가 인증서 | `fv_certificate` |
| `SCREEN_STATS` | 실적 및 통계 | `fv_stats` |
| `SCREEN_DOWNLOAD_HISTORY` | 파일 다운로드 이력 | `fv_download_history` |
| `SCREEN_PII_ACCESS_HISTORY` | 개인정보 조회 이력 | `fv_personal_info_history` |
| `SCREEN_BUG_ISSUE_HISTORY` | 버그/이슈 이력 | `fv_bug_issue_history` |
| `SCREEN_MAIL_HISTORY` | 메일 발송 이력 | `fv_mail_history` |

#### D. `FILE_DOWNLOAD` — 파일 다운로드

| code (제안) | name | FE UI id |
|-------------|------|----------|
| `FILE_DL_SETTLEMENT` | 정산 내역 | `fd_settlement` |
| `FILE_DL_STUDENT_ASSIGNMENT` | 학생 과제 | `fd_student_assignment` |
| `FILE_DL_EDU_PLAN_DIARY` | 교육계획서 및 교육일지 | `fd_edu_plan_diary` |
| `FILE_DL_LECTURE_REPORT` | 강의 보고서 | `fd_lecture_report` |
| `FILE_DL_SURVEY_AND_RESULT` | 만족도조사 및 설문조사 결과 | `fd_survey_and_result` |
| `FILE_DL_SATISFACTION_RESULT` | 만족도조사 결과 | `fd_survey_result` |
| `FILE_DL_RESULT_REPORT` | 결과보고서 | `fd_result_report` |
| `FILE_DL_PAYMENT_STATEMENT` | 지급조서(산출 내역서) | `fd_payment_doc` |
| `FILE_DL_EDU_ACTIVITY_CERT` | 교육진행자 활동인증서 | `fd_edu_activity_cert` |
| `FILE_DL_CERTIFICATE` | 수료증 & 참가 인증서 | `fd_certificate` |
| `FILE_DL_STATS` | 실적 및 통계 | `fd_stats` |
| `FILE_DL_ALL_LISTS` | 모든 리스트 내역 | `fd_all_lists` |

#### E. `MISC` — 기타

| code (제안) | name | FE UI id |
|-------------|------|----------|
| `MISC_DISPATCH_CASE` | 발송 케이스 관리 | `misc_dispatch_case` |
| `MISC_NOTIFICATION_SEND` | 알림톡/메일 발송 | `misc_notification` |
| `MISC_MEMBER_APPROVAL` | 회원 신청 승인 / 반려 | `misc_member_approval` |
| `MISC_SETTLEMENT_APPROVAL` | 정산 신청 승인 / 반려 | `misc_settlement_approval` |
| `MISC_INSTRUCTOR_PERMISSION_APPROVAL` | 강사 권한 신청 승인 / 반려 | `misc_instructor_permission_approval` |
| `MISC_ADMIN_PERMISSION_APPROVAL` | 관리자 권한 신청 승인 / 반려 | `misc_admin_permission_approval` |

**카탈로그에 없는 code**는 이 화면의 `allPermissions`에 넣지 않거나, FE 렌더 제외 규칙을 합의한다.

---

## 4. 역할별 부여 상태 (동작 SSOT) — 수정 없이 seed로 맞출 것

**이 섹션이 이번 요청의 핵심이다.**  
PUT으로 바꾸라는 뜻이 아니라, **DB/시드에 이미 들어가 있는 역할×권한**이 아래와 같아야 한다.

체크 = `grantedPermissions`에 포함 = **그 역할 계정에 실제 부여**.

| 역할 | 부여 정책 (현 FE·스크린샷 기준 SSOT) |
|------|--------------------------------------|
| `MASTER` | §3.3 **전체 부여** (스크린샷: 전 체크) |
| `PM` | 전체 부여 − 미부여: `SCREEN_DOWNLOAD_HISTORY`, `SCREEN_PII_ACCESS_HISTORY`, `SCREEN_BUG_ISSUE_HISTORY`, `MISC_ADMIN_PERMISSION_APPROVAL` |
| `PARTNER` | 전체 부여 − 미부여: `PII_RRN`, `PII_ACCOUNT`, `SCREEN_DOWNLOAD_HISTORY`, `SCREEN_PII_ACCESS_HISTORY`, `SCREEN_BUG_ISSUE_HISTORY` |
| `VIEWER` | **CRUD / PII / FILE_DOWNLOAD / MISC = 전부 미부여**. `SCREEN_VIEW`만 부여하되 미부여: `SCREEN_DOWNLOAD_HISTORY`, `SCREEN_PII_ACCESS_HISTORY`, `SCREEN_BUG_ISSUE_HISTORY` |

기획이 위와 다르면 **역할별 체크 매트릭스 표로 회신**해 주면 FE·시드를 그에 맞춘다.  
회신이 없으면 위를 BE seed 목표로 본다.

### BE 확인 (부여 — 필수 / 편집 — 제외)

- [ ] **(필수)** 역할별 seed의 granted 목록이 위 표(또는 BE 회신 매트릭스)와 일치
- [ ] **(필수)** `GET …/{roleCode}/permissions`의 `grantedPermissions`가 그 seed와 일치
- [ ] **(필수)** 실제 CMS API 가드가 동일 `code`로 연결  
  - 예: `MISC_INSTRUCTOR_PERMISSION_APPROVAL` 미부여 시 강사 권한 승인 API 403
- [ ] **(필수)** 카탈로그 `code`와 런타임 권한 검사 문자열이 동일
- [ ] **(제외)** PUT으로 매트릭스를 바꾸는 CMS 편집 기능 — 이번 범위 아님

---

## 5. API 계약 (조회 — 현 단계 필수)

### `GET /api/admin/admin-roles/{roleCode}/permissions`

```ts
{
  role: { code: 'MASTER', name: '마스터', /* ... */ },
  allPermissions: AdminPermissionResponse[],   // §3.3 전체, domain·name·code·정렬 고정
  grantedPermissions: AdminPermissionResponse[] // 해당 역할 부여분만
}
```

`AdminPermissionResponse` 권장 필드:

| 필드 | 필수 | 설명 |
|------|------|------|
| `code` | Y | §3.3 |
| `name` | Y | 스크린샷 라벨 |
| `domain` | Y | `CRUD` \| `PII` \| `SCREEN_VIEW` \| `FILE_DOWNLOAD` \| `MISC` |
| `sortOrder` | 권장 | domain 내 표시 순서 |
| `description` | N | |
| `highRisk` | N | PII 등 |

### 응답 검증 (FE 기대)

1. `allPermissions` 개수·집합 = §3.3
2. `domain` ∈ 5개만
3. `grantedPermissions[].code` ⊆ `allPermissions[].code`
4. 탭 전환 시 roleCode만 바꾸고 동일 `allPermissions` 카탈로그

### `PUT` (이번 범위 밖 · 고도화)

- FE는 **호출하지 않음**. 체크박스 disabled · 저장 버튼 없음.
- 엔드포인트 삭제를 요청하는 것은 아님. **지금 BE 작업 우선순위는 GET 카탈로그 + 역할별 granted seed 정합**이다.

---

## 6. FE 연동 방침 (참고)

1. 레이아웃은 **API `domain` 5열 + `name` / `sortOrder`** 기준으로 렌더 (하드코딩 카탈로그는 API와 동일하게 유지하거나 폐기)
2. 체크 = `grantedPermissions`에 code 존재
3. 전 체크박스 `disabled`
4. 저장 버튼/편집 UI는 고도화 전까지 비노출
5. BE가 제안 code를 안 쓰면 **공식 매핑표 1장**을 FE에 제공

---

## 7. BE 회신 체크리스트

**필수 (부여·카탈로그)**

- [ ] `roleCode` 4종 확정값
- [ ] §3.3 카탈로그 채택 여부 / 대체 code·name·domain 전체 표
- [ ] §4 역할별 granted가 seed·GET 응답·런타임 가드에 반영됨 (MASTER 전항 포함)
- [ ] 스테이징 `GET …/MASTER|PM|PARTNER|VIEWER/permissions` 샘플 JSON
- [ ] 실제 API 가드와의 code 연결 여부
- [ ] `sortOrder`(또는 정렬 보장) 제공 여부
- [ ] OpenAPI 반영 일정

**이번 불필요 (편집)**

- [ ] ~~PUT/권한 수정 UI 연동~~ — 고도화 때
- [ ] domain 한글을 API `domain`으로 줄지 FE 매핑할지 (표시만이면 FE 매핑 가능)

---

## 8. 샘플 (기대 형태)

```json
{
  "role": { "code": "MASTER", "name": "마스터" },
  "allPermissions": [
    {
      "code": "CRUD_PROGRAM_OPEN",
      "name": "프로그램 개설",
      "domain": "CRUD",
      "sortOrder": 1
    }
  ],
  "grantedPermissions": [
    {
      "code": "CRUD_PROGRAM_OPEN",
      "name": "프로그램 개설",
      "domain": "CRUD"
    }
  ]
}
```

`MASTER`면 `grantedPermissions` ≈ `allPermissions` (전항 부여).

---

## 9. FE 현황 (2026-07-30)

| 상태 | 동작 |
|------|------|
| 화면 | 스크린샷형 5열 UI 복구 · 체크박스 disabled · API 미연동 |
| 로컬 카탈로그 | `admin-permission-settings-ui-data.ts` (§3.3과 동일 라벨/항목) |
| 구 remote 패널 | `admin-permissions-remote-panel.tsx` (미사용, API domain 동적 UI) |

정합 완료 후 API 연동 시에도 스크린샷과 동일해야 함.

**Last updated:** 2026-07-30
