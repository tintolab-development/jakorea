# CMS 백엔드 검증 프롬프트

**대상:** JaKorea 백엔드 — 일반(GENERAL) 프로그램 · 기관 신청 학생명단  
**연계 FE 검증:** [`general-program-operation-period-and-student-roster-fe-verification.md`](./general-program-operation-period-and-student-roster-fe-verification.md)

**범위:**

- **A.** 사업 운영 기간(`business*`)과 모집 행별 프로그램 운영 기간(`operationStartDate` / `operationEndDate`) 독립 저장·조회·부분 PATCH
- **B.** 학생명단 수동 PUT vs Excel import의 `sourceFileObjectId` · `expectedRevisionNo` · revision 충돌
- **C.** (BE) 학년·반 필드 분리 응답 — 표시는 FE 책임, API는 `grade` / `className` SSOT 유지

**계약 SSOT:** `apps/cms/openapi/backend.openapi.json` (CMS가 소비하는 Admin API 스펙)

**실패 시 반드히 기록:**

- 요청 URL·메서드·전체 body (민감정보 마스킹)
- 응답 HTTP status·`error.code`·`traceId` / correlation id
- `programId`, `organizationApplicationId`, 모집 행 `recruitments[].id`
- DB 스냅샷(가능 시): `program` 사업 기간, `program_recruitment` 운영 기간, 학생명단 `revision_no`

---

## 사전 준비

1. **테스트 프로그램:** `programType`이 GENERAL(개인/기관)이며 참여자·강사·봉사자 모집 행이 각각 존재하는 `programId` 1건 이상.
2. **기관 신청:** 승인된 기관 신청 `organizationApplicationId` 1건 — 학생명단 GET/PUT/import 가능 상태.
3. **인증:** Admin CMS 동일 권한(프로그램 수정·기관 신청 학생명단).
4. **기준 일자(권장):** FE A-1과 동일 시나리오 재현용
   - 사업: `2026-01-01` ~ `2026-12-31`
   - PARTICIPANT 운영: `2026-03-01` ~ `2026-03-31`
   - INSTRUCTOR 운영: `2026-04-01` ~ `2026-04-30`
   - VOLUNTEER 운영: `2026-05-01` ~ `2026-05-31`

**주요 엔드포인트:**

| 용도 | 경로 |
|------|------|
| 프로그램 조회/수정 | `GET` / `PATCH` `/api/admin/programs/{programId}` |
| 학생명단 조회/수동 저장 | `GET` / `PUT` `/api/admin/organization-applications/{applicationId}/student-roster` |
| Excel·CSV 반영 | `POST` `/api/admin/organization-applications/{applicationId}/student-roster/import` |

**주요 스키마:**

- `ProgramUpdateRequest` — `startDate`/`endDate`, `businessStartDate`/`businessEndDate`, `recruitments[]`
- `ProgramRecruitmentRequest` / `ProgramRecruitmentResponse` — `recruitmentType`, `operationStartDate`, `operationEndDate`
- `StudentRosterCommitRequest` — `expectedRevisionNo`, `rows` (수동 편집 시 `sourceFileObjectId` 생략 가능)
- `StudentRosterImportFileRequest` — `sourceFileObjectId` **필수**
- `StudentRosterRowRequest` — `grade`, `className` 분리

---

## A. 사업 운영 기간 vs 모집별 운영 기간

### A-0. OpenAPI 계약 확인 (코드 리뷰·스펙)

**확인 항목:**

- `ProgramRecruitmentRequest` 설명: 항목에 `id` 또는 `applicationType`이 있으면 **행 단위 저장**, 요청에 없는 행은 그대로 둔다.
- 모집 행 응답에 `operationStartDate`, `operationEndDate`가 audience별로 독립 존재한다.
- `ProgramUpdateRequest`의 루트 `startDate`/`endDate`는 compatibility business start/end, `businessStartDate`/`businessEndDate`와 역할이 문서화되어 있다.

**기대:**

- 신규 API 필드 추가 없이(OpenAPI v9) 위 필드만으로 FE 분리 요구를 만족할 수 있다.
- `operationStartDate`/`operationEndDate`에 대한 **null vs 생략 vs 빈 문자열** 의미가 구현·문서와 일치한다. (권장: PATCH에서 **생략·null = 기존 값 유지**, 명시적 clear가 필요하면 별도 정책을 스펙에 고정)

---

### A-1. 초기 저장 후 GET 정합성

**절차:**

1. `PATCH /api/admin/programs/{programId}` 로 사업 기간과 세 audience 운영 기간을 A-1 값으로 설정(등록 API 또는 full PATCH).
2. `GET /api/admin/programs/{programId}` (또는 CMS가 쓰는 동일 상세 SSOT) 재조회.

