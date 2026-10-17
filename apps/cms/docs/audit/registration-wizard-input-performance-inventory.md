# 등록 위저드 입력 성능 — 필드 인벤토리

Overlay 훅 밀도 ≥3인 파일은 필드 컴포넌트 분리 대상.

## Program 단계 (registration-form)

| Variant | File | overlay Kv | 분리 |
|---------|------|------------|------|
| general | `general/paragraphs/basic-info-paragraph.tsx` | 12 | Y |
| general | `general/paragraphs/basic-info-paragraph-title-fields.tsx` | 3 | partial |
| general | `general/paragraphs/basic-info-paragraph-sponsor-fields.tsx` | 5 | Y |
| general | `general/paragraphs/type-settings-paragraph.tsx` | 6 | Y |
| general | `general/paragraphs/education-curriculum-paragraph.tsx` | 9 | Y |
| general | `general/paragraphs/education-schedule-curriculum-paragraph.tsx` | 9 | Y |
| general | `general/paragraphs/education-schedule-settings-paragraph.tsx` | 6 | Y |
| general | `general/paragraphs/wage-info-paragraph.tsx` | 5 | Y |
| economy | `1c-1s/paragraphs/basic-info-paragraph.tsx` | 16 | Y |
| economy | `1c-1s/paragraphs/education-curriculum-paragraph.tsx` | 3 | borderline |
| economy | `1c-1s/paragraphs/wage-info-paragraph.tsx` | 3 | borderline |
| trainedTeachers | `trained-teachers/paragraphs/*` | 2–5 | reuses general basic-info |
| UJAT | `UJAT/paragraphs/ujat-basic-info-paragraph.tsx` | 21 | Y |

## 모집 (recruit-form)

| File | overlay Kv |
|------|------------|
| `institution/paragraphs/applicant-recruit-participant-info-paragraph.tsx` | 21 |

## 신청 (application-form)

| File | overlay Kv |
|------|------------|
| `institution/paragraphs/institution-basic-info-paragraph.tsx` | 7 |
| `1c-1s/paragraphs/basic-info-paragraph.tsx` | 13 |
| `trained-teachers/paragraphs/basic-info-paragraph.tsx` | 13 |
| `UJAT-institution/paragraphs/ujat-program-application-basic-info-paragraph.tsx` | 7 |

## 인프라 (구독)

- `use-program-registration-editor.ts` — 전역 overlay subscribe → 제거
- `use-registration-flow.ts` — overlay version 전역 subscribe → participant 단계만
- `registration-institution-bridge-sync.ts` — bridge 관련 overlay 키만 subscribe

## 연동 검증 (카탈로그·overlay 키)

| Variant | basicInfo prefix | sponsor | detailedProgram | 담당자 multi `onOpenChange` |
|---------|------------------|---------|-----------------|------------------------------|
| general | `generalRegistration.basicInfo` | `localSponsorIds` | `detailedProgramId` | `basic-info-paragraph-sponsor-fields` |
| economy | `economyRegistration.basicInfo` | `sponsorId` | `detailedProgramId` | `1c-1s/basic-info-paragraph` |
| trainedTeachers | `trainedTeachersRegistration.basicInfo` | `sponsorIds` | `detailedProgramId` | general sponsor-fields (`trainedTeachersDefaults`) |
| UJAT | `ujat.basicInfo` | `sponsorId` | `detailedProgramId` | `ujat-basic-info-paragraph` |

- overlay에 id가 있으면 `useRegistrationCatalogReady({ overlayBasicInfoPrefix })`가 **마운트 시** 카탈로그 API를 켠다 (`registration-catalog-prefetch.ts`).
- CI optional: `node scripts/registration-wizard-field-audit.mjs` → `docs/audit/registration-wizard-field-audit.json`

## 수동 QA 매트릭스 (등록 위저드)

각 셀: 입력 지연 없음 · 셀렉트 목록 · 임시저장 후 재개 · 다음 단계 미리보기.

| Variant | program | recruit 기관 | application 기관 |
|---------|---------|--------------|------------------|
| general | 제목, 후원사 multi, 담당자 multi, 세부프로그램, 사업기간, 임금 지급항목 | 모집 기간·교육대상·한도 | 희망교육형태·학급수(bridge) |
| economy | 1c-1s basic + wage | economy layout | 1c-1s application |
| trainedTeachers | TT basic + 일정 | TT recruit | TT application |
| UJAT | ujat basic + sponsor | UJAT recruit | UJAT institution application |

자동 게이트 (릴리스 전):

```bash
cd apps/cms
pnpm exec vitest run \
  src/shared/ui/cms-select.test.ts \
  src/features/program/general/lib/registration-payload-smoke.test.ts \
  src/features/program/general/lib/registration-institution-bridge-sync.test.ts \
  src/features/template/ui/form-set/registration-form/shared/use-registration-catalog-ready.test.ts \
  src/features/template/ui/form-set/registration-form/shared/registration-catalog-prefetch.test.ts
pnpm audit:registration-wizard-fields   # optional → docs/audit/registration-wizard-field-audit.json
```

수동 QA 매트릭스는 [`general-program-operation-period-and-student-roster-fe-verification.md`](../api/general-program-operation-period-and-student-roster-fe-verification.md) § 등록 위저드와 동일.
