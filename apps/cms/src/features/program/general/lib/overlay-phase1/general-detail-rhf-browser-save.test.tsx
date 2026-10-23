/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Program } from '@/types/domain'
import type { ProgramUpdateRequestBody } from '@/features/program/general/api/adapters/general-program-adapters'
import { mapGeneralProgramToUpdateRequest } from '@/features/program/general/api/adapters/general-program-adapters'
import { useGeneralProgramCommonInfoSave } from '@/features/program/general/hooks/use-common-info-save'
import {
  programToGeneralCommonInfoEditValues,
  type GeneralProgramCommonInfoEditFormValues,
} from '@/features/program/general/model/common-info-edit-schema'
import { parseWageGradeAmount } from '@/features/program/general/lib/wage-display'
import { GeneralProgramDetailCommonInfoView } from '@/features/program/general/ui/detail-modal/info/common-info-view'
import { GENERAL_DETAIL_RHF_BROWSER_SAVE_STATUS } from './general-detail-rhf-save-path'

vi.mock('@/features/sponsor/hooks/use-sponsor-options-query', () => ({
  useSponsorOptionsQuery: () => ({ data: [] }),
  useSponsorSelectOptions: () => ({ options: [], data: [] }),
}))
vi.mock('@/features/detailed-program/hooks/use-detailed-program-options-query', () => ({
  useDetailedProgramOptionsQuery: () => ({ data: [] }),
  useDetailedProgramSelectOptions: () => ({ options: [] }),
}))
vi.mock('@/features/program/general/hooks/use-general-program-sponsor-edit-context', () => ({
  useGeneralProgramSponsorEditContext: () => ({ sponsors: [], contactsBySponsorId: {} }),
}))
vi.mock('@/features/program/shared/lib/program-wage-payment-item-helpers', async importOriginal => {
  const actual =
    await importOriginal<
      typeof import('@/features/program/shared/lib/program-wage-payment-item-helpers')
    >()
  const options = [
    { value: 'p-1', label: '교통비' },
    { value: 'p-2', label: '식사비' },
  ]
  return {
    ...actual,
    useProgramWagePaymentItemOptionsState: () => ({
      options,
      ready: true,
      sections: [],
    }),
    useProgramWagePaymentItemOptions: () => options,
  }
})
vi.mock('@/shared/ui', async importOriginal => {
  const actual = await importOriginal<typeof import('@/shared/ui')>()
  return {
    ...actual,
    showUpdateCompletedAlert: vi.fn(),
  }
})
vi.mock('@/features/program/general/lib/registration-required-fields', () => ({
  listIncompleteGeneralProgramRegistrationRequiredFields: () => [],
  hasCurriculumMultiDateScheduleCountMismatch: () => false,
}))

const GET_WAGE_ROWS = [
  { grade: '1급 강사비', pricing: '1시간 당 | 기본 : 140,000원' },
  { grade: '2급 강사비', pricing: '1시간 당 | 기본 : 120,000원' },
  { grade: '3급 강사비', pricing: '1시간 당 | 기본 : 100,000원' },
] as const

