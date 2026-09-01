---
priority: high
category: domain
---

# UJAT 프로그램 — 도메인 특성 (목록·상세 공통)

**Scope:** `apps/cms/src/features/program/ujat/**`, UJAT mock·템플릿·라우트, 프로그램 목록·상세 UI

UJAT 목록·상세·진행 관리 화면을 수정할 때 **아래 도메인 전제를 우선**한다. 일반 프로그램·1사1교·Gemini 스펙과 혼동하지 않는다.

---

## 1. 역할 구조

| 일반 프로그램 | UJAT |
|---------------|------|
| 강사 + 봉사자(별도) | **봉사자가 강사 역할**을 겸함 |
| 기관·개인 참여자 등 | **대학생 봉사단** → **초등학교** 교육 봉사 |

- UI·용어: UJAT 상세·진행 관리에서는 **「봉사자」**가 교육을 진행하는 주체이다. 일반 프로그램의 「강사」 전용 화면·컬럼·정산 플로우를 그대로 가져오지 않는다.
- 코드: `features/program/ujat/` 전용 컴포넌트·mock·필터를 우선 사용. `shared/` 수정 시 `program-type-isolation` 규칙 준수.

---

## 2. 교육 지역 (8개)

지역별로 **학교**와 **봉사자**를 선발한다.

| # | 지역 라벨 (기본) |
|---|------------------|
| 1 | 서울 |
| 2 | 경기(남부) |
| 3 | 인천 |
| 4 | 대전 |
| 5 | 대구 |
| 6 | 부산 |
| 7 | 광주 |
| 8 | 전북(전주) |

- **관리**: 지역 목록·라벨은 **교육 지역 관리** 메뉴에서 수정 가능하다(마스터 데이터 — API 연동 예정).
- **코드 참고**: `ujat-region-capacity-readonly.tsx` 의 `UJAT_REGION_CAPACITY_SEMESTERS` 기본 8지역 순서·라벨.
- 목록·상세 필터·테이블의 「교육 지역」 열·옵션은 위 8지역 체계를 따른다. 하드코딩 시 상수·mock 한곳에서 관리하고, 추후 교육 지역 관리 API와 동기화할 것.

---

## 3. 교육 일정

- **요일**: **금요일만** 진행.
- **교시**: **1~4교시** (4교시 모두 교육 진행 가능해야 함).
- 등록 폼·캘린더·임시 배정·일정 확인 UI는 금요일 외 날짜를 disabled 처리한다.

→ 상세 구현: [ujat-registration-education-schedule.mdc](../../../../.cursor/rules/ujat-registration-education-schedule.mdc), [ujat-institution-schedule-assign-spec.md](./ujat-institution-schedule-assign-spec.md)

---

## 4. 모집 주기

| 대상 | 모집 주기 | 비고 |
|------|-----------|------|
| **학교**(초등학교) | **1년 1회** (연 단위 일괄 모집) | 모집 정보 탭: `recruit_participant` |
| **봉사단**(봉사자) | **연 2회** — **상반기·하반기** 분리 모집 | `recruit_volunteer_h1` / `recruit_volunteer_h2` |

- 학교 모집은 상·하반기 회차와 무관하게 **프로그램(연도) 단위 1회**로 이해한다.
- 봉사자 모집은 **동일 폼 양식 1개**이나 프로그램 상세에서는 상·하반기 탭으로 분리 노출한다. 하반기만 「모집 공고 노출 시점」 블록 노출.

→ 상세: [ujat-program-detail-recruitment-tabs.md](./ujat-program-detail-recruitment-tabs.md)

---

## 5. 목록·상세 작업 시 체크

- [ ] 봉사자 = 강사 역할인지 (일반 「강사」 UI·용어 혼입 없음)
- [ ] 교육 지역 8개·라벨 형식 (`경기(남부)`, `전북(전주)` 등)
- [ ] 금요일 + 1~4교시 제약 (날짜 선택·일정 열·안내 문구)
- [ ] 학교 1회 / 봉사자 상·하반기 2회 모집 구조
- [ ] `features/program/ujat/` 에만 변경 — 타 유형 회귀 없음

---

## 관련 규칙

- [ujat-education-region-management-spec.md](./ujat-education-region-management-spec.md)
- [ujat-program-list-page-spec.md](./ujat-program-list-page-spec.md)
- [program-type-isolation.mdc](./program-type-isolation.mdc)
- [ujat-program-detail-recruitment-tabs.md](./ujat-program-detail-recruitment-tabs.md)
- [ujat-institution-application-list-table-spec.md](./ujat-institution-application-list-table-spec.md)
- [ujat-institution-schedule-assign-spec.md](./ujat-institution-schedule-assign-spec.md)
- [ujat-registration-education-schedule.mdc](../../../../.cursor/rules/ujat-registration-education-schedule.mdc)

**Last updated:** 2026-06-18
