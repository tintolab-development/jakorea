# Cursor prompt — 모집 행 기타사항 `otherMatters` (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 고치지 마라. Homepage Admin(`JAHOMEADMINBACK`)도 고치지 마라.

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-10-01 |
| 대상 | CMS 백엔드 `JABACK` (`localhost:8080`) |
| 우선순위 | **P1** |
| 화면 | 일반 프로그램 상세 → 모집 정보 → 강사/봉사자 탭 → 상세 정보 「기타사항」 |

이번 범위는 **모집 행 `otherMatters`(기타사항) 저장·재조회** 뿐이다.  
면접 여부(`interviewEnabled`)는 이 티켓에서 구현하지 마라.

---

## 1. 한 줄 요약

강사·봉사자 모집 상세의 「기타사항」은 **그 모집 행의 `otherMatters`** 다.

프로그램 공통 `otherMatters` / `other_matters` 로 모집들을 공유하지 마라.  
모집 비고 `remarks` 와 합치지 마라.

지금 OpenAPI 모집 행에 필드가 없어 CMS GET이 echo하지 않고, create/PATCH extra 필드는 버려질 수 있다.

---

## 2. 필드 의미 (이 티켓의 전부)

같은 모집 행에 문구가 둘 있다. 서로 다른 컬럼이다.

| UI | JSON 필드 | 예 |
|----|-----------|----|
| 모집 정보 「비고」 | `remarks` | `신청 전 학교 담당 교사 확인이 필요합니다.` |
| 상세 정보 「기타사항」 | `otherMatters` | `<p>우천·학교 행사와 겹치면 일정을 조정할 수 있습니다.</p>` |

- `remarks` 는 이미 행 단위로 동작한다. 스키마·저장을 되돌리지 마라.
- `otherMatters` 는 강사(`INSTRUCTOR`)·봉사자(`VOLUNTEER`) 행만 저장한다.
- 참여자·기관 행(`PARTICIPANT` / `ORGANIZATION` / `INDIVIDUAL`) 에 보내면 무시한다. GET 은 `null`.
- 프로그램 최상위 `ProgramUpdateRequest.otherMatters` / `ProgramResponse.otherMatters` 는 **프로그램 공통 기타 안내** 다. 모집 행 기타사항이 아니다. 이 필드로 강사·봉사자 기타사항을 채우거나, 행 값을 최상위로 올리지 마라.

이미 행 단위로 동작하는 것(이번 티켓에서 손대지 마라):

- 프로그램 설명, 모집 안내, 지원 방법, 학습 지원, 추가 내용, **비고(`remarks`)**, 문의처, 첨부, 썸네일
- 값이 없으면 `null` / `[]`. 다른 행이나 프로그램 공통 문구로 채우지 않는다.

---

## 3. 지금

생성된 OpenAPI:

- `ProgramRecruitmentRequest` — `otherMatters` 없음
- `ProgramRecruitmentResponse` — `otherMatters` 없음
- 프로그램 최상위 `ProgramUpdateRequest.otherMatters` / `ProgramResponse.otherMatters` 만 있음 (공통 컬럼)

CMS FE는 이미 모집 행 create/PATCH 에 extra 로 보낸다.

```json
{
  "id": 186070,
  "recruitmentType": "VOLUNTEER",
  "applicationType": "VOLUNTEER",
  "remarks": "모집 인원 초과 시 선착순으로 마감합니다.",
  "otherMatters": "<p>우천·학교 행사와 겹치면 일정을 조정할 수 있습니다.</p>"
}
```

그러나 GET `recruitments[]` 에 `otherMatters` 가 없으면 저장 후 화면이 비거나, 프로그램 공통 문구로 되돌아간다.  
`otherMatters` 가 없으면 FE가 `remarks` 에 기타사항을 넣던 시절 데이터가 남을 수 있다. 신규 저장부터는 두 필드를 따로 echo 하라.

포털도 같은 갭이다.

```text
GET /api/portal/programs/{programId}?recruitmentId={volunteerRowId}&applicationType=VOLUNTEER
  otherMatters = null
```

홈페이지 강사·봉사자 상세는 응답 최상위 `otherMatters` 만 읽는다. `learningSupportContent` 로 기타사항을 대신 만들지 마라.

---

## 4. 해야 할 일

### 4.1 스키마

`openapi/backend.openapi.json` 의 모집 행 요청·응답에 추가한다.

| 필드 | 타입 | 의미 |
|------|------|------|
| `otherMatters` | `string \| null` | 강사·봉사자 행 기타사항. 없으면 `null`. 프로그램 공통 문구로 채우지 않는다. |

대상 타입:

- `ProgramRecruitmentRequest`
- `ProgramRecruitmentResponse`

