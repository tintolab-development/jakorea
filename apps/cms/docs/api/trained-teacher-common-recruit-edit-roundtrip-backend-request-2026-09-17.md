# BE 수정 요청 — 교육받은 교사 공통·모집 정보 수정 라운드트립 + 저장 시 API 폭주

**작성일:** 2026-09-17  
**상태:** ✅ BE 런타임 미러 반영 · FE KPI/venue top-level wire 정렬 · [OpenAPI additive 후속](./trained-teacher-kpi-venue-mirror-openapi-backend-request-2026-09-17.md)  
**우선순위:** P0 (필드 저장 후 재조회 원복) · P1 (저장 시 목록/집계 N+1 완화)  
**대상 화면:** CMS `/programs/trained-teachers?programId=…` 풀페이지 상세  
- LNB **공통 정보** · **모집 정보**  
**검증 Case:** `186005`(예정) — 공통정보 수정 가능  
**비대상 Case:** `186001`(완료) — `PROGRAM_COMMON_INFO_EDIT_PERIOD_ENDED` 정상  
**범위:** `TRAINED_TEACHER` only (일반·UJAT·Gemini 기본 동작 변경 금지)  
**FE gate:** JWT + `VITE_REAL_API_MODULES`에 `programs` (+ trained-teacher surface)  
**관련 문서:**
- BE handoff: `JABACK/docs/frontend/trained-teacher-common-info-roundtrip-frontend-handoff-2026-09-17.md`
- FE adapter prompt: `JABACK/docs/frontend/trained-teacher-common-recruit-edit-roundtrip-fe-adapter-prompt-2026-09-17.md`
- [trained-teacher-kpi-venue-mirror-openapi-backend-request-2026-09-17.md](./trained-teacher-kpi-venue-mirror-openapi-backend-request-2026-09-17.md)
- [programs-trained-teachers-api-backend-handoff.md](./programs-trained-teachers-api-backend-handoff.md)
- [programs-trained-teachers-api-conversion-status.md](./programs-trained-teachers-api-conversion-status.md)
- [trained-teachers-detail-unconfirmed-api-backend-request-2026-09-16.md](./trained-teachers-detail-unconfirmed-api-backend-request-2026-09-16.md)

---

## 한줄 요약

CMS에서 공통·모집 정보를 수정해도 **일부 필드가 저장 후 재조회에서 되돌아가거나**, BE 마스터와 다른 값으로 `PROGRAM_BUSINESS_AREA_NOT_FOUND`가 납니다.  
같은 저장에서 FE가 **programs PATCH + trained-teacher/detail PATCH**를 연속 호출하고, 각각 목록·상단 4카드(periodStatus×4+전체)를 invalidate 해 **한 번에 ~10 GET**이 나갑니다.  
아래 계약을 맞춰 주시면 FE는 이미 보낸 wire를 유지한 채 재검증합니다.

---

## FE가 이미 보정한 것 (참고 · 깨지지 않게 유지)

| 항목 | FE 조치 |
|------|---------|
| 사업 분야 옵션 | `경제`/`진로`/`기타` 제거 → BE 마스터명 `경제금융`/`진로취업`/`기업가정신`/`디지털리터러시` |
| 공고용·세부 프로그램명 | 폼 `announcementTitle`/`detailedProgramName` → PATCH `title`/`textbookName` (+ nested mirror) |
| 교육 장소 | `venueKind`/`venueDetail` → `institutionType` + top-level `venue` + nested |
| 후원사 담당자 | `sponsors: [{ sponsorId, sponsorContactId }]` + `managerName`/`contactPhone` |
| 모집 저장 Zod | 공통정보 전체 스키마 대신 모집 partial schema (조용한 저장 실패 방지) |
| 저장 캐시 중복 | `trained-teacher/detail` mutation은 목록·overview invalidate **생략** (programs PATCH 쪽만) |

---

## 백엔드 전달용 프롬프트 (복사용)

아래를 BE 이슈/PR 본문에 그대로 붙여 주세요.

````markdown
## 요청 요약

CMS 교육받은 교사 상세(`/programs/trained-teachers?programId=186005`)에서 **공통 정보·모집 정보**를 수정·저장한 뒤 재조회하면 일부 필드가 원복되거나, 사업 분야가 `PROGRAM_BUSINESS_AREA_NOT_FOUND`로 거절됩니다.

