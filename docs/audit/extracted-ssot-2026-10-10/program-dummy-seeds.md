# Program dummy seeds·gaps 이관 SSOT

이관일: 2026-10-10
원본 수: 10

원본 경로 목록:

- `apps/cms/docs/api/be-handoff-program-dummy-seeds/00-fe-mock-id-map-and-rules.md`
- `apps/cms/docs/api/be-handoff-program-dummy-seeds/01-general-program-dummy-seed.md`
- `apps/cms/docs/api/be-handoff-program-dummy-seeds/02-company-school-dummy-seed.md`
- `apps/cms/docs/api/be-handoff-program-dummy-seeds/03-ujat-program-dummy-seed.md`
- `apps/cms/docs/api/be-handoff-program-dummy-seeds/04-trained-teachers-dummy-seed.md`
- `apps/cms/docs/api/be-handoff-program-dummy-seeds/05-nested-child-data-dummy-seed.md`
- `apps/cms/docs/api/be-handoff-program-dummy-seeds/06-gemini-dummy-seed.md`
- `apps/cms/docs/api/be-handoff-program-dummy-seeds/README-BE.md`
- `apps/cms/docs/api/be-handoff-program-dummy-seeds/programs-api-backend-gaps-consolidated.md`
- `apps/cms/docs/api/be-handoff-program-dummy-seeds/programs-seed-case-api-coverage-backend-handoff-2026-07-30.md`

---

### Source: `apps/cms/docs/api/be-handoff-program-dummy-seeds/00-fe-mock-id-map-and-rules.md`

# 00 — FE mock ID ↔ BE 시드 규칙 · ID 맵

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-07-30 |
| **대상** | 백엔드 더미 시드 생성 |
| **원칙** | **FE mock이 SSOT**. BE는 mock과 **같은 분기·같은 LNB**가 열리게 시드한다. |

---

## 1. 공통 규칙

1. **식별자**
   - FE mock은 문자열 id (`general-prog-…`, `economy-prog-001`).
   - BE는 숫자 PK(`166401` 등)를 써도 된다. 그 경우 **본 문서 맵 또는 title 접두어**로 FE·QA가 대응할 수 있게 한다.
   - 가능하면 response에 `externalKey` / `demoCaseCode` 등 mock id를 **그대로** 넣는 필드를 권장한다.

2. **title 접두어 (권장)**

   | 유형 | 접두어 예 |
   |------|-----------|
   | 일반 | `[일반더미]` 또는 FE mock title 그대로 |
   | 1사1교 | `[1사1교더미]` |
   | UJAT | `[UJAT더미]` |
   | 교육받은 교사 | `[TT더미]` |
   | Gemini | `[Gemini더미]` |

3. **programType**

   | 메뉴 | OpenAPI `programType` |
   |------|------------------------|
   | 일반 | `GENERAL` / `GENERAL_ORGANIZATION` / `GENERAL_INDIVIDUAL` (BE SSOT에 맞게) |
   | 1사1교 | `COMPANY_SCHOOL` (`ONE_COMPANY_ONE_SCHOOL` legacy와 병존 시 필터 문서화) |
   | UJAT | `UJAT` (`UJAT_DGBONG` legacy 병존 주의) |
   | 교육받은 교사 | `TRAINED_TEACHER` |
   | Gemini 찾아가는 연수 | FE 잠정 `GEMINI_TRAINING` — BE 확정 시 문서 갱신 |

4. **상태**
   - FE UI lifecycle(`recruiting_students` 등) ↔ API `periodStatus`(`SCHEDULED`/`RECRUITING`/`ACTIVE`/`COMPLETED`) 매핑을 시드마다 명시한다.
   - 시드 원본(`프로그램유형.md`) CASE-19~21은 화면명에 예정·진행·완료가 섞여도 DB `period_status`가 모두 `SCHEDULED`일 수 있음 → **의도적 불일치면 문서에 남길 것**.

5. **하위 데이터**
   - 프로그램만 만들고 신청·참여자를 안 넣으면 상세 LNB가 비어 보인다.
   - ACTIVE/COMPLETED 시드는 [`05-nested-child-data-dummy-seed.md`](./05-nested-child-data-dummy-seed.md)를 **같이** 적용한다.

---

## 2. BE local demo ID (프로그램유형.md) ↔ FE mock / CASE

BE에 이미 `166401` 시리즈가 있다면 **재사용**하고, FE mock CASE와 아래처럼 맞춘다.  
없으면 FE mock id 기준으로 신규 생성해도 된다.

### 2.1 일반 28 CASE

| BE ID | CASE | FE mock `programId` (대표) | 시나리오 요약 |
|-------|------|----------------------------|---------------|
| 166401 | 01 | `general-prog-type-org-curriculum-single` | 기관·커리큘럼·단일·강사·봉사면접·설문 |
| 166402 | 02 | `general-prog-type-org-curriculum-multi` | 기관·복수 회차 |
| 166403 | 03 | `general-prog-type-ind-curriculum-single` | 개인·커리큘럼·단일·면접 |
| 166404 | 04 | `general-prog-type-ind-curriculum-multi` | 개인·복수 |

#### Marker lines (excerpt)
```
문서에 적힌 `apps/cms/src/data/mock/…` 경로는 CMS 저장소 안 SSOT 위치다.  
```

---

### Source: `apps/cms/docs/api/be-handoff-program-dummy-seeds/01-general-program-dummy-seed.md`

# 01 — 일반 프로그램 개인·기관 더미 시드 요청 (BE)

> **패키지:** [`README-BE.md`](./README-BE.md) · ID 맵 [`00-fe-mock-id-map-and-rules.md`](./00-fe-mock-id-map-and-rules.md) · 하위 행 [`05-nested-child-data-dummy-seed.md`](./05-nested-child-data-dummy-seed.md)  
> 원본 경로(모노레포): `docs/api/general-program-dummy-seed-backend-request.md` — 본 파일은 zip 전달용 복사본.

