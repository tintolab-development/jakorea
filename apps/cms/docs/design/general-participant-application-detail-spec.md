# 일반 프로그램 참여자 신청 상세 (기관/개인)

일반 프로그램(`/programs/general`) 참여자 신청 상세 화면 SSOT 문서.

## 신규 컴포넌트 (SSOT)

| 유형 | 컴포넌트 | 경로 |
|------|----------|------|
| 기관 | `ApplicantGeneralInstitutionBasicInfo` | `apps/cms/src/features/program/general/ui/applicant-detail/applicant-general-institution-basic-info.tsx` |
| 개인 | `ApplicantGeneralIndividualBasicInfo` | `apps/cms/src/features/program/general/ui/applicant-detail/applicant-general-individual-basic-info.tsx` |
| 공통 | `ProgramApprovalStatusDetailValue` | `apps/cms/src/features/program/general/ui/applicant-detail/program-approval-status-detail-value.tsx` |

연결: `GeneralParticipantApplicationsView` → `ApplicantList` (`detailVariant="general"`) → `ApplicantsDetailContents`

---

## 개인 유형 — 스크린샷 시안 기준 (김범수)

참고 스크린: 승인 완료 / 신청 반려 두 상태.

### 상단 헤더 액션 (`ApplicantsDetailContents` → `resolveApplicantHeaderItems`)

| `approvalStatus` | 버튼 (좌→우) | variant |
|------------------|--------------|---------|
| `pending` | **[참여 반려]** · **[참여 승인]** · **[개인정보 상세보기]** | delete · secondary · primary |
| `approved` | **[승인 취소]** · **[정보 수정]** · **[개인정보 상세보기]** | delete · primary(disabled) · primary |
| `rejected` | **[반려 취소]** · **[개인정보 상세보기]** | delete · primary |

- `정보 수정`: 승인 완료 시에만 노출. 현재 mock은 `window.alert('준비중')`.
- `개인정보 상세보기`: `usePersonalInfoReveal` — 승인 완료 전에는 마스킹, 클릭 후 `maskSensitive=false`.

### 프로그램 승인 현황 (기본 정보 1행, full-width)

**상세 화면은 테이블 목록과 달리 배지가 아닌 텍스트**로 표현한다.  
컴포넌트: `ApprovalStatusText` (`apps/cms/src/shared/components/approval-status-text.tsx`).  
레이아웃: `applicant-institution-basic-info__approval-status-row` + `__approval-status-vbar` (강사 상세·기관 상세와 동일).

#### 상태별 값 셀 구성

| 상태 | 라벨 (`APPROVAL_STATUS_LABELS`) | 글자색 | 값 셀 구성 |
|------|--------------------------------|--------|------------|
| `pending` | 승인 대기 | `var(--color-green, #1E8C29)` | **상태 텍스트만** (divider·버튼·일시 없음) |
| `approved` | 승인 완료 | `var(--main-BK, #3D3D3D)` | 상태 텍스트 `\|` **[알림 재발송]** `\|` 발송 일시 |
| `rejected` | 신청 반려 | `#C32F4A` | 상태 텍스트 `\|` `사유 : {participationRejectionReason}` `\|` **[알림 재발송]** `\|` 발송 일시 |

- 구분선(`__approval-status-vbar`): 1×13px, `#3D3D3D` opacity 0.5.
- 행 gap: **12px** (`__approval-status-row`).
- 반려 사유 문구: `사유 : {reason}` — reason 없으면 `-`.

#### 알림 발송 / 재발송 (`SendNotiButton`)

| 케이스 | 버튼 라벨 | `mode` | 노출 조건 |
|--------|-----------|--------|-----------|
| 승인·반려 처리 직후 (최초 발송 전) | 알림 발송 | `send` | `approvalNotificationSentAt` 없을 때 (선택: 헤더 승인/반려 액션과 연동) |
| 이미 발송 이력 있음 | 알림 재발송 | `resend` | `approved` / `rejected` — **시안은 항상 재발송** |

시안(승인 완료·신청 반려) 모두 **[알림 재발송]** + 일시가 함께 노출 → `approved`/`rejected`에서는 `mode="resend"` 고정.

**발송 일시**

- 필드: `approvalNotificationSentAt?: string` — 표시 형식 `YYYY.MM.DD HH:mm:ss` (예: `2026.01.15 09:15:42`).
- 재발송 시 갱신 (참고: `ApplicantInstructorRow.approvalNotificationSentAt`, `User.permissionNotificationResentAt`).
- 스타일 (권한 승인 상세 §9와 동일):

```css
color: var(--default-BK, #3D3D3D);
font-size: 16px;
font-weight: 500;
line-height: 150%;
opacity: 0.6;
```

클래스: `applicant-instructor-basic-info__approval-notification-sent-at` 재사용 또는 general 전용 alias.

