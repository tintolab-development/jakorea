# 일반 프로그램 remote DB 전그래프 시드 요청

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-09-16 |
| **대상** | CMS `/programs/general` remote DB (UJAT / 1사1교 / Gemini **제외**) |
| **목적** | 프로그램 상세 **노출 LNB 전 화면**이 공란/`-` 없이 열리고, 신청→참여→일정→배정→출석/과제/보고서/정산/게시글/설문이 **같은 PK로 연결**되게 한다 |
| **FE mock** | **금지.** 전부 remote DB. CMS는 API 응답만 표시 |
| **회원** | **신규 INSERT 금지.** 현재 DB 회원만 재사용 |
| **전달** | **이 파일 1개면 충분.** 조회 계약·form 마스킹은 §3.3·§3.4 |

**전달:** 이 파일 **하나만** BE에 넘기면 된다. 다른 갭/시드 MD를 첨부하지 않아도 작업·수용이 가능하도록 조회 계약·form 마스킹 블로커를 **본문에 포함**했다.

**이 문서가 하는 일 / 하지 않는 일**

- 함: (1) 기존 remote 일반 프로그램 **전수 행·그래프 보강**. 8종 유형 칸이 비면 **그때만** 프로그램 생성. 면접일 배정·팀 배정 등 QA가 안 되면 **추가 프로그램 생성**. (2) CMS가 `-`를 안 그리려면 **GET 목록/상세/form-responses에 필드가 실려야** 한다. DB만 채우고 DTO가 비면 **미완료**.
- 안 함: “프로그램 실 8개만 만든다”가 목표가 아님. 기존 프로그램의 강사/봉사/설문 ON·OFF 플래그를 FULL로 바꾸지 않음. 회원을 새로 만들지 않음. **상세 PATCH·알림 재발송·서류평가 저장 API 신설은 본 요청 범위 밖** (조회 화면이 차면 됨).

---

## 0. 이 문서를 읽는 법 (BE 작업 순서)

1. **§1 금지·회원 재사용**을 지킨다.
2. **§2 전수 인벤토리**로 remote 일반 프로그램 ID를 전부 적는다.
3. **표 B 8종 갭** — 비어 있는 (audience × structure × session)만 CREATE.
4. **표 C QA 추가** — 면접 배정·팀 배정·합반이 기존+8종으로 안 열리면 CREATE.
5. **§3 연결 그래프**대로 노드를 빠짐없이 잇는다. **§3.3·§3.4 조회 계약**을 시드와 같이 맞춘다 (DTO/form 값이 null이면 CMS `-`).
6. **§4~§10 화면 필드표**에서 그 프로그램이 **실제로 여는 탭만** 채운다. 숨김 LNB에 행을 넣지 않는다.
7. **§11 수용 GET**으로 CMS가 `-`인지 확인한다. 한 칸이라도 `-`면 미완료.

날짜는 전부 **2026-09-01 ~ 2026-11-30**. 강의보고서 제출 기한은 강의일 **익월 5일**이라, 기한이 창 밖으로 나가지 않게 **10월 강의**를 섞는다 (11월 강의 → 기한 12-05).

상태/유형마다 **최소 2건**. 사람 풀이 모자라면 **회원을 만들지 말고 §1.3 보고**.

---

## 1. 금지 · 회원 재사용 (최우선)

### 1.1 하지 말 것

| 금지 | 이유 |
|------|------|
| 신규 회원 INSERT | 참여자·강사·교사·봉사자·학생·PM 모두 현재 DB 회원만 |
| FE 문자열 PK (`individual-program-instructor-approved` 등) | BE PK가 아님 |
| 가짜 기관명 | 기관 = **이미 CMS에 있는 학교(organization)** |
| 학교 소속이 아닌 교사를 담당 교사로 넣기 / 소속 변경 | 담당 교사 셀렉트가 그 학교 소속 API만 봄 |
| 기존 프로그램 LNB 플래그를 FULL로  flip | `168005` 강사·봉사·설문 숨김 QA가 깨짐 |
| E2E 타이틀 `[수정 가능] 일반 프로그램 더미` 와 동일/덮어쓰기 | |
| 목록 DTO에 안 실리는 DB-only 값으로 “시드 완료” 처리 | CMS는 공란. **§3.4 GET에 실을 것** |
| `form_response` answers가 privacy mask로 **null** | 상세가 `-`. **§3.3 question_id + NON_PII** |
| 한 member를 같은 프로그램에 상태만 다른 신청 2건으로 쪼개기 | 한 member = 프로그램당 신청 **1건** |

`190xxx` / `16500x` 는 **이미 DB에 있으면 그 풀을 쓴다**는 뜻이다. QaMemberRoster 카탈로그를 이 시드로 새로 만들지 않는다.

### 1.2 역할별 재사용

시드 전에 역할·소속별로 **기존 member 풀을 조회**하고, 신청/참여 FK에 그 ID만 넣는다.

| 역할 | 조회 조건 | 연결 필드 |
|------|-----------|-----------|
| 담당 교사 | 해당 `organizationId`에 **이미 소속된 교사** | `teacherMemberId` |
| 강사 | 기존 강사 또는 교사겸직 강사 | `instructorMemberId` / `memberId` |
| 개인 참여자 | 기존 개인 회원 | `memberId` |
| 봉사자 | 기존 봉사 역할 회원 | `memberId` |
| 학생 명단 | 기존 학생 회원 또는 그 학교 명단에 **이미 묶인** member | `memberId` |
| 프로그램 담당자 | 기존 관리자 | managers PM / PARTNER (예: DB에 있는 `165001`·`165002`) |

- 여러 프로그램에 **동일 회원 재사용 허용** — 프로그램마다 신청/참여 **행만** 추가.
- 강사 이력서·계좌가 비면: **회원 프로필을 채우는 것**과 **신청 `form_response`를 채우는 것**을 구분한다. 둘 다 신규 회원 row가 아니다.
- 담당 교사 부족 시: 그 학교 기관 건수는 **기존 교사 수 한도**. 다른 학교 교사를 끌어오지 않음.

### 1.3 인원 부족 보고 (신규 생성 대체)

