# 일반 프로그램 remote DB 전그래프 시드 재작업 요청

| 항목 | 내용 |
|------|------|
| 작성일 | 2026-09-17 |
| 대상 | CMS 일반 프로그램 remote DB |
| 원 요청 | `general-program-remote-db-full-graph-seed-backend-request-2026-09-16.md` |
| 결론 | 현재 결과는 기존 `general-primary-case` 최소 시드를 일부 확장한 수준으로 수용 불가 |
| 최우선 원칙 | 시드 실행 전에 존재하던 CMS 학교·회원만 재사용하고 회원·기관을 새로 생성하지 않는다 |

---

## 1. 재작업이 필요한 이유

현재 반환된 `168001` 데이터에는 다음과 같은 기존 로컬 QA 시드 흔적이 남아 있다.

- `seedFamily: general-primary-case`
- `description: 일반 프로그램 8 Primary Case 로컬 시드`
- `local.example`
- `Primary Case`, `로컬 데모` 문구
- 기존 QA roster `190xxx` 회원 중심 구성
- 강사 신청이 대기·승인·반려 각 1건뿐
- 참여 기관에 `grade: null`, `classCount: 0`, `studentCount: 0`
- `attendanceStatus: null`
- 빈 `assignmentInstructors`
- 합반 partner 한쪽 학년 누락

이는 전그래프 문서가 요청한 상태별 최소 2건, 전 필드, 기존 CMS 회원·학교 재사용 및 신청 이후 데이터 연결을 충족하지 않는다.

`168001`에 봉사자·설문 데이터가 없는 것은 프로그램 축이
`school_institution + teacher_instructor`이므로 정상이다. 문제는 실제로 노출되는 기관·강사 화면조차 전그래프 품질로 채워지지 않았다는 점이다.

---

## 2. 기존 CMS 학교·회원만 사용

### 2.1 “기존”의 기준

“기존 학교·회원”은 **이번 시드 실행 전에 remote DB와 CMS 목록에 이미 존재하던 데이터**를 의미한다.

시드 실행 과정에서 먼저 QA 회원·기관을 생성한 후 이를 “현재 DB 데이터”로 간주하면 안 된다.

시드 시작 전에 다음 데이터를 스냅샷으로 확정한다.

- `member` PK, 이름, 회원 역할 및 활성 상태
- `organization` PK, 기관명, 기관 유형
- 학교와 교사 회원 간 기존 소속 관계
- 강사·개인·봉사자 역할 및 프로필
- 프로그램 담당자로 사용할 기존 관리자

### 2.2 시드 중 생성·변경 금지

다음 데이터는 INSERT하지 않는다.

- 회원
- 교사·강사·개인·봉사자·학생 회원 프로필
- 학교 및 기타 기관
- 학교-교사 소속 관계
- QA member roster

다음 기존 데이터도 시드 편의를 위해 임의 변경하지 않는다.

- 회원 역할
- 교사의 소속 학교
- 학교의 기관 유형
- 회원 이름·연락처·이메일을 가상 QA 값으로 교체

추가 가능한 것은 프로그램 및 다음과 같은 프로그램 하위 데이터다.

- 모집
- 신청
- 심사·면접
- 참여자
- 일정
- 기관·강사·봉사 배정
- 학생 명단 연결
- 출석
- 과제
- 강의보고서
- 정산·지급조서
- 게시글·설문 응답

여러 프로그램에 동일한 기존 회원을 재사용하는 것은 허용한다. 단, 같은 프로그램에서 한 회원을 서로 다른 신청 상태로 중복 생성하지 않는다.

### 2.3 사용 금지 데이터

- 시드가 새로 생성한 `190xxx` 등 QA roster
- `general-primary-case` 전용 테스트 회원·기관
- `local.example` 이메일
- `Primary Case`, `로컬 데모` 전용 가상 회원·기관
- FE 문자열 ID

DB에 `190xxx` 회원이 이미 있더라도 이번 시드와 함께 생성된 QA roster라면 기존 회원으로 인정하지 않는다.

---

## 3. 학교 및 교사 소속 규칙

### 3.1 참여 기관

기관 신청 및 참여 기관은 다음 조건을 모두 만족해야 한다.

1. 시드 실행 전에 DB에 저장되어 있던 `organization`
2. CMS 기관 목록에서 조회되는 기관
3. 기관 유형이 실제 **학교**
4. 해당 학교에 소속된 기존 교사 회원이 존재

청소년센터, 임시 QA 기관, 시드 전용 가상 조직을 학교 참여 기관으로 사용하지 않는다.