**참고 구현**

- 강사: `ApplicantInstructorBasicInfo` → `ProgramApprovalStatusValue` — 텍스트 + `SendNotiButton` + 일시.
- 기관(general): `ApplicantGeneralInstitutionBasicInfo` — 현재 배지 사용 → 개인과 동일하게 텍스트로 통일 예정.

---

## 개인 유형 — 테이블·섹션

### 공통 테이블 패턴

`ApplicantGeneralInstitutionBasicInfo` / `ApplicantInstructorBasicInfo`와 동일:

| 요소 | 규칙 |
|------|------|
| 래퍼 | `applicant-institution-basic-info__table-wrap` |
| 테이블 | `applicant-institution-basic-info__table` |
| colgroup | 라벨 열 **200px** × 2 + 값 열 auto × 2 |
| 라벨 셀 | `__cell--label` — 회색 배경, 가운데 정렬 |
| 값 셀 | `__cell--value` — 흰 배경, 좌측 정렬 |
| 2열 행 | `TableRowTwoCols` — label1/value1 \| label2/value2 |
| 전폭 행 | `TableRowFullWidth` — label + value `colSpan={3}` |
| 복합 값 | `ProgramDetailTdSegmentWrap` + `withProgramDetailTdDivider` (` \| ` 구분) |

로컬 헬퍼는 컴포넌트 파일 상단 private function으로 두고, **스타일·colgroup만 shared CSS 재사용** (`applicant-institution-basic-info.css` import).

### 섹션 1 — 기본 정보

| 행 | label (좌) | value (좌) | label (우) | value (우) | 데이터 소스 |
|----|------------|------------|------------|------------|-------------|
| 1 | 프로그램 승인 현황 | (full-width, 위 상태별 표현) | | | `row.approvalStatus`, `participationRejectionReason`, `approvalNotificationSentAt` |
| 2 | 성명 | `applicantName` + `ScheduleChangeHistoryBadge`(count>0) | 성별 및 생년월일 | `gender` `\|` `birthDate (만 age세)` | `detail.*` |
| 3 | 학교 재학 여부 | `schoolEnrollmentStatus` | 소속 | `affiliationSchool` `\|` `affiliationGrade` (fallback: list `affiliation`, `educationGrade`) | `detail.*` / row |
| 4 | 연락처 | 마스킹 `MASKING_POLICY.phone` | 이메일 | 마스킹 `MASKING_POLICY.email` | `detail.contact`, `detail.email` |
| 5 | 자택 주소지 | 동/구 이후 `…` 마스킹 | 1365 ID | 앞 4자 + `***` | `detail.homeAddressFull` / `homeAddress`, `detail.id1365` |

**마스킹**: `maskSensitive && approvalStatus !== 'approved'` (승인 완료 또는 개인정보 상세보기 후 해제).

**성명 배지**: `detail.scheduleChangeCancelCount > 0` → `[일정 변경&취소 이력 N회]` (`ScheduleChangeHistoryBadge`).

### 섹션 2 — 자기소개 및 지원동기

- 마크업: `instructor-resume-section--free-writing` / `instructor-resume-free-writing-card` (강사 이력서 자유 기술 블록 재사용).
- 값: `detail.selfIntroduction` — 빈 문자열이면 `-`.

### 섹션 3 — 팀 정보

동일 4열 colgroup. 전폭 행 2개.

| label | value | 데이터 |
|-------|-------|--------|
| 팀 명 및 팀원 | `{teamName}` `\|` `{teamMemberCount}명` | `detail.teamName`, `detail.teamMemberCount` |
| 역할 | `leader` → **팀장** 민트 태그 (`school-detail-fullpage-view__role-tag--lead`); `member` → **팀원** 일반 텍스트 | `detail.teamRole` → `ASSIGNMENT_TEAM_ROLE_LABELS` |

---

## 개인 유형 — Mock 데이터

파일: `apps/cms/src/data/mock/general-individual-applications-mock.ts`

### Row (`GeneralIndividualApplicantRow`)

```ts
interface GeneralIndividualApplicantRow {
  id: string
  no: number
  applicantName: string
  affiliation: string          // 목록·fallback
  educationGrade: string
  homeAddress: string          // 목록·fallback
  approvalStatus: ApplicantApprovalStatusKey  // 'pending' | 'rejected' | 'approved'
  programId?: string
  sessions?: ParticipatingSchoolSession[]
  detail?: GeneralIndividualApplicantDetail
  participationRejectionReason?: string
  /** 승인/반려 알림 최종 발송 일시 — 승인 현황 행 우측 */
  approvalNotificationSentAt?: string
}
```

### Detail (`GeneralIndividualApplicantDetail`)

