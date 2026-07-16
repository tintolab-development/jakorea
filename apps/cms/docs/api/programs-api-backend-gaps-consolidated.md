# 프로그램 관리 API — 백엔드 통합 핸드오프 (Cat1–6)

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-07-16 |
| 대상 | 백엔드 / API 설계 · OpenAPI · 스테이징 |
| FE 로드맵 | [programs-api-conversion-roadmap.md](./programs-api-conversion-roadmap.md) |
| OpenAPI 대조 기준 | `apps/cms/openapi/backend.openapi.json` |
| 목적 | **API 부재 · 계약 미비 · FE 적용을 수월하게 하는 상세 요청**을 한 문서로 전달 |

> 카테고리별 세부 계약은 기존 handoff를 SSOT로 유지합니다. 본 문서는 **백엔드 전달용 요약·우선순위·체크리스트**입니다.

| Cat | 화면 | 상세 handoff |
|-----|------|----------------|
| 1 | 1사1교 | [programs-company-school-api-backend-handoff.md](./programs-company-school-api-backend-handoff.md) |
| 2 | UJAT 프로그램 | [programs-ujat-api-backend-handoff.md](./programs-ujat-api-backend-handoff.md) |
| 3 | UJAT 교육 지역 | [programs-ujat-education-regions-api-backend-handoff.md](./programs-ujat-education-regions-api-backend-handoff.md) |
| 4 | 교육받은 교사 | [programs-trained-teachers-api-backend-handoff.md](./programs-trained-teachers-api-backend-handoff.md) |
| 5 | Gemini 찾아가는 연수 | [programs-gemini-visiting-training-api-backend-handoff.md](./programs-gemini-visiting-training-api-backend-handoff.md) |
| 6 | Gemini 실적 | [programs-gemini-performance-api-backend-handoff.md](./programs-gemini-performance-api-backend-handoff.md) |

---

## 0. 한눈에 보는 FE 상태

| Cat | FE 코어 | Remote gate | 백엔드에 막힌 핵심 |
|-----|---------|-------------|-------------------|
| 1 1사1교 | CRUD·신청·진행 하이브리드 | opt-in ON 가능 | 중첩(학교/강사)·정산·managers·설문 answers |
| 2 UJAT | programs CRUD | `ujatPrograms` | 신청/선발/진행·partner-assignments·schedules |
| 3 교육 지역 | GET/PATCH/reorder + Option A create/delete | `ujatEducationRegions` | **POST/DELETE OpenAPI 공식화** · `hasUsageHistory` |
| 4 교육받은 교사 | CRUD·detail·기관·일지·실적요약 | opt-in ON | managers · 설문 answers · approve 스코프 검증 |
| 5 찾아가는 연수 | **GET만** | **OFF** (권장) | **enum 확정 · 모집 CRUD · 승인 mutation · 강사 신청** |
| 6 실적 | list+import · delete Option B | **OFF** (권장) | **list SSOT · DTO 컬럼 · DELETE 또는 미지원 확정 · duplicateStrategy** |

---

## 1. API가 존재하지 않는 케이스 (OpenAPI path 없음)

아래는 CMS FE가 **화면 동작으로 필요**하나, 현재 OpenAPI에 **method/path가 없거나 전용 계약이 없는** 항목입니다.

### 1.1 P0 — 화면 차단급 (없으면 FE가 mock/가드에 머묾)

