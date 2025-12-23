## JAKorea CMS Mock 기반 API 명세 (Base Version)

> 이 문서는 현재 CMS 프론트엔드 코드(`entities/*/api`, `entities/*/model`, `data/mock/*`, `types/domain.ts`)와  
> `MVP_ROADMAP.md` / `MVP_ROADMAP_V2.md` / `MVP_ROADMAP_V3.md` 에 정의된 **Phase 1~4 기본 기능**을 기준으로 한  
> **실제 Mock 서비스와 1:1로 매핑 가능한 API 스펙**입니다.

---

## 0. 공통 규칙

- **Base URL**: `/api`
- **형식**
  - Request / Response Body: `application/json`
  - 날짜/시간: ISO 8601 문자열 (예: `"2025-01-20T10:00:00.000Z"`)
- **에러 처리 (공통 가이드)**
  - `404 Not Found`: 리소스 미존재
  - `400 Bad Request`: 유효성 오류(Zod 스키마 위반 등)
  - `500 Internal Server Error`: 예기치 못한 서버 오류

### 0.1 공통 타입 (요약)

- `UUID`: 문자열
- `Status`: `'active' | 'inactive' | 'pending' | 'completed' | 'cancelled'`
- `DateValue`: ISO 문자열

도메인 전체 정의는 `apps/cms/src/types/domain.ts` 참고.

---

## 1. 스폰서(Sponsor) API

- 도메인 타입: `Sponsor` (`types/domain.ts`)
- Mock 서비스: `entities/sponsor/api/sponsor-service.ts`

리소스 경로: `/api/sponsors`

### 1.1 목록 조회

- **GET** `/api/sponsors`
- **Query**
  - (현재 Mock 기준: 없음, 추후 `name` 검색 등 확장 가능)
- **Response** `200 OK`

```json
[
  {
    "id": "sponsor-001",
    "name": "기업 A",
    "description": "설명",
    "contactInfo": "연락처",
    "securityMemo": "보안 메모",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-02T00:00:00.000Z"
  }
]
```

### 1.2 단건 조회

- **GET** `/api/sponsors/{id}`
- **Response**
  - `200 OK` + `Sponsor`
  - `404 Not Found`

### 1.3 생성

- **POST** `/api/sponsors`
- **Request Body**

```json
{
  "name": "기업 A",
  "description": "설명(선택)",
  "contactInfo": "연락처(선택)",
  "securityMemo": "보안 메모(선택)"
}
```

- **Response** `201 Created`
  - Body: 생성된 `Sponsor` 전체 (`id`, `createdAt`, `updatedAt` 포함)

### 1.4 수정

- **PATCH** `/api/sponsors/{id}`
- **Request Body**
  - `Partial<Sponsor>` (단, `id`, `createdAt` 수정 불가)
- **Response** `200 OK` + 갱신된 `Sponsor`

### 1.5 삭제

- **DELETE** `/api/sponsors/{id}`
- **Response** `204 No Content`

---

## 2. 학교(School) API

- 도메인 타입: `School`
- Mock 서비스: `entities/school/api/school-service.ts`

리소스 경로: `/api/schools`

### 2.1 목록 조회

- **GET** `/api/schools`
- **Query**
  - (필요 시 `region` 필터 등 확장 가능)
- **Response** `200 OK`

```json
[
  {
    "id": "school-001",
    "name": "○○중학교",
    "region": "서울",
    "address": "주소",
    "contactPerson": "담당자",
    "contactPhone": "010-0000-0000",
    "contactEmail": "teacher@example.com",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-02T00:00:00.000Z"
  }
]
```

### 2.2 단건 조회

- **GET** `/api/schools/{id}`

### 2.3 생성

- **POST** `/api/schools`

```json
{
  "name": "○○중학교",
  "region": "서울",
  "address": "주소(선택)",
  "contactPerson": "담당자명",
  "contactPhone": "연락처(선택)",
  "contactEmail": "이메일(선택)"
}
```

### 2.4 수정 / 2.5 삭제

- **PATCH** `/api/schools/{id}`
- **DELETE** `/api/schools/{id}`

