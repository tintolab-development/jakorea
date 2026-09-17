# BE 수정 요청 (2026-09-15) — 일반 프로그램 목록 누락 필드 · 위젯 건수 API

**작성일:** 2026-09-15  
**문서 성격:** **이 파일만** 보고 구현·검수 가능 (선행/관련 문서 열람 불필요)  
**문서 유형:** 백엔드 수정 요청 (목록 item 스키마 확장 + overview 건수 1회화)  
**우선순위:** P1  
**요청 대상:** Programs API · 일반 프로그램 (`GENERAL` / `GENERAL_ORGANIZATION` / `GENERAL_INDIVIDUAL`)  
**관련 FE:**  
- `apps/cms/src/features/program/general/api/programs-api-client.ts` (`AdminProgramListItemDto`)  
- `apps/cms/src/features/program/general/api/adapters/general-program-adapters.ts` (`mapAdminProgramListItemToProgram`)  
- `apps/cms/src/features/program/general/api/admin-general-programs-service.ts` (`fetchGeneralProgramOverviewStages`)  
- `apps/cms/src/features/program/general/ui/table/program-table-column-resolver.tsx`

---

## 0. 요청 묶음 (2건)

| # | 우선순위 | 한 줄 |
|---|----------|-------|
| **A** | **P1** | 목록 item에 §3 컬럼용 필드 탑레벨 추가 (교육 대상·모집 인원·참여 학교/학생 수) |
| **B** | **P1** | 상단 위젯 4카드 건수를 **목록 4회 호출 → overview counts 1회**로 교체 |

**하지 말 것:** 필터 없이 전체 rows를 한 번에 내려 FE에서 4버킷 집계하는 “목록 통합”.  
**할 것:** (1) **건수(summary/counts) 1응답** (2) **선택 탭의 목록 1회**는 현행 `periodStatus` 필터 유지 + item에 §3 필드 포함.

---

## 1. 요약

| 구분 | 결과 |
|------|------|
| 목록 `GET /api/admin/programs` item | §3 필드 **미제공** → 컬럼 `-` / 정원 없음 ❌ |
| 위젯 4카드 건수 | `size=1` 목록을 `periodStatus`별로 **4회** 호출해 `totalElements`만 사용 ❌ |
| 상세 GET | 일부만 `serviceDetailJson` / `rounds`로 확인 가능 ◐ (`rounds: []` 다수) |
| FE | 목록에서 상세 N+1·가짜 값 주입 안 함 |

**한 줄:**  
- **A** — 목록 item에 §3 필드를 탑레벨로 추가  
- **B** — 위젯 건수는 **counts/summary 1회**로 제공 (목록 API를 4번 치는 패턴 제거)

---

## 2. 대상 엔드포인트

| Method | Path | 역할 |
|--------|------|------|
| `GET` | `/api/admin/programs` | 테이블 rows (선택 `periodStatus` · 페이징) — **A: item 필드 확장** |
| `GET` | `/api/admin/programs/{programId}` | 상세 — 참고용 SSOT (목록·위젯 대체 아님) |
| `GET` | *(신규 권장)* `/api/admin/programs/overview-counts` 또는 동등 | 위젯 4카드 건수 — **B** |
| *(대안)* | 목록 응답에 `stageCounts` 동봉 | **B** — `includeStageCounts=true` 등 옵션 |

### 2.1 현행 FE 위젯 호출 (실측 · 제거할 패턴)

목록 페이지 진입 시 상단 카드용으로 아래 **4회**를 병렬 호출한다 (`page=0&size=1`, **rows는 버리고 `totalElements`만 사용**).

```http
GET /api/admin/programs?programType=GENERAL&page=0&size=1
GET /api/admin/programs?programType=GENERAL&page=0&size=1&periodStatus=RECRUITING
GET /api/admin/programs?programType=GENERAL&page=0&size=1&periodStatus=IN_PROGRESS
GET /api/admin/programs?programType=GENERAL&page=0&size=1&periodStatus=COMPLETED
```