| ID | Cat | FE 화면 동작 | 필요 API (제안) | 비고 |
|----|-----|--------------|-----------------|------|
| M-01 | **5** | 모집 공고 등록 | `POST /api/admin/gemini/trainings/recruitments` **또는** `POST /api/admin/programs` + `programType` 확정값 | programs 대체 시 path·body를 **문서에 단일 SSOT**로 명시 |
| M-02 | **5** | 모집 정보 수정 | `PATCH …/recruitments/{programId}` **또는** programs PATCH | 기간·공고 본문·최소인원 등 |
| M-03 | **5** | 모집 삭제 | `DELETE …/recruitments/{programId}` **또는** programs DELETE | |
| M-04 | **5** | 기관 신청 승인/반려 | Gemini 전용 또는 공통 `POST /api/admin/organization-applications/{id}/approve\|reject`가 Gemini applicationId에 **동작하는지 계약** | OpenAPI에 Gemini 전용 mutation **없음** |
| M-05 | **5** | 모집→승인 연수 전이 | 상태 PATCH 또는 `POST …/approved` 등 전이 API | FE는 승인 탭을 별도 목록으로 봄 |
| M-06 | **5** | 강사 신청 목록·승인/반려 | `GET …/instructor-applications` + approve/reject | 승인 상세 LNB `instructors` |
| M-07 | **3** | 교육 지역 신규 | `POST /api/admin/ujat/education-regions` | FE는 **Option A로 이미 호출** · OpenAPI 미반영 |
| M-08 | **3** | 교육 지역 삭제 | `DELETE /api/admin/ujat/education-regions/{regionId}` | 동일 · 사용 중이면 **409** 또는 `hasUsageHistory` |
| M-09 | **6** | 실적 행 삭제 | `DELETE …/training-reports/{id}` (또는 bulk) | FE는 remote 시 **Option B: UI 숨김**. BE가 “미지원”이면 문서 확정만으로도 OK |

### 1.2 P1 — 핵심 운영 경로 (코어 이후 잔여)

| ID | Cat | FE 화면 동작 | 필요 API (제안) |
|----|-----|--------------|-----------------|
| M-10 | 1 | 학교 신청 상세 PATCH · 강사 배정 · 출석 mutation | 공통 applications / program-progress / assignment 계열 — **1사1교 스코프·필드** 문서화 |
| M-11 | 1 | 정산(100km·교통·숙박) 연결 | wagePolicies/paymentItems **구조화** + assignment 연결 (opaque JSON만으로는 부족) |
| M-12 | 2 | UJAT partner-assignments CRUD/cancel | OpenAPI에 일부 path 존재 가능 · **FE 미연결** — scheduleId 안정성부터 |
| M-13 | 2 | 학교/봉사자 신청·서류/면접/최종 · 1365 · 수료 | 전용 계약 또는 공통 applications **UJAT scope** |
| M-14 | 2 | programs create/update에 `schedules[]` | 없으면 partner-assignments의 scheduleId 확보 불가 |
| M-15 | 4 | 설문 문항 answers remote | 공통 surveys의 answers/summary **완성도** (목록 GET은 TT gate 포함됨) |
| M-16 | 5 | 승인 연수 **상세** GET | `GET …/approved/{id}` 또는 동등 | 현재는 list만 |
| M-17 | 6 | (선택) Excel export | `GET …/training-reports/export` 등 | FE는 클라이언트 export로 대체 가능 |

### 1.3 P2 — 전 유형 공통 / 후순위

| ID | Cat | FE 화면 동작 | 필요 API |
|----|-----|--------------|----------|
| M-18 | **1·2·4·5·일반** | 담당자(LNB managers) | `GET/POST/PATCH/DELETE …/programs/{id}/managers` (또는 동등) | **OpenAPI 전무** · 전 유형 mock |
| M-19 | 1·2 | 서버 Excel/일괄 export | export 계열 |
| M-20 | 1·2 | 게시/알림 고급 | posts/notifications (일부는 별도 도메인) |

---

## 2. API 계약이 미비한 케이스 (path는 있으나 FE 적용이 불안정)

### 2.1 전역 / 크로스컷

| ID | 주제 | 문제 | BE에 요청하는 확정 내용 |
|----|------|------|------------------------|
| C-01 | `programType` PATCH | PATCH body에 type이 없으면 **유형이 바뀌거나 null**될 위험 | PATCH 시 **기존 type 보존** (1사1교·UJAT·교육받은 교사) |
| C-02 | create + form binding | `autoApplyDefaultFormBindings` 원자성 미문서 | create 성공 시 기본 폼 binding **한 트랜잭션** · 실패 시 롤백 정책 |
| C-03 | template seeds | 카테고리별 templateCode 시드 누락 시 등록 화면 깨짐 | 아래 §4 template 표 참고 · **published** 상태로 스테이징 준비 |
| C-04 | `serviceDetailJson` | opaque string · Cat1 `schemaVersion` vs Cat2 `version` **키 불일치** | 버전 키 단일화 또는 양쪽 수용 · round-trip 보장 |
| C-05 | list size | 일부 list 기본 size 작음 | CMS 목록은 `size=500` 또는 페이지 메타 문서화 |
| C-06 | managers | path 없음 | §1.3 M-18 |