CMS `/programs/general` **목록 · 상세(풀페이지 모달) · LNB · 모집/신청/진행** 분기를 FE와 동일하게 검증하려면, 아래 **케이스 단위**로 더미 프로그램을 만들어 주세요.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-07-21 |
| **갱신** | 2026-07-23 — FE mock 필드 추출 · CASE별 시드 레시피 상세화 · 하위 상태 부록 |
| **대상** | 일반 프로그램만 (UJAT / 1사1교 / Gemini **제외**) |
| **FE SSOT** | [general-program-type-variant-spec.md](../../.cursor/rules/process/general-program-type-variant-spec.md) · [`variant.ts`](../../src/features/program/general/lib/variant.ts) · [`general-programs.ts`](../../src/data/mock/general-programs.ts) · [`detail-common-info-display.ts`](../../src/features/program/general/lib/detail-common-info-display.ts) · [`detail-meta.ts`](../../src/features/program/general/lib/detail-meta.ts) |

**관련 문서**

- [programs-create-api-backend-handoff.md](./programs-create-api-backend-handoff.md)
- [programs-registration-flow-api-backend-handoff.md](./programs-registration-flow-api-backend-handoff.md)
- [general-program-institution-application-bridge-spec.md](../../.cursor/rules/process/general-program-institution-application-bridge-spec.md)
- [mock-data.md](../../.cursor/rules/data/mock-data.md)

> **금지:** 기존 E2E 시드 `[수정 가능] 일반 프로그램 더미` 와 title을 같게 만들거나 덮어쓰지 마세요.

---

## 0. 이 문서를 읽는 법

1. **§1 마스터 리스트**에서 만들 케이스 번호(`CASE-01` …)를 고른다.
2. 각 CASE의 **시드 레시피**(필드 표·JSON)를 그대로 채운다.
3. **§2 상세 UI 잠금표**로 “이 시드가 열어 주는 상세 화면”을 확인한다.
4. 우선순위: **P0 → P1 → P2 → P3(갭)**.
5. 신청·참여·정산 **행 단위** 시드는 부록 A의 **상태 매트릭스**만 참고 (프로그램 CASE와 1:1 매핑 아님).

```text
P0 필수   CASE-01 ~ CASE-09   (유형 8종 + 교육·IPS 일정별 상이)     FE mock 9건
P1 권장   CASE-10 ~ CASE-18   (LNB 강사×봉사×설문 9건)               FE mock 9건
P2 권장   CASE-19 ~ CASE-24   (개인/기관 면접·만족도 대조)           FE mock 6건
P3 갭     CASE-25 ~ CASE-27   (FE mock 없음 — 기관 신청 브리지)     BE 신규 3건
참고      scheduled-1         (캘린더 QA A — CASE 번호 없음)
```

**FE mock 프로그램 시드 합계: 25건** (캘린더 7 + 유형 8 + 행15 1 + LNB 9).  
개인 audience 시드는 FE에서 `applyIndividualGeneralProgramScheduledState`로 **`status=pending`, `lifecycleStatus=planned`** 로 덮어씁니다. BE도 동일하게 맞춰 주세요.

---

## 1. 마스터 케이스 리스트 (한눈에)

| CASE | 우선 | FE `programId` | title (권장 / FE mock) | audience | structure | session | 한 줄 목적 |
|------|------|----------------|------------------------|----------|-----------|---------|------------|
| **CASE-01** | P0 | `general-prog-type-org-curriculum-single` | `일반 프로그램 (기관)_커리큘럼형_단일 회차` | org | curriculum | single | 기관 상세 SSOT · 모집 한도 · FULL LNB |
| **CASE-02** | P0 | `general-prog-type-org-curriculum-multi` | `일반 프로그램 (기관)_커리큘럼형_복수 회차` | org | curriculum | multi | 회차·과제 · 최대일정+1일최대차시 |
| **CASE-03** | P0 | `general-prog-type-ind-curriculum-single` | `일반 프로그램 (개인)_커리큘럼형_단일 회차` | ind | curriculum | single | 개인 LNB · 출석/과제/게시글 · 면접 on |
| **CASE-04** | P0 | `general-prog-type-ind-curriculum-multi` | `일반 프로그램 (개인)_커리큘럼형_복수 회차` | ind | curriculum | multi | 개인 + 복수 회차 |
| **CASE-05** | P0 | `general-prog-type-org-schedule-single` | `일반 프로그램 (기관)_일정형_단일 회차` | org | schedule | single | 일정형 공통정보 · date 기본(한도 숨김 대조) |
| **CASE-06** | P0 | `general-prog-type-org-schedule-multi` | `일반 프로그램 (기관)_일정형_복수 회차` | org | schedule | multi | **희망 일정 단락 전체 숨김** |
| **CASE-07** | P0 | `general-prog-type-ind-schedule-single` | `일반 프로그램 (개인)_일정형_단일 회차` | ind | schedule | single | 개인 + 일정형 |
| **CASE-08** | P0 | `general-prog-type-ind-schedule-multi` | `일반 프로그램 (개인)_일정형_복수 회차` | ind | schedule | multi | 개인 + 일정형 복수 |
| **CASE-09** | P0 | `general-prog-type-org-curriculum-multi-edu-ips-per-schedule` | `…커리큘럼형_복수 회차 · 교육·IPS 일정별 상이` | org | curriculum | multi | 회차별 교육형태·IPS 상이 |
| **CASE-10** | P1 | `general-prog-lnb-16` | `【LNB·16】강사 있음 · 봉사자 있음(면접 2depth) · 설문 있음(하위 4항목)` | org | curriculum | single | LNB full |

#### Marker lines (excerpt)
```
1. 구현한 **CASE 번호 목록** + 각 **programId** + 최종 **title**
3. P3(CASE-25~27) 수용 여부
| 역할 | 경로 |
> 신청·참여·정산 mock은 **대부분 programId 공통 데모**입니다. CASE마다 행을 복제하지 말고, **상태 조합이 목록에 한 번씩** 보이도록 시드하세요.
## 부록 B — FE `programId` ↔ CASE 빠른 조회
| FE `programId` | CASE |
```

---

### Source: `apps/cms/docs/api/be-handoff-program-dummy-seeds/02-company-school-dummy-seed.md`