상태×2에 사람이 모자라면 회원을 만들지 않는다. 기존 풀을 모두 쓴 뒤 결과 표에:

```text
역할=<교사|강사|개인|봉사|학생> 부족 N명 — 상태 매트릭스 미달 (신규 회원 생성 안 함)
```

---

## 2. 8종 유형 vs Primary 8 · 인벤토리

### 2.1 두 축은 다르다

**8종 유형 트리** (등록 폼):

```text
일반 프로그램
 ├ 기관 | 개인          (audience)
 ├ 커리큘럼 | 일정      (structure)
 └ 단일 | 복수          (session)
 → 8칸
```

표시명: `일반 프로그램 (기관|개인)_(커리큘럼형|일정형)_(단일 회차|복수 회차)`

**Primary `168001`–`168008`**: 강사/봉사/설문 ON·OFF. 8종과 **1:1 아님**.

알려진 예:

| ID | 제목(테스트) | audience | structure | session | types | 면접 | 설문 | 학생명단 |
|----|--------------|----------|-----------|---------|-------|------|------|----------|
| 168001 | [기관] 커리큘럼형 단일회차 | organization | curriculum | single | school_institution, teacher_instructor | OFF | 없음 | required |
| 168003 | [기관] 일정형 단일회차 | organization | schedule | single | school_institution, volunteer | (봉사 축) | survey | (detail 확인) |
| 168005 | [개인] 커리큘럼형 단일회차 | individual | curriculum | single | individual only | OFF | 없음 | not_required |
| 168006 | [개인] 커리큘럼형 복수회차 | individual | curriculum | multi | individual, teacher_instructor, volunteer | 참여자·봉사 ON | survey, satisfaction, lecture_evaluation | (detail 확인) |
| 168002, 168004, 168007, 168008 | BE가 GET detail로 채움 | | | | | | | |

`168005`에 강사·봉사 행을 넣지 않는다. 개인 진행 LNB **출석/과제/게시글**은 개인 대분류라 열리므로 그 탭은 채운다.

### 2.2 표 A — 기존 전수 보강 (BE가 ID 추가)

`GET` 일반 프로그램 목록의 **모든** 일반 프로그램. 아래는 시작점.

| programId | audience | structure | session | 노출 LNB (types·면접·설문) | 적용 섹션 | 비고 |
|-----------|----------|-----------|---------|------------------------------|-----------|------|
| 168001 | org | curriculum | single | 기관+강사 | §5 기관신청, §7 진행기관, §8 진행강사, 공통정보, 담당자 | 봉사·설문 행 없음 |
| 168003 | org | schedule | single | 기관+봉사 | §5 기관, §6 봉사심사, §7 진행기관, §9 진행봉사 | 강사 행 없음 |
| 168005 | ind | curriculum | single | 참여자 only | §5 개인신청(면접 OFF), §10 진행 참여자·출석·과제·게시글 | 강사/봉사/설문 없음 |
| 168006 | ind | curriculum | multi | FULL | §5~§10 전부 + 면접 3단계 | nested 시드 **품질 상향** |
| *(그 외 전수)* | | | | GET detail 그대로 | 노출 축만 | |

### 2.3 표 B — 8종 갭 (없으면 CREATE 1건)

같은 (audience × structure × session)이 **표 A에 이미 있으면 CREATE 하지 않고 그 ID를 적는다.**

| # | audience | structure | session | 권장 title | 기존 ID 또는 CREATE |
|---|----------|-----------|---------|------------|---------------------|
| B1 | organization | curriculum | single | 일반 프로그램 (기관)_커리큘럼형_단일 회차 | 168001 있으면 재사용 |
| B2 | organization | curriculum | multi | 일반 프로그램 (기관)_커리큘럼형_복수 회차 | 없으면 CREATE |
| B3 | individual | curriculum | single | 일반 프로그램 (개인)_커리큘럼형_단일 회차 | 168005 있으면 재사용 |
| B4 | individual | curriculum | multi | 일반 프로그램 (개인)_커리큘럼형_복수 회차 | 168006 있으면 재사용 |
| B5 | organization | schedule | single | 일반 프로그램 (기관)_일정형_단일 회차 | 168003 있으면 재사용 |
| B6 | organization | schedule | multi | 일반 프로그램 (기관)_일정형_복수 회차 | 없으면 CREATE |
| B7 | individual | schedule | single | 일반 프로그램 (개인)_일정형_단일 회차 | 없으면 CREATE |
| B8 | individual | schedule | multi | 일반 프로그램 (개인)_일정형_복수 회차 | 없으면 CREATE |

CREATE 시:

- 기존 학교·기존 회원만 연결.
- title은 위 표기명. E2E 타이틀과 겹치지 말 것.
- **해당 유형 화면이 열리도록** 플래그를 처음부터 설정 (기존 프로그램 플래그를 바꾸지 말라는 규칙과 별개).
- 기관 CREATE: `studentListRequired=required`, 교재 사용 ON (진행 교재 열·합반 QA).
- 개인 CREATE: 출석/과제/게시글 LNB가 열림. 면접은 표 C와 중복되지 않게 — B만으로는 면접 OFF여도 됨(168005 재사용 시). 면접 QA는 표 C.

### 2.4 표 C — QA 추가 프로그램 (필요할 때만 CREATE)

기존+8종으로 **그 화면이 열리고 데이터가 있으면 CREATE 하지 않음.**

| 코드 | 목적 | 열어야 하는 축 | CREATE 조건 |
|------|------|----------------|-------------|
| C-INT | 면접일 배정 | 개인 면접 ON 또는 봉사 면접 2depth. 프로그램 `interview-slots` + 신청자 availability **겹침**. 배정 대기/완료/포기 각 ≥1 (풀 허용 시 ×2) | 168006 등을 채워도 슬롯이 비거나 겹침이 없으면 **데이터 보강 우선**. 면접 ON 프로그램이 remote에 **하나도 없으면** CREATE `【시드·QA】면접일 배정` |
| C-TEAM | 팀 배정·팀 과제 | 개인 복수회차 + 과제. 팀장/팀원/개인 + 팀명 | 기존 개인 프로그램에 팀 필드가 없으면 그 프로그램에 팀 데이터를 **보강**. 팀 UI가 안 열리는 유형만이면 CREATE |
| C-MERGE | 합반 | 기관 + 학생명단 필요 + **동일 CMS 학교·다른 학년** 참여 ≥2 + merge-group | 168001 등에 다학년 시드로 가능하면 CREATE 없음. 불가능하면 CREATE 1건 |