### 3.2 담당 교사

담당 교사는 단순히 `member` 테이블에 존재하는 교사 역할 회원이면 충분하지 않다.

반드시 다음 조건을 모두 만족해야 한다.

1. 시드 실행 전에 DB에 존재한 교사 회원
2. 활성 상태의 교사 회원
3. 담당 기관과 연결된 **기존 학교 소속 관계가 DB에 저장되어 있음**
4. CMS에서 해당 학교의 소속 교사로 조회됨
5. 기관 신청의 `teacherMemberId`가 이 회원 PK와 일치

즉, 기관 신청의 `organizationId`가 A 학교라면 `teacherMemberId`도 DB상 A 학교에 소속된 교사여야 한다.

다른 학교 소속 교사를 가져오거나, 시드 실행 중 소속을 A 학교로 변경하거나, 소속 관계가 없는 교사를 이름만 넣는 방식은 금지한다.

### 3.3 FK 일치 검증

각 기관 신청·참여 건에서 다음 값의 연결을 검증한다.

```text
program.schoolId (프로그램이 특정 학교를 참조하는 경우)
organization_application.organizationId
participant.organizationId
participant.organizationApplicationId
teacherMemberId의 기존 학교 소속 organizationId
assignment.organizationApplicationId
```

해당 값은 화면 의도에 맞는 같은 학교·신청을 가리켜야 한다. 프로그램 `schoolId=162101`인데 참여 기관이 `organizationId=162103`인 식으로 임의 혼합하지 않는다.

### 3.4 사람 회원 → 학교/기관 → 프로그램 연결 (필수)

모든 시드 행은 아래 3개 축이 **실제 PK/FK로 연결**되어야 한다.

```text
회원(사람: memberId)
→ 회원의 기존 소속 학교/기관(organizationId)
→ 해당 학교/기관의 신청·참여(applicationId / participantId)
→ 대상 일반 프로그램(programId)
```

이름·학교명·소속명을 문자열로만 복사해 화면에 보이게 하는 것은 연결로 인정하지 않는다.

| 사람 유형 | 필수 연결 |
|-----------|-----------|
| 담당 교사 | `memberId` → 기존 학교 소속 관계 → `organizationId` → `organizationApplicationId` → `programId` |
| 기관 참여 학생 | `memberId` → 기존 학교/기관 → 학생 명단/기관 participant → `programId` |
| 개인 참여자 | `memberId` → DB에 저장된 기존 소속 학교/기관 `organizationId` → individual application/participant → `programId` |
| 강사 | `memberId` → DB에 저장된 기존 소속 학교/기관(소속이 있는 경우) → instructor application/participant → 기관 또는 출강지 assignment → `programId` |
| 봉사자 | `memberId` → DB에 저장된 기존 소속 학교/기관(소속이 있는 경우) → volunteer application/participant → 기관 또는 봉사 일정 assignment → `programId` |
| PM/파트너 | 기존 관리자 `memberId` → program admin assignment → `programId` |

개인·강사·봉사자의 소속이 화면에 표시되면 자유 문자열만 넣지 말고, DB의 기존 학교/기관 FK와 표시명이 일치해야 한다. 역할상 소속이 없는 회원은 임의 기관을 만들거나 연결하지 말고 `소속 없음`이라는 실제 상태를 사용하며, 해당 필드가 필수인 QA 케이스에는 소속이 이미 저장된 다른 기존 회원을 선택한다.

필수 일치 조건:

- 신청 행의 `memberId` = 참여 행의 `memberId`
- 신청/참여 행의 `programId` = 일정·배정·출석·과제·보고서·정산의 `programId`
- 사람의 소속 `organizationId` = 화면에 표시되는 소속 학교/기관 ID
- 기관 프로그램의 담당 교사 소속 `organizationId` = 기관 신청의 `organizationId`
- 강사·봉사자 배정의 `organizationId` / `organizationApplicationId` = 프로그램 참여 기관의 ID
- 문자열 이름은 FK 대상 레코드의 현재 이름을 조회하여 표시하며 별도 가상 이름을 저장하지 않음

아래와 같은 고아 데이터는 수용하지 않는다.

```text
memberId는 있으나 학교/기관 소속 FK가 없음
organizationName만 있고 organizationId가 없음
application에는 programId가 있으나 participant가 다른 programId
배정 기관명이 있으나 organizationApplicationId가 없음
담당 교사 이름은 있으나 teacherMemberId 또는 학교 소속 관계가 없음
```

### 3.5 기존 소속 교사가 부족한 경우