FE 매핑 (`fetchGeneralProgramOverviewStages`):

| 호출 | → 카드 |
|------|--------|
| (periodStatus 없음) `totalElements` | 전체 `total` |
| `RECRUITING` | 예정 `scheduled` |
| `IN_PROGRESS` | 진행 중 `inProgress` |
| `COMPLETED` | 완료 `completed` |

테이블 목록은 **선택한 위젯의 `periodStatus`로 별도 1회** 조회한다.  
→ 건수 4회 + 목록 1회 = 페이지당 최대 5회. **B 적용 후: 건수 1 + 목록 1**.

### 2.2 B — overview counts 1회 (권장 계약)

**권장:** 전용 counts API (목록 페이징과 분리).

```http
GET /api/admin/programs/overview-counts?programType=GENERAL
```

```json
{
  "total": 120,
  "scheduled": 40,
  "inProgress": 50,
  "completed": 30
}
```

| 응답 키 | 의미 | 현행 목록 `periodStatus`와 동일 계약 |
|---------|------|--------------------------------------|
| `total` | 전체 (periodStatus 필터 없음) | `GET …/programs?programType=GENERAL` 의 `totalElements` |
| `scheduled` | 예정 | `periodStatus=RECRUITING` |
| `inProgress` | 진행 중 | `periodStatus=IN_PROGRESS` |
| `completed` | 완료 | `periodStatus=COMPLETED` |

**대안:** 목록 200 본문에 `stageCounts` / `facetCounts`를 붙이고, FE는 목록 로드 시 1회만 받아 위젯에 사용.  
이 경우에도 **전체 rows를 한 번에 받아 FE 집계**하지 말 것.

#### B에서 금지

| 금지 | 이유 |
|------|------|
| 필터 없이 전체 프로그램 rows를 내려 FE에서 4버킷 `filter` | 데이터 증가 시 목록·네트워크 비용 폭증 |
| “목록 API 통합”이라며 탭마다 item 스키마·누락 필드가 달라짐 | A 필드가 탭별로 빠지면 회귀 |
| counts만 주고 목록 item §3은 미반영 | 테이블 컬럼 문제는 그대로 |

#### B 수용 기준

- [ ] 위젯 4카드 숫자가 **1회 응답**으로 채워진다  
- [ ] 버킷 경계가 현행 `periodStatus=RECRUITING|IN_PROGRESS|COMPLETED`·전체와 **동일** (카드 숫자 ≠ 목록 건수 불일치 금지)  
- [ ] `programType` 쿼리 지원 (`GENERAL` 및 `GENERAL_*` 집계 범위 FE와 합의)  
- [ ] OpenAPI + 샘플 응답

---

## 3. A — 누락 항목 (목록 UI ↔ 요청 필드)

UI 표시 형식은 FE 기준이다. BE는 **숫자·코드 raw**만 내려주면 된다.  
**A는 `GET /api/admin/programs` item(및 동일 계약을 쓰는 목록 응답)에 탑레벨로 추가.**

| # | UI 컬럼 | 현재 목록 | 상세에서만 확인 가능한 경로 (참고) | 요청 필드 (권장) | UI 표시 예 |
|---|---------|-----------|-----------------------------------|------------------|------------|
| **L-01** | **교육 대상** | ✗ | 상세 `targetLevel` 및/또는 `serviceDetailJson.targetLevels` | `targetLevel` (string) 또는 `targetLevels` (string[]) | `초등` / `중등` … |
| **L-02** | **참여자 모집 인원** | ✗ (정원 없음) | 상세 `rounds[].capacity` — **실측 `rounds: []`인 경우 다수** | `participantApprovedCount` + `participantCapacity` | `12 / 30` |
| **L-03** | **강사 모집 인원** | ✗ | 상세·serviceDetail 쪽 강사 정원/신청 수 | `instructorApprovedCount` + `instructorCapacity` | `3 / 10` |
| **L-04** | **봉사자 모집 인원** | ✗ | 상세·serviceDetail 쪽 봉사 정원/신청 수 | `volunteerApprovedCount` + `volunteerCapacity` | `5 / 20` |
| **L-05** | **총 참여 학교 수** | ✗ | (목록/상세 집계 필드 미매핑) | `participatingSchoolCount` (int) | `100개` |
| **L-06** | **총 참여 학생 수** | ✗ | (목록/상세 집계 필드 미매핑) | `participatingStudentCount` (int) | `1,200명` |

