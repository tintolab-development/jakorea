# Cursor prompt — 봉사자 신청서(일반·UJAT) Platform 제출 ↔ CMS 신청정보 동기화 (JABACK)

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 탐색하지 말고, **이 문서의 계약과 재현만** 사용하라.

프론트 레포 경로: `apps/cms/docs/api/volunteer-application-platform-sync-backend-cursor-prompt-2026-10-07.md`

> **긴급도: 중간.** FE는 2026-10-07에 Platform 봉사자 신청서의 전용 단락을 CMS 양식과 같은 입력 UI로 바꿨다.
> 범위는 **일반 프로그램 봉사자**(`program-volunteer-application-seed-*`)와 **UJAT 봉사자**(`ujat-program-application-volunteer-seed-*`)다.
> 아래 4건은 FE만으로 해결할 수 없다. 일반·UJAT 처리는 프로그램 유형별로 분기하고, 한쪽 수정이 다른 쪽 기본 동작을 바꾸지 않게 한다.

---

## FE가 2026-10-07부터 보내는 답 (참고 — 서버 변경 없이 저장 가능)

단일 선택 객관식은 이제 **선택지 id 문자열 1개**로 보낸다. 이전엔 `[]`를 보내 필수 검증에 걸렸다.

### 일반 봉사자

| questionKey | 답 형태 | 비고 |
| --- | --- | --- |
| `program-volunteer-application-seed-ja-experience` | `"program-volunteer-application-ja-experience-yes"` \| `"…-no"` | 단일 선택 |
| `program-volunteer-application-seed-previous-ja-program` | `{ "applicationYear": "2024", "programName": "…" }` | 「있음」일 때만 전송 (기존 conditional 정책 그대로) |
| `program-volunteer-application-seed-free-text-items` | `{ "items": [{ "id": "intro"\|"educationExperience"\|"necessity"\|"jaExperience", "label": "…", "bodyText": "…" }] }` | 4문항 모두 필수(FE 검증), 문항당 1000자 |
| `program-volunteer-application-seed-interview-schedule` | `["interview-slot:12", …]` | `dynamic_interview_slots` 선택지 값 그대로 |
| `program-volunteer-application-seed-activity-schedule` | `["<option value>", …]` | `dynamic_schedule_options` 선택지 값 그대로 |

### UJAT 봉사자

| questionKey | 답 형태 | 비고 |
| --- | --- | --- |
| `ujat-program-application-volunteer-seed-basic-info` | 아래 JSON | 필수(FE 검증) |
| `ujat-program-application-volunteer-seed-previous-term` | `{ "activityTerm": "3", "activityYear": "2024" }` | 지원 형태 「UJAT 수료자 봉사자」일 때만 입력 |
| `ujat-program-application-volunteer-seed-preferred-region` | `"<dynamic_ujat_education_regions 선택지 값>"` | 단일 선택 |
| `ujat-program-application-volunteer-seed-education-experience` | `"ujat-program-application-volunteer-education-experience-yes"` \| `"…-no"` | 단일 선택 |
| `ujat-program-application-volunteer-seed-interview-schedule` | `["interview-slot:12", …]` | `dynamic_interview_slots` 선택지 값 그대로 |
| `ujat-program-application-volunteer-seed-free-text-items` | 일반 봉사자 free-text와 같은 `{ "items": [...] }` | 지원 형태 「신규 봉사자」일 때만 입력 |
| `ujat-program-application-volunteer-seed-submit-confirmation` | 선택지 id 문자열 1개 | 단일 선택 |

UJAT 기본 정보 답:

```json
{
  "universityName": "서울대학교",
  "grade": "3",
  "gradeLabel": "3학년",
  "major": "경영학",
  "applicationRoute": "other",
  "applicationRouteLabel": "기타",
  "applicationRouteOther": "지인 추천",
  "applicationType": "new"
}
```

- `grade`: `1`~`4`, `leave`(휴학생), `deferred`(졸업유예)
- `applicationRoute`: `instagram`, `school-everytime`, `linkareer`, `allcon`, `campuspick`, `other`. `other`일 때만 `applicationRouteOther`가 채워진다.
- `applicationType`: `new`(신규 봉사자) \| `ujat-graduate`(UJAT 수료자 봉사자)

지원 형태 때문에 숨긴 단락(신규 → previous-term, 수료자 → free-text-items)은 현재 서버에 조건부 정책이 없어서 필수 검증에 걸린다. 그래서 FE는 임시로 아래 값을 보낸다. 요청 3이 반영되면 서버가 이 값을 무시하거나 저장하지 않으면 된다.

```json
{ "notApplicable": true, "applicationType": "new" }
```

일반 봉사자 CMS 신청정보는 form_response 답을 FE에서 파싱해 자유 작성 4문항과 이전 참여 프로그램(「2024 · 프로그램명」)을 표시한다. UJAT CMS 신청자 상세는 요청 4가 필요하다.

---

