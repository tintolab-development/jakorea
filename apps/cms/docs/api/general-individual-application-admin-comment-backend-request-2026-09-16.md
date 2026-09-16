# BE 구현 요청 — 일반 프로그램 개인 신청 관리자 코멘트 API

**작성일:** 2026-09-16  
**대상:** Admin CMS 일반 프로그램 개인 참여자 신청  
**QA 프로그램:** `168006` (`[개인] 커리큘럼형 복수회차 테스트 프로그램`)  
**대상 화면:** 참여자 신청 목록 → 1차 서류 심사 대상자 상세 → 코멘트 작성  
**FE 상태:** 코멘트 모달과 mock/local state 저장만 존재하며 실제 HTTP 호출은 없음  
**관련 문서:** [개인 신청 목록·상세 표시 필드](./general-individual-application-display-fields-backend-request-2026-09-16.md) · [개인 신청 결과 알림 재발송](./general-individual-application-notification-resend-backend-request-2026-09-16.md)

## 백엔드 전달용 프롬프트

아래 요구사항에 따라 일반 프로그램 개인 참여자 신청의 **관리자 코멘트 조회·저장 API**를 구현해 주세요.

현재 CMS의 「코멘트 작성」은 다음 FE mock 함수만 호출합니다.

```text
patchGeneralIndividualApplicantDetail(applicationId, {
  adminComment
})
```

따라서 화면에서는 저장된 것처럼 보이지만 새로고침하면 유지되지 않으며 DB에는 반영되지 않습니다.

현재 BE에는 강사 신청 관리자 코멘트 구현만 존재합니다.

```http
PATCH /api/admin/instructor-applications/{applicationId}
```

- Controller: `ProgramApplicationCanonicalAdminController#updateInstructorApplication`
- Service: `InstructorApplicationAdminService#update`
- Column: `program_instructor_application.manager_comment`
- Request: `InstructorApplicationRequests.Update`
- 권한: `APPLICATION_WRITE`
- 변경 감사 로그 기록

개인 신청도 위 구조와 동일한 원칙으로 구현하되, `program_individual_application` 전용 저장소·DTO·권한 검증을 사용해 주세요.

---

## 1. 현재 누락 구조

현재 `program_individual_application`에는 관리자 코멘트 컬럼이 없습니다.

현재 개인 신청 API:

```http
GET  /api/admin/programs/{programId}/individual-applications
POST /api/admin/individual-applications/{applicationId}/approve
POST /api/admin/individual-applications/{applicationId}/reject
POST /api/admin/individual-applications/{applicationId}/notifications/resend
POST /api/admin/individual-applications/{applicationId}/cancel-rejection
POST /api/admin/individual-applications/{applicationId}/give-up
POST /api/admin/individual-applications/{applicationId}/document-result
POST /api/admin/individual-applications/{applicationId}/final-result
```

누락:

- 개인 신청 관리자 코멘트 저장 컬럼
- 코멘트 수정 endpoint
- 목록 또는 상세 조회의 `managerComment`
- 코멘트 변경 감사 기록

---

## 2. DB 마이그레이션

권장 migration:

```sql
ALTER TABLE program_individual_application
    ADD COLUMN IF NOT EXISTS manager_comment TEXT;
```

조건:

- 기존 행은 `NULL`.
- 빈 문자열은 저장하지 않고 `NULL`로 정규화합니다.
- 최대 길이는 API에서 2,000자로 제한합니다.
- 코멘트만 수정할 때 신청 상태·심사 상태·수정 이력을 덮어쓰지 않습니다.
- 별도 comment history 테이블이 프로젝트 표준이라면 해당 구조를 사용해도 되지만 최종 최신값 조회 계약은 동일해야 합니다.

---

## 3. 저장 API

권장 endpoint:

```http
PATCH /api/admin/individual-applications/{applicationId}
```

권장 request:

```json
{
  "managerComment": "신청 정보 재확인 필요"
}
```

삭제:

```json
{
  "managerComment": null
}
```

또는 빈 문자열을 전달한 경우 trim 후 `null`로 저장합니다.

권장 DTO:

```java
public record IndividualApplicationUpdateRequest(
        @Size(max = 2000) String managerComment
) {
}
```

부분 수정 계약:

- 요청에 `managerComment` 키가 있으면 해당 값으로 수정합니다.
- 향후 다른 수정 필드가 추가되더라도 전달되지 않은 필드를 `null`로 덮어쓰지 않습니다.
- 현재 P0 범위에서는 `managerComment` 외 필드를 허용하지 않아도 됩니다.

