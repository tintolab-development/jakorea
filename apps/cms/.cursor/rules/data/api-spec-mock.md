---
priority: medium
always_include: false
category: data
---

# API 명세 요약 (Mock 기반)

> 이 문서는 Mock 기반 API의 핵심 규칙과 엔티티별 요약을 제공합니다.  
> 상세 API 스펙은 [상세 문서](../../../docs/api-spec-mock-detailed.md)를 참고하세요.

---

## 공통 규칙

- **Base URL**: `/api`
- **형식**: `application/json`, 날짜/시간은 ISO 8601 문자열
- **에러 처리**:
  - `404 Not Found`: 리소스 미존재
  - `400 Bad Request`: 유효성 오류
  - `500 Internal Server Error`: 서버 오류

### 공통 타입

- `UUID`: 문자열
- `Status`: `'active' | 'inactive' | 'pending' | 'completed' | 'cancelled'`
- `DateValue`: ISO 문자열

도메인 전체 정의는 `apps/cms/src/types/domain.ts` 참고.

---

## 엔티티별 API 요약

### 1. 스폰서 (Sponsor)
- **경로**: `/api/sponsors`
- **CRUD**: GET, POST, PATCH, DELETE
- **Mock 서비스**: `entities/sponsor/api/sponsor-service.ts`
- **삭제 정책(중요)**: 스폰서 삭제 시 연관 기본/연락처/매핑 정보는 삭제하되, 정산/통계/성과 등 실적 관련 값은 유지한다. 상세 기준은 `process/sponsor-delete-policy.md`를 따른다.

### 2. 학교 (School)
- **경로**: `/api/schools`
- **CRUD**: GET, POST, PATCH, DELETE
- **Mock 서비스**: `entities/school/api/school-service.ts`

### 3. 강사 (Instructor)
- **경로**: `/api/instructors`
- **CRUD**: GET, POST, PATCH, DELETE
- **Mock 서비스**: `entities/instructor/api/instructor-service.ts`
- **폼 스키마**: `entities/instructor/model/schema.ts`

### 4. 프로그램 (Program) & 회차 (ProgramRound)
- **경로**: `/api/programs`
- **CRUD**: GET, POST, PATCH, DELETE
- **회차 수정**: `PATCH /api/programs/{programId}/rounds/{roundId}`
- **Mock 서비스**: `entities/program/api/program-service.ts`

### 5. 신청 (Application)
- **경로**: `/api/applications`
- **CRUD**: GET, POST, PATCH, DELETE
- **상태 변경**: `PATCH /api/applications/{id}/status`
- **Mock 서비스**: `entities/application/api/application-service.ts`

### 6. 일정 (Schedule)
- **경로**: `/api/schedules`
- **CRUD**: GET, POST, PATCH, DELETE
- **기간별 조회**: `GET /api/schedules/range`
- **충돌 체크**: `POST /api/schedules/check-conflict`
- **Mock 서비스**: `entities/schedule/api/schedule-service.ts`

### 7. 강사 매칭 (Matching)
- **경로**: `/api/matchings`
- **CRUD**: GET, POST, PATCH, DELETE
- **확정**: `POST /api/matchings/{id}/confirm`
- **취소**: `POST /api/matchings/{id}/cancel`
- **Mock 서비스**: `entities/matching/api/matching-service.ts`

### 8. 정산 (Settlement)
- **경로**: `/api/settlements`
- **CRUD**: GET, POST, PATCH, DELETE
- **특징**: `totalAmount` 자동 계산
- **Mock 서비스**: `entities/settlement/api/settlement-service.ts`

### 9. 신청 경로 (ApplicationPath)
- **경로**: `/api/application-paths`
- **CRUD**: GET, POST, PATCH, DELETE
- **Mock 데이터**: `data/mock/application-paths.ts`

### 10. 보고서 (Report)
- **경로**: `/api/reports`
- **제출**: `POST /api/reports`
- **조회**: `GET /api/reports`, `GET /api/reports/{id}`
- **Mock 서비스**: `entities/report/api/report-service.ts`

### 11. To-do / 마이페이지 / 활동
- **To-do**: `GET /api/todos`, `PATCH /api/todos/{id}`
- **마이페이지**: `GET /api/mypage/summary`
- **활동**: `GET /api/activities/lectures`, `GET /api/activities/volunteers`

---

## 관련 문서

- [상세 API 명세](../../../docs/api-spec-mock-detailed.md)
- [확장 API 명세](../../../docs/api-spec-mock-extended.md)
- [Mock 데이터 관리](./mock-data.md)
