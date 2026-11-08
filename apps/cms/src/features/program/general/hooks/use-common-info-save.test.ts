/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { GeneralProgramCommonInfoEditFormValues } from '@/features/program/general/model/common-info-edit-schema'
import { programToGeneralCommonInfoEditValues } from '@/features/program/general/model/common-info-edit-schema'
import * as overlayToProgram from '@/features/program/general/lib/registration-overlay-to-program'
import { isTrainedTeachersDetailProgram } from '@/features/program/trained-teachers/lib/is-trained-teachers-detail-program'
import {
  TRAINED_TEACHERS_DEDICATED_DETAIL_SAVE_KIND,
  useGeneralProgramCommonInfoSave,
} from './use-common-info-save'

vi.mock('@/features/program/general/hooks/use-general-program-sponsor-edit-context', () => ({
  useGeneralProgramSponsorEditContext: () => ({ sponsors: [], contactsBySponsorId: {} }),
}))
vi.mock('@/features/detailed-program/hooks/use-detailed-program-options-query', () => ({
  useDetailedProgramOptionsQuery: () => ({ data: [] }),
}))
vi.mock('@/features/sponsor/hooks/use-sponsor-options-query', () => ({
  useSponsorOptionsQuery: () => ({ data: [] }),
}))
vi.mock('@/features/program/shared/lib/program-wage-payment-item-helpers', async importOriginal => {
  const actual =
    await importOriginal<
      typeof import('@/features/program/shared/lib/program-wage-payment-item-helpers')
    >()
  return {
    ...actual,
    useProgramWagePaymentItemOptions: () => [],
  }
})
vi.mock('@/shared/ui', () => ({
  showUpdateCompletedAlert: vi.fn(),
}))
vi.mock('@/features/program/trained-teachers/lib/is-trained-teachers-detail-program', () => ({
  isTrainedTeachersDetailProgram: vi.fn(() => false),
}))
vi.mock('@/features/program/general/lib/registration-required-fields', () => ({
  listIncompleteGeneralProgramRegistrationRequiredFields: () => [],
  hasCurriculumMultiDateScheduleCountMismatch: () => false,
}))
vi.mock('@/features/program/general/lib/registration-overlay-sync', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/features/program/general/lib/registration-overlay-sync')>()
  return {
    ...actual,
    writeGeneralRegistrationOverlayFromCommonInfoFormValues: vi.fn(),
    readGeneralRegistrationOverlayForSave: () => ({}),
    getGeneralRegistrationDetailEditExtras: () => ({
      programType: 'curriculum',
      sessionRoundType: 'multi',
    }),
    generalRegistrationRequiredFieldContextFromDetailEdit: () => ({}),
  }
})

function baseProgram(): Program {
  const now = '2026-01-01T00:00:00.000Z'
  return {
    id: '186234',
    sponsorId: 'sponsor-1',
    title: '기존 대표명',
    mainTitle: '기존 대표명',
    titleEn: 'Existing Title',
    detailedProgramId: 'dp-1',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '',
    startDate: '2026-04-01T00:00:00.000Z',
    endDate: '2026-12-31T00:00:00.000Z',
    status: 'pending',
    businessArea: '경제금융',
    educationProcess: 'Traditional (Paper)',
    ipOwned: 'JA',
    courseDeliveredBy: 'JA',
    generalProgramAudience: 'organization',
    generalProgramEducationStructure: 'curriculum',
    generalProgramSessionRound: 'multi',
    generalParticipantTypes: ['school_institution'],
    generalCommonInfo: {
      announcementTitle: '기존 공고',
      detailedProgramName: '캠프 A',
      venueKind: 'inside',
      sponsorManagerContactIds: ['contact-1'],
      educationScheduleLines: ['26년 4월 1일(수) 10:00 ~ 12:00'],
      educationFormLabel: '오프라인',
      ipsTypeSummary: '일정 공통 | Prepare | 해당없음',
      sponsorManagementIds: ['sponsor-1'],
      curriculumSessions: [
        { sessionNo: 1, sessionLabel: '1회차', title: '단원1', description: '본문1' },
      ],
      wageGradeRows: [
        { grade: '1급 강사비', pricing: '1시간 당 | 기본 : 140,000원' },
        { grade: '2급 강사비', pricing: '1시간 당 | 기본 : 120,000원' },
        { grade: '3급 강사비', pricing: '1시간 당 | 기본 : 100,000원' },
      ],
      paymentItems: '교통비',
      kpi: { finalParticipants: 10, instructorCount: 1, volunteerCount: 0, finalSchools: 1, finalClasses: 1 },
    },
    rounds: [],
    createdAt: now,
    updatedAt: now,
  }
}

