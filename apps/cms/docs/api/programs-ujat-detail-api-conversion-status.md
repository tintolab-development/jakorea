# UJAT 프로그램 상세 — API 전환 완료율 · Phase 계획

**작성일**: 2026-07-16  
**대상**: CMS `/programs/ujat` 목록·등록·풀페이지 상세  
**범위**: `features/program/ujat/**` — 일반·1사1교·Gemini 간섭 금지  
**로드맵**: [programs-api-conversion-roadmap.md](./programs-api-conversion-roadmap.md) — **Cat 2**  
**관련**: [programs-ujat-api-backend-handoff.md](./programs-ujat-api-backend-handoff.md) · 교육 지역은 **Cat 3** [programs-ujat-education-regions-api-conversion-status.md](./programs-ujat-education-regions-api-conversion-status.md)

---

## Cat2 코어 DoD (→ Cat 3 진입 조건)

Phase **0–2**(스테이징 round-trip · CRUD gate ON · 등록 POST) 충족 시 **Cat 3(교육 지역)** 로 넘어간다.  
Phase **3+**(navigation/info 고도화 · 신청·선발·진행·배정)는 **잔여 백로그**.

| 항목 | 기준 |
|------|------|
| Phase 0 | 스테이징 `UJAT` create → list → detail → PATCH → DELETE |
| Phase 1 | `VITE_REAL_API_MODULES`에 `programs,ujatPrograms` + JWT → list/detail/CRUD remote |
| Phase 2 | 등록 완료 POST 1회 + draft(`formsSurveys`) · detail 진입 |
| 회귀 | GENERAL / COMPANY_SCHOOL / Gemini 미영향 |
| 롤백 | `ujatPrograms` 제거 → mock/localStorage |

---

## 0. Phase 스냅샷 (2026-07-16 · gate ON)

| Phase | 상태 | 요약 |
|-------|------|------|
| **0** BE/OpenAPI | **FE schema 완료 · 스테이징 QA** | `UJAT` enum generated. create→list→detail→PATCH→DELETE 스모크 필요 |
| **1** 코어 CRUD | **FE 완료 · gate ON** | list(`businessYear`·size 500)·detail/create/update/delete · list/detail error UI |
| **2** 등록 플로우 | **FE 완료 · gate ON** | `useUjatProgramRegistrationFlow` → POST + `autoApplyDefaultFormBindings` (+ `formsSurveys`) |
| **3** navigation / info | **미착수·hybrid 예정** | info 저장은 CRUD PATCH 경로 있음 · navigation 전용 연동 미완 |
| **4** 기관 신청·일정 배정 | **mock** | 신청 목록·스케줄 확정 UI local |
| **5** 봉사자 H1/H2 선발 | **mock** | 서류/면접/최종 결과 mock |
| **6** 교육 진행(상·하반기) | **mock** | 출석·과제·지역·봉사자 진행 mock |
| **7** partner-assignments | **미연결** | OpenAPI 일부 존재 · FE client 없음 · `schedules[]` 미전송 |
| **8** 설문 · managers · polish | **mock** | |

**추정 코어(목록·CRUD) 준비도 ≈ 95% FE / 스테이징 QA** · **상세 LNB ≈ 0–10% remote**

### FE Phase 1 보완 (2026-07-16)

- [x] `appliedYear` → list `businessYear` · default size 500
- [x] remote ON 시 클라이언트 year 재필터 스킵
- [x] 목록 조회 실패 `showAlert`
- [x] 상세 `externalError` UI
- [ ] 스테이징 CRUD round-trip QA (→ Cat3 진입)

---

## 1. Remote 게이트

```env
VITE_API_SERVER=https://<backend-host>/
VITE_REAL_API_MODULES=adminAuth,formsSurveys,programs,ujatPrograms
```

| Capability | 판별 |
|------------|------|
| CRUD | `shouldUseRemoteApi()` — JWT + `programs` + `ujatPrograms` (**현재 로컬 `.env`에 ON**) |
| 등록 draft | + `formsSurveys` |
| 교육 지역 | **별도 Cat3** — `ujatPrograms` ON이어도 regions는 자동 서버화되지 않음 |

롤백: `ujatPrograms` 제거.

---

## 2. 진입점 · LNB 맵

| 항목 | 경로 |
|------|------|
| URL | `/programs/ujat?programId=…&lnb=…&tab=…` · `?new` · `?ujatStep` |
| 목록·등록 | `pages/programs/UJAT/page.tsx` |
| 상세 셸 | `ujat/ui/detail-modal/ujat-program-detail-fullpage-modal.tsx` |
| LNB | `ujat/ui/detail-modal/ujat-program-detail-sidebar.tsx` |