> 요청 원문의 「총 참여 학교 수」「교육 대상」중복은, 목록 테이블 컬럼 기준으로 **L-05 학교 / L-06 학생** · **L-01 교육 대상** 1회로 정리했다.

### 3.1 교육 대상 vs 참여자 유형 (혼동 방지)

| UI 라벨 | 의미 | 상세 SSOT (참고) |
|---------|------|------------------|
| **교육 대상** | 초등·중등 등 (`targetLevel`) | 상세 탑레벨 `targetLevel` / `serviceDetailJson.targetLevels` |
| **참여자 유형** | 학교·기관 / 개인 / 강사 / 봉사자 | `serviceDetailJson.generalParticipantTypes` · `generalProgramAudience` · `programType` |

본 요청 A의 핵심은 **교육 대상(L-01)** 이다.  
참여자 유형은 `programType`만으로는 강사·봉사자 포함 여부를 목록에 표현하기 어렵다.  
필요 시 **별도** `generalParticipantTypes: string[]` 탑레벨 추가를 권장한다 (우선순위는 L-01~L-06).

### 3.2 모집 인원 · `rounds: []` 실측

- FE 목록「참여자 모집 인원」은 `승인 수 / 정원`을 `rounds[].capacity` 합으로 계산하려 한다.  
- 실측: 목록·상세 모두 **`rounds: []`** 인 프로그램이 있어 **정원을 표시할 수 없다**.  
- **요청:** 목록 item에 **탑레벨** `participantCapacity`(및 승인 수)를 제공해 달라.  
  - `rounds`를 채우는 방식으로 해결해도 되나, 목록 전용 집계 필드가 UX·성능상 더 명확하다.  
  - `rounds: []`인데 capacity만 상세에 숨기는 방식은 **목록에 쓰지 않는다** (FE 상세 N+1 금지).

---

## 4. A — 권장 목록 item JSON 발췌

기존 필드(`id`, `title`, `programType`, `lifecycleStatus`, …)에 아래를 **추가**.

```json
{
  "id": 168001,
  "title": "일반 프로그램 예시",
  "programType": "GENERAL_ORGANIZATION",
  "lifecycleStatus": "in_progress",

  "targetLevel": "elementary",
  "targetLevels": ["elementary"],

  "participantApprovedCount": 12,
  "participantCapacity": 30,

  "instructorApprovedCount": 3,
  "instructorCapacity": 10,

  "volunteerApprovedCount": 5,
  "volunteerCapacity": 20,

  "participatingSchoolCount": 100,
  "participatingStudentCount": 1200
}
```

### 4.1 필드 규칙

| 필드 | 타입 | 비고 |
|------|------|------|
| `targetLevel` | string \| null | FE 라벨맵: `elementary`→초등, `middle`→중등 등. 복수면 `targetLevels[0]` 또는 합의된 단일 표기 |
| `targetLevels` | string[] \| 생략 | 복수 교육 대상 시 |
| `*ApprovedCount` | int ≥ 0 | 없으면 `0` 또는 필드 생략(FE는 승인 0으로 처리 가능) |
| `*Capacity` | int ≥ 0 \| null | **정원 미설정**이면 `null` — FE는 승인 수만 표시. **빈 `rounds`로 대체하지 말 것** |
| `participatingSchoolCount` | int ≥ 0 \| null | 없으면 `null` → UI `-` |
| `participatingStudentCount` | int ≥ 0 \| null | 없으면 `null` → UI `-` |

강사·봉사자를 모집하지 않는 프로그램: capacity / approved를 `null` 또는 키 생략.  
FE는 참여자 유형에 강사/봉사가 없으면 `-` 처리한다.

