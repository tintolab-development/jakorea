# BE 수정 요청 — ProgramUpdateRequest OpenAPI 전체 스키마 복구 + KPI additive 유지

**작성일:** 2026-09-17  
**상태:** ✅ BE OpenAPI full+additive 복구 · FE openapi sync · orval validation 통과  
**우선순위:** P1 (codegen SoT)  
**관련 FE 프롬프트:** `JABACK/docs/frontend/trained-teacher-kpi-venue-openapi-fe-adapter-prompt-2026-09-17.md`  
**선행:** [trained-teacher-common-recruit-edit-roundtrip-backend-request-2026-09-17.md](./trained-teacher-common-recruit-edit-roundtrip-backend-request-2026-09-17.md)

---

## 한줄 요약

런타임 KPI·venue 미러는 OK.  
BE가 `ProgramUpdateRequest` / `ProgramResponse` 를 **full + KPI/venue additive** 로 복구했고, dangling `InterviewAvailabilitySlot`·path param 도 보강했다.  
FE는 `openapi/backend.openapi.json` 재동기화 + `filter:openapi:dashboard|logs` + **orval validation 성공**을 확인했다.

---

## FE 수용 (2026-09-18)

| 항목 | 상태 |
|------|------|
| BE SoT `ProgramUpdateRequest` (~82 props, `sponsorId`+`finalSchools`) | ✅ |
| BE SoT `ProgramResponse` (~80 props, `startDate`+`finalSchools`) | ✅ |
| `InterviewAvailabilitySlot` + path param → orval validation | ✅ |
| CMS `openapi/backend.openapi.json` sync + dashboard/logs filter | ✅ |
| codegen 타입에 KPI/venue top-level (`finalSchools`/`venueKind`/…) | ✅ (stable nested types 유지) |
| TT adapters typed wire (`as` cast 없음) | ✅ |
| 전체 dashboard/logs orval 산출물 교체 | ⏳ deferred — raw orval이 nested round/schedule를 `{[key:string]:unknown}` 로 붕괴·nullability 확대해 어댑터 대량 깨짐. OpenAPI SoT는 sync 완료; Program* additive는 BE 스키마를 stable nested 타입 위에 미러 |

### 검증 Case

- [ ] `186005` KPI 3필드 + 교육장소 저장→재조회 (수동 QA)
- [x] orval `--project dashboard` validation 성공
- [x] `ProgramUpdateRequest`에 `sponsorId` **및** `finalSchools`
- [x] `ProgramResponse`에 `startDate` **및** `finalSchools`

---

## 백엔드 전달용 프롬프트 (복사용) — 완료됨, 재요청 불필요

````markdown
## 요청 요약

FE가 `JABACK/openapi/backend.openapi.json` 기준으로 orval 재생성했더니
`ProgramUpdateRequest` properties 가 12개(KPI/venue additive만)로 줄어
기존 CMS PATCH wire(title, sponsorId, educationStructure, …) 타입이 깨집니다.

런타임 Jackson/@JsonAlias 동작은 유지하되, **OpenAPI 스키마를 full + additive** 로 복구해 주세요.

### 현재 문제

`components.schemas.ProgramUpdateRequest.properties` (현 BE OpenAPI):

- totalParticipants, finalParticipants
- finalSchools, schoolCount
- finalClasses, classCount
- venue, venueKind, venueDetail, institutionType
- educatedTeachers, serviceDetailJson

→ 기존 UpdateRequest 필드(sponsorId, title, startDate, …) 누락.

`ProgramResponse` 도 기존 full echo 대비 축소(sponsorId/startDate/businessArea 등 없음).

부가로 OpenAPI validation 이슈(orval 차단):

1. `$ref: #/components/schemas/InterviewAvailabilitySlot` — 스키마 정의 없음
   (IndividualInterviewAvailabilitySlot 만 존재)
2. 일부 path template `{id}` 에 path parameter 선언 누락
   (예: `/api/admin/instructor-applications/{applicationId}`)

### 요청

1. `ProgramUpdateRequest` = **기존 full PATCH 필드 전부** + 위 KPI/venue additive 유지
2. `ProgramResponse` = **기존 full GET 필드** + root KPI/venue echo
   (`finalSchools`, `finalClasses`, `venueKind`, `venueDetail`, `remarks`, …)
3. dangling `InterviewAvailabilitySlot` 스키마 추가 또는 $ref 수정
4. path parameter 선언 보강 (orval validation 통과)

### 검증

- FE `pnpm filter:openapi:dashboard && orval --project dashboard` 성공
- 생성 `ProgramUpdateRequest` 에 `sponsorId` **및** `finalSchools` 동시 존재
- 생성 `ProgramResponse` 에 `startDate` **및** `finalSchools` 동시 존재
````

---

## FE 후속

- OpenAPI sync 유지 (`apps/cms/openapi/backend.openapi.json` ← JABACK)
- 전체 orval 산출물 교체는 nested schema/`null` 어댑터 마이그레이션 PR로 분리
- `186005` round-trip 수동 확인