---

## 3. 강사(Instructor) API

- 도메인 타입: `Instructor`
- Mock 서비스: `entities/instructor/api/instructor-service.ts`
- 폼 스키마: `entities/instructor/model/schema.ts`

리소스 경로: `/api/instructors`

### 3.1 목록 조회

- **GET** `/api/instructors`
- **Query (향후 확장)**: `region`, `specialty`, `ratingMin` 등
- **Response**: `Instructor[]`

### 3.2 단건 조회

- **GET** `/api/instructors/{id}`

### 3.3 생성

- **POST** `/api/instructors`

```json
{
  "name": "강사명",
  "contactPhone": "010-0000-0000",
  "contactEmail": "test@example.com",
  "region": "서울",
  "specialty": ["리더십", "진로"],
  "availableTime": "주중 오후",
  "experience": "경력 설명",
  "rating": 4.5,
  "bankAccount": "은행/계좌번호"
}
```

- **Response**: 생성된 `Instructor`

### 3.4 수정 / 3.5 삭제

- **PATCH** `/api/instructors/{id}`
- **DELETE** `/api/instructors/{id}`

---

## 4. 프로그램(Program) & 회차(ProgramRound) API

- 도메인 타입: `Program`, `ProgramRound`
- Mock 서비스: `entities/program/api/program-service.ts`
- 폼 스키마: `entities/program/model/schema.ts`

리소스 경로: `/api/programs`

### 4.1 목록 조회

- **GET** `/api/programs`
- **Query (추천)**
  - `sponsorId?: UUID`
  - `status?: Status`
  - `category?: 'school' | 'individual'`

- **Response**: `Program[]`

```json
{
  "id": "prog-001",
  "sponsorId": "sponsor-001",
  "title": "청소년 리더십 워크샵",
  "type": "offline",
  "format": "workshop",
  "category": "school",
  "description": "설명",
  "rounds": [
    {
      "id": "prog-001-round-1",
      "programId": "prog-001",
      "roundNumber": 1,
      "startDate": "2025-02-01T00:00:00.000Z",
      "endDate": "2025-02-03T00:00:00.000Z",
      "capacity": 30,
      "status": "active"
    }
  ],
  "startDate": "2025-02-01T00:00:00.000Z",
  "endDate": "2025-03-01T00:00:00.000Z",
  "status": "active",
  "settlementRuleId": "rule-001",
  "applicationPathId": "path-001",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-05T00:00:00.000Z"
}
```

### 4.2 단건 조회

- **GET** `/api/programs/{id}`

### 4.3 생성

- **POST** `/api/programs`

요청 스키마: `ProgramFormData` + `rounds: ProgramRoundFormData[]`

```json
{
  "sponsorId": "sponsor-001",
  "title": "프로그램명",
  "type": "online",
  "format": "seminar",
  "description": "설명(선택)",
  "startDate": "2025-02-01T00:00:00.000Z",
  "endDate": "2025-03-01T00:00:00.000Z",
  "status": "active",
  "settlementRuleId": "rule-001",
  "applicationPathId": "path-001",
  "rounds": [
    {
      "roundNumber": 1,
      "startDate": "2025-02-01T00:00:00.000Z",
      "endDate": "2025-02-03T00:00:00.000Z",
      "capacity": 30,
      "status": "active"
    }
  ]
}
```

서버는 각 회차에 `id`, `programId`를 부여하고 `createdAt`, `updatedAt`을 설정.

### 4.4 수정

- **PATCH** `/api/programs/{id}`
- **Request Body**
  - `Partial<Omit<Program, 'id' | 'createdAt'>>`

### 4.5 삭제

- **DELETE** `/api/programs/{id}`

### 4.6 회차 단건 수정

- **PATCH** `/api/programs/{programId}/rounds/{roundId}`
- **Request Body**
  - `Partial<Omit<ProgramRound, 'id' | 'programId'>>`
- **Response**
  - 갱신된 `ProgramRound`

---

## 5. 신청(Application) API

- 도메인 타입: `Application`
- Mock 서비스: `entities/application/api/application-service.ts`
- 폼 스키마: `entities/application/model/schema.ts`
- Mock 데이터: `data/mock/applications.ts`