### 2.2 Cat1 — 1사1교

| ID | 주제 | 요청 |
|----|------|------|
| C-10 | 스테이징 round-trip | `COMPANY_SCHOOL` create→list filter→detail→PATCH→DELETE |
| C-11 | 봉사자 | 1사1교에서 **봉사자 리소스/필드 생성 금지** (서버 validation) |
| C-12 | sponsorId | 누락/미존재 → **400** (명확한 에러 메시지) |
| C-13 | list filter | `keyword`, `periodStatus`, `businessYear` 동작 명세 |
| C-14 | periodStatus | FE 매핑: `IN_PROGRESS`/`RUNNING` → UI `education_in_progress` 등 — **원본 enum 표** 제공 |

### 2.3 Cat2 — UJAT

| ID | 주제 | 요청 |
|----|------|------|
| C-20 | 스테이징 | `UJAT` CRUD round-trip |
| C-21 | 상·하반기 binding | 동일 templateCode **2회 binding scope** 문서화 |
| C-22 | 금요일 1~4교시 | 서버 schedule validation |
| C-23 | `ujatProgressStatus` | list `periodStatus`와 상세 progress SSOT 관계 문서화 |
| C-24 | applications scope | 공통 applications가 UJAT programId에 혼입되지 않는지 |

### 2.4 Cat3 — UJAT 교육 지역

| ID | 주제 | 요청 |
|----|------|------|
| C-30 | POST/DELETE OpenAPI | M-07/M-08을 **Swagger에 공식 반영** |
| C-31 | FE↔DTO | `regionKey`↔`code`, `name`↔`nameKo`/`displayName`, `sortOrder`↔`displayOrder`, `active`↔`activeYn` |
| C-32 | 시드 code | 서울·경기(남부)·인천·대전·대구·부산·광주·전북(전주) **code 안정성** (FE `regionKey` 소비처) |
| C-33 | 삭제 정책 | `hasUsageHistory` 필드 **또는** 409 + 메시지 |
| C-34 | reorder | `PUT …/reorder` body `items[{ id, displayOrder }]` 스테이징 검증 |

### 2.5 Cat4 — 교육받은 교사

| ID | 주제 | 요청 |
|----|------|------|
| C-40 | type | `TRAINED_TEACHER` filter/create · PATCH type 보존 |
| C-41 | org-applications 필드 | FE 테이블(기관명·지역·승인상태·희망일정·인원·교사명) ↔ DTO **컬럼 매핑표** |
| C-42 | 공통 approve | `POST …/organization-applications/{id}/approve\|reject`가 TT applicationId에 동작 · **타 유형 혼입 방지** |
| C-43 | education-journals | download/bulk-download · 권한 · **감사로그** |
| C-44 | performance-summary | FE 연결됨 — 스테이징 숫자 정합성 · `availableActions` 의미 |
| C-45 | 설문 | surveys list는 TT HTTP gate 포함 — **answers/summary** 완성도 |

### 2.6 Cat5 — Gemini 찾아가는 연수

| ID | 주제 | 요청 |
|----|------|------|
| C-50 | **enum 이중** | OpenAPI에 `GEMINI`와 `GEMINI_TRAINING` 공존 → **찾아가는 연수용 단일 값 확정** |
| C-51 | approved 스키마 | `GET …/approved`가 모집 item 스키마 재사용 → FE 승인 행(기관·지역·일시·강사·담당자)과 **불일치** · **전용 스키마** 권장 |
| C-52 | 상태 enum | 모집 상태 ↔ FE `SCHEDULED`/`IN_PROGRESS`/`ENDED`/`DRAFT` 매핑표 |
| C-53 | GET 필드 | 모집 목록: 공고명·신청기간·연수요청기간·상태 / 상세: 교육대상·문의·본문 등 |
| C-54 | org-applications GET | 기관명·시도/시군구·승인상태·희망일정·인원·교사명 |

### 2.7 Cat6 — Gemini 실적

