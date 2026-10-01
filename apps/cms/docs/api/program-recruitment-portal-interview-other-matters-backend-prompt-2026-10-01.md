# Cursor prompt — 포털 모집 상세의 면접 여부와 기타사항 (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 고치지 마라. Homepage Admin(`JAHOMEADMINBACK`)도 고치지 마라.

| 항목 | 값 |
|------|-----|
| 대상 | 사용자 홈페이지 프로그램 신청 상세. `GET /api/portal/programs/{programId}?recruitmentId=&applicationType=` |
| 작성일 | 2026-10-01 |
| 프론트 문서 | `apps/cms/docs/api/program-recruitment-portal-interview-other-matters-backend-prompt-2026-10-01.md` |
| 선행 문서 | `program-recruitment-independent-management-backend-prompt-2026-10-01.md` |

선행 문서의 모집 행 분리(문구·첨부·썸네일·신청 양식 1:1, 목록 카드 1행)는 **이미 반영된 상태**다. 그 작업을 다시 하지 마라. 이번 범위는 아래 두 필드뿐이다.

---

## 하지 말 것

다음은 로컬 `186021`에서 이미 모집 행마다 다르다. 스키마나 조회를 되돌리거나 다시 구현하지 마라.

```text
GET /api/portal/programs/186021?recruitmentId=186069&applicationType=ORGANIZATION
  remarks = 참여기관 모집정보…
  contactName = 최수아, contactPhone = 02-512-3456
  learningSupportContent = 교재와 활동지를 제공하고…

GET /api/portal/programs/186021?recruitmentId=186070&applicationType=VOLUNTEER
  remarks = 봉사자 모집 정보…
  contactName = 정민재, contactPhone = 010-6234-7890
  learningSupportContent = null
```

- 프로그램 설명, 모집 안내, 추가 내용, 지원 방법, 비고, 문의처, 학습 지원, 첨부, 썸네일의 행 단위 조회는 유지한다.
- 값이 없으면 `null` / `[]`. 다른 행이나 프로그램 공통 문구로 채우지 않는다.
- 발표 방법 문장(이메일 안내, 홈페이지 게시)은 홈페이지가 날짜만 쓰므로 이번 작업에서 필드를 추가하지 마라.
- 강사·봉사자 「모집 대상 / 모집 대상 상세」는 홈페이지 상세에 없으므로 포털 필드를 추가하지 마라.

---

## 1. 면접 여부 `interviewEnabled`

홈페이지는 면접이 있는 모집만 1차 서류 합격자 발표와 2차 면접 기간을 보여 준다.

```text
interviewEnabled === false  → 날짜가 있어도 1차·면접 일정 숨김. 최종 합격자 발표만 표시
interviewEnabled === true   → 1차 서류 합격자 발표, 2차 면접 기간, 최종 합격자 발표
```

프론트는 `null`을 「면접 없음」으로 추정하지 않는다. 날짜가 있으면 일정을 그대로 그린다.

### 지금

`186070`(봉사자), `186069`(기관) 모두:

```text
recruitments[].interviewEnabled = null
documentPassAnnouncementAt / interviewStartAt / interviewEndAt / finalPassAnnouncementAt = 값 있음
```

CMS에서 면접 유무가 「면접 없음」이어도 홈페이지에 1차 합격자 발표일과 면접 기간이 나온다.

### 해야 할 일

- CMS 모집 정보의 면접 유무를 그 모집 행의 `interviewEnabled`에 저장한다.
  - 면접 없음 → `false`
  - 면접 있음 → `true`
- 포털 상세에서 `recruitmentId`가 있으면, 그 행의 boolean을 `recruitments[].interviewEnabled`에 내린다. `null`로 비우지 마라.
- `false`여도 이미 저장된 발표·면접 시각 컬럼은 지우지 마라. 플래그만 정확히 내린다. 숨김은 프론트가 한다.
- 면접 유무를 저장한 적이 없는 과거 행만 `null`을 허용한다. 새로 저장하는 일반 프로그램·UJAT 모집은 boolean이다.

---

## 2. 기타사항 `otherMatters`

홈페이지 규칙:

```text
참여자·참여 기관  → 학습 지원 내용만. 기타사항 숨김
강사·봉사자       → 기타사항만. 학습 지원 내용 숨김
값 없음           → 해당 절 숨김
```

프론트는 강사·봉사자 상세에서 응답 최상위 `otherMatters`만 읽는다. 학습 지원 내용으로 기타사항을 대신 만들지 않는다.

### 지금

```text
GET /api/portal/programs/186021?recruitmentId=186070&applicationType=VOLUNTEER
  otherMatters = null
```

CMS 강사·봉사자 모집 상세의 「기타사항」이 홈페이지에 나오지 않는다. `learningSupportContent`를 기타사항으로 쓰지 마라.

### 해야 할 일

- 기타사항은 모집 행 값이다. 프로그램 공통 `other_matters`로 모집들을 공유하지 마라.
- 강사 행·봉사자 행에 기타사항 컬럼(또는 행 JSON)을 두고, CMS 저장 시 그 행에만 쓴다.
- `recruitmentId`가 강사 또는 봉사자 행이면 포털 상세 최상위 `otherMatters`는 **그 행 값**이다. 없으면 `null`.
- 참여자·기관 행 조회에서는 `otherMatters`를 `null`로 둔다. 강사·봉사자 행의 기타사항을 참여자 응답에 복사하지 마라.
- 학습 지원 내용은 지금처럼 참여자·기관 행에만 둔다.

응답 예:

```json
{
  "otherMatters": "강사 제출 서류는 모집 마감 후 별도 안내합니다.",
  "learningSupportContent": null,
  "recruitments": [
    {
      "recruitmentId": 186070,
      "recruitmentType": "VOLUNTEER",
      "interviewEnabled": false
    }
  ]
}
```

---

## OpenAPI

`openapi/backend.openapi.json`의 포털 프로그램 상세에 반영한다.

- `interviewEnabled`: boolean. 모집 행에 면접 유무가 저장돼 있으면 `null`이 아니다.
- `otherMatters`: 강사·봉사자 모집 행의 기타사항. 그 외 모집 조회는 `null`.

---

## Done when

1. CMS에서 봉사자 모집을 「면접 없음」으로 저장하면  
   `GET /api/portal/programs/186021?recruitmentId=186070&applicationType=VOLUNTEER` 의 `recruitments[0].interviewEnabled`가 `false`다. 발표·면접 시각 컬럼은 그대로다.
2. 같은 프로그램을 「면접 있음」으로 저장하면 `interviewEnabled`가 `true`다.
3. 봉사자 행에만 기타사항을 저장하면 위 봉사자 조회의 `otherMatters`만 그 문장이고,  
   `recruitmentId=186069&applicationType=ORGANIZATION` 의 `otherMatters`는 `null`이다. 기관 행의 `learningSupportContent`는 바뀌지 않는다.
4. 강사 행 기타사항은 봉사자 행과 다르다.
5. 기타사항이 비어 있으면 `otherMatters`는 `null`이다. 프로그램 공통 문구로 채우지 않는다.
6. 비고, 문의처, 학습 지원, 첨부, 썸네일의 기존 행 단위 동작은 이번 변경 전과 같다.

**Last updated:** 2026-10-01
