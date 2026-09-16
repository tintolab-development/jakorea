# 일반 프로그램 강사 신청 목록 — API 전환 점검 및 BE 계약

**작성일:** 2026-09-16  
**대상:** Admin CMS 일반 프로그램  
**QA 프로그램:** `168006` (`[개인] 커리큘럼형 복수회차 테스트 프로그램`)  
**대상 화면:** 프로그램 상세 → 강사 신청 목록  
**범위 제한:** 일반 프로그램만 해당하며 UJAT·1사1교·Gemini 계약은 변경하지 않음

## 1. FE 전환 현황

현재 FE에서 API에 연결된 기능:

- 목록: `GET /api/admin/programs/{programId}/instructor-applications`
- 승인: `POST /api/admin/instructor-applications/{applicationId}/approve`
- 반려: `POST /api/admin/instructor-applications/{applicationId}/reject`
- 숫자형 API 프로그램은 remote 사용
- `general-prog-*` FE 전용 시드는 기존 Mock 유지
- TanStack Query key는 프로그램 ID별로 분리
- 목록 캐시는 운영성 목록 기준 `staleTime=30초`, `gcTime=10분`, window focus refetch 비활성
- 승인·반려 후 general applications 도메인 query invalidate

현재 부분 전환 또는 Mock 상태:

- 목록 응답에 화면 필드가 부족해 주소·경력·평가등급·연락처·이메일이 빈 값으로 표시됨
- 신청 상세 전용 API가 없어 목록 행의 제한된 데이터로 상세 화면을 렌더링함
- 상세 화면의 단건 승인·반려 완료 처리는 일부 로컬 Mock 상태만 변경함
- 승인 시 입력하는 강의 배정·강사비 기준·알림 예약 정보가 approve API body에 전달되지 않음
- 승인 취소·반려 취소·알림 재발송·관리자 코멘트 저장은 API 계약이 없어 로컬 상태만 변경함
- `availableActions`가 FE 행 모델에 전달되지 않아 실제 허용 액션 대신 상태 문자열로 CTA를 판단함
- 목록은 첫 50건만 조회하며 다음 페이지 연결은 아직 없음
- instructor application endpoint path가 현재 로컬 dashboard OpenAPI paths에 없어 API client를 수동 작성한 상태

결론: **목록 읽기와 기본 approve/reject endpoint는 연결됐지만 운영 화면 전체는 아직 완전 API 전환이 아닙니다.**

## 2. 백엔드 전달용 구현 프롬프트

아래 요구사항에 따라 일반 프로그램 강사 신청 목록·상세·상태 변경 계약을 완성해 주세요.

### 2.1 OpenAPI path 공식화

다음 endpoint를 dashboard OpenAPI paths에 포함해 주세요.

```http
GET  /api/admin/programs/{programId}/instructor-applications
GET  /api/admin/instructor-applications/{applicationId}
POST /api/admin/instructor-applications/{applicationId}/approve
POST /api/admin/instructor-applications/{applicationId}/reject
POST /api/admin/instructor-applications/{applicationId}/cancel-approval
POST /api/admin/instructor-applications/{applicationId}/cancel-rejection
POST /api/admin/instructor-applications/{applicationId}/notifications/resend
PATCH /api/admin/instructor-applications/{applicationId}
```

기존 구현과 path가 다르면 중복 endpoint를 만들지 말고 canonical path를 회신해 주세요.

권한:

- 읽기: `APPLICATION_READ`
- 승인·반려·취소·수정·알림 재발송: `APPLICATION_WRITE`
- 모든 단건 endpoint는 URL의 `applicationId`가 해당 강사 신청 PK인지 검증

### 2.2 목록 조회 계약

```http
GET /api/admin/programs/{programId}/instructor-applications
  ?status=WAITING_REVIEW
  &page=0
  &size=50
```

응답 envelope:

```json
{
  "items": [],
  "page": 0,
  "size": 50,
  "totalElements": 3,
  "totalPages": 1
}
```

목록 item 최소 계약:

```json
{
  "id": 170033,
  "programId": 168006,
  "recruitmentId": 1,
  "instructorMemberId": 190006,
  "instructorName": "최지원",
  "applicationStatus": "WAITING_REVIEW",
  "homeAddress": "서울특별시 강서구",
  "jaLectureExperienceYears": 2,
  "jaEvaluationGrade": "B",
  "contact": "010-****-1234",
  "email": "ji***@example.com",
  "instructorTypeSnapshot": "INSTRUCTOR",
  "instructorFeeGradeSnapshot": "3급 강사비",
  "distanceKm": 12.4,
  "longDistance": false,
  "submittedAt": "2026-09-15T10:00:00+09:00",
  "approvedAt": null,
  "rejectedAt": null,
  "rejectReason": null,
  "availableActions": ["APPROVE", "REJECT"]
}
```

목록 필드 조건:

- `id`는 instructor application PK이며 memberId나 participantId가 아님
- `programId` 조건을 DB query에서 강제해 다른 프로그램 신청이 섞이지 않음
- `homeAddress`는 목록용 축약·마스킹 값을 반환
- `contact`, `email`은 권한 정책에 맞는 마스킹 값을 반환
- `jaLectureExperienceYears`는 JA 강의 경력 연수이며 일반 경력 연수와 혼용하지 않음
- `jaEvaluationGrade`와 `instructorFeeGradeSnapshot`은 서로 다른 값
- `distanceKm`는 프로그램/기관 기준이 확정되지 않는 개인 프로그램이면 null 허용
- 정렬 기본값은 `submittedAt DESC, id DESC`
- `page`, `size`, `status`를 실제 query에 적용

검색·필터를 서버에서 지원한다면 `name`, `submittedFrom`, `submittedTo`, `applicationStatus`를 OpenAPI에 명시해 주세요.

### 2.3 상태 및 availableActions 계약

canonical 상태:

- `WAITING_REVIEW`: 승인 대기
- `APPROVED`: 승인
- `REJECTED`: 반려
- `CANCELLED`: 신청 취소가 존재하는 경우에만 사용

권장 action:

- `APPROVE`
- `REJECT`
- `CANCEL_APPROVAL`
- `CANCEL_REJECTION`
- `RESEND_NOTIFICATION`
- `UPDATE_APPLICATION`

규칙:

- FE는 라벨이나 상태 문자열만으로 CTA를 활성화하지 않고 `availableActions`를 기준으로 판단할 예정
- `WAITING_REVIEW`는 `APPROVE`, `REJECT`
- `APPROVED`는 정책상 가능할 때 `CANCEL_APPROVAL`, `RESEND_NOTIFICATION`
- `REJECTED`는 정책상 가능할 때 `CANCEL_REJECTION`, `RESEND_NOTIFICATION`
- 허용하지 않는 action 호출은 `409 APPLICATION_STATUS_CONFLICT`
- 모든 mutation 응답은 변경 후 `applicationStatus`와 최신 `availableActions`를 반환

기존 BE action enum 명칭이 따로 있으면 그 enum을 SSOT로 회신하고 OpenAPI enum으로 노출해 주세요.

### 2.4 신청 상세 조회

```http
GET /api/admin/instructor-applications/{applicationId}
```

상세 응답은 목록 item 필드에 다음 신청 시점 snapshot을 추가해 주세요.

```json
{
  "id": 170033,
  "programId": 168006,
  "instructorMemberId": 190006,
  "instructorName": "최지원",
  "nameHanja": "崔智媛",
  "nameEnglish": "JIWON CHOI",
  "birthDate": "1990-09-15",
  "gender": "FEMALE",
  "contact": "010-1234-5678",
  "email": "jiwon@example.com",
  "homeAddress": "서울특별시 강서구 화곡동",
  "homeAddressDetail": "123-45",
  "educationLevel": "UNIVERSITY_GRADUATE",
  "educationSchoolName": "한국대학교",
  "affiliation": "JA Korea",
  "teachingExperience": "1_TO_3_YEARS",
  "jaLectureExperienceYears": 2,
  "jaEvaluationGrade": "B",
  "oneLineIntro": "경제교육 강사입니다.",
  "availableScheduleMemo": "평일 오후 가능",
  "availableScheduleSlots": [
    {
      "scheduleId": 9001,
      "startAt": "2026-09-20T14:00:00+09:00",
      "endAt": "2026-09-20T16:00:00+09:00",
      "assignable": true
    }
  ],
  "managerComment": null,
  "applicationStatus": "WAITING_REVIEW",
  "availableActions": ["APPROVE", "REJECT", "UPDATE_APPLICATION"]
}
```