리소스 경로: `/api/applications`

### 5.1 목록 조회

- **GET** `/api/applications`
- **Query (예시)**
  - `status?: 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'cancelled'`
  - `programId?: UUID`
  - `subjectType?: 'school' | 'student' | 'instructor'`

- **Response**: `Application[]`

```json
{
  "id": "app-001",
  "programId": "prog-001",
  "roundId": "prog-001-round-1",
  "subjectType": "school",
  "subjectId": "school-001",
  "status": "submitted",
  "notes": "신청 메모",
  "submittedAt": "2025-01-10T10:00:00.000Z",
  "reviewedAt": "2025-01-11T10:00:00.000Z",
  "createdAt": "2025-01-09T10:00:00.000Z",
  "updatedAt": "2025-01-11T10:00:00.000Z"
}
```

### 5.2 단건 조회

- **GET** `/api/applications/{id}`

### 5.3 생성 (신청 접수)

- **POST** `/api/applications`

```json
{
  "programId": "prog-001",
  "roundId": "prog-001-round-1",
  "subjectType": "school",
  "subjectId": "school-001",
  "status": "submitted",
  "notes": "메모(선택)"
}
```

- 서버에서 `id`, `submittedAt`, `createdAt`, `updatedAt` 자동 생성.

### 5.4 일반 수정

- **PATCH** `/api/applications/{id}`
- **Request Body**
  - `Partial<Omit<Application, 'id' | 'createdAt'>>`
  - `status` 변경 시:
    - 기존 status와 다르면 `reviewedAt`를 현재 시각으로 갱신

### 5.5 상태만 변경 (전용 엔드포인트)

- **PATCH** `/api/applications/{id}/status`

```json
{
  "status": "approved"
}
```

- **Response**: 갱신된 `Application`

### 5.6 삭제

- **DELETE** `/api/applications/{id}`

---

## 6. 일정(Schedule) API

- 도메인 타입: `Schedule`
- Mock 서비스: `entities/schedule/api/schedule-service.ts`
- 폼 스키마: `entities/schedule/model/schema.ts`
- Mock 데이터: `data/mock/schedules.ts`

리소스 경로: `/api/schedules`

### 6.1 목록 조회

- **GET** `/api/schedules`
- **Query (예시)**
  - `programId?: UUID`
  - `instructorId?: UUID`
  - `from?: DateValue`
  - `to?: DateValue`

- **Response**: `Schedule[]`

### 6.2 기간별 조회 (캘린더 뷰용)

- **GET** `/api/schedules/range`
- **Query**
  - `startDate` (필수, ISO)
  - `endDate` (필수, ISO)

- **Response**
  - 해당 기간(`date` 기준)이 `startDate~endDate` 사이인 일정 배열

### 6.3 단건 조회

- **GET** `/api/schedules/{id}`

### 6.4 생성

- **POST** `/api/schedules`

```json
{
  "programId": "prog-001",
  "roundId": "prog-001-round-1",
  "title": "1차 강의",
  "date": "2025-02-01",
  "startTime": "10:00",
  "endTime": "12:00",
  "location": "서울 ○○중",
  "onlineLink": "https://example.com",
  "instructorId": "instructor-001"
}
```

- **Response**: 생성된 `Schedule` (`id`, `createdAt`, `updatedAt` 포함)

### 6.5 수정

- **PATCH** `/api/schedules/{id}`
- **Request Body**
  - `Partial<Omit<Schedule, 'id' | 'createdAt'>>`

### 6.6 삭제

- **DELETE** `/api/schedules/{id}`

### 6.7 중복 일정 체크 (동일 강사 동일 시간대)

- **POST** `/api/schedules/check-conflict`

```json
{
  "programId": "prog-001",
  "roundId": "prog-001-round-1",
  "title": "1차 강의",
  "date": "2025-02-01",
  "startTime": "10:00",
  "endTime": "12:00",
  "location": "서울 ○○중",
  "onlineLink": null,
  "instructorId": "instructor-001",
  "excludeId": "schedule-123"
}
```

