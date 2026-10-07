# Cursor prompt — 봉사자 모집 대상을 회원 구분과 맞출 것 (JABACK)

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 탐색하지 말고, **이 문서의 계약과 재현만** 사용하라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/volunteer-recruitment-target-member-classification-backend-cursor-prompt-2026-10-07.md`

> **긴급도: 중간.** CMS 봉사자 모집 대상 선택지가 `대학(원)생 / 일반인 / 기타`에서
> 초등학생·중학생·고등학생·대학(원)생·성인으로 바뀐다.
> 포털 봉사자 신청은 이 대상과 **이미 저장된 회원 재학·학교급**이 겹칠 때만 허용한다.
> 나이·학년 숫자로 새 구분 공식을 만들지 마라.

---

## 프론트가 이미 하는 일

CMS는 봉사자 「모집 대상」을 복수 선택으로 저장한다. 저장 값은 교육 대상과 같은 코드다.

| 코드 | 화면 라벨 |
|---|---|
| `elementary` | 초등학생 |
| `middle` | 중학생 |
| `high` | 고등학생 |
| `university` | 대학(원)생 |
| `adult` | 성인 |

- 일반 프로그램: 기본 선택을 넣지 않는다. 관리자가 고른 코드만 저장한다.
- UJAT 봉사자(상반기·하반기 각각): 해당 반기 overlay에 모집 대상 키가 **없으면** 폼 기본값은 `university`, `adult`다. 키가 있으면(빈 배열 포함) 그 값을 유지하고 기본값으로 덮지 않는다. 선택지는 같고, 등록·상세에서 수정·추가할 수 있다.

읽는 곳 (FE가 `serviceDetailJson` 및 모집 overlay에 넣음):

- `program.volunteerTargets`: `string[]` 코드. 구 데이터는 한글 라벨일 수 있다.
- 일반 overlay 키 `recruit.volunteer.volunteerTargets`
- UJAT overlay 키 `ujat.recruit.volunteer.volunteerTargets`, `ujat.recruit.volunteer.h1.volunteerTargets`, `ujat.recruit.volunteer.h2.volunteerTargets`
- 표시용 문자열 `volunteerTarget` / 중첩 `volunteerRecruitmentInfo.recruitmentTarget`은 라벨(`대학(원)생, 성인`)일 수 있다. **배열이 있으면 배열이 우선**이다.

구 값 읽기 (FE가 조회 시 코드로 정규화):

| 저장 문자열 | 코드 |
|---|---|
| `대학(원)생`, `대학생` | `university` |
| `일반인`, `성인` | `adult` |
| `초등학생` / `중학생` / `고등학생` | `elementary` / `middle` / `high` |
| `기타` | 코드로 바꾸지 않는다. 선택지에서 제거됐고, 조회 시 원문 유지 |

**바꾸지 말 것:** 모집 행 `recruitments[].targetType`. 봉사자 행 식별·신청 양식 바인딩은 계속 `COLLEGE_STUDENT`다. 다섯 구분으로 바꾸면 `GENERAL_PROGRAM_APPLICATION_FORM_BINDING_REQUIRED` 류 매칭이 깨진다. `targetType`이 비어 있을 때의 `COLLEGE_STUDENT` 기본도 유지한다.

---

## 요청

### ① 모집 대상 코드 저장

일반·UJAT 봉사자 모집의 `volunteerTargets`를 위 다섯 코드의 배열로 저장·조회하라.

- 요청에 코드 배열이 있으면 그 순서를 유지하고 중복을 제거한다.
- 한글 라벨이 오면 위 표로 코드로 바꾼 뒤 저장한다. `기타`는 배열에 그대로 둔다.
- 알 수 없는 토큰은 400으로 거절하지 말고, 응답에 어떤 토큰을 무시했는지 로그·에러 본문에 남겨라. 알려진 코드만 저장한다. `기타`는 예외로 유지한다.
- UJAT은 상반기·하반기 키를 **각각** 저장한다. 한 반기를 수정할 때 다른 반기 배열을 기본값으로 덮지 마라.
- UJAT에서 그 반기 키가 아예 없고 생성 요청에도 배열이 없으면 기본값은 `["university","adult"]`다. 키가 `[]`로 오면 빈 배열을 유지한다.
- 일반 프로그램은 배열이 없으면 기본 코드를 채우지 마라.

### ② 회원 구분 — 기존 필드만 사용

봉사자 신청 자격은 프로그램에 저장된 `volunteerTargets`와 회원 구분이 **하나라도 겹치면** 허용, 겹치지 않으면 거절한다.

구분은 아래 기존 컬럼만 본다. `grade`(1학년~12학년), `birthDate`, `ageGroup`(`UNDER_14`/`OVER_14`)으로 초·중·고·대학·성인을 나누지 마라.

| 회원 상태 | 구분 코드 |
|---|---|
| `schoolEnrollmentStatus=ENROLLED` 이고 연결 학교급(`schoolLevel` / NEIS `SCHUL_KND_SC_NM`)에 초등 | `elementary` |
| 같음 + 중학 | `middle` |
| 같음 + 고등 | `high` |
| `ENROLLED` 이고 `schoolSelection.provider=CAREER_NET`, 또는 학교급에 대학·전문대·대학원 | `university` (화면 라벨은 대학(원)생) |
| `schoolEnrollmentStatus=NOT_ENROLLED` | `adult` |
| 교사 회원 | 소속 학교명(근무지)으로 학생 구분을 만들지 마라. 본인 재학 정보가 위 규칙에 없으면 `adult` |

학교급 문자 예: `초등학교`, `중학교`, `고등학교`, 커리어넷 `schoolGubun`의 `대학(4년제)`, `전문대학`, `대학원`.

`volunteerTargets`가 비어 있거나 `기타`만 있으면 구분 필터를 적용하지 마라(기존처럼 봉사자 행 신청 가능). 코드가 하나라도 있으면 그 코드와 회원 구분이 겹쳐야 한다.

거절 시 기존 신청 에러 형식에 맞추고, 사유는 모집 대상과 회원 구분이 다르다는 뜻이어야 한다. 새 에러 코드를 만든다면 `VOLUNTEER_RECRUITMENT_TARGET_MISMATCH`로 고정하라.

### ③ 조회

`GET` 프로그램 상세의 `serviceDetailJson.program.volunteerTargets`와 모집 overlay는 저장한 코드 배열을 그대로 내려라. 한글 라벨로 되돌리지 마라. FE가 라벨로 그린다.

---

## 수용 기준

- [ ] 일반 프로그램 봉사자 모집에 `["elementary","high"]`를 저장하면 재조회 배열이 그 두 코드다. `targetType`은 `COLLEGE_STUDENT`로 남는다.
- [ ] 구 값 `["대학(원)생","일반인"]`을 다시 저장하거나 마이그레이션하면 `["university","adult"]`다. `기타`가 섞여 있으면 `기타`는 남는다.
- [ ] UJAT 상반기만 `["high"]`로 바꾸면 하반기 배열은 그대로다. 하반기 키가 없는 신규 행만 `["university","adult"]`다.
- [ ] `ENROLLED` + 학교급 고등학교 회원은 `high`가 포함된 봉사자 모집에만 신청된다. `university`만 있는 모집은 거절된다.
- [ ] `CAREER_NET` 재학 회원은 `university` 모집에 신청된다.
- [ ] `NOT_ENROLLED` 회원은 `adult` 모집에 신청된다. 교사 회원의 근무 학교가 초등학교여도 `elementary`로 치지 않는다.
- [ ] `grade`나 만나이로 위 결과를 바꾸지 않는다.

## 보고

바꾼 클래스·컬럼·마이그레이션 여부를 적고, `기타`와 빈 배열을 어떻게 뒀는지 한 줄로 적어라.