추가 생성도 **기존 회원·기존 학교만**.

---

## 3. 연결 그래프 (실패 조건)

```text
Program
  ├ managers (기존 관리자)
  ├ commonInfo / recruitment / wage / survey keys / attachments
  ├ form templates (신청·보고서·조서·설문)
  ├ interview-slots (면접 ON일 때)
  ├ program_schedule  ← resolvedScheduleId 숫자 (null 금지 · 배정 대상)
  ├ Application (org | individual | instructor | volunteer)
  │    ├ memberId = 기존 회원
  │    ├ form_response (contextType + contextId)  answers 비-null
  │    └ admin_comment
  └ Participant (승인/최종 PASS만)
       ├ Assignment (기관/출강지/봉사 일정) → 같은 scheduleId
       ├ Attendance / Assignment-submission
       ├ LectureReport / PaymentStatement / Settlement
       └ Posts / SurveyResponses / Certificate 판별 플래그
```

**한 노드만 채우면 CMS가 빈 목록·빈 캘린더·`-`.**

| 규칙 | 실패 증상 |
|------|-----------|
| 모든 사람 FK = 기존 member PK | 상세 이름/unmask 깨짐 |
| 승인/최종 PASS 건 = 같은 memberId의 participant | 진행 탭 빈 테이블 |
| 세션마다 `requestedScheduleId` + **숫자 `resolvedScheduleId`** | `scheduleUnresolved` → 강사 배정 차단 |
| 배정 행의 기관/출강지 = 참여 목록과 같은 org/application PK | 목록 ‘배정 강사’ 공란, 캘린더 불일치 |
| 출석·과제·보고서 = **같은 scheduleId** | 개인 LNB 출석 vs 참여자 상세 출석 불일치 |
| 목록 DTO **그리고** `form_response` + `GET /api/admin/comments` | 목록 또는 상세만 참 |
| form answers privacy mask null | 상세 `-` |
| 합반: merge-group + **양쪽 학년 상세에 교재·합반 동일** | 파트너 상세 교재 공란 |

### 3.1 상세 SoT (form / comment)

목록 매퍼만으로는 교재·학년·안내·에세이가 비는 경우가 있다. 상세 진입 시:

| contextType | contextId | 채울 UI |
|-------------|-----------|---------|
| `ORGANIZATION_APPLICATION` | 기관 신청 PK | 교재명 `textbookName`, 학년 `applicationGrade`/`grade`, 소재지 `organizationRegion`, 상세주소 `addressDetail`/`organizationAddress`, 사유 `applicationReason`, 요청 `otherRequests`, 안내 `computerAvailability`/`waitingAreaGuide`/`mealGuide`/`otherNotes` 또는 `program-application-institution-seed-guidance`, 성범죄 `program-application-institution-seed-sex-offense-consent-submission`, 희망일 `desiredEducationDate` |
| `INSTRUCTOR_APPLICATION` | 강사 신청 PK | `oneLineIntro`, `availableScheduleMemo`, `program-instructor-application-seed-available-schedule` |
| `VOLUNTEER_APPLICATION` | 봉사 신청 PK | `program-volunteer-application-seed-free-text-items`, `program-volunteer-application-seed-previous-ja-program`, `program-volunteer-application-seed-ja-experience` |

코멘트: `GET /api/admin/comments?targetType=…&targetId=…`  
기관 `ORGANIZATION_APPLICATION`, 강사 `INSTRUCTOR_APPLICATION`, 개인/봉사도 각 신청 타입.

**answers 값이 마스킹 null이면 시드 실패.** 계약: [general-org-application-form-answers-masking-backend-request-2026-09-16.md](./general-org-application-form-answers-masking-backend-request-2026-09-16.md)

### 3.2 연결 레시피 예시 (기존 ID만 — 숫자는 DB에 있는 값으로 치환)

**개인 FULL (`168006` 품질 상향)**  
기존 nested: 개인 190012… / 강사 190005–190007 / 봉사 190008–190010 / PM 165001. **없으면 동등 역할의 다른 기존 회원.** 신규 생성 금지.

1. 회원 190018 개인 신청 PASS → participant INDIVIDUAL 동일 memberId  
2. `program_schedule` 3회차 (2026-09~11, 그중 10월 포함) 각각 `resolvedScheduleId`  
3. 출석 LNB 행과 참여자 상세 출석이 **같은 scheduleId**  
4. 강사 190005 approved → participant INSTRUCTOR → 출강지 배정 → 강의보고서·정산 같은 scheduleId  
5. 봉사 190010 서류 PASS + 면접 ASSIGNED + 최종 PASS → participant VOLUNTEER → 봉사 일정 배정  
6. interview-slots ≥2, 신청자 availability와 **겹치는 슬롯**, 배정 건은 `interviewAssignmentId`  
7. posts ≥2 + 첨부 ≥1, 켜진 설문 키마다 응답 > 0  
8. managers 165001 / 165002 (DB에 있을 때)

**기관 (예: 168001)**  
동일 학교 organizationId + **소속 교사** teacherMemberId. 학년만 다른 신청 2건이면 합반 lookup. 승인 → participants ORGANIZATION. 세션 `resolvedScheduleId`. 강사 types가 있으면 배정 join이 목록 ‘배정 강사’에 이름. 학생 명단 필요이면 기존 학생 member 4명+ 출석 전 회차.

나머지 프로그램은 **같은 레시피 복제**, 숨김 축은 생략.

### 3.3 form_response answers — 일반 GET에서 값이 나와야 함 (블로커)

시드가 form을 넣어도 CMS 상세가 `-`인 현재 원인:

1. `GET /api/admin/form-responses?programId=&contextType=&contextId=` → item은 있음  
2. `GET /api/admin/form-responses/{id}` → `answers[].questionKeySnapshot`은 있으나 **`answerDisplayText` / `answerValueJson` 이 null**  
3. 코멘트 API는 정상 → 화면은 코멘트만 있고 교재·학년·안내가 `-`