function getProgram186307(): Program {
  const now = '2026-10-21T00:00:00.000Z'
  return {
    id: '186307',
    sponsorId: '163302',
    title: '개인프로그램기본정보수정',
    mainTitle: '개인프로그램기본정보수정',
    titleEn: 'Digital Literacy Classroom',
    detailedProgramId: 'dp-1',
    educationProcess: 'Traditional (Paper)',
    ipOwned: 'JA',
    courseDeliveredBy: 'JA',
    ips: 'Prepare',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '',
    startDate: '2026-04-01T00:00:00.000Z',
    endDate: '2026-12-31T00:00:00.000Z',
    status: 'pending',
    lifecycleStatus: 'recruiting_students',
    businessArea: '경제금융',
    partnerInvolvement: false,
    generalProgramAudience: 'individual',
    generalProgramEducationStructure: 'curriculum',
    generalProgramSessionRound: 'single',
    generalParticipantTypes: ['individual'],
    generalCommonInfo: {
      announcementTitle: '기존 공고',
      detailedProgramName: '기존 세부프로그램',
      venueKind: 'inside',
      venueDetail: '서울시 강남구',
      sponsorManagementIds: ['163302'],
      sponsorManagerContactIds: ['contact-1'],
      educationScheduleLines: ['26년 4월 1일(수) 10:00 ~ 12:00'],
      educationFormLabel: '오프라인',
      participationMethod: 'individual',
      curriculumSessions: [
        { sessionNo: 1, sessionLabel: '1회차', title: '단원1', description: '본문1' },
        { sessionNo: 2, sessionLabel: '2회차', title: '단원2', description: '본문2' },
      ],
      scheduleDetails: [],
      wageGradeRows: [...GET_WAGE_ROWS],
      paymentItems: '교통비, 식사비',
      deductionItems: '일용근로자 원천징수세액',
      kpi: {
        finalParticipants: 80,
        instructorCount: 2,
        volunteerCount: 1,
        finalSchools: 0,
        finalClasses: 0,
      },
      participantRecruitmentInfo: { remarks: '모집 비고 유지' },
    },
    registrationOverlay: {
      'generalRegistration.basicInfo.detailedProgramName': '기존 세부프로그램',
      'generalRegistration.basicInfo.educationVenueDetail': '서울시 강남구',
      'generalRegistration.basicInfo.localManagerContactId': 'contact-1',
      'generalRegistration.basicInfo.localManagerContactIds': ['contact-1'],
      'generalRegistration.educationScheduleSettings.scheduleLines': [
        '26년 4월 1일(수) 10:00 ~ 12:00',
      ],
      'generalRegistration.kpi.participantCount': 80,
      'generalRegistration.typeSettings.educationForm': 'offline',
      'generalRegistration.typeSettings.singleEducationForm': 'offline',
      'generalRegistration.typeSettings.multiCommonEducationForm': 'offline',
    },
    rounds: [],
    createdAt: now,
    updatedAt: now,
  }
}

function wageAmountsFromRows(
  rows: Array<{ grade?: string; pricing?: string }> | undefined
): number[] {
  return (rows ?? [])
    .map(row => parseWageGradeAmount(row.pricing))
    .filter((n): n is number => n != null)
}

function parseJson(json: string | undefined): {
  generalCommonInfo?: Record<string, unknown>
  registrationOverlay?: Record<string, unknown>
  registration?: { overlay?: Record<string, unknown> }
} {
  if (!json) return {}
  return JSON.parse(json) as ReturnType<typeof parseJson>
}

function Harness({
  program,
  onSaveEdit,
  formRef,
}: {
  program: Program
  onSaveEdit: (
    draft: Program,
    patch: Partial<Program>,
    baseline: Program,
    serializeOptions?: { overlayMerge?: 'legacy-merge' | 'nested-ssot' }
  ) => Promise<void>
  formRef: { current: ReturnType<typeof useForm<GeneralProgramCommonInfoEditFormValues>> | null }
}) {
  const form = useForm<GeneralProgramCommonInfoEditFormValues>({
    defaultValues: programToGeneralCommonInfoEditValues(program),
  })
  formRef.current = form
  const { triggerSave } = useGeneralProgramCommonInfoSave({ form, program, onSaveEdit })
  return (
    <>
      <GeneralProgramDetailCommonInfoView
        program={program}
        isEditMode
        form={form}
        canWrite
        onSave={() => {
          void triggerSave()
        }}
      />
      <button type="button" onClick={() => void triggerSave()}>
        mock-save
      </button>
    </>
  )
}

function changeInput(placeholder: string, value: string) {
  const input = screen.getByPlaceholderText(placeholder)
  fireEvent.change(input, { target: { value } })
}

