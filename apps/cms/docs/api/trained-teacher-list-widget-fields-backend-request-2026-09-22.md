# BE 수정 요청 (2026-09-22) — 교육받은 교사 목록 위젯 컬럼 필드 · 서버 필터

**작성일:** 2026-09-22  
**갱신:** 2026-09-22 — 교육 대상 조회(필터) 실측 실패 원인·매칭 규칙 추가  
**문서 성격:** **이 파일만** 보고 구현·검수 가능 (선행/관련 문서 열람 불필요)  
**문서 유형:** 백엔드 수정 요청 (목록 item 탑레벨 필드 + 목록 쿼리 서버 필터)  
**우선순위:** P1  
**요청 대상:** Programs API · **`programType=TRAINED_TEACHER` only**  
**관련 FE:**  
- `apps/cms/src/features/program/trained-teachers/api/list-params.ts`  
- `apps/cms/src/features/program/trained-teachers/api/adapters.ts` (`mapTrainedTeacherListItemToProgram`)  
- `apps/cms/src/features/program/trained-teachers/lib/list-filter-fields.ts`  
- `apps/cms/src/features/program/general/api/programs-api-client.ts` (`AdminProgramListItemDto`)  
- `apps/cms/src/features/program/general/ui/table/program-table-column-resolver.tsx` (`columnPreset: 'trainedTeachers'`)

**선행(필드명 정렬용, 본 문서만으로 구현 가능):**  
[programs-general-list-missing-fields-backend-request-2026-09-15.md](./programs-general-list-missing-fields-backend-request-2026-09-15.md) — 일반 프로그램 목록 item 필드명과 **동일 키**를 쓴다. GENERAL 스키마를 축소하거나 TT 전용 별칭을 만들지 말 것.

---

## 0. 요청 묶음 (2건)

| # | 우선순위 | 한 줄 |
|---|----------|-------|
| **A** | **P1** | `GET /api/admin/programs?programType=TRAINED_TEACHER` item에 §3 컬럼용 탑레벨 필드 추가 (**교육 대상 `targetLevel`/`targetLevels` 포함**) |
| **B** | **P0** | 동일 목록 API에 **`targetLevel` 쿼리 서버 필터** (진행 단계·사업 운영 기간은 P1) |

**실측 (CMS `/programs/trained-teachers`):** 필터「교육 대상」을 고르고 조회해도 목록이 해당 대상으로 **걸러지지 않습니다.**  
원인은 (1) 목록 item에 교육 대상 코드가 없거나 불완전하고 (2) `GET /api/admin/programs`가 `targetLevel` 쿼리를 받지 않기 때문입니다. FE는 조회 시 `targetLevel=elementary` 등을 **이미 붙입니다.** BE가 무시하면 무한스크롤 20건만 클라에서 보조 필터하고, 필드가 없으면 그마저도 실패합니다.

**하지 말 것**

- `GENERAL` / `COMPANY_SCHOOL` / `UJAT` / `GEMINI` 기본 목록 스키마·필터 축소
- 목록에서 상세 N+1 (`GET /programs/{id}` 또는 `…/trained-teacher/detail`)로 컬럼 채우기
- 위젯 카드 축 `periodStatus`(SCHEDULED / IN_PROGRESS / COMPLETED)와 전체 탭「프로그램 진행 현황」필터를 한 파라미터로 섞기
- `organizationApplicationCount`(기관 **신청** 건수)를 `participatingSchoolCount`(총 참여 학교 수)로 대체 표기

---

## 1. 화면 · 왜 필요한가

CMS `/programs/trained-teachers` 상단 4카드(전체 / 예정 / 진행 중 / 완료)에 따라 **리스트 컬럼·필터가 다릅니다.**  
FE는 목록 item만으로 셀을 그립니다. 필드가 없으면 `-` / `0 / -` 가 됩니다.  
페이지 크기 20 무한스크롤이라, 서버가 필터를 안 받으면 **조회 건수 ≠ 테이블 건수**가 됩니다.

| 위젯 (`periodStatus`) | 테이블 컬럼 | 테이블 필터 |
|------------------------|-------------|-------------|
| 전체 (쿼리 없음) | 프로그램 진행 현황 · 참여자 모집 인원 · 교육 대상 | 프로그램명 · **프로그램 진행 현황** · 교육 대상 |
| 예정 `SCHEDULED` | 참여자 모집 인원 · 교육 대상 · 사업 운영 기간 | 프로그램명 · 교육 대상 · **사업 운영 기간** |
| 진행 중 `IN_PROGRESS` | 참여자 모집 인원 · 총 참여 학교 수 · 총 참여 학생 수 · 교육 대상 | 프로그램명 · 교육 대상 |
| 완료 `COMPLETED` | 진행 중과 동일 | 진행 중과 동일 |

