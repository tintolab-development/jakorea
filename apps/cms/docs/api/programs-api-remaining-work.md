# 일반 프로그램 API — 남은 작업 (프롬프트용)

**작성일**: 2026-07-09  
**갱신**: 2026-07-15 (§0·코드 기준 상세 완료율·잔여 동기화)  
**대상**: CMS `/programs/general` (일반 프로그램만 — UJAT·1사1교·Gemini 간섭 금지)  
**관련 문서**: [programs-api-integration.md](./programs-api-integration.md) · [programs-registration-flow-api-backend-handoff.md](./programs-registration-flow-api-backend-handoff.md) · [programs-create-api-backend-handoff.md](./programs-create-api-backend-handoff.md) · [programs-api-migration-guide.md](./programs-api-migration-guide.md) · [programs-api-backend-gaps.md](./programs-api-backend-gaps.md) · [**상세 완료율 · Phase 5–10**](./programs-detail-api-conversion-status.md)

> 이 문서만 프롬프트에 붙여도 다음 작업을 이어갈 수 있도록 작성했습니다.  
> 상세 LNB 완료율 SSOT는 [programs-detail-api-conversion-status.md](./programs-detail-api-conversion-status.md) **≈ 55–60%** (구 ≈37% 폐기).

---

## 컨텍스트 요약

### 완료된 것

| 영역 | 상태 |
|------|------|
| programs 목록/상세 GET | `use-general-program-list-filters`, `use-general-program-detail` |
| programs POST/PATCH/DELETE | create/update 상세·등록, **목록 bulk delete**, **상세 단건 삭제** |
| lifecycle PATCH | `use-program-status-manager` remote |
| detail error UI | `detail-fullpage-modal` remote 실패 메시지 |
| URL 쿼리 (상세) | `programId`, `lnb`, `tab`, `subTab`, `participantView`, `edit`, 진행 nested params |
| 등록 완료 URL | `new`/`generalStep` 제거 → `programId` + `lnb=info` |
| 등록 중복 POST 방지 | 중간 저장 = template draft만 / 「등록 완료」만 `persistGeneralProgramRegistration` POST |
| 등록 API 실패 알림 | `showAlert` (등록 완료·draft 저장) |
| applications | 기관/강사/개인 + **봉사자** 목록 GET · 승인/서류·최종 결과 · 권한 모달 · loading |
| navigation | `GET …/navigation` hybrid (실패 시 meta fallback) |
| programProgress | 개인/기관/강사/봉사 목록 `GET …/participants?participantType=` |
| posts / surveys 목록 | `use-general-program-posts-surveys` — 목록 GET partial |
| 모집 미리보기 | `participantRecruitmentPreview=1` + `ParticipantRecruitmentPreviewModal` |
| env | `.env.example` / `.env.local.example`에 `programs,applications,programProgress` |
| dead code | `useCreateGeneralProgram` 제거 (등록은 `persistGeneralProgramRegistration` 유지) |

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

## 🟠 P1 — 신청(applications) 잔여