원인: `upsertFormAnswer`가 `question_id`를 안 넣으면 JOIN `pii_category`가 null → **RESTRICTED** → 일반 GET이 값을 숨김. `form_response.template_version_id` 누락도 조인 실패.

**시드 시 필수**

1. `form_response.template_version_id` 세팅  
2. questionKey로 `form_question` resolve → **`question_id` 세팅**  
3. 신청 상세 표시용 키의 `pii_category` = `NON_PII` / `PUBLIC` / `NONE`  
   (교재명·학년·지역·주소 안내 문구·신청 사유는 민감 PII가 아님. **일반 GET에서 보여야 함.** privacy-detail / `SENSITIVE_PII_READ`를 상세 진입마다 요구하지 말 것)

표시용 키 (기관 `ORGANIZATION_APPLICATION`):  
`textbookName`, `applicationGrade` / `grade`, `organizationRegion`, `addressDetail` / `organizationAddress`, `applicationReason`, `otherRequests`, `computerAvailability`, `waitingAreaGuide`, `mealGuide`, `otherNotes` (또는 `program-application-institution-seed-guidance`), `program-application-institution-seed-sex-offense-consent-submission`, `desiredEducationDate`

강사 `INSTRUCTOR_APPLICATION`: `oneLineIntro`, `availableScheduleMemo`, `program-instructor-application-seed-available-schedule`

봉사 `VOLUNTEER_APPLICATION`: `program-volunteer-application-seed-free-text-items`, `program-volunteer-application-seed-previous-ja-program`, `program-volunteer-application-seed-ja-experience`

**택1 이상 (시드만으로 안 되면 GET 정책도)**  
신청 context(`ORGANIZATION_APPLICATION` | `INSTRUCTOR_APPLICATION` | `VOLUNTEER_APPLICATION`)의 위 키(또는 PUBLIC류)는 mask 없이 answers 값 반환. 미분류 null을 RESTRICTED로 두는 기본값은 유지하되 **신청 템플릿 allowlist는 PUBLIC**.

수용: `GET …/form-responses/{id}`에서 위 키의 `answerDisplayText`가 non-null → CMS 해당 칸이 `-`가 아님. 코멘트는 `GET /api/admin/comments` 현행 유지.

연락처·이메일·실주소 등 **진짜 PII**는 목록 마스킹 + 상세 unmask(`memberId`) 기존 정책 유지.

### 3.4 목록·참여 GET에 실려야 하는 필드 (DB만 채우면 실패)

CMS는 목록 API projection만 그린다. **SQL/DTO에 없으면 시드 실패.** 저장 PATCH API는 본 요청에 넣지 않는다.

#### 기관 신청 `GET …/programs/{id}/organization-applications`

`educationGrade` 또는 `grade`, `region`, `classCount`, `studentCount`, `sessions[]`(또는 동등 회차), `teacherName` + `teacherMemberId`, `organizationName` / 학교명, 승인 상태, (있으면) `mergeGroupId`, `combinedClassPartnerGrades[]`

#### 참여 기관 `GET …/programs/{id}/participants?participantType=ORGANIZATION`

위 + `textbookId`, `textbookName`, `textbookStatus`, `organizationApplicationId`(배정·합반 스코프), `availableActions`(포기 건에 `GIVE_UP`), (있으면) `combinedClassYn`

#### 개인 신청 `GET …/programs/{id}/individual-applications`

목록(테이블): `applicantName`(마스킹 정책 준수), `affiliation`, `educationGrade`, `homeAddress`(목록용 요약/마스킹), 승인/서류 상태, `sessions[]`  
면접 ON이면 추가로: 담당자 A/B 평가, `interviewAvailability` / 슬롯 수, 배정 현황, `assignedInterviewDateLabel`·`assignedInterviewTime`, `interviewAssignmentId`, 2차 점수·현황  
상세에 필요(목록에 전부 싣지 말고 **상세 GET 또는 행 enrich**): 성별, 생년월일, 나이, 학교 재학, 연락처·이메일 원문(unmask용 `memberId` 항상), 1365 ID, 자기소개, 팀명·인원·역할, 교재명(승인 후)

상세 전용 GET이 없으면 목록 행에 상세 표시 필드를 넣거나, 시드와 같이 `GET …/individual-applications/{applicationId}`를 제공. **둘 중 하나라도 CMS 상세가 차야 함.**

#### 강사 신청 `GET …/programs/{id}/instructor-applications` (+ 상세 GET)

`instructorName`, `homeAddress`, `jaLectureExperienceYears`, `jaEvaluationGrade`, `contact`, `email`, 승인 상태, `instructorMemberId`, `availableActions`, 희망 일정 `availableScheduleSlots` / `preferredScheduleSlots` (**`scheduleId` 포함** — 없으면 승인 배정 body를 못 채움). 상세: §5.7 이력서 배열·계좌·한 줄 소개.

#### 봉사 신청 `GET …/programs/{id}/volunteer-applications`

`name`, `contact`, `email`, `id1365`, `hasJaVolunteerExperience`, 에세이 4칸, `managerAEvaluation` / `managerBEvaluation`, `documentScreeningStatus`, `applicationType`, `memberId`  
합격자/2차: `interviewAvailability`, `interviewSlotCount`, `interviewAssignmentStatus`, `assignedInterview*`, `interviewAssignmentId`, 면접일·시간, `managerAScore` / `managerBScore` / `totalScore`, `secondInterviewScreeningStatus`

#### 면접 슬롯 `GET …/programs/{id}/interview-slots`

날짜·시간 2026-09~11, 신청자 availability와 **겹치는 슬롯 ≥1**.

#### 강의보고서 `GET …/programs/{id}/lecture-reports` (또는 강사 스코프 list)

`schoolName`, `educationGrade`, **교육 진행 일정 라벨(날짜·회차 — `일정 #n`만 금지)**, `submitDueAt`, `reportStatus` / `submittedAt`, 열람 가능 시 본문·파일 id.

#### 공통정보 `GET …/programs/{id}`

§4 모집 3섹션·임금 `settlementPolicy`·첨부가 응답/serviceDetail에 있어야 함. 프로그램 row만 있고 nested JSON이 비면 공통정보 `-`.