선행 handoff(`trained-teacher-common-info-roundtrip-frontend-handoff-2026-09-17.md`)의 alias·nested 미러는 반영된 것으로 보이지만, **실화면 라운드트립·값 공간·집계 API**에서 아래 갭이 남았습니다.

검증은 **`186005`(예정 Case)** 로 해 주세요. `186001`은 완료 Case라 `PROGRAM_COMMON_INFO_EDIT_PERIOD_ENDED`가 정상입니다.

FE는 mock 없이 remote만 사용합니다.

---

### P0 — 필드별 저장 → GET 동일 값 (공통 정보)

대상 API:
- `PUT|PATCH /api/admin/programs/{id}`
- (KPI 등) `PATCH /api/admin/programs/{id}/trained-teacher/detail` (실제 path는 현 OpenAPI 준수)
- 재조회: `GET /api/admin/programs/{id}` (+ info-detail GET 이 있다면 동일 값)

| UI 라벨 | FE가 보내는 wire (권장) | 허용 alias | 재조회에서 기대한 echo | 현재 증상 / 요청 |
|---------|-------------------------|------------|------------------------|------------------|
| 대표 프로그램명(국문) | `mainTitle` | `representativeProgramNameKo` | `mainTitle` | 유지 확인 |
| 대표 프로그램명(영문) | (현재 FE 조회 전용) | `titleEn`/`nameEn` | `titleEn` | **편집 UI 없음** — 편집 필요 시 top-level 문서화 |
| 공고용 프로그램명 | `title` + nested `announcementTitle` | `announcementTitle`, `nameKo` | GET `title` **및** detail/nested `announcementTitle` 동일 | nested만 바뀌고 top-level `title`이 이기면 **원복**처럼 보임. top-level 우선 + nested 미러 유지 |
| 세부 프로그램명 | `textbookName` **또는** `detailedProgramName` | `curriculumTitle` | GET `detailedProgramName` \|\| `textbookName` | `detailedProgramName`만 와도 유지 (handoff). OpenAPI `ProgramUpdateRequest`에 alias 명시 권장 |
| 사업 운영 기간 | `startDate`/`endDate` | `businessStartDate`/`businessEndDate` | 동일 | 시작 후 잠금 시 **명확한 에러 코드** (`PROGRAM_COMMON_INFO_EDIT_PERIOD_ENDED` 등과 구분) |
| 사업 분야 | `businessArea` = **마스터 name 정확 일치** | `businessField` | 동일 name | 마스터: `경제금융`,`진로취업`,`기업가정신`,`디지털리터러시`. `경제`/`진로`/`기타`는 거절 — **허용 목록을 OpenAPI/에러 메시지에 포함** (`PROGRAM_BUSINESS_AREA_NOT_FOUND`) |
| 후원사 | `sponsorId` + `sponsors[{sponsorId}]` | — | sponsorId · 표시명 | legacy `sponsorId`만 내도 primary 담당자 **삭제 금지** (handoff) |
| 후원사 담당자 | `sponsors[].sponsorContactId` + `managerName`/`contactPhone` | — | GET에 contactId 또는 managerName/phone | contactId 없이 이름만 바꾸면 재조회에서 primary로 **덮어쓰기**되는지 문서화. FE는 contactId 전송 중 |
| 교육 장소 | `institutionType`=`inside_school`\|`outside_school` **또는** 기타 시 top-level `venue` + nested `venueDetail`/`venueKind=other` | `organizationType` | GET에서 kind+detail 복원 | **기타(직접입력)** 이 inside로 떨어지지 않게. `venue`/`venueDetail` echo |
| 교육 과정 / IP / Course / Partner / IPS | `educationProcess`,`ipOwned`,`courseDeliveredBy`,`partnerInvolvement`,`ips` | `ipsType` | 동일 | 시드값 `courseDeliveredBy=TEACHER`, `ips=INSPIRE` 등 **확장 enum**이 있으면 GET echo + 허용 목록 공개. FE UI는 JA/Jointly/Partner · Inspire/Prepare/Succeed 중심 |
| KPI 최종 참여자 / 교육받은 교사 | programs: `totalParticipants`,`educatedTeachers` **또는** info-detail/`generalCommonInfo.kpi` | — | 두 API 중 **SSOT 하나**로 문서화 | FE는 programs PATCH + detail PATCH 이중 경로. 한쪽만 바뀌면 화면 원복 |
| 설문 진행 항목 | nested `generalSurveyMenuKeys` / serviceDetailJson only | — | nested 유지 | top-level 없음은 OK — **덮어쓰기 시 nested wipe 금지** |
| 진행 현황·등록/수정일·참여자 유형 | 클라 무시 / 서버 소유 | — | 서버 값 | 현행 유지 |