function completeValues(
  program: Program,
  patch: Partial<GeneralProgramCommonInfoEditFormValues> = {}
): GeneralProgramCommonInfoEditFormValues {
  const values = programToGeneralCommonInfoEditValues(program)
  return {
    ...values,
    titleEn: values.titleEn || 'EN',
    detailedProgramId: values.detailedProgramId || 'dp-1',
    sponsorManagementIds:
      values.sponsorManagementIds.length > 0 ? values.sponsorManagementIds : ['sponsor-1'],
    sponsorManagerContactIds:
      values.sponsorManagerContactIds.length > 0 ? values.sponsorManagerContactIds : ['contact-1'],
    wageGrade1Amount: values.wageGrade1Amount || '140000',
    wageGrade2Amount: values.wageGrade2Amount || '120000',
    wageGrade3Amount: values.wageGrade3Amount || '100000',
    wagePaymentItemIds: values.wagePaymentItemIds.length > 0 ? values.wagePaymentItemIds : ['p-1'],
    educationForm: values.educationForm || 'offline',
    ipsCategory: values.ipsCategory || 'prepare',
    ipsDetail: values.ipsDetail || 'none',
    educationScheduleLines:
      values.educationScheduleLines.some(line => line.trim()) ?
        values.educationScheduleLines
      : ['26년 4월 1일(수) 10:00 ~ 12:00'],
    ...patch,
  }
}