# 02 — 1사1교 프로그램 더미 시드 요청 (BE)

> **패키지:** [`README-BE.md`](./README-BE.md) · ID 맵 [`00-fe-mock-id-map-and-rules.md`](./00-fe-mock-id-map-and-rules.md) · 하위 행 [`05-nested-child-data-dummy-seed.md`](./05-nested-child-data-dummy-seed.md)  
> 원본 경로(모노레포): `docs/api/company-school-program-dummy-seed-backend-request.md` — 본 파일은 zip 전달용 복사본.

CMS `/programs/company-school` (legacy `/programs/economy-education`) **목록 · 상세(풀페이지 모달) · LNB · 모집/신청/진행** 분기를 FE와 동일하게 검증하려면, 아래 **케이스 단위**로 더미 프로그램을 만들어 주세요.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-07-23 |
| **갱신** | 2026-07-23 — 초안 (FE mock 8건 + P1/P2 표면·갭) |
| **대상** | 1사1교만 (`programType=COMPANY_SCHOOL`) — 일반 / UJAT / Gemini **제외** |
| **FE SSOT** | [1c-1s-program-characteristics.mdc](../../../../.cursor/rules/1c-1s-program-characteristics.mdc) · [`economy-programs.ts`](../../src/data/mock/economy-programs.ts) · [`1c-1s/README.md`](../../src/features/program/1c-1s/README.md) · [`overview-stage-counts.ts`](../../src/features/program/1c-1s/lib/overview-stage-counts.ts) |

**관련 문서**

- [programs-company-school-api-backend-handoff.md](../programs-company-school-api-backend-handoff.md)
- [programs-company-school-detail-api-conversion-status.md](../programs-company-school-detail-api-conversion-status.md)
- [programs-registration-flow-api-backend-handoff.md](../programs-registration-flow-api-backend-handoff.md)
- [writing-form-seeds-backend-handoff.md](../writing-form-seeds-backend-handoff.md) (`registration-economy` · `application-economy`)
- [settlement-item-settings-dummy-seed-backend-request.md](../settlement-item-settings-dummy-seed-backend-request.md) (교통비/숙박비 1사1교)
- 포맷 참고(대상 제외): [01-general-program-dummy-seed.md](./01-general-program-dummy-seed.md)

> **금지**
>
> - 기존 E2E·일반 시드 title(`[수정 가능] 일반 프로그램 더미` 등)과 같게 만들거나 덮어쓰지 마세요.
> - E2E 수정 더미 `[수정 가능] 1사1교 프로그램 더미`(CS-EDIT) title을 다른 CASE와 같게 만들거나 덮어쓰지 마세요.
> - **봉사자** 신청/참여 행, **합반**, **과제** 관리 시드를 만들지 마세요.
> - 일반 프로그램의 audience×structure×session 8종 매트릭스를 1사1교에 복제하지 마세요 (유형 축이 고정).

**Remote 게이트 (검증 시)**

```env
VITE_API_SERVER=https://<backend-host>/
VITE_REAL_API_MODULES=adminAuth,formsSurveys,programs,applications,programProgress
VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED=true
```

---

## 0. 이 문서를 읽는 법

1. **§1 마스터 리스트**에서 만들 케이스 번호(`CS-01` …)를 고른다.
2. 각 CASE의 **시드 레시피**(필드 표·JSON)를 그대로 채운다.
3. **§2 상세 UI 잠금표**로 “이 시드가 열어 주는 상세 화면”을 확인한다.
4. 우선순위: **P0 → P1 → P2**.
5. 신청·참여·정산 **행 단위** 시드는 부록 A의 **상태 매트릭스**만 참고 (프로그램 CASE와 1:1 매핑 아님). 행은 **프로그램 id에 명시적으로 스코프**한다.

```text
P0 필수   CS-01 ~ CS-08    (lifecycle 8단계 × 설문 none/single/full)   FE mock 8건
P1 권장   CS-09 ~ CS-26    (모집·면접·교육형태·임금·중첩·양식 갭)
P2 권장   CS-27 ~ CS-38    (목록·bulk·후원사·게시글·필터 운영)
```

**FE mock 프로그램 시드 합계: 8건** (`economy-prog-001` ~ `008`).  
P1·P2는 FE에 없는 **BE 신규 시드**가 포함됩니다 (title로 FE mock과 구분).

---

## 0.1 도메인 공통 강제 (모든 CASE)

#### Marker lines (excerpt)
```
| 봉사자 | 없음 | KPI·LNB·행 시드 금지 |
| CASE | 우선 | FE `programId` | title (권장 / FE mock) | lifecycle | status | survey | overview 목적 | 한 줄 목적 |
| **CS-36** | P2 | *(BE 신규)* | `【1사1교·딥링크】programId` | education_after_textbook | active | full | 진행 | `?programId=` |
  - **봉사자·합반·과제 행 금지**
| **CS-36** | 안정적 numeric/string `programId` — `?programId=` deep-link round-trip |
1. 구현한 **CASE 번호 목록** + 각 **programId** + 최종 **title**
3. P1 갭(CS-17 교육형태 참여자선택 · CS-22 100km · CS-23 출석 · CS-25 navigation) 수용 여부
| 역할 | 경로 |
> FE 신청 mock은 programId 스코프가 약합니다. **BE 시드는 프로그램별 행을 명시적으로 묶으세요.**
**시드 금지.**
| FE `programId` | CASE | lifecycle | survey |
```

---

### Source: `apps/cms/docs/api/be-handoff-program-dummy-seeds/03-ujat-program-dummy-seed.md`

# 03 — UJAT 프로그램 더미 시드 요청 (BE)

CMS `/programs/ujat` **목록 · 등록 · 상세 LNB** 를 FE mock과 동일하게 검증하려면 아래 케이스로 시드해 주세요.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-07-30 |
| **대상** | UJAT만 (`programType=UJAT`) |
| **FE SSOT** | `ujat-programs-list-mock.ts` · `ujat-institution-application-mock.ts` · `ujat-volunteer-applicants-mock.ts` · `ujat-education-progress-*-mock.ts` |
| **패키지** | [`00-fe-mock-id-map-and-rules.md`](./00-fe-mock-id-map-and-rules.md) |

