# Cursor prompt — Platform 참여하기 mock DB 시드 (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포는 없다. 시드 값은 이 문서 `SEED_DATA`가 SSOT다.

선행 계약: `apps/platform/docs/api/participation-public-api-backend-cursor-prompt-2026-09-25.md`  
`GET /api/portal/public/program-results` 가 없으면 **그 계약을 먼저 만든 뒤** 시드한다. path·필드를 이 문서에서 바꾸지 마라.

## Goal

Platform 「결과 확인」이 아직 쓰는 mock 12건이, 로그인 없이 공개 API로 같게 나오게 local/dev DB에 넣어라.

완료 조건:

1. 무토큰 `GET /api/portal/public/program-results?page=0&size=10&sort=LATEST`  
   - `totalElements` = **12**  
   - 첫 항목 `seedKey` = `notice-result-2`  
   - 제목 = `2026 JA Korea 대학생경제교육봉사단 UJAT36기 최종 합격 발표`
2. `GET /api/portal/public/program-results/{resultId}` 에서 `notice-result-2`  
   - `viewCount` = `915000`  
   - 첨부 파일명 2개: `[명단] UJAT 36기 최종합격 명단.pdf`, `[안내문] UJAT 36기 향후 일정 안내.pdf`  
   - `next` = null (최신순 첫 글)  
   - `previous.seedKey` = `notice-result-3`
3. `keyword=오리엔테이션` 은 본문에만 있는 `notice-result-2` 를 포함한다. 제목만 검색하면 실패다.
4. `GET /api/portal/public/notices` 목록에 이 12건 제목이 **없다**. 카테고리 `공지`와 섞지 마라.
5. 시드는 **idempotent**. `seedLabel=platform-program-results-v1`. 다시 돌려도 12건을 넘지 않는다.
6. `local` (또는 이 레포의 dummy seed profile)에서만 들어간다. prod Flyway에 넣지 마라.

## Out of scope / 금지

- 프로그램 30건(`general-prog-*`, `economy-prog-*`, `trained-teachers-prog-*`, `gemini-prog-*`, `ujat-prog-*`)을 새로 insert 하지 마라. 프로그램 본문 시드는 기존 CMS 프로그램 더미 시드 패키지가 담당한다.
- 신청 양식 JSON을 다시 넣지 마라. `form-template-fe-seed-v2` 가 이미 있으면 그대로 둔다.
- `GET /api/portal/programs` 기존 행을 지우거나 제목을 이 mock 제목으로 덮지 마라.
- 관리자 공지(`posts-fe-mock-v1`, `notice-admin-*`)를 update 하지 마라. 결과 글은 **공개 결과 저장소**에만 upsert 한다.
- 첨부 **파일 바이트**를 만들지 마라. `originalFilename` 만 저장한다. `downloadEndpoint` 는 null 이어도 된다.
- 카테고리명을 영문 enum으로 바꾸지 마라. 값은 `최종 합격 발표`, `서류 심사 결과` 그대로다.
- TRUNCATE.

## 구현 순서

1. 공개 결과 테이블·카테고리 테이블을 찾거나, 선행 프롬프트대로 만든다.
2. 기존 local dummy seed 패턴을 재사용한다. 새 시드 프레임워크를 만들지 마라.
3. 순서: 카테고리 2건 → 결과 12건 → 첨부 메타(파일명만).
4. `seedKey` 가 같으면 제목·본문·카테고리·`announcedAt`·`viewCount`·첨부 파일명을 이 JSON으로 갱신한다. id가 달라도 `seedKey` 기준이다.
5. `status` 가 `published` 인 행만 공개 API에 나온다. 이 JSON은 전부 `published` 다. draft 행을 추가하지 마라.
6. `announcedAt` 은 JSON 시각을 **Asia/Seoul** 로 저장한다. 오프셋이 없으면 `+09:00` 이다. UTC로 하루를 당기지 마라.

## 카테고리

| name | 용도 |
|------|------|
| 최종 합격 발표 | 결과 탭 |
| 서류 심사 결과 | 서류 탭 |

다른 공지 카테고리(`공지`, `필독`, `안내`, `정산`, `시스템`, `봉사단`, `강사단`)는 이 시드에서 만들지 마라. 이미 있으면 결과 API 필터에서 빼라.

## CMS 공지 시드와 다른 값

관리자 공지 payload의 `notice-result-1` 은 아래와 다르다. **이 문서가 이긴다.** 관리자 공지 행은 수정하지 말고, 공개 결과 행만 이 값으로 넣어라.

| seedKey | 이 문서 | 예전 공지 payload (쓰지 마라) |
|---------|---------|-------------------------------|
| `notice-result-1` | `announcedAt` `2026-01-15T15:00:00`, `viewCount` `1232`, 첨부 `ITC_2026_참가자_명단.pdf` | `2026-09-15T10:00:00`, `viewCount` `1820`, 첨부 없음 |