**기대 결과:**

- `businessStartDate`/`businessEndDate`(또는 동등 필드) = `2026-01-01` ~ `2026-12-31`.
- `recruitments` 중 `PARTICIPANT` / `INSTRUCTOR` / `VOLUNTEER` 각각 `operationStartDate`/`operationEndDate`가 위 시나리오와 일치.
- 한 audience 운영 기간이 다른 audience 또는 사업 기간으로 **자동 동기화되지 않음**.

---

### A-2. 공통정보(사업 기간)만 PATCH

**절차:**

1. A-1 상태에서 `businessStartDate`/`businessEndDate`(또는 `startDate`/`endDate` only PATCH — FE가 보내는 shape와 동일하게)만 변경.
2. `recruitments` 배열을 **요청 body에 넣지 않거나**, 넣더라도 해당 audience 한 행만이 아닌 **사업 필드만** 변경하는 FE 계약을 따른 payload로 호출.
3. GET 재조회.

**기대 결과:**

- 세 모집 행의 `operationStartDate`/`operationEndDate` **변경 없음**.
- 사업 기간만 변경됨.

**실패 패턴(버그):**

- `recruitments`를 보내지 않았는데 다른 행 운영 기간이 null/기본값으로 초기화.
- 사업 기간 변경 시 서비스 레이어가 모든 recruitment operation을 business 기간으로 덮어씀.

---

### A-3. INSTRUCTOR 모집 행만 PATCH

**절차:**

1. A-1 상태에서 `recruitments: [{ id: <instructorRowId>, recruitmentType: "INSTRUCTOR", operationStartDate: "2026-06-01", operationEndDate: "2026-06-30", ... }]` 형태로 **강사 행만** 수정( FE는 `id`/`applicationType` 포함 행 단위 저장).
2. GET 재조회.

**기대 결과:**

- INSTRUCTOR `operation*` = `2026-06-01` ~ `2026-06-30`.
- PARTICIPANT·VOLUNTEER `operation*` = A-1 값 유지.
- `businessStartDate`/`businessEndDate` 및 루트 `startDate`/`endDate` = A-1 사업 기간 유지.

---

### A-4. 부분 PATCH — 다른 행 보존·루트 필드 비침범

**절차:**

- A-3 직후 요청/응답 로그와 DB에서 다음을 대조.

**기대 결과:**

- 요청 body에 **없는** recruitment 행은 DB·GET 모두 이전 `operation*` 유지.
- INSTRUCTOR만 보낸 PATCH가 루트 `startDate`/`endDate`/`businessStartDate`/`businessEndDate`를 변경하지 않음(요청에 해당 키가 없을 때).
- 동일 `recruitmentType` 활성 행이 2개 이상인 레거시 데이터에서는 `409 RECRUITMENT_ROW_ID_REQUIRED` 등 기존 계약이 유지됨.

---

### A-5. 프로그램 생성(등록 위저드) POST

**절차:**

- 생성 API(Admin 프로그램 create — 팀 표준 경로)로 사업 기간과 audience별 `operationStartDate`/`operationEndDate`를 **서로 다르게** 제출 후 생성된 `programId`로 GET.

**기대 결과:**

- 생성 직후 GET에서 A-1과 동일한 **독립 저장** 상태.
- 생성 시 한 audience operation을 business에 복사하는 로직이 **기본값으로만** 쓰이고, 명시적으로 다른 값을 넣으면 그 값이 우선.

---

### A-6. 레거시 데이터·백필

**절차:**

- 과거에 사업 기간과 모집 운영 기간이 **동일 값으로만** 저장된 프로그램 1건 GET.
- FE 분리 저장 후 다시 GET.

**기대 결과:**

- 백필 없이도 GET이 행별 `operation*`을 반환(없으면 null — FE seed 정책과 합의).
- 백필이 필요한 경우: 마이그레이션 범위·null 처리·Portal/CMS 목록 `operationStartDate` overlap 필터 영향을 문서화.

**Portal/목록 영향 (선택):**

- 일반 프로그램 목록 필터 `operationStartDate`/`operationEndDate`는 OpenAPI 설명상 **사업 기간 overlap** — 모집 행 운영 기간과 혼동하지 않도록 회귀 확인.

---

## B. 학생명단 저장

### B-0. OpenAPI 계약 확인

- `StudentRosterCommitRequest.sourceFileObjectId`: **수동 테이블 편집에서는 생략 가능**. Excel/CSV import API에서는 필수.
- `expectedRevisionNo`: GET의 `revisionNo`와 불일치 시 **409 `STUDENT_ROSTER_REVISION_CONFLICT`**, 저장 없음.
- PUT 400: 학생 명단 행 검증 실패 또는 **`sourceFileObjectId` 오류**.