교육받은 교사 목록에는 **참여자 유형 · 강사 모집 · 봉사자 모집 컬럼이 없습니다.** 해당 필드를 TT item에서 빼라는 뜻이 아니라, **A의 필수 필드는 §3** 입니다.

---

## 2. 대상 엔드포인트

| Method | Path | 역할 |
|--------|------|------|
| `GET` | `/api/admin/programs` | 목록. **필수 쿼리** `programType=TRAINED_TEACHER`. 선택 `periodStatus` · 페이징 · **B 필터** |
| `GET` | `/api/admin/programs/{id}` | 상세 — 목록 컬럼 SSOT 아님 |

현행 FE 목록 호출 예:

```http
GET /api/admin/programs?programType=TRAINED_TEACHER&page=0&size=20
GET /api/admin/programs?programType=TRAINED_TEACHER&periodStatus=SCHEDULED&page=0&size=20
GET /api/admin/programs?programType=TRAINED_TEACHER&periodStatus=IN_PROGRESS&page=0&size=20
GET /api/admin/programs?programType=TRAINED_TEACHER&periodStatus=COMPLETED&page=0&size=20
```

TT 예정 카드는 **`periodStatus=SCHEDULED`** (GENERAL의 `RECRUITING` 별칭 사용 금지).

교육 대상 조회 시 FE가 붙이는 쿼리 (위젯과 AND):

```http
GET /api/admin/programs?programType=TRAINED_TEACHER&targetLevel=elementary&page=0&size=20
GET /api/admin/programs?programType=TRAINED_TEACHER&periodStatus=IN_PROGRESS&targetLevel=middle&page=0&size=20
```

---

## 2.1 P0 — 교육 대상 조회가 안 되는 이유 · 매칭 규칙

CMS 4위젯 모두 필터「교육 대상」이 있습니다 (초등학생 / 중학생 / 고등학생 / 대학생 / 성인).  
조회 후 **해당 대상 프로그램만** 나와야 하고, 헤더 `총 N건` = 필터 후 `totalElements` 여야 합니다.

### 왜 실패하는가

| # | 현재 | 결과 |
|---|------|------|
| 1 | 목록 item에 `targetLevel` / `targetLevels`가 비어 있음 (상세 `serviceDetailJson`에만 있는 경우 포함) | 셀 `-` · 클라 매칭할 값이 없음 |
| 2 | `GET /api/admin/programs` query에 `targetLevel` 미지원 (무시 또는 미구현) | 서버는 전체 페이지를 그대로 반환 |
| 3 | 교육 대상이 **복수**인데 목록에 첫 값만 있거나 배열이 없음 | 「중학생」조회 시 초등+중등 프로그램이 빠짐 |

FE는 더 이상 목록 GET에 `targetLevel`을 빼지 않습니다. **서버가 필터하고 item에도 코드를 내려줘야** 조회가 맞습니다.

### 매칭 규칙 (필수)

쿼리 `targetLevel` 한 값. item은 **아래 중 하나라도 같으면 포함** (OR, 복수 대상 프로그램).

```
include if
  item.targetLevel == query.targetLevel
  OR query.targetLevel ∈ item.targetLevels
```

| 쿼리 | item | 포함? |
|------|------|--------|
| `elementary` | `"targetLevel": "elementary"` | yes |
| `middle` | `"targetLevels": ["elementary", "middle"]` | **yes** (초등+중등) |
| `high` | `"targetLevels": ["elementary", "middle"]` | no |
| `elementary` | 필드 없음 / null | **no** |

값 공간 (FE 필터 value와 동일):

| 쿼리·item 코드 | UI 라벨 |
|----------------|---------|
| `elementary` | 초등학생 |
| `middle` | 중학생 |
| `high` | 고등학생 |
| `university` | 대학생 (`college` alias 허용) |
| `adult` | 성인 |

한글 라벨만 저장돼 있으면 목록 응답에서 **코드로 정규화**해 주세요. FE도 한글을 코드로 읽지만, 필터 쿼리는 **코드만** 보냅니다.

### 교육 대상 P0 수용 기준

- [ ] `targetLevel=middle` + `programType=TRAINED_TEACHER` 이면 중등이 포함된 프로그램만, `totalElements`가 그 건수
- [ ] `targetLevels: ["elementary","middle"]` 인 프로그램은 `elementary` 조회와 `middle` 조회 **둘 다** 포함
- [ ] 교육 대상 없는 프로그램은 해당 필터에서 제외 (전체 탭 필터 미선택 시에만 노출)
- [ ] `periodStatus`와 AND (예: 진행 중 카드 + 초등학생)
- [ ] 목록 item에 `targetLevel` 및/또는 `targetLevels`가 있어 셀이 `-`가 아님
- [ ] OpenAPI query `targetLevel` + 샘플

---

