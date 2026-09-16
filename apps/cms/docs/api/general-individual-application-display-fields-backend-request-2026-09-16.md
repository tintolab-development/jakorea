# BE 구현 요청 — 일반 프로그램 개인 신청 목록·상세 표시 필드

**작성일:** 2026-09-16  
**대상 프로그램:** `168006` (`[개인] 커리큘럼형 복수회차 테스트 프로그램`)  
**대상 화면:** CMS 일반 프로그램 → 참여자 신청 목록 → 1차 서류 심사/합격자/2차 면접 대상자 → 신청 상세  
**현재 목록 API:** `GET /api/admin/programs/{programId}/individual-applications`  
**범위:** 일반 프로그램 개인 참여자 신청만 해당. 기관·강사·봉사자·UJAT·1사1교·Gemini 계약은 변경하지 않음  
**관련 요청:** [개인 참여자 면접 가능 일정 API](./general-primary-168006-individual-interview-availability-backend-request-2026-09-16.md) · [개인 신청 정보 수정·담당자 서류 평가 API](./general-individual-application-detail-edit-document-evaluation-backend-request-2026-09-16.md) · [개인 신청 결과 알림 재발송 API](./general-individual-application-notification-resend-backend-request-2026-09-16.md) · [개인 신청 관리자 코멘트 API](./general-individual-application-admin-comment-backend-request-2026-09-16.md)

## 백엔드 전달용 프롬프트

아래 요구사항에 따라 일반 프로그램 개인 참여자 신청 목록과 신청 상세에 필요한 데이터를 API로 제공해 주세요.

현재 DB에는 회원 프로필과 신청서 데이터가 존재하지만, CMS가 호출하는
`GET /api/admin/programs/{programId}/individual-applications` 응답에는 이름·상태·면접 일정만 포함되어 있습니다.
그 결과 목록과 상세 화면의 여러 값이 `-` 또는 빈 값으로 표시됩니다.

이 문제는 FE 표시 로직이나 DB 시드 부재가 아니라 **조회 DTO와 SQL projection 누락**입니다.

현재 BE 구현:

- DTO: `applicationflow/dto/IndividualApplicationListItemResponse`
- 조회: `applicationflow/service/ProgramApplicationQueryService#listIndividualApplications`
- 현재 JOIN: `program_individual_application`, `program`, `member`, 면접 가능 일정/배정
- 현재 회원 JOIN에서 실제로 반환하는 프로필 필드: `member.name`만

DB에 존재하는 값을 FE에서 추측하거나 별도 mock으로 보정하지 않도록 API 계약을 완성해 주세요.

---

## 1. 현재 화면에서 비어 있는 값

### 1.1 목록

| CMS 컬럼 | FE 필드 | 현재 상태 |
|---|---|---|
| 신청자명 | `applicantName` | `memberName`으로 표시되나 마스킹 정책 확인 필요 |
| 소속 | `affiliation` | API 필드 없음 |
| 신청 학년 | `educationGrade` | API 필드 없음 |
| 자택 주소지 | `homeAddress` | API 필드 없음 |
| 프로그램 승인 현황 | `approvalStatus` | 정상 |
| 진행 희망 교육 일정 | `sessions` | API 필드 없음 |

### 1.2 상세 — 기본 정보

| CMS 항목 | FE 필드 | 현재 상태 |
|---|---|---|
| 성명 | `applicantName` | 이름만 표시 |
| 성별 및 생년월일 | `detail.gender`, `detail.birthDate`, `detail.age` | API 필드 없음 |
| 학교 재학 여부 | `detail.schoolEnrollmentStatus` | API 필드 없음 |
| 소속 | `detail.affiliationSchool`, `detail.affiliationGrade` | API 필드 없음 |
| 연락처 | `detail.contact` | API 필드 없음 |
| 이메일 | `detail.email` | API 필드 없음 |
| 자택 주소지 | `detail.homeAddressFull` | API 필드 없음 |
| 1365 ID | `detail.external1365Id` | API 필드 없음 |
| 자기소개 및 지원동기 | `detail.selfIntroduction` | API 필드 없음 |

### 1.3 상세 — 심사 정보

다음 값도 DB에 존재하면 신청 상세 응답에 포함해 주세요.

- 담당자 A/B 서류 평가 상태
- 담당자 A/B 면접 점수
- 점수 종합
- 면접 평가 비고
- 신청자 면접 가능 일정
- 관리자 확정 면접 배정 일정
- 일정 변경/취소 횟수
- 활동 포기 여부와 사유
- 최종 결과와 예비 순번

---

## 2. 계약 분리 원칙

개인정보를 목록 API에 전부 싣지 마세요.

1. **목록 API**
   - 테이블 렌더링과 필터에 필요한 최소 표시 필드만 반환합니다.
   - 성명과 주소는 목록용 마스킹/요약 값을 반환합니다.
   - 연락처, 이메일, 상세 주소, 생년월일 원문은 목록에서 반환하지 않습니다.