담당 교사 수를 채우기 위해 다음 작업을 하지 않는다.

- 신규 교사 회원 생성
- 다른 학교 교사의 소속 변경
- 소속 관계 신규 생성
- 같은 프로그램에서 한 교사를 상태별 신청자로 중복 사용

기존 소속 교사 범위까지만 시드하고 부족 현황을 결과에 보고한다.

```text
organizationId=<학교 PK>
학교명=<CMS 학교명>
필요 담당 교사=6명
시드 전 기존 소속 교사=3명
부족=3명
신규 회원·소속 관계 생성 안 함
```

---

## 4. 기존 Primary 최소 시드를 복사하지 말 것

다음 값이나 형태가 남아 있으면 재작업 미완료로 판단한다.

- `seedFamily: general-primary-case`
- `local.example`
- `로컬 데모`, `Primary Case` 전용 값
- 상태별 신청 1건
- `grade: null`
- `classCount: 0`
- `studentCount: 0`
- `attendanceStatus: null`
- `assignmentInstructors: []`
- `resolvedScheduleId`가 null인 배정 대상 일정
- 한 합반 행에만 `중1, 중2`를 넣고 partner 학년을 null로 두는 구조

기존 Primary 프로그램 ID를 유지하는 것은 가능하지만, 하위 데이터는 전그래프 문서의 필드·상태·연결 기준으로 보강해야 한다.

---

## 5. 상태별 최소 건수

기존 회원 풀이 허용하는 범위에서 노출 화면별 상태마다 최소 2건을 만든다.

| 화면 | 상태 |
|------|------|
| 기관·개인·강사 신청 | 대기 / 승인 / 반려 각 2건 |
| 개인·봉사 서류 심사 | 대기 / 합격 / 불합격 각 2건 |
| 담당자 평가 | 합격 / 보류 / 불합격 / 미검토 각 2건 |
| 면접 배정 | 대기 / 배정 완료 / 활동 포기 각 2건 |
| 2차 면접 | 대기 / 완료 / 합격 / 불합격 / 예비 1~4 각 2건 |
| 교재 배송 | 배송 전 / 배송 중 / 배송 완료 / 해당 없음 각 2건 |
| 강사 정산 | 8종 각 2건 |
| 강사 역할 | 대표 / 일반 각 2건 |
| 출석 | 화면별 출결 상태 각 2건 |
| 보고서 | 제출 완료 / 미제출 / 진행 예정 각 2건 |

기존 회원이 부족하면 신규 회원을 만들지 말고 다음 형식으로 보고한다.

```text
역할=강사
필요=16명
시드 전 사용 가능한 기존 회원=9명
부족=7명
신규 회원 생성 없이 기존 회원 범위까지만 시드
```

---

## 6. 프로그램 전체 연결 기준

프로그램 상세 하나만 채우면 완료가 아니다.

```text
기존 사람 회원(memberId)
→ 기존 학교/기관 및 소속 관계(organizationId)
→ 대상 프로그램(programId)
→ 신청(applicationId)
→ 승인 또는 최종 합격
→ 동일 memberId의 participant
→ program_schedule
→ 기관/출강지/봉사 배정
→ 출석·과제
→ 강의보고서
→ 정산·지급조서
→ 게시글·설문·수료 조건
```

필수 규칙:

- 회원(사람) → 학교/기관 → 프로그램 연결이 실제 PK/FK로 존재
- 승인 또는 최종 합격 건만 같은 `memberId`의 participant로 승격
- 배정 대상 일정에는 유효한 숫자 `resolvedScheduleId`
- 기관/출강지 배정은 같은 신청 PK 및 일정 PK 사용
- 출석·과제·보고서·정산은 같은 `scheduleId`
- 목록 DTO와 상세 DTO/form response에 화면 필드를 실제 반환
- form response 표시용 answer는 마스킹 `null`이 아니어야 함

---

## 7. 합반 재구성

합반은 다음 구조로 만든다.

- 동일한 기존 학교 `organizationId`
- 서로 다른 신청 학년
- 기관 신청 행 최소 2건
- 각 행에 실제 `grade`, `classCount`, `studentCount`
- merge group에 양쪽 기관 신청 PK 연결
- lead와 partner 상세 모두 교재명·합반 여부·파트너 학년 표시
- 합반 전 개별 회차와 합반 후 취합 회차 연결

다음 구조는 수용하지 않는다.

```text
lead.grade = "중1, 중2"
partner.grade = null
partner.classCount = 0
partner.studentCount = 0
```

---