## 3. A — 목록 item 탑레벨 필드

UI 표시 형식은 FE 기준. BE는 **숫자·코드 raw**.  
기존 필드(`id`, `title`, `programType`, `periodStatus`, `lifecycleStatus`, `businessStartDate`, `businessEndDate`, …)에 아래를 **추가 또는 항상 채움**.

```json
{
  "id": 186005,
  "title": "2026년 신한은행 - JA Korea 청소년 경제금융프로그램",
  "programType": "TRAINED_TEACHER",
  "periodStatus": "IN_PROGRESS",
  "lifecycleStatus": "in_progress",
  "businessStartDate": "2025-12-08",
  "businessEndDate": "2026-12-30",

  "targetLevel": "elementary",
  "targetLevels": ["elementary"],

  "participantApprovedCount": 10,
  "participantCapacity": 30,

  "participatingSchoolCount": 12,
  "participatingStudentCount": 240
}
```

### 3.1 필드 규칙

| 필드 | 타입 | UI | 비고 |
|------|------|-----|------|
| `targetLevel` | string \| null | 교육 대상 | `elementary` / `middle` / `high` / `university` / `adult` (한글 라벨도 FE가 정규화). 복수면 `targetLevels` |
| `targetLevels` | string[] \| 생략 | 교육 대상 | 복수일 때. FE는 `[0]` 또는 합의된 단일 표기 |
| `participantApprovedCount` | int ≥ 0 \| 생략 | 참여자 모집 인원 분자 | 승인 인원. 없으면 FE는 `approvedOrganizationApplicationCount` → `applicantCount` 폴백 |
| `participantCapacity` | int ≥ 0 \| null | 참여자 모집 인원 분모 | **정원 미설정이면 `null`**. `rounds: []`로 대체하지 말 것. alias `participantRecruitmentCount` 허용 |
| `participatingSchoolCount` | int ≥ 0 \| null | 총 참여 학교 수 `N개` | **실제 참여 학교/기관 수**. alias `participatingOrganizationCount` 허용. **`organizationApplicationCount`와 혼동 금지** |
| `participatingStudentCount` | int ≥ 0 \| null | 총 참여 학생 수 `N명` | 없으면 `null` → UI `-` |
| `lifecycleStatus` | string | 전체 탭「프로그램 진행 현황」셀 | typed: `scheduled` \| `in_progress` \| `completed` 등. `periodStatus`와 **같은 제품 버킷** |
| `businessStartDate` / `businessEndDate` | date | 예정 탭「사업 운영 기간」 | FE는 `startDate`/`endDate` 폴백 |

### 3.2 폴백으로 쓰지 말 것

| 잘못된 매핑 | 이유 |
|-------------|------|
| `organizationApplicationCount` → 총 참여 학교 수 | 신청 건수. 시안「N개」와 의미가 다름 |
| 상세 `rounds[].capacity` 합만 제공, 목록은 빈 `rounds` | FE는 목록에서 상세를 치지 않음 |
| `periodStatus`만 주고 `lifecycleStatus` 생략 | 전체 탭 진행 현황 셀이 버킷 라벨만 보이게 됨 |

### 3.3 A 수용 기준

- [ ] `programType=TRAINED_TEACHER` 목록 item에 §3.1 필드가 탑레벨로 있다 (null 허용 필드는 키 생략 또는 `null`)
- [ ] 교육 대상·모집 인원·학교/학생 수를 채운 프로그램은 목록에서 `-`가 아니다
- [ ] `participatingSchoolCount` ≠ 기관 신청 건수(의미가 다를 때)
- [ ] OpenAPI `ProgramListItem` (또는 동등) + 샘플 응답
- [ ] GENERAL item 필드를 제거·rename 하지 않는다

---

## 4. B — 목록 쿼리 서버 필터

FE는 조회 버튼 후에 URL → (가능하면) 서버 쿼리로 목록을 다시 받습니다.  
지금은 `keyword` · `periodStatus` · `businessYear`만 보냅니다. 나머지는 **로드된 페이지 클라 필터**라 무한스크롤 `totalElements`와 UI 건수가 어긋납니다.

| 쿼리 | 위젯 | 의미 | 값 |
|------|------|------|-----|
| `keyword` | 전체 | 프로그램명 | 기존. 유지 |
| `periodStatus` | 카드 | 4카드 버킷 | 기존. `SCHEDULED` \| `IN_PROGRESS` \| `COMPLETED`. **전체 탭에서는 생략** |
| `targetLevel` | 전체 | 교육 대상 | `elementary` \| `middle` \| `high` \| `university` \| `adult` |
| `lifecycleStatus` 또는 `progressPhase` | **전체 탭만** | 테이블「프로그램 진행 현황」 | 아래 §4.1 |
| `operationStartDate` | **예정 탭만** | 사업 운영 기간 시작 | `YYYY-MM-DD` |
| `operationEndDate` | **예정 탭만** | 사업 운영 기간 종료 | `YYYY-MM-DD` |

