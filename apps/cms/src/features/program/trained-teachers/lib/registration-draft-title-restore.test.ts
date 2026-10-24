import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  TRAINED_TEACHER_DRAFT_RHF_REQUIRED_ERROR,
  buildTrainedTeachersCanonicalFromRhf,
  trainedTeachersWizardDraftSettingsJson,
} from './build-registration-create-from-canonical'
import { applyLegacyProgramTitleKoFallback } from './import-legacy-registration-overlay'
import {
  registerTrainedTeachersRegistrationRhf,
  type TrainedTeachersRegistrationRhfApi,
} from './registration-rhf-api'
import {
  createDefaultTrainedTeachersRegistrationRhfValues,
  rhfValuesFromTrainedTeachersCanonicalCommon,
  type TrainedTeachersRegistrationRhfValues,
} from './registration-rhf-values'
import { hydrateRegistrationDraftProgramTitleKo } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'

afterEach(() => {
  registerTrainedTeachersRegistrationRhf(null)
})

const CASE_01 = {
  mainTitle: '임시저장-대표명-A',
  announcementTitle: '임시저장-공고명-B',
  titleEn: 'Draft-Title-C',
} as const

function withTitles(
  patch: Partial<TrainedTeachersRegistrationRhfValues> = {}
): TrainedTeachersRegistrationRhfValues {
  return {
    ...createDefaultTrainedTeachersRegistrationRhfValues(),
    title: CASE_01.announcementTitle,
    ...CASE_01,
    ...patch,
  }
}

function restoreFromValues(values: TrainedTeachersRegistrationRhfValues) {
  const snapshot = buildTrainedTeachersCanonicalFromRhf({ id: 'tt-draft', values })
  return rhfValuesFromTrainedTeachersCanonicalCommon(
    snapshot.common,
    snapshot.editor,
    snapshot.sidecar,
    snapshot.recruit,
    snapshot.application
  )
}

function mockTtRhf(values: TrainedTeachersRegistrationRhfValues): TrainedTeachersRegistrationRhfApi {
  let current = { ...values }
  return {
    getValues: () => current,
    getPath: path => (current as Record<string, unknown>)[path],
    setPath: (path, value) => {
      current = { ...current, [path]: value }
    },
    reset: next => {
      current = next
    },
    applyOverlayRecord: vi.fn(),
    isDirty: () => false,
    markBaseline: vi.fn(),
  }
}

describe('TT 임시저장 제목 복원', () => {
  it('CASE-01 저장·복원을 두 번 반복해도 제목 3종이 독립이다', () => {
    let values = withTitles()
    values = restoreFromValues(values)
    values = restoreFromValues(values)
    expect(values.mainTitle).toBe(CASE_01.mainTitle)
    expect(values.announcementTitle).toBe(CASE_01.announcementTitle)
    expect(values.titleEn).toBe(CASE_01.titleEn)
    expect(values.mainTitle).not.toBe(values.announcementTitle)
  })

  it('CASE-05 A 저장 후 B로 바꿔 저장하면 복원 결과는 B다', () => {
    const first = restoreFromValues(withTitles())
    const second = restoreFromValues(
      withTitles({
        mainTitle: '임시저장-대표명-B',
        announcementTitle: '임시저장-공고명-B2',
        titleEn: 'Draft-Title-B',
      })
    )
    expect(first.mainTitle).toBe(CASE_01.mainTitle)
    expect(second.mainTitle).toBe('임시저장-대표명-B')
    expect(second.announcementTitle).toBe('임시저장-공고명-B2')
    expect(second.titleEn).toBe('Draft-Title-B')
  })

  it('canonical reset 이후 세션 메타 hydrate가 와도 mainTitle이 불변이다', () => {
    const restored = restoreFromValues(withTitles())
    const rhf = mockTtRhf(restored)
    registerTrainedTeachersRegistrationRhf(rhf)
    hydrateRegistrationDraftProgramTitleKo('trainedTeachers', CASE_01.announcementTitle)
    expect(rhf.getValues().mainTitle).toBe(CASE_01.mainTitle)
    expect(rhf.getValues().announcementTitle).toBe(CASE_01.announcementTitle)
  })

  it('legacy 저장본은 programTitleKo를 mainTitle fallback으로만 쓴다', () => {
    const emptyMain = {
      ...restoreFromValues(withTitles({ mainTitle: '' })),
      mainTitle: '',
    }
    const withFallback = applyLegacyProgramTitleKoFallback(emptyMain, '레거시-대표명')
    expect(withFallback.mainTitle).toBe('레거시-대표명')
    const kept = applyLegacyProgramTitleKoFallback(
      restoreFromValues(withTitles()),
      '레거시-대표명'
    )
    expect(kept.mainTitle).toBe(CASE_01.mainTitle)
  })

  it('TT RHF가 없으면 draft settings가 throw하고 persist 인자를 평가하지 않는다', () => {
    registerTrainedTeachersRegistrationRhf(null)
    const persist = vi.fn()
    expect(() => persist(trainedTeachersWizardDraftSettingsJson())).toThrow(
      TRAINED_TEACHER_DRAFT_RHF_REQUIRED_ERROR
    )
    expect(persist).not.toHaveBeenCalled()
  })

  it('저장본 없이 재오픈하면 TT RHF가 기본값이다', () => {
    const leftover = mockTtRhf(withTitles())
    leftover.reset(createDefaultTrainedTeachersRegistrationRhfValues(), { keepDirty: false })
    expect(leftover.getValues().mainTitle).toBe('')
    expect(leftover.getValues().announcementTitle).toBe('')
    expect(leftover.getValues().titleEn).toBe('')
  })
})
