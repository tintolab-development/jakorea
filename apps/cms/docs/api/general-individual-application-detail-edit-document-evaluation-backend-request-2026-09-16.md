# BE 구현 요청 — 개인 참여자 신청 정보 수정·담당자 서류 평가 API

**작성일:** 2026-09-16  
**대상:** Admin CMS 일반 프로그램 개인 참여자 신청  
**QA 프로그램:** `168006` (`[개인] 커리큘럼형 복수회차 테스트 프로그램`)  
**대상 화면:** 참여자 신청 목록 → 신청 상세 → 정보 수정 / 담당자 서류 평가  
**범위 제한:** 일반 프로그램 개인 참여자 신청만 해당. 기관·강사·봉사자·UJAT·1사1교·Gemini 계약은 변경하지 않음

**Notion 기획 근거**

- [참여자 신청 상세 버튼 리스트](https://app.notion.com/378f3e2a77d0802ba1b7db9485c785e7)
- [참여자 신청 상세](https://app.notion.com/378f3e2a77d08042b4e4e541ceccd69c)

**관련 문서**

- [개인 신청 목록·상세 표시 필드](./general-individual-application-display-fields-backend-request-2026-09-16.md)
- [개인 신청 관리자 코멘트](./general-individual-application-admin-comment-backend-request-2026-09-16.md)
- [개인 신청 결과 알림 재발송](./general-individual-application-notification-resend-backend-request-2026-09-16.md)
- [개인 참여자 면접 가능 일정](./general-primary-168006-individual-interview-availability-backend-request-2026-09-16.md)

## 백엔드 전달용 프롬프트

아래 요구사항에 따라 일반 프로그램 개인 참여자 신청의 **승인 후 정보 수정 API**와 **담당자 A/B 서류 평가 조회·저장 API**를 구현해 주세요.

현재 FE에는 정보 수정 입력 UI와 담당자 A/B 평가 드롭다운이 존재하지만, 둘 다 local mock 함수만 사용합니다.

```text
patchGeneralIndividualApplicantDetail(applicationId, payload)
patchGeneralIndividualApplicantManagerEvaluation(applicationId, manager, evaluation)
```

숫자형 API application ID는 FE mock 저장소에 없으므로 정보 저장이 실패하고, 평가 변경도 반영되지 않습니다. 새로고침 후 유지되는 DB/API 계약이 필요합니다.

---

## 1. 기획 기준

### 1.1 정보 수정 버튼

Notion 기준:

- 승인 전: 참여 반려 / 참여 승인 / 개인정보 상세보기
- 승인 완료: 정보 수정 / 코멘트 작성 / 개인정보 상세보기
- 반려 완료: 반려 취소 / 개인정보 상세보기

따라서 `정보 수정`은 **applicationStatus=APPROVED인 신청에만 허용**합니다.

1차 서류 심사 탭에 있다는 이유만으로 승인 전 신청에 정보 수정 권한을 부여하지 마세요. FE는 최종적으로 `availableActions`의 `UPDATE_APPLICATION` 여부도 함께 확인할 예정입니다.

### 1.2 정보 수정 대상

기획상 관리자 수정 대상:

- 교재명
- 팀명
- 팀 인원 수
- 팀 역할(팀장 / 팀원)

관리자 코멘트는 별도 계약 문서의 API를 사용합니다.

다음 신청자 원본 정보는 이번 PATCH 대상이 아닙니다.

- 성명, 성별, 생년월일
- 학교 재학 여부, 소속, 학년
- 연락처, 이메일, 주소, 1365 ID
- 자기소개 및 지원동기
- 신청자가 제출한 면접 가능 일정

원본 신청 snapshot을 관리자 운영정보 수정으로 조용히 덮어쓰지 마세요.

### 1.3 담당자 서류 평가

Notion 기준으로 면접이 있는 프로그램의 **1차 서류 심사 대상자 상세**에만 담당자 A/B 서류 평가를 노출합니다.

UI 값:

- `PASS` → `○`
- `NEUTRAL` → `△`
- `FAIL` → `X`
- `UNREVIEWED` → `미검토`

담당자 A/B 개별 평가는 전체 `documentStatus`와 다른 데이터입니다. 담당자 평가 저장만으로 전체 서류 결과를 임의 변경하지 마세요.

전체 서류 합격/불합격 결정은 기존 canonical API를 유지합니다.

```http
POST /api/admin/individual-applications/{applicationId}/document-result
```

---

## 2. 신청 정보 수정 API

### 2.1 Endpoint

```http
PATCH /api/admin/individual-applications/{applicationId}
Content-Type: application/json
Authorization: Bearer {adminJwt}
```

권한:

- `APPLICATION_WRITE`
- 해당 관리자의 프로그램 접근 범위 검증
- application type이 INDIVIDUAL인지 검증

### 2.2 Request

```json
{
  "textbookId": 91001,
  "teamName": "우리가 최고",
  "teamMemberCount": 3,
  "teamRole": "LEADER"
}
```

필드 계약:

- `textbookId`: 실제 교재 PK. 교재 미사용을 지원한다면 문자열 sentinel 대신 `null` 또는 명시적 `textbookNotUsed=true` 계약 사용
- `teamName`: trim 후 최대 길이 명시
- `teamMemberCount`: 1 이상, 프로그램 모집 최대 인원을 초과하지 않음
- `teamRole`: `LEADER | MEMBER`
- PATCH이므로 누락 필드는 기존 값을 유지
- 명시적 null 허용 여부를 OpenAPI에 필드별로 기재

`textbookKits`, `textbookQuantity`, `textbookStatus`가 프로그램 정책과 팀 인원에서 유도되는 값이면 BE가 계산해 response에 반환해 주세요. FE 계산값을 SSOT로 저장하지 마세요.

### 2.3 Response

```json
{
  "applicationId": 1690625,
  "programId": 168006,
  "applicationStatus": "APPROVED",
  "textbook": {
    "id": 91001,
    "name": "JA 경제교육 교재",
    "kits": 1,
    "quantity": 3,
    "status": "PREPARING"
  },
  "team": {
    "name": "우리가 최고",
    "memberCount": 3,
    "role": "LEADER"
  },
  "updatedAt": "2026-09-16T12:00:00+09:00",
  "availableActions": [
    "UPDATE_APPLICATION",
    "RESEND_NOTIFICATION"
  ]
}
```

### 2.4 상태·동시성

- `APPROVED`가 아니면 `409 APPLICATION_STATUS_CONFLICT`
- 프로그램과 application의 관계가 일치하지 않으면 404 또는 403
- 존재하지 않거나 해당 프로그램에서 사용할 수 없는 교재면 `422 INVALID_TEXTBOOK`
- 팀 인원 정책 위반이면 `422 INVALID_TEAM_MEMBER_COUNT`
- 낙관적 잠금이 있다면 request에 `version` 또는 `updatedAt`을 받고 충돌 시 409
- 변경 전·후 값과 관리자 ID를 감사 로그에 기록

---

## 3. 담당자 A/B 서류 평가 원장

### 3.1 저장 모델

개인 신청 PK 기준의 별도 평가 원장을 권장합니다.

논리 키:

```text
(individualApplicationId, managerSlot)
```

필수 컬럼:

- `individual_application_id`
- `manager_slot`: `A | B`
- `evaluation`: `PASS | NEUTRAL | FAIL | UNREVIEWED`
- `evaluated_by_admin_id`
- `evaluated_at`
- `updated_at`
- 감사 로그 또는 변경 이력 연결값

조건:

- 동일 application/slot에 한 개의 최신 평가만 존재하도록 unique constraint
- 재저장은 idempotent upsert
- 담당자 A 저장이 담당자 B 값을 변경하지 않음
- 신청 삭제 정책에 맞는 FK/cascade 또는 soft-delete 정책 명시
- 기존 DB에 값이 없으면 `UNREVIEWED`

단순히 `program_individual_application`에 A/B 컬럼을 추가해도 되지만, 평가자·평가시각·변경 이력이 보존되어야 합니다.

### 3.2 조회 계약

목록 응답 `IndividualApplicationListItemResponse`에 필터·테이블용 최소 필드를 추가합니다.

```json
{
  "id": 1690621,
  "managerAEvaluation": "UNREVIEWED",
  "managerBEvaluation": "PASS"
}
```

신청 상세 응답에는 메타데이터를 포함합니다.

```json
{
  "applicationId": 1690621,
  "documentEvaluations": {
    "managerA": {
      "evaluation": "UNREVIEWED",
      "evaluatedByAdminId": null,
      "evaluatedByAdminName": null,
      "evaluatedAt": null
    },
    "managerB": {
      "evaluation": "PASS",
      "evaluatedByAdminId": 165001,
      "evaluatedByAdminName": "테스트 PM",
      "evaluatedAt": "2026-09-16T11:30:00+09:00"
    }
  }
}
```

목록 flat 필드와 상세 객체가 함께 존재한다면 동일 원장을 기준으로 값이 일치해야 합니다.

### 3.3 저장 Endpoint

권장 idempotent API:

```http
PUT /api/admin/individual-applications/{applicationId}/document-evaluations/{managerSlot}
Content-Type: application/json
Authorization: Bearer {adminJwt}
```

`managerSlot`:

```text
A | B
```

Request:

```json
{
  "evaluation": "PASS"
}
```

Response:

```json
{
  "applicationId": 1690621,
  "managerSlot": "A",
  "evaluation": "PASS",
  "evaluatedByAdminId": 165001,
  "evaluatedByAdminName": "테스트 PM",
  "evaluatedAt": "2026-09-16T12:10:00+09:00",
  "managerAEvaluation": "PASS",
  "managerBEvaluation": "PASS",
  "documentStatus": "WAITING",
  "availableActions": [
    "UPDATE_DOCUMENT_EVALUATION",
    "SUBMIT_DOCUMENT_RESULT"
  ]
}
```

권한·상태:

- `APPLICATION_WRITE`
- 담당 프로그램 범위 검증
- 면접이 활성화된 개인 프로그램인지 검증
- 해당 신청이 1차 서류 심사 대상인지 검증
- 최종 서류 결과 이후 평가 수정 허용 여부를 정책으로 확정
- 허용하지 않는 상태면 `409 DOCUMENT_EVALUATION_LOCKED`
- 같은 값을 재저장하면 성공 또는 명시적인 no-op 응답

평가 담당자 A/B와 실제 지정 관리자 간 권한 제한이 있다면 다음을 response의 `availableActions` 또는 별도 필드로 명확히 반환해 주세요.

```json
{
  "canEditManagerAEvaluation": true,
  "canEditManagerBEvaluation": false
}
```

FE가 관리자 이름이나 배열 순서를 보고 편집 권한을 추측하지 않게 해 주세요.

### 3.4 전체 서류 결과와의 관계

담당자 A/B 평가는 검토 원장이고 `documentStatus`는 최종 결과입니다.

- A/B 평가 저장 시 `documentStatus`를 자동 PASS/FAIL 처리하지 않음
- 최종 결과 API 호출 시 필요한 A/B 평가 완결 조건이 있다면 서버에서 검증
- 미완결이면 `422 DOCUMENT_EVALUATION_INCOMPLETE`
- 최종 결과 저장 후 평가를 잠그는다면 최신 `availableActions`에서 `UPDATE_DOCUMENT_EVALUATION` 제거
- document-result response와 재조회 결과가 일치해야 함

---

## 4. `168006` QA 시드

기존 application PK/memberId/status 매트릭스를 유지합니다.

최소 시드:

```text
applicationId=1690621 / memberId=190012
  managerA=UNREVIEWED
  managerB=PASS

applicationId=1690622 / memberId=190013
  managerA=FAIL
  managerB=FAIL

applicationId=1690623 / memberId=190014
  managerA=PASS
  managerB=PASS
```

정보 수정 검증은 승인된 개인 신청 application을 사용합니다. `1690621~1690623`이 승인 전 상태라면 정보 수정 가능 상태로 억지 변경하지 말고, 기존 최종 승인 application 중 하나를 QA 대상으로 명시해 주세요.

시드 조건:

- 재시드 시 중복 평가 행이 생기지 않는 idempotent upsert
- A/B 평가자에는 `168006` 담당 관리자 `165001` / `165002` 사용 가능
- 기존 document/interview/final 상태를 평가 시드 때문에 변경하지 않음
- 정보 수정 QA용 교재와 팀 데이터가 실제 FK를 참조

---

## 5. OpenAPI

다음을 OpenAPI에 반영해 주세요.

- `PATCH /api/admin/individual-applications/{applicationId}`
- 정보 수정 request/response schema
- `PUT /api/admin/individual-applications/{applicationId}/document-evaluations/{managerSlot}`
- `ManagerSlot` enum
- `DocumentManagerEvaluation` enum
- 목록 `managerAEvaluation`, `managerBEvaluation`
- 상세 `documentEvaluations`
- 상태별 `availableActions`
- 403/404/409/422 error response

enum은 문자열 자유 입력이 아니라 OpenAPI enum으로 고정합니다.

---

## 6. 에러 계약

공통 형태:

```json
{
  "error": {
    "code": "DOCUMENT_EVALUATION_LOCKED",
    "message": "최종 서류 결과가 확정되어 평가를 수정할 수 없습니다.",
    "details": {
      "applicationId": 1690623,
      "applicationStatus": "SUBMITTED",
      "documentStatus": "PASS",
      "managerSlot": "A"
    }
  }
}
```

필수 code:

- `INDIVIDUAL_APPLICATION_NOT_FOUND` → 404
- `APPLICATION_STATUS_CONFLICT` → 409
- `DOCUMENT_EVALUATION_LOCKED` → 409
- `DOCUMENT_EVALUATION_INCOMPLETE` → 422
- `INVALID_DOCUMENT_EVALUATION` → 422
- `INVALID_TEXTBOOK` → 422
- `INVALID_TEAM_MEMBER_COUNT` → 422
- `FORBIDDEN_APPLICATION_ACTION` → 403

---

## 7. 테스트

### 7.1 정보 수정

- 승인 완료 application 수정 성공
- 승인 전/반려 application 수정 409
- 부분 PATCH 시 누락 필드 유지
- 사용할 수 없는 교재 422
- 팀 인원 최소/최대 검증
- 팀 역할 enum 검증
- 다른 프로그램 범위 접근 403/404
- 변경 감사 로그 저장
- 재조회 시 수정값 유지

### 7.2 담당자 평가

- 값이 없는 신청은 A/B 모두 `UNREVIEWED`
- A 저장 후 B 값 유지
- B 저장 후 A 값 유지
- 동일 값 재저장 idempotent
- 목록과 상세 평가값 일치
- 담당 프로그램 외 접근 차단
- 잠긴 평가 수정 409
- invalid enum 422
- 평가 저장만으로 최종 `documentStatus`가 바뀌지 않음
- 평가 변경 감사 로그 저장

### 7.3 회귀

- 기존 document-result 동작
- 면접 가능 일정 및 면접 배정
- 최종 결과 PASS/FAIL/RESERVE
- 반려 취소 및 알림 재발송
- 관리자 코멘트
- pagination/count

---

## 8. 수락 기준

1. 승인 완료 개인 신청에서 정보 수정 후 새로고침해도 교재·팀 정보가 유지됩니다.
2. 승인 전 또는 반려 신청에는 수정 action이 제공되지 않고 직접 API 호출도 차단됩니다.
3. 1차 서류 심사 목록·상세에서 담당자 A/B 평가값이 DB 기준으로 표시됩니다.
4. 담당자 평가 변경 후 새로고침해도 값이 유지됩니다.
5. A/B 평가는 서로 독립적으로 저장됩니다.
6. 담당자 평가 저장과 최종 `documentStatus` 결정이 분리됩니다.
7. 목록·상세·mutation response의 평가값과 `availableActions`가 일치합니다.
8. applicationId/programId 범위 검증과 감사 로그가 적용됩니다.
9. OpenAPI와 실제 응답이 일치합니다.
10. 기존 일반 개인 신청 심사 기능과 타 프로그램 유형에 회귀가 없습니다.

---

## 9. BE 완료 후 FE 전달 정보

- 최종 canonical endpoint
- OpenAPI request/response schema와 enum
- 정보 수정 허용 상태와 nullable 규칙
- 교재 수량 계산 SSOT
- 평가 수정 잠금 정책
- 담당자 A/B 편집 권한 정책
- `168006` 정보 수정 및 평가 QA application ID
- 실제 목록·상세·mutation 응답 샘플
- 로컬 시드 재생성 방법
- 추가한 migration과 테스트 목록

## FE 후속 작업

BE 완료 후 FE는 다음을 진행합니다.

1. 최신 OpenAPI codegen
2. 신청 상세 query 연결
3. 승인 완료 + `UPDATE_APPLICATION`일 때만 정보 수정 버튼 노출
4. 심사 상세에서도 수정 모드 입력 UI가 실제로 렌더링되도록 수정
5. 정보 저장 mutation 후 목록·상세 query invalidate
6. 목록/상세 담당자 평가값 매핑
7. A/B 드롭다운을 평가 PUT mutation으로 교체
8. 평가 저장 성공 시 query cache 갱신, 실패 시 서버값 refetch

