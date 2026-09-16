# BE 구현 요청 — 일반 프로그램 개인 참여자 면접 가능 일정 API

**작성일:** 2026-09-16  
**대상 프로그램:** `168006` (`[개인] 커리큘럼형 복수회차 테스트 프로그램`)  
**대상 화면:** CMS 일반 프로그램 → 참여자 신청 목록 → 1차 서류 합격자 명단  
**관련 API:** `GET /api/admin/programs/{programId}/individual-applications`

**후속 요청:** [개인 신청 목록·상세 표시 필드](./general-individual-application-display-fields-backend-request-2026-09-16.md)

## 백엔드 전달용 프롬프트

아래 요구사항에 따라 일반 프로그램 개인 참여자의 **신청자 면접 가능 일정**을 조회 API와 QA 시드에 추가해 주세요.

현재 CMS는 `GET /api/admin/programs/168006/individual-applications` 응답을 사용해 1차 서류 합격자 명단과 면접 일정 캘린더를 렌더링합니다. 그러나 응답에 신청자가 제출한 면접 가능 일정이 없어 모든 행이 `면접 가능 일정 수 0개`로 표시되고 캘린더도 비어 있습니다.

`assignedInterviewStartAt` / `assignedInterviewEndAt`은 관리자가 확정한 **면접 배정 일정**입니다. 이번 요청의 **신청자 면접 가능 일정**과 의미가 다르므로 같은 필드나 데이터로 대체하지 마세요.

### 1. 조회 응답 확장

`GET /api/admin/programs/{programId}/individual-applications`의 각 item에 다음 필드를 추가해 주세요.

권장 계약:

```json
{
  "id": 1690623,
  "memberId": 190015,
  "interviewAvailabilitySlots": [
    {
      "startAt": "2026-09-10T09:00:00+09:00",
      "endAt": "2026-09-10T09:30:00+09:00"
    },
    {
      "startAt": "2026-09-10T14:00:00+09:00",
      "endAt": "2026-09-10T14:30:00+09:00"
    }
  ],
  "interviewAvailabilityCount": 2,
  "assignedInterviewSlotId": null,
  "assignedInterviewStartAt": null,
  "assignedInterviewEndAt": null
}
```

계약 조건:

- `interviewAvailabilitySlots`는 신청자가 신청서에서 제출한 가능한 모든 시간 구간입니다.
- 날짜와 시간은 표시 문자열이 아닌 timezone offset이 포함된 ISO-8601 값으로 반환합니다.
- `interviewAvailabilityCount`는 유효한 slot 개수와 일치해야 합니다.
- 신청자가 가능 일정을 제출하지 않은 경우 `[]`, `0`을 반환합니다.
- 관리자 배정 전이어도 신청자 가능 일정은 반환되어야 합니다.
- 재배정하더라도 신청자가 제출한 원본 가능 일정은 변경하지 않습니다.
- `assignedInterview*`는 관리자 확정 배정값으로 기존 의미를 유지합니다.
- 목록 화면 전체 캘린더가 모든 신청자의 가능 일정을 사용하므로, 단건 상세에만 추가하지 말고 목록 응답에서 조회 가능해야 합니다.
- 기존 필드 및 기존 클라이언트와 하위 호환되어야 합니다.

필드명은 백엔드 도메인 규칙에 맞게 조정할 수 있지만, OpenAPI에 신청자 가능 일정과 관리자 배정 일정의 의미를 각각 명시해 주세요.

### 2. 저장 데이터 연결

Platform 개인 프로그램 신청서에서 제출한 면접 가능 일정 원본을 individual application과 연결해 조회해 주세요.

- application 기준 조회이며 `memberId` 기준으로 다른 프로그램의 응답을 섞지 않습니다.
- 동일 회원이 여러 프로그램에 신청한 경우 각 application에 제출한 일정만 반환합니다.
- 취소·활동 포기 상태여도 기존 신청 원본은 조회 가능하게 유지합니다.
- 중복 slot은 제거하고 `startAt` 오름차순으로 정렬합니다.
- 잘못된 구간(`endAt <= startAt`)은 저장 단계에서 거부하거나 응답에서 제외합니다.