2. **상세 API**
   - 신청 ID 기준 상세 endpoint를 추가하는 방식을 권장합니다.
   - 권장 route:

```http
GET /api/admin/individual-applications/{applicationId}
```

   - 기본 응답은 CMS 권한 정책에 맞게 마스킹합니다.
   - 「개인정보 상세보기」 원문 조회는 기존 RBAC·사유 입력·감사 로그 정책을 재사용합니다.
   - FE의 버튼 노출이나 마스킹 해제 상태만으로 권한을 판단하지 않습니다.

3. **신청 시점 데이터 우선**
   - 소속·학년·자기소개·희망 일정처럼 신청서에서 제출한 값은 **신청 건 snapshot**을 우선합니다.
   - 현재 회원 프로필 값으로 과거 신청 내용을 무조건 덮어쓰지 않습니다.
   - 신청 snapshot이 실제로 저장되지 않았다면 application과 form response를 연결하거나 전용 snapshot 컬럼/테이블을 추가합니다.
   - 같은 회원의 다른 프로그램 신청 데이터가 섞이지 않도록 `applicationId`와 `programId` 범위를 강제합니다.

---

## 3. 목록 API 응답 확장

`GET /api/admin/programs/{programId}/individual-applications` 각 item에 다음 표시 필드를 추가해 주세요.

권장 예시:

```json
{
  "id": 1690625,
  "programId": 168006,
  "memberId": 190016,
  "memberName": "이*희",
  "affiliationName": "한국대학교",
  "applicationGrade": "대학교 2학년",
  "homeAddressSummary": "서울특별시 강서구",
  "preferredEducationSchedules": [
    {
      "scheduleId": 168361,
      "round": 1,
      "startAt": "2026-10-15T10:00:00+09:00",
      "endAt": "2026-10-15T12:00:00+09:00"
    }
  ],
  "applicationStatus": "SUBMITTED",
  "documentStatus": "DOCUMENT_PASSED",
  "interviewStatus": "ASSIGNED",
  "finalResultStatus": "WAITING",
  "giveUpYn": false
}
```

필드명은 BE 명명 규칙에 맞게 조정할 수 있지만 의미는 OpenAPI description에 명시해 주세요.

### 목록 필드 조건

- `affiliationName`: 신청 당시 학교/기관명. 미재학이면 신청 당시 직접 입력 소속 또는 `null`.
- `applicationGrade`: 신청 당시 학년/교육 단계.
- `homeAddressSummary`: 전체 상세 주소가 아닌 목록 표시용 지역 단위 또는 마스킹 값.
- `preferredEducationSchedules`: 신청자가 선택한 교육 일정. 프로그램의 전체 일정이 아니라 해당 신청 건 선택값만 반환.
- 배열은 안정적인 순서(`startAt`, `scheduleId`)로 반환.
- 값이 없으면 빈 문자열 대신 `null`, 배열은 `[]` 사용.
- 기존 page envelope와 pagination 동작은 유지.

---

## 4. 신청 상세 API

권장 응답:

```json
{
  "id": 1690625,
  "programId": 168006,
  "memberId": 190016,
  "applicationStatus": "SUBMITTED",
  "availableActions": ["APPROVE", "REJECT"],
  "profile": {
    "name": "이*희",
    "gender": "여성",
    "birthDate": "2002-04-15",
    "age": 24,
    "schoolEnrollmentStatus": "재학 중",
    "affiliationSchool": "한국대학교",
    "affiliationGrade": "대학교 2학년",
    "contact": "010-****-1234",
    "email": "le***@example.com",
    "homeAddress": "서울특별시 강서구 ****",
    "external1365Id": "ab****12"
  },
  "application": {
    "selfIntroduction": "신청 당시 제출한 자기소개",
    "preferredEducationSchedules": [],
    "scheduleChangeCancelCount": 0
  },
  "screening": {
    "documentStatus": "DOCUMENT_PASSED",
    "managerAEvaluation": "REVIEWED",
    "managerBEvaluation": "REVIEWED",
    "managerAScore": 42,
    "managerBScore": 45,
    "totalScore": 87,
    "interviewEvaluationRemark": "평가 비고",
    "finalResultStatus": "WAITING",
    "reserveRank": null,
    "giveUpYn": false,
    "giveUpReason": null
  },
  "interviewAvailabilitySlots": [],
  "interviewAvailabilityCount": 0,
  "assignedInterviewSlotId": 1690811,
  "assignedInterviewStartAt": "2026-09-18T12:23:00+09:00",
  "assignedInterviewEndAt": "2026-09-18T13:23:00+09:00"
}
```

응답 구조는 조정 가능하지만 다음을 지켜 주세요.

