# 프로그램 다중 역할(기관/강사/봉사자 동시 모집) — 신청 건별 역할 구분 BE 확인 요청 (2026-09-19)

**작성일:** 2026-09-19
**문서 성격:** 구현 요청이 아니라 **정보 확인 요청**. 아래 질문에 대한 답변을 받은 뒤, 별도로 구현 계획(Platform 마이페이지 교육/봉사/강의 현황 재구조화)을 확정한다.
**배경 작업:** Platform 마이페이지 "강의 현황" 신설 + 교육/봉사/강의 현황 역할 기반 재구조화 (계획 파일: `교육봉사강의현황_역할_재구조화_d5251491.plan.md`)

---

## 1. 배경

Platform 마이페이지에 "강의 현황"(내가 강사로 신청한 프로그램) 메뉴를 신설하면서, 기존 교육/봉사 현황 필터링 로직을 검토한 결과 아래 구조적 한계를 발견했다.

- Platform 프런트 모델은 **프로그램 하나당 역할(`detailCase`)을 하나만** 계산한다 (`resolveProgramDetailCase`, [detail-case.ts](../../../../platform/src/features/program/lib/detail-case.ts)).
- 그런데 CMS 등록 위저드는 프로그램 하나에 **참여자 유형을 여러 개 동시에** 체크할 수 있다 (`generalParticipantTypes: ['school_institution' | 'individual' | 'teacher_instructor' | 'volunteer']` 복수 선택 가능).
- 즉 실제로는 **기관 참여자 A, 강사 B, 봉사자 C가 같은 프로그램에 서로 다른 역할로 동시에 신청**할 수 있는데, Platform 프런트는 이 경우를 프로그램당 role 값 하나로만 표현하지 못한다.
- 현재 mock에서는 `lifecycleStatus`(예: `recruiting_instructors`)를 역할 판정용으로 고정하고 신청 건의 `displayStatus`만 별도 override하는 우회 패턴을 쓰고 있는데, 이는 "역할별로 이미 모집 종료·진행 단계까지 넘어간" 실제 시나리오는 표현하지 못한다.

이번 강의 현황 신설 작업 범위에서는 이 갭을 **문서화하고 보류**하기로 했다. 다만 실제로 BE 계약이 어떻게 되어 있는지 모르면 향후 이 갭을 제대로 해소할 설계를 잡을 수 없어, 아래 항목을 확인 요청한다.

---

## 2. 핵심 질문

### Q1. 신청(Application) 엔티티에 "이 신청이 어떤 역할로 제출됐는지"를 나타내는 필드가 있는가?

- 프로그램 레벨이 아니라 **신청 건(신청서/지원서) 레벨**에서 `participantType` / `applicantRole` 같은 필드가 존재하는지.
- 존재한다면 값의 종류(예: `school_institution` / `individual` / `teacher_instructor` / `volunteer`)와, 회원이 신청할 때 이 값이 어떻게 결정되는지(신청 폼 종류로 자동 결정 / 회원이 직접 선택 등).

### Q2. 프로그램이 기관+강사+봉사자를 동시에 모집 중일 때, 역할별 정보(모집 기간·모집 안내문·대상·연락처 등)가 독립적으로 존재하는가?

- 예: 강사 모집은 9/1~9/15, 봉사자 모집은 9/1~9/30처럼 **역할별로 모집 기간이 다를 수 있는지**.
- 역할별 모집 안내문·대상 조건·연락처가 프로그램 공통 1세트인지, 역할별로 나뉘어 있는지.
- 참고: 관련 CMS 문서 [programs-non-general-registration-form-bindings-backend-request-2026-09-18.md](./programs-non-general-registration-form-bindings-backend-request-2026-09-18.md)의 A1 표를 보면 역할별로 `RECRUITMENT`/`APPLICATION` formType이 이미 나뉘어 있음 — 이 구조가 "역할별 독립 모집 기간/상태"까지 포함하는지 확인 필요.

### Q3. 회원(Platform) 관점의 "내 신청 목록 / 내 신청 상세" API가 이미 존재하는가? 있다면 각 항목에 role 필드가 내려오는가?

- 현재 Platform 마이페이지 교육/봉사 현황은 **전부 mock**이며 실제 API 연동이 안 되어 있는 것으로 파악됨 (`apps/platform/src/features/mypage/education/applications/lib/mock-applications.ts`). 실제 API가 이미 존재하는지, 존재한다면 스펙(OpenAPI) 경로를 알려달라.
- 있다면 응답 항목에 프로그램 정보와 별개로 **"이 회원이 어떤 역할로 신청했는지" 필드**가 포함되는지.

### Q4. CMS 회원 상세의 "참여 이력" role 파티셔닝을 Platform 마이페이지에도 그대로 재사용 가능한가?

- [instructor-member-detail-program-history-settlement-backend-handoff-2026-08-25.md](members/instructor-member-detail-program-history-settlement-backend-handoff-2026-08-25.md) 문서에 따르면 CMS 회원 상세는 이미 "수강 이력(Student Enrollment) / 강사 강의(Instructor Lecture) / 봉사 프로그램(Volunteer Program)" 탭으로 role을 나누고 있다.
- 이 파티셔닝이 CMS 관리자가 **타 회원을 조회**할 때만 쓰는 내부 모델인지, 아니면 회원 본인 기준으로도 동일하게 조회 가능한 API/모델인지.
- 가능하다면 Platform 마이페이지 교육/봉사/강의 현황도 이 모델을 그대로 소비하고 싶다.

### Q5. 기관+강사+봉사자가 동시에 모집 중이면서, 이미 진행중/종료 단계까지 넘어간 프로그램이 실제 운영에서 존재하는가?

- 빈도 확인 목적. 흔한 시나리오라면 이 갭 해소 우선순위를 올려야 하고, 드문 케이스라면 현재 보류 판단을 유지한다.

---

## 3. 참고 — 관련 Platform 코드

- 역할 판정 로직: [detail-case.ts](../../../../platform/src/features/program/lib/detail-case.ts) — `resolveProgramDetailCase`
- 현재 필터링(교육/봉사 분리): [application-kind.ts](../../../../platform/src/features/mypage/education/applications/lib/application-kind.ts)
- 신청 건 타입 정의(이미 `detailCase` 필드가 신청 건 레벨에 있음): [types.ts](../../../../platform/src/features/mypage/education/applications/model/types.ts)
- mock 우회 패턴 예시: [mock-applications.ts](../../../../platform/src/features/mypage/education/applications/lib/mock-applications.ts) — `VOLUNTEER_DISPLAY_STATUS_BY_PROGRAM_ID`
- mock 프로그램 데이터 모델(역할별 정보 블록이 아직 분리 안 됨): [cms-registration-fixtures.ts](../../../../platform/src/features/program/lib/cms-registration-fixtures.ts)

## 4. 요청 형식

- Q1~Q5 각각에 대해 현재 BE 모델 기준으로 짧게 답변 (엔티티/필드명 스니펫 또는 OpenAPI 경로 언급 가능하면 포함).
- 현재 스펙이 없다면 "없음"으로 명시 — 향후 설계 시 신규 항목으로 반영.