## 요청 1 — 증빙서류 첨부 (일반: 이전 참여 JA 봉사 프로그램 / UJAT: 이전 활동 수료증)

### 현상

- CMS 양식에는 첨부 입력이 있다.
  - 일반 `VolunteerPreviousJaProgramParagraph`: 「증빙서류 첨부」(JPG·PNG·PDF, 15MB, 다중)
  - UJAT `UjatProgramApplicationVolunteerPreviousTermParagraph`: 「수료증 첨부」
- Platform 신청 저장 요청 `PortalSaveApplicationRequest`(`recruitmentId, applicationType, formBindingId, answers, …`)에는 파일을 문항에 연결하는 필드가 없다.
- 회원 파일 업로드(`POST /api/portal/me/files/upload-requests` → PUT → confirm)는 있다. 하지만 허용 `filePurpose`(`ASSIGNMENT_ATTACHMENT`, `SURVEY_ATTACHMENT`, `ABSENCE_EVIDENCE`, `EXPENSE_RECEIPT`, `INSTRUCTOR_APPLICATION`, `ELECTRONIC_SIGNATURE`, `STUDENT_ROSTER`, `PORTRAIT_CONSENT`, `EDUCATION_JOURNAL`, `INQUIRY_ATTACHMENT`, `CRIMINAL_HISTORY_EVIDENCE`)에 프로그램 신청 증빙 용도가 없다.
- 그래서 FE는 텍스트 값만 받고, 첨부 입력은 Platform에 노출하지 않았다.

### 요청

1. 회원 업로드 `filePurpose`에 신청 증빙 용도를 추가한다. 예: `PROGRAM_APPLICATION_EVIDENCE`. 이름을 FE에 알려준다.
2. 포털 신청 저장·제출 요청에 문항별 파일 연결을 추가한다. 예: `fileObjectIdsByQuestion: { [questionKey]: number[] }`. `FormRuntimeService`의 FILE 문항 처리와 같은 방식이면 된다.
   - 본인 소유, `CLEAN`+`AVAILABLE` 파일만 허용한다. 허용 확장자(JPG·PNG·PDF)와 용량(15MB)도 검증한다.
   - 대상 문항이 숨겨진 경우(일반: 경험 「없음」, UJAT: 지원 형태 「신규」)에는 거절한다(기존 hidden 답 거절과 같은 규칙).
   - 임시저장 후 다시 열 때 연결된 파일 목록을 렌더 응답(draft)에 내려준다.
3. CMS 신청 상세에 이 문항의 첨부 목록(`fileObjectId`, `originalFileName`, 다운로드 경로)을 내려준다.
   - 일반: `VolunteerApplicationDetailResponse` 또는 form_response 상세
   - UJAT: UJAT 봉사자 신청자 상세 응답
4. 첨부를 필수로 할지는 기획 확인이 필요하다. 확정 전까지는 **선택**으로 둔다.

### 완료 조건

- Platform에서 첨부 → 제출 → CMS 신청정보에서 같은 파일을 내려받을 수 있다.
- 타인 파일 id, 숨김 문항 첨부, 허용되지 않은 확장자는 4xx로 거절한다.

---

## 요청 2 — 면접 없는 프로그램의 봉사자 면접 문항 숨김 (일반·UJAT)

### 현상

- `ProgramApplicationAudienceRuntimeService` VOLUNTEER flavor는 `program-volunteer-application-seed-interview-schedule`과 `ujat-program-application-volunteer-seed-interview-schedule`을 **항상** `dynamic_interview_slots`로 장식한다. 슬롯이 0개여도 그렇다.
- INDIVIDUAL flavor는 `participantInterviewEnabled(programId)`가 false이거나 슬롯이 없으면 `hiddenQuestionKeys`에 넣어 숨긴다.
- CMS 미리보기는 `interviewEnabled === false`이면 면접 단락을 숨긴다.
- 결과: 봉사자 면접을 진행하지 않는 프로그램에서도 Platform에 면접 문항이 필수로 보인다. 선택지가 없어서 신청할 수 없다. FE는 "선택 가능한 면접 일정이 없습니다. 관리자에게 문의해 주세요."로 막고 있다.

### 요청

1. 봉사자 면접 진행 여부를 판정한다. 모집 설정의 봉사자 면접 사용 여부 컬럼이 있으면 그것을 쓰고, 없으면 그 프로그램의 `program_interview_slot` 존재 여부로 판정한다. UJAT도 같은 기준을 UJAT 프로그램 설정에서 찾는다.
2. 면접을 진행하지 않으면 해당 면접 questionKey를 `hiddenQuestionKeys`에 넣는다. 그러면 렌더 시 `runtimeHidden`이 되고, 제출 검증에서도 제외된다.
3. 면접을 진행하는데 남은 슬롯이 0개이면 현재처럼 노출·필수로 둔다. 이 경우 신청을 막을지, 문항만 숨길지는 기획 확인 후 결정한다.