> **도메인**
>
> - UJAT에서 **봉사자 = 강사**(교육을 진행). 일반 「강사」 리소스를 복제하지 마세요.
> - 학교 모집 **연 1회**, 봉사단 **상반기·하반기 2회**.
> - 교육 요일: **금요일 1~4교시**만.
> - 교육 지역 8곳(마스터): 서울, 경기(남부), 인천, 대전, 대구, 부산, 광주, 전북(전주) — [`ujatEducationRegions`](./programs-api-backend-gaps-consolidated.md) API와 맞춤.

**Remote 게이트 (FE 검증)**

```env
VITE_REAL_API_MODULES=...,programs,ujatPrograms,ujatEducationRegions,formsSurveys
```

> **주의:** 현재 FE는 UJAT **목록/CRUD만** remote. 상세 신청·선발·진행은 **mock**.  
> 시드를 넣어도 상세 LNB는 API가 붙기 전까지 FE mock UI로 보일 수 있음.  
> 그래도 **BE 시드 + 향후 API** 를 위해 mock과 동일한 형상 데이터를 미리 준비해 주세요.  
> API 갭: [`programs-seed-case-api-coverage-backend-handoff-2026-07-30.md`](./programs-seed-case-api-coverage-backend-handoff-2026-07-30.md) §2.3·§3.

---

## 0. 우선순위

```text
P0  UJAT-L-01 ~ L-05     목록 진행현황 5종 (FE mock 1:1)
P0  UJAT-R-01 ~ R-08     교육 지역 마스터 8건
P1  UJAT-I-01 ~ I-06     기관 신청 (대기/승인/반려 × 반기 배정)
P1  UJAT-V-01 ~ V-12     상·하반기 봉사 서류/면접/최종 샘플
P2  UJAT-E-01 ~ E-04     교육 진행(지역·기관·봉사·출석) 요약 행
```

title 접두어: `[UJAT더미]`

---

## 1. P0 — 목록 프로그램 5건 (FE mock 대응)

FE id 패턴: `ujat-progress-{status-kebab}`

| CASE | FE mock id | `ujatProgressStatus` | lifecycle (모집 연동용) | 비고 |
|------|------------|----------------------|-------------------------|------|
| **UJAT-L-01** | `ujat-progress-education-scheduled` | `EDUCATION_SCHEDULED` | `planned` | 진행 예정 |
| **UJAT-L-02** | `ujat-progress-participant-recruiting` | `PARTICIPANT_RECRUITING` | `recruiting_students` | 학교 모집 UI·가이드 문구 채움 |
| **UJAT-L-03** | `ujat-progress-volunteer-recruiting` | `VOLUNTEER_RECRUITING` | `recruiting_instructors` | 봉사 모집 |
| **UJAT-L-04** | `ujat-progress-education-in-progress` | `EDUCATION_IN_PROGRESS` | `education_in_progress` | 진행 중 |
| **UJAT-L-05** | `ujat-progress-program-ended` | `PROGRAM_ENDED` | `document_processing_completed` | 완료 |

### 공통 필드 (FE mock 기준)