빈 값 규칙(`remarks` 와 동일):

- 생략 / `null` → 기존 값 유지
- `""` → 그 행만 비움 (이후 GET 은 `null`)
- 참여자·기관 행에 보내면 무시. GET 은 `null`

포털 프로그램 상세 최상위 `otherMatters` 도 같은 의미다. 조회 중인 그 행 값이고, 참여자·기관 조회는 `null`.

### 4.2 저장

다음 경로에서 **해당 행만** 갱신한다.

- `POST /api/admin/programs` body `recruitments[]` (최초 생성)
- `PATCH /api/admin/programs/{programId}` body `recruitments[]`
- `PATCH /api/admin/programs/{programId}/recruitments/{recruitmentId}`

규칙:

1. `recruitmentType` / `applicationType` 이 `INSTRUCTOR` 또는 `VOLUNTEER` 인 행만 `otherMatters` 를 저장한다.
2. 강사 행과 봉사자 행은 서로 다른 값이다. 한쪽을 다른쪽에 복사하지 마라.
3. 프로그램 최상위 `otherMatters` / `other_matters` 를 이 필드로 채우거나, 이 필드를 최상위로 올리지 마라.
4. `remarks`(비고) 와 합치지 마라. 기타사항 HTML 을 `remarks` 에 넣지 마라. 비고 문장을 `otherMatters` 에 넣지 마라.
5. `learningSupportContent` 로 대체하지 마라. 학습 지원은 참여자·기관 행에만 둔다.

### 4.3 CMS 조회

`GET /api/admin/programs/{programId}` 의 `recruitments[]` 에 저장값을 그대로 내린다.

- 강사 행: 그 행의 `otherMatters`
- 봉사자 행: 그 행의 `otherMatters`
- 참여자·기관 행: `null`
- 값 없음: `null`. 다른 행·프로그램 공통으로 채우지 마라

### 4.4 포털 조회

`GET /api/portal/programs/{programId}?recruitmentId=&applicationType=`

- `recruitmentId` 가 강사 또는 봉사자 행이면 최상위 `otherMatters` 는 **그 행 값**이다. 없으면 `null`.
- 참여자·기관 행 조회에서는 최상위 `otherMatters` 를 `null` 로 둔다. 강사·봉사자 행 값을 복사하지 마라.
- `recruitments[]` 원소에도 같은 행 값을 내려도 된다. 최상위와 어긋나면 안 된다.

응답 예 (봉사자):

```json
{
  "otherMatters": "<p>우천·학교 행사와 겹치면 일정을 조정할 수 있습니다.</p>",
  "learningSupportContent": null,
  "recruitments": [
    {
      "id": 186070,
      "recruitmentType": "VOLUNTEER",
      "applicationType": "VOLUNTEER",
      "remarks": "모집 인원 초과 시 선착순으로 마감합니다.",
      "otherMatters": "<p>우천·학교 행사와 겹치면 일정을 조정할 수 있습니다.</p>"
    }
  ]
}
```

---

## 5. 하지 말 것

- 프로그램 공통 `otherMatters` 로 강사·봉사자 기타사항을 공유하기
- 기타사항을 `learningSupportContent` 나 `remarks` 로 대체하기
- 참여자 모집 조회에 강사·봉사자 기타사항을 복사하기
- 이미 동작하는 행 단위 문구(프로그램 설명, 모집 안내, 지원 방법, 비고, 문의처, 첨부, 썸네일)를 되돌리기
- `interviewEnabled` 를 이 티켓에서 구현하기

---

## 6. Done when

1. CMS에서 봉사자 상세 「기타사항」을 저장하면  
   `GET /api/admin/programs/{id}` 의 봉사자 `recruitments[]` 원소 `otherMatters` 가 그 문장이다.
2. 같은 프로그램 강사 행 `otherMatters` 는 바뀌지 않는다. 반대도 같다.
3. 같은 행 `remarks` 는 그대로다. 기타사항 저장이 비고를 덮지 않는다.
4. 기관/참여자 행 GET `otherMatters` 는 `null` 이다.
5. `""` 로 비우면 이후 GET 은 `null` 이다. 프로그램 공통 문구가 채워지지 않는다.
6. 프로그램 최상위 `otherMatters` 를 안 보내도 행 값이 유지된다.
7. `GET /api/portal/programs/{id}?recruitmentId={volunteerRowId}&applicationType=VOLUNTEER` 의 최상위 `otherMatters` 가 그 봉사자 행 값이다. 같은 공고의 기관 조회 `otherMatters` 는 `null` 이다.
8. OpenAPI `ProgramRecruitmentRequest` / `ProgramRecruitmentResponse` 에 `otherMatters` 가 있다.

**Last updated:** 2026-10-01