---

### B-1. 수동 PUT — `sourceFileObjectId` 생략

**전제:** GET `StudentRosterResponse`에 `sourceFileObjectId`가 non-null (이전 import 이력).

**절차:**

```http
PUT /api/admin/organization-applications/{applicationId}/student-roster
```

```json
{
  "expectedRevisionNo": <GET.revisionNo>,
  "rows": [
    {
      "rosterId": <기존>,
      "studentName": "이서연",
      "birthDate": "2010-11-05",
      "grade": "초5",
      "className": "1반",
      "studentNo": 2,
      "gender": "female"
    }
  ]
}
```

**기대 결과:**

- **200** — `revisionNo` 증가(정책에 따른 bump).
- 응답 `rows[].rosterId` 안정적 유지(동일 행).
- `sourceFileObjectId`를 body에 넣지 않아도 성공.
- 서버가 GET에 노출된 과거 `sourceFileObjectId`를 **수동 PUT으로 재검증·재바인딩하지 않음**.

**부정 케이스:**

```json
{ "expectedRevisionNo": 1, "sourceFileObjectId": 999999, "rows": [ ... ] }
```

- **400** + `INVALID_VALUE`(또는 스펙에 정의된 code) — 관리자 소유·용도 불일치 파일 등.
- FE는 이 경로를 타지 않도록 이미 제외 — BE는 계약 유지.

---

### B-2. Revision 충돌

**절차:**

1. GET으로 `revisionNo = N` 확인.
2. 다른 세션에서 먼저 PUT 성공 → `revisionNo = N+1`.
3. 첫 세션에서 `expectedRevisionNo: N`으로 PUT 재시도.

**기대 결과:**

- **409**
- `error.code` = **`STUDENT_ROSTER_REVISION_CONFLICT`** (대소문자·wrapper 형태는 Admin API 공통 envelope와 일치).
- DB active 명단·`revision_no` **변경 없음**.
- 응답에 최신 `revisionNo`를 알 수 있는 정보가 있으면 FE refetch에 활용 가능(없어도 GET으로 충분).

**선택:** `expectedRevisionNo` 생략 시 저장 허용(구형 호환) — **낙관적 잠금 미적용**이 문서와 동일한지 확인.

---

### B-3. 학생 추가(전체 교체 PUT)

**절차:**

- 기존 모든 행 + 신규 행( `rosterId` 없음)을 `rows`에 포함, `expectedRevisionNo` 최신값.

**기대 결과:**

- 기존 `rosterId` 유지.
- 신규 행만 새 `rosterId` 부여.
- body에 `sourceFileObjectId` 없음.
- `participantId`, `masked*` 등 read-only 필드를 요청에 넣었을 때 **무시 또는 400** — 스펙·구현 일치 확인.

---

### B-4. Excel import 전용 파일 ID

**절차:**

1. Admin 파일 업로드 API로 학생명단 템플릿에 맞는 Excel/CSV 업로드 → `sourceFileObjectId` 확보.
2. `POST .../student-roster/import` body: `{ "sourceFileObjectId": <업로드 ID> }` 만 전송.
3. GET 재조회.

**기대 결과:**

- **200** — 행 반영, `revisionNo` 갱신, 응답 `sourceFileObjectId` = import에 사용한 파일 ID(정책상).
- GET에 있던 **이전** `sourceFileObjectId`를 import body에 넣지 않아도 됨 — 새 업로드 ID만 유효.
- 타인/Portal 업로드 파일 ID·잘못된 mime → **400** (검증 메시지·code 기록).

**부정:**

- 수동 PUT body에 import용 `sourceFileObjectId`만 바꿔 넣기 → B-1 부정과 동일 기대.

---

### B-5. 수동 PUT vs import 경계

| 동작 | `sourceFileObjectId` | `expectedRevisionNo` | `rows` |
|------|----------------------|----------------------|--------|
| 수동 PUT | 생략(권장·FE SSOT) | 권장 | 필수 |
| POST import | 필수 | (스펙에 없음) | (파일 파싱) |

**기대:**

- import가 실패해도 이전 active revision이 깨지지 않음(트랜잭션).
- import 성공 후 수동 PUT은 여전히 `sourceFileObjectId` 없이 가능.

---

## C. 학년·반 (BE)

FE가 출석·학생명단 UI에서 **반만** 표시하므로, BE는 다음만 보장한다.

### C-1. 응답 필드 분리

