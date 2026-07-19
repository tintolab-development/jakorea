---
priority: high
category: ui-spec
---

# UJAT 프로그램 목록 페이지

**Scope:** `apps/cms/src/pages/programs/UJAT/page.tsx`, `features/program/ujat/lib/**`, UJAT 목록 mock

**관련:** [ujat-program-characteristics-spec.md](./ujat-program-characteristics-spec.md) · [ujat-program-new-registration-programs-url.md](./ujat-program-new-registration-programs-url.md)

---

## 필터 (정렬)

| 항목 | 스펙 |
|------|------|
| 진행년도 | **등록된 프로그램이 있는 진행년도만** 셀렉트 옵션 노출 |
| 기본값 | `전체` |
| 목록 정렬 | 진행년도·시작일 기준 **최신 우선** (내림차순) |

- 현재 연도에 프로그램이 없어도 옵션에 **강제 추가하지 않음**.
- 조회 버튼 클릭 시 필터 적용 (`FilterTableLayout` 패턴).

---

## 테이블 컬럼

| 컬럼 | 스펙 |
|------|------|
| No. | 목록 순번 (최신 행이 큰 번호) |
| 진행년도 | 프로그램 운영 연도 (`startDate` 기준 `YYYY년`) |
| 프로그램명 | 등록 시 작성한 **「프로그램 관리명」** (`Program.title` — UJAT 등록 overlay `ujat.basicInfo.programManagementName`) |
| 프로그램 진행 현황 | 아래 5종 중 1 (`ujatProgressStatus`) |
| 최종 파견 학교 수 | 최종 파견 확정 학교 수 (`participatingSchoolCount`) |
| 상반기 봉사자 모집 인원 | `현재 / 정원` — 1학기 회차(`rounds[0]`) |
| 하반기 봉사자 모집 인원 | `현재 / 정원` — 2학기 회차(`rounds[1]`) |

### 프로그램 진행 현황 (5종)

| 상태 키 | UI 라벨 |
|---------|---------|
| `EDUCATION_SCHEDULED` | 프로그램 진행 예정 |
| `PARTICIPANT_RECRUITING` | 참여자 모집 중 |
| `VOLUNTEER_RECRUITING` | 봉사자 모집 중 |
| `EDUCATION_IN_PROGRESS` | 프로그램 진행 중 |
| `PROGRAM_ENDED` | 프로그램 진행 완료 |

- 모집 신청 현황(`lifecycleStatus`)과 **별도** 필드.
- 라벨·색상: `features/program/ujat/lib/ujat-program-list-progress.ts`

### 봉사자 모집 인원

- 상·하반기 **각각 다른 값** 노출 (동일 helper 재사용 금지).
- mock: `ujatFirstHalfVolunteerCount`, `ujatSecondHalfVolunteerCount` + `rounds[0|1].capacity`.

---

## 프로그램 신규 등록 버튼

| 동작 | 스펙 |
|------|------|
| 클릭 | `/programs/ujat?new=1` — UJAT 등록 폼 풀페이지 (`UjatProgramRegistrationFullpageModal`) |
| 임시 저장 건 있음 | **임시저장 이력 안내** 모달 — 라디오(이어서 작성 / 신규 등록). 확인 버튼 라벨: 이어서 작성 선택 시 「이어서 작성」, 신규 등록 선택 시 「프로그램 등록」 |
| 임시 저장 판별 | `peekRegistrationDraftNotice('registration-ujat')` — writing-form draft (`cms.jakorea.writingFormTemplateSaves.v1`) + legacy UJAT template save |
| 신규 등록 선택 | 로컬 draft 삭제 후 `?new=1&registrationDraft=fresh` (시드로 시작) |
| 이어서 작성 선택 | `?new=1` (기존 draft 복원) |

- 템플릿 관리(`/templates/form-management`)로 **이동하지 않음**.
- 안내 모달: `RegistrationDraftNoticeModal` (공유) — draft 제목 박스 + 라디오 + [취소] / 동적 확인 버튼.

---

## 행 클릭

- 프로그램 상세 풀페이지 모달 (`programId` 쿼리).

---

## 체크리스트 (구현·회귀)

- [ ] 진행년도 옵션 = 실제 목록에 있는 연도만
- [ ] 프로그램명 = 프로그램 관리명 (`title`)
- [ ] 진행 현황 5종 라벨
- [ ] 상·하반기 봉사자 인원 분리
- [ ] 신규 등록 + 임시저장 이력 안내
- [ ] 일반 프로그램 목록·mock 회귀 없음 (`program-type-isolation`)

**Last updated:** 2026-06-18