---

## 4. 권한과 범위

Controller:

```java
@RequiresAdminPermission("APPLICATION_WRITE")
```

서버 검증:

1. `applicationId`에 해당하는 개인 신청이 존재해야 합니다.
2. 해당 신청의 프로그램이 삭제되지 않은 일반 프로그램이어야 합니다.
3. 프로그램에 `APPLICATION_REVIEW` capability가 있어야 합니다.
4. 관리자의 프로그램 접근 범위를 검증합니다.
5. FE 버튼 노출 여부를 권한 검증으로 신뢰하지 않습니다.

현재 CMS는 승인 완료 개인 신청에서 「코멘트 작성」을 노출합니다.
BE가 다른 상태에서도 코멘트 저장을 허용한다면 허용 상태를 OpenAPI description과 `availableActions`에 명시해 주세요.

권장 허용 상태:

- `APPROVED`

그 외 상태를 허용할 운영 요구가 없다면:

```text
409 INDIVIDUAL_APPLICATION_COMMENT_NOT_ALLOWED
```

---

## 5. 조회 계약

코멘트 저장 후 새로고침해도 값을 유지하려면 조회 API에서 최신값을 반환해야 합니다.

### 권장

개인 신청 상세 API:

```http
GET /api/admin/individual-applications/{applicationId}
```

응답:

```json
{
  "id": 1690625,
  "programId": 168006,
  "managerComment": "신청 정보 재확인 필요",
  "updatedAt": "2026-09-16T03:30:00Z"
}
```

상세 API가 아직 구현되지 않았다면 기존 목록 API에도 임시로 포함해 주세요.

```http
GET /api/admin/programs/{programId}/individual-applications
```

```json
{
  "id": 1690625,
  "managerComment": "신청 정보 재확인 필요"
}
```

목록 응답에 포함하더라도 코멘트는 Admin CMS 전용 데이터이며 Platform/회원용 API에는 노출하지 않습니다.

---

## 6. 응답 계약

개인 신청 상세 API가 함께 구현되어 있다면 수정 후 최신 상세 response를 반환하는 것을 권장합니다.

```json
{
  "id": 1690625,
  "programId": 168006,
  "managerComment": "신청 정보 재확인 필요",
  "updatedAt": "2026-09-16T03:30:00Z",
  "availableActions": [
    "COMMENT_UPDATE"
  ]
}
```

상세 response를 아직 사용할 수 없다면 최소 mutation response:

```json
{
  "applicationId": 1690625,
  "managerComment": "신청 정보 재확인 필요",
  "updatedAt": "2026-09-16T03:30:00Z"
}
```

응답값은 DB commit이 완료된 최신값이어야 합니다.

---

## 7. 감사와 개인정보

관리자 코멘트는 개인정보나 민감한 운영 메모를 포함할 수 있습니다.

- 관리자 ID, 신청 ID, 프로그램 ID, 변경 시각, 성공/실패를 감사 기록합니다.
- 일반 애플리케이션 로그에 코멘트 원문을 출력하지 않습니다.
- 공통 감사 정책이 코멘트 원문 보관을 허용하지 않으면 audit payload에는 다음만 저장합니다.
  - 변경 전/후 null 여부
  - 변경 전/후 길이
  - 필요 시 단방향 hash
- 원문 변경 이력이 업무상 반드시 필요하면 일반 로그가 아닌 접근 통제된 감사 저장소를 사용합니다.
- 코멘트 조회 응답은 Admin CMS 권한 범위에서만 반환합니다.

권장 event type:

```text
INDIVIDUAL_APPLICATION_MANAGER_COMMENT_UPDATED
```

resource:

```text
resourceType = INDIVIDUAL_APPLICATION
resourceId = applicationId
```

감사 기록 실패 시 저장 요청도 rollback하는 기존 관리자 보정 정책을 따릅니다.

---

## 8. 동시 수정

여러 관리자가 같은 신청을 동시에 수정할 수 있으므로 lost update를 방지해 주세요.

권장 방식 중 하나:

1. request에 `updatedAt` 또는 version을 포함한 optimistic locking
2. `If-Match`/ETag
3. DB version column

충돌 시:

```text
409 INDIVIDUAL_APPLICATION_UPDATE_CONFLICT
```

최소 구현에서는 마지막 저장 우선 정책을 사용할 수 있지만, 그 경우 정책을 OpenAPI에 명시하고 감사 기록을 남겨 주세요.

---

## 9. 오류 계약

