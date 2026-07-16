# 교육받은 교사 프로그램 — API 전환 완료율 · Phase 계획

**작성일**: 2026-07-16  
**갱신**: 2026-07-16 — Phase 4 진행 기관 + education-journals  
**대상**: CMS `/programs/trained-teachers`  
**범위**: `features/program/trained-teachers/**` + `general` 모달의 trained-teachers 분기 — 일반 기본값 변경 금지  
**로드맵**: [programs-api-conversion-roadmap.md](./programs-api-conversion-roadmap.md) — **Cat 4**  
**관련**: [programs-trained-teachers-api-backend-handoff.md](./programs-trained-teachers-api-backend-handoff.md)

---

## Cat4 코어 DoD (→ Cat 5 진입 조건)

| 항목 | 기준 |
|------|------|
| Phase 0–1 | `TRAINED_TEACHER` 스테이징 round-trip · programs CRUD + opt-in |
| Phase 2–4 | info/`trained-teacher/detail` · organization-applications · 진행 기관 + education-journals 핵심 경로 remote |
| Phase 5 | survey · performance-summary · managers는 **잔여 가능** (코어 DoD에 필수 아님) |
| 회귀 | general / company-school 모달 기본 동작 유지 |
| 롤백 | opt-in / `trainedTeacherPrograms` 제거 → mock |

---

## 0. Phase 스냅샷 (2026-07-16)

| Phase | 상태 | 요약 |
|-------|------|------|
| **0** BE/OpenAPI | **schema 있음 · FE 연결** | `TRAINED_TEACHER` enum + opt-in gate |
| **1** 코어 CRUD | **FE 완료 · gate ON** | `trained-teachers/api/*` · list/detail/create/update/delete |
| **2** info LNB | **FE 완료 · gate ON** | GET/PATCH `…/trained-teacher/detail` · configJson + 공통정보 저장 |
| **3** 기관 신청 | **FE 완료 · gate ON** | GET `…/trained-teacher/organization-applications` · 승인/반려는 공통 approve/reject 재사용 |
| **4** 진행·교육일지 | **FE 완료 · gate ON** | 승인 기관 → 진행 목록 · journals list/download/bulk-download |
| **5** 설문·실적·담당자 | **부분 FE** | performance-summary GET + 진행 탭 strip · surveys HTTP gate에 TT 포함 · managers BE 갭 |

**추정 완료율 ≈ 85% remote** (CRUD + info + 기관 + 진행/일지 + 실적요약) · managers·설문 answers 잔여

---

## 1. Remote 게이트

```env
VITE_API_SERVER=https://<backend-host>/
VITE_REAL_API_MODULES=adminAuth,formsSurveys,programs
VITE_TRAINED_TEACHER_PROGRAMS_REMOTE_ENABLED=true
# 또는: VITE_REAL_API_MODULES=...,programs,trainedTeacherPrograms
```

등록 draft까지: + `formsSurveys`.

| Capability | 판별 |
|------------|------|
| list/detail/CRUD | `shouldUseTrainedTeacherProgramsRemoteApi()` |
| info detail GET/PATCH | 동일 gate |
| 기관 신청 list | 동일 gate · 전용 URL (일반 applications list 미사용) |
| 기관 신청 승인/반려 | 동일 gate · 공통 `POST …/organization-applications/{id}/approve\|reject` |
| 진행 기관 목록 | 동일 gate · 승인된 org-applications 매핑 (일반 participants API 미사용) |
| 교육일지 | 동일 gate · `…/trained-teacher/education-journals` |

---

## 2. 진입점 · LNB

| 항목 | 경로 |
|------|------|
| URL | `/programs/trained-teachers?programId=&lnb=&tab=` · `?new=1` |
| 목록 | `pages/programs/trained-teachers/page.tsx` · `trained-teachers/hooks/use-list-filters.ts` |
| 상세 | `general/.../program-detail-fullpage-modal.tsx` (`programVariant="trained-teachers"`) |
| 식별 | remote id snapshot · `trained-teachers-prog-*` / mock membership |

