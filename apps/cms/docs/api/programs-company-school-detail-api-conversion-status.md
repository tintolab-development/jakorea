# 1사1교 프로그램 상세 — API 전환 완료율 · Phase 계획

**작성일**: 2026-07-16  
**대상**: CMS `/programs/company-school` (legacy `/programs/economy-education`) 풀페이지 상세  
**범위**: `1c-1s/**` + `general`의 `company-school`/`economy` 분기 — 봉사자·과제·합반 제외  
**로드맵**: [programs-api-conversion-roadmap.md](./programs-api-conversion-roadmap.md) — **Cat 1**  
**관련**: [programs-company-school-api-backend-handoff.md](./programs-company-school-api-backend-handoff.md) · 일반 상세 [programs-detail-api-conversion-status.md](./programs-detail-api-conversion-status.md)

---

## Cat1 코어 DoD (→ Cat 2 진입 조건)

Phase **0–6**이 스테이징에서 통과하고 opt-in이 QA 가능하면 **Cat 2(UJAT 프로그램)** 로 넘어간다.  
Phase **7–10**은 본 문서 **잔여 백로그**로 남기며, Cat2와 **병렬 구현하지 않는다** (추후 Cat1 복귀).

| 항목 | 기준 |
|------|------|
| Phase 0 | `COMPANY_SCHOOL` create → list → detail → PATCH round-trip |
| Phase 1–2 | 목록·상세·등록·수정·삭제 + info 저장 · lifecycle |
| Phase 3–6 | 목록/대시보드 · 기관·강사 신청 · 진행 목록·navigation |
| Gate | `VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED=true` + `programs,applications,programProgress` |
| 회귀 | GENERAL / UJAT / Gemini 목록·상세가 깨지지 않음 |
| 롤백 | opt-in false + 모듈 키 제거로 mock 복귀 |

**잔여 백로그 (Cat1 복귀):** Phase 7 학교 중첩 mutation · 8 강사 중첩·정산 · 9 설문 answers · 10 managers · Excel/export

---

## 0. Phase 스냅샷 (2026-07-16 · FE 갭 보완 갱신)

| Phase | 상태 | 요약 |
|-------|------|------|
| **0** BE/OpenAPI | **FE schema 완료 · 스테이징 QA 대기** | `COMPANY_SCHOOL` enum generated. create→list→detail→PATCH→DELETE는 **관리자 JWT로 스테이징 스모크 후** opt-in |
| **1** 코어 CRUD | **FE 완료 · gate ON** | list/detail/create/update/delete + bulk delete · **URL `programId` deep-link detail** |
| **2** info LNB | **FE 완료(하이브리드)** | PATCH 저장 · lifecycle · `registration-economy` draft · detail error UI |
| **3** 목록·대시보드 | **FE 완료(하이브리드)** | overview status → API `periodStatus` · **remote 시 클라이언트 재필터 스킵** · **상단 4카드 = list `totalElements`** · title/`businessYear` list query · 일정 위젯 |
| **4** 기관 신청 | **FE 완료(하이브리드)** | surface gate + organization approve/reject |
| **5** 강사 신청 | **FE 완료(하이브리드)** | instructor approve/reject (동일 applications 모듈) |
| **6** 진행 목록·nav | **FE 완료(하이브리드)** | ORGANIZATION/INSTRUCTOR participants · navigation (volunteer 제외) |
| **7** 학교 중첩 | **부분** | 목록 remote. 신청/배정/명단/출석 mutation BE 갭 · 과제 없음 |
| **8** 강사 중첩·정산 | **부분** | 목록 remote. 배정/강의보고/정산(100km·교통·숙박) BE 갭 |
| **9** 설문 | **부분** | surveys/responses/summary surface remote · 문항 answers mock |
| **10** 담당자·polish | **부분** | managers mock · 상태 문서 본 파일 |

**추정 상세 완료율 ≈ 55–60%** (LNB 균등 — 중첩 mutation·정산·담당자 미완)

### FE Phase 1–6 보완 (2026-07-16)

