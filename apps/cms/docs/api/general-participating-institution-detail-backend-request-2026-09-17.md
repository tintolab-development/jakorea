# 일반 프로그램 참여 기관 상세 — 백엔드 보완 요청

**작성일:** 2026-09-17  
**대상:** 일반 프로그램 > 프로그램 진행 현황 > 참여 기관 > 참여 기관 상세

## 1. 재확인 결과

| 기능 | 현재 API | FE 상태 | 서버 보완 |
|------|----------|---------|-----------|
| 상세 조회 | 참여 기관 목록 GET만 존재 | 목록 행으로 상세 임시 구성 | 상세 GET 필요 |
| 정보 수정 | 합반 API만 존재 | 합반 외 필드는 unavailable 안내 | 상세 PATCH 필요 |
| 코멘트 작성 | 관리자 코멘트 CRUD 존재 | `organizationApplicationId` 기준 연동 완료 | 추가 수정 없음 |
| 개인정보 상세보기 | 회원 개인정보 unmask 존재 | 담당 교사 회원 기준 연동 | 기관 신청 시점 원문이 필요하면 전용 unmask 필요 |
| 활동 포기 | participant give-up API 존재 | participantId·reason 연동 완료 | 선택 일정 기준 처리 계약 보완 필요 |
| 교육 진행 일정 변경 | 변경 이력 API만 존재 | 변경 모달 노출·저장 시 unavailable 안내 | 실제 일정 변경 API 필요 |

## 2. 상세 조회 API

`GET /api/admin/organization-applications/{applicationId}`

필수 응답:

- `applicationId`, `participantId`, `programId`
- `organizationId`, `organizationName`
- `teacherMemberId`, `teacherName`
- 마스킹된 `teacherPhone`, `teacherMobile`, `teacherEmail`
- `region`, `addressDetail`
- `educationGrade`, `educationFormat`, `classCount`, `studentCount`
- `applicationReason`, `otherRequests`
- `computerInRoom`
- `waitingRoomAvailable`, `waitingRoomLocation`
- `mealProvided`, `mealNotice`, `parkingInfo`
- `textbookId`, `textbookName`, `textbookGrade`, `textbookKits`, `textbookQuantity`
- 합반 신청 상태와 파트너 신청 ID
- `availableActions`

## 3. 정보 수정 API

`PATCH /api/admin/organization-applications/{applicationId}`

수정 대상:

- 기관 주소 상세
- 교육 형태
- 담당 교사 이름·연락처·이메일
- 신청 사유·기타 요청
- 교육장 컴퓨터·대기실·식사·주차 정보
- 교재 선택·수량

요구사항:

- 수정 가능한 필드만 부분 수정
- 권한·담당 프로그램 범위 검증
- 변경 감사로그 저장
- 성공 응답으로 갱신된 상세 반환
- 상태 충돌은 409와 구조화된 오류 코드 반환

합반 정보는 기존 합반 API를 유지하고 이 PATCH와 책임을 중복하지 않습니다.

## 4. 개인정보 원문 조회 API

기관 신청 당시 저장된 담당 교사 정보가 회원 최신 정보와 다를 수 있다면 아래 전용 API가 필요합니다.

`POST /api/admin/organization-applications/{applicationId}/privacy/unmask`

요청:

```json
{
  "reason": "열람 사유"
}
```

응답:

- `teacherName`
- `teacherPhone`
- `teacherMobile`
- `teacherEmail`
- `privacyStatus: "UNMASKED"`

요구사항:

- `PRIVACY_RAW_READ` 권한
- 열람 사유 필수
- 담당 프로그램 범위 검증
- 감사로그 저장 실패 시 원문 반환 차단

기관 신청 시점 원문이 필요하지 않고 회원 최신 정보 사용이 정책이라면 신규 API 없이 기존 회원 unmask를 공식 계약으로 명시해 주세요.

## 5. 교육 진행 일정 변경 API

화면은 회차별 기준 일정과 변경 날짜를 입력합니다. 현재 `schedule change histories` API는 변경 이력 기록 계약이며 실제 일정 날짜 변경 결과를 보장하지 않습니다.

### 저장 경계