### 4.2 기존 필드와의 관계 (매핑 힌트)

| 요청 필드 | 기존/유사 필드 (있으면 재사용·alias 가능) |
|-----------|------------------------------------------|
| `participantApprovedCount` | `approvedOrganizationApplicationCount`, `applicantCount` 등 — **개인/기관 모두** 승인 참여자 수로 통일 권장 |
| `participantCapacity` | `rounds[].capacity` 합 · 또는 등록 시 정원 SSOT |
| `instructorApprovedCount` | `instructorApplicantCount` (신청 vs 승인 — **승인 수**로 맞출지 합의 필요) |
| `instructorCapacity` | 상세 강사 모집 정원 |
| `volunteerApprovedCount` / `volunteerCapacity` | 상세 봉사자 모집 현황 |
| `targetLevel` | 상세 `targetLevel` / `serviceDetailJson.targetLevels` |

키 이름을 다르게 쓸 경우 OpenAPI·본 문서에 **최종 키를 명시**하고 FE에 공유하면 된다.

### 4.3 B — overview counts JSON (참고)

```json
{
  "programType": "GENERAL",
  "total": 120,
  "scheduled": 40,
  "inProgress": 50,
  "completed": 30
}
```

`periodStatus` 버킷 정의는 §2.2 표와 동일해야 한다.

---

## 5. OpenAPI · 체크리스트

### A — 목록 item

- [ ] `GET /api/admin/programs` 200 item 스키마에 §4 필드 반영  
- [ ] `periodStatus` / 탭과 무관하게 **동일 item 스키마** (필드 누락 금지)  
- [ ] `programType=GENERAL` / `GENERAL_ORGANIZATION` / `GENERAL_INDIVIDUAL` 샘플에 값 채운 더미·시드  
- [ ] `rounds: []` 이더라도 `participantCapacity` 등 탑레벨 정원 제공 (또는 rounds를 capacity와 함께 채움)  
- [ ] 강사·봉사 미모집 프로그램의 null/생략 규칙 문서화  

### B — overview counts

- [ ] counts 전용 path **또는** 목록 `stageCounts` 옵션 OpenAPI 반영  
- [ ] `total` / `scheduled` / `inProgress` / `completed` 키·의미 문서화  
- [ ] 현행 4회 `totalElements`와 **동일 숫자** 검증 샘플  
- [ ] FE가 `size=1` 4회 호출을 제거해도 위젯이 동작  

---

## 6. 수용 기준 (DoD)

1. **A:** 일반 프로그램 목록 테이블에서 아래가 **상세 추가 호출 없이** 표시된다.  
   - 교육 대상  
   - 참여자 / 강사 / 봉사자 모집 인원 (`승인 / 정원` 또는 정책상 `-`)  
   - 총 참여 학교 수 · 총 참여 학생 수  
2. **A:** `rounds: []`만으로 참여자 모집 정원이 비지 않는다.  
3. **B:** 위젯 4카드가 **counts 1회**(또는 목록+`stageCounts` 1회)로 채워지고, 카드 숫자와 해당 탭 목록 `totalElements`가 일치한다.  
4. **B:** 전체 rows FE 집계·목록 4회 `size=1` 패턴을 쓰지 않는다.  
5. FE는 제공된 탑레벨/counts 필드만 매핑한다 (`serviceDetailJson` 목록 파싱·상세 N+1 금지 유지).

---

## 7. FE 후속 (BE 반영 후)

### A

1. `AdminProgramListItemDto`에 §4 키 추가  
2. `mapAdminProgramListItemToProgram` hydrate  
3. 단위 테스트: capacity·교육 대상·참여 학교/학생 수  

### B

1. `fetchGeneralProgramOverviewStages`를 counts 1회 호출로 교체  
2. `size=1` × 4 `Promise.all` 제거  
3. 카드 숫자 ↔ 목록 `totalElements` 스모크  

---

**Last updated:** 2026-09-15
