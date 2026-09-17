# BE 구현 요청 — 일반 프로그램 봉사자 담당자 A/B 서류평가 API

**작성일:** 2026-09-16
**대상:** Admin CMS 일반 프로그램 봉사자 신청
**대상 화면:** 프로그램 상세 → 봉사자 신청 → 1차 서류 심사 → 신청 상세/목록 → 담당자 서류 평가
**범위 제한:** 일반 프로그램 봉사자 신청만 해당. 개인 참여자·기관·강사·UJAT·1사1교·Gemini 계약은 변경하지 않음

## 백엔드 전달용 프롬프트

아래 요구사항에 따라 일반 프로그램 봉사자 신청의 **담당자 A/B 서류평가 조회·저장 API**를 구현해 주세요.

현재 FE에는 담당자 A/B 평가 드롭다운이 있지만 저장 API가 없어 아래 안내만 표시합니다.

```text
API 연동 안내
봉사자 담당자 서류평가
해당 기능의 API 연동이 되어 있지 않아 저장할 수 없습니다.
```

개인 참여자에는 다음 canonical API가 이미 존재하지만 봉사자 신청에는 대응 API가 없습니다.

```http
PUT /api/admin/individual-applications/{applicationId}/document-evaluations/{managerSlot}
```

개인 참여자 ID와 봉사자 신청 ID는 서로 다른 리소스이므로 기존 individual endpoint를 봉사자 화면에서 재사용하지 마세요.

---

## 1. 필요한 API 계약

### 1.1 봉사자 담당자 평가 저장

```http
PUT /api/admin/volunteer-applications/{applicationId}/document-evaluations/{managerSlot}
Content-Type: application/json
Authorization: Bearer {adminJwt}
```

Path:

- `applicationId`: `program_volunteer_application.id`
- `managerSlot`: `A | B`

Request:

```json
{
  "evaluation": "PASS"
}
```

`evaluation` enum:

- `PASS`
- `NEUTRAL`
- `FAIL`
- `UNREVIEWED`

Response 예시:

```json
{
  "applicationId": 10001,
  "managerSlot": "A",
  "evaluation": "PASS",
  "evaluatedByAdminId": 20001,
  "evaluatedByAdminName": "담당자명",
  "evaluatedAt": "2026-09-16T13:00:00Z",
  "managerAEvaluation": "PASS",
  "managerBEvaluation": "UNREVIEWED",
  "documentStatus": "WAITING",
  "availableActions": [
    "VIEW",
    "UPDATE_DOCUMENT_EVALUATION",
    "SUBMIT_DOCUMENT_RESULT"
  ],
  "canEditManagerAEvaluation": true,
  "canEditManagerBEvaluation": false
}
```

개인 참여자 API와 동일한 enum·오류 형식·응답 의미를 사용하되 DTO와 저장 대상은 봉사자 리소스로 분리해 주세요.

### 1.2 봉사자 목록 조회 응답 확장

기존 API:

```http
GET /api/admin/programs/{programId}/volunteer-applications
```

각 `VolunteerApplicationListItemResponse`에 다음 필드를 추가해 주세요.

```json
{
  "managerAEvaluation": "PASS",
  "managerBEvaluation": "NEUTRAL",
  "canEditManagerAEvaluation": true,
  "canEditManagerBEvaluation": false,
  "availableActions": [
    "VIEW",
    "UPDATE_DOCUMENT_EVALUATION"
  ]
}
```

평가가 없으면 `UNREVIEWED`를 반환해 주세요. FE가 누락값을 임의 추론하거나 새로고침 후 로컬 상태를 유지하지 않도록 조회 응답이 평가 원장이 되어야 합니다.

슬롯별 권한 제한이 없다면 `canEditManagerAEvaluation`, `canEditManagerBEvaluation` 대신 `availableActions`의 `UPDATE_DOCUMENT_EVALUATION`으로 양쪽 슬롯의 편집 가능 여부를 표현할 수 있습니다. 슬롯별 담당자가 다르면 두 boolean을 반드시 반환해 주세요.

---

## 2. 도메인·권한 규칙