```json


---

### Source: `apps/cms/docs/api/be-handoff-program-dummy-seeds/04-trained-teachers-dummy-seed.md`

# 04 — 교육받은 교사 프로그램 더미 시드 요청 (BE)

CMS `/programs/trained-teachers` **목록 · 상세(공통정보·기관신청·진행·교육일지)** 를 FE mock과 맞추려면 아래 8 CASE를 시드해 주세요.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-07-30 |
| **대상** | `programType=TRAINED_TEACHER` |
| **FE SSOT** | `trained-teachers-programs.ts` · `trained-teachers-institution-detail.ts` · `TRAINED_TEACHERS_COMMON_INFO_CASES` |
| **패키지** | [`00-fe-mock-id-map-and-rules.md`](./00-fe-mock-id-map-and-rules.md) |

**Remote 게이트**

```env
VITE_REAL_API_MODULES=...,programs,formsSurveys
VITE_TRAINED_TEACHER_PROGRAMS_REMOTE_ENABLED=true
```

> **없음:** 강사 신청 LNB · 봉사자 · 일반 students/attendance 탭.  
> **있음:** 기관 신청 · 참여 기관 · **교육일지** · performance-summary.

**설문·만족도 LNB 전 케이스** (none / single / pair / full / nav-disable / 본문 empty·진행전·응답):  
→ [trained-teacher-survey-lnb-cases-dummy-seed-backend-prompt-2026-09-27.md](../trained-teacher-survey-lnb-cases-dummy-seed-backend-prompt-2026-09-27.md) (`TT-S-01`~). 본 문서 TT-01~08은 공통정보·일지 중심이며 설문 매트릭스 SSOT가 아니다.

BE local demo `164041`/`164042` 및 교육일지 PDF 2건이 있으면 TT 시드와 연결.

---

## 0. 우선순위

```text
P0  TT-01 ~ TT-08     FE mock 001~008 1:1 (공통정보 매트릭스)
P1  TT-A-01 ~ A-03    기관 신청 대기/승인/반려 (TT-01 또는 TT-05에 스코프)
P1  TT-J-01 ~ J-02    교육일지 메타 + 파일(가능하면 PDF)
P2  TT-P-01           performance-summary 숫자 스트립
```

title 접두어: `[TT더미]`

---

## 1. P0 — 프로그램 8건 (FE id 유지 권장)

| CASE | FE `programId` | 구조 | 회차 | 핵심 플래그 (FE case) |
|------|----------------|------|------|----------------------|
| **TT-01** | `trained-teachers-prog-001` | curriculum | single | 교육연수 ON · 교육일지 ON · 기간선택 |
| **TT-02** | `trained-teachers-prog-002` | curriculum | multi | 과제 설정 · 교육일지 ON · 날짜지정 |
| **TT-03** | `trained-teachers-prog-003` | curriculum | single | IPS 차시별 상이 · **교육일지 OFF** |
| **TT-04** | `trained-teachers-prog-004` | curriculum | multi | 교육형태+IPS 회차별 상이 |
| **TT-05** | `trained-teachers-prog-005` | schedule | single | 진행그룹 A/B · 교육일지 ON · 날짜지정 |
| **TT-06** | `trained-teachers-prog-006` | schedule | multi | 행사일정별 진행+과제 (일정설정 섹션 비노출) |
| **TT-07** | `trained-teachers-prog-007` | schedule | single | 그룹 구분 없음 · 기간선택 |
| **TT-08** | `trained-teachers-prog-008` | schedule | multi | 교육형태·IPS 일정별 상이 · 교육연수 ON |

### FE mock title 목록

1. `2026년 신한은행 - JA Korea 청소년 경제금융교육프로그램`
2. `2026 SAP-함께 성장하니JA! 하계 고등학생 모집 안내`
3. `2026 JA Korea 초등 교사 경제교육 직무연수`
4. `2026 JA Korea 중등 교사 디지털 금융교육 연수`


---

### Source: `apps/cms/docs/api/be-handoff-program-dummy-seeds/05-nested-child-data-dummy-seed.md`

# 05 — 하위(신청·진행·중첩) 더미 시드 요청 (BE)

프로그램 **헤더만** 있으면 목록은 채워지지만, 상세 LNB·중첩 화면은 비어 있습니다.  
FE mock에 이미 있는 **행 단위 데이터**를 프로그램 id에 **명시 스코프**하여 시드해 주세요.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-07-30 |
| **대상** | 일반 · 1사1교 (UJAT/Gemini는 각 유형 문서 참고) |
| **FE SSOT** | `applicant-*.ts` · `general-*-mock.ts` · `participating-*.ts` · `school-detail-mock` 계열 |

> **중요:** 중첩 **저장 mutation** API가 아직 없으면 FE는 계속 mock UI를 탑니다.  
> 그래도 GET 목록·상세 읽기가 가능하도록 시드를 맞춰 두면 API 연동 후 바로 검증됩니다.  
> 갭 목록: coverage 문서 §3.2 N-01~N-09.

---

## 0. 스코프 규칙

1. 모든 하위 행에 `programId`(또는 BE PK)를 **필수**로 넣는다.
2. 일반 ACTIVE/COMPLETED 시드(`166401` 등 / FE type·lnb·calendar)에 우선 연결.
3. 1사1교는 **기관 3 + 강사 3** 상태가 FE·시드 MD에 고정 — 개인/봉사/출석/강의보고 **금지**.
4. 승인된 신청만 진행(participants)으로 승격.

---

## 1. 일반 — 신청 행

### 1.1 기관 신청 — FE `applicant-institutions.ts`

| 상태 | 프로그램당 권장 | 비고 |
|------|-----------------|------|
| pending / WAITING_REVIEW | ≥1 | SCHEDULED·RECRUITING |
| approved | ≥1 | ACTIVE/COMPLETED |
| rejected | ≥1 | 반려 사유 |

필드(FE 확장): 학교명 · 지역 · 학년 · 담당교사 · 교육장소/형태 · 교재 · 합반(일반만) · 성범죄 조회 첨부명 등.

**API:** `GET …/programs/{id}/organization-applications` + approve/reject

### 1.2 강사 신청 — FE `applicant-instructors.ts`

| 상태 | 권장 |
|------|------|
| pending | ≥1 |
| approved | ≥1 → 강사 배정·진행 목록 |
| rejected | ≥1 |

### 1.3 개인 신청 — FE `general-individual-applications-mock.ts`

개인 audience 프로그램(CASE-03/04/07/08/19~21)에만.

| 상태 | 권장 |
|------|------|
| WAITING_REVIEW | ≥1 |
| approved | ≥1 |
| rejected / withdrawn | 각 ≥0~1 |

면접 on CASE에는 면접 단계 상태도.



---

### Source: `apps/cms/docs/api/be-handoff-program-dummy-seeds/06-gemini-dummy-seed.md`

# 06 — Gemini 프로그램 더미 시드 요청 (BE)

> **패키지:** [`README-BE.md`](./README-BE.md) · ID 맵 [`00-fe-mock-id-map-and-rules.md`](./00-fe-mock-id-map-and-rules.md)  
> 원본 경로(모노레포): `docs/api/programs-gemini-dummy-seed-backend-request.md` — 본 파일은 zip 전달용 복사본.  
> mutation API 갭은 coverage 문서 §2.3 · gaps consolidated Cat5–6 참고.

CMS **Gemini 프로그램** — **찾아가는 연수** · **실적 관리** 화면을 FE remote와 동일하게 검증하려면, 아래 **케이스 단위**로 더미 데이터를 만들어 주세요.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-07-27 |
| **대상** | Gemini만 — 일반 / UJAT / 1사1교 **제외** |
| **화면** | `/programs/gemini/visiting-training` · `/programs/gemini/performance` |
| **FE SSOT** | `features/program/gemini/model/{recruitment,approved,performance}/mock.ts` · `visiting-training/*` · `performance-remote/*` |

**관련 문서**

- [programs-gemini-visiting-training-api-backend-handoff.md](../programs-gemini-visiting-training-api-backend-handoff.md) (Cat 5)
- [programs-gemini-performance-api-backend-handoff.md](../programs-gemini-performance-api-backend-handoff.md) (Cat 6)
- 양식 시드: [form-template-seeds/recruitment-gemini-visiting-training.json](../form-template-seeds/recruitment-gemini-visiting-training.json) · [`application-gemini-visiting-training-school.json`](../form-template-seeds/application-gemini-visiting-training-school.json) · [`application-gemini-visiting-training-instructor.json`](../form-template-seeds/application-gemini-visiting-training-instructor.json)
- 포맷 참고: [02-company-school-dummy-seed.md](./02-company-school-dummy-seed.md)

> **금지**
>
> - 일반·UJAT·1사1교 시드 title과 같게 만들거나 덮어쓰지 마세요.
> - 찾아가는 연수와 실적 관리를 **같은 programType/목록 API로 합치지 마세요** — FE 게이트·엔드포인트가 분리되어 있습니다.
> - FE mock의 대량 건수(탭당 206건)를 **그대로** 복제할 필요는 없습니다. **P0 featured CASE + 소량 볼륨(권장 20~30건)** 이면 충분합니다.

**Remote 게이트 (FE 검증 시)**

```env
VITE_API_SERVER=https://<backend-host>/
VITE_REAL_API_MODULES=...,adminAuth,geminiVisitingTraining,geminiPerformance
```

| 모듈 키 | 화면 |
|---------|------|
| `geminiVisitingTraining` | 찾아가는 연수 (모집·승인) |
| `geminiPerformance` | 실적 관리 |

---

## 0. 이 문서를 읽는 법

1. **§1 programType SSOT**를 먼저 확정한다.
2. **Part A (찾아가는 연수)** → **Part B (실적 관리)** 순으로 시드한다.
3. 각 CASE의 **시드 레시피**를 채운 뒤, **검증 API**로 목록·상세가 열리는지 확인한다.
4. 우선순위: **P0 → P1 → P2(볼륨)**.

```text
Part A — 찾아가는 연수
  P0  GVT-R-01 ~ R-04     모집 공고 (상태 4종 + 임시저장)
  P0  GVT-I-01 ~ I-03     기관 신청 (대기·승인·반려) — R-02에 스코프
  P0  GVT-A-01 ~ A-04     승인 연수 (진행현황 4종)
  P1  GVT-T-01 ~ T-03     강사 신청 (대기 3건) — A-02에 스코프

Part B — 실적 관리
  P0  GPERF-01 ~ GPERF-05 목록 컬럼·필터·중복키 검증용 featured
  P1  GPERF-DUP-01        import 중복(overwrite/append) 스모크용 1쌍
  P2  볼륨 20~30건         페이지·필터 QA (FE mock 206건은 참고만)

#### Marker lines (excerpt)
```
찾아가는 연수 create/list 시드에는 FE 잠정값을 써 주세요. **BE가 다른 값을 SSOT로 확정하면 문서·FE capabilities를 맞춥니다.**
| 실적 list SSOT | `GET …/training-reports` | Cat6 FE 가설 A — `performance-records`와 혼용 금지 |
| `GET` | `…/recruitments/{programId}` | R 상세 |
| `GET` | `…/recruitments/{programId}/organization-applications` | GVT-I-* |
| **GVT-R-02** | P0 | `gvt-recruitment-in-progress` | `[Gemini더미] Gemini Academy 2025 찾아가는 연수 신청` | 시작=−5일 · 종료=+10일 | **스크린샷 SSOT** · 「진행 중」·기관신청 스코프 |
`programId` = **GVT-R-02**. FE mock은 30건 생성하나, BE는 **상태 3종 × 최소 1건**이면 P0 충족.
FE mock은 승인 연수마다 PENDING 3건. OpenAPI 전용 경로는 **갭** — 경로가 생기면 아래를 시드.
### list DTO 매핑 (참고)
| `programId` | row `id` |
| LNB 강사 신청 | 승인 상세 | A-02 + T-01~03 (경로 확정 시) |
| **GPERF-01** | P0 | `gperf-206` | 홍길동 | 서울 | `2026-03-02` | OFFLINE | 스크린샷 SSOT · No. 최상단급 |
| DTO 필드 | GPERF-01 | 비고 |
| `programId` | 찾아가는 연수 R-02 id 권장 | 연결 가능하면 |
- [ ] `GEMINI` vs `GEMINI_TRAINING` SSOT 확정 후 시드 `programType` 반영
- [ ] (P1) 강사 신청 list 경로 확정 시 T-01~03
- [ ] list SSOT = `training-reports` 확정 (또는 FE path 변경 합의)
- [ ] DTO에 장소·보조강사·deliveryType·participantCount 채움 (FE 갭 감소)
```

---

### Source: `apps/cms/docs/api/be-handoff-program-dummy-seeds/README-BE.md`

# CMS 프로그램 관리 — 더미 시드 생성용 백엔드 전달 패키지

JaKorea **CMS 프로그램 관리** 화면을 FE mock과 동일하게 검증할 수 있도록,  
**이미 존재하는 FE mock 데이터**를 기준으로 스테이징/로컬 DB 더미를 만들어 달라는 요청 묶음입니다.

백엔드는 monorepo를 보지 않아도 됩니다. **이 폴더 전체를 zip** 해서 전달하면 됩니다.  
**단, 양식(schema) DB 시드는 본 zip만으로는 불완전**합니다 — 아래 「양식 SSOT」를 **함께** 전달하세요.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-07-30 |
| **양식·문서 갱신** | 2026-09-09 |
| **목적** | FE mock → BE 더미 시드 생성 |
| **범위** | 일반 · 1사1교 · UJAT · 교육받은 교사 · Gemini · 하위(신청/진행) 행 |
| **압축** | 폴더 `be-handoff-program-dummy-seeds/` 를 zip |

---

## 양식 SSOT (2026-09-09)

프로그램 create 직후 **form binding**이 가리키는 `templateCode`의 **schema/extension/settings JSON** 은 아래가 SSOT입니다.

| 구분 | monorepo 경로 (zip 밖) |
|------|------------------------|
| 시드 JSON 46파일 | [`../form-template-seeds/`](../form-template-seeds/) |
| DB 시드 핸드오프 | [`../form-template-db-seed-backend-handoff.md`](../form-template-db-seed-backend-handoff.md) |
| BE Cursor 프롬프트 | [`../form-template-db-seed-backend-cursor-prompt.md`](../form-template-db-seed-backend-cursor-prompt.md) |
| 작성 인덱스 | [`../writing-form-seeds-backend-handoff.md`](../writing-form-seeds-backend-handoff.md) |
| 발급 인덱스 | [`../issuance-form-seeds-backend-handoff.md`](../issuance-form-seeds-backend-handoff.md) |

- BE reseed `seedLabel`: **`form-template-fe-seed-v2`**
- 프로그램 zip만 전달하면 binding은 걸려도 양식 내용이 구버전일 수 있음 → **양식 핸드오프 + `form-template-seeds/` 동봉 필수**

---

## 읽는 순서 (권장)

| 순서 | 파일 | 역할 |
|------|------|------|
| **1** | [`00-fe-mock-id-map-and-rules.md`](./00-fe-mock-id-map-and-rules.md) | **필수** · FE mock id ↔ BE 시드 id · 공통 규칙 · title 접두어 |
| **2** | [`programs-seed-case-api-coverage-backend-handoff-2026-07-30.md`](./programs-seed-case-api-coverage-backend-handoff-2026-07-30.md) | **필수** · 카테고리/CASE별 API 적용률 · **아직 더미인 갭** |
| **3** | 유형별 시드 레시피 (아래) | **구현용** · CASE별 필드·JSON |
| **4** | [`05-nested-child-data-dummy-seed.md`](./05-nested-child-data-dummy-seed.md) | 신청·참여자·출석 등 **하위 행** |
| **5** | [`programs-api-backend-gaps-consolidated.md`](./programs-api-backend-gaps-consolidated.md) | (참고) API path 부재·계약 미비 — 시드만으로는 안 열리는 화면 |

### 유형별 시드 레시피

| 파일 | 대상 | FE mock SSOT |
|------|------|----------------|
| [`01-general-program-dummy-seed.md`](./01-general-program-dummy-seed.md) | 일반 CASE | `general-programs.ts` |
| [`02-company-school-dummy-seed.md`](./02-company-school-dummy-seed.md) | 1사1교 | `economy-programs.ts` |
| [`03-ujat-program-dummy-seed.md`](./03-ujat-program-dummy-seed.md) | UJAT | `ujat-programs-list-mock.ts` 등 |
| [`04-trained-teachers-dummy-seed.md`](./04-trained-teachers-dummy-seed.md) | 교육받은 교사 | `trained-teachers-programs.ts` |
| [`06-gemini-dummy-seed.md`](./06-gemini-dummy-seed.md) | Gemini 모집·승인·실적 | `gemini/model/*/mock.ts` |

---

## 한 줄 요청 (BE용)

> FE CMS mock에 이미 있는 프로그램·신청·진행 케이스를 **동일 분기·동일 화면**이 열리도록 스테이징에 시드해 주세요.  

#### Marker lines (excerpt)
```
## 금지 (공통)
- E2E 전용 title(`[수정 가능] …`)과 충돌·덮어쓰기 금지
- 유형 간 시드 복제 금지 (일반 8종 매트릭스를 1사1교/UJAT에 그대로 넣지 말 것)
- 1사1교에 **봉사자·합반·과제** 시드 금지
```

---

### Source: `apps/cms/docs/api/be-handoff-program-dummy-seeds/programs-api-backend-gaps-consolidated.md`

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

#### Marker lines (excerpt)
```
| C-04 | `serviceDetailJson` | opaque string · Cat1 `schemaVersion` vs Cat2 `version` **키 불일치** | 버전 키 단일화 또는 양쪽 수용 · round-trip 보장 |
| C-11 | 봉사자 | 1사1교에서 **봉사자 리소스/필드 생성 금지** (서버 validation) |
| C-23 | `ujatProgressStatus` | list `periodStatus`와 상세 progress SSOT 관계 문서화 |
| C-24 | applications scope | 공통 applications가 UJAT programId에 혼입되지 않는지 |
| C-31 | FE↔DTO | `regionKey`↔`code`, `name`↔`nameKo`/`displayName`, `sortOrder`↔`displayOrder`, `active`↔`activeYn` |
| C-41 | org-applications 필드 | FE 테이블(기관명·지역·승인상태·희망일정·인원·교사명) ↔ DTO **컬럼 매핑표** |
| C-50 | **enum 이중** | OpenAPI에 `GEMINI`와 `GEMINI_TRAINING` 공존 → **찾아가는 연수용 단일 값 확정** |
| C-60 | **목록 SSOT** | `GET …/training-reports` vs `…/performance-records` vs A목록+B보조 — **하나만 화면 SSOT**로 지정 |
| C-61 | list DTO 갭 | FE 컬럼: 연수장소·연수일·인원·세부시간·연수시간·주제·강사·보조강사·강사인원·형태·방식 |
| C-62 | 필터 query | 강사명·연수방식·장소·기간 (현재 OpenAPI는 `programId`/`page`/`size` 위주) |
| C-63 | `duplicateStrategy` | FE: `overwrite` \| `append` — BE enum·동작·트랜잭션(부분 반영 금지) |
## 3. FE가 이미 호출하는 원격 경로 (스테이징 스모크 체크리스트)
GET/PATCH /api/admin/programs/{programId}/trained-teacher/detail
GET     /api/admin/programs/{programId}/surveys   (+ summary/responses — answers 잔여)
GET /api/admin/gemini/trainings/recruitments/{programId}
GET /api/admin/gemini/trainings/recruitments/{programId}/organization-applications
| 6 | 목록 SSOT = `training-reports` | C-60 |
FE 등록/상세 편집이 쓰는 개념 필드 (경로가 programs여도 동일 의미):
| FE 컬럼 | 현재 DTO | 요청 |
| `geminiPerformance` | 6 (**SSOT/import 스모크 후**) |
- [ ] **C-60 / C-63** Gemini 실적 list SSOT + `duplicateStrategy` 동작
4) 실적 목록 SSOT = training-reports | performance-records | A+B
| 영역 | 경로 |
```

---

### Source: `apps/cms/docs/api/be-handoff-program-dummy-seeds/programs-seed-case-api-coverage-backend-handoff-2026-07-30.md`

# 프로그램 관리 — 시드 CASE 기준 API 적용률 · 더미 잔존 (BE 핸드오프)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-07-30 |
| **대상** | 백엔드 / OpenAPI · 스테이징 시드 · 잔여 API 계약 |
| **FE 범위** | CMS 프로그램 관리 (`apps/cms/src/features/program/**`) |
| **시드 기준** | BE local demo `프로그램유형.md` (GENERAL 28 CASE · COMPANY_SCHOOL 8 · Gemini 5 · 메뉴 전용 등) |
| **목적** | 시드 CASE별로 **실 API vs 더미** 적용률을 한눈에 보고, **아직 더미로 도는 갭**을 BE 액션으로 전달 |

> **이 파일이 포함된 zip 패키지:** [`README-BE.md`](./README-BE.md) 부터 읽으세요.  
> (유형별 시드 레시피 · FE mock ID 맵 · 하위 행 시드)

> **읽는 법:** §1 카테고리 요약 → §2 CASE 매트릭스 → §3 더미 잔존(BE 요청) → §4 우선순위.  
> 유형별 계약 상세는 기존 handoff를 SSOT로 유지한다 (§5 링크).

---

## 0. 판정 기준 · Remote 게이트

### 0.1 상태 라벨

| 라벨 | 의미 |
|------|------|
| **API-wired** | 게이트 ON + JWT 시 실 HTTP만 사용 |
| **hybrid** | 게이트 ON이면 실 API, OFF·실패 시 mock/localStorage 폴백 |
| **mock-only** | 게이트와 무관하게 FE mock / 로컬 store |

### 0.2 현재 로컬 `.env` 게이트 (2026-07-30 기준)

```env
VITE_API_SERVER=https://…/
VITE_REAL_API_MODULES=…,programs,applications,programProgress,ujatPrograms,ujatEducationRegions,geminiPerformance,geminiVisitingTraining,…
VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED=true
VITE_TRAINED_TEACHER_PROGRAMS_REMOTE_ENABLED=true
```

| 모듈 / env | 커버 |
|------------|------|
| `programs` | 일반 CRUD · posts/surveys/navigation/managers HTTP · 공통 programs 경로 |
| `applications` | 기관·강사·개인·봉사자 신청 목록·승인/반려·봉사 서류/최종 |
| `programProgress` | 진행 참여자 목록 · 출석 GET/PUT |
| `ujatPrograms` (+ `programs`) | UJAT **목록·CRUD만** |
| `ujatEducationRegions` | UJAT 교육 지역 CRUD |
| `VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED` (+ `programs`) | 1사1교 CRUD·신청·진행 표면 |
| `VITE_TRAINED_TEACHER_PROGRAMS_REMOTE_ENABLED` 또는 `trainedTeacherPrograms` | 교육받은 교사 CRUD·detail·기관·일지 |
| `geminiVisitingTraining` | Gemini 모집/승인 **GET** |
| `geminiPerformance` | Gemini 실적 list + import |

추가 조건: `isRemoteApiConfigured()` + `hasRemoteAdminJwt()`.

### 0.3 시드 ID vs FE mock ID

| 축 | 예 |
|----|-----|
| **BE 시드** | `166401` … `166428`, `167001` … `167008`, `165001` … |
| **FE mock** | `general-prog-*`, `economy-*`, `ujat-*`, `trained-teachers-prog-*` |

스테이징에서 BE 시드 ID로 상세를 열면 **게이트 ON 시 remote**, OFF면 FE mock 문자열 id 경로.  
CASE별 FE mock 레시피는 [01-general-program-dummy-seed.md](./01-general-program-dummy-seed.md) · [02-company-school-dummy-seed.md](./02-company-school-dummy-seed.md) 참고.

#### Marker lines (excerpt)
```
| **UJAT 교육지역** | `/programs/ujat/regions` | hybrid | — | — | — | 목록/reorder hybrid · POST/DELETE OpenAPI 공식화 잔여 |
| 신청경로 path CRUD | **mock-only** | applicationPathId PATCH만 가능 |
| 면접 슬롯 GET | **hybrid(hand-wrap)** | POST create/assign는 wired · GET OpenAPI 등재 잔여 |
| 만족도 제출 모달 | **mock-only** | `TODO: API 연동` |
| Rich demo | 162301, 162311…162371 | Happy path·정산·면접 등 — **목록/연관 도메인** 검증용. 상세 중첩은 여전히 mock 경로 많음 |
| G-06 | Gemini | 승인 상세 GET · approved list DTO | `GET …/approved/{id}` · list 전용 스키마 | 165002+ |
| G-07 | Gemini | `GEMINI` vs `GEMINI_TRAINING` enum | OpenAPI·시드 단일 SSOT | 시드 §1·§8 |
`school-detail-fullpage-view.tsx` `TODO(api): 학교 중첩 상세 mutation 잔여`  
`participating-instructor-fullpage-view.tsx` `TODO(api): institutionAssignment·settlement`  
`ujat-program-detail-fullpage-modal.tsx` 상세 LNB mock · `TODO(api): 서버 status`
| P-01 | 신청경로 CRUD | `application-path-store` mock · `applicationPathId`만 PATCH | path 리소스 CRUD OpenAPI |
| P-03 | 면접 가능 일정 | TODO(api) | 프로그램별 가능일 GET |
| P-08 | `serviceDetailJson` 버전 키 | Cat별 `schemaVersion`/`version` 혼재 | 단일화 또는 양쪽 수용 |
| P-09 | managers (UJAT/Gemini·문서상 1사1교 잔여) | 일반은 hybrid · 타유형 mock 잔여 | 전 유형 `…/managers` 동일 동작 확인 |
`programDraft*` · `programCodePreview*` · `programCompletionReadiness*` · `programMaterial*` · `programDefaultFormBinding*` · `programComplete*` 등 — **features/program에서 HTTP 미호출**. 시드 “기본 폼 자동 바인딩”은 create 시 `autoApplyDefaultFormBindings` / form-bindings 경로로 일부 대체.
- [ ] Gemini enum SSOT (`GEMINI` / `GEMINI_TRAINING`)
- [ ] Gemini approved list/detail DTO
- [ ] 신청경로 CRUD · 공휴일 · 만족도 제출 · wage · UJAT noticeExposure
| [programs-detail-api-conversion-status.md](../programs-detail-api-conversion-status.md) | 일반 상세 LNB 완료율 SSOT |
| 역할 | 경로 |
| Gemini **GET** · 실적 **list/import** | 과제 · 신청경로 · 면접 슬롯 GET · 정산(특히 CS-06) |
```

---