```ts
interface GeneralIndividualApplicantDetail {
  gender?: string
  birthDate?: string           // '2010.09.15'
  age?: number
  schoolEnrollmentStatus?: string
  affiliationSchool?: string   // '고등학교'
  affiliationGrade?: string    // '1학년'
  contact?: string
  email?: string
  homeAddressFull?: string
  id1365?: string
  selfIntroduction?: string
  teamName?: string
  teamMemberCount?: number
  teamRole?: 'leader' | 'member'
  scheduleChangeCancelCount?: number
}
```

### 시안용 시드 (SSOT id)

| id | 이름 | status | 용도 |
|----|------|--------|------|
| `general-individual-applicant-18` | 김범수 | `approved` (승인 완료 시안) | 전 필드 풀 세트, `teamRole: leader`, `scheduleChangeCancelCount: 1` |
| `general-individual-applicant-2` | — | `rejected` | `participationRejectionReason: '인원초과'`, `approvalNotificationSentAt` 설정 |

**김범수 approved 시드 예시**

```ts
{
  id: 'general-individual-applicant-18',
  applicantName: '김범수',
  approvalStatus: 'approved',
  approvalNotificationSentAt: '2026.01.15 09:15:42',
  participationRejectionReason: undefined,
  detail: { /* APPLICANT_INDIVIDUAL_18_DETAIL */ },
}
```

**반려 시안용 (동일 id 또는 별도 row)**

```ts
{
  approvalStatus: 'rejected',
  participationRejectionReason: '인원초과',
  approvalNotificationSentAt: '2024.01.15 09:15:42',
  detail: { teamRole: 'member', /* … */ },
}
```

갱신 API: `updateGeneralIndividualApplicantApprovalStatus` — 승인/반려 시 `approvalNotificationSentAt` mock 설정 추가 권장.

---

## 기관 유형 (요약)

### 탭

- 신청 정보 (기본)
- 학생 명단 (비활성)

### 섹션

1. **기본 정보** — 프로그램 승인 현황(개인과 동일 텍스트·알림 규칙), 교재명, 합반 신청 여부, …
2. **안내 사항** — 강의 공간 내 컴퓨터 여부, …
3. **진행 희망 교육 일정** — 2열 테이블(라벨 200px), `formatGeneralDetailSessionLine`

기관 승인 현황·알림 규칙은 **개인 유형과 동일** (`ApprovalStatusText` + `SendNotiButton` + `approvalNotificationSentAt`).

Mock: `applicant-school-1` — `apps/cms/src/data/mock/applicant-institutions.ts`

---

## 구현 참조 (다른 상세 테이블)

| 패턴 | 참조 파일 |
|------|-----------|
| 4열 그리드 + TableRowTwoCols/FullWidth | `applicant-general-institution-basic-info.tsx` |
| 승인 현황 텍스트 + 알림 + 일시 | `applicant-instructor-basic-info.tsx` (`ProgramApprovalStatusValue`) |
| 상태 텍스트 색상 | `ApprovalStatusText` + `approval-status-text.css` |
| 알림 버튼 | `SendNotiButton` (`mode: 'send' \| 'resend'`) |
| 헤더 액션 분기 | `applicants-detail-contents.tsx` → `resolveApplicantHeaderItems` |
| 구분선 `\|` | `withProgramDetailTdDivider`, `ProgramDetailTdSegmentWrap` |
| 자유 기술 블록 | `applicant-instructor-resume.css` |
| 팀장 태그 | `school-detail-fullpage-view__role-tag--lead` |

---

## 현재 구현 vs 시안 GAP

| 항목 | 시안 | 현재 |
|------|------|------|
| 승인 현황 표현 | `ApprovalStatusText` (텍스트) | ✅ `ProgramApprovalStatusDetailValue` |
| 알림 버튼 | 승인/반려 → **알림 재발송** | ✅ `mode="resend"` |
| 발송 일시 | 행 우측 표시 | ✅ `approvalNotificationSentAt` |
| mock `김범수` | approved + 일시 | ✅ |

---

## 삭제 예정 (legacy)

| 파일 | 대체 |
|------|------|
| `ApplicantInstitutionBasicInfo` | `ApplicantGeneralInstitutionBasicInfo` |
| `applicant-institution-basic-info.css` (shared) | general 컴포넌트에서 import 재사용 후 점진 분리 |

## 마이그레이션 체크리스트

- [x] `/programs/general` 기관·개인 상세 UI (1차)
- [x] 개인·기관 승인 현황 → `ApprovalStatusText` + 알림 재발송 + 일시
- [x] mock 시드(김범수 approved / 반려) 및 `approvalNotificationSentAt`
- [ ] `ProgramDetailFullPageModal` institution 상세 → general 컴포넌트 교체
- [ ] legacy `ApplicantInstitutionBasicInfo` 삭제
