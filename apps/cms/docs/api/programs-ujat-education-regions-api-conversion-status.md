# UJAT 교육 지역 — API 전환 완료율 · Phase 계획

**작성일**: 2026-07-16  
**갱신**: 2026-07-16 — Phase 3 Option A(create/delete FE) · Cat4 진입  
**대상**: CMS `/programs/ujat/regions`  
**범위**: `ujat` 교육 지역 master — 프로그램 CRUD(Cat2)와 **별도 gate**  
**로드맵**: [programs-api-conversion-roadmap.md](./programs-api-conversion-roadmap.md) — **Cat 3**  
**관련**: [programs-ujat-education-regions-api-backend-handoff.md](./programs-ujat-education-regions-api-backend-handoff.md)

---

## Cat3 코어 DoD (→ Cat 4 진입 조건)

| 항목 | 기준 |
|------|------|
| Phase 0–2 | 필드 매핑 · GET list remote · PATCH · PUT reorder · cache invalidate |
| Phase 3 | create/delete: **Option A** — FE POST/DELETE 호출 · UI 복원 (OpenAPI 스키마 미반영 시 BE 확인) |
| Phase 4 (최소) | 소비처가 remote snapshot `code`→`regionKey` 참조 |
| Gate | `ujatEducationRegions` + JWT (**로컬 `.env` ON**) |
| 롤백 | 모듈 키 제거 → localStorage |

---

## 0. Phase 스냅샷 (2026-07-16)

| Phase | 상태 | 요약 |
|-------|------|------|
| **0** 매핑 | **완료** | `code`↔`regionKey`, `nameKo`↔`name`, `displayOrder`↔`sortOrder`, `activeYn`↔`active` |
| **1** GET list | **FE 완료 · gate ON** | TanStack Query + adapter · OFF 시 localStorage |
| **2** PATCH · reorder | **FE 완료 · gate ON** | 인라인 수정 · DnD reorder + invalidate |
| **3** create/delete | **Option A FE** | client POST/DELETE · 등록/삭제 UI 복원 · OpenAPI에 스키마 없으면 런타임 실패 alert |
| **4** 소비처 | **부분** | `useUjatEducationRegions` / helpers가 remote snapshot 사용 · 페이지 미진입 시 snapshot 없으면 default/local |

**추정 완료율 ≈ 85%** (BE POST/DELETE 계약·스테이징 QA 잔여)

---

## 1. Remote 게이트

```env
VITE_REAL_API_MODULES=...,ujatEducationRegions
```

| Capability | 판별 |
|------------|------|
| list/patch/reorder/create/delete | `shouldUseUjatEducationRegionsRemoteApi()` |

---

## 2. 진입점 · 코드 앵커

| 역할 | 경로 |
|------|------|
| capabilities | `ujat/api/education-regions/capabilities.ts` |
| client/adapters/service/hooks | `ujat/api/education-regions/*` |
| 페이지 | `pages/programs/UJAT/education-regions-page.tsx` |
| 소비 hook | `ujat/hooks/use-ujat-education-regions.ts` |

---

## 3. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-16 | 초안 |
| 2026-07-16 | Phase 0–2 FE · Option B · env ON |
| 2026-07-16 | Phase 3 Option A FE · 등록/삭제 UI 복원 · Cat4 착수 |
