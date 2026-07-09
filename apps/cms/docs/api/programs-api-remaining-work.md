# 일반 프로그램 API — 남은 작업 (프롬프트용)

**작성일**: 2026-07-09  
**대상**: CMS `/programs/general` (일반 프로그램만 — UJAT·1사1교·Gemini 간섭 금지)  
**관련 문서**: [programs-api-integration.md](./programs-api-integration.md) · [programs-api-migration-guide.md](./programs-api-migration-guide.md) · [programs-api-backend-gaps.md](./programs-api-backend-gaps.md)

> 이 문서만 프롬프트에 붙여도 다음 작업을 이어갈 수 있도록 작성했습니다.

---

## 컨텍스트 요약

### 완료된 것

| 영역 | 상태 |
|------|------|
| programs 목록/상세 GET | `use-general-program-list-filters`, `use-general-program-detail` |
| programs POST/PATCH/DELETE | create/update 상세·등록, **목록 bulk delete** |
| URL 쿼리 (상세) | `programId`, `lnb`, `tab`, `subTab`, `participantView`, `edit`, 진행 nested params |
| 등록 완료 URL | `new`/`generalStep` 제거 → `programId` + `lnb=info` |
| applications 2차 | 기관/강사/개인 목록 GET + **권한 모달** 일괄 승인/반려 |
| programProgress 2차 | 참여자(개인) 목록 `GET .../participants` |
| 모집 미리보기 | `participantRecruitmentPreview=1` + `ParticipantRecruitmentPreviewModal` (optimistic open, z-index 분리) |
| env | `.env.local.example`에 `programs,applications,programProgress` |

### Remote 활성 조건

```env
VITE_REAL_API_MODULES=...,programs,applications,programProgress
```

+ API 로그인 MFA (`hasRemoteAdminJwt()`) + `isRemoteApiConfigured()`  
→ `pnpm run cms` 재시작 필요

### 모달 z-index (SSOT)

| 상수 | 값 | 파일 |
|------|-----|------|
| `GENERAL_PROGRAM_DETAIL_FULLPAGE_MODAL_Z_INDEX` | 1100 | `lib/general-program-modal-z-index.ts` |
| `PARTICIPANT_RECRUITMENT_PREVIEW_MODAL_Z_INDEX` | 1500 | 동일 |
| 양식 `userPreview` (TemplateWritingPreview) | 1300 | `template-writing-preview-context.tsx` |

---

## 🔴 P0 — 버그 (즉시)

### 1. 등록 remote 중복 POST

**증상**: remote ON 시 프로그램 등록 단계에서 「저장」마다 `createGeneralProgram` 호출 → 프로그램 중복 생성

**원인**:
- `use-registration-flow.ts` — `handleSave` / `handleCompleteRegistration` 모두 `registrationVm.handleSave()` 호출
- `use-program-registration-editor.ts` — `onRegistrationSaved` 있으면 매 `handleSave`마다 `persistGeneralProgramRegistration` → POST

**수정 방향**:
- `persistGeneralProgramRegistration` / `onRegistrationSaved`는 **「등록 완료」1회**만
- 중간 저장은 template draft만 (remote draft API 있으면 별도, 없으면 local only)

**주요 파일**:
- `hooks/use-registration-flow.ts`
- `features/template/hooks/use-program-registration-editor.ts`
- `lib/registration-local-save.ts`

---

### 2. 등록 API 실패 시 사용자 알림 없음

**증상**: `onRegistrationSaved` 경로에서 catch 후 `console.debug`만, alert 없음

**수정**: `showAlert` 또는 toast로 실패 메시지 노출

**파일**: `use-program-registration-editor.ts` (catch 블록)

---

### 3. 참여자 진행현황 URL deep link mock 의존

**증상**: remote에서 참여자 목록은 API인데 `participantId` URL 상세는 mock finder → 404/빈 화면

**원인**: `participating-participants-section.tsx` L128 `findParticipatingIndividualParticipantById` (mock)

**수정**: `useProgressIndividualParticipantList`의 `participantList.find(id)` 사용

**파일**: `ui/detail-modal/program-status/participating-participants-section.tsx`

---

## 🟠 P1 — 1차 계획 미완료

### 4. 상세 모달 단건 삭제 (Phase 2.5)

**현재**: 목록 `useDeleteGeneralPrograms` bulk만 연동, 상세 내 삭제 UI 없음

**수정**:
- 상세 모달 삭제 액션 → `deleteGeneralProgram(programId)`
- 성공 시 `clearGeneralProgramDetailQueryParams` + 목록 refetch

**파일**: `detail-fullpage-modal.tsx`, `page.tsx`

---

### 5. `useCreateGeneralProgram` 미사용

**현재**: 등록은 `persistGeneralProgramRegistration` → `createGeneralProgram` 직접 호출

**선택**: 훅으로 통일하거나 dead code 제거

---

### 6. 문서·env 정리

- [ ] `.env.example`에 `programs,applications,programProgress` 주석 예시
- [ ] `backend-handoff.md` programs 본문 (필드·enum SSOT)
- [ ] `programs-api-migration-guide.md` 수동 체크리스트 `[x]` 반영

---