**수용 기준 (P0):**
1. `186005`에서 위 표의 저장 필드를 각각 바꾼 뒤 저장 → `GET` 재조회 시 **동일 값**
2. `detailedProgramName`만 body에 있어도 세부명 유지
3. `businessArea=경제금융` 성공, `businessArea=경제` → `PROGRAM_BUSINESS_AREA_NOT_FOUND` + 메시지에 허용 목록 또는 코드
4. 후원사만 바꾸고 `sponsorContactId` 생략 시 기존 담당자 유지
5. 교육 장소 `venueKind=other` + `venue`/`venueDetail` 저장 후 재조회 시 **기타**로 표시 가능

---

### P0 — 모집 정보 라운드트립

대상: 동일 `PATCH /api/admin/programs/{id}` (+ nested `generalCommonInfo.participantRecruitmentInfo` / serviceDetailJson)

| UI 라벨 | FE form / wire | 요청 |
|---------|----------------|------|
| 공고 게시·상한(강사/학급/일정/차시) | nested `participantRecruitmentInfo.*` | GET/PATCH 대칭 |
| 학생 명단 제출 | top-level `studentListRequired` | 유지 |
| 프로그램 운영 기간(모집 탭) | 편집 시 `startDate`/`endDate` (사업 기간과 공유) | **표시 SSOT**가 모집 operation period라면 GET 필드 분리 또는 문서화. 지금 FE는 사업 기간 필드를 씀 |
| 교육 대상 | `targetLevels` / `targetLevel` (enum: elementary…) | 한글 라벨(`초등`)만 오면 거절하지 말고 enum으로 canonical 하거나 400에 필드명 |
| 교육 대상 상세 | FE가 당분간 `district`에 매핑 중 | **권장:** recruitment `educationTargetDetail`/`recruitmentTargetDetail` top-level 또는 nested. `district`(지역)와 분리 |
| 모집 기간·발표 | `applicationStartDate`/`End`, `resultAnnouncementDate`/`Method` | 유지 |
| 비고 | 조회=`participantRecruitmentInfo.remarks`, 저장=`oneLineIntroduction` 불일치 | **요청:** remarks ↔ oneLineIntroduction 중 SSOT 하나. GET에 `remarks` echo 또는 `oneLineIntroduction` 미러 |

**수용 기준:** 모집 탭만 수정·저장해도 공통정보 필수값 때문에 400 나지 않음. 비고·교육 대상 상세가 재조회에서 유지.

---

### P1 — 저장 1회당 API 폭주 완화

#### 현상 (FE Network)

공통정보 「정보 수정」저장 1회에 대략:

| 호출 | 원인 |
|------|------|
| `PATCH /programs/{id}` | 기본정보 저장 |
| `PATCH …/trained-teacher/detail` (또는 `detail`) | KPI/커리큘럼 등 2차 저장 |
| `GET /programs?programType=TRAINED_TEACHER&page=0&size=20` (×1~2) | 목록 invalidate |
| `GET /programs?…&size=1` | overview **전체** 건수 |
| `GET …&periodStatus=SCHEDULED\|RECRUITING\|IN_PROGRESS\|COMPLETED` (×4) | 상단 4카드 건수 |
| `GET …/navigation` | LNB 갱신 |

overview 집계만 **size=1 × 5 parallel**입니다. FE는 detail mutation의 목록/overview 중복 invalidate는 줄였지만, **programs PATCH 1회당 overview 5 GET은 여전**합니다.

#### 요청