### 3.5 본 요청에 넣지 않는 것

상세 필드 PATCH, 알림 재발송, 담당자 서류평가 저장 API, 개인 서류 일괄 API 신설, 합반 `leadTeacherMemberId` create body. 조회 화면이 차면 시드 수용. 저장 버튼은 CMS가 unavailable이어도 됨.

---

## 4. 공통정보 · 담당자 · 설문 (노출되는 칸만, `-` 금지)

소스: `common-info-view.tsx`, `participant-recruitment-display.ts`, `program-managers-tab.tsx`.

### 4.1 공통정보 — 기본

최초 등록일, 마지막 수정일, 대표 프로그램명 국문/영문, 공고용 프로그램명, 세부 프로그램명, 사업 운영 기간(**2026-09~11과 모순 없게**), 프로그램 진행 현황, 참여자 유형, 사업 분야, 후원사, 후원사 담당자(기존 회원), 교육 장소, 설문 진행 항목(켜진 키만 라벨: 설문조사 / 만족도조사 / 강의평가).

교육 과정, IP Owned, Course Delivered By, Partner Involvement.

### 4.2 KPI · 임금

참여자 최종 인원, 교육진행자 최종 인원, (기관) 최종 파견 학교 수·학급 수.  
1·2·3급 강사비, 지급 항목, 공제 항목. `settlementPolicy.wagePolicies` / `paymentItems`가 화면에 나와야 함.

### 4.3 유형 설정

교육 진행 구조, 수업 회차 유형, 교육 형태, (개인) 참여 방식, IPS 유형. 일정별 상이 프로그램이면 회차마다 채움.

### 4.4 모집 3섹션 (있는 섹션만)

참여자/기관 모집: 공고 게시 여부, 사전 교육 안내, 수료증 발급, 학생 명단 제출, (기관 한도) 최대 강사·학급·일정 수·1일 최대 차시, 운영 기간, 모집 현황, 교육 대상·상세, 모집 기간, 최종 발표, 문의 기관명·Tel·Email, 비고. 개인 면접 유무 라벨.

강사 모집: 공고, 모집 대상, 문의 Tel/Email, 비고.

봉사 모집: 공고, 면접 유무(2depth vs 1depth), 문의, 비고.

첨부 파일명 ≥1 (프로그램에 첨부 UI가 있으면).

라벨이 ‘해당없음’/‘미게시’/‘제출 불필요’인 축은 **그 라벨을 시드**하지, 빈 문자열로 두지 않음.

### 4.5 담당자

| 열 | 시드 |
|----|------|
| 담당자명 | 기존 관리자 |
| 권한 | PM / 파트너 등 **각 1 이상** (풀 되면 ×2) |
| 연락처 | 비어 있으면 안 됨 |
| 이메일 | 비어 있으면 안 됨 |
| 등록일시 | 2026-09~11 |

### 4.6 설문 (켜진 키만)

| LNB | 시드 |
|-----|------|
| 설문조사 | 응답 건 > 0, 문항·제출자(기존 회원) |
| 만족도조사 | 제출 완료 플래그가 수료증 조건에 쓰임 (`satisfactionSurveyCompleted`) |
| 강의평가 | 건 > 0 |

꺼진 키에 설문을 넣지 않음.

---

## 5. 신청 LNB — 목록·상세 전 필드

### 5.1 기관 신청 목록

소스: `use-applicants-detail-columns.tsx`

| 열 | 시드 · DTO |
|----|-------------|
| 신청 기관명 | CMS 학교명 |
| 기관 소재지 | `region` (시/군구) **목록에 실릴 것** |
| 프로그램 승인 현황 | pending / approved / rejected **각 2** (풀 부족 시 §1.3) |
| 진행 희망 교육 일정 | `sessions[]` 날짜·요일·시간·회차, 2026-09~11 |
| 신청 학년 | `educationGrade` (합반: 동일 학교 다학년) |
| 신청 학급 수 | `classCount` |
| 총 학생 수 | `studentCount` |
| 신청 교사명 | 그 학교 소속 교사 |

### 5.2 기관 신청 상세 · 참여 기관 신청 정보

소스: `institution-basic-info.tsx`, `participating-institution-application-info.tsx`

**기본:** 프로그램 승인 현황(참여 상세는 **프로그램 진행 현황**: `EDUCATION_SCHEDULED` / `EDUCATION_IN_PROGRESS` / `PROGRAM_ENDED` 각 2), 교재명(승인·교재 사용 시), 합반 여부·파트너 학년, 신청 기관명, 신청 학년, 기관 소재지, 상세 주소, 학급 수·총 인원, 희망 교육 형태(프로그램이 참여자 선택일 때), 담당 교사 성명·Tel·M·E-mail, 신청 사유, 기타 요청사항.

**안내:** 컴퓨터 여부, 대기 장소, 식사, 기타 특이사항, 성범죄 조회서 요청(+파일명).

**일정:** 전 회차 + 회차 상태 `completed` / `pending` / `not_planned` 섞음.

관리자 코멘트, 일정 변경&취소 이력 횟수(>0인 건 2). `participationAppliedAt`. 포기 가능 건 `availableActions`에 `GIVE_UP`.

### 5.3 개인 신청 목록 (면접 OFF)

소스: `use-general-individual-applicant-columns.tsx`

신청자명, 소속, 신청 학년, 자택 주소지, 승인 현황(대기/승인/반려 ×2), 진행 희망 교육 일정 `sessions`.

### 5.4 개인 신청 상세

소스: `individual-basic-info.tsx`

승인/진행 현황, (승인 후) 교재명, 성명, 성별 및 생년월일, 학교 재학 여부, 소속, 연락처, 이메일, 자택 주소지, 1365 ID, 자기소개 및 지원동기, 팀 명 및 인원, 역할(팀장/팀원/개인 — 팀 QA 시). 개인정보·제3자 동의 표시가 있으면 값.

`memberId` 기존 개인 회원. PII 원문 + 마스킹.

### 5.5 개인 면접 ON (참여자 심사 3탭)

봉사 심사 UI 재사용. 프로그램 interview-slots 필수.

