# Cursor prompt — 일반 기관 날짜 지정형 기관 신청의 `requested-schedules` 응답 (JABACK)

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 탐색하지 말고, **이 문서의 계약과 재현만** 사용하라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/general-organization-fixed-date-requested-schedules-backend-cursor-prompt-2026-10-06.md`

선행 작업: `JABACK/docs/frontend/general-organization-fixed-date-instructor-schedule-options-frontend-handoff-2026-10-06.md`
(기관 승인 시 `line:N` → `program_schedule` 생성. **정상 동작 확인됨**)

---

## 증상 (로컬, 2026-10-06 21:5x KST)

프로그램 **186048**(`GENERAL_ORGANIZATION`, 날짜 지정형, 공통정보 4줄), 기관 신청 **1691188**(계남초등학교, `승인 완료`).

| 확인 | 결과 |
|------|------|
| `GET /api/admin/programs/186048/schedules` | 186619(커리큘럼 종일) + **186621(10/20 01:00~03:00Z), 186622(10/27 04:30~07:00Z), 186623(11/3 00:30~02:30Z), 186624(11/10)** — 승인 시 생성 정상 |
| `GET /api/admin/organization-applications/1691188/requested-schedules` | **`[]`** |
| `GET /api/admin/organization-applications/1691188` → `sessions` | **`[]`** |
| `GET /api/admin/form-responses/1851446` (기관 신청서) | 모든 `answerValueJson` = `null` (마스킹으로 보임 — 확인 요청 ③) |

CMS 화면 영향:

- 기관 신청 목록 "진행 희망 교육 일정" 열이 `-`
- 강사 신청 상세 → **참여 승인 → 강사 배정 안내 모달**의 달력에 배정 가능 날짜가 **0개** → 강사 승인 불가

CMS는 기관 행 일정(`sessions`)을 **`requested-schedules` 응답 하나로** 만든다(1사1교·Gemini와 공용).
`program_application_requested_schedule`은 1사1교·Gemini만 쓰므로 GENERAL 날짜 지정형은 항상 빈 배열이다.

---

## 요청

### ① `GET /api/admin/organization-applications/{applicationId}/requested-schedules`

`program_type ∈ {GENERAL_ORGANIZATION, GENERAL(기관 대상)}` + 날짜 지정형(`FIXED_DATE`)인 기관 신청이면,
기관 신청서 `program-application-institution-seed-schedule`의 `line:N` 답을 **현재 공통정보 줄**로 해석해 행을 내려라.
**path·스키마(`RequestedScheduleResponse`)는 바꾸지 마라.** 기존 필드만 채운다.

| 필드 | 값 |
|------|----|
| `id` | `null` 허용 (테이블 행이 아니면). 있으면 안정적인 값 |
| `preferenceOrder` | 기관이 고른 순서 1..N (**2개 제한 없음**) |
| `requestedDate` | `YYYY-MM-DD` (Asia/Seoul) |
| `sessionCount` | 1 |
| `combinedClassYn` | 기관 신청 `combinedClassYn` 또는 `false` |
| `sessionTimes` | `[{ "sessionOrder": 1, "startTime": "HH:mm", "endTime": "HH:mm" }]` (종일 줄은 빈 배열) |
| `startPeriod` | `null` (교시 개념 없음) |
| `resolvedScheduleId` | 승인으로 생성·재사용된 `program_schedule.id`. **미승인/미매칭이면 키는 내리고 값 `null`** |

예 (1691188이 4줄 모두 선택했다면):

```json
[
  { "id": null, "preferenceOrder": 1, "requestedDate": "2026-10-20", "sessionCount": 1, "combinedClassYn": false,
    "startPeriod": null, "sessionTimes": [{ "sessionOrder": 1, "startTime": "10:00", "endTime": "12:00" }],
    "resolvedScheduleId": 186621 },
  { "id": null, "preferenceOrder": 2, "requestedDate": "2026-10-27", "sessionCount": 1, "combinedClassYn": false,
    "startPeriod": null, "sessionTimes": [{ "sessionOrder": 1, "startTime": "13:30", "endTime": "16:00" }],
    "resolvedScheduleId": 186622 }
]
```

### ② `GET /api/admin/organization-applications/{applicationId}` 의 `sessions`

①과 같은 소스로 채울 수 있으면 채워라(선택). 어렵다면 ①만으로 충분하다.

### ③ 기관 신청서 답 확인 (읽기 전용)

`form_response` 1851446 의 `program-application-institution-seed-schedule` **실제 저장값**을 DB에서 확인해 보고하라
(관리자 GET 응답이 `null`인 것이 마스킹인지, 실제 미저장인지).
승인 시 일정 4개가 생성됐으므로 `["line:0","line:1","line:2","line:3"]`일 것으로 예상한다.

---

## 하지 말 것

- 1사1교·Gemini의 `requested-schedules` 응답(테이블 기반, 교시) 변경 금지
- 기간형(PERIOD) 일반 기관 동작 변경 금지 — 단, 같은 방식(날짜 객체 → 같은 날 일정)으로 채울 수 있으면 별도 항목으로 제안만
- 새 path·새 필드 추가 금지

## 보고 형식

1. ①②③ 결과와 1691188 실제 응답 JSON
2. 테스트 이름
3. `docs/frontend` handoff (FE가 `startPeriod=null` + `sessionTimes` 시각 표시로 분기해야 하므로 필드 의미를 명시)