최신순이면 `notice-result-1` 은 **12건 중 가장 오래된 글**이다.

## 검증 curl

무토큰.

```text
GET /api/portal/public/program-results?page=0&size=10&sort=LATEST
GET /api/portal/public/program-results?page=1&size=10&sort=LATEST
GET /api/portal/public/program-results?categoryName=서류%20심사%20결과&size=10
GET /api/portal/public/program-results?keyword=오리엔테이션
GET /api/portal/public/program-results/{notice-result-2 의 resultId}
GET /api/portal/public/notices?page=0&size=20
```

`categoryName` 쿼리가 선행 계약에 없으면 `categoryId` 로 같은 카테고리를 걸러라. 계약에 없는 쿼리를 새로 만들지 마라.

서류 심사 결과만 5건: `notice-result-3`, `4`, `7`, `10`, `12`.

2페이지(`page=1`, `size=10`)는 2건이고, 그 안에 `notice-result-1` 이 있다.

공지 목록 응답 제목에 `UJAT36기` 가 있으면 실패다.

## 하지 않는 프로그램 패치

아래 seedKey 프로그램이 **이미** 있으면 컬럼을 추가하지 말고 답변에만 「있음/없음」을 적어라. 없으면 insert 하지 마라.

| seedKey | 제목 | 신청 양식 templateCode (기존 시드) |
|---------|------|-------------------------------------|
| `general-prog-type-ind-curriculum-single` | (기존 프로그램 시드 제목 유지) | `application-participant-individual` |
| `general-prog-type-ind-curriculum-multi` | 동일 | `application-participant-individual` |
| `general-prog-type-org-curriculum-single` | 동일 | `application-participant-school` |
| `economy-prog-001` | 동일 | `application-economy` |
| `ujat-prog-volunteer` | `UJAT 프로그램_봉사 모집` | `application-volunteer` |
| `ujat-prog-school` | `UJAT 프로그램_학교 모집` | `application-participant-school` |
| `gemini-prog-institution` | (기존 제목 유지) | `application-gemini-visiting-training-school` |
| `gemini-prog-instructor` | (기존 제목 유지) | `application-gemini-visiting-training-instructor` |

양식 본문은 `form-template-fe-seed-v2` 를 재사용한다. 이 작업에서 binding을 새로 걸지 마라. 없는 templateCode는 답변에 「미적재」라고만 적어라.

## SEED_DATA

