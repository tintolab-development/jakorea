# Gemini 실적 관리 API — 백엔드 핸드오프

CMS `/programs/gemini/performance` FE 전환용 BE 계약입니다.

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-07-16 |
| 로드맵 | [programs-api-conversion-roadmap.md](./programs-api-conversion-roadmap.md) — **Cat 6** |
| FE SSOT | [programs-gemini-performance-api-conversion-status.md](./programs-gemini-performance-api-conversion-status.md) |
| 현재 | FE **list+import** · gate **OFF** · 목록 SSOT 가설=`training-reports` · delete 갭 |

---

## 1. OpenAPI 경로

| Method | Path | 용도 |
|--------|------|------|
| `GET` | `/api/admin/gemini/trainings/training-reports` | 연수 보고/실적 목록 후보 |
| `GET` | `/api/admin/gemini/trainings/performance-records` | 실적 레코드 목록 후보 |
| `POST` | `…/training-reports/import/preview` | Excel 미리보기 |
| `POST` | `…/training-reports/import` | Excel 반영 (`duplicateStrategy`) |

스키마: `GeminiTrainingReportItem`, `GeminiTrainingReportImportRequest` / `Response` (generated).

---

## 2. P0 — 목록 endpoint SSOT

FE 화면은 **단일 목록**입니다. 아래 중 하나를 화면 SSOT로 지정해 주세요.

| 옵션 | Path | FE 현재 |
|------|------|---------|
| A | `GET …/training-reports` | **가설 채택** (import와 path 일치) |
| B | `GET …/performance-records` | 미연결 |
| C | A를 목록, B를 보조(정산 등) — 역할을 문서화 | 미연결 |

필터(강사명·연수방식·장소·기간) query 파라미터와 응답 필드 매핑표가 필요합니다.  
확정 전 FE는 A로 연결해 두었고, BE가 B/C를 지정하면 adapter/path만 교체합니다.

---

## 3. P0 — 삭제 갭

FE는 행 **bulk delete**를 지원합니다. OpenAPI에 DELETE가 없습니다.

선택지:

**A.** `DELETE …/training-reports/{id}` (또는 bulk) 추가  
**B.** 삭제 미지원 → FE에서 삭제 UI 제거 · 정정은 import overwrite만  

→ **FE 채택 (remote ON):** 선택 삭제 버튼·행 체크박스 숨김. mock 모드는 삭제 유지. BE가 DELETE를 추가하면 Option A로 전환 가능.
---

## 4. import 계약

- `duplicateStrategy`: FE mock은 overwrite | append — BE enum·동작 확인
- preview 응답으로 중복 건수·충돌 행 표시
- 실패 시 부분 반영 금지(트랜잭션) 권장
- 개인정보·감사로그 (Excel 원문)

---

## 5. FE gate 제안

```env
VITE_REAL_API_MODULES=...,geminiPerformance
```

찾아가는 연수(`geminiVisitingTraining`)와 독립.

---

## 6. BE 체크리스트

- [ ] list endpoint SSOT 확정
- [ ] GET list 필터·페이지 메타
- [ ] import preview + import 스테이징 스모크
- [ ] duplicateStrategy 동작
- [x] delete API 추가 또는 미지원 확정 — **FE Option B** (BE DELETE 추가는 선택)
- [ ] (선택) Excel export
- [ ] 권한·감사로그

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-16 | 초안 |
| 2026-07-16 | FE Phase 0–2 · list SSOT 가설 A · delete remote 가드 |
| 2026-07-16 | FE Phase 3 Option B 채택 · 코어 DoD |