| ID | 주제 | 요청 |
|----|------|------|
| C-60 | **목록 SSOT** | `GET …/training-reports` vs `…/performance-records` vs A목록+B보조 — **하나만 화면 SSOT**로 지정 |
| C-61 | list DTO 갭 | FE 컬럼: 연수장소·연수일·인원·세부시간·연수시간·주제·강사·보조강사·강사인원·형태·방식 |
| C-62 | 필터 query | 강사명·연수방식·장소·기간 (현재 OpenAPI는 `programId`/`page`/`size` 위주) |
| C-63 | `duplicateStrategy` | FE: `overwrite` \| `append` — BE enum·동작·트랜잭션(부분 반영 금지) |
| C-64 | import preview | `duplicate` 플래그·충돌 행·실패 메시지 |
| C-65 | DELETE | M-09 — API 추가 **또는** “미지원 확정”(FE Option B 유지) |

---

## 3. FE가 이미 호출하는 원격 경로 (스테이징 스모크 체크리스트)

### Cat1 — 1사1교

```
GET    /api/admin/programs?programType=COMPANY_SCHOOL&page=0&size=500
GET    /api/admin/programs/{id}
POST   /api/admin/programs
PATCH  /api/admin/programs/{id}
DELETE /api/admin/programs/{id}
(+ applications / programProgress 공통 — ORGANIZATION·INSTRUCTOR, volunteer 제외)
```

### Cat2 — UJAT

```
GET    /api/admin/programs?programType=UJAT&page=0&size=100|500
GET/POST/PATCH/DELETE /api/admin/programs/{id}
```

### Cat3 — 교육 지역

```
GET    /api/admin/ujat/education-regions
PATCH  /api/admin/ujat/education-regions/{regionId}
PUT    /api/admin/ujat/education-regions/reorder
POST   /api/admin/ujat/education-regions          ← Option A (OpenAPI 공식화 요청)
DELETE /api/admin/ujat/education-regions/{regionId} ← Option A
```

### Cat4 — 교육받은 교사

```
GET/POST/PATCH/DELETE /api/admin/programs (?programType=TRAINED_TEACHER)
GET/PATCH /api/admin/programs/{programId}/trained-teacher/detail
GET     …/trained-teacher/organization-applications
POST    /api/admin/organization-applications/{id}/approve|reject
GET/POST …/trained-teacher/education-journals (+ download / bulk-download)
GET     …/trained-teacher/performance-summary
GET     /api/admin/programs/{programId}/surveys   (+ summary/responses — answers 잔여)
```

### Cat5 — 찾아가는 연수 (gate OFF · GET만)

```
GET /api/admin/gemini/trainings/recruitments
GET /api/admin/gemini/trainings/recruitments/{programId}
GET /api/admin/gemini/trainings/recruitments/{programId}/organization-applications
GET /api/admin/gemini/trainings/approved
```

### Cat6 — 실적 (gate OFF)

```
GET  /api/admin/gemini/trainings/training-reports
POST /api/admin/gemini/trainings/training-reports/import/preview
POST /api/admin/gemini/trainings/training-reports/import
```

미연결(역할만 문서화 요청): `GET …/performance-records`

---

## 4. FE 잠정 가정 (BE 확정 시 FE가 맞출 항목)

백엔드가 아래와 **다르게** 확정하면 FE adapter/gate만 바꾸면 됩니다. **문서에 확정값을 남겨 주세요.**

| Cat | FE 잠정값 | 확정 요청 |
|-----|-----------|-----------|
| 1 | `programType = COMPANY_SCHOOL` | 유지 여부 |
| 2 | `programType = UJAT` | 유지 여부 |
| 3 | create/delete **Option A** (런타임 호출) | OpenAPI 반영 또는 Option B(UX 축소) |
| 4 | `programType = TRAINED_TEACHER` | 유지 여부 |
| 5 | `GEMINI_TRAINING` (잠정) · gate OFF | **`GEMINI` vs `GEMINI_TRAINING`** |
| 5 | mutation 없으면 UX 가드 | CRUD path 또는 programs 대체 |
| 6 | 목록 SSOT = `training-reports` | C-60 |
| 6 | delete **Option B** (UI 숨김) | DELETE 추가 시 Option A로 전환 가능 |