### 4.1 전체 탭 진행 현황 필터 vs 위젯 `periodStatus`

두 축을 **한 파라미터로 합치지 말 것.**

| 축 | 파라미터 | 언제 |
|----|----------|------|
| 4카드 | `periodStatus` | 예정/진행/완료 카드 선택 시. 전체 카드는 없음 |
| 테이블 필터 | `lifecycleStatus` **또는** `progressPhase` | **전체 카드에서만** 추가 필터 |

권장 `progressPhase` (GENERAL 목록 필터와 동일 버킷):

| 값 | UI 라벨 | item `lifecycleStatus` 매칭 (권장) |
|----|---------|-------------------------------------|
| `scheduled` | 프로그램 진행 예정 | `scheduled`, `planned`, 모집 전 세분 값 |
| `in_progress` | 프로그램 진행 중 | `in_progress` |
| `completed` | 프로그램 진행 완료 | `completed` |

`lifecycleStatus` raw enum을 받더라도, 위 3버킷으로 매칭해야 합니다.

**금지:** 전체 탭에서 `progressPhase=scheduled`를 `periodStatus=SCHEDULED`로 바꿔 보내라고 FE에 요구하기 — 카드 선택과 테이블 필터가 충돌합니다.

### 4.2 사업 운영 기간 overlap

예정 탭 `operationStartDate` / `operationEndDate`:

- 프로그램 `[businessStartDate, businessEndDate]`(없으면 `startDate`/`endDate`)와 **구간이 겹치면** 포함
- 한쪽만 있으면 열린 구간
- 날짜 없는 프로그램은 제외

### 4.3 호출 예

```http
GET /api/admin/programs?programType=TRAINED_TEACHER&keyword=신한&targetLevel=elementary&progressPhase=in_progress&page=0&size=20

GET /api/admin/programs?programType=TRAINED_TEACHER&periodStatus=SCHEDULED&targetLevel=high&operationStartDate=2025-09-15&operationEndDate=2025-10-15&page=0&size=20
```

AND 결합. `totalElements` / `totalPages`는 **필터 적용 후** 건수.

### 4.4 B 수용 기준

- [ ] **`targetLevel` 쿼리 = §2.1 P0** (복수 `targetLevels` OR 매칭 · `totalElements` 일치)
- [ ] 전체 탭 `progressPhase`(또는 합의된 `lifecycleStatus`)가 `periodStatus`를 덮어쓰지 않음
- [ ] 예정 탭 기간 overlap이 `businessStartDate`~`businessEndDate` 기준
- [ ] 필터 조합 시 페이징이 빈 페이지·중복 행 없이 동작
- [ ] OpenAPI query params + 샘플

파라미터 이름을 `progressPhase`가 아니라 기존 `lifecycleStatus`로 통일하려면 FE에 회신해 주세요. FE는 합의된 키로 붙입니다.

---

## 5. 비범위

- 캘린더 뷰 이벤트 스키마
- 위젯 4카드 건수 1회화 (GENERAL 문서 B와 별건. TT도 필요하면 후속)
- 강사/봉사자 모집 인원 컬럼 (TT 목록 UI 없음)
- 참여자 유형 필터/컬럼 (TT 목록 UI 없음)

---

## 6. FE 반영 상태 (참고)

| 항목 | FE |
|------|-----|
| 위젯별 필터·컬럼 UI | 반영 (`columnPreset: 'trainedTeachers'`) |
| 목록 item 매핑 | `targetLevel` · `targetLevels` · 정원·학교/학생 수 매핑. **값이 없으면 `-`** |
| 교육 대상 조회 | URL `targetLevel` → GET. **클라 보조 필터 끔**. 헤더 건수 = `totalElements` |
| 전체 탭 진행 현황 | URL `lifecycleStatus` → GET `progressPhase`. `periodStatus`와 섞지 않음 |
| 예정 탭 기간 | URL `operationStartDate`/`operationEndDate` → GET (예정 카드만) |
| 학교 수 | `participatingSchoolCount` ?? `participatingOrganizationCount`. **신청 건수 폴백 없음** |
| 목록 상세 | 목록에서 상세 N+1 하지 않음 |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-09-22 | 초안 — TT 목록 위젯 컬럼 필드 + 서버 필터 |
| 2026-09-22 | **P0** 교육 대상 조회 실패 실측 · `targetLevels` OR 매칭 · FE가 `targetLevel` 쿼리를 보냄 |
| 2026-09-22 | BE 핸드오프 반영 — `progressPhase`·운영기간 서버 필터, 클라 보조 필터 제거, 학교 수 신청 건수 폴백 제거 |