| 단계 | 목록 열 | 상태 ×2 (풀 허용 시) |
|------|---------|----------------------|
| 1차 서류 | 신청자명, 소속, 학년, 담당자 A/B 평가, 서류 현황 | pending/pass/fail, 평가 pass/neutral/fail/unreviewed |
| 서류 합격자 | 면접 가능 일정 수 **≥1**, 연락처, 이메일, 배정 현황 | waiting / assigned / withdrawn. 열 「면접일 배정」 |
| 2차 면접 | 면접일, 면접 시간, 점수 종합, 2차 현황 | waiting / completed / pass / fail / reserve1–4 |

상세: 기본정보 + 면접 가능 일정(날짜별 슬롯 여러 개, 26.09–11) + 배정 건 `(배정)` 일치.

### 5.6 강사 신청 목록

소스: `use-general-instructor-applicant-columns.tsx`

신청 강사명, 자택 주소지, JA 강의 경력(년), JA 평가 등급, 연락처, 이메일, 승인 현황 대기/승인/반려 ×2.

### 5.7 강사 신청 상세

소스: `applicant-general-instructor-basic-info.tsx`, `instructor-basic-info-detail-form.tsx`, `applicant-instructor-resume.tsx` (`layout=full`)

**기본:** 승인 현황, JA 평가 등급, (승인 후) 강의비 책정 기준, 성명, 성별·생년월일, 연락처, 이메일, 소속(+교사겸직이면 재직 현황), 강사 경력, 자택 주소지, 정산 계좌(은행·계좌·예금주), 강사비 등급, 사업소득자 여부, 한 줄 소개, `instructorMemberId`.

**이력서 (비면 ‘데이터 없음’):**

| 섹션 | 배열 |
|------|------|
| 학력사항 | `educations[]` 학교유형·상태·교명·전공·입학/졸업 **≥2** |
| 경력사항 | `careerDetails[]` 회사·직무·시작/종료·재직중 **≥2** |
| JA Korea 활동 | `jaKoreaActivities[]` **≥1** |
| 자격 및 면허 | `qualifications[]` **≥2** |
| 수상 및 수료 | `awards[]` **≥1** |
| 자기소개 1–4 | `freeWriting1`~`4` 본문 |

기관형: 희망 기관/일정 + **scheduleId**.

### 5.8 봉사자 1차 서류 목록

소스: `doc-screening-columns.tsx`

신청 봉사자명, 연락처, 이메일, JA 봉사 진행 경험(있음/없음 ×2), 에세이 4칸 전부 본문, 담당자 A/B 평가 × 평가값 ×2, 1차 서류 현황 pending/pass/fail ×2, 유형 신규/UJAT ×2.

에세이 제목:

1. 자기소개 및 지원동기  
2. 교육봉사, 강사 아르바이트 등 교육 진행 경험  
3. 초등학생 대상 경제 교육의 필요성…  
4. 초·중·고 당시 학교 JA 수강/참여 경험  

4번은 경험 유무와 무관하게 **본문 시드**.

### 5.9 1차 서류 합격자 · 2차 면접 목록

합격자: 면접 가능 일정 수 ≥1 (날짜 2일 × 슬롯 2+), 연락처, 이메일, 배정 현황 waiting/assigned/withdrawn ×2, 열 「면접일 배정」.

2차: 면접일, 면접 시간, 점수 종합(A/B·총점), 현황 waiting/completed/pass/fail/reserve1–4 ×2.

### 5.10 봉사자 상세

소스: `volunteer-screening/basic-info.tsx`, `essay-sections.tsx`, `interview-availability.tsx`

단계별 현황 라벨 + 성명, 성별 및 생년월일(만 나이), 연락처, 이메일, 1365 ID, JA 봉사 경험, 에세이 1–4, 면접 가능 일정, 배정 시 일시 일치, 2차는 평가 일정·점수·비고. `memberId`. 관리자 코멘트.

참여 매퍼(`participating-volunteer-detail.ts`)가 비면 `-`로 두는 항목: `englishName`, `universityName`, `major`, `applicationRoute` — **회원 프로필 또는 form에 실제 문자열**을 넣어 폴백 `-`를 막는다.

---

## 6. 면접·캘린더 (신청 심사 + 진행)

1. 신청자 `interviewAvailability` 비면 안 됨 (면접 ON).  
2. 프로그램 interview-slots와 **겹치는 슬롯**.  
3. 배정 완료: `assignedInterviewDateLabel` + `assignedInterviewTime` + `interviewAssignmentId`.  
4. 캘린더 월이 2026-09~11. `sessions.date` 파싱 가능 (`2026.09.15` 또는 ISO).  
5. 시간 시작 < 종료.

---

## 7. 진행현황 — 기관

LNB: 참여 기관 / (types에 있으면) 참여 강사 / 참여 봉사자. 개인용 출석·과제·게시글 LNB **없음** — 기관은 학교 상세 탭.

### 7.1 참여 기관 목록

소스: `participating-institutions-section.tsx`

필터: 참여 기관명, 소재지, 교재 배송 현황, 교육 학년, 담당 교사명 → DTO에 있어야 필터가 참.

| 열 | 시드 |
|----|------|
| 참여 기관명 | CMS 학교 |
| 기관 소재지 | region |
| 진행 희망 교육 일정 | sessions 전 회차 |
| 교재 배송 현황 | preparing / shipping / delivered / not_applicable ×2 |
| 교육 학년 | educationGrade |
| 교육 학급 수 · 총 학생 수 | |
| 담당 교사명 | 소속 교사 |
| 배정 강사 | **실제 배정 join** (파이프). 미배정만이면 공란 QA 불가 |

캘린더 팝오버: 기관명·지역·학년·회차 시간.

활동 포기 2건 + 정상 다수. 포기 기준 회차 2026-09~11. `resolvedScheduleId` 숫자.

### 7.2 참여 기관 상세 탭

소스: `participating-institution-detail-tabs.ts`  
`studentListRequired === not_required` → **학생 명단·출석 탭 숨김**. 그 프로그램에는 학생 시드를 넣어도 화면에 안 나옴.