- **Response** `200 OK`

```json
[
  {
    "id": "schedule-0001",
    "programId": "prog-001",
    "roundId": "prog-001-round-1",
    "title": "기존 일정",
    "date": "2025-02-01",
    "startTime": "10:30",
    "endTime": "11:30",
    "location": "서울 ○○중",
    "instructorId": "instructor-001",
    "createdAt": "2025-01-01T10:00:00.000Z",
    "updatedAt": "2025-01-02T10:00:00.000Z"
  }
]
```

→ 빈 배열이면 충돌 없음.

---

## 7. 강사 매칭(Matching) API

- 도메인 타입: `Matching`, `MatchingHistory`
- Mock 서비스: `entities/matching/api/matching-service.ts`
- Mock 데이터: `data/mock/matchings.ts`

리소스 경로: `/api/matchings`

### 7.1 목록 조회

- **GET** `/api/matchings`
- **Query (필터)**
  - `programId?: UUID`
  - `roundId?: UUID`
  - `instructorId?: UUID`
  - `status?: Status`

- **Response**: `Matching[]`

```json
{
  "id": "match-001",
  "programId": "prog-001",
  "roundId": "prog-001-round-1",
  "instructorId": "instructor-001",
  "scheduleId": "schedule-001",
  "status": "active",
  "matchedAt": "2025-01-10T10:00:00.000Z",
  "cancelledAt": null,
  "cancellationReason": null,
  "history": [
    {
      "id": "match-001-history-1",
      "matchingId": "match-001",
      "action": "created",
      "previousValue": null,
      "newValue": null,
      "changedBy": null,
      "changedAt": "2025-01-10T10:00:00.000Z"
    }
  ],
  "createdAt": "2025-01-09T10:00:00.000Z",
  "updatedAt": "2025-01-10T10:00:00.000Z"
}
```

### 7.2 단건 조회

- **GET** `/api/matchings/{id}`

### 7.3 생성

- **POST** `/api/matchings`

```json
{
  "programId": "prog-001",
  "roundId": "prog-001-round-1",
  "instructorId": "instructor-001",
  "scheduleId": "schedule-001",
  "status": "pending"
}
```

- **Response**: 생성된 `Matching` (`history` 1건 포함)

### 7.4 수정

- **PATCH** `/api/matchings/{id}`

```json
{
  "status": "completed"
}
```

- 서버는 `updatedAt`와 `history`를 자동으로 갱신.

### 7.5 삭제

- **DELETE** `/api/matchings/{id}`

### 7.6 매칭 확정

- **POST** `/api/matchings/{id}/confirm`
- **동작**
  - 내부적으로 `status: 'active'`로 `update`

### 7.7 매칭 취소

- **POST** `/api/matchings/{id}/cancel`

```json
{
  "reason": "강사 일정 변경"
}
```

- **동작**
  - `status: 'cancelled'`
  - `cancelledAt`, `cancellationReason` 설정
  - `history`에 취소 이력 추가

---

## 8. 정산(Settlement) API

- 도메인 타입: `Settlement`, `SettlementItem`
- Mock 서비스: `entities/settlement/api/settlement-service.ts`
- Mock 데이터: `data/mock/settlements.ts`
- Phase 4.1 기준: 기본 CRUD + totalAmount 자동 계산

리소스 경로: `/api/settlements`

### 8.1 목록 조회

- **GET** `/api/settlements`
- **Query (예시)**
  - `period?: string` (`"2025-01"` 형태)
  - `programId?: UUID`
  - `instructorId?: UUID`
  - `status?: 'pending' | 'calculated' | 'approved' | 'paid' | 'cancelled'`

- **Response**: `Settlement[]`

### 8.2 단건 조회

- **GET** `/api/settlements/{id}`

### 8.3 생성

- **POST** `/api/settlements`

```json
{
  "programId": "prog-001",
  "instructorId": "instructor-001",
  "matchingId": "match-001",
  "period": "2025-01",
  "items": [
    { "type": "instructor_fee", "description": "강사비", "amount": 300000 },
    { "type": "transportation", "description": "교통비", "amount": 20000 }
  ],
  "status": "pending",
  "notes": "메모(선택)",
  "approvalHistories": []
}
```