### 템플릿 시드 (create binding)

| Cat | templateCode (FE 기대) |
|-----|------------------------|
| 1 | `registration-economy`, `application-economy` |
| 2 | `registration-ujat`, `recruitment-ujat-school`, `recruitment-ujat-volunteer`(상·하반기), `application-ujat-school`, `application-ujat-volunteer` |
| 4 | `registration-trained-teachers`, `application-trained-teachers` |
| 5 | `application-gemini-visiting-training-instructor`, `application-gemini-visiting-training-school` |

---

## 5. FE 적용을 수월하게 하는 응답·요청 상세

### 5.1 공통 권장

1. **에러 본문**: `{ code, message, fieldErrors? }` — FE alert에 `message` 표시
2. **409**: 삭제 불가·상태 충돌·중복 승인 — 메시지에 사유
3. **목록**: `{ content, page, size, totalElements }` 일관
4. **날짜**: `YYYY-MM-DD` (시간 필드는 ISO 또는 `HH:mm` 문서화)
5. **id**: number여도 FE는 string 정규화 — path/query에 string 허용 권장
6. **감사로그**: Excel import·일지 download·개인정보 원문 — 실패 시 요청 차단 정책 문서화

### 5.2 Cat5 — 모집 CRUD body (제안 필드)

FE 등록/상세 편집이 쓰는 개념 필드 (경로가 programs여도 동일 의미):

| 필드 개념 | 설명 |
|-----------|------|
| title / nameKo | 공고명 |
| applicationPeriodStart/End | 신청기간 |
| trainingRequestPeriodStart/End | 연수 요청 가능기간 |
| announcementPublished | published / unpublished |
| educationTargetLevels / educationTargetDetail | 교육대상 |
| minStudentCount | 최소 인원 |
| educationForm | online / offline |
| inquiryContactName / inquiryTel / inquiryEmail | 문의 |
| programDescription / recruitmentGuide / applicationMethod / learningSupportContent | 본문 섹션 |
| additionalContentMarkdown | 추가 안내 |
| draftStatus | DRAFT 여부 |

### 5.3 Cat5 — 승인 연수 list item (전용 스키마 제안)

현재 모집 item 재사용으로는 부족. 최소:

| 필드 | FE 컬럼 |
|------|---------|
| id | row key |
| institutionName | 기관명 |
| institutionSido / institutionSigungu | 소재지 |
| status / progressStatus | 진행 현황 |
| trainingDate / trainingTimeText | 연수일시 |
| studentCount | 수강 인원 |
| instructorName | 강사 (미지정 가능) |
| managerName | 기관 담당자 |
| officialDocumentRequired | 공문 여부(필터) |
| recruitmentTitle | (선택) 모집 공고명 |

### 5.4 Cat6 — import row (이미 OpenAPI 있음 · 동작 확인)

`GeminiTrainingReportImportRow` 주요 필드:

- instructor: name / email / phone / memberId / assistantInstructorNames  
- training: location / schoolOrOrganizationName / date / startTime / endTime / minutes  
- account: bankName / accountNo / accountHolder / expectedTransferDate  

`duplicateStrategy`: **`overwrite` | `append`** 의미와 스테이징 동작을 체크리스트에 포함해 주세요.

### 5.5 Cat6 — list item 보강 (training-reports)

지금 FE adapter가 기본값으로 채우는 갭:

| FE 컬럼 | 현재 DTO | 요청 |
|---------|----------|------|
| 연수장소 | `schoolOrOrganizationName`로 대체 | `trainingLocation` 분리 권장 |
| 세부시간·연수시간 | `trainingMinutes`만 | start/end 또는 표시용 문자열 |
| 연수주제 | `programNameKo`로 대체 | topic 필드 |
| 보조강사·강사인원 | 없음 | 필드 추가 |
| 연수형태·방식 | 없음 | ONLINE/OFFLINE 등 |
| 연수인원 | 없음 | participantCount |

### 5.6 Cat3 — create/delete body (제안)

**POST**

```json
{
  "code": "custom_xxx",
  "nameKo": "표시명",
  "displayOrder": 99,
  "activeYn": true
}
```