## 🟠 P1 — 신청(applications) 2차 잔여

**모듈**: `applications` (+ `programs` 필수)

| 항목 | 현재 | 파일 |
|------|------|------|
| `handleBulkApprove` / `handleBulkReject` (권한 모달 없는 빠른 버튼) | mock only | `use-applicants-detail.ts` L755+ |
| 행 단위 승인 드롭다운 (`handleInstitutionApprovalStatusChange` 등) | mock only | 동일 L484+ |
| 봉사자 신청 | `fetchVolunteerApplicationsRemote` 클라이언트만 | `applications-api-client.ts` |
| `applicationsLoading` | 훅 반환만, UI 없음 | `use-general-program-applications-remote-sync.ts` |
| API 에러 UX | remote 승인 throw 시 사용자 메시지 없음 | `use-applicants-detail.ts` confirmBulk* |

**참고**: `confirmBulk*Approve/Reject` (권한 모달 경로)는 `applyRemote*Decision` 연동 **완료**

---

## 🟡 P2 — 진행현황·기타 mock

**모듈**: `programProgress` (+ `programs` 필수)

| 항목 | 상태 |
|------|------|
| 참여 기관/강사/봉사 진행 목록 | mock |
| `GET .../navigation` LNB 탭 가용성 | 미연동 |
| 출석·게시글·설문 등 | mock |
| lifecycle 변경 | `use-program-status-manager` → mock `updateProgram` |
| 신청경로 변경 | `use-application-path-management` → mock |
| 담당자 탭 삭제 | mock |

---

## 🟡 P2 — API 계약·백엔드 (gaps)

`programs-api-backend-gaps.md` 참고:

- 목록 필터 `lifecycleStatus` / `participantRecruitment` / 운영기간 → 클라이언트 필터 only
- `serviceDetailJson` v1 — 모집 nested·설문 메뉴 등 일부만
- create body에 `programType=GENERAL` 없음 (목록 query에만)
- 목록 `size: 500` 고정
- 상세 remote 실패 시 `useGeneralProgramDetail`의 `error` UI 미연동

---

## 수동 QA 체크리스트

**쿼리**
- [ ] 위젯 status → 목록 필터 URL → 테이블
- [ ] 행 클릭 시 목록 필터 + `programId`/`lnb`/`tab` 유지
- [ ] breadcrumb 목록 복귀 시 상세 params sweep
- [x] `subTab` · `participantRecruitmentPreview` URL 동기화 (optimistic open 포함)
- [ ] `edit=1` → 저장 → `edit` 제거
- [ ] `new=1` → 완료 → `programId` 전환
- [ ] 상세 닫기 시 테이블 URL flush

**API**
- [ ] remote ON: 저장 후 새로고침 유지
- [ ] create → list 반영
- [ ] delete → 목록·URL 정리
- [ ] remote OFF: mock 회귀

**모집 미리보기**
- [ ] 모집 정보 > 참여자 모집 정보 > 「미리보기」 클릭 즉시 풀페이지 미리보기 (새로고침 불필요)
- [ ] URL `participantRecruitmentPreview=1` + 뒤로가기 닫기
- [ ] 미리보기가 상세 모달 **위**에 표시 (z-index 1500 > 1100)

---

## 주요 파일 맵

| 영역 | 경로 |
|------|------|
| Remote 판별 | `api/general-programs-remote-capabilities.ts`, `applications-remote-capabilities.ts`, `program-progress-remote-capabilities.ts` |
| CRUD | `api/admin-general-programs-service.ts`, `api/programs-api-client.ts` |
| Adapter | `api/adapters/general-program-adapters.ts`, `general-applications-adapters.ts` |
| 상세 | `ui/detail-modal/detail-fullpage-modal.tsx` |
| 등록 | `lib/registration-local-save.ts`, `pages/programs/general/page.tsx` |
| 신청 UI | `shared/ui/program-detail/applicant-list/use-applicants-detail.ts` |
| 진행 UI | `hooks/use-progress-individual-participant-list.ts`, `participating-participants-section.tsx` |
| 쿼리 SSOT | `lib/general-program-detail-route.ts` |
| z-index | `lib/general-program-modal-z-index.ts` |
| 미리보기 | `info/participant-recruitment-preview-modal.tsx`, `ui/user-preview/` |

---

## 프롬프트 예시

```
apps/cms/docs/api/programs-api-remaining-work.md 를 읽고 P0 #1(등록 중복 POST)부터 수정해줘.
일반 프로그램만 수정하고 UJAT/1사1교/Gemini는 건드리지 마.
```

```
programs-api-remaining-work.md P1 #4 상세 단건 삭제 연동해줘.
```

```
programs-api-remaining-work.md 신청 2차 잔여 — handleBulkApprove remote 연동 + applicationsLoading UI.
```

---

## 작업 시 규칙

1. `apps/cms/src/features/program/general/**`만 기본 수정 (program-type-isolation)
2. shared 수정 시 `variant` / 분기로 다른 유형 기본값 유지
3. 테스트: `general-program-adapters.test.ts`, `general-program-detail-route.test.ts`, `general-applications-adapters.test.ts`
4. remote 스모크: `.env`에 `programs,applications,programProgress` + API 로그인