- 필요 권한: `APPLICATION_WRITE`
- 관리자의 프로그램 접근 범위를 검증
- 대상 신청이 `VOLUNTEER` 유형인지 검증
- 면접이 활성화된 일반 프로그램의 1차 서류 심사 대상인지 검증
- 프로그램에 지정된 담당자 A/B가 본인 슬롯만 수정하도록 검증
- 같은 값을 재저장하면 성공하거나 명시적인 no-op 성공 응답을 반환
- 담당자 평가 저장만으로 최종 `documentStatus`를 변경하지 않음
- 전체 서류 합격/불합격은 기존 API를 유지

```http
POST /api/admin/volunteer-applications/{applicationId}/document-result
POST /api/admin/volunteer-applications/document-results/bulk
```

최종 서류 결과 확정 후 평가 수정 허용 여부는 개인 참여자 정책과 일치시켜 주세요. 잠그는 정책이라면 조회 응답에서 편집 권한을 제거하고 저장 요청에는 `409 DOCUMENT_EVALUATION_LOCKED`를 반환해 주세요.

권장 오류:

- `400 INVALID_REQUEST`
- `403 FORBIDDEN_APPLICATION_ACTION`
- `404 VOLUNTEER_APPLICATION_NOT_FOUND`
- `409 DOCUMENT_EVALUATION_LOCKED`
- `422 INVALID_DOCUMENT_EVALUATION`

---

## 3. 저장소·마이그레이션

- 봉사자 신청 FK를 참조하는 담당자 평가 원장을 추가해 주세요.
- A/B 슬롯별 평가가 중복 생성되지 않도록 `(volunteer_application_id, manager_slot)` unique 제약을 적용해 주세요.
- 평가자 관리자 ID, 평가값, 평가일시, 생성·수정일시를 보존해 주세요.
- 담당자 배정이 신청별이 아니라 프로그램별이면 프로그램 ID와 슬롯 기준 배정 원장을 명시적으로 구성해 주세요.
- 기존 개인 참여자 전용 테이블을 의미 변경하여 조용히 공유하지 마세요.
- 기존 적용 마이그레이션을 수정하지 말고 새 additive migration으로 추가해 주세요.

감사 로그에는 최소한 다음 값을 기록해 주세요.

- actor admin ID
- volunteer application ID
- program ID
- manager slot
- before/after evaluation
- 처리 결과와 시각

---

## 4. OpenAPI 요구사항

- 새 endpoint와 request/response schema를 `backend.openapi.json`에 포함
- `VolunteerApplicationListItemResponse` 확장 필드를 OpenAPI에 반영
- `managerSlot`과 `evaluation`을 enum으로 명시
- 성공 및 `403/404/409/422` 응답 설명 추가
- 백엔드 route inventory와 OpenAPI route inventory 일치 검증

---

## 5. 인수 조건

1. 담당자 A가 A 슬롯을 `PASS`로 저장하면 `200`과 최신 A/B 평가가 반환된다.
2. 목록을 재조회하면 저장한 평가가 유지된다.
3. 담당자 A가 권한 없는 B 슬롯을 수정하면 `403`이 반환된다.
4. 다른 프로그램 범위의 관리자가 수정하면 `403`이 반환된다.
5. 존재하지 않는 봉사자 신청은 `404`를 반환한다.
6. 잘못된 슬롯 또는 평가값은 `422`를 반환한다.
7. 평가 저장만으로 `documentStatus`는 변경되지 않는다.
8. 최종 서류 결과 확정 후 정책상 잠긴 신청은 `409`를 반환한다.
9. 동시 요청에도 슬롯별 평가 원장이 중복 생성되지 않는다.
10. 저장 성공과 실패가 감사 로그에 기록된다.
11. 목록 응답의 평가값·편집 권한·`availableActions`가 현재 로그인 관리자 기준으로 일치한다.

---

## 6. FE 후속 연동 지점

백엔드 배포 및 OpenAPI 동기화 후 FE에서 다음을 변경할 예정입니다.

- `useGeneralVolunteerDocScreening`의 `notifyProgramApiUnavailable(...)` 제거
- 봉사자 평가 PUT client 추가
- A/B 평가 변경 시 원격 저장 후 `generalApplicationsQueryKeys.volunteerList(programId)` 무효화
- 저장 실패 시 API 오류 모달 표시 및 목록 재조회
- 목록 adapter에서 `managerAEvaluation`, `managerBEvaluation`, 슬롯별 편집 권한 매핑
- API 호출·권한·새로고침 유지 회귀 테스트 추가
