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

- [programs-gemini-visiting-training-api-backend-handoff.md](./programs-gemini-visiting-training-api-backend-handoff.md) (Cat 5)
- [programs-gemini-performance-api-backend-handoff.md](./programs-gemini-performance-api-backend-handoff.md) (Cat 6)
- 양식 시드: [form-template-seeds/recruitment-gemini-visiting-training.json](./form-template-seeds/recruitment-gemini-visiting-training.json) · `application-gemini-visiting-training-school.json` · `application-gemini-visiting-training-instructor.json`
- 포맷 참고: [company-school-program-dummy-seed-backend-request.md](./company-school-program-dummy-seed-backend-request.md)

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
```

---

## 1. programType · 도메인 공통 (모든 Gemini 시드)

OpenAPI에 `GEMINI` / `GEMINI_TRAINING`이 **둘 다** 있습니다.  
찾아가는 연수 create/list 시드에는 FE 잠정값을 써 주세요. **BE가 다른 값을 SSOT로 확정하면 문서·FE capabilities를 맞춥니다.**

```json
{
  "programType": "GEMINI_TRAINING"
}
```

| 고정·권장 | 값 | 비고 |
|-----------|-----|------|
| `programType` | `GEMINI_TRAINING` (FE 가설) | Cat5 handoff §1 |
| 실적 list SSOT | `GET …/training-reports` | Cat6 FE 가설 A — `performance-records`와 혼용 금지 |
| 양식 바인딩 | `recruitment-gemini-visiting-training` · `application-gemini-visiting-training-school` · `application-gemini-visiting-training-instructor` | create 직후 |

**title 접두어 (권장):** `[Gemini더미]` — E2E·운영 데이터와 구분.

---

# Part A — 찾아가는 연수

**URL:** `/programs/gemini/visiting-training?tab=recruitment|approved`

| Method | Path | 시드 대상 |
|--------|------|-----------|
| `GET` | `/api/admin/gemini/trainings/recruitments` | GVT-R-* |
| `GET` | `…/recruitments/{programId}` | R 상세 |
| `GET` | `…/recruitments/{programId}/organization-applications` | GVT-I-* |
| `GET` | `/api/admin/gemini/trainings/approved` | GVT-A-* |

> mutation(POST/PATCH/DELETE · 승인/반려) OpenAPI는 갭입니다. **목록·상세 GET이 열리는 시드**가 P0입니다.

---

## A.1 마스터 케이스 리스트

### 모집 공고 (tab=recruitment)

FE는 **신청기간**으로 상태 배지를 파생합니다 (`SCHEDULED` / `IN_PROGRESS` / `ENDED`).  
임시저장은 `draftStatus=DRAFT`(또는 동등)로 `[임시저장]` 표시.

| CASE | 우선 | FE mock id (참고) | title (권장) | 신청기간 (기준일=시드일) | 한 줄 목적 |
|------|------|-------------------|--------------|--------------------------|------------|
| **GVT-R-01** | P0 | `gvt-recruitment-scheduled` | `[Gemini더미] Coding Bootcamp (예정)` | 시작=+7일 · 종료=+21일 | 목록 「예정」·공고 미게시 |
| **GVT-R-02** | P0 | `gvt-recruitment-in-progress` | `[Gemini더미] Gemini Academy 2025 찾아가는 연수 신청` | 시작=−5일 · 종료=+10일 | **스크린샷 SSOT** · 「진행 중」·기관신청 스코프 |
| **GVT-R-03** | P0 | `gvt-recruitment-ended` | `[Gemini더미] AI for Education Workshop (종료)` | 시작=−30일 · 종료=−7일 | 「종료」배지 |
| **GVT-R-04** | P0 | `gvt-recruitment-draft` | `[Gemini더미] 임시저장 공고` | 임의 (상태 무시) | `draftStatus=DRAFT` · 목록 최상단 |

연수 요청(교육) 기간 권장 (R-01~R-03):

| CASE | training / business 기간 예시 |
|------|-------------------------------|
| R-01 | 당해 연도 +2개월 ~ +3개월 |
| R-02 | 당해 연도 +1개월 ~ +2개월 |
| R-03 | 당해 연도 1/1 ~ +20일 |

### 기관 신청 (R-02 상세 LNB 「기관 신청」)

`programId` = **GVT-R-02**. FE mock은 30건 생성하나, BE는 **상태 3종 × 최소 1건**이면 P0 충족.

| CASE | 우선 | 기관명 | `applicationStatus` | 학생 수 | 한 줄 목적 |
|------|------|--------|---------------------|---------|------------|
| **GVT-I-01** | P0 | 강서초등학교 | `PENDING` | 15 | 대기 · 승인/반려 UX(API 갭 시 GET만) |
| **GVT-I-02** | P0 | 푸른솔초등학교 | `APPROVED` | 15 | 승인 · 승인 연수(A) 연계 권장 |
| **GVT-I-03** | P0 | 하늘빛초등학교 | `REJECTED` | 15 | 반려 |

희망 강의 일정 샘플 (텍스트/구조화 모두 가능 — 상세 셀 표시용):

```text
1지망 : 2026. 01. 09(금) | 15:30~16:40(2차시)
2지망 : 2026. 01. 16(금) | 15:30~16:40(2차시)
3지망 : 2026. 01. 23(금) | 15:30~16:40(2차시)
```

시·군·구 권장:

| CASE | 시/도 | 시군구 |
|------|-------|--------|
| I-01 | 서울특별시 | 강서구 |
| I-02 | 경기도 | 성남시 분당구 |
| I-03 | 인천광역시 | 연수구 |

담당 교사명(표시): `홍길동` (I-01~I-03 공통 가능)

### 승인 연수 (tab=approved)

FE 진행현황 파생 (`resolveApprovedTrainingStatus`):

| 조건 | 배지 |
|------|------|
| 강사 미매칭 + 3지망 마지막일 경과 | `NOT_CONDUCTED` (미진행) |
| 강사 미매칭 + 3지망 남음 | `SCHEDULED` (예정) |
| 강사 매칭 + 연수일 전 | `SCHEDULED` |
| 강사 매칭 + 연수일 당일 | `IN_PROGRESS` |
| 강사 매칭 + 연수일 경과 | `COMPLETED` |

| CASE | 우선 | FE mock id | 기관 | 강사매칭 | lastPreferred / trainingDate | 한 줄 목적 |
|------|------|------------|------|----------|------------------------------|------------|
| **GVT-A-01** | P0 | `gat-215` | 강서초등학교 | 아니오 | lastPreferred=+14일 · training 빈값 | 「예정」·강사 미지정 |
| **GVT-A-02** | P0 | `gat-214` | 푸른솔초등학교 | 예 | training=시드일 · `15:30~16:40(2차시)` · 홍길동 | 「진행 중」·강사신청 스코프 |
| **GVT-A-03** | P0 | `gat-213` | 하늘빛초등학교 | 예 | training=−7일 · 공문필요=true | 「완료」·공문 필요 |
| **GVT-A-04** | P0 | `gat-212` | 새싹초등학교 | 아니오 | lastPreferred=−5일 | 「미진행」 |

공통 권장:

| 필드 | 값 |
|------|-----|
| `studentCount` | 15 (A-04는 20) |
| `managerName` | 박민수 (A-04는 김영희) |
| `recruitmentTitle` | R-02 또는 R-01 title과 동일하게 연결 권장 |

### 강사 신청 (A-02 상세 LNB 「강사 신청」) — P1

FE mock은 승인 연수마다 PENDING 3건. OpenAPI 전용 경로는 **갭** — 경로가 생기면 아래를 시드.

| CASE | 강사명 | 경력(년) | 등급 | 월배정 | 상태 |
|------|--------|----------|------|--------|------|
| **GVT-T-01** | 김틴토 | 1 | A등급 | 10 | `PENDING` |
| **GVT-T-02** | 이틴토 | 5 | B등급 | 3 | `PENDING` |
| **GVT-T-03** | 박틴토 | 3 | C등급 | 7 | `PENDING` |

연락처·이메일은 **마스킹** (`010-****-0000`, `ti***@naver.com`). 원문은 권한 있는 상세만.

---

## A.2 모집 상세 필드 레시피 (R-01~R-03 공통 권장)

FE 상세 mock (`detail-mock.ts` SCREENSHOT 필드)과 맞추면 상세 LNB 「모집 정보」가 채워집니다.

| 필드 (FE) | 권장 값 |
|-----------|---------|
| 공고 게시 | R-01: 미게시 · R-02/R-03: 게시 |
| 교육 대상 레벨 | `adult` (성인) |
| 교육 대상 상세 | `특성화고등학교 3학년` |
| 최소 학생 수 | `15` |
| 교육 형태 | `offline` |
| 문의 | JA Korea / `02-6085-6028` / `cc@jakorea.org` |
| 유의사항 | 해당없음 |
| 프로그램 소개 | Google for Education × JA Korea Gemini Academy 찾아가는 연수 안내 문구 |
| 모집 안내 | 연수 일정·대상·내용·방법·혜택 불릿 |
| 첨부 | `2026_Gemini_Academy_찾아가는연수_안내.pdf` 등 (파일 바이너리 없으면 메타만) |

OpenAPI `GeminiRecruitmentItem` / Detail에 없는 필드는 **확장 스키마 또는 JSON overlay**로 채워 주세요. 없으면 FE adapter가 빈 문자열·기본값으로 표시됩니다.

### list DTO 매핑 (참고)

| OpenAPI `GeminiRecruitmentItem` | FE 목록 |
|----------------------------------|---------|
| `programId` | row `id` |
| `nameKo` | `title` |
| `businessStartDate` / `businessEndDate` | 신청기간 (현재 FE는 연수요청기간에도 동일 매핑) |
| `draftStatus` | `DRAFT` → 임시저장 |
| `organizationApplicationCount` 등 | 집계(있으면 표시 보강) |

---

## A.3 승인 상세 레시피 (A-02 권장)

| 필드 | 권장 값 |
|------|---------|
| 모집 공고명 | R-01/R-02 title |
| 모집/완료 수 | 8 / 5 |
| 기관 주소 | `광주광역시 남구 광복마을4길 40` (또는 기관 실제 주소) |
| 담당자 | 박민토 · 연락처·이메일·학교·계좌 등 (개인정보 — 스테이징만) |
| 연수 내용 | Gemini Academy 찾아가는 연수 안내 본문 |
| 강사 (매칭 시) | 이름=홍길동 · 지역·경력 3년 · 연락처·이메일 |

---

## A.4 UI 잠금표 (이 시드가 열어 주는 화면)

| 상세 UI | 잠금 조건 | 대표 CASE |
|---------|-----------|-----------|
| 모집 목록 「예정/진행 중/종료」 | 신청기간 vs 오늘 | R-01 / R-02 / R-03 |
| 모집 목록 「임시저장」 | draft | R-04 |
| LNB 기관 신청 | 모집 상세 진입 | R-02 + I-01~03 |
| 승인 목록 진행현황 4종 | 매칭·날짜 조합 | A-01~A-04 |
| LNB 강사 신청 | 승인 상세 | A-02 + T-01~03 (경로 확정 시) |
| LNB 담당자 | 모집/승인 상세 | ProgramManagersTab (멤버 시드 별도) |

---

# Part B — 실적 관리

**URL:** `/programs/gemini/performance`

| Method | Path | 시드 대상 |
|--------|------|-----------|
| `GET` | `/api/admin/gemini/trainings/training-reports` | GPERF-* |
| `POST` | `…/training-reports/import/preview` | GPERF-DUP (스모크) |
| `POST` | `…/training-reports/import` | 동일 |

> FE remote ON 시 **선택 삭제는 숨김**(DELETE API 없음 · Option B). 정정은 import `overwrite`.

---

## B.1 마스터 케이스 리스트

| CASE | 우선 | FE mock id | 강사 | 장소 | 연수일 | 방식 | 한 줄 목적 |
|------|------|------------|------|------|--------|------|------------|
| **GPERF-01** | P0 | `gperf-206` | 홍길동 | 서울 | `2026-03-02` | OFFLINE | 스크린샷 SSOT · No. 최상단급 |
| **GPERF-02** | P0 | — | 김민수 | 부산 | `2025-09-16` | ONLINE | 온라인·필터 |
| **GPERF-03** | P0 | — | 이영희 | 대구 | `2025-09-17` | OFFLINE | 장소·강사 필터 |
| **GPERF-04** | P0 | — | 박민지 | 인천 | `2025-09-18` | ONLINE | 보조강사 복수 |
| **GPERF-05** | P0 | — | 최지우 | 광주 | `2025-09-19` | OFFLINE | 연수형태·시간·인원 |

### GPERF-01 상세 레시피 (필수)

FE mock `gperf-206`과 동일:

| 필드 | 값 |
|------|-----|
| 연수장소 | 서울 |
| 연수일 | `2026-03-02` |
| 교육생 수 | 15 |
| 세부시간 | `10:00~17:00` (또는 start/end → minutes) |
| 연수시간(시) | 6 → **`trainingMinutes=360`** |
| 연수주제 | 제미나이 아카데미 |
| 강사명 | 홍길동 |
| 보조강사 | `김민수, 박민지` → instructorCount 3 |
| 연수형태 | 교사 자체 연수 |
| 연수방식 | OFFLINE |
| 연락처 | `010-0000-0205` (스테이징) |

FE 중복키 mock 규칙 (참고):  
`instructorName|contact|trainingDate|trainingLocation|trainingStartTime`  
→ `홍길동|010-0000-0205|2026-03-02|서울|10:00`

### OpenAPI `GeminiTrainingReportItem` 권장 채움

| DTO 필드 | GPERF-01 | 비고 |
|----------|----------|------|
| `trainingReportId` | 고유 number | FE `id` |
| `programId` | 찾아가는 연수 R-02 id 권장 | 연결 가능하면 |
| `programNameKo` | `제미나이 아카데미` | FE trainingTopic |
| `instructorName` | 홍길동 | |
| `schoolOrOrganizationName` | 서울 | FE는 location 폴백으로도 사용 |
| `trainingLocation` | 서울 | **스키마에 있으면 채움** (목록 장소) |
| `trainingDate` | `2026-03-02` | |
| `trainingStartTime` / `EndTime` | `10:00` / `17:00` | |
| `trainingMinutes` | `360` | |
| `classCount` | 예: 2 | |
| `topic` | 제미나이 아카데미 | |
| `assistantInstructorNames` | `김민수, 박민지` | |
| `assistantInstructorCount` | `2` | |
| `deliveryType` | `OFFLINE` | ONLINE 케이스와 구분 |
| `participantCount` | `15` | |
| `calculatedAmount` | (선택) 정산 연동 시 | |
| `createdAt` | ISO | 정렬 |

GPERF-02~05는 위 표의 강사·장소·일자·ONLINE/OFFLINE만 바꾸면 됩니다.  
연수형태 순환 후보: `교사 자체 연수` · `학교 주관 연수` · `JA Korea 주관 연수` · `혼합형 연수`.

### GPERF-DUP-01 (P1 — import 중복)

1. GPERF-01과 **동일 강사·연락처·연수일·장소·시작시간**인 보고서를 1건 더 준비하거나,  
2. preview/import 시 동일 키 행이 `duplicate=true`로 오는지 확인.

`duplicateStrategy`: FE는 `overwrite` | `append`.

---

## B.2 Excel 업로드 컬럼 (import 스모크용)

필수 헤더(`*` 포함 가능 — FE는 `*` 제거 후 매칭):

| 한글 헤더 | 필드 |
|-----------|------|
| 타임스탬프 | timestamp |
| 강사명 | instructorName |
| 연수형태 | trainingFormat |
| 연락처 | contact |
| 이메일 주소 | email |
| 소속(학교) | school |
| 강사비 지급처 | paymentDestination |
| 연수장소 | trainingLocation |
| 교육일 | trainingDate |
| 연수 시작 시간 | trainingStartTime |
| 연수 종료 시간 | trainingEndTime |

선택: 보조강사명 · 연수 차시 · 교육생 수 · 사진/교안/평가 등.

`POST …/import` body row 형태는 `GeminiTrainingReportImportRow` 참고.

---

## B.3 목록 UI · 필터

| 필터 | 시드로 검증 |
|------|-------------|
| 강사명 | GPERF-01 `홍길동` |
| 연수방식 | OFFLINE / ONLINE (01 vs 02) |
| 연수장소 | 서울 / 부산 |
| 연수일 기간 | 기본 FE: 당해 연도 1/1 ~ 오늘 — **2026-03-02**가 구간에 들어가게 |

---

# 3. 볼륨 (P2, 선택)

| 표면 | FE mock | BE 권장 |
|------|---------|---------|
| 모집 목록 | 206 | featured 4 + 생성 16~26 |
| 승인 목록 | 206 | featured 4 + 생성 16~26 |
| 기관 신청 (R-02) | 30 | 상태 3종 × 2~3 = 6~9 |
| 실적 목록 | 206 | featured 5 + 생성 15~25 |

대량 생성 시 지역·기관명·강사명을 FE mock 풀에서 순환해도 됩니다.

**모집 title 템플릿 (FE):**

- `(Google for Education & JA Korea)Gemini Academy Coding Bootcamp`
- `(Google for Education & JA Korea) Gemini Academy AI for Education Workshop`
- `(Google for Education & JA Korea) Gemini Academy Digital Literacy Program`
- `(Google for Education & JA Korea) Gemini Academy Teacher Training`

**승인 기관명 풀:** 강서 / 푸른솔 / 하늘빛 / 새싹 / 무지개초등학교  
**시·군·구 풀:** 서울 강서구 · 경기 성남 분당 · 인천 연수 · 부산 해운대 · 대구 수성

---

# 4. BE 체크리스트

### 찾아가는 연수 (Cat5)

- [ ] `GEMINI` vs `GEMINI_TRAINING` SSOT 확정 후 시드 `programType` 반영
- [ ] GVT-R-01~04 → `GET …/recruitments` 상태·임시저장 확인
- [ ] R-02 상세 + GVT-I-01~03 → organization-applications
- [ ] GVT-A-01~04 → `GET …/approved` 진행현황 4종
- [ ] (P1) 강사 신청 list 경로 확정 시 T-01~03
- [ ] 양식 템플릿 3종 시드·binding

### 실적 관리 (Cat6)

- [ ] list SSOT = `training-reports` 확정 (또는 FE path 변경 합의)
- [ ] GPERF-01~05 → 목록 컬럼·필터
- [ ] DTO에 장소·보조강사·deliveryType·participantCount 채움 (FE 갭 감소)
- [ ] import preview/import + `duplicateStrategy` (GPERF-DUP)
- [ ] DELETE 미지원 유지 또는 API 추가 후 FE Option A 전환

### 공통

- [ ] title에 `[Gemini더미]` 접두 · 운영 DB 분리
- [ ] 개인정보 스테이징 한정 · 목록 마스킹 정책
- [ ] FE 게이트 키: `geminiVisitingTraining`, `geminiPerformance`

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-27 | 초안 — 찾아가는 연수(모집·기관·승인·강사) + 실적 featured/import |
