---
priority: high
category: process
---

# 일반 프로그램 유형 분류 (등록 폼 → 8종)

**Scope:** CMS 일반 프로그램 등록 양식, `/programs/general` 목록·상세, mock

## 원칙

프로그램 **등록 시 선택 내용**에 따라 일반 프로그램 **종류(유형)** 가 결정된다.  
API 연동 전 mock·상세 LNB 분기는 `Program.generalProgramAudience`, `generalProgramEducationStructure`, `generalProgramSessionRound` 및 `generalParticipantTypes` 등으로 표현한다.

## 1. 대분류 — 참여자 유형 (`기본 정보`)

| 등록 폼 선택 | 유형 라벨 | 도메인 키 |
|-------------|----------|-----------|
| 참여자 유형 **[기관]** 체크 | 일반 프로그램 **(기관)** | `generalProgramAudience: 'organization'` |
| 참여자 유형 **[개인]** 체크 | 일반 프로그램 **(개인)** | `generalProgramAudience: 'individual'` |

- 개인·기관은 **상호 배타** (등록 폼에서 동시 선택 불가).
- `generalParticipantTypes`에는 `school_institution`(기관) 또는 `individual`(개인)이 포함된다.

## 2. 중분류 — 교육 진행 구조 (`프로그램 유형 설정`)

| 등록 폼 선택 | 유형 라벨 | 도메인 키 |
|-------------|----------|-----------|
| **[커리큘럼형]** | 커리큘럼형 | `generalProgramEducationStructure: 'curriculum'` |
| **[일정형]** | 일정형 | `generalProgramEducationStructure: 'schedule'` |

- 등록 폼 state: `ProgramRegistrationType` (`curriculum` \| `schedule`).

## 3. 소분류 — 수업 회차 유형 (`프로그램 유형 설정`)

| 등록 폼 선택 | 유형 라벨 | 도메인 키 |
|-------------|----------|-----------|
| **[단일 회차]** | 단일 회차 | `generalProgramSessionRound: 'single'` |
| **[복수 회차]** | 복수 회차 | `generalProgramSessionRound: 'multi'` |

- 등록 폼 state: `ProgramRegistrationSessionRoundType` (`single` \| `multi`).
- 복수 회차 mock/API는 `Program.rounds` 길이 > 1 로 표현할 수 있다.

## 8종 프로그램 유형 (표시명)

조합 표기: `일반 프로그램 ({대분류})_{중분류}_{소분류}`

1. 일반 프로그램 (기관)_커리큘럼형_단일 회차
2. 일반 프로그램 (기관)_커리큘럼형_복수 회차
3. 일반 프로그램 (개인)_커리큘럼형_단일 회차
4. 일반 프로그램 (개인)_커리큘럼형_복수 회차
5. 일반 프로그램 (기관)_일정형_단일 회차
6. 일반 프로그램 (기관)_일정형_복수 회차
7. 일반 프로그램 (개인)_일정형_단일 회차
8. 일반 프로그램 (개인)_일정형_복수 회차

## 구현 참고

- 라벨·8종 조합 상수: `features/program/general/lib/general-program-variant.ts`
- Mock 8종: `data/mock/general-programs.ts` — id 접두 `general-prog-type-`
- 기관_커리큘럼형_단일 회차 공통 정보 스크린샷 mock: `general-program-detail-common-info-display.ts` (`GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_*`)
- 유형 확인용 mock 프로그램명은 위 표기명을 **title** 로 사용한다 (헤더·목록). 공고용명은 `generalCommonInfo.announcementTitle`.

## Related

- [mock-data.md](../data/mock-data.md)
- [program-detail-fullpage-modal-tabs-spec.md](./program-detail-fullpage-modal-tabs-spec.md)

**Last updated:** 2026-05-29