상세 필드 조건:

- 회원 현재값이 아니라 **신청 시점 snapshot**을 우선 반환
- 현재 회원 프로필 값을 함께 제공해야 한다면 `currentMemberProfile`처럼 별도 객체로 구분
- 개인정보 원문은 권한 있는 상세 endpoint에서만 반환
- 목록 endpoint에 계좌번호·상세주소 등 불필요한 민감정보를 포함하지 않음
- `availableScheduleSlots.scheduleId`는 강사 배정 API가 사용하는 실제 schedule PK

### 2.5 승인 계약

현재 FE 승인 화면은 강의 배정, 강사비 기준, 알림 발송 시점을 함께 입력합니다. 빈 body approve만 처리하면 FE 화면과 DB 결과가 불일치합니다.

권장 원자적 계약:

```http
POST /api/admin/instructor-applications/{applicationId}/approve
Content-Type: application/json
```

```json
{
  "assignments": [
    {
      "scheduleId": 9001,
      "organizationApplicationId": null,
      "scheduleLead": true
    }
  ],
  "feePolicy": {
    "basisType": "PROGRAM",
    "measure": "PER_SESSION",
    "amount": 150000,
    "instructorFeeGrade": "GRADE_3"
  },
  "notification": {
    "timing": "IMMEDIATE",
    "scheduledAt": null
  }
}
```

처리 조건:

- 신청 상태 검증 → 강사 배정 → 강사비 snapshot → 승인 상태 이력 → 알림 event 생성을 한 transaction으로 처리
- 실패 시 일부 배정이나 승인 상태만 남기지 않고 전체 rollback
- 개인 프로그램은 `organizationApplicationId=null` 허용
- 기관 프로그램 계약은 이 문서 범위가 아니며 기존 1사1교 계약을 유지
- 이미 승인·반려된 건은 `409 APPLICATION_STATUS_CONFLICT`
- schedule 충돌은 해당 도메인 error code와 충돌 대상 정보를 반환

기존 강사 배정 API를 분리 유지해야 한다면 approve 전후 호출 순서, 보상 transaction, idempotency 기준을 BE가 canonical workflow로 문서화해 주세요.

응답:

```json
{
  "applicationId": 170033,
  "applicationType": "INSTRUCTOR",
  "fromStatus": "WAITING_REVIEW",
  "toStatus": "APPROVED",
  "participantId": 88001,
  "notificationEventId": 77001,
  "availableActions": ["CANCEL_APPROVAL", "RESEND_NOTIFICATION"]
}
```

### 2.6 반려·취소·알림 계약

반려:

```http
POST /api/admin/instructor-applications/{applicationId}/reject
```

```json
{
  "reason": "필수 자격 요건을 충족하지 않았습니다.",
  "notification": {
    "timing": "IMMEDIATE",
    "scheduledAt": null
  }
}
```

승인 취소:

```http
POST /api/admin/instructor-applications/{applicationId}/cancel-approval
```

```json
{
  "reason": "배정 정보 재검토",
  "notification": {
    "timing": "IMMEDIATE",
    "scheduledAt": null
  }
}
```

반려 취소:

```http
POST /api/admin/instructor-applications/{applicationId}/cancel-rejection
```

```json
{
  "notification": {
    "timing": "IMMEDIATE",
    "scheduledAt": null
  }
}
```

알림 재발송:

```http
POST /api/admin/instructor-applications/{applicationId}/notifications/resend
```

```json
{
  "timing": "IMMEDIATE",
  "scheduledAt": null
}
```

취소 시 연결된 participant/assignment 처리 정책을 명시해 주세요. 승인 취소 후 활성 배정이 남으면 FE와 진행 현황이 불일치하므로 같은 transaction에서 취소하거나 명시적인 후속 상태를 반환해야 합니다.

### 2.7 상세 수정

```http
PATCH /api/admin/instructor-applications/{applicationId}
```

최소 수정 범위:

```json
{
  "managerComment": "자격증 확인 완료"
}
```

- 수정 가능한 필드는 OpenAPI request schema allowlist로 제한
- 신청자가 제출한 원본 snapshot을 관리자 수정값으로 조용히 덮어쓰지 않음
- 관리자 보정값은 audit log에 변경 전·후와 관리자 ID 기록

### 2.8 에러 계약

공통 형태:

```json
{
  "error": {
    "code": "APPLICATION_STATUS_CONFLICT",
    "message": "현재 상태에서는 승인할 수 없습니다.",
    "details": {
      "applicationId": 170033,
      "applicationStatus": "APPROVED"
    }
  }
}
```

필수 code:

- `INSTRUCTOR_APPLICATION_NOT_FOUND` → 404
- `APPLICATION_STATUS_CONFLICT` → 409
- `INSTRUCTOR_ASSIGNMENT_CONFLICT` → 409
- `INVALID_NOTIFICATION_SCHEDULE` → 422
- `INVALID_FEE_POLICY` → 422
- `FORBIDDEN_APPLICATION_ACTION` → 403

### 2.9 일괄 처리

현재 FE는 단건 API를 순차 호출합니다. 소량 QA에는 동작하지만 부분 성공과 요청 과다 위험이 있습니다.

권장:

```http
POST /api/admin/instructor-applications/bulk-approve
POST /api/admin/instructor-applications/bulk-reject
```

각 item별 성공/실패를 반환하거나 전체 원자 처리 여부를 명시해 주세요. 일괄 API를 제공하지 않으면 단건 mutation의 idempotency와 rate limit을 회신해 주세요.

## 3. `168006` QA 시드

기존 member roster와 상태를 유지합니다.

- `memberId=190006` 최지원: `WAITING_REVIEW`
- `memberId=190005` 김성재: `APPROVED`, participants INSTRUCTOR 승격
- `memberId=190007` 황범진: `REJECTED`, `rejectReason` 포함

각 시드에 목록 및 상세 화면 검증용 데이터를 넣어 주세요.

- 주소, 연락처, 이메일
- JA 강의 경력 연수
- JA 평가 등급
- 강사비 등급 snapshot
- 학력·소속·한줄소개
- 프로그램 schedule과 연결되는 강의 가능 일정
- 상태별 정확한 `availableActions`
- 승인 건의 participantId와 배정/강사비 snapshot

재시드는 idempotent해야 하며 기존 application PK와 memberId를 변경하지 않습니다.

## 4. 수락 기준

1. `168006` 강사 신청 목록 3건이 API 응답 기반으로 표시됩니다.
2. 목록의 주소·JA 경력·평가등급·연락처·이메일이 빈 값이 아닙니다.
3. URL의 `applicantId`는 instructor application PK로 상세 조회됩니다.
4. 목록과 상세 상태 및 `availableActions`가 일치합니다.
5. 대기 건 승인 시 배정·강사비·알림 정보가 저장되고 새로고침 후 유지됩니다.
6. 대기 건 반려 시 사유와 알림 event가 저장됩니다.
7. 승인 취소·반려 취소·알림 재발송이 새로고침 후에도 유지됩니다.
8. 허용되지 않은 action은 409 또는 403과 표준 error body를 반환합니다.
9. mutation 후 다시 조회한 목록·상세·진행 참여 강사 상태가 일치합니다.
10. `page/size/status` pagination 계약과 OpenAPI가 실제 응답과 일치합니다.
11. 다른 programId의 강사 신청이 섞이지 않습니다.
12. UJAT·1사1교·Gemini 강사 신청/배정 동작에 회귀가 없습니다.

## 5. BE 완료 후 FE 전달 정보

- 최종 canonical endpoint 목록
- OpenAPI schema 및 action enum
- 승인 payload에서 배정·강사비·알림을 처리하는 최종 방식
- 취소 시 participant/assignment 처리 정책
- `168006` application PK / memberId / 상태 / availableActions
- 목록·상세·mutation 실제 응답 예시
- 로컬 시드 재생성 방법

## 6. FE 후속 작업

BE 계약 확정 및 OpenAPI 동기화 후 FE에서 진행할 항목:

1. 수동 API client를 generated client로 교체
2. 목록 adapter의 빈 문자열 fallback을 실제 응답 필드로 교체
3. 상세 화면을 application detail query로 분리
4. CTA와 row selection을 `availableActions` 기준으로 전환
5. 단건 승인·반려·취소·알림 재발송을 mutation으로 연결
6. mutation 성공 시 application list/detail/participant/assignment query를 범위 지정 invalidate
7. 50건 초과 목록 pagination 또는 infinite query 연결
8. 인증 종료 시 강사 신청 캐시 제거 확인