FE는 이미 `runtimeHidden: true` 단락을 숨기고 답에서 뺀다. 서버만 바뀌면 된다.

### 완료 조건

- 면접 미진행 프로그램(일반·UJAT): 렌더 응답에서 면접 단락 `runtimeHidden: true`, 면접 답 없이 제출 성공.
- 면접 진행 프로그램: 기존 동작 유지 (슬롯 선택 → `program_interview_application_slot` 저장).

---

## 요청 3 — UJAT 지원 형태에 따른 단락 조건부 정책

### 현상

- CMS UJAT 양식은 기본 정보의 「지원 형태」에 따라 단락을 숨긴다.
  - `new`(신규 봉사자) → `ujat-program-application-volunteer-seed-previous-term` 숨김
  - `ujat-graduate`(UJAT 수료자 봉사자) → `ujat-program-application-volunteer-seed-free-text-items` 숨김
- 서버에는 이 조건부 정책이 없다. 두 단락 모두 필수 HORIZONTAL_TABLE이라 숨긴 쪽도 값이 있어야 통과한다.
- 지원 형태는 독립 문항이 아니라 `basic-info` 답 객체의 `applicationType` 필드다. 기존 일반 봉사자 previous-ja 조건(`dependsOnQuestionKey` + 스칼라 값)과 모양이 다르다.

### 요청

1. 위 두 단락에 조건부 정책을 추가한다. 의존 대상은 `ujat-program-application-volunteer-seed-basic-info` 답의 `applicationType` 필드다.
   - 기존 conditional 모델에 `dependsOnField`(답 객체 내부 필드) 같은 확장이 필요하면 추가한다.
2. 숨김 조건에 해당하는 단락은 필수 검증에서 제외한다.
3. 숨김 단락에 FE가 보내는 `{ "notApplicable": true, ... }`는 **거절하지 말고 무시**(저장하지 않음)한다. 일반 hidden 답 거절 규칙을 그대로 적용하면 현재 FE 제출이 깨진다. 반영 후 FE가 전송을 멈추도록 알려주면 FE에서 제거한다.
4. 렌더 응답 `runtimeContext.conditionalQuestions`에 이 정책을 노출할지 결정해 알려준다. FE는 지금 지원 형태를 로컬 상태로 판정해 숨기고 있다.

### 완료 조건

- 신규 봉사자: previous-term 없이(또는 `notApplicable`로) 제출 성공, free-text-items는 필수.
- 수료자 봉사자: free-text-items 없이(또는 `notApplicable`로) 제출 성공, previous-term은 필수.

---

## 요청 4 — UJAT 봉사자 신청 답을 CMS 신청자 상세로 투영

### 현상

- CMS UJAT 봉사자 신청자 목록·상세는 서버 응답의 projection만 쓴다. 지금 projection에는 `previousActivityTerm`, `preferredActivityRegion`, `educationExperience`만 있다.
- 대학교, 학년, 전공, 지원 경로, 지원 형태, 이전 활동 년도, 자유 작성 4문항은 응답에 없다. 그래서 CMS 화면에 빈 값으로 보인다.

### 요청

UJAT 봉사자 신청자 상세(필요하면 목록도) 응답에 form_response 답에서 아래 값을 채운다. 일반 봉사자의 `VolunteerApplicationRuntimeProjectionService`처럼 제출 시 projection을 동기화하는 방식이면 된다.

| 응답 필드(예시) | 출처 |
| --- | --- |
| `universityName` | basic-info `universityName` |
| `grade`, `gradeLabel` | basic-info `grade`, `gradeLabel` |
| `major` | basic-info `major` |
| `applicationRoute`, `applicationRouteLabel`, `applicationRouteOther` | basic-info 같은 이름 |
| `applicationType` | basic-info `applicationType` |
| `previousActivityTerm`, `previousActivityYear` | previous-term `activityTerm`, `activityYear` |
| `essayIntro`, `essayEducationExperience`, `essayNecessity`, `essayJaExperience` | free-text-items `items[].id` = `intro`, `educationExperience`, `necessity`, `jaExperience` |
| `preferredActivityRegion` | preferred-region 선택지 값 → 지역명 |
| `educationExperience` | education-experience `…-yes` / `…-no` → boolean |

### 완료 조건

- Platform에서 UJAT 봉사자 신청 제출 → CMS UJAT 신청자 상세에서 위 값이 모두 보인다.
- 지원 형태별로 숨긴 단락(`notApplicable`) 값은 projection에 빈 값으로 남는다.

---

## 회귀 확인

- `VolunteerApplicationRuntimeProjectionService.sync`: 경험 답이 문자열 1개로 와도 `is_reparticipation`이 갱신된다(기존 `values()`가 스칼라를 처리하므로 변경 불필요할 것. 테스트로 확인).
- UJAT preferred-region이 문자열 1개로 와도 `dynamic_ujat_education_regions` 검증·저장이 된다.
- 강사·개인·UJAT 기관 flavor 동작 변화 없음.