## 8. 날짜

모집·운영·교육·면접·배정·출석 관련 날짜는 `2026-09-01 ~ 2026-11-30` 범위로 맞춘다.

현재처럼 모집 기간이 2026-06~08이거나 `joinedAt`이 8월이면 기준 미충족이다.

강의보고서 제출 기한은 강의일 익월 5일이므로 수용 검증이 필요한 건에는 10월 강의를 포함한다.

---

## 9. DB 저장만으로 완료 처리하지 말 것

CMS가 사용하는 API 응답에 실제 값이 내려와야 한다.

| 대상 | 필수 표시 데이터 |
|------|------------------|
| 기관 | 학교명, 학년, 지역, 학급 수, 학생 수, 교재, 세션, 담당 교사, 배정 강사 |
| 개인 | 이름, 소속, 학년, 주소, 세션, 면접 가능 일정, 면접 배정 |
| 강사 | 주소, JA 경력, 평가, 연락처, 이메일, 이력서, 일정 ID |
| 봉사자 | 1365 ID, 에세이 4개, 담당자 평가, 면접·점수 |
| form response | 표시용 `answerDisplayText` 또는 `answerValueJson` non-null |

CMS 화면에서 `-`, 0명/0학급, 빈 배열로 보이면 미완료다.

---

## 10. `168001` 즉시 재작업 항목

- 강사 신청 3건 → 대기·승인·반려 각 2건, 총 최소 6건
- 참여 기관 `grade: null` 제거
- `classCount: 0`, `studentCount: 0` 제거
- `attendanceStatus: null` 제거
- 빈 `assignmentInstructors`를 실제 배정으로 연결
- 합반을 같은 기존 학교의 서로 다른 학년 신청으로 재구성
- QA roster가 아닌 시드 전 기존 CMS 학교·교사·강사로 교체
- 담당 교사의 학교 소속 관계를 DB 기준으로 검증
- `general-primary-case`, `local.example`, 로컬 데모 전용 값 제거
- 학생 명단, 전 회차 출석, 강사 상세, 보고서, 정산까지 연결

---

## 11. 완료 보고 필수 항목

1. 시드 직전·직후 회원 수
2. 시드 직전·직후 기관 수
3. 시드 직전·직후 학교-교사 소속 관계 수
4. 사용한 기존 회원 ID, 이름, 역할
5. 사용한 학교 ID, 학교명, 기관 유형
6. 담당 교사 ID 및 DB에 저장된 소속 학교 ID
7. 사람별 소속 `organizationId`와 대상 `programId`
8. 프로그램별 생성 건수와 상태별 건수
9. member → organization → application → participant → schedule → assignment 연결 PK
10. 회원·기관·학교 소속 관계 신규 생성이 0건이라는 확인
11. 기존 인원 부족으로 미달한 상태 및 부족 인원
12. CMS API 응답과 화면에서 공란이 없다는 확인

결과 예시:

| programId | memberId·역할 | 소속 organizationId·기관명 | applicationId·participantId | assignmentId·scheduleId | 신규 회원/기관/소속 |
|-----------|---------------|--------------------------------|-----------------------------|-------------------------|---------------------|
| 168001 | | | | | 모두 0건 |

---

## 12. 최종 수용 기준

- [ ] 시드 실행 전 존재하던 CMS 학교·회원만 사용
- [ ] 신규 회원 0건
- [ ] 신규 기관 0건 (8종 프로그램 추가 생성은 허용)
- [ ] 학교-교사 소속 관계 신규 생성·변경 0건
- [ ] 담당 교사 전원이 DB상 해당 학교 소속
- [ ] 모든 사람 회원이 기존 학교/기관과 대상 프로그램에 실제 PK/FK로 연결
- [ ] 소속·기관명 문자열만 있고 FK가 없는 고아 행 0건
- [ ] 상태별 최소 2건 또는 인원 부족 보고
- [ ] 합반 양쪽 행 학년·학급·학생 수 존재
- [ ] 승인 → participant 동일 `memberId`
- [ ] 배정 대상 전 일정에 유효한 `resolvedScheduleId`
- [ ] 출석·과제·보고서·정산이 같은 `scheduleId`
- [ ] 목록·상세 API가 화면 필드를 반환
- [ ] 날짜 2026-09~11
- [ ] 의도된 ‘해당 없음’을 제외하고 CMS 화면에 `-`, 0명/0학급, 빈 배열 없음

본 문서와 `general-program-remote-db-full-graph-seed-backend-request-2026-09-16.md`를 기준으로 전체 재작업한다.