| LNB | 라벨 | FE 상태 |
|-----|------|---------|
| `info` | 프로그램 정보 | hybrid 가능(CRUD) / 등록 overlay mock 잔여 |
| `institution_applications` | 학교(기관) 신청 | ✅ 목록·상세·TEMP_* 필터 remote · 임시배정 GET/PUT P0 |
| `volunteer_h1` / `volunteer_h2` | 봉사자 상·하반기 | ✅ `recruitHalf` 서버 필터 · 서류/면접 mutation remote |
| `education_progress` | 교육 진행(상·하반기 탭) | ⚠️ 기관/봉사 APPROVED+recruitHalf · ✅ 지역/출석 P1+P2(`semesterType`) · ❌ 과제/요약 |
| `survey` | 설문 관리 | ✅ surveys + form-bindings remote |
| managers(해당 시) | 담당자 | ✅ 공통 managers remote |

**P0/P1 handoff (2026-09-17):** [ujat-detail-remaining-api-gaps-backend-request-2026-09-17.md](./ujat-detail-remaining-api-gaps-backend-request-2026-09-17.md) · BE handoff `JABACK/docs/frontend/ujat-detail-remaining-api-gaps-frontend-handoff-2026-09-17.md`  
**P2:** [ujat-education-progress-p2-openapi-half-backend-request-2026-09-17.md](./ujat-education-progress-p2-openapi-half-backend-request-2026-09-17.md) · BE handoff `ujat-education-progress-p2-openapi-half-frontend-handoff-2026-09-17.md` · FE `semesterType` 연동 완료

---

## 3. LNB · 표면 매트릭스

| 표면 | OpenAPI / 경로 | FE | 비고 |
|------|----------------|-----|------|
| programs CRUD | `/api/admin/programs?programType=UJAT` | hybrid 코드 · gate OFF | handoff §3 |
| 등록 binding | create `autoApplyDefaultFormBindings` | FE 전송 | seeds·원자성 BE |
| 기관 신청 | 공통 applications + `recruitHalf`·`TEMP_*` | ✅ list/detail/mutations |
| 봉사자 선발 | applications + `recruitHalf` + 평가 mutations | ✅ |
| 임시 일정 배정 | `…/temporary-schedule` GET/PUT (`slots[].scheduleId`) | ✅ P0 |
| partner-assignments / allocation-matrix | `…/ujat/allocation-matrix?semesterType=` · auto/direct/unavailability | ✅ P1+P2 (수동 타입 · OpenAPI sync) |
| 출석 | `…/schedules/{id}/attendances` · bulk-upsert | ✅ P1+P2 |

---

## 4. OpenAPI 갭

| 갭 | 영향 | 조치 |
|----|------|------|
| 스테이징 DB/validation이 `UJAT` 미수용 가능 | gate 금지 | handoff §2 스테이징 체크 |
| UJAT template seeds / binding scope | 등록 후 신청 진입 실패 | BE seeds |
| execution path OpenAPI | ✅ P2 BE fill | CMS `openapi/backend.openapi.json` sync · dashboard orval subset 미포함으로 수동 타입 유지 |
| allocation-matrix half 필터 | ✅ P2 `semesterType` | FE `toUjatRecruitHalfApi` |
| 교육 지역 master | 신청 탭 key | **Cat 3** |

---

## 5. Phase DoD

| Phase | DoD |
|-------|-----|
| 0 | handoff §7 QA 체크리스트 통과 · OpenAPI enum은 repo에 이미 있음 |
| 1 | gate ON list/detail/CRUD · OFF mock · type 격리 |
| 2 | 등록 완료 1회 POST · detail cache · draft 실패 알림 |
| 3 | info/navigation hybrid (코어 DoD 후 잔여 가능) |
| 4+ | 신청·선발·진행·배정 — Cat2 백로그 |

---

## 6. 코드 앵커

| 역할 | 경로 |
|------|------|
| capabilities | `features/program/ujat/api/capabilities.ts` |
| service / adapters | `ujat/api/service.ts`, `adapters.ts`, `service-detail.ts` |
| queries | `ujat/api/queries.ts` |
| 등록 | `ujat/hooks/use-ujat-program-registration-flow.ts` |
| 공통 HTTP | `general/api/programs-api-client.ts` |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-09-17 | P2: allocation-matrix `semesterType` + OpenAPI sync · 지역/출석 half 분리 |
| 2026-09-17 | P1: 지역 allocation-matrix + 출석 attendances remote (수동 타입) |
| 2026-07-16 | 초안 — Cat2 Phase · 코어 DoD · LNB mock 매트릭스 |