- 서버 처리
  - `totalAmount` = `items.amount` 합계
  - `id`, `createdAt`, `updatedAt` 생성

### 8.4 수정

- **PATCH** `/api/settlements/{id}`
- **Request Body**
  - `Partial<Omit<Settlement, 'id' | 'createdAt'>>`
  - `items` 변경 시 `totalAmount` 재계산

### 8.5 삭제

- **DELETE** `/api/settlements/{id}`

---

## 9. 신청 경로(ApplicationPath) API (기본)

> V3 Phase 7에서 정의된 신청 경로 타입.  
> 현재 Mock 구조상 `data/mock/application-paths.ts`와 `types/domain.ts`에 정의되어 있으며,  
> 서비스 레이어는 간단한 CRUD 기준으로 설계한다.

리소스 경로: `/api/application-paths`

### 9.1 목록 조회

- **GET** `/api/application-paths`
- **Query**
  - `programId?: UUID`
  - `isActive?: boolean`

### 9.2 단건 조회

- **GET** `/api/application-paths/{id}`

### 9.3 생성

- **POST** `/api/application-paths`

```json
{
  "programId": "prog-001",
  "pathType": "google_form",
  "googleFormUrl": "https://forms.gle/xxxx",
  "guideMessage": "신청 안내 문구",
  "isActive": true
}
```

### 9.4 수정

- **PATCH** `/api/application-paths/{id}`

### 9.5 삭제

- **DELETE** `/api/application-paths/{id}`

---

## 10. 보고서(Report) API

- 도메인 타입: `Report`, `ReportField` 등
- Mock 서비스: `entities/report/api/report-service.ts`
- Mock 메타 데이터: `data/mock/reports.ts` (필드 정의, 가이드 등)

리소스 경로: `/api/reports`

### 10.1 보고서 제출

- **POST** `/api/reports`
- **Request Body** (`SubmitReportRequest`)

```json
{
  "type": "lecture", // 'lecture' | 'volunteer' | 'program'
  "activityId": "activity-001", // 강의/봉사 활동 ID (type에 따라 필수)
  "programId": "prog-001", // 프로그램 보고서일 경우
  "fields": {
    "title": "강의 요약",
    "participants": 30,
    "satisfaction": 4.5
  }
}
```

- 서버 처리
  - `Date` 타입 값이 들어오면 ISO 문자열로 변환
  - `id`, `submittedAt`, `createdAt`, `updatedAt` 생성

### 10.2 보고서 단건 조회

- **GET** `/api/reports/{id}`

### 10.3 보고서 목록 조회

- **GET** `/api/reports`
- **Query (예시)**
  - `type?: ReportType`
  - `programId?: UUID`
  - `activityId?: UUID`

---

## 11. To-do / 마이페이지 / 활동(Activity) (요약)

> 이 영역은 주로 **사용자 화면**을 위한 Mock 데이터이며,  
> CMS에서는 직접적인 CRUD보다는 조회 전용 API로 사용될 가능성이 큼.  
> 자세한 UI 요건은 `MVP_ROADMAP_V2.md` / `V3.md`의 Phase 5 및 `mypage.ts`, `todos.ts`, `activities.ts` 참고.

### 11.1 To-do

- **GET** `/api/todos?userId={userId}`
- **PATCH** `/api/todos/{id}`
  - `completed`, `completedAt` 갱신

### 11.2 마이페이지 요약

- **GET** `/api/mypage/summary?userId={userId}`
  - `primaryStatus`, `todos`, `upcomingSchedules`, `historySummary` 등 반환

### 11.3 활동(강의/봉사 Activity)

- **GET** `/api/activities/lectures`
- **GET** `/api/activities/volunteers`
- **GET** `/api/activities/{id}`

> 위 11번 섹션은 Base 버전에서는 **참고용**이며,  
> 실제 구현/스펙 디테일은 Extended 버전(`API_SPEC_MOCK_BASED_EXTENDED.md`)에서 더 구체화된다.


