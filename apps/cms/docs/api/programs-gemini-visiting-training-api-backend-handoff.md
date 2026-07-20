# Gemini 찾아가는 연수 API — 백엔드 핸드오프

CMS `/programs/gemini/visiting-training` FE 전환용 BE 계약입니다.

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-07-16 |
| 로드맵 | [programs-api-conversion-roadmap.md](./programs-api-conversion-roadmap.md) — **Cat 5** |
| FE SSOT | [programs-gemini-visiting-training-api-conversion-status.md](./programs-gemini-visiting-training-api-conversion-status.md) |
| 현재 | FE **GET 골격** · gate **OFF** · OpenAPI mutation 갭 · `GEMINI`/`GEMINI_TRAINING` 미확정 |

---

## 1. programType 매핑 (P0 확정 요청)

OpenAPI enum에 `GEMINI`와 `GEMINI_TRAINING`이 **둘 다** 있습니다.  
찾아가는 연수 화면이 어느 값을 create/list에 써야 하는지 **단일 SSOT**를 요청합니다.

| 후보 | 사용 가설 |
|------|-----------|
| `GEMINI_TRAINING` | 찾아가는 연수 프로그램 row |
| `GEMINI` | 상위/실적 계열 또는 레거시 |

확정 전 FE는 gate를 켜지 않습니다. capabilities는 잠정 `GEMINI_TRAINING`을 둡니다.

---

## 2. 현재 OpenAPI (GET)

| Method | Path | 화면 |
|--------|------|------|
| `GET` | `/api/admin/gemini/trainings/recruitments` | 모집 목록 |
| `GET` | `…/recruitments/{programId}` | 모집 상세 |
| `GET` | `…/recruitments/{programId}/organization-applications` | 기관 신청 |
| `GET` | `/api/admin/gemini/trainings/approved` | 승인 연수 목록 |

---

## 3. P0 — mutation 갭

FE가 mock으로 하는 동작과 OpenAPI 부재:

| FE 동작 | 필요 API |
|---------|----------|
| 모집 공고 등록 | `POST …/recruitments` (또는 programs POST + type) |
| 모집 정보 수정 | `PATCH …/recruitments/{id}` |
| 모집 삭제 | `DELETE` |
| 기관 승인/반려 | `POST/PATCH …/organization-applications/{id}/…` |
| 승인 연수 생성(모집→승인) | 전이 API 또는 상태 PATCH |
| 강사 신청 목록·승인 | list + approve/reject |

응답 필드(기간·상태·장소·진행 집계)는 모집/승인 목록 테이블 컬럼과 맞춰 주세요.

---

## 4. 폼 · binding

- `application-gemini-visiting-training-instructor`
- `application-gemini-visiting-training-school`

create 시 `autoApplyDefaultFormBindings` 또는 동등 binding 범위 문서화.

---

## 5. FE gate 제안

```env
VITE_REAL_API_MODULES=...,geminiVisitingTraining
```

실적(Cat6)과 **분리**. `geminiPerformance`와 독립.

---

## 6. BE 체크리스트

- [ ] `GEMINI` vs `GEMINI_TRAINING` 단일 매핑 확정
- [ ] 모집 list/detail GET 스테이징 스모크
- [ ] 모집 create/update/delete OpenAPI 추가 또는 programs CRUD로 대체 명시
- [ ] organization-applications approve/reject
- [ ] approved list/detail · 강사 신청 경로
- [ ] 상태 enum ↔ FE 배지(`resolveRecruitmentStatus` 등) 매핑표
- [ ] 권한·감사로그

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-16 | 초안 |
