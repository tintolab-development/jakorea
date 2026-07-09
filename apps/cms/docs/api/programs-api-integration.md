# 일반 프로그램 (programs) API 연동 명세

`/programs/general` 목록·상세·등록과 Swagger `programs` 도메인 매핑입니다.

**마이그레이션 실행 가이드 (PHASE 0–4)**: [programs-api-migration-guide.md](./programs-api-migration-guide.md)  
**백엔드 갭·미구현 목록**: [programs-api-backend-gaps.md](./programs-api-backend-gaps.md)

공통 가이드: [backend-handoff.md](./backend-handoff.md) · [api-routes-and-client.md](./api-routes-and-client.md)

---

## 모듈 키

| env | 코드 |
|-----|------|
| `VITE_REAL_API_MODULES=...,programs` | `isRealApiModuleEnabled('programs')` |

실 API 호출 추가 조건: MFA 완료 후 유효 JWT (`hasRemoteAdminJwt()`).

**기본값:** 모듈 미포함 시 목록·상세·저장은 mock/localStorage 유지.

**2차 트랙 모듈**

| env | 코드 | 전제 |
|-----|------|------|
| `...,programs,applications` | 신청 목록·승인/반려 | `programs` + JWT |
| `...,programs,programProgress` | 진행현황 참여자 목록 | `programs` + JWT |

---

## 엔드포인트

| 작업 | Method | Path | FE 서비스 |
|------|--------|------|-----------|
| 목록 | GET | `/api/admin/programs` | `fetchGeneralProgramsRemoteList` |
| 상세 | GET | `/api/admin/programs/{id}` | `fetchGeneralProgramRemoteById` |
| 생성 | POST | `/api/admin/programs` | `createGeneralProgram` |
| 수정 | PATCH | `/api/admin/programs/{id}` | `updateGeneralProgram` |
| 삭제 | DELETE | `/api/admin/programs/{id}` | `deleteGeneralProgram` |

클라이언트: [`programs-api-client.ts`](../../src/features/program/general/api/programs-api-client.ts)  
서비스: [`admin-general-programs-service.ts`](../../src/features/program/general/api/admin-general-programs-service.ts)  
어댑터: [`general-program-adapters.ts`](../../src/features/program/general/api/adapters/general-program-adapters.ts)

---

## 목록 쿼리 매핑

| URL / 테이블 필터 | API query | 비고 |
|-------------------|-----------|------|
| `status=scheduled` | `periodStatus=RECRUITING` | 위젯 4카드 |
| `status=in_progress` | `periodStatus=IN_PROGRESS` | |
| `status=completed` | `periodStatus=COMPLETED` | |
| `title` | `keyword` | |
| `programType` (고정) | `GENERAL` | 일반 프로그램만 |
| `lifecycleStatus`, `targetLevel`, `participantRecruitment`, `operationStartDate`/`operationEndDate` | — | 클라이언트 보조 필터 (`general-program-list-filter-params.ts`) |

---

## 쿼리 파라미터 계약

상세 sweep SSOT: [`general-program-detail-route.ts`](../../src/features/program/general/lib/general-program-detail-route.ts)

| 구분 | Params |
|------|--------|
| 목록 필터 | `status`, `title`, `lifecycleStatus`, `targetLevel`, `participantRecruitment`, `operationStartDate`, `operationEndDate`, `viewMode` |
| 상세 네비 | `programId`, `lnb`, `tab`, `edit`, `subTab` |
| 미리보기 | `participantRecruitmentPreview`, `userPreview` |
| 등록 | `new`, `generalStep` |

---

## Create/Update 필드 (1차 전송)

`Program` → `ProgramCreateRequest` / `ProgramUpdateRequest` (`mapGeneralProgramToCreateRequest`, `mapGeneralProgramToUpdateRequest`):

- 기본: `sponsorId`, `title`, `mainTitle`, `type`, `format`, `category`, `description`
- 일정: `startDate`, `endDate`, `applicationStartDate`, `applicationEndDate`
- 상태: `status`, `lifecycleStatus`
- 교육: `businessArea`, `targetLevel`, `institutionType`, `educationTime`, `teamDivision`, `educationProcess`
- 모집·소개: `recruitmentGuide`, `learningSupportContent`, `additionalContentHtml`, `oneLineIntroduction`
- 연락·장소: `contactEmail`, `contactPhone`, `venue`, `managerName`
- 기타: `rounds[]`, `attachmentFileNames`, `settlementRuleId`, `applicationPathId`

**1차 omit (gaps 문서 참고)**: `generalCommonInfo`, `generalParticipantTypes`, 모집 세부 nested 필드 등 CMS 전용 구조.

---

## React Query 키

[`general-program-query-keys.ts`](../../src/features/program/general/api/general-program-query-keys.ts)

- `list(statusFilter, tableFiltersKey)`
- `detail(programId)`
- mutation 성공 시 `generalProgramQueryKeys.all` invalidate

---

## 환경 예시

```env
VITE_REAL_API_MODULES=...,programs
```

`pnpm run cms` 재시작 후 API 로그인 → `/programs/general` 에서 원격 목록·저장 확인.
