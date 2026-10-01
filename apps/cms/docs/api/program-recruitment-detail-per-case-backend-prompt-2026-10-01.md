# Cursor prompt — 모집 정보 문구를 recruitment 행마다 저장 (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 고치지 마라.

| 항목 | 값 |
|------|-----|
| 대상 | 프로그램 상세 → 모집 정보 탭 (일반 참여자/강사/봉사자, UJAT 참여 기관·봉사자 상·하반기) |
| 작성일 | 2026-10-01 |
| 프론트 문서 | `apps/cms/docs/api/program-recruitment-detail-per-case-backend-prompt-2026-10-01.md` |

## 증상

한 프로그램에 모집이 여러 개여도, 상세 문구가 **프로그램 컬럼 하나**로 저장된다.

```text
description
recruitmentGuide
applicationMethod
learningSupportContent
additionalContentHtml
```

모집 A를 고치면 이 컬럼이 바뀌고, 모집 B 조회가 같은 컬럼을 읽어 문구가 같이 바뀐다.  
프론트는 이제 이 컬럼을 모집 저장 PATCH에 넣지 않는다. 모집별 값은 아래 쪽에만 있다.

## 프론트가 이미 보내는 위치

일반 프로그램 `serviceDetailJson`:

| 모집 | 경로 |
|------|------|
| 참여자 | `generalCommonInfo.participantRecruitmentInfo` |
| 강사 | `generalCommonInfo.instructorRecruitmentInfo` |
| 봉사자 | `generalCommonInfo.volunteerRecruitmentInfo` |

각 객체 필드: `programDescription`, `recruitmentGuide`, `applicationMethod`, `learningSupportContent`, `additionalContentHtml`, `remarks`.

UJAT `serviceDetailJson.ujatRegistrationOverlay` (또는 동일 overlay를 담는 기존 키):

| 모집 | 키 prefix |
|------|-----------|
| 참여 기관 | `ujat.recruit.institution.` |
| 봉사자 상반기 | `ujat.recruit.volunteer.h1.` |
| 봉사자 하반기 | `ujat.recruit.volunteer.h2.` |

예: `ujat.recruit.institution.recruitmentGuide`, `ujat.recruit.volunteer.h1.description`.

## 필요한 계약

1. `recruitments[]` 각 행에 위 문구 필드를 둔다. 프로그램 컬럼 하나로 합치지 마라.
2. PATCH 시 그 모집의 nested / overlay 값만 그 `recruitmentId`에 저장한다. 다른 모집 행과 프로그램 컬럼을 같은 값으로 덮지 마라.
3. GET은 모집 행의 문구를 그대로 돌려준다. 비어 있을 때 프로그램 `recruitmentGuide`로 채우지 마라.
4. 프로그램 컬럼 `recruitmentGuide` 등은 공통정보 전용으로 두거나, 모집이 하나뿐일 때만 쓴다. 모집이 둘 이상이면 모집 탭 저장이 이 컬럼을 바꾸면 안 된다.
5. 포털 `GET /api/portal/programs/{programId}?recruitmentId=&applicationType=` 의 `recruitmentGuide`, `additionalContentHtml`, `title`, `summary`는 그 모집 행 값이다. 다른 모집 문구를 넣지 마라.

## Done when

1. 같은 프로그램에서 참여자 모집 안내와 강사 모집 안내를 다르게 저장한 뒤 GET하면 두 값이 그대로 다르다.
2. UJAT 참여 기관 안내와 봉사자 상·하반기 안내를 다르게 저장한 뒤 GET하면 세 값이 그대로 다르다.
3. 한 모집만 PATCH해도 다른 모집의 `recruitmentGuide` / `description` / `additionalContentHtml`이 바뀌지 않는다.

**Last updated:** 2026-10-01
