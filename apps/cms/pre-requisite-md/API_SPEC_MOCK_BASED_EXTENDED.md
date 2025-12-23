## JAKorea CMS Mock 기반 API 명세 (Extended Version)

> 이 문서는 `API_SPEC_MOCK_BASED.md`의 **기본 Mock 호환 스펙**을 확장하여,  
> `MVP_ROADMAP_V2.md` / `MVP_ROADMAP_V3.md` 에 정의된 Phase 4.2 ~ Phase 11까지의  
> **신규/고도화 요구사항을 모두 포함한 API 설계 초안**입니다.  
> 실제 백엔드 구현 시, 여기서 정의된 엔드포인트 중 우선순위를 논의하여 MVP → 확장 순으로 단계적 구현을 권장합니다.

---

## 0. 전제 및 네이밍 규칙

- Base 스펙 (`API_SPEC_MOCK_BASED.md`)에 있는 엔드포인트는 그대로 유지합니다.
- Extended 버전은 **주로 추가 엔드포인트/파라미터/응답 필드**를 정의합니다.
- Base와 중복되는 내용은 간단히 “Base 참조”로 표기합니다.

### 0.1 상태/역할 관련 공통 원칙 (사용자 화면 프롬프트 기반)

`MVP_ROADMAP_V2.md` / `V3.md`의 공통 UI 원칙을 API 관점에 맞게 정리:

- **상태는 Enum 기반으로만 전달**하고, 프론트는 이 Enum을 그대로 **문장/문구로 매핑**해야 함.
- **서버가 상태를 결정**하고, 프론트는 절대 Enum을 추론/생성하지 않음.
- `reason_public`은 의미 변경/요약 없이 그대로 노출해야 하므로, API에서 별도 필드로 제공.
- CTA 대상 URL은 `targetUrl`로 서버에서 내려주고, 프론트는 **경로만 사용**(의미 판단 X).

---

## 1. 정산 관리 고도화 (Phase 4.2)

> V3: Phase 4.2 “정산 관리 고도화”  
> - 월별 정산, 강사별 정산 상세, 지급조서 생성/다운로드, 승인 워크플로우, 1419 룰 반영 등

Base의 `/api/settlements` 스펙을 확장합니다.

### 1.1 월별 정산 목록

- **GET** `/api/settlements/monthly`
- **Query**
  - `year`: 숫자 (예: `2025`)
  - `month`: 숫자 (1~12)
  - `programId?: UUID`

- **Response** `200 OK`

