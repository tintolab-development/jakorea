# Gemini 실적 관리 — API 전환 완료율 · Phase 계획

**작성일**: 2026-07-16  
**대상**: CMS `/programs/gemini/performance`  
**범위**: `features/program/gemini` 실적 목록·Excel import — 찾아가는 연수는 **Cat 5**  
**로드맵**: [programs-api-conversion-roadmap.md](./programs-api-conversion-roadmap.md) — **Cat 6**  
**관련**: [programs-gemini-performance-api-backend-handoff.md](./programs-gemini-performance-api-backend-handoff.md)

---

## Cat6 코어 DoD (로드맵 완료)

| 항목 | 기준 | 상태 |
|------|------|------|
| Phase 0–2 | list endpoint SSOT · GET list · import preview + import POST | **FE** |
| Phase 3 | delete: BE 추가 **또는** FE bulk delete 제거/가드 | **Option B** (remote 시 삭제 UX 숨김) |
| Phase 4 | Excel export · polish | **잔여** (클라이언트 export 유지) |
| 롤백 | `geminiPerformance` 제거 → localStorage | 가능 |

---

## 0. Phase 스냅샷 (2026-07-16)

| Phase | 상태 | 요약 |
|-------|------|------|
| **0** endpoint SSOT | **FE 가설 A** | 목록 = `GET …/training-reports` · BE 확정 대기 |
| **1** 목록 GET | **FE** | remote Query + loading/error · DTO 갭 기본값 |
| **2** import | **FE** | Excel → preview/import POST · duplicate 모달 |
| **3** 삭제 | **Option B** | remote ON: 선택삭제·체크박스 숨김 · mock만 삭제 유지 · 정정은 import overwrite |
| **4** export · polish | **잔여** | 클라이언트 Excel export (`Gemini 실적`) |

**코어 DoD ≈ 충족 (gate OFF · 스테이징 스모크·BE SSOT 확정은 잔여)**

---

## 1. Remote 게이트

```env
VITE_API_SERVER=https://<backend-host>/
# 스테이징 list+import 스모크 후:
# VITE_REAL_API_MODULES=...,adminAuth,geminiPerformance
```

- 모듈 키: `geminiPerformance`
- JWT + 모듈 AND — `shouldUseGeminiPerformanceRemoteApi()`
- **기본 OFF**

---

## 2. 진입점

| 항목 | 경로 |
|------|------|
| URL | `/programs/gemini/performance` |
| 페이지 | `pages/programs/gemini/performance/page.tsx` |
| mock service | `gemini/api/performance-service.ts` |
| remote | `gemini/api/performance-remote/*` |
| UI | `gemini/ui/performance/list.tsx` |

---

## 3. 매트릭스

| 표면 | OpenAPI | FE |
|------|---------|-----|
| 목록 | `GET …/training-reports` | remote Query |
| 보조 목록 | `GET …/performance-records` | 미연결 (잔여) |
| import preview | `POST …/import/preview` | remote |
| import | `POST …/import` | remote |
| 삭제 | **없음** | Option B — remote 숨김 |
| export | 확인 필요 | 클라이언트 export |

---

## 4. OpenAPI / 잔여 백로그

- BE list SSOT 확정 (`training-reports` vs `performance-records`)
- list DTO 컬럼 보강 (장소·세부시간·보조강사·연수방식 등)
- DELETE API 추가 시 Option A로 전환 가능
- `duplicateStrategy` 스테이징 확인
- 서버 필터 query 보강
- gate ON 후 스테이징 round-trip

---

## 5. Phase DoD

| Phase | DoD | 현재 |
|-------|-----|------|
| 0 | list endpoint 확정 | FE 가설 A |
| 1 | list GET + gate | **FE** |
| 2 | preview + import | **FE** |
| 3 | delete API 또는 FE 축소 | **Option B** |
| 4 | export · polish | **잔여** |

---

## 6. 코드 앵커

| 역할 | 경로 |
|------|------|
| capabilities | `gemini/api/performance-remote/capabilities.ts` |
| remote stack | `gemini/api/performance-remote/*` |
| facade | `gemini/api/performance-service.ts` |
| hooks | `gemini/hooks/use-gemini-performance-rows.ts` |
| UI | `gemini/ui/performance/list.tsx` |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-16 | 초안 — Cat6 |
| 2026-07-16 | Phase 0–2 FE: training-reports list · preview/import · delete 가드 |
| 2026-07-16 | Phase 3 Option B · 코어 DoD FE 충족 · Phase 4·BE 확정 잔여 |