| key | 라벨 | 시드 |
|-----|------|------|
| application | 신청 정보 | §5.2 + 진행 현황 7단계 중 진행 축 |
| students | 학생 명단 | 기관당 ≥4, 남/여. 학생명, 성별, 생년월일, 학급, 연락처, 이메일, 비고, 강의 출석 `n/총회차`, memberId, 초상권 동의 유/무 ×2, 만족도 완료 유/무 ×2, 과제 제출 여부 |
| instructors | 강사 배정 현황 | **배정 완료:** 역할 대표/일반 ×2, 강사명, 자택 주소지, 기관과의 거리, 담당 교육 일정, 정산 현황. **대기:** 강사명, 주소, 거리, 희망 일정, 배정 현황 waiting/assigned/cancelled ×2 |
| attendance | 출석 관리 | 회차 헤더(회차·날짜·시간·형태) + 학생명, 성별, 생년월일, 학급, 연락처, 이메일, 출결 present/absent/late ×2. **전 회차 레코드** |
| posts | 게시글 | ≥2 + 첨부 ≥1 |

거리: 강사 자택 주소 + 기관 주소가 있어야 함. FE 거리 해시에 의존하지 말 것.

### 7.3 진행 — 참여 강사 목록 (기관)

소스: `participating-instructors-section.tsx`

참여 강사명, 자택 주소지, 배정 기관명, JA 강의 경력, JA 평가 등급, 연락처, 이메일, **정산 8종 ×2**:

지급조서 재신청 / 확인 대기 중 / 확인 진행 중 / 지급조서 확인 완료 / 계좌 지급 완료 / 해당 없음 / 신청 반려 / 지급 정정 요청.

캘린더: 기관·지역·강사명·`lectureReportSubmitted` true/false ×2.

### 7.4 참여 강사 상세 탭

| key | 라벨 | 시드 |
|-----|------|------|
| application | 신청 정보 | §5.7 전부 + 진행 현황 + 정산 + 활동 포기 2 |
| institutionAssignment | 교육 배정 현황 | 완료: 역할, 기관명, 학년, 소재지, 거리, 담당 일정. 대기: 기관, 희망 학년, 소재지, 거리, 희망 일정, 배정 현황, 배정 강사 수. 대기 세션 `resolvedScheduleId` 숫자 |
| lectureReports | 강의보고서 관리 | 기관명, 학년, **날짜·회차 라벨**( `일정 #n` 금지), 제출 기간 익월 5일, 진행 완료/예정, 제출 완료/미제출/진행 예정 ×2, 제출 완료는 본문·파일 |
| settlement | 정산 현황 | 기관명, 학년, 일정, 진행 여부, 지급조서 8종, **정산 예정 금액**, `payment_statement_verified`/`account_paid`는 조서 파일 |

### 7.5 진행 — 참여 봉사자 목록·상세 (기관)

목록: 참여 봉사자명, 1365 ID, 기관명, 봉사 진행 일정, 연락처, 이메일. `isReturningVolunteer` 유/무 ×2. 신규/UJAT ×2.

상세 탭:

| key | 라벨 | 시드 |
|-----|------|------|
| application | 신청 정보 | §5.10 |
| assignment | 봉사 배정 현황 | 완료: 기관명, 담당 학년, 소재지, 자택과의 거리, 담당 일정. 대기: 기관, 희망 학년, 소재지, 거리, 희망 일정, 배정 현황, 배정 봉사자 수. 활동 포기 2 + 중단일 회차 |

---

## 8. 진행현황 — 개인

LNB: 참여자 / 참여 강사 / 참여 봉사자 / **출석 관리 / 과제 관리 / 게시글**.

### 8.1 참여자 목록

소스: `participating-individual-participant-columns.tsx`

참여자명, 소속, 교육 학년, 자택 주소지, 교육 진행 일정. 캘린더: 이름·소속·학년·시간. 승인 = 참여 행. 활동 포기 2.

### 8.2 참여자 상세 탭

| key | 라벨 | 시드 |
|-----|------|------|
| application | 신청 정보 | §5.4 + `lectureAttendanceSessions` + `satisfactionSurveyCompleted` + `participationAppliedAt` |
| attendance | 출석 관리 | 교육 일정, 출결, 교육 진행 현황, 비고. 출결 **present / late / absent / excused_absence(사유 불참)** ×2. 지각은 `lateTime` |
| assignments | 과제 관리 | 역할 팀장/팀원/개인 ×2, 팀명, 교육 일정, 과제 제출 기간, 제출 파일, 진행 완료/예정. 제출 완료 `submissionFileIds` |

출결 enum을 기관 학교 출석(지각까지, 사유 불참 없음)과 **섞지 말 것**. 학생 출석 모달의 `not_held`(강의 미진행)도 별개.

### 8.3 프로그램 단위 출석·과제 (LNB)

회차 그룹 헤더 + 참여자 행. 필터: 일정, 이름, 소속, 학년, 출결/제출.

**출석 열:** 참여자명, 성별 및 생년월일, 소속 및 학년, 연락처, 이메일, 출결, 비고.

**과제 열:** 참여자명, 성별 및 생년월일, 소속 및 학년, 제출 파일(미제출/제출+파일명/진행 예정), 비고 `none` / `deadline_missed` / `revision_submitted` / `feedback_delivered` ×2.

**참여자 상세와 같은 사람·같은 scheduleId.**

### 8.4 개인 — 참여 강사

목록은 정산 8종 ×2, 주소·경력·평가·연락처·이메일. 배정은 **출강지**(기관명 아님).

상세 배정: 완료(역할, 출강지, 거리, 담당 일정) / 대기(출강지, 거리, 희망 일정, 배정 현황, 배정 강사 수).

강의보고서: 교육 일정, 익월 5일, 진행 `completed` / `scheduled` / `activity_withdrawn` ×2, 제출 현황, 파일.

정산: 일정, 진행 여부, 조서 현황, 금액, 조서 파일.

### 8.5 개인 — 참여 봉사자

목록: 이름, 1365 ID, 봉사 진행 일정, 연락처, 이메일.

상세 배정: 완료(담당 일정) / 대기(희망 일정, 배정 현황, 배정 봉사자 수). 신청 정보는 §5.10과 동일 품질.

### 8.6 게시글

