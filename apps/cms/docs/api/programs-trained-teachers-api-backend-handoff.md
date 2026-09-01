# 교육받은 교사 프로그램 API — 백엔드 핸드오프

CMS `/programs/trained-teachers` FE 전환용 BE 계약입니다.

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-07-16 |
| `programType` | `TRAINED_TEACHER` |
| 로드맵 | [programs-api-conversion-roadmap.md](./programs-api-conversion-roadmap.md) — **Cat 4** |
| FE SSOT | [programs-trained-teachers-api-conversion-status.md](./programs-trained-teachers-api-conversion-status.md) |
| 현재 | FE **Phase 0–4 코어** · Phase 5(survey/performance-summary/managers) 잔여 · opt-in ON |

---

## 1. 코어 programs CRUD

| Method | Path | FE 기대 |
|--------|------|---------|
| `GET` | `/api/admin/programs?programType=TRAINED_TEACHER` | 목록 전용 필터 · 타 유형 혼입 없음 |
| `GET` | `/api/admin/programs/{id}` | detail + `serviceDetailJson` |
| `POST` | `/api/admin/programs` | `programType=TRAINED_TEACHER`, `autoApplyDefaultFormBindings` |
| `PATCH` / `DELETE` | 동일 | type 보존 · 2xx |

템플릿: `registration-trained-teachers`, `application-trained-teachers` (forms-surveys seeds).

---

## 2. 전용 경로 (OpenAPI)

| Method | Path | 화면 |
|--------|------|------|
| `GET` / `PATCH` | `/api/admin/programs/{programId}/trained-teacher/detail` | info / 공통·모집 설정 |
| `GET` | `…/trained-teacher/organization-applications` (+ `/{applicationId}`) | 기관 신청 |
| `GET` / `POST` | `…/trained-teacher/education-journals` | 교육일지 |
| `POST` | `…/education-journals/bulk-download` (+ `/jobs`) | 일괄 다운로드 |
| `GET` | `…/trained-teacher/performance-summary` | 실적 요약 |

---

## 3. P0 수락 조건

- [ ] 스테이징 create → list(`TRAINED_TEACHER`) → detail round-trip
- [ ] PATCH 시 `programType` 보존 · GENERAL로 치환 금지
- [ ] default form binding이 교육받은 교사 template set 선택
- [ ] organization-applications 응답 필드가 FE 테이블 컬럼과 매핑 가능
- [ ] 승인/반려 — **공통** `POST …/organization-applications/{id}/approve|reject`가 TT applicationId에 동작하는지 확인 (전용 mutation OpenAPI 없음)
- [ ] education-journals 업로드·다운로드·권한·감사로그
- [ ] FE가 공통 approve를 쓰는 동안 type 혼입·권한 스코프 검증

---

## 4. FE gate 제안

```env
VITE_REAL_API_MODULES=adminAuth,formsSurveys,programs,trainedTeacherPrograms
```

또는 1사1교와 동일 패턴의 `VITE_TRAINED_TEACHER_PROGRAMS_REMOTE_ENABLED=true` + `programs`.

일반 `programs` 모듈만으로 trained-teachers가 켜지면 **안 됨** (목록 혼선·조기 활성화 방지).

---

## 5. 비범위

- 강사/봉사자 진행 LNB (제품상 없음)
- Gemini / UJAT / 1사1교
- managers CRUD (공통 갭 — 일반과 동일)

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-16 | 초안 |