function changeLabeledSelect(
  form: ReturnType<typeof useForm<GeneralProgramCommonInfoEditFormValues>>,
  label: string,
  name: 'educationProcess' | 'ipOwned',
  value: string
) {
  const field = screen.getByText(label, { selector: '.detail-info-form__field-label-text' }).closest(
    '.detail-info-form__field'
  )
  if (!field) throw new Error(`field not found: ${label}`)
  const widget = (field as HTMLElement).querySelector('.ant-select')
  if (!widget) throw new Error(`select not mounted: ${label}`)
  // antd Select 드롭다운은 body 포털이라 jsdom에서 option click이 불안정하다.
  // 필드에 RHF Controller가 붙은 뒤에 shouldDirty setValue로 동일 경로를 탄다.
  form.setValue(name, value, { shouldDirty: true, shouldTouch: true })
}

describe('GENERAL_DETAIL_RHF 브라우저 입력 Mock 저장', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }),
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('판정 상수는 FIXED 이다', () => {
    expect(GENERAL_DETAIL_RHF_BROWSER_SAVE_STATUS).toBe('GENERAL_DETAIL_RHF_BROWSER_SAVE_FIXED')
  })

  it('화면 입력이 RHF getValues 와 최종 PATCH 에 남고 overlay 미변경 값을 보존한다', async () => {
    const program = getProgram186307()
    const formRef: {
      current: ReturnType<typeof useForm<GeneralProgramCommonInfoEditFormValues>> | null
    } = { current: null }
    const onSaveEdit = vi.fn().mockResolvedValue(undefined)
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <Harness program={program} onSaveEdit={onSaveEdit} formRef={formRef} />
      </QueryClientProvider>
    )

    expect(screen.getByPlaceholderText('대표 프로그램명을 입력하세요')).toBeTruthy()
    expect(screen.queryByText('프로그램 등록')).toBeNull()

    await act(async () => {
      changeInput('대표 프로그램명을 입력하세요', '프로그램 수정 테스트123')
      changeInput('대표 프로그램명(영문)을 입력하세요', 'Digital Literacy Classroom789')
      changeInput('모집 시 노출될 프로그램명을 입력하세요', '프로그램 수정 테스트456')
      fireEvent.change(screen.getAllByPlaceholderText('목표값 입력')[0]!, { target: { value: '510' } })
      const wageInputs = screen.getAllByPlaceholderText('직접 입력')
      fireEvent.change(wageInputs[0]!, { target: { value: '123' } })
      fireEvent.change(wageInputs[1]!, { target: { value: '456' } })
      fireEvent.change(wageInputs[2]!, { target: { value: '789' } })
      const contentInputs = screen.getAllByPlaceholderText('교육 내용을 작성하세요')
      fireEvent.change(contentInputs[0]!, { target: { value: '수정 본문' } })
    })

    await act(async () => {
      const form = formRef.current
      if (!form) throw new Error('form not ready')
      changeLabeledSelect(form, '교육 과정', 'educationProcess', 'digital_computer')
      changeLabeledSelect(form, 'IP Owned', 'ipOwned', 'partner')
    })

    const values = formRef.current?.getValues()
    expect(values?.mainTitle).toBe('프로그램 수정 테스트123')
    expect(values?.titleEn).toBe('Digital Literacy Classroom789')
    expect(values?.announcementTitle).toBe('프로그램 수정 테스트456')
    expect(values?.kpiFinalParticipants).toBe(510)
    expect(values?.wageGrade1Amount).toBe('123')
    expect(values?.wageGrade2Amount).toBe('456')
    expect(values?.wageGrade3Amount).toBe('789')
    expect(values?.educationProcess).toBe('digital_computer')
    expect(values?.ipOwned).toBe('partner')
    expect(values?.curriculumSessions[0]?.description).toBe('수정 본문')
    expect(Object.keys(formRef.current?.formState.dirtyFields ?? {})).toEqual(
      expect.arrayContaining([
        'mainTitle',
        'titleEn',
        'announcementTitle',
        'kpiFinalParticipants',
        'wageGrade1Amount',
        'wageGrade2Amount',
        'wageGrade3Amount',
        'educationProcess',
        'ipOwned',
        'curriculumSessions',
      ])
    )

    await act(async () => {
      fireEvent.click(screen.getByText('mock-save'))
    })

    await waitFor(() => expect(onSaveEdit).toHaveBeenCalledTimes(1))
    const [draft, patch, baseline, serializeOptions] = onSaveEdit.mock.calls[0] as [
      Program,
      Partial<Program>,
      Program,
      { overlayMerge?: 'legacy-merge' | 'nested-ssot' },
    ]
    expect(baseline).toBe(program)
    expect(serializeOptions).toEqual({ overlayMerge: 'nested-ssot' })
    expect(patch.title).toBe('프로그램 수정 테스트123')
    expect(patch.titleEn).toBe('Digital Literacy Classroom789')
    expect(patch.educationProcess).toBe('Digital (Computer)')
    expect(patch.ipOwned).toBe('Partner')
    expect(patch.generalCommonInfo?.announcementTitle).toBe('프로그램 수정 테스트456')
    expect(patch.generalCommonInfo?.kpi?.finalParticipants).toBe(510)
    expect(wageAmountsFromRows(patch.generalCommonInfo?.wageGradeRows)).toEqual([123, 456, 789])
    expect(patch.generalCommonInfo?.curriculumSessions?.[0]?.description).toBe('수정 본문')
    expect(patch.generalCommonInfo).not.toHaveProperty('participantRecruitmentInfo')

    const body: ProgramUpdateRequestBody = mapGeneralProgramToUpdateRequest(
      draft,
      patch,
      program,
      serializeOptions
    )
    expect(body.title).toBe('프로그램 수정 테스트123')
    expect(body.titleEn).toBe('Digital Literacy Classroom789')
    expect(body.educationProcess).toBe('Digital (Computer)')
    expect(body.ipOwned).toBe('Partner')
    expect(body.totalParticipants).toBe(510)
    const parsed = parseJson(body.serviceDetailJson)
    expect(parsed.generalCommonInfo?.announcementTitle).toBe('프로그램 수정 테스트456')
    expect(
      (parsed.generalCommonInfo?.kpi as { finalParticipants?: number } | undefined)?.finalParticipants
    ).toBe(510)
    expect(
      wageAmountsFromRows(parsed.generalCommonInfo?.wageGradeRows as Array<{ pricing?: string }>)
    ).toEqual([123, 456, 789])
    const overlay = parsed.registrationOverlay ?? parsed.registration?.overlay
    expect(overlay?.['generalRegistration.basicInfo.detailedProgramName']).toBe('기존 세부프로그램')
    expect(overlay?.['generalRegistration.basicInfo.educationVenueDetail']).toBe('서울시 강남구')
    if (!Object.prototype.hasOwnProperty.call(patch.generalCommonInfo ?? {}, 'sponsorManagerContactIds')) {
      expect(overlay?.['generalRegistration.basicInfo.localManagerContactIds']).toEqual(['contact-1'])
    } else {
      const overlayContactIds = overlay?.['generalRegistration.basicInfo.localManagerContactIds']
      expect(JSON.stringify(overlayContactIds ?? '')).not.toContain('__sponsor_contact_unselected__')
    }
    const overlayScheduleLines =
      overlay?.['generalRegistration.educationScheduleSettings.scheduleLines']
    expect(Array.isArray(overlayScheduleLines) && overlayScheduleLines.length > 0).toBe(true)
    expect(overlay?.['generalRegistration.typeSettings.singleEducationForm']).toBe('offline')
    expect(overlay?.['generalRegistration.typeSettings.multiCommonEducationForm']).toBe('offline')

    const mergedCommon = {
      ...program.generalCommonInfo,
      ...parsed.generalCommonInfo,
    }
    const reseed = programToGeneralCommonInfoEditValues({
      ...program,
      ...patch,
      title: body.title ?? program.title,
      titleEn: body.titleEn,
      educationProcess: body.educationProcess,
      ipOwned: body.ipOwned,
      generalCommonInfo: mergedCommon,
    })
    expect(reseed.mainTitle).toBe('프로그램 수정 테스트123')
    expect(reseed.announcementTitle).toBe('프로그램 수정 테스트456')
    expect(reseed.titleEn).toBe('Digital Literacy Classroom789')
    expect(reseed.kpiFinalParticipants).toBe(510)
    expect(reseed.educationProcess).toBe('digital_computer')
    expect(reseed.ipOwned).toBe('partner')
    expect(reseed.curriculumSessions[0]?.description).toBe('수정 본문')
  })

  it('후원사 2개·담당자 2개에서 제목만 바꾸면 Mock PATCH에 sponsors가 없다', async () => {
    const program: Program = {
      ...getProgram186307(),
      sponsorId: '1627251',
      managerName: '담당자A',
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution'],
      generalCommonInfo: {
        ...getProgram186307().generalCommonInfo,
        sponsorManagementIds: ['1627251', '163301'],
        sponsorManagerContactIds: ['1627251::1627253', '163301::163322'],
      },
    }
    const formRef: {
      current: ReturnType<typeof useForm<GeneralProgramCommonInfoEditFormValues>> | null
    } = { current: null }
    const onSaveEdit = vi.fn().mockResolvedValue(undefined)
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <Harness program={program} onSaveEdit={onSaveEdit} formRef={formRef} />
      </QueryClientProvider>
    )

    expect(formRef.current?.getValues('sponsorManagementIds')).toEqual(['1627251', '163301'])
    expect(formRef.current?.getValues('sponsorManagerContactIds')).toEqual([
      '1627251::1627253',
      '163301::163322',
    ])

    await act(async () => {
      changeInput('모집 시 노출될 프로그램명을 입력하세요', '제목만 수정')
    })

    await act(async () => {
      fireEvent.click(screen.getByText('mock-save'))
    })

    await waitFor(() => expect(onSaveEdit).toHaveBeenCalledTimes(1))
    const [draft, patch, baseline, serializeOptions] = onSaveEdit.mock.calls[0] as [
      Program,
      Partial<Program>,
      Program,
      { overlayMerge?: 'legacy-merge' | 'nested-ssot' },
    ]
    expect(baseline).toBe(program)
    expect(patch.generalCommonInfo).not.toHaveProperty('sponsorManagementIds')
    expect(patch.generalCommonInfo).not.toHaveProperty('sponsorManagerContactIds')
    expect(formRef.current?.getValues('sponsorManagementIds')).toEqual(['1627251', '163301'])
    expect(formRef.current?.getValues('sponsorManagerContactIds')).toEqual([
      '1627251::1627253',
      '163301::163322',
    ])

    const body: ProgramUpdateRequestBody = mapGeneralProgramToUpdateRequest(
      draft,
      patch,
      program,
      serializeOptions
    )
    expect(body).not.toHaveProperty('sponsors')
    expect(body).not.toHaveProperty('sponsorId')
  })

  it('일반 2차시를 지우면 Mock PATCH Overlay 맵에 2번 키가 없다', async () => {
    const program = getProgram186307()
    const formRef: {
      current: ReturnType<typeof useForm<GeneralProgramCommonInfoEditFormValues>> | null
    } = { current: null }
    const onSaveEdit = vi.fn().mockResolvedValue(undefined)
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <Harness program={program} onSaveEdit={onSaveEdit} formRef={formRef} />
      </QueryClientProvider>
    )

    await act(async () => {
      const form = formRef.current
      if (!form) throw new Error('form not ready')
      form.setValue('curriculumSessions', form.getValues('curriculumSessions').slice(0, 1), {
        shouldDirty: true,
        shouldTouch: true,
      })
    })

    await act(async () => {
      fireEvent.click(screen.getByText('mock-save'))
    })

    await waitFor(() => expect(onSaveEdit).toHaveBeenCalledTimes(1))
    const [draft, patch, baseline, serializeOptions] = onSaveEdit.mock.calls[0] as [
      Program,
      Partial<Program>,
      Program,
      { overlayMerge?: 'legacy-merge' | 'nested-ssot' },
    ]
    expect(baseline).toBe(program)
    expect(patch.generalCommonInfo?.curriculumSessions).toHaveLength(1)
    expect(patch.generalCommonInfo?.curriculumSessions?.[0]?.sessionNo).toBe(1)

    const body: ProgramUpdateRequestBody = mapGeneralProgramToUpdateRequest(
      draft,
      patch,
      program,
      serializeOptions
    )
    expect(body).not.toHaveProperty('sponsors')
    const parsed = parseJson(body.serviceDetailJson)
    const overlay = parsed.registrationOverlay ?? parsed.registration?.overlay
    const unitMap = overlay?.['generalRegistration.educationCurriculum.unitNameBySession'] as
      | Record<string, unknown>
      | undefined
    expect(
      Object.keys(unitMap ?? {})
        .filter(key => unitMap?.[key] != null)
        .map(Number)
        .sort((a, b) => a - b)
    ).toEqual([1])
    expect(unitMap?.['2'] ?? unitMap?.[2]).toBeUndefined()
  })

  it('수정 모드에서 참여자 유형 체크박스를 비활성화한다', () => {
    const program = getProgram186307()
    const formRef: {
      current: ReturnType<typeof useForm<GeneralProgramCommonInfoEditFormValues>> | null
    } = { current: null }
    const onSaveEdit = vi.fn().mockResolvedValue(undefined)
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <Harness program={program} onSaveEdit={onSaveEdit} formRef={formRef} />
      </QueryClientProvider>
    )

    expect(screen.getByText('모집 등록 후 참여자 유형은 변경할 수 없습니다.')).toBeTruthy()
    const field = screen
      .getByText('참여자 유형', { selector: '.detail-info-form__field-label-text' })
      .closest('.detail-info-form__field')
    if (!field) throw new Error('참여자 유형 필드를 찾지 못했습니다')
    const checkboxes = [...field.querySelectorAll('input[type="checkbox"]')] as HTMLInputElement[]
    expect(checkboxes).toHaveLength(4)
    expect(checkboxes[0]?.disabled).toBe(true)
    expect(checkboxes[1]?.disabled).toBe(true)
    expect(checkboxes[2]?.disabled).toBe(false)
    expect(checkboxes[3]?.disabled).toBe(false)
  })

  it('담당자가 없는 후원사도 후원사 담당자 미선택을 보여준다', async () => {
    const program = getProgram186307()
    const formRef: {
      current: ReturnType<typeof useForm<GeneralProgramCommonInfoEditFormValues>> | null
    } = { current: null }
    const onSaveEdit = vi.fn().mockResolvedValue(undefined)
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <Harness program={program} onSaveEdit={onSaveEdit} formRef={formRef} />
      </QueryClientProvider>
    )

    const field = screen
      .getByText('후원사 담당자', { selector: '.detail-info-form__field-label-text' })
      .closest('.detail-info-form__field')
    if (!field) throw new Error('후원사 담당자 필드를 찾지 못했습니다')
    const trigger = field.querySelector('button[aria-haspopup="listbox"]')
    if (!trigger) throw new Error('담당자 셀렉트 트리거를 찾지 못했습니다')
    fireEvent.click(trigger)
    expect(await screen.findAllByText('미선택')).not.toHaveLength(0)
    expect(document.querySelector('.cms-select-multi__label-pill')?.textContent).toBe('미선택')
    expect(screen.queryByText('검색 결과가 없습니다.')).toBeNull()
  })
})