**모듈**: `applications` (+ `programs` 필수)  
**상세 계획**: [Phase 5](./programs-detail-api-conversion-status.md#phase-5--봉사자-신청-remote)

| 항목 | 현재 | 파일 |
|------|------|------|
| 봉사자 신청 | **하이브리드** — list/document-result/final-result · **면접 배정 POST**(슬롯 create+assign). 슬롯 목록 GET·캘린더 표시는 mock | `admin-applications-service.ts`, `use-doc-passed.ts` |
| 기관·개인 면접 일정 표시 | **mock** (GET interview-slots BE 갭) | `general-interview-assign-schedule-utils.ts` |

**참고**: `confirmBulk*` / `handleBulk*` / 행 드롭다운 / `applicationsLoading` / remote 에러 `showAlert` 는 **완료**

---

## 🟡 P2 — 진행현황·기타 mock

**모듈**: `programProgress` (+ `programs` 필수)  
**상세 계획**: [Phase 6–10](./programs-detail-api-conversion-status.md#phase-5--10-상세-실행-계획)

| 항목 | 상태 | Phase |
|------|------|-------|
| 참여 기관/강사/봉사 진행 목록 | **하이브리드** (`participants` type 필터) | 6 ✅ |
| `GET .../navigation` LNB 탭 가용성 | **하이브리드** (실패 시 meta fallback) | 7 ✅ |
| 출석·과제·중첩 풀페이지 | **부분** — attendance client/hook 있음, schedules 목록 BE 갭 · 과제·중첩 mock | 8 |
| 게시글 | **부분** — 목록 GET + 작성 POST | 8 |
| 설문 | **부분** — 등록 목록 · responses/summary 메타 · 문항 answers mock | 9 |
| lifecycle 변경 | **하이브리드** | 10 ✅ |
| detail error UI | **완료** | 10 ✅ |
| 신청경로 | path CRUD mock · **applicationPathId remote PATCH** | 10 |
| 담당자 탭 | mock (OpenAPI 없음) | 10 |

---

## 🟡 P2 — API 계약·백엔드 (gaps)

`programs-api-backend-gaps.md` 참고:

- 목록 필터 `lifecycleStatus` / `participantRecruitment` / 운영기간 → 클라이언트 필터 only
- `serviceDetailJson` v1 — 모집 nested·설문 메뉴 등 일부만
- create body에 `programType=GENERAL` 없음 (목록 query에만)
- 목록 `size: 500` 고정
- ~~상세 remote 실패 시 `useGeneralProgramDetail`의 `error` UI 미연동~~ → **연동됨** (`detail-fullpage-modal`)

---

## 수동 QA 체크리스트

**쿼리**
- [ ] 위젯 status → 목록 필터 URL → 테이블
- [ ] 행 클릭 시 목록 필터 + `programId`/`lnb`/`tab` 유지
- [ ] breadcrumb 목록 복귀 시 상세 params sweep
- [x] `subTab` · `participantRecruitmentPreview` URL 동기화 (optimistic open 포함)
- [ ] `edit=1` → 저장 → `edit` 제거
- [x] `new=1` → 완료 → `programId` 전환 (중간 저장은 POST 없음)
- [ ] 상세 닫기 시 테이블 URL flush

**API**
- [ ] remote ON: 저장 후 새로고침 유지
- [x] create → list 반영 (등록 완료만)
- [x] delete → 목록·URL 정리 (bulk + 상세 단건)
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
| 등록 | `lib/registration-local-save.ts`, `hooks/use-registration-flow.ts`, `template/hooks/use-program-registration-editor.ts` |
| 신청 UI | `shared/ui/program-detail/applicant-list/use-applicants-detail.ts`, `hooks/use-general-volunteer-applications-remote.ts` |
| 진행 UI | `hooks/use-progress-*-list.ts`, `participating-*-section.tsx` |
| navigation / posts / surveys | `hooks/use-general-program-navigation.ts`, `hooks/use-general-program-posts-surveys.ts` |
| 쿼리 SSOT | `lib/general-program-detail-route.ts` |
| z-index | `lib/general-program-modal-z-index.ts` |
| 미리보기 | `info/participant-recruitment-preview-modal.tsx`, `ui/user-preview/` |

---

## 프롬프트 예시

```
apps/cms/docs/api/programs-api-remaining-work.md 를 읽고 P2 출석·과제 remote 연동해줘.
일반 프로그램만 수정하고 UJAT/1사1교/Gemini는 건드리지 마.
```

```
programs-api-remaining-work.md 면접 슬롯 interview-slots remote 연동해줘.
```

---

## 작업 시 규칙

1. `apps/cms/src/features/program/general/**`만 기본 수정 (program-type-isolation)
2. shared 수정 시 `variant` / 분기로 다른 유형 기본값 유지
3. 테스트: `general-program-adapters.test.ts`, `general-program-detail-route.test.ts`, `general-applications-adapters.test.ts`
4. remote 스모크: `.env`에 `programs,applications,programProgress` + API 로그인