| LNB | 라벨 | 비고 |
|-----|------|------|
| `info` | 프로그램 정보 | 공통 / 모집 / 신청 (`TrainedTeachers*`) |
| `applicants` | 기관 신청 | |
| `progress` | 진행 현황 | **참여 기관만** (강사/봉사 없음) |
| `survey` | 설문 | 조건부 |
| `managers` | 담당자 | mock |
| 기관 중첩 | application · journal | 교육일지 |

---

## 3. 매트릭스

| 표면 | OpenAPI | FE |
|------|---------|-----|
| programs CRUD | `/api/admin/programs?programType=TRAINED_TEACHER` | **remote (opt-in)** |
| detail 전용 | `GET/PATCH …/trained-teacher/detail` | **remote (opt-in)** · `configJson`에 commonInfo |
| 기관 신청 | `GET …/trained-teacher/organization-applications` (+ `/{id}`) | **remote (opt-in)** |
| 승인/반려 | 공통 `…/organization-applications/{id}/approve\|reject` | **remote** · TT 전용 mutation OpenAPI 없음 |
| 교육일지 | `GET/POST …/education-journals` (+ download/export) | **remote** list/download/bulk · POST create FE 준비(서비스) |
| 실적 요약 | `GET …/performance-summary` | mock |

---

## 4. OpenAPI 갭

- 공통 applications vs `trained-teacher/organization-applications` — **목록은 TT 전용 GET**, 승인/반려는 공통 mutation 재사용(BE 동일 applicationId 전제)
- managers CRUD — 일반과 동일 갭
- 등록 템플릿: `registration-trained-teachers` / `application-trained-teachers` seeds
- TT 전용 approve/reject OpenAPI 추가 시 FE 전용 client로 이전 가능

---

## 5. Phase DoD

| Phase | DoD | 현재 |
|-------|-----|------|
| 0 | 스테이징 `TRAINED_TEACHER` filter/create round-trip · opt-in 키 확정 | FE |
| 1 | service/capabilities/adapters · list/detail/create/update/delete | FE |
| 2 | info 저장 · trained-teacher/detail PATCH | FE |
| 3 | organization-applications GET + 승인/반려(계약된 mutation) | FE |
| 4 | progress 기관 목록 · journals list/upload/download | FE |
| 5 | survey · performance-summary · managers (잔여 가능) | performance-summary **FE** · surveys HTTP TT 포함 · managers BE 갭 |

---

## 6. 코드 앵커

| 역할 | 경로 |
|------|------|
| capabilities | `trained-teachers/api/capabilities.ts` |
| adapters/service/hooks | `trained-teachers/api/*` |
| info detail | `trained-teachers/api/info-detail-*.ts` |
| org applications | `trained-teachers/api/organization-applications-*.ts` |
| education journals | `trained-teachers/api/education-journals-*.ts` |
| performance summary | `trained-teachers/api/performance-summary-*.ts` |
| summary UI | `trained-teachers/ui/progress/performance-summary-strip.tsx` |
| list filters | `trained-teachers/hooks/use-list-filters.ts` |
| detail 분기 | `trained-teachers/lib/is-trained-teachers-detail-program.ts` |
| UI | `trained-teachers/ui/common-info/*`, `application-info/*`, `institution-detail/*` |
| mock | `data/mock/trained-teachers-programs.ts` |
| 모달 | `general/ui/detail-modal/program-detail-fullpage-modal.tsx` |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-16 | 초안 — Cat4 |
| 2026-07-16 | Phase 0–1 FE · opt-in ON · 등록 경로 GENERAL 오인 수정 |
| 2026-07-16 | Phase 2 info detail GET/PATCH · CommonInfoView onPersist |
| 2026-07-16 | Phase 3 org applications GET · 공통 approve/reject · surface isolation |
| 2026-07-16 | Phase 4 진행 기관(승인 신청 매핑) · journals list/download/bulk |
| 2026-07-16 | Phase 5: performance-summary GET+strip · surveys HTTP에 TT · progress programId 전달 |