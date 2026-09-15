# BE 수정 요청 (2026-09-15) — 일반 프로그램 목록 누락 필드

**작성일:** 2026-09-15  
**문서 성격:** **이 파일만** 보고 구현·검수 가능 (선행/관련 문서 열람 불필요)  
**문서 유형:** 백엔드 수정 요청 (목록 API 스키마 확장)  
**우선순위:** P1 (목록 컬럼 `-` / 빈값 · 위젯별 목록 API 통합 시 일괄 반영)  
**요청 대상:** Programs API · 일반 프로그램 (`GENERAL` / `GENERAL_ORGANIZATION` / `GENERAL_INDIVIDUAL`)  
**관련 FE:**  
- `apps/cms/src/features/program/general/api/programs-api-client.ts` (`AdminProgramListItemDto`)  
- `apps/cms/src/features/program/general/api/adapters/general-program-adapters.ts` (`mapAdminProgramListItemToProgram`)  
- `apps/cms/src/features/program/general/ui/table/program-table-column-resolver.tsx`

---

## 1. 요약

CMS **일반 프로그램 목록** 테이블에 필요한 컬럼 값이 **목록 응답에 없어** 비거나 `-`로 표시된다.  
일부 값은 **상세 GET** `serviceDetailJson`(또는 상세 탑레벨)에서만 확인 가능하다.

| 구분 | 결과 |
|------|------|
| 목록 `GET /api/admin/programs` | 아래 §3 필드 **미제공** ❌ |
| 상세 `GET /api/admin/programs/{id}` | 일부만 `serviceDetailJson` / `rounds` 등으로 확인 가능 ◐ |
| FE | 목록에서 상세를 N번 추가로 호출하지 않음. **미제공 시 `-` 또는 승인 수만 표시** (가짜 값 주입 안 함) |

**한 줄 요청:** 목록 item 스키마에 §3 필드를 **탑레벨로** 추가해 달라.  
(현재 위젯별 목록 API가 분리되어 있고, **API 통합 예정** — 통합 응답에도 동일 필드가 **누락 없이** 포함되어야 한다.)

---

## 2. 대상 엔드포인트 · 통합 예정

| Method | Path | 역할 |
|--------|------|------|
| `GET` | `/api/admin/programs` | 일반 프로그램 목록 (현행 · 위젯/탭별로 query 분리 호출) |
| `GET` | `/api/admin/programs/{programId}` | 상세 — 참고용 SSOT (목록 대체 아님) |

### 2.1 위젯별 호출 → 통합 예정 (FE 참고)

현재 CMS 목록 상단 위젯(전체 / 예정 / 진행 중 / 완료 등)마다 **목록 API를 따로 호출**한다.  
이후 **단일(통합) 목록 API**로 합칠 예정이며, **그때 §3 누락 필드가 응답에 반드시 포함**되어야 한다.

- 통합 전: 현행 `GET /api/admin/programs` item에 §3 추가해도 됨  
- 통합 후: 통합 목록 item 스키마에 §3 **동일 키**로 포함 (위젯별로 필드가 빠지면 안 됨)

---

## 3. 누락 항목 (목록 UI ↔ 요청 필드)

UI 표시 형식은 FE 기준이다. BE는 **숫자·코드 raw**만 내려주면 된다.

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

본 요청의 핵심은 **교육 대상(L-01)** 이다.  
참여자 유형은 `programType`(`GENERAL_INDIVIDUAL` / `GENERAL_ORGANIZATION`)만으로는 강사·봉사자 포함 여부를 목록에 표현하기 어렵다.  
목록에 참여자 유형 칩/라벨이 필요하면 **별도** `generalParticipantTypes: string[]` 탑레벨 추가를 권장한다 (본 문서 우선순위는 §3 L-01~L-06).

### 3.2 모집 인원 · `rounds: []` 실측

- FE 목록「참여자 모집 인원」은 `승인 수 / 정원`을 `rounds[].capacity` 합으로 계산하려 한다.  
- 실측: 목록·상세 모두 **`rounds: []`(빈 배열)** 인 프로그램이 있어 **정원을 표시할 수 없다**.  
- **요청:** 목록 item에 **탑레벨** `participantCapacity`(및 승인 수)를 제공해 달라.  
  - `rounds`를 채우는 방식으로 해결해도 되나, 목록 전용 집계 필드가 UX·성능상 더 명확하다.  
  - `rounds: []`인데 capacity만 상세 어딘가에 숨겨 두는 방식은 **목록에 쓰지 않는다** (FE가 상세 N+1 조회하지 않음).

---

## 4. 권장 목록 item JSON 발췌

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

강사·봉사자를 모집하지 않는 프로그램:

- capacity / approved를 `null`로 두거나  
- 해당 키 생략  

FE는 참여자 유형에 강사/봉사가 없으면 `-` 처리한다.

### 4.2 기존 필드와의 관계 (매핑 힌트)

| 요청 필드 | 기존/유사 필드 (있으면 재사용·alias 가능) |
|-----------|------------------------------------------|
| `participantApprovedCount` | `approvedOrganizationApplicationCount`, `applicantCount` 등 — **개인/기관 모두** 승인 참여자 수로 통일 권장 |
| `participantCapacity` | `rounds[].capacity` 합 · 또는 등록 시 정원 SSOT |
| `instructorApprovedCount` | `instructorApplicantCount` (의미: 신청 vs 승인 — **승인 수**로 맞출지 합의 필요) |
| `instructorCapacity` | 상세 강사 모집 정원 |
| `volunteerApprovedCount` / `volunteerCapacity` | 상세 봉사자 모집 현황 |
| `targetLevel` | 상세 `targetLevel` / `serviceDetailJson.targetLevels` |

키 이름을 다르게 쓸 경우 OpenAPI·본 문서에 **최종 키를 명시**하고 FE에 공유하면 된다. 의미만 §3과 일치하면 된다.

---

## 5. OpenAPI · 통합 API 체크

- [ ] `GET /api/admin/programs` 200 item 스키마에 §4 필드 반영  
- [ ] **위젯별 목록 API 통합** 시점의 통합 item 스키마에도 §4 **동일 포함** (탭/위젯마다 누락 금지)  
- [ ] `programType=GENERAL` / `GENERAL_ORGANIZATION` / `GENERAL_INDIVIDUAL` 샘플에 값 채운 더미·시드  
- [ ] `rounds: []` 이더라도 `participantCapacity` 등 탑레벨 정원은 제공 (또는 rounds를 capacity와 함께 채움)  
- [ ] 강사·봉사 미모집 프로그램의 null/생략 규칙 문서화  

---

## 6. 수용 기준 (DoD)

1. 일반 프로그램 목록(전체·예정·진행·완료 위젯/탭)에서 아래가 **상세 추가 호출 없이** 표시된다.  
   - 교육 대상  
   - 참여자 / 강사 / 봉사자 모집 인원 (`승인 / 정원` 또는 정책상 `-`)  
   - 총 참여 학교 수 · 총 참여 학생 수  
2. `rounds: []`만으로 참여자 모집 정원이 비지 않는다.  
3. API 통합 후에도 §3 필드가 응답에서 빠지지 않는다.  
4. FE는 제공된 탑레벨 필드만 매핑한다 (목록에서 `serviceDetailJson` 파싱·상세 N+1 금지 유지).

---

## 7. FE 후속 (BE 반영 후)

1. `AdminProgramListItemDto`에 §4 키 추가  
2. `mapAdminProgramListItemToProgram`에서  
   - `targetLevel` / `targetLevels`  
   - capacity → `rounds` 시드 또는 domain `instructorCapacity` / KPI 등 기존 컬럼 렌더러가 읽는 필드  
   - `participatingSchoolCount` / `participatingStudentCount`  
   매핑  
3. 단위 테스트: capacity·교육 대상·참여 학교/학생 수 hydrate  

---

**Last updated:** 2026-09-15