- 일정 변경은 참여 기관 **정보 수정 저장과 분리**합니다.
- 모달의 `일정 변경` 버튼이 일정 API를 즉시 호출합니다.
- 신청 정보 PATCH payload에는 일정 변경값을 포함하지 않습니다.
- 일정 변경 실패가 신청 정보 수정 결과에 영향을 주거나, 반대로 신청 정보 저장 실패가 일정 변경을 롤백하지 않도록 API 책임을 분리합니다.
- 성공 후 FE는 참여 기관 목록·상세 sessions query를 재조회합니다.

### 요청안

모달에서 여러 회차를 동시에 변경할 수 있으므로 단건 API 반복 호출보다 아래 일괄 API를 권장합니다.

`PATCH /api/admin/programs/{programId}/participants/{participantId}/schedules`

```json
{
  "changes": [
    {
      "scheduleId": 12345,
      "educationDate": "2026-05-01"
    },
    {
      "scheduleId": 12346,
      "educationDate": "2026-05-08"
    }
  ],
  "reason": "관리자 일정 변경"
}
```

요구사항:

- 여러 회차 변경은 서버 트랜잭션에서 **전체 성공 또는 전체 실패**
- 프로그램 교육 진행 기간 내 날짜만 허용
- 완료된 일정 변경 차단
- 강사·봉사자 배정 충돌 검증
- 성공 시 변경된 일정 배열과 회차별 변경 이력 반환
- 변경 후 참여 기관 목록·상세 sessions 재조회 가능
- 충돌 또는 변경 불가능 상태는 409 반환

단건 API만 제공한다면 `PATCH /api/admin/programs/{programId}/schedules/{scheduleId}`를 사용할 수 있으나, 여러 회차 중 일부만 저장되는 부분 성공 처리·롤백 계약을 별도로 정의해야 합니다.

## 6. 활동 포기 API 보완

현재 API:

`POST /api/admin/programs/{programId}/participants/{participantId}/give-up`

현재 FE 연동:

- ORGANIZATION participant의 `participantId`를 path로 전달
- `ApplicationGiveUpRequest.reason` 전달
- 성공 후 참여 기관 목록 query 재조회
- `availableActions`에 `GIVE_UP`이 없거나 이미 `GIVE_UP` 상태인 행은 재요청 차단
- remote 비활성 시 로컬 상태 변경 없이 unavailable 안내

현재 계약 차이:

- 화면은 “선택한 교육 일정부터 활동 포기”를 요구합니다.
- API 본문은 `reason`만 지원하므로 선택 일정 식별자를 전달할 수 없습니다.
- FE는 현재 학교명과 선택 일정 라벨을 reason 문자열에 포함하지만, 이는 서버가 일정 경계를 처리할 수 있는 구조화 값이 아닙니다.

요청안:

```json
{
  "reason": "활동 포기",
  "stopScheduleId": 12345
}
```

`stopScheduleId`는 participants 응답의 `sessions[].resolvedScheduleId`와 동일한 서버 식별자를 사용해야 합니다.

성공 처리 요구사항:

- 선택 일정과 이후 일정의 취소·배정 해제 범위를 서버에서 확정
- 이미 완료된 이전 일정은 유지
- 참여 상태·`giveUpAt`·영향받은 일정 목록을 응답
- 중복 포기 또는 처리 불가능한 일정은 409 반환
- 감사로그에 사유와 기준 일정 저장

전체 참여를 즉시 포기하는 정책이라면 화면에서 일정 선택을 제거할 수 있도록 해당 정책을 명시해 주세요.

## 7. 참여 기관 목록 계약

상세 진입과 FE 연동을 위해 ORGANIZATION participant 목록에서 아래 값은 항상 필요합니다.

- `participantId`
- `organizationApplicationId`
- `teacherMemberId`

## 8. 수락 기준

- 상세 새로고침 후에도 목록 행에 없는 신청 정보가 유지됩니다.
- 정보 수정 후 재조회 결과가 저장값과 일치합니다.
- 코멘트 CRUD의 target은 `ORGANIZATION_APPLICATION + organizationApplicationId`로 동작합니다.
- 개인정보 원문은 권한·사유·감사로그 검증을 통과한 경우에만 표시됩니다.
- 일정 변경 후 재조회한 회차 날짜가 저장값과 일치합니다.
- 활동 포기 후 재조회 시 참여 상태와 선택 일정 이후 일정 상태가 서버 응답에 일치합니다.