- `StudentRosterItemResponse`(및 출석·스케줄 관련 row DTO)에 `grade`, `className`이 **별도 필드**로 내려온다.
- `className`에 학년 문자열을 합쳐 넣지 않는다(예: `className: "1반"`, `grade: "초5"`).
- Excel import 파싱 시 학년·반 컬럼이 DB에 분리 저장된다.

### C-2. 하위 호환

- 레거시에 `className`만 `초5 1반` 형태로 들어간 row가 있으면 GET은 그대로 반환 — FE 파싱·표시 책임. (선택) 백필 스크립트 범위를 팀에 공유.

---

## 자동 테스트 (백엔드 권장)

프로젝트 표준(통합 테스트·`@SpringBootTest`·Testcontainers 등)에 맞춰 아래를 **API 계약 테스트**로 추가·실행한다. (경로·클래스명은 BE 레포 convention 따름)

| ID | 시나리오 | 최소 assertion |
|----|----------|----------------|
| A-IT-1 | 사업+3 audience operation 저장 후 GET | 3행 operation 상이, business 일치 |
| A-IT-2 | business만 PATCH | recruitment operation unchanged |
| A-IT-3 | INSTRUCTOR 행만 PATCH (`id` 포함) | PARTICIPANT/VOLUNTEER unchanged |
| A-IT-4 | `recruitments` 1행만 body | 나머지 행 DB count·operation unchanged |
| B-IT-1 | GET에 sourceFileObjectId 있는 상태 수동 PUT without field | 200, rosterId stable |
| B-IT-2 | PUT with invalid sourceFileObjectId | 400 INVALID_VALUE(또는 contract code) |
| B-IT-3 | stale expectedRevisionNo | 409 STUDENT_ROSTER_REVISION_CONFLICT, no data change |
| B-IT-4 | POST import with admin upload id | 200, rows from file, revision bump |
| B-IT-5 | import with wrong file owner/type | 400 |

**기대:** CI에서 위 스위트 PASS. 실패 시 테스트명·assert 메시지·관련 서비스 클래스 기록.

---

## 완료 체크리스트

- [ ] A-0 OpenAPI·null/omit 정책 확인
- [ ] A-1 초기 저장 GET 정합성
- [ ] A-2 사업 기간만 PATCH — 모집 operation 보존
- [ ] A-3 INSTRUCTOR만 PATCH — 타 audience·사업 보존
- [ ] A-4 부분 PATCH·루트 필드 비침범
- [ ] A-5 생성 POST 독립 operation
- [ ] A-6 레거시·백필·목록 필터 영향 검토
- [ ] B-0 학생명단 스키마·409 계약 확인
- [ ] B-1 수동 PUT `sourceFileObjectId` 생략 성공
- [ ] B-1 부정 — 수동 PUT에 잘못된 `sourceFileObjectId` → 400
- [ ] B-2 `STUDENT_ROSTER_REVISION_CONFLICT`
- [ ] B-3 추가 행 `rosterId` 안정성
- [ ] B-4 import 전용 파일 ID·검증
- [ ] B-5 PUT/import 경계
- [ ] C-1 `grade` / `className` 분리 응답
- [ ] 권장 통합 테스트 스위트 PASS

---

## FE ↔ BE 역할 분리

| 항목 | BE | FE |
|------|----|----|
| audience별 operation 저장 | `program_recruitment` 행 SSOT | 모집 탭별 PATCH payload |
| 사업 기간 | `business*` / compatibility dates | 공통정보 탭만 변경 시 recruitment 미전송 |
| 수동 명단 | PUT without `sourceFileObjectId` 허용 | body에서 항상 제외 |
| Excel | POST import only | 업로드 파일 ID만 import |
| 반 표시 | `className` 분리 저장·반환 | UI에서 반만 렌더 |

---

## 수정 시 원칙

1. OpenAPI 설명·FE adapter와 **먼저** 불일치 원인 정리.
2. GENERAL·UJAT·타 프로그램 유형 간 regression — `ProgramRecruitmentRequest` 행 단위 저장이 타 유형에 영향 없는지 확인.
3. 수정 후 위 체크리스트 + FE vitest 묶음(연계 문서) 재실행 요청.

**FE 릴리스 묶음 (등록 위저드·운영기간·명단):**

- 수동 QA 매트릭스: [`general-program-operation-period-and-student-roster-fe-verification.md`](./general-program-operation-period-and-student-roster-fe-verification.md) § 등록 위저드
- 자동: FE 문서 § 자동 테스트 + `registration-payload-smoke.test.ts`, `cms-select.test.ts`, catalog-ready/bridge 테스트

**Document version:** 2026-10-14 (FE 릴리스 cross-link)
