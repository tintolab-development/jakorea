# Cursor prompt — 설문 「설문자 정보(user_info)」 자동입력 값 서버 해석·스냅샷 (JABACK)

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 탐색하지 말고, **이 문서의 계약과 재현만** 사용하라.

프론트 레포 경로: `apps/cms/docs/api/survey-user-info-autofill-snapshot-backend-cursor-prompt-2026-10-07.md`

> **긴급도: 중간.** FE는 2026-10-07에 설문자 정보를 템플릿과 같은 **자동입력 표 1문항**으로 바꿨다(작성 입력 없음).
> 표시값은 지금 Platform이 로그인 프로필·프로그램 화면 데이터로 계산해 `fieldAnswers`로 제출한다. 서버는 이 값을 검증·보정하지 않는다.

---

## 현재 계약 (FE 기준)

- 템플릿 단락: `{ kind: "single_item", variant: "user_info", selectedUserFieldKeys: string[], userFields?: {key,label}[] }`
- 사용자 화면: 선택된 key마다 「라벨 | 값」 표 1개. 문항 번호도 1개만 쓴다(이전: key마다 문항 1개).
- 제출: `answers[<user_info 단락 key>] = { [fieldKey]: string }` (Platform `fieldAnswers`)
- fieldKey 카탈로그 (`@jakorea/form-schema` `DEFAULT_USER_INFO_FIELD_CATALOG`):

| key | 라벨 | Platform 값 출처 (현재) |
| --- | --- | --- |
| name, gender, birthDate, phone, email | 이름·성별·생년월일·연락처·이메일 | 회원 프로필 |
| addressRegion, addressDetail | 자택 주소지(지역/상세) | 회원 프로필 |
| affiliation | 소속 | 회원 프로필 (학교/소속명) |
| applicantType | 신청자 유형 | 회원 유형 라벨 |
| programName, period | 프로그램명·교육 진행 일정 | 프로그램 상세 |
| institutionName, institutionRegion | 기관명·기관 소재지 | 화면 props (호출부별로 **누락 있음**) |
| educationTarget, educationGrade | 교육 대상·학년 | 프로그램 상세 (일부만 전달) |
| teamName, teamPartnerName | 팀 명·팀원/파트너 명 | **출처 없음** → 항상 `-` |

## 문제

1. **신뢰성**: `FormAnswerValidator`는 USER_INFO를 일반 필수 문항처럼 "값 존재"만 확인한다. 클라이언트가 임의 값을 보내도 그대로 저장되고 CMS 응답 결과에 노출된다.
2. **누락 필드**: 팀 명·팀원/파트너 명, 기관명/소재지/학년은 Platform 포털 응답에 없어서 `-`로 표시·저장된다.
3. **이력**: 회원 정보가 바뀌면 FE가 다시 계산한 값과 제출 당시 값이 달라질 수 있다. 제출 시점 값을 서버가 고정해야 한다.

---

## 요청

### A. [권장] 제출 시 USER_INFO 값을 서버가 해석해 스냅샷

- 설문 submit(포털·관리자 대리 모두)에서 schema의 `user_info` 단락을 찾고, `selectedUserFieldKeys`별 값을 **서버가 회원·신청·프로그램·팀 데이터로 계산**해 응답 answers에 저장한다(클라이언트 값은 무시하거나 덮어쓴다).
- 팀 값은 기존 `FormResponseTeamSnapshotService`의 팀 스냅샷과 같은 기준을 쓴다(팀명 = `team_name_snapshot`, 파트너 = 같은 팀의 다른 구성원 이름, 쉼표 구분).
- 서버가 값을 정하는 단락은 클라이언트 필수 검증에서 제외한다(`autoFillKey` 처리와 같은 취지). 값이 없으면 빈 문자열로 저장하고 제출을 막지 않는다.
- 하위 호환: 당분간 클라이언트가 `fieldAnswers`를 보내도 400이 나지 않게 한다(무시).

### B. [권장] 포털 render 응답에 표시값 제공

- `GET` 포털 설문 render(설문 폼 조회) 응답에 `userInfoValues: { [fieldKey]: string }`를 추가해 A와 **같은 계산 결과**를 내려준다.
- FE는 이 필드가 오면 Platform 자체 계산 대신 이 값을 표에 표시한다. 없으면 현재 FE 계산을 쓴다.

### C. [확인] CMS 응답 상세·집계

- CMS 설문 응답 상세/목록(`SurveyResponseDetailResponse` 등)에서 user_info 답변이 A의 스냅샷 값으로 나오는지 확인한다.
- 집계(`SurveyResultAggregation*`)에서 USER_INFO는 선택형 집계 대상이 아니다. 지금처럼 제외되는지 확인한다.

---

## 검증

1. 설문자 정보(name, addressRegion, teamName 선택) 포함 설문을 바인딩하고 Platform에서 제출한다. 저장된 answers가 서버 계산값인지 확인한다(클라이언트가 다른 값을 보내도).
2. 회원 주소를 수정한 뒤 기존 응답 상세가 제출 당시 값을 유지하는지 확인한다.
3. 팀 없는 참여자 제출 시 teamName은 빈 문자열이고 제출이 성공해야 한다.
4. 포털 render 응답에 `userInfoValues`가 포함되는지 확인한다(B).

## 완료 후

- OpenAPI 갱신(`userInfoValues`, 변경된 검증 규칙)
- FE handoff 문서: `docs/frontend/survey-user-info-autofill-snapshot-frontend-handoff-<date>.md`