1. **목록 상단 stage 건수 단일 API** (권장)
   - 예: `GET /api/admin/programs/overview-stages?programType=TRAINED_TEACHER`
   - 응답 예:
     ```json
     {
       "total": 20,
       "scheduled": 5,
       "recruiting": 2,
       "inProgress": 8,
       "completed": 5
     }
     ```
   - 또는 기존 list에 `facets.periodStatus` / `aggregations` 포함
   - FE는 5회 `size=1` 폴링을 1회로 교체

2. **공통정보 저장 API 통합 (선택)**
   - programs PATCH 한 번에 KPI(`totalParticipants`/`educatedTeachers`) + nested commonInfo까지 수용하면 FE가 detail PATCH를 생략 가능
   - 또는 detail PATCH만으로 top-level title/businessArea 등도 받게 해 **단일 mutation**

3. **PATCH 응답에 상세 풀 DTO**
   - 저장 직후 `GET /programs/{id}` + info-detail GET을 생략할 수 있게 PATCH 200 body = GET detail과 동일 shape
   - (현재 FE는 PATCH 후 info-detail을 한 번 더 GET하는 경로 있음)

**수용 기준:** 공통정보 저장 1회 기준 overview용 GET ≤ 1, (가능하면) write mutation ≤ 1.

---

### OpenAPI / 에러 코드

| 코드 | 기대 |
|------|------|
| `PROGRAM_BUSINESS_AREA_NOT_FOUND` | 메시지 또는 `details.allowed`에 마스터 name 목록 |
| `PROGRAM_COMMON_INFO_EDIT_PERIOD_ENDED` | 완료 Case 저장 거절 (현행) |
| 사업 기간 잠금 (시작 후) | 별도 코드 + 어떤 필드가 잠기는지 (`startDate` only vs 전체 common info) |

`ProgramUpdateRequest` / `ProgramResponse`에 handoff alias(`announcementTitle`,`detailedProgramName`,`businessField`)를 **schema에 명시**(또는 `JsonAlias` 문서화)해 주세요. codegen 누락 시 FE는 수동 전송 중입니다.

---

### 검증 체크리스트 (BE)

- [ ] `186005` 공통정보: 공고용명·세부명·사업분야·후원사·담당자·교육장소(안/밖/기타)·교육과정·IP/Course/Partner/IPS 각각 저장→GET 동일
- [ ] `businessArea=경제` → 400 `PROGRAM_BUSINESS_AREA_NOT_FOUND`
- [ ] `186005` 모집정보: 상한·비고·교육대상 저장→GET 동일 (비고 SSOT 확정)
- [ ] (P1) overview-stages 단일 API 또는 list facets
- [ ] OpenAPI 동기화 + (가능하면) dashboard orval subset에 스키마 포함

### 비범위

- 일반/UJAT/Gemini 기본 계약 변경
- FE mock 시드 복원
````

---

## FE 측 후속 (BE 응답 후)

- [x] overview-stages 단일 API 붙이면 `fetchTrainedTeacherOverviewStages` 5연타 제거
- [x] 모집 비고·교육 대상 상세: BE SSOT에 맞춰 form 키 재매핑 (`remarks` / `educationTargetDetail`)
- [x] KPI `totalParticipants`/`educatedTeachers` → programs PATCH SSOT (detail PATCH 생략 가능 시)
- [ ] `titleEn` 편집 필요 시 UI + PATCH 추가
- [ ] OpenAPI 동기화 후 `ProgramUpdateRequest` alias codegen 반영

## 관련 FE 코드 (참고)

| 파일 | 역할 |
|------|------|
| `features/program/shared/lib/program-detail-info-constants.ts` | `BUSINESS_AREA_OPTIONS` 마스터명 |
| `features/program/shared/model/program-detail-edit-schema.ts` | form ↔ Program patch |
| `features/program/trained-teachers/api/adapters.ts` | `mapTrainedTeacherToUpdateRequest` |
| `features/program/trained-teachers/api/hooks.ts` | mutation invalidate (overview/list) |
| `features/program/trained-teachers/api/service.ts` | `fetchTrainedTeacherOverviewStages` → `GET …/overview-stages` |
| `features/program/shared/ui/.../basic-info-section.tsx` | TT/1사1교 공통정보 UI |

**Last updated:** 2026-09-17