개인 LNB `progress_posts` ≥2 + 첨부. 기관 학교 상세 `posts`와 **별 화면** — 둘 다 해당 프로그램에서 채움.

---

## 9. 상태 매트릭스 (풀이 되는 한 ×2)

| 축 | 값 |
|----|-----|
| 신청 승인 (기관/개인/강사) | pending, approved, rejected |
| 서류 | pending, pass, fail |
| 담당자 평가 | pass, neutral, fail, unreviewed |
| 면접 배정 | waiting, assigned, withdrawn |
| 2차 면접 | waiting, completed, pass, fail, reserve1–4 |
| 교재 배송 | preparing, shipping, delivered, not_applicable |
| 정산 | 8종 |
| 강사 역할 | lead, assistant |
| 배정 대기 | waiting, assigned, cancelled |
| 기관 출석 | present, absent, late |
| 개인 출석 | present, late, absent, excused_absence |
| 보고서 제출 | submitted, not_submitted, scheduled |
| 합반 | 합반 / 비해 |
| 활동 포기 | 포기 2 + 정상 |
| 진행 enrollment | EDUCATION_SCHEDULED, EDUCATION_IN_PROGRESS, PROGRAM_ENDED |

인원 부족 시 §1.3. **회원을 만들어 채우지 않음.**

---

## 10. 짚을 점 · 주의

1. **신청 승인 ≠ 진행 행.** participants + schedule + 배정 + 출석이 없으면 진행 탭은 빈다.  
2. **`resolvedScheduleId` null = 배정 불가.** 희망 일정만 있는 건 QA 배정에 쓰지 말 것.  
3. **목록 enrich.** §3.4 필드가 list/participants GET에 없으면 필터·합반·캘린더 실패. DB에만 있으면 실패.  
4. **합반 실적**은 merge-group만으로 부족. 합반 전후 회차·출석·실적.  
5. **학생 명단 불필요** 프로그램에 학생 시드를 넣어도 탭이 없음.  
6. **출결 enum 화면마다 다름** — §8.2.  
7. **정산 8종.** 조서 발급 CTA는 확인 완료·계좌 지급 완료 + **조서 파일·금액**.  
8. **보고서 기한 = 익월 5일.** 10월 강의를 넣어 창을 맞춤. list에 날짜·회차·기관·학년을 실어 `일정 #n` 방지.  
9. **거리**는 주소 쌍.  
10. **활동 포기** 이후 회차는 실적 제외. 중단일 전 회차는 출석·보고서 유지.  
11. **수료증:** `participationAppliedAt` + 출석 회차 + (만족도 켜짐) `satisfactionSurveyCompleted`.  
12. **개인 출석 LNB vs 상세 출석** 같은 scheduleId.  
13. **게시글** 기관 상세 vs 개인 LNB 별개.  
14. **저장 API 없는 화면**은 조회만 채움. CMS unavailable 모달. 시드가 저장 버튼을 고치지 않음.  
15. **form answers 마스킹 null** = 상세 공란. **§3.3을 시드와 같이 고친다.** 별도 갭 문서 없이 본 요청에 포함.  
16. **기존 프로그램 플래그 유지.** 숨김 LNB에 행을 넣지 않음.  
17. **8종 CREATE**는 표 B 빈 칸만. Primary 8을 8종으로 오해하지 말 것.  
18. **목록 DTO 누락**은 FE 버그가 아니라 GET projection 누락(§3.4). 회원 프로필 JOIN이 이름만이면 소속·학년·주소가 `-`.

---

## 11. 수용 기준 (프로그램당)

CMS: `/programs/general?programId={id}` 해당 LNB.

노출된 모든 테이블·상세에서 **표시 값이 `-`이거나 빈 목록이면 미완료.** (의도된 라벨 ‘해당없음’ 제외)

API 예:

```text
GET /api/admin/programs/{id}
GET /api/admin/programs/{id}/organization-applications
GET /api/admin/programs/{id}/individual-applications
GET /api/admin/programs/{id}/instructor-applications
GET /api/admin/programs/{id}/volunteer-applications
GET /api/admin/programs/{id}/interview-slots
GET /api/admin/programs/{id}/participants?participantType=ORGANIZATION|INDIVIDUAL|INSTRUCTOR|VOLUNTEER
GET /api/admin/form-responses?programId={id}&contextType=…&contextId=…
GET /api/admin/comments?targetType=…&targetId=…
GET …/lecture-reports
GET … 출석·과제·게시글·설문 (해당 프로그램 계약)
```

체크:

- [ ] 표 A 전수 ID 보강 (노출 축만)
- [ ] 표 B 8칸이 기존 ID 또는 CREATE로 채워짐
- [ ] 표 C 면접 배정·팀·합반이 화면에서 확인 가능 (불필요하면 CREATE 없음)
- [ ] 신규 회원 0건 · 부족은 보고란
- [ ] 기관 = 기존 학교 · 교사 = 그 학교 소속
- [ ] 승인 → participant 동일 memberId
- [ ] 전 세션 `resolvedScheduleId` 숫자
- [ ] §3.3 `GET …/form-responses/{id}` — 표시용 키 `answerDisplayText` non-null (코멘트만 있고 본문 `-`면 실패)
- [ ] §3.4 기관 신청·participants ORGANIZATION에 `educationGrade`·`region`·교재·`organizationApplicationId`
- [ ] §3.4 개인 신청 목록에 소속·학년·주소 요약·`sessions` (면접 ON이면 availability·배정 id)
- [ ] §3.4 강사 목록에 주소·JA 경력·평가·연락처·이메일·희망 일정의 `scheduleId`
- [ ] §3.4 봉사 목록에 에세이·평가·1365·면접 슬롯/배정 id
- [ ] 강의보고서 일정 라벨이 `일정 #n`만이 아님
- [ ] 날짜 2026-09~11
- [ ] 한 칸 `-` 없음

### 11.1 시드 결과 보고 템플릿 (BE가 채움)

| programId | 신규CREATE? | 8종 칸 | 보강한 축 | 사용한 기존 member 수 | 부족 역할 |
|-----------|-------------|--------|-----------|----------------------|-----------|
| | | B1–B8 | | | |

---

**Last updated:** 2026-09-16
