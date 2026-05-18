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
- **상반기(`h1`)**: 「봉사자 모집 공고 노출 시점」 단락 미노출.
- **하반기(`h2`)**: 해당 블록 노출.

## 편집

- URL `edit=recruit_participant` | `recruit_volunteer_h1` | `recruit_volunteer_h2`
- 참여자: `programDetailInstitutionsEditSchema` + `institutionsForm`
- 봉사자(상·하반기 공통): `volunteersForm`
- 수정 가능 조건: `canUjatProgramInfoEdit(program)` (공통 정보와 동일)

## 관련

- [template-management.md](../coding/template-management.md)
- [ujat-program-new-registration-programs-url.md](./ujat-program-new-registration-programs-url.md)

**Last updated:** 2026-05-18
