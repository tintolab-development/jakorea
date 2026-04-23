---
priority: medium
always_include: false
category: process
---

# 후원사 상세 > 프로그램 진행 이력 — 참여자 유형

- **참여자 유형**은 UI·도메인 모두 **두 가지만** 사용한다.
  - `school` → 표시 라벨 **「학교/기관」**
  - `individual` → 표시 라벨 **「개인 학습자」**
- **「봉사자」** 같은 세 번째 구분은 이 화면·`SponsorProgramHistoryRow` 범위에서 두지 않는다. (다른 화면의 프로그램 참여자 구분과 혼동하지 말 것.)
- 타입은 `SponsorProgramParticipantType` (`'school' | 'individual'`)에 맞추고, 목/API 데이터도 이 두 값만 쓴다.