| HTTP | errorCode | 조건 |
|---|---|---|
| `400` | 공통 validation error | body 형식 오류 |
| `403` | 기존 권한/capability 오류 | APPLICATION_WRITE 또는 프로그램 접근 권한 없음 |
| `404` | `INDIVIDUAL_APPLICATION_NOT_FOUND` | 개인 신청 없음 |
| `409` | `INDIVIDUAL_APPLICATION_COMMENT_NOT_ALLOWED` | 저장 불가 상태 |
| `409` | `INDIVIDUAL_APPLICATION_UPDATE_CONFLICT` | 동시 수정 충돌 |
| `422` | `INDIVIDUAL_APPLICATION_COMMENT_TOO_LONG` | trim 후 2,000자 초과 |

프로젝트 공통 error envelope를 사용해 주세요.

---

## 10. OpenAPI

구현 후 backend OpenAPI에 다음을 반영해 주세요.

- `PATCH /api/admin/individual-applications/{applicationId}`
- operationId
- `IndividualApplicationUpdateRequest`
- `managerComment` nullable, maxLength 2000
- 수정 response
- 조회 response의 `managerComment`
- 권한과 허용 상태
- 403/404/409/422 오류 코드

권장 operationId:

```text
updateIndividualApplication
```

---

## 11. 테스트

필수 테스트:

1. 승인된 개인 신청 코멘트 신규 저장
2. 기존 코멘트 수정
3. `null` 또는 공백으로 코멘트 삭제
4. 앞뒤 공백 trim
5. 2,000자 저장 성공
6. 2,001자 validation 실패
7. 존재하지 않는 신청 `404`
8. 권한 없음 `403`
9. 프로그램 capability 없음
10. 허용되지 않은 신청 상태 `409`
11. 코멘트 수정 후 신청 상태·심사 상태 불변
12. 수정 response와 재조회 값 일치
13. 감사 기록 생성
14. 감사 실패 시 transaction rollback
15. 일반 로그에 코멘트 원문 미노출
16. Platform/회원 API에 관리자 코멘트 미노출
17. 동시 수정 충돌 정책

---

## 12. `168006` 스모크

승인된 개인 신청 PK를 사용하여 검증해 주세요.

```bash
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8080/api/admin/individual-applications/1690625 \
  -d '{
    "managerComment": "신청 정보 재확인 필요"
  }'
```

재조회:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/admin/individual-applications/1690625
```

상세 API가 아직 없다면:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/admin/programs/168006/individual-applications?page=0&size=50"
```

---

## 13. 수락 기준

1. 승인된 개인 신청에서 코멘트를 등록·수정·삭제할 수 있습니다.
2. 새로고침 후 조회 API에서 저장값이 유지됩니다.
3. 코멘트 수정이 신청/심사 상태를 변경하지 않습니다.
4. 권한과 프로그램 범위를 서버에서 검증합니다.
5. 관리자 코멘트가 Platform/회원 API에 노출되지 않습니다.
6. 감사 기록과 DB 저장이 같은 transaction 경계에서 처리됩니다.
7. OpenAPI와 실제 요청/응답이 일치합니다.
8. `168006` 실제 신청 건에서 저장과 재조회 스모크가 통과합니다.

---

## 14. BE 완료 후 FE 전달 정보

- 최종 endpoint와 operationId
- request/response OpenAPI schema
- 코멘트 조회 endpoint와 필드명
- nullable/trim/maxLength 정책
- 허용 신청 상태
- 동시 수정 정책
- 오류 코드
- `168006`에서 저장 가능한 application PK
- 실제 PATCH/GET 응답 예시
- 감사 event type
- 추가된 테스트 목록

## FE 후속 작업

BE 구현과 OpenAPI 전달 후 FE에서 다음을 진행합니다.

1. OpenAPI/Orval 재생성
2. 개인 신청 코멘트 mutation 추가
3. 모달 저장 중 loading 및 중복 클릭 방지
4. mutation 성공 후에만 모달 닫기
5. 성공 response를 상세 캐시에 반영
6. 개인 신청 목록·상세 query invalidate
7. 403/404/409/422 오류 메시지 처리
8. `patchGeneralIndividualApplicantDetail` mock 저장 제거
9. 새로고침 후 DB 값 유지 확인

## 비범위

- 존재하지 않는 endpoint를 FE에 임시 하드코딩
- 관리자 코멘트를 회원 프로필 코멘트와 공유
- 관리자 코멘트를 Platform/회원 화면에 노출
- 코멘트 저장 시 신청 상태 변경
- 일반 프로그램 개인 신청 외 유형의 API 변경