describe('useGeneralProgramCommonInfoSave', () => {
  beforeEach(() => {
    vi.mocked(isTrainedTeachersDetailProgram).mockReturnValue(false)
  })

  it('form.getValues 와 nested-ssot 로 persist 하고 overlay apply 를 쓰지 않는다', async () => {
    const applySpy = vi.spyOn(overlayToProgram, 'applyGeneralRegistrationOverlayToProgram')
    const program = baseProgram()
    const values = completeValues(program, { announcementTitle: 'RHF 공고' })
    const getValues = vi.fn(() => values)
    const form = {
      watch: vi.fn(() => []),
      getValues,
      reset: vi.fn(),
      formState: { dirtyFields: { announcementTitle: true } },
    } as unknown as UseFormReturn<GeneralProgramCommonInfoEditFormValues>
    const onSaveEdit = vi.fn().mockResolvedValue(undefined)

    const { result } = renderHook(() =>
      useGeneralProgramCommonInfoSave({ form, program, onSaveEdit })
    )

    let saveResult: Awaited<ReturnType<typeof result.current.triggerSave>> | undefined
    await act(async () => {
      saveResult = await result.current.triggerSave()
    })

    expect(saveResult).toEqual({ ok: true })
    expect(getValues).toHaveBeenCalled()
    expect(applySpy).not.toHaveBeenCalled()
    expect(onSaveEdit).toHaveBeenCalledTimes(1)
    const [, patch, baseline, serializeOptions] = onSaveEdit.mock.calls[0]
    expect(baseline).toBe(program)
    expect(patch.registrationOverlay).toBeUndefined()
    expect(serializeOptions).toEqual({ overlayMerge: 'nested-ssot' })
  })

  it('RHF dirtyFields 에 없는 자동 기본값은 PATCH 에 싣지 않는다', async () => {
    const program = baseProgram()
    const values = completeValues(program, { announcementTitle: '제목만 수정' })
    const form = {
      watch: vi.fn(() => []),
      getValues: vi.fn(() => values),
      reset: vi.fn(),
      formState: { dirtyFields: { announcementTitle: true } },
    } as unknown as UseFormReturn<GeneralProgramCommonInfoEditFormValues>
    const onSaveEdit = vi.fn().mockResolvedValue(undefined)

    const { result } = renderHook(() =>
      useGeneralProgramCommonInfoSave({ form, program, onSaveEdit })
    )

    await act(async () => {
      await result.current.triggerSave()
    })

    const [, patch] = onSaveEdit.mock.calls[0]
    expect(patch.generalCommonInfo).toHaveProperty('announcementTitle', '제목만 수정')
    expect(patch.generalCommonInfo).not.toHaveProperty('educationFormLabel')
    expect(patch.generalCommonInfo).not.toHaveProperty('educationFormScheduleDetail')
    expect(patch.generalCommonInfo).not.toHaveProperty('participationScheduleDetail')
    expect(patch.generalCommonInfo).not.toHaveProperty('ipsScheduleDetail')
    expect(patch.generalCommonInfo).not.toHaveProperty('educationScheduleMode')
    expect(patch.generalCommonInfo).not.toHaveProperty('ipsTypeSummary')
    expect(patch.generalCommonInfo).not.toHaveProperty('participationMethod')
    expect(patch.generalCommonInfo).not.toHaveProperty('scheduleCurriculumPreEducation')
  })

  it('저장 실패 시 입력을 리셋하지 않는다', async () => {
    const program = baseProgram()
    const values = completeValues(program)
    const reset = vi.fn()
    const form = {
      watch: vi.fn(() => []),
      getValues: vi.fn(() => values),
      reset,
      formState: { dirtyFields: {} },
    } as unknown as UseFormReturn<GeneralProgramCommonInfoEditFormValues>
    const onSaveEdit = vi.fn().mockRejectedValue({
      response: {
        status: 409,
        data: { error: { code: 'PROGRAM_EDUCATION_STRUCTURE_CHANGE_BLOCKED' } },
      },
    })

    const { result } = renderHook(() =>
      useGeneralProgramCommonInfoSave({ form, program, onSaveEdit })
    )
    let saveResult: Awaited<ReturnType<typeof result.current.triggerSave>> | undefined
    await act(async () => {
      saveResult = await result.current.triggerSave()
    })
    expect(saveResult?.ok).toBe(false)
    if (saveResult && !saveResult.ok) expect(saveResult.kind).toBe('api')
    expect(reset).not.toHaveBeenCalled()
  })

  it('교육받은 교사는 일반 overlay-first 저장을 하지 않는다', async () => {
    vi.mocked(isTrainedTeachersDetailProgram).mockReturnValue(true)
    const applySpy = vi.spyOn(overlayToProgram, 'applyGeneralRegistrationOverlayToProgram')
    const program = baseProgram()
    const values = completeValues(program)
    const form = {
      watch: vi.fn(() => []),
      getValues: vi.fn(() => values),
      reset: vi.fn(),
      formState: { dirtyFields: {} },
    } as unknown as UseFormReturn<GeneralProgramCommonInfoEditFormValues>
    const onSaveEdit = vi.fn().mockResolvedValue(undefined)

    const { result } = renderHook(() =>
      useGeneralProgramCommonInfoSave({ form, program, onSaveEdit })
    )
    let saveResult: Awaited<ReturnType<typeof result.current.triggerSave>> | undefined
    await act(async () => {
      saveResult = await result.current.triggerSave()
    })
    expect(saveResult).toEqual({
      ok: false,
      kind: TRAINED_TEACHERS_DEDICATED_DETAIL_SAVE_KIND,
    })
    expect(applySpy).not.toHaveBeenCalled()
    expect(onSaveEdit).not.toHaveBeenCalled()
  })

  it('유령 2차시 placeholder 는 Independent 저장을 막지 않는다', async () => {
    const program = baseProgram()
    const values = completeValues(program, {
      sessionRound: 'single',
      educationStructure: 'curriculum',
      scheduleCurriculumPreEducation: true,
      curriculumSessions: [
        {
          sessionLabel: '사전 교육',
          title: '사전 교육ㅋㅋㅋ',
          description: '',
          scheduleDate: '26년 4월 2일(목) 18:43 ~ 19:43',
          assignmentEnabled: false,
          assignmentPeriod: '',
          educationForm: 'offline',
          ipsCategory: 'prepare',
          ipsDetail: 'none',
        },
        {
          sessionLabel: '1차시',
          title: '필요와 욕구, 현명한 소비12121212',
          description: 'ㅇㅇㅇㄴㅇㄴㅇㄴㅇㄴㅇㄴㅇ',
          assignmentEnabled: false,
          assignmentPeriod: '',
          educationForm: 'offline',
          ipsCategory: 'prepare',
          ipsDetail: 'none',
        },
        {
          sessionLabel: '2차시',
          title: '2차시',
          description: '',
          assignmentEnabled: false,
          assignmentPeriod: '',
          educationForm: 'offline',
          ipsCategory: 'prepare',
          ipsDetail: 'none',
        },
      ],
    })
    const form = {
      watch: vi.fn(() => []),
      getValues: vi.fn(() => values),
      reset: vi.fn(),
      trigger: vi.fn(),
      setFocus: vi.fn(),
      formState: { dirtyFields: { curriculumSessions: true } },
    } as unknown as UseFormReturn<GeneralProgramCommonInfoEditFormValues>
    const onSaveEdit = vi.fn().mockResolvedValue(undefined)

    const { result } = renderHook(() =>
      useGeneralProgramCommonInfoSave({ form, program, onSaveEdit })
    )
    let saveResult: Awaited<ReturnType<typeof result.current.triggerSave>> | undefined
    await act(async () => {
      saveResult = await result.current.triggerSave()
    })
    expect(saveResult).toEqual({ ok: true })
    expect(onSaveEdit).toHaveBeenCalledTimes(1)
    const [, patch] = onSaveEdit.mock.calls[0]
    expect(
      patch.generalCommonInfo?.curriculumSessions?.map(
        (row: { sessionLabel?: string }) => row.sessionLabel
      )
    ).toEqual([
      '사전 교육',
      '1차시',
    ])
  })

  it('기관 커리큘럼 복수 회차 2회차 내용 공란은 PATCH를 보내지 않는다', async () => {
    const program = baseProgram()
    const values = completeValues(program, {
      sessionRound: 'multi',
      participantOrganization: true,
      participantIndividual: false,
      scheduleCurriculumPreEducation: true,
      educationScheduleMode: 'date',
      educationScheduleLines: [
        '26년 11월 5일(목) 00:42 ~ 07:42',
        '26년 11월 16일(월) 02:43 ~ 01:43',
      ],
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      curriculumSessions: [
        {
          sessionLabel: '사전 교육',
          title: '사전교육',
          description: '',
          scheduleDate: '26년 11월 5일(목) 00:42 ~ 07:42',
          assignmentEnabled: false,
          assignmentPeriod: '',
          educationForm: 'online',
          ipsCategory: 'prepare',
          ipsDetail: 'none',
        },
        {
          sessionLabel: '1회차',
          title: '1',
          description: 'aaaaaa',
          assignmentEnabled: false,
          assignmentPeriod: '',
          educationForm: 'online',
          participationMethod: 'individual',
          ipsCategory: 'succeed',
          ipsDetail: 'competition',
        },
        {
          sessionLabel: '2회차',
          title: '1',
          description: '',
          assignmentEnabled: false,
          assignmentPeriod: '',
          educationForm: 'online',
          participationMethod: 'individual',
          ipsCategory: 'inspire',
          ipsDetail: 'podcast',
        },
      ],
    })
    const form = {
      watch: vi.fn(() => []),
      getValues: vi.fn(() => values),
      reset: vi.fn(),
      trigger: vi.fn().mockResolvedValue(false),
      setFocus: vi.fn(),
      formState: { dirtyFields: { curriculumSessions: true } },
    } as unknown as UseFormReturn<GeneralProgramCommonInfoEditFormValues>
    const onSaveEdit = vi.fn()

    const { result } = renderHook(() =>
      useGeneralProgramCommonInfoSave({ form, program, onSaveEdit })
    )
    let saveResult: Awaited<ReturnType<typeof result.current.triggerSave>> | undefined
    await act(async () => {
      saveResult = await result.current.triggerSave()
    })
    expect(saveResult?.ok).toBe(false)
    if (saveResult && !saveResult.ok && saveResult.kind === 'validation') {
      expect(saveResult.message).toBe('2회차 내용을 입력해주세요')
      expect(saveResult.keys).toContain('curriculum.unitContent[2]')
      expect(saveResult.alertKind).toBe('required-incomplete')
    }
    expect(form.setFocus).toHaveBeenCalled()
    expect(onSaveEdit).not.toHaveBeenCalled()
  })

  it('보이는 1차시 내용이 비면 해당 필드 메시지를 반환한다', async () => {
    const program = baseProgram()
    const values = completeValues(program, {
      sessionRound: 'single',
      curriculumSessions: [
        {
          sessionLabel: '1차시',
          title: '필요와 욕구',
          description: '',
          assignmentEnabled: false,
          assignmentPeriod: '',
          educationForm: 'offline',
          ipsCategory: 'prepare',
          ipsDetail: 'none',
        },
      ],
    })
    const form = {
      watch: vi.fn(() => []),
      getValues: vi.fn(() => values),
      reset: vi.fn(),
      trigger: vi.fn().mockResolvedValue(false),
      setFocus: vi.fn(),
      formState: { dirtyFields: { curriculumSessions: true } },
    } as unknown as UseFormReturn<GeneralProgramCommonInfoEditFormValues>
    const onSaveEdit = vi.fn()

    const { result } = renderHook(() =>
      useGeneralProgramCommonInfoSave({ form, program, onSaveEdit })
    )
    let saveResult: Awaited<ReturnType<typeof result.current.triggerSave>> | undefined
    await act(async () => {
      saveResult = await result.current.triggerSave()
    })
    expect(saveResult?.ok).toBe(false)
    if (saveResult && !saveResult.ok && saveResult.kind === 'validation') {
      expect(saveResult.message).toBe('1차시 내용을 입력해주세요')
      expect(saveResult.keys).toContain('curriculum.unitContent[1]')
    }
    expect(onSaveEdit).not.toHaveBeenCalled()
  })

  it('사업 운영기간 밖 교육 일정은 기간 오류 메시지를 반환한다', async () => {
    const program = baseProgram()
    const values = completeValues(program, {
      startDate: '2026-10-31',
      endDate: '2026-11-01',
      educationScheduleLines: ['26년 10월 24일(토) 10:00 ~ 12:00'],
    })
    const form = {
      watch: vi.fn(() => []),
      getValues: vi.fn(() => values),
      reset: vi.fn(),
      trigger: vi.fn().mockResolvedValue(false),
      setFocus: vi.fn(),
      formState: { dirtyFields: { educationScheduleLines: true } },
    } as unknown as UseFormReturn<GeneralProgramCommonInfoEditFormValues>
    const onSaveEdit = vi.fn()

    const { result } = renderHook(() =>
      useGeneralProgramCommonInfoSave({ form, program, onSaveEdit })
    )
    let saveResult: Awaited<ReturnType<typeof result.current.triggerSave>> | undefined
    await act(async () => {
      saveResult = await result.current.triggerSave()
    })
    expect(saveResult?.ok).toBe(false)
    if (saveResult && !saveResult.ok && saveResult.kind === 'validation') {
      expect(saveResult.message).toBe('사업 운영기간 안에 교육 진행 일정을 입력해주세요')
      expect(saveResult.title).toBe('교육 진행 일정 설정 안내')
      expect(saveResult.alertKind).toBe('operation-range')
      expect(saveResult.keys).toContain('educationScheduleSettings.singleDateIso')
    }
    expect(onSaveEdit).not.toHaveBeenCalled()
  })

  it('VAL-08 입력 보완 후 재저장은 PATCH로 이어진다', async () => {
    const program = baseProgram()
    const incomplete = completeValues(program, { mainTitle: '' })
    const complete = completeValues(program, { mainTitle: '보완된 대표명' })
    const getValues = vi
      .fn()
      .mockReturnValueOnce(incomplete)
      .mockReturnValue(complete)
    const form = {
      watch: vi.fn(() => []),
      getValues,
      reset: vi.fn(),
      trigger: vi.fn().mockResolvedValue(true),
      setFocus: vi.fn(),
      formState: { dirtyFields: { mainTitle: true } },
    } as unknown as UseFormReturn<GeneralProgramCommonInfoEditFormValues>
    const onSaveEdit = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useGeneralProgramCommonInfoSave({ form, program, onSaveEdit })
    )
    await act(async () => {
      const first = await result.current.triggerSave()
      expect(first.ok).toBe(false)
    })
    expect(onSaveEdit).not.toHaveBeenCalled()
    await act(async () => {
      const second = await result.current.triggerSave()
      expect(second).toEqual({ ok: true })
    })
    expect(onSaveEdit).toHaveBeenCalledTimes(1)
  })

  it('VAL-10 회차 수·예정일 불일치는 PATCH 없이 전용 종류를 반환한다', async () => {
    const program = baseProgram()
    const values = completeValues(program, {
      sessionRound: 'multi',
      educationScheduleMode: 'date',
      educationScheduleLines: [
        '26년 4월 1일(수) 10:00 ~ 12:00',
        '26년 4월 2일(목) 10:00 ~ 12:00',
      ],
      curriculumSessions: [
        {
          sessionLabel: '1회차',
          title: '1',
          description: '본문',
          assignmentEnabled: false,
          assignmentPeriod: '',
          educationForm: 'offline',
          ipsCategory: 'prepare',
          ipsDetail: 'none',
        },
      ],
    })
    const form = {
      watch: vi.fn(() => []),
      getValues: vi.fn(() => values),
      reset: vi.fn(),
      trigger: vi.fn().mockResolvedValue(true),
      setFocus: vi.fn(),
      formState: { dirtyFields: { educationScheduleLines: true } },
    } as unknown as UseFormReturn<GeneralProgramCommonInfoEditFormValues>
    const onSaveEdit = vi.fn()
    const { result } = renderHook(() =>
      useGeneralProgramCommonInfoSave({ form, program, onSaveEdit })
    )
    let saveResult: Awaited<ReturnType<typeof result.current.triggerSave>> | undefined
    await act(async () => {
      saveResult = await result.current.triggerSave()
    })
    expect(saveResult).toEqual({ ok: false, kind: 'schedule-count-mismatch' })
    expect(onSaveEdit).not.toHaveBeenCalled()
  })

  it('VAL-13 저장 중 재클릭은 중복 PATCH를 만들지 않는다', async () => {
    const program = baseProgram()
    const values = completeValues(program)
    const form = {
      watch: vi.fn(() => []),
      getValues: vi.fn(() => values),
      reset: vi.fn(),
      formState: { dirtyFields: { announcementTitle: true } },
    } as unknown as UseFormReturn<GeneralProgramCommonInfoEditFormValues>
    let resolveSave: (() => void) | undefined
    const onSaveEdit = vi.fn(
      () =>
        new Promise<void>(resolve => {
          resolveSave = resolve
        })
    )
    const { result } = renderHook(() =>
      useGeneralProgramCommonInfoSave({ form, program, onSaveEdit })
    )
    let first: Promise<unknown> | undefined
    await act(async () => {
      first = result.current.triggerSave()
    })
    let second: Awaited<ReturnType<typeof result.current.triggerSave>> | undefined
    await act(async () => {
      second = await result.current.triggerSave()
    })
    expect(second?.ok).toBe(false)
    expect(onSaveEdit).toHaveBeenCalledTimes(1)
    await act(async () => {
      resolveSave?.()
      await first
    })
  })

  it('SP-FE-10 저장 실패 시 폼 reset을 호출하지 않는다', async () => {
    const program = baseProgram()
    const values = completeValues(program)
    const reset = vi.fn()
    const form = {
      watch: vi.fn(() => []),
      getValues: vi.fn(() => values),
      reset,
      formState: { dirtyFields: { sponsorManagementIds: true } },
    } as unknown as UseFormReturn<GeneralProgramCommonInfoEditFormValues>
    const onSaveEdit = vi.fn().mockRejectedValue(new Error('network'))
    const { result } = renderHook(() =>
      useGeneralProgramCommonInfoSave({ form, program, onSaveEdit })
    )
    let saveResult: Awaited<ReturnType<typeof result.current.triggerSave>> | undefined
    await act(async () => {
      saveResult = await result.current.triggerSave()
    })
    expect(saveResult).toEqual({ ok: false, kind: 'api', error: expect.any(Error) })
    expect(reset).not.toHaveBeenCalled()
    expect(form.getValues()).toBe(values)
  })

  it('SP-FE-11 VERSION_CONFLICT 는 자동 재전송하지 않고 입력을 유지한다', async () => {
    const program = baseProgram()
    const values = completeValues(program)
    const reset = vi.fn()
    const form = {
      watch: vi.fn(() => []),
      getValues: vi.fn(() => values),
      reset,
      formState: { dirtyFields: { sponsorManagementIds: true } },
    } as unknown as UseFormReturn<GeneralProgramCommonInfoEditFormValues>
    const conflict = {
      response: {
        status: 409,
        data: { success: false, error: { code: 'VERSION_CONFLICT', message: 'VERSION_CONFLICT' } },
      },
    }
    const onSaveEdit = vi.fn().mockRejectedValue(conflict)
    const { result } = renderHook(() =>
      useGeneralProgramCommonInfoSave({ form, program, onSaveEdit })
    )
    let saveResult: Awaited<ReturnType<typeof result.current.triggerSave>> | undefined
    await act(async () => {
      saveResult = await result.current.triggerSave()
    })
    expect(saveResult).toEqual({ ok: false, kind: 'api', error: conflict })
    expect(onSaveEdit).toHaveBeenCalledTimes(1)
    expect(reset).not.toHaveBeenCalled()
  })
})