- 신청 상세는 `applicationId` 기준입니다.
- URL의 `programId`와 신청 건의 프로그램이 다르면 조회를 거부합니다.
- 탈퇴·휴면·개인정보 만료 회원은 기존 회원 개인정보 정책을 적용합니다.
- 원문 개인정보 조회가 별도 endpoint라면 상세 응답에 `canRevealPersonalInfo` 등 서버 권한 결과를 함께 제공할 수 있습니다.
- 원문 조회와 다운로드에는 기존 감사 로그 정책을 적용합니다.

---

## 5. 데이터 소스 확인

구현 전에 아래 실제 SSOT를 확인하고 DTO mapper에 명시해 주세요.

- 회원 기본값: `member` 및 개인 회원 프로필
- 학교/재학/학년/1365 ID: 개인 회원 상세 프로필 데이터
- 신청 당시 답변: 해당 개인 신청과 연결된 신청서/form response
- 진행 희망 교육 일정: 해당 신청 건의 일정 선택 관계
- 심사 평가: 개인 신청의 문서/면접 평가 데이터
- 면접 가능 일정: `program_interview_application_slot`
- 확정 배정: `program_interview_assignment` + `program_interview_slot`

회원 프로필과 신청 snapshot이 모두 있으면 신청 snapshot을 우선하고, fallback 정책을 OpenAPI description 또는 서비스 코드 주석에 남겨 주세요.

---

## 6. `168006` QA 시드

`GeneralPrimaryCase6NestedSeedWriter`의 개인 신청 10건에 목록·상세 검증값을 연결해 주세요.

최소 조건:

- 서로 다른 소속·학년·주소 요약값
- 성별·생년월일·연락처·이메일·1365 ID
- 자기소개 및 지원동기
- 신청별 진행 희망 교육 일정
- 서류 평가 대기/합격/불합격 값
- 면접 점수/비고가 있는 대상과 없는 대상
- 배정 대기/배정 완료/활동 포기 상태

시드는 다음 조건을 만족해야 합니다.

- 기존 application PK와 `memberId` 매트릭스를 유지합니다.
- 재시드 시 중복되지 않는 idempotent upsert를 사용합니다.
- `memberId`만으로 다른 신청서 답변을 잘못 연결하지 않습니다.
- 개인정보 원문을 운영 로그에 출력하지 않습니다.

---

## 7. OpenAPI 및 테스트

구현 후 다음을 반영해 주세요.

1. `IndividualApplicationListItemResponse` 목록 표시 필드
2. 신규 개인 신청 상세 response schema
3. 마스킹/원문 조회 응답의 차이와 권한 조건
4. nullable 및 빈 배열 규칙
5. 신청 snapshot과 현재 회원 프로필의 우선순위

필수 테스트:

- 다른 프로그램 신청 데이터 미혼입
- 같은 회원의 복수 신청 건 분리
- 신청 snapshot 우선순위
- 목록 개인정보 마스킹
- 상세 권한별 마스킹/원문 노출
- 개인정보 원문 조회 감사 로그
- 탈퇴·휴면·개인정보 만료 정책
- 값 없음의 `null`/`[]` 계약
- 목록 pagination/count 회귀
- `168006` 신청 10건 목록·상세 스모크

---

## 8. 수락 기준

1. `GET /api/admin/programs/168006/individual-applications`에서 소속·신청 학년·주소 요약·진행 희망 일정이 반환됩니다.
2. 목록 응답에 연락처·이메일·생년월일·상세 주소 원문이 노출되지 않습니다.
3. `GET /api/admin/individual-applications/1690625`에서 기본 정보·자기소개·심사 정보가 반환됩니다.
4. 신청 당시 값과 현재 회원 프로필 값이 다를 때 문서화된 우선순위대로 응답합니다.
5. 같은 회원의 다른 프로그램 신청 답변이 섞이지 않습니다.
6. 면접 가능 일정과 확정 배정 일정이 서로 다른 필드로 유지됩니다.
7. 개인정보 상세보기는 서버 권한 검증과 감사 로그를 거칩니다.
8. OpenAPI와 실제 응답이 일치합니다.
9. 기존 승인·반려·서류 결과·면접 배정·최종 결과 API 테스트가 통과합니다.

---

## 9. BE 완료 후 FE 전달 정보

- 최종 endpoint와 OpenAPI schema
- 목록/상세 필드명
- 각 필드의 DB/신청 snapshot source
- 마스킹 및 원문 조회 권한 계약
- `168006` 확인 가능한 application PK
- 목록과 상세 응답 샘플
- 로컬 시드 재생성 방법
- 추가된 테스트 목록

## 비범위

- FE mock 값으로 API 누락값 보정
- 현재 회원 프로필을 과거 신청 snapshot으로 무조건 사용
- 목록 API에 개인정보 원문 추가
- 일반 프로그램 외 유형의 신청 API 변경
- FE 표시용 한글 날짜 문자열 생성
