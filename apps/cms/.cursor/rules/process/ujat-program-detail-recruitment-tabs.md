---
priority: medium
category: routing
---

# UJAT 프로그램 상세 — 모집 정보 3탭

**Scope:** `apps/cms/src/features/program/ui/detail-modal/**`, `apps/cms/src/features/template/ui/form-set/recruit-form/UJAT-*`

---

## 탭 ↔ 템플릿

| 프로그램 상세 탭 (`tab`) | 템플릿 id | 템플릿명 |
|--------------------------|-----------|----------|
| `recruit_participant` | `recruitment-ujat-school` | UJAT 프로그램 학교 모집 폼 |
| `recruit_volunteer_h1` | `recruitment-ujat-volunteer` | UJAT 프로그램 봉사자 모집 폼 |
| `recruit_volunteer_h2` | `recruitment-ujat-volunteer` | 동일 (하반기만 **모집 공고 노출 시점** 블록 노출) |

- 레거시 `tab=recruitment` → `recruit_participant` 로 정규화.
- LNB 「모집 정보」 클릭 시 `tab=recruit_participant`.

## 동기화 원칙

- 상세 본문은 `getUjatRecruitInstitutionDraft()` / `getUjatRecruitVolunteerDraft()` 의 **단락 순서·ID** 를 따르고, `renderUjatRecruitForm*ParagraphBody` 로 동일 React 단락 컴포넌트를 렌더한다.
- 템플릿 단락 UI를 바꿀 때는 **반드시** `UJAT-institution` / `UJAT-volunteer` paragraph + `ujat-program-recruitment-panels.tsx` 를 함께 검토한다.
- draft API 영속화 전까지 시드는 `createUjatRecruitForm*Draft()` — 연동 시 `ujat-recruit-template-draft.ts` 만 교체.

## 상·하반기 봉사자

- `volunteerHalf: 'h1' | 'h2'` — 봉사자 모집 기간 등은 `program.rounds[0]` / `rounds[1]` 우선.
- 봉사자 모집 **단락 title**(프로그램 상세): 탭과 동일 — `상반기 봉사자 모집 정보` / `하반기 봉사자 모집 정보` (`UJAT_RECRUIT_TAB_LABELS`, `volunteerRecruitInfoSectionTitle`). draft `paragraphTitle`(「봉사자 모집 정보」)은 템플릿 편집용.
- **상반기(`h1`)**: 「봉사자 모집 공고 노출 시점」 블록 미노출.
- **하반기(`h2`)**: 「모집 공고 노출 시점」 블록 노출 (`showNoticeExposure`).

### 하반기 — 모집 공고 노출 시점 (기획)

- UJAT 봉사자 모집 **폼 양식은 1개**(`recruitment-ujat-volunteer`)이나, 프로그램 상세에서는 상·하반기 탭으로 나뉘어 노출한다.
- **하반기**에서만 「모집 공고 노출 시점」 항목을 보여 준다. 관리자가 설정한 시점에 맞춰 **모집 공고가 등록**된다(백엔드·스케줄 처리 — API 연동 예정).

| 설정값 (`value`) | UI 라벨 | 의미 |
|------------------|---------|------|
| `start-day` | 모집 시작일 | 하반기 봉사자 모집 시작일에 공고 등록 |
| `one-day-before` | 모집 하루 전 | 모집 시작 **1일 전**에 공고 등록 |
| `one-week-before` | 모집 일주일 전 | 모집 시작 **1주일 전**에 공고 등록 |

- **템플릿 편집기**: `UJAT-volunteer` → `ujat-recruit-volunteer-info-paragraph.tsx` — 라디오로 위 3종 선택(현재 로컬 state; draft/API 영속화 전).
- **프로그램 상세 조회**: `ujat-recruit-paragraph-views/volunteer-info-program.tsx` — 「모집 공고 노출 시점」 필드에 **설정값에 대응하는 라벨**을 노출해야 함.
- **공통 상수·라벨**: `features/template/lib/ujat-volunteer-notice-exposure.ts` — `UJAT_VOLUNTEER_NOTICE_EXPOSURE_OPTIONS`, `getUjatVolunteerNoticeExposureReadLabel()`.
- **TODO(api)**: 프로그램·하반기 회차 API에서 노출 시점 설정값을 내려주면 `getUjatVolunteerNoticeExposureReadLabel(program, …)` 등으로 연동. 연동 전 placeholder는 `start-day` 라벨(모집 시작일)이 아닌 **실제 저장값**을 쓰도록 교체할 것.

## 프로그램 상세 — title / description

- 폼 양식 관리의 `paragraphDescription`은 프로그램 상세에 **노출하지 않음**.
- `paragraphTitle`만 프로그램 상세에 노출(봉사자 모집 정보는 위 예외로 탭 title 사용).

## 편집

- URL `edit=recruit_participant` | `recruit_volunteer_h1` | `recruit_volunteer_h2`
- 참여자: `programDetailInstitutionsEditSchema` + `institutionsForm`
- 봉사자(상·하반기 공통): `volunteersForm`
- 수정 가능 조건: `canUjatProgramInfoEdit(program)` (공통 정보와 동일)

## 관련

- [template-management.md](../coding/template-management.md)
- [ujat-program-new-registration-programs-url.md](./ujat-program-new-registration-programs-url.md)

**Last updated:** 2026-05-19
