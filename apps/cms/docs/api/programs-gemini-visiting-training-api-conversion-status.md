# Gemini 찾아가는 연수 — API 전환 완료율 · Phase 계획

**작성일**: 2026-07-16  
**대상**: CMS `/programs/gemini/visiting-training` (`?tab=recruitment` | `approved`)  
**범위**: `features/program/gemini/**` (모집·승인) — 실적 관리는 **Cat 6**  
**로드맵**: [programs-api-conversion-roadmap.md](./programs-api-conversion-roadmap.md) — **Cat 5**  
**관련**: [programs-gemini-visiting-training-api-backend-handoff.md](./programs-gemini-visiting-training-api-backend-handoff.md)

---

## Cat5 코어 DoD (→ Cat 6 진입 조건)

| 항목 | 기준 |
|------|------|
| Phase 0 | `GEMINI` vs `GEMINI_TRAINING` 매핑 · 모집 CRUD/승인 mutation BE 계약 |
| Phase 1–3 | recruitment list/detail · 등록(POST/PATCH) · organization-applications + approve/reject |
| Phase 4–5 | approved list/detail · instructor applications 핵심 경로 |
| Phase 6 | managers · forms binding — **잔여 가능** |
| 롤백 | `geminiVisitingTraining` 제거 → mock |

---

## 0. Phase 스냅샷 (2026-07-16)

| Phase | 상태 | 요약 |
|-------|------|------|
| **0** BE 계약 | **부분** | enum 이중(`GEMINI`/`GEMINI_TRAINING`) 잔여 — FE는 `GEMINI_TRAINING` 잠정 |
| **1** 모집 목록 | **FE GET + mutation** | list GET · **POST create · bulk/single DELETE** hybrid (2026-07-30) |
| **2** 모집 상세 | **FE GET + PATCH** | detail GET · **정보 수정 PATCH** hybrid |
| **3** 기관 신청 | **FE GET + approve/reject** | GET · **단건/다건 승인·반려** hybrid |
| **4** 승인 목록 | **FE GET(갭)** | `GET …/approved` — DTO가 모집 item 재사용 · 컬럼 매핑 빈약 |
| **5** 강사 신청 | **mock UI** | OpenAPI list/approve/reject 있음 · UI remote wiring 잔여 |
| **6** managers · forms | **mock** | `ProgramManagersTab` 재사용 |

**추정 완료율 ≈ 모집 CRUD·기관 승인 FE 연동 · approved/강사 잔여 · gate 기본 OFF**

---

## 1. Remote 게이트

```env
VITE_API_SERVER=https://<backend-host>/
# GEMINI vs GEMINI_TRAINING BE 확정 · 스테이징 GET 스모크 후에만:
# VITE_REAL_API_MODULES=...,adminAuth,geminiVisitingTraining
```

- 모듈 키: `geminiVisitingTraining` (`shared/config/real-api-modules.ts`)
- JWT + 모듈 AND — `shouldUseGeminiVisitingTrainingRemoteApi()`
- **기본 OFF** — programType 매핑·mutation 계약 전 gate ON 금지

---

## 2. 진입점 · 탭 · LNB

| 항목 | 경로 |
|------|------|
| URL | `/programs/gemini/visiting-training?tab=recruitment\|approved` |
| 페이지 | `pages/programs/gemini/visiting-training/page.tsx` |
| Remote API | `gemini/api/visiting-training/*` |
| 모집 mock | `gemini/api/recruitment-service.ts` |
| 승인 mock | `gemini/api/approved-training-service.ts` |

**모집 (`recruitment`)** LNB: `info` · `institutions` · `managers`  
**승인 (`approved`)** LNB: `info` · `instructors` · `managers`

---

## 3. 매트릭스

| 표면 | OpenAPI (현재) | FE |
|------|----------------|-----|
| 모집 목록 | `GET /api/admin/gemini/trainings/recruitments` | remote Query + loading/error |
| 모집 상세 | `GET …/recruitments/{programId}` | remote Query |
| 기관 신청 | `GET …/organization-applications` | remote Query |
| 승인 목록 | `GET …/approved` | remote Query (스키마 갭) |
| 모집 POST/PATCH/DELETE | **없음** | mock · remote ON 시 안내 |
| 승인/반려 mutation | **없음** | mock · remote ON 시 안내 |
| 강사 신청 | **전용 경로 확인 필요** | mock |

폼 시드: `application-gemini-visiting-training-instructor` · `application-gemini-visiting-training-school`

---

## 4. OpenAPI 갭

| 갭 | 영향 |
|----|------|
| `GEMINI` vs `GEMINI_TRAINING` | create/list filter 오매핑 |
| 모집 create/update/delete | 등록·수정·삭제 불가 |
| approve/reject | 기관·강사 결재 |
| approved list 스키마 | FE `GeminiApprovedTrainingRow`와 필드 불일치 |
| 강사 신청 list path | 승인 상세 LNB |

---

## 5. Phase DoD

| Phase | DoD | 현재 |
|-------|-----|------|
| 0 | handoff 매핑·mutation 계약 확정 | 미확정 |
| 1 | recruitment list GET + gate | **FE 완료** (gate OFF) |
| 2 | detail GET · 등록 POST/PATCH (계약 후) | detail GET **FE** · POST/PATCH 갭 |
| 3 | org applications GET + approve/reject | GET **FE** · mutation 갭 |
| 4 | approved list/detail GET | list GET **FE(갭)** · detail mock |
| 5 | instructor applications | mock |
| 6 | managers · forms (잔여 가능) | mock |

---

## 6. 코드 앵커

| 역할 | 경로 |
|------|------|
| capabilities / gate | `gemini/api/visiting-training/capabilities.ts` |
| client · adapters · service · hooks | `gemini/api/visiting-training/*` |
| 모집 UI | `gemini/ui/recruitment/*`, `gemini/ui/detail/fullpage-modal.tsx` |
| 승인 UI | `gemini/ui/approved/*` |
| model | `gemini/model/recruitment/*`, `gemini/model/approved/*` |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-16 | 초안 — Cat5 |
| 2026-07-16 | Phase 1–4 GET FE: gate·adapters·list/detail/org-apps/approved Query · mutation UX 가드 |
| 2026-07-16 | 조기 핸드오프 → Cat6 · mutation/enum/강사신청 잔여 백로그 |