- [x] remote ON 시 overview status **이중 필터 제거** (`use-program-list-filters.ts`)
- [x] 상단 4카드 건수 = 목록과 동일 소스 (`fetchCompanySchoolOverviewStages` / `periodStatus`별 `totalElements`)
- [x] `programId` deep-link → `useCompanySchoolProgramDetail` 직접 enable (`program-list-page.tsx`)
- [x] 테이블 `title` / `businessYear` → list API params
- [ ] 스테이징 JWT round-trip + `VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED=true` QA (→ Cat2 진입)
- [x] 로컬 `.env` opt-in ON (2026-07-16) — 스테이징 스모크는 로그인 후 QA

---

## 1. Remote 게이트

```env
VITE_API_SERVER=https://<backend-host>/
VITE_REAL_API_MODULES=adminAuth,formsSurveys,programs,applications,programProgress
VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED=true
```

| Capability | 판별 |
|------------|------|
| 코어 CRUD / reads | `shouldUseCompanySchoolRemoteApi()` |
| 신청 | `shouldUseCompanySchoolApplicationsRemoteApi()` |
| 진행 | `shouldUseCompanySchoolProgramProgressRemoteApi()` |
| 표면 분기 | `use*RemoteEnabledForSurface` — URL이 company-school이면 1사1교 gate |

롤백: opt-in env 제거/false + 해당 모듈 키 제거.

---

## 2. LNB 매트릭스

| LNB | 라벨 | FE 상태 | 비고 |
|-----|------|---------|------|
| `info` | 프로그램 정보 | hybrid | 공통·모집 PATCH · 신청 탭 읽기 전용 |
| `applicants` | 기관 신청 목록 | hybrid | 합반 비노출 |
| `applicant_instructors` | 강사 신청 목록 | hybrid | |
| `progress` | 진행 현황 | hybrid(목록) / mock(중첩) | 참여 기관·강사만 |
| `survey` | 설문 | partial | 학교/강사만 |
| `managers` | 담당자 | mock | OpenAPI 담당자 CRUD 대기 |

---

## 3. 코드 앵커

| 역할 | 경로 |
|------|------|
| capabilities | `features/program/1c-1s/api/capabilities.ts` |
| surface hooks | `features/program/1c-1s/lib/use-company-school-surface-remote.ts` |
| list filters | `features/program/1c-1s/api/list-params.ts` |
| 목록·상세 페이지 | `pages/programs/program-list-page.tsx` |
| 상세 모달 | `general/ui/detail-modal/program-detail-fullpage-modal.tsx` |
| 신청 sync | `general/hooks/use-general-program-applications-remote-sync.ts` |
| 진행 목록 | `general/hooks/use-progress-school-list.ts` · `use-progress-instructor-list.ts` |

---

## 4. 잔여 백로그 (Phase 7–10 · Cat1 복귀)

코어 DoD 충족 후 Cat2로 넘어간 뒤, 아래만 Cat1로 돌아와 처리한다.

| Phase | 체크 | 내용 |
|-------|------|------|
| **7** | [ ] | 학교 상세: application PATCH · instructor assign · students · attendance |
| **8** | [ ] | 강사 상세: institutionAssignment · lectureReports · settlement + `wagePolicies`/`paymentItems` 구조화 |
| **9** | [ ] | 설문 문항 answers (만족도 등) remote |
| **10** | [ ] | managers CRUD · Excel/export · polish |

**제외 유지:** 봉사자 전 LNB, 과제, 합반.

---

## 5. Phase DoD (코어 0–6)

| Phase | DoD |
|-------|-----|
| 0 | OpenAPI enum 반영됨 · 스테이징 BE round-trip 체크리스트 통과 |
| 1 | gate ON 시 list/detail/create/update/delete remote · OFF 시 mock |
| 2 | info PATCH · lifecycle · registration-economy draft · detail error UI |
| 3 | overview `periodStatus` · 대시보드 일정 위젯 company-school 필터 |
| 4–5 | 기관·강사 applications GET + approve/reject (surface gate) |
| 6 | ORGANIZATION/INSTRUCTOR participants · navigation (volunteer 제외) |