```json
{
  "year": 2025,
  "month": 1,
  "summary": {
    "totalSettlements": 35,
    "totalAmount": 123456789,
    "byStatus": {
      "pending": 5,
      "calculated": 10,
      "approved": 8,
      "paid": 10,
      "cancelled": 2
    }
  },
  "items": [
    {
      "id": "settle-001",
      "programId": "prog-001",
      "instructorId": "instructor-001",
      "matchingId": "match-001",
      "period": "2025-01",
      "items": [
        { "type": "instructor_fee", "description": "강사비", "amount": 300000 },
        { "type": "transportation", "description": "교통비", "amount": 20000 }
      ],
      "totalAmount": 320000,
      "status": "approved",
      "documentGeneratedAt": "2025-01-15T10:00:00.000Z",
      "createdAt": "2025-01-10T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

### 1.2 강사별 정산 상세

- **GET** `/api/settlements/instructor/{instructorId}`
- **Query**
  - `period?: string` (`"2025-01"` 등)
  - `programId?: UUID`

- **Response**

```json
{
  "instructorId": "instructor-001",
  "summary": {
    "totalAmount": 1500000,
    "settlementCount": 5,
    "byStatus": {
      "pending": 1,
      "calculated": 1,
      "approved": 1,
      "paid": 2,
      "cancelled": 0
    }
  },
  "settlements": [
    {
      "id": "settle-001",
      "programId": "prog-001",
      "matchingId": "match-001",
      "period": "2025-01",
      "items": [
        { "type": "instructor_fee", "description": "강사비", "amount": 300000 },
        { "type": "transportation", "description": "교통비", "amount": 20000 }
      ],
      "totalAmount": 320000,
      "status": "paid",
      "documentGeneratedAt": "2025-01-15T10:00:00.000Z",
      "createdAt": "2025-01-10T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

### 1.3 정산 산출 규칙 설정 (1419 룰 포함)

> 규칙 자체는 향후 별도 엔티티로 관리하는 것을 전제로, 1차 스펙만 정의.

- **리소스 경로**: `/api/settlement-rules`

#### 1.3.1 규칙 목록

- **GET** `/api/settlement-rules`
- **Query**
  - `programId?: UUID`

```json
[
  {
    "id": "rule-001",
    "name": "기본 강사료 규칙",
    "programId": "prog-001",
    "baseInstructorFee": 300000,
    "transportationRule": {
      "enabled": true,
      "distanceThresholdKm": 60,
      "amountPerKm": 500
    },
    "accommodationRule": {
      "enabled": true,
      "policy": "실비",
      "maxAmountPerNight": 150000
    },
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-02T00:00:00.000Z"
  }
]
```

#### 1.3.2 규칙 생성/수정/삭제

- **POST** `/api/settlement-rules`
- **PATCH** `/api/settlement-rules/{id}`
- **DELETE** `/api/settlement-rules/{id}`

> 실제 구현 시, 1419 사업 특수 규칙은 `transportationRule`, `accommodationRule` 하위 필드로 상세 정의.

### 1.4 지급조서 생성/미리보기/다운로드

#### 1.4.1 지급조서 미리보기

- **GET** `/api/settlements/{id}/payslip/preview`

- **Response**

```json
{
  "settlementId": "settle-001",
  "instructor": {
    "name": "홍길동",
    "phone": "010-0000-0000",
    "bankAccountMasked": "국민은행 123-****-****-00",
    "residentIdMasked": "800101-1******"
  },
  "program": {
    "title": "청소년 리더십 워크샵",
    "period": "2025-01"
  },
  "items": [
    { "type": "instructor_fee", "description": "강사비", "amount": 300000 },
    { "type": "transportation", "description": "교통비", "amount": 20000 }
  ],
  "totalAmount": 320000,
  "consent": {
    "personalInfoAgreed": true,
    "agreedAt": "2025-01-09T10:00:00.000Z"
  }
}
```

#### 1.4.2 지급조서 PDF 다운로드

- **GET** `/api/settlements/{id}/payslip/download`
- **Query**
  - `format=pdf` (기본값), 추후 `excel` 옵션 가능
- **Response**
  - `200 OK` + `application/pdf` 바이너리 스트림

> Mock 환경에서는 단순한 dummy PDF 또는 JSON 응답으로 대체 가능.

### 1.5 정산 승인 워크플로우

#### 1.5.1 상태 전이 액션

- **POST** `/api/settlements/{id}/actions`

```json
{
  "action": "approve",              // 'submit' | 'calculate' | 'approve' | 'reject' | 'pay' | 'cancel'
  "comment": "승인합니다.",
  "actorId": "user-001"
}
```

- **서버 처리**
  - `status` 전이 (`pending`→`calculated`→`approved`→`paid` 등)
  - `approvalHistories`에 이력 push

- **Response**: 갱신된 `Settlement`

---

## 2. 공문 관리 (Phase 6)

> 공문 생성/관리, 템플릿, PDF/Word 다운로드

### 2.1 공문(Doc) 도메인 개요

```json
{
  "id": "doc-001",
  "title": "2025년 1분기 프로그램 안내 공문",
  "schoolId": "school-001",
  "programIds": ["prog-001", "prog-002"],
  "templateId": "tpl-001",
  "body": "공문 본문 HTML 또는 Markdown",
  "status": "draft", // 'draft' | 'sent' | 'archived'
  "sentAt": "2025-01-10T10:00:00.000Z",
  "createdAt": "2025-01-01T10:00:00.000Z",
  "updatedAt": "2025-01-05T10:00:00.000Z"
}
```

### 2.2 공문 목록/조회

- **GET** `/api/docs`
- **Query**
  - `schoolId?: UUID`
  - `programId?: UUID`
  - `status?: 'draft' | 'sent' | 'archived'`

- **GET** `/api/docs/{id}`

### 2.3 공문 생성/수정/삭제

- **POST** `/api/docs`

```json
{
  "title": "2025년 1분기 프로그램 안내 공문",
  "schoolId": "school-001",
  "programIds": ["prog-001", "prog-002"],
  "templateId": "tpl-001",
  "body": "공문 본문 내용",
  "status": "draft"
}
```

- **PATCH** `/api/docs/{id}`
- **DELETE** `/api/docs/{id}`

### 2.4 공문 템플릿 관리

- **리소스 경로**: `/api/doc-templates`

#### 2.4.1 템플릿 목록/조회

- **GET** `/api/doc-templates`
- **GET** `/api/doc-templates/{id}`

#### 2.4.2 템플릿 생성/수정/삭제

- **POST** `/api/doc-templates`
- **PATCH** `/api/doc-templates/{id}`
- **DELETE** `/api/doc-templates/{id}`

### 2.5 공문 미리보기/다운로드

- **GET** `/api/docs/{id}/preview`
  - 렌더링용 HTML/Markdown 반환
- **GET** `/api/docs/{id}/download?format=pdf|docx`
  - 공문 PDF/Word 다운로드

---

## 3. 신청 경로 관리 (Phase 7)

> Base의 `ApplicationPath` API를 확장.

### 3.1 프로그램별 신청 경로 설정

- **GET** `/api/programs/{programId}/application-path`
  - 해당 프로그램의 활성화된 신청 경로 0~1개 반환

- **PUT** `/api/programs/{programId}/application-path`

```json
{
  "pathType": "google_form",      // 'google_form' | 'internal'
  "googleFormUrl": "https://forms.gle/xxxx",
  "guideMessage": "신청 안내 문구",
  "isActive": true
}
```

### 3.2 구글폼 링크 관리

- **GET** `/api/application-paths/google-forms`
- **POST** `/api/application-paths/google-forms`
- **PATCH** `/api/application-paths/google-forms/{id}`
- **DELETE** `/api/application-paths/google-forms/{id}`

> 실제 구현에서는 일반 `application-paths`와 동일 리소스를 사용하되, `pathType='google_form'`으로 필터링.

---

## 4. 일정 협의 관리 (Phase 8)

> 학교별 일정 협의, 학사일정 참고용 캘린더, 일정 제안/승인

### 4.1 일정 협의(Proposal) 도메인 예시

```json
{
  "id": "proposal-001",
  "schoolId": "school-001",
  "programId": "prog-001",
  "roundId": "prog-001-round-1",
  "proposedDates": [
    { "date": "2025-03-10", "startTime": "10:00", "endTime": "12:00" },
    { "date": "2025-03-17", "startTime": "10:00", "endTime": "12:00" }
  ],
  "status": "pending",  // 'pending' | 'accepted' | 'rejected'
  "reasonPublic": null,
  "createdAt": "2025-02-01T10:00:00.000Z",
  "updatedAt": "2025-02-02T10:00:00.000Z"
}
```

### 4.2 학교별 일정 협의 목록/생성

- **GET** `/api/schools/{schoolId}/schedule-proposals`
- **POST** `/api/schools/{schoolId}/schedule-proposals`

```json
{
  "programId": "prog-001",
  "roundId": "prog-001-round-1",
  "proposedDates": [
    { "date": "2025-03-10", "startTime": "10:00", "endTime": "12:00" }
  ]
}
```

### 4.3 일정 제안 수정/승인/거절

- **PATCH** `/api/schedule-proposals/{id}`
- **POST** `/api/schedule-proposals/{id}/accept`
- **POST** `/api/schedule-proposals/{id}/reject`

```json
{
  "reasonPublic": "학교 학사일정으로 인해 3월 17일로 조정되었습니다."
}
```

### 4.4 학사일정 캘린더 (참고용)

- **GET** `/api/schools/{schoolId}/academic-calendar`
- **Query**
  - `year` / `month`

```json
{
  "schoolId": "school-001",
  "year": 2025,
  "month": 3,
  "events": [
    {
      "date": "2025-03-02",
      "type": "semester_start",
      "label": "1학기 개학"
    },
    {
      "date": "2025-03-15",
      "type": "exam",
      "label": "중간고사"
    }
  ]
}
```

---

## 5. 예산 및 실적 관리 (Phase 9)

### 5.1 프로그램 예산(Budget) 도메인 예시

```json
{
  "id": "budget-001",
  "programId": "prog-001",
  "totalBudget": 5000000,
  "usedAmount": 3200000,
  "remainingAmount": 1800000,
  "region": "서울",
  "specialCategory": "rural", // 농어촌 등 특수 기준
  "createdAt": "2025-01-01T10:00:00.000Z",
  "updatedAt": "2025-01-10T10:00:00.000Z"
}
```

### 5.2 예산 설정/조회

- **GET** `/api/budgets`
  - `programId?`, `region?`, `specialCategory?`
- **GET** `/api/budgets/{id}`
- **POST** `/api/budgets`
- **PATCH** `/api/budgets/{id}`

### 5.3 실적 집계 대시보드

- **GET** `/api/performance/summary`
- **Query**
  - `year`
  - `month?`
  - `region?`

```json
{
  "period": "2025-01",
  "byProgram": [
    {
      "programId": "prog-001",
      "title": "청소년 리더십 워크샵",
      "participants": 120,
      "sessions": 8,
      "instructors": 5,
      "budgetUsed": 2000000
    }
  ],
  "byRegion": [
    {
      "region": "서울",
      "participants": 300,
      "programCount": 10
    }
  ]
}
```

---

## 6. 증빙/수료/확인서 관리 (Phase 10)

### 6.1 증빙 문서(Certificate) 도메인 예시

```json
{
  "id": "cert-001",
  "type": "volunteer_certificate",   // 'volunteer_certificate' | 'instructor_certificate' | 'completion'
  "userId": "user-001",
  "programId": "prog-001",
  "activityId": "activity-001",
  "issuedAt": "2025-01-20T10:00:00.000Z",
  "templateId": "tpl-cert-001",
  "metadata": {
    "hours": 10,
    "role": "VOLUNTEER"
  }
}
```

### 6.2 증빙 문서 목록/조회

- **GET** `/api/certificates`
  - `type?`, `userId?`, `programId?`
- **GET** `/api/certificates/{id}`

### 6.3 증빙 문서 생성

- **POST** `/api/certificates`

```json
{
  "type": "completion",
  "userId": "user-001",
  "programId": "prog-001",
  "activityId": "activity-001",
  "templateId": "tpl-cert-001",
  "metadata": {
    "hours": 10
  }
}
```

### 6.4 템플릿/배경 이미지 관리

- **리소스 경로**: `/api/certificate-templates`
- **GET/POST/PATCH/DELETE** 동일 패턴
- 배경 이미지 업로드:
  - **POST** `/api/certificate-templates/{id}/background`
  - `multipart/form-data` 파일 업로드

### 6.5 PDF 다운로드

- **GET** `/api/certificates/{id}/download`
  - `format=pdf`

---

## 7. 어드민 커스터마이징 (Phase 11.1)

### 7.1 메인 팝업 관리

- **리소스**: `/api/admin/popups`

```json
{
  "id": "popup-001",
  "title": "신규 프로그램 안내",
  "content": "<p>내용</p>",
  "size": "large",   // 'small' | 'medium' | 'large'
  "order": 1,
  "isActive": true,
  "createdAt": "2025-01-01T10:00:00.000Z",
  "updatedAt": "2025-01-02T10:00:00.000Z"
}
```

- **GET** `/api/admin/popups`
- **POST** `/api/admin/popups`
- **PATCH** `/api/admin/popups/{id}`
- **DELETE** `/api/admin/popups/{id}`

> 최대 3개 제한은 서버 검증 또는 어드민 UI에서 제어.

### 7.2 컨텐츠 관리 (소개/임팩트 스토리)

- **리소스**: `/api/admin/contents`

```json
{
  "id": "content-001",
  "type": "about",        // 'about' | 'impact_story'
  "title": "JAKOREA 소개",
  "body": "<p>소개 내용</p>",
  "imageUrl": "https://.../image.png",
  "order": 1,
  "createdAt": "2025-01-01T10:00:00.000Z",
  "updatedAt": "2025-01-02T10:00:00.000Z"
}
```

- **GET/POST/PATCH/DELETE** 동일 패턴

---

## 8. 문의 관리 (Phase 11.2)

### 8.1 문의(Inquiry) 도메인 예시

```json
{
  "id": "inq-001",
  "category": "sponsorship",     // 예: 'sponsorship' | 'program' | 'etc'
  "subject": "후원 문의",
  "message": "문의 내용",
  "email": "company@example.com",
  "phone": "02-000-0000",
  "status": "pending",           // 'pending' | 'in_progress' | 'done'
  "assigneeId": "user-001",
  "logs": [
    {
      "id": "log-001",
      "type": "call",            // 'call' | 'email' | 'note'
      "message": "통화 완료",
      "createdAt": "2025-01-10T10:00:00.000Z",
      "createdBy": "user-002"
    }
  ],
  "createdAt": "2025-01-09T10:00:00.000Z",
  "updatedAt": "2025-01-10T10:00:00.000Z"
}
```

### 8.2 문의 목록/조회

- **GET** `/api/inquiries`
  - `category?`, `status?`, `search?`
- **GET** `/api/inquiries/{id}`

### 8.3 문의 생성 (웹폼 제출)

- **POST** `/api/inquiries`

```json
{
  "category": "sponsorship",
  "subject": "후원 문의드립니다",
  "message": "내용...",
  "email": "company@example.com",
  "phone": "02-000-0000"
}
```

> 생성 시 이메일 알림 트리거는 서버 내부 로직.

### 8.4 담당자 할당/상태 변경

- **PATCH** `/api/inquiries/{id}`

```json
{
  "status": "in_progress",
  "assigneeId": "user-001"
}
```

### 8.5 문의 로그 추가

- **POST** `/api/inquiries/{id}/logs`

```json
{
  "type": "call",
  "message": "통화 완료 및 후속 메일 발송"
}
```

---

## 9. 다운로드 관리 (Phase 11.3)

### 9.1 다운로드 파일(FileResource) 도메인 예시

```json
{
  "id": "file-001",
  "category": "newsletter",     // 'recruitment' | 'newsletter' | 'press' | 'notice'
  "title": "2025년 1월 뉴스레터",
  "description": "설명",
  "fileUrl": "https://.../file.pdf",
  "downloadCount": 123,
  "createdAt": "2025-01-01T10:00:00.000Z",
  "updatedAt": "2025-01-02T10:00:00.000Z"
}
```

### 9.2 파일 목록/조회/업로드

- **GET** `/api/downloads`
  - `category?`
- **GET** `/api/downloads/{id}`
- **POST** `/api/downloads`
  - `multipart/form-data`로 파일 업로드 + 메타데이터(카테고리, 제목 등)
- **PATCH** `/api/downloads/{id}`
- **DELETE** `/api/downloads/{id}`

### 9.3 다운로드 + 카운트 증가

- **GET** `/api/downloads/{id}/file`
  - 파일 바이너리 스트림 응답
  - 서버에서 `downloadCount` 1 증가

### 9.4 다운로드 통계

- **GET** `/api/downloads/stats`
- **Query**
  - `from`: 날짜
  - `to`: 날짜

```json
{
  "period": {
    "from": "2025-01-01",
    "to": "2025-01-31"
  },
  "byCategory": [
    {
      "category": "newsletter",
      "downloadCount": 300
    },
    {
      "category": "press",
      "downloadCount": 120
    }
  ],
  "byFile": [
    {
      "fileId": "file-001",
      "title": "2025년 1월 뉴스레터",
      "downloadCount": 200
    }
  ]
}
```

---

## 10. 사용자 화면 기반 API 요약 (Phase 5.x 연계)

Phase 5.x에서 정의된 사용자 UI 구조(마이페이지, To-do, 일정/강의/봉사 상세, 이력/증빙 등)에 맞춰,  
앞서 정의한 엔드포인트들이 아래처럼 조합되어 사용됩니다.

- **마이페이지 메인**:  
  - `GET /api/mypage/summary` (primaryStatus, todos, upcomingSchedules, historySummary)
- **To-do 처리 화면**:  
  - `GET /api/todos/{id}`, `PATCH /api/todos/{id}` + `targetUrl` 기반 내비게이션
- **내 일정/상세**:  
  - `GET /api/activities/lectures`, `GET /api/activities/volunteers`, `GET /api/activities/{id}`
- **보고서 작성**:  
  - `GET /api/reports/fields?type=lecture|volunteer|program` (필드 정의, `data/mock/reports.ts`)  
  - `POST /api/reports` (실제 제출)
- **이력/증빙**:  
  - `GET /api/histories` (완료된 프로그램/강의/봉사 이력)  
  - `GET /api/histories/{id}` + `GET /api/certificates` / `/api/certificates/{id}/download`

구체적인 화면별 필드/Forbidden 규칙은 `MVP_ROADMAP_V2.md` / `V3.md`의 해당 섹션과  
이 문서에 정의된 도메인/엔드포인트를 조합해서 사용하면 됩니다.

---

## 11. 정리

- **Base 스펙**(`API_SPEC_MOCK_BASED.md`): 현재 Mock 서비스/도메인 구조와 1:1 대응.
- **Extended 스펙**(본 문서): 클라이언트 인터뷰/로감 문서 기반 Phase 4.2~11까지 포함한 확장 설계.
- 실제 백엔드 구현 시:
  - 1단계: Base 스펙을 우선 구현하여 CMS 기존 화면과 연동
  - 2단계: Extended 중 **정산 고도화 / 공문 / 문의 / 다운로드** 등 우선순위가 높은 모듈부터 단계적으로 도입