```json
{
  "seedLabel": "platform-program-results-v1",
  "categories": [
    { "name": "최종 합격 발표" },
    { "name": "서류 심사 결과" }
  ],
  "results": [
    {
      "seedKey": "notice-result-1",
      "title": "2026 국제무역창업대회(International Trade Challenge, ITC) 참가자 발표",
      "category": "최종 합격 발표",
      "announcedAt": "2026-01-15T15:00:00",
      "status": "published",
      "content": "2026 국제무역창업대회(ITC) 참가자 최종 결과를 발표합니다. 합격하신 분들께는 개별 안내드릴 예정입니다.",
      "author": "운영팀",
      "viewCount": 1232,
      "attachmentNames": ["ITC_2026_참가자_명단.pdf"]
    },
    {
      "seedKey": "notice-result-2",
      "title": "2026 JA Korea 대학생경제교육봉사단 UJAT36기 최종 합격 발표",
      "category": "최종 합격 발표",
      "announcedAt": "2026-09-15T09:00:00",
      "status": "published",
      "content": "안녕하세요. JA Korea입니다.\n\n2026 JA Korea 대학생경제교육봉사단 UJAT36기에 지원해 주신 모든 분들께 감사드립니다.\n\n엄격한 서류 심사와 면접을 거쳐 최종 합격자를 아래와 같이 발표합니다.\n\n## [최종 합격자 안내]\n\n상세 합격자 명단은 첨부파일을 확인해 주세요. 합격하신 분들께는 개별 안내 메일·문자를 발송할 예정입니다.\n\n## [합격자 안내 사항]\n\n- 합격자 대상 오리엔테이션 참석이 필수입니다.\n- 제출 서류 및 일정은 첨부 안내문을 참고해 주세요.\n- 미제출·미참석 시 합격이 취소될 수 있습니다.\n\n## [추후 상세 일정]\n\n- 합격자 서류 제출 및 오리엔테이션 일정은 첨부 「향후 일정 안내」를 확인해 주세요.\n- 일정 변경 시 홈페이지 공지 및 개별 안내로 공지합니다.\n\n문의: jakorea@jakorea.org / 02-783-2367\n\n감사합니다.\nJA Korea 드림",
      "author": "홍길동 매니저",
      "viewCount": 915000,
      "attachmentNames": [
        "[명단] UJAT 36기 최종합격 명단.pdf",
        "[안내문] UJAT 36기 향후 일정 안내.pdf"
      ]
    },
    {
      "seedKey": "notice-result-3",
      "title": "2026 JA Korea 금융교육 강사단 서류 심사 결과",
      "category": "서류 심사 결과",
      "announcedAt": "2026-09-14T14:00:00",
      "status": "published",
      "content": "금융교육 강사단 모집 서류 심사 결과를 안내드립니다.",
      "author": "강사운영팀",
      "viewCount": 960,
      "attachmentNames": []
    },
    {
      "seedKey": "notice-result-4",
      "title": "2026 JA Korea 대학생경제교육봉사단 UJAT36기 서류합격발표",
      "category": "서류 심사 결과",
      "announcedAt": "2026-09-12T11:00:00",
      "status": "published",
      "content": "UJAT36기 1차 서류 합격자를 발표합니다.",
      "author": "운영팀",
      "viewCount": 2100,
      "attachmentNames": []
    },
    {
      "seedKey": "notice-result-5",
      "title": "SAMSUNG X JA Korea 참가자 선정 발표",
      "category": "최종 합격 발표",
      "announcedAt": "2026-09-10T16:00:00",
      "status": "published",
      "content": "SAMSUNG X JA Korea 프로그램 참가자 선정 결과를 발표합니다.",
      "author": "대외협력팀",
      "viewCount": 3100,
      "attachmentNames": []
    },
    {
      "seedKey": "notice-result-6",
      "title": "2026 기업가정신 캠프 참가자 최종 발표",
      "category": "최종 합격 발표",
      "announcedAt": "2026-09-08T10:00:00",
      "status": "published",
      "content": "기업가정신 캠프 참가자 최종 명단을 발표합니다.",
      "author": "운영팀",
      "viewCount": 740,
      "attachmentNames": []
    },
    {
      "seedKey": "notice-result-7",
      "title": "2026 경제금융교육 전문강사단 모집 서류 심사 결과",
      "category": "서류 심사 결과",
      "announcedAt": "2026-09-05T13:00:00",
      "status": "published",
      "content": "경제금융교육 전문강사단 서류 심사 결과를 안내드립니다.",
      "author": "강사운영팀",
      "viewCount": 880,
      "attachmentNames": ["서류심사_안내.pdf"]
    },
    {
      "seedKey": "notice-result-8",
      "title": "2026 특별한 JOB담 봉사자 최종 합격 발표",
      "category": "최종 합격 발표",
      "announcedAt": "2026-09-01T09:30:00",
      "status": "published",
      "content": "특별한 JOB담 봉사자 최종 합격자를 발표합니다.",
      "author": "운영팀",
      "viewCount": 1250,
      "attachmentNames": []
    },
    {
      "seedKey": "notice-result-9",
      "title": "2026 디지털 리터러시 프로그램 참가자 발표",
      "category": "최종 합격 발표",
      "announcedAt": "2026-08-28T15:00:00",
      "status": "published",
      "content": "디지털 리터러시 프로그램 참가자 최종 결과를 발표합니다.",
      "author": "교육팀",
      "viewCount": 640,
      "attachmentNames": []
    },
    {
      "seedKey": "notice-result-10",
      "title": "2026 진로취업 아카데미 서류 심사 결과",
      "category": "서류 심사 결과",
      "announcedAt": "2026-08-25T11:00:00",
      "status": "published",
      "content": "진로취업 아카데미 서류 심사 결과를 안내드립니다.",
      "author": "교육팀",
      "viewCount": 520,
      "attachmentNames": []
    },
    {
      "seedKey": "notice-result-11",
      "title": "2026 JA Korea 여름 캠프 최종 합격 발표",
      "category": "최종 합격 발표",
      "announcedAt": "2026-08-20T10:00:00",
      "status": "published",
      "content": "여름 캠프 최종 합격자를 발표합니다.",
      "author": "운영팀",
      "viewCount": 990,
      "attachmentNames": []
    },
    {
      "seedKey": "notice-result-12",
      "title": "2026 금융문해력 강사 모집 서류 심사 결과",
      "category": "서류 심사 결과",
      "announcedAt": "2026-08-18T14:00:00",
      "status": "published",
      "content": "금융문해력 강사 모집 서류 심사 결과를 안내드립니다.",
      "author": "강사운영팀",
      "viewCount": 430,
      "attachmentNames": []
    }
  ]
}
```

## 완료 보고

답변에 다음만 적어라.

1. 시드가 들어간 테이블명과 `seedLabel`.
2. 위 검증 curl 6개의 status와 `totalElements` 또는 첫 제목.
3. 프로그램 seedKey 8개의 있음/없음. 양식 templateCode 8개의 적재 여부.
4. 관리자 공지 행을 수정하지 않았다는 한 줄.