**DELETE**: 사용 중이면 `409` + `"message": "사용 이력이 있어 삭제할 수 없습니다."`  
또는 GET/상세에 `hasUsageHistory: boolean`.

### 5.7 Cat4 — performance-summary (이미 FE 연결)

응답 필드 FE 사용:

- `organizationApplicationCount`, `trainedTeacherCount`, `teacherTrainingParticipantCount`
- `studentCount`, `classCount`
- `journalSubmittedCount`, `journalNotSubmittedCount`
- `teacherTrainingEnabled`, `educationJournalEnabled`
- `availableActions[]` — 의미 문서화

---

## 6. FE Remote 게이트 (백엔드 스테이징 안내)

공통: `VITE_API_SERVER`(또는 remote 설정) + 관리자 JWT(MFA 로그인).

| 모듈 / env | Cat |
|------------|-----|
| `programs` + `VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED=true` | 1 |
| `programs` + `ujatPrograms` | 2 |
| `ujatEducationRegions` | 3 |
| `programs` + `VITE_TRAINED_TEACHER_PROGRAMS_REMOTE_ENABLED=true` 또는 `trainedTeacherPrograms` | 4 |
| `geminiVisitingTraining` | 5 (**enum/mutation 확정 전 OFF**) |
| `geminiPerformance` | 6 (**SSOT/import 스모크 후**) |

등록 draft 원격: `formsSurveys` 추가.

---

## 7. 백엔드 우선순위 체크리스트 (복사해서 사용)

### P0 — 즉시

- [ ] **C-50** `GEMINI` vs `GEMINI_TRAINING` 단일 확정 (문서 한 줄)
- [ ] **M-01~M-04** Gemini 모집 CRUD + 기관 승인/반려 (또는 programs CRUD 대체 **명시**)
- [ ] **M-07~M-08 / C-30** UJAT education-regions POST/DELETE OpenAPI + 스테이징
- [ ] **C-60 / C-63** Gemini 실적 list SSOT + `duplicateStrategy` 동작
- [ ] **C-01 / C-02** programs PATCH type 보존 · create binding 원자성
- [ ] Cat1·2·4 스테이징 CRUD round-trip (type filter)

### P1

- [ ] **C-51** approved 전용 스키마 · **M-06** 강사 신청
- [ ] **C-61** training-reports list 컬럼 보강
- [ ] **M-09 또는 C-65** 실적 DELETE vs 미지원 확정
- [ ] **C-41 / C-42** TT org-apps 매핑 · 공통 approve 검증
- [ ] Cat2 schedules / partner-assignments
- [ ] Cat1 신청·진행 중첩 · 정산 구조화

### P2

- [ ] **M-18** managers CRUD (전 유형)
- [ ] 설문 answers · Excel export · 알림 polish

---

## 8. 회신 시 부탁드립니다 (BE → FE)

회신 템플릿 예시:

```text
1) GEMINI 찾아가는 연수 programType = ________ (GEMINI | GEMINI_TRAINING)
2) 모집 CRUD = (A) gemini/trainings/recruitments 전용  (B) programs CRUD + type
3) 교육지역 POST/DELETE = OpenAPI 반영일 / 스테이징 URL
4) 실적 목록 SSOT = training-reports | performance-records | A+B
5) 실적 DELETE = 추가 예정 | 미지원(FE Option B 유지)
6) duplicateStrategy = overwrite/append 의미: ________
7) managers API = 일정 / 비범위
```

확정값이 오면 FE는 adapter·gate·문서만 맞추면 됩니다.

---

## 9. 관련 FE 코드 앵커 (구현 참고)

| 영역 | 경로 |
|------|------|
| 로드맵 | `docs/api/programs-api-conversion-roadmap.md` |
| Cat5 remote | `features/program/gemini/api/visiting-training/*` |
| Cat6 remote | `features/program/gemini/api/performance-remote/*` |
| Cat4 remote | `features/program/trained-teachers/api/*` |
| Cat3 regions | `features/program/ujat/api/education-regions/*` |
| gate 모듈 키 | `shared/config/real-api-modules.ts` |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-16 | 초안 — Cat1–6 API 부재·계약 미비·적용 가이드 통합 (백엔드 전달용) |
