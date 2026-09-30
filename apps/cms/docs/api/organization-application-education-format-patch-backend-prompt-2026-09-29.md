# Cursor prompt — 기관 신청 PATCH에서 교육 형식 잠금이 다른 필드를 막지 않게 (JABACK)

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 전부 탐색하지 말고, **이 문서의 계약과 재현만** 사용하라.  
질문이 필요하면 스키마가 값을 거부할 때(enum·NOT NULL·상태 전이)만 하라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/organization-application-education-format-patch-backend-prompt-2026-09-29.md`

대상은 CMS 관리자 API다. 홈페이지 어드민(`JAHOMEADMINBACK`, `localhost:8081`)이 아니다.

확인 기준: 로컬 `GET http://localhost:8080/v3/api-docs` 와 **관리자 Bearer**.  
`OrganizationApplicationUpdateRequest` 설명은 이미 이렇다.

> 승인된 기관 신청 정보를 부분 수정합니다. 생략한 항목은 현재 운영 스냅샷 값을 유지합니다.

path·필드명·enum을 새로 만들지 마라. `requestedEducationFormat` 허용 값은 기존대로 `ONLINE` | `OFFLINE` | `HYBRID` 만이다.

| Method | Path |
|--------|------|
| PATCH | `/api/admin/organization-applications/{applicationId}` |
| GET | `/api/admin/organization-applications/{applicationId}` |

---

## Goal

교육 형식을 바꾸지 않은 저장이 `REQUESTED_EDUCATION_FORMAT_NOT_EDITABLE`로 통째 거절되지 않게 하라.  
학년·학급 수·학생 수·주소·교사·교재·식사·대기실 수정은 교육 형식 잠금과 분리한다.

---

## 재현

신청 `1691186`. 화면 저장이 아래 body로 `PATCH /api/admin/organization-applications/1691186` 를 호출했다.

```json
{
  "requestedGrade": "2학년",
  "organizationAddressDetail": "본관",
  "requestedClassCount": 2,
  "requestedStudentCount": 112,
  "requestedEducationFormat": "ONLINE",
  "teacherMemberId": 190001,
  "teacherPhone": "010-****-9470",
  "teacherEmail": "2kunhe***@tinto.co.kr",
  "textbookId": null,
  "textbookKits": 0,
  "textbookQuantity": 0,
  "applicationReason": "11",
  "otherRequests": "11",
  "mealProvided": false,
  "waitingRoomAvailable": false
}
```

응답:

```json
{
  "success": false,
  "data": null,
  "message": "현재 상태에서는 요청 교육 형식을 수정할 수 없습니다.",
  "error": {
    "code": "REQUESTED_EDUCATION_FORMAT_NOT_EDITABLE",
    "message": "현재 상태에서는 요청 교육 형식을 수정할 수 없습니다.",
    "field": "educationFormat"
  }
}
```

이 한 필드의 거절 때문에 학년·학급·학생 수·주소·교사·교재·사유가 하나도 저장되지 않았다.

FE는 이제 **교육 형태가 저장 전과 같을 때 `requestedEducationFormat` 키를 빼서** 보낸다.  
그래도 서버는 아래를 지켜야 한다. 키를 넣는 다른 클라이언트도 같은 계약을 쓴다.

---

## 해야 할 것

1. `requestedEducationFormat` 키가 **없으면** 저장된 교육 형식을 유지한다. 이 코드로 거절하지 마라.
2. 키가 **있고 값이 현재 운영 스냅샷과 같으면** 변경이 아니다. `ONLINE`을 다시 `ONLINE`으로 보내도 `REQUESTED_EDUCATION_FORMAT_NOT_EDITABLE`을 내지 마라. 같은 요청의 다른 키는 저장한다.
3. 키가 **있고 값이 스냅샷과 다르며**, 그 상태에서 교육 형식 변경이 금지되면 그때만 `400` + `REQUESTED_EDUCATION_FORMAT_NOT_EDITABLE`을 낸다. `error.field`는 요청 키 이름인 `requestedEducationFormat`으로 한다. `educationFormat`으로 두지 마라.
4. 3번의 실제 변경 거절은 그 요청을 저장하지 않아도 된다. 2번(같은 값)과 1번(키 없음)에서는 나머지 필드를 저장한다.
5. `textbookId: null`, `textbookKits: 0`, `textbookQuantity: 0`은 “교재 없음”이다. 교육 형식 처리와 섞어 무시하거나 기본 수량으로 되돌리지 마라.
6. 교육 형식 변경을 막는 신청 상태 목록을 응답에 적어라. 코드를 추가하지 말고, 지금 거절하는 상태만 나열하라.

## 하지 말 것

- 잠긴 상태에서 교육 형식을 **다른 값으로** 덮어쓰지 마라. 금지 자체는 유지한다.
- path를 나누거나 교육 형식 전용 API를 만들지 마라.
- `requestedEducationFormat` enum에 한글(`온라인`)을 추가하지 마라.
- 이 수정으로 승인·반려·취소 API 동작을 바꾸지 마라.

---

## 검수

신청 `1691186`의 GET으로 현재 `requestedEducationFormat`과 신청 상태를 확인한 뒤:

```http
PATCH /api/admin/organization-applications/1691186
{
  "requestedGrade": "2학년",
  "requestedClassCount": 2,
  "requestedStudentCount": 112,
  "requestedEducationFormat": "<GET과 같은 값>",
  "organizationAddressDetail": "본관"
}
```

기대:

- HTTP 200
- `requestedGrade` `2학년`, `requestedClassCount` 2, `requestedStudentCount` 112, `organizationAddressDetail` `본관`이 저장된다
- `requestedEducationFormat`은 GET 때 값 그대로다

키가 아예 없는 PATCH도 200이고, 교육 형식은 유지된다.

교육 형식을 스냅샷과 **다른** enum으로 보내고 그 상태가 잠겨 있으면 400, `error.code`는 `REQUESTED_EDUCATION_FORMAT_NOT_EDITABLE`, `error.field`는 `requestedEducationFormat`이다. 이 경우 다른 필드는 바뀌지 않아도 된다.

---

## 완료 보고

아래만 답하라.

- `1691186`의 신청 상태와 저장돼 있던 `requestedEducationFormat`
- 같은 값을 포함한 PATCH의 HTTP 상태
- 교육 형식 변경을 거절하는 상태 목록
- `error.field`에 쓰는 문자열