아직 개인 신청서에 해당 데이터가 저장되지 않는다면 저장 스키마 및 Platform 제출 API도 함께 확장하고, 기존 데이터는 빈 배열로 마이그레이션해 주세요.

### 3. `168006` 로컬 QA 시드

`LocalDemoGeneralPrimaryCaseSeedContributor` / `GeneralPrimaryCase6NestedSeedWriter`의 개인 신청 시드에 면접 가능 일정을 추가해 주세요.

필수 대상:

- `memberId=190015` 배정 대기: 최소 2일, 총 3개 이상의 가능 slot
- `memberId=190016` 배정 완료: 최소 1개 이상의 가능 slot + 기존 `assignedInterview*` 유지
- `memberId=190017` 활동 포기: 최소 1개 이상의 가능 slot + 기존 GIVE_UP 상태 유지
- 그 밖의 서류 합격 개인 신청 건도 가능하면 최소 1개 이상의 slot 제공

시드 조건:

- 프로그램 면접 기간 안의 날짜를 사용합니다.
- 관리자가 배정한 `190016`의 시간은 가능 slot 중 하나와 일치시킵니다.
- 재시드해도 중복 행이 생기지 않도록 idempotent하게 작성합니다.
- 기존 application PK, `memberId`, document/interview/final 상태 매트릭스를 변경하지 않습니다.

### 4. OpenAPI

구현 후 OpenAPI schema의 `IndividualApplicationListItemResponse`에 신규 필드를 반영해 주세요.

예시:

```yaml
interviewAvailabilitySlots:
  type: array
  items:
    type: object
    required: [startAt, endAt]
    properties:
      startAt:
        type: string
        format: date-time
      endAt:
        type: string
        format: date-time
interviewAvailabilityCount:
  type: integer
  minimum: 0
```

### 5. 수락 기준

1. `GET /api/admin/programs/168006/individual-applications`에서 위 대상 신청 건의 `interviewAvailabilitySlots`가 비어 있지 않습니다.
2. `interviewAvailabilityCount === interviewAvailabilitySlots.length`입니다.
3. 배정 대기 행도 신청자 가능 일정이 반환됩니다.
4. 배정 완료 행은 신청자 가능 일정과 `assignedInterview*`가 각각 반환됩니다.
5. 활동 포기 행도 원본 가능 일정은 유지됩니다.
6. 다른 프로그램 신청 데이터가 섞이지 않습니다.
7. OpenAPI 문서와 실제 응답이 일치합니다.
8. 기존 서류 결과, 면접 배정, 최종 결과 API 회귀 테스트가 통과합니다.

### 6. BE 완료 후 FE 전달 정보

다음을 함께 전달해 주세요.

- 최종 OpenAPI 필드명과 schema
- `168006`에서 확인 가능한 application PK / memberId
- 각 application의 가능 slot 개수
- 로컬 시드 재생성 방법
- 목록 API 응답 샘플

## 비범위

- 신청자 가능 일정이 없는 상태를 관리자 배정 일정으로 임의 보정
- FE 표시용 `26. 09. 10(목)` 같은 locale 문자열 생성
- `progress_assignments` 구현
- UJAT·봉사자 신청 API 계약 변경

## FE 후속 작업

BE 배포 및 OpenAPI 동기화 후 FE는 다음을 진행합니다.

1. `IndividualApplicationListItemResponse` codegen 갱신
2. ISO slot을 CMS 표시 형식으로 변환
3. `interviewAvailabilitySlots`를 면접 가능 일정 수와 캘린더에 연결
4. `assignedInterview*`와 신청자 가능 일정을 별도 상태로 표시

