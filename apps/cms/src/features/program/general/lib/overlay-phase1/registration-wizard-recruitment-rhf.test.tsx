/** @vitest-environment jsdom */
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  resetApplicantRecruitInstitutionOverlayStoreForTests,
  useApplicantRecruitInstitutionOverlayKv,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import {
  flushRecruitDetailRichTextIntoGeneralRecruitOverlay,
  registerRecruitDetailRichTextHtml,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-additional-content-flush'
import {
  getGeneralRecruitOverlayRecord,
  patchGeneralRecruitOverlay,
  peekGeneralRecruitOverlayRecord,
  readLiveGeneralRecruitOverlayRecord,
  replaceGeneralRecruitOverlayForScope,
  resetGeneralRecruitOverlayStoreForTests,
  setGeneralRecruitOverlayScope,
  useGeneralRecruitOverlayKv,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import {
  persistMissingVolunteerInterviewOverlayDefaults,
  removeVolunteerInterviewExceptionBlock,
  updateVolunteerInterviewOverlayKey,
} from '@/features/template/ui/form-set/application-form/volunteer/lib/interview-schedule-overlay-sync'
import { getRecruitVolunteerHiddenParagraphIds } from '@/features/template/ui/form-set/recruit-form/shared/recruit-volunteer-form-visibility'
import { RECRUIT_FORM_VOLUNTEER_IDS } from '@/features/template/model/recruit-form-volunteer-draft'
import {
  beginWizardRecruitmentRhfProjection,
  endWizardRecruitmentRhfProjection,
} from './registration-wizard-recruitment-rhf'
import { GeneralRegistrationWizardFormProvider } from '@/features/program/general/ui/registration/registration-wizard-form-provider'
import {
  peekGeneralRegistrationWizardRhf,
  registerGeneralRegistrationWizardRhf,
} from './registration-wizard-rhf-api'
import { buildGeneralProgramCreateFromWizardRhf } from './build-registration-create-from-rhf'
import { createDefaultRegistrationWizardUiValues } from './registration-wizard-ui-values'
import { listIncompleteGeneralProgramRecruitmentRequiredFields } from '@/features/program/general/lib/registration-recruitment-required-fields'
import {
  isRecruitMediaOverlayKey,
  selectRecruitmentKvForParticipant,
} from './registration-wizard-recruitment-rhf'

const RANGE = { start: '2026-09-01T00:00:00.000Z', end: '2026-09-30T00:00:00.000Z' }

const VOLUNTEER_ONLY = {
  organization: false,
  individual: false,
  teacherInstructor: false,
  volunteer: true,
} as const

const VOLUNTEER_REQUIRED_CTX = {
  participant: VOLUNTEER_ONLY,
  programType: 'curriculum' as const,
  sessionRoundType: 'single' as const,
  educationScheduleMode: 'date' as const,
  volunteerExceptionScheduleCount: 0,
  registrationProgramType: 'GENERAL' as const,
}

function filledVolunteerKv(): Record<string, unknown> {
  return {
    'recruit.volunteer.announcementPublished': 'published',
    'recruit.volunteer.interviewRequired': 'yes',
    'recruit.volunteer.programRangeSeal': RANGE,
    'recruit.volunteer.recruitRangeSeal': RANGE,
    'recruit.volunteer.volunteerTargets': ['university'],
    'recruit.volunteer.volunteerTargetDetail': '대학생',
    'recruit.volunteer.docDeadlineIso': '2026-10-01T00:00:00.000Z',
    'recruit.volunteer.docAnnounceMethod': '메일',
    'recruit.volunteer.interviewRangeSeal': RANGE,
    'recruit.volunteer.interviewMethod': '화상',
    'recruit.volunteer.finalAnnounceIso': '2026-10-02T00:00:00.000Z',
    'recruit.volunteer.finalAnnounceMethod': '메일',
    'recruit.volunteer.inquiryContact': '담당',
    'recruit.volunteer.inquiryTel': '010-0000-0000',
    'recruit.volunteer.inquiryEmail': 'v@e.com',
    'recruit.volunteer.notesNotApplicable': true,
    'recruit.volunteer.interview.interviewTimeRange': [
      '2026-10-01T09:00:00.000Z',
      '2026-10-01T10:00:00.000Z',
    ],
    'recruit.volunteer.interview.timeUnit': '30',
    'recruit.volunteer.interview.selectedSlotKeys': ['1714892400000-1714894200000'],
    'recruit.volunteer.interview.exception.10.exceptionDate': '2026-10-03T00:00:00.000Z',
    'recruit.volunteer.interview.exception.10.selectedSlotKeys': ['10:00'],
  }
}

function seedVolunteerWizard(recruitmentKv: Record<string, unknown>): void {
  const rhf = peekGeneralRegistrationWizardRhf()
  const current = rhf!.getValues()
  rhf?.reset({
    ...current,
    extras: {
      ...current.extras,
      participant: { ...current.extras.participant, ...VOLUNTEER_ONLY },
    },
    recruitmentKv,
  })
}

function filledInstitutionKv(): Record<string, unknown> {
  return {
    'recruit.announcementPublished': 'published',
    'recruit.studentListRequired': 'need',
    'recruit.preguidanceRequired': 'need',
    'recruit.maxAssignableInstructors': 2,
    'recruit.maxClassCount': 4,
    'recruit.programRangeSeal': RANGE,
    'recruit.targetLevels': ['elementary'],
    'recruit.targetLevelDetail': '초등',
    'recruit.recruitRangeSeal': RANGE,
    'recruit.finalAnnounceIso': '2026-10-01T00:00:00.000Z',
    'recruit.finalAnnounceMethod': '공지',
    'recruit.inquiryContact': '담당자',
    'recruit.inquiryTel': '010-1111-2222',
    'recruit.inquiryEmail': 'rhf@example.com',
    'recruit.notesNotApplicable': true,
    'recruit.detailInfo.programDescription': '<p>RHF 설명</p>',
  }
}

function Probe({ overlayKey, testId }: { overlayKey: string; testId: string }) {
  const [value, setValue] = useGeneralRecruitOverlayKv(overlayKey, '')
  return (
    <div>
      <span data-testid={testId}>{String(value)}</span>
      <button type="button" onClick={() => setValue('RHF-우선')} data-testid={`${testId}-set`}>
        set
      </button>
    </div>
  )
}

function InstitutionProbe() {
  const [value, setValue] = useApplicantRecruitInstitutionOverlayKv(
    'recruit.inquiryTel',
    ''
  )
  return (
    <div>
      <span data-testid="inst-tel">{String(value)}</span>
      <button type="button" onClick={() => setValue('RHF-기관')} data-testid="inst-set">
        set
      </button>
    </div>
  )
}

describe('일반 신규 등록 모집 RHF 정본', () => {
  afterEach(() => {
    cleanup()
    registerGeneralRegistrationWizardRhf(null)
    resetGeneralRecruitOverlayStoreForTests()
    resetApplicantRecruitInstitutionOverlayStoreForTests()
  })

  it('미디어 키는 RHF owned 가 아니다', () => {
    expect(isRecruitMediaOverlayKey('recruit.detailInfo.thumbFileObjectId')).toBe(true)
    expect(isRecruitMediaOverlayKey('recruit.detailInfo.programDescription')).toBe(false)
  })

  it('비활성 모집 유형 키는 선택 kv에서 빠진다', () => {
    const selected = selectRecruitmentKvForParticipant(
      {
        'recruit.inquiryTel': '기관',
        'recruit.volunteer.notes': '봉사자 유령',
      },
      {
        organization: true,
        individual: false,
        teacherInstructor: false,
        volunteer: false,
      }
    )
    expect(selected['recruit.inquiryTel']).toBe('기관')
    expect(selected['recruit.volunteer.notes']).toBeUndefined()
  })

  it('공유 단락 입력은 Overlay와 달라도 RHF를 표시한다', () => {
    render(
      <GeneralRegistrationWizardFormProvider>
        <Probe overlayKey="recruit.individual.inquiryTel" testId="tel" />
      </GeneralRegistrationWizardFormProvider>
    )
    act(() => {
      patchGeneralRecruitOverlay({ 'recruit.individual.inquiryTel': 'STALE' })
    })
    const rhf = peekGeneralRegistrationWizardRhf()
    act(() => {
      rhf?.setPath('recruitmentKv', { 'recruit.individual.inquiryTel': 'RHF-정본' }, { shouldDirty: true })
    })
    expect(document.querySelector('[data-testid="tel"]')?.textContent).toBe('RHF-정본')
  })

  it('기관 모집 훅도 RHF를 우선한다', () => {
    render(
      <GeneralRegistrationWizardFormProvider>
        <InstitutionProbe />
      </GeneralRegistrationWizardFormProvider>
    )
    act(() => {
      document.querySelector<HTMLButtonElement>('[data-testid="inst-set"]')?.click()
    })
    expect(document.querySelector('[data-testid="inst-tel"]')?.textContent).toBe('RHF-기관')
    expect(peekGeneralRegistrationWizardRhf()?.getValues().recruitmentKv['recruit.inquiryTel']).toBe(
      'RHF-기관'
    )
  })

  it('RHF가 없으면 기존 Overlay store만 갱신한다', () => {
    setGeneralRecruitOverlayScope('recruitment-participant-individual')
    patchGeneralRecruitOverlay({ 'recruit.individual.inquiryTel': 'economy-store' })
    expect(getGeneralRecruitOverlayRecord()['recruit.individual.inquiryTel']).toBe('economy-store')
  })

  it('필수 검증은 선택한 유형의 RHF kv만 본다', () => {
    render(<GeneralRegistrationWizardFormProvider>ok</GeneralRegistrationWizardFormProvider>)
    act(() => {
      peekGeneralRegistrationWizardRhf()?.setPath('recruitmentKv', filledInstitutionKv(), {
        shouldDirty: true,
      })
    })
    const incomplete = listIncompleteGeneralProgramRecruitmentRequiredFields({
      participant: {
        organization: true,
        individual: false,
        teacherInstructor: false,
        volunteer: false,
      },
      programType: 'curriculum',
      sessionRoundType: 'single',
      educationScheduleMode: 'date',
      volunteerExceptionScheduleCount: 0,
      registrationProgramType: 'GENERAL',
    })
    expect(incomplete).toEqual([])
  })

  it('stale Overlay 는 CREATE persist 를 덮지 않고 숨은 봉사자는 제외한다', () => {
    const ui = createDefaultRegistrationWizardUiValues({
      participant: {
        organization: true,
        individual: false,
        teacherInstructor: false,
        volunteer: false,
      },
    })
    ui.programTitleKo = '모집 RHF'
    ui.recruitmentKv = {
      ...filledInstitutionKv(),
      'recruit.volunteer.notes': '유령 봉사자',
    }
    const result = buildGeneralProgramCreateFromWizardRhf({
      id: 'recruit-rhf-1',
      uiValues: ui,
      overlay: {
        'recruit.inquiryTel': 'STALE-OVERLAY',
        'recruit.volunteer.notes': 'STALE-VOLUNTEER',
        'application.thirdParty.recipient': 'nope',
      },
    })
    expect(result.persistOverlay['recruit.inquiryTel']).toBe('010-1111-2222')
    expect(result.persistOverlay['recruit.volunteer.notes']).toBeUndefined()
    expect(result.program.generalCommonInfo?.participantRecruitmentInfo?.inquiryTel).toBe(
      '010-1111-2222'
    )
    expect(JSON.stringify(result.persistOverlay).includes('application.thirdParty')).toBe(false)
    expect(JSON.stringify(result.createRequest).includes('blob:')).toBe(false)
  })

  it('호환 peek는 stale Overlay 소유 키를 버리고 RHF와 미디어만 남긴다', () => {
    render(<GeneralRegistrationWizardFormProvider>ok</GeneralRegistrationWizardFormProvider>)
    act(() => {
      const rhf = peekGeneralRegistrationWizardRhf()
      const current = rhf!.getValues()
      rhf?.reset({
        ...current,
        extras: {
          ...current.extras,
          participant: {
            ...current.extras.participant,
            individual: true,
          },
        },
        recruitmentKv: { 'recruit.individual.inquiryTel': 'RHF-정본' },
      })
      beginWizardRecruitmentRhfProjection()
      try {
        replaceGeneralRecruitOverlayForScope('recruitment-participant-individual', {
          'recruit.individual.inquiryTel': 'STALE',
          'recruit.detailInfo.thumbFileObjectId': 88,
        })
      } finally {
        endWizardRecruitmentRhfProjection()
      }
    })
    const peeked = peekGeneralRecruitOverlayRecord('recruitment-participant-individual')
    expect(peeked['recruit.individual.inquiryTel']).toBe('RHF-정본')
    expect(peeked['recruit.detailInfo.thumbFileObjectId']).toBe(88)
  })

  it('기간 지정일 때만 기관 최대 일정 수를 검사한다', () => {
    render(<GeneralRegistrationWizardFormProvider>ok</GeneralRegistrationWizardFormProvider>)
    act(() => {
      peekGeneralRegistrationWizardRhf()?.setPath('recruitmentKv', filledInstitutionKv(), {
        shouldDirty: true,
      })
    })
    const org = {
      organization: true,
      individual: false,
      teacherInstructor: false,
      volunteer: false,
    } as const
    expect(
      listIncompleteGeneralProgramRecruitmentRequiredFields({
        participant: org,
        programType: 'curriculum',
        sessionRoundType: 'single',
        educationScheduleMode: 'date',
        volunteerExceptionScheduleCount: 0,
        registrationProgramType: 'GENERAL',
      })
    ).not.toContain('recruit.institution.maxScheduleCount')
    expect(
      listIncompleteGeneralProgramRecruitmentRequiredFields({
        participant: org,
        programType: 'schedule',
        sessionRoundType: 'single',
        educationScheduleMode: 'period',
        volunteerExceptionScheduleCount: 0,
        registrationProgramType: 'GENERAL',
      })
    ).toContain('recruit.institution.maxScheduleCount')
  })

  it('봉사자 면접 예외 일정이 있으면 RHF에서 날짜·슬롯을 검사한다', () => {
    render(<GeneralRegistrationWizardFormProvider>ok</GeneralRegistrationWizardFormProvider>)
    const volunteerFilled = {
      'recruit.volunteer.announcementPublished': 'published',
      'recruit.volunteer.interviewRequired': 'yes',
      'recruit.volunteer.programRangeSeal': RANGE,
      'recruit.volunteer.recruitRangeSeal': RANGE,
      'recruit.volunteer.volunteerTargets': ['university'],
      'recruit.volunteer.volunteerTargetDetail': '대학생',
      'recruit.volunteer.docDeadlineIso': '2026-10-01T00:00:00.000Z',
      'recruit.volunteer.docAnnounceMethod': '메일',
      'recruit.volunteer.interviewRangeSeal': RANGE,
      'recruit.volunteer.interviewMethod': '화상',
      'recruit.volunteer.finalAnnounceIso': '2026-10-02T00:00:00.000Z',
      'recruit.volunteer.finalAnnounceMethod': '메일',
      'recruit.volunteer.inquiryContact': '담당',
      'recruit.volunteer.inquiryTel': '010-0000-0000',
      'recruit.volunteer.inquiryEmail': 'v@e.com',
      'recruit.volunteer.notesNotApplicable': true,
      'recruit.volunteer.interview.interviewTimeRange': [
        '2026-10-01T09:00:00.000Z',
        '2026-10-01T10:00:00.000Z',
      ],
      'recruit.volunteer.interview.timeUnit': '30',
      'recruit.volunteer.interview.selectedSlotKeys': ['09:00'],
    }
    act(() => {
      peekGeneralRegistrationWizardRhf()?.setPath('recruitmentKv', volunteerFilled, {
        shouldDirty: true,
      })
    })
    const volunteerCtx = {
      participant: {
        organization: false,
        individual: false,
        teacherInstructor: false,
        volunteer: true,
      },
      programType: 'curriculum' as const,
      sessionRoundType: 'single' as const,
      educationScheduleMode: 'date' as const,
      volunteerExceptionScheduleCount: 1,
      registrationProgramType: 'GENERAL' as const,
    }
    expect(listIncompleteGeneralProgramRecruitmentRequiredFields(volunteerCtx)).toContain(
      'recruit.volunteer.interview.exceptionDate'
    )
    act(() => {
      peekGeneralRegistrationWizardRhf()?.setPath(
        'recruitmentKv',
        {
          ...volunteerFilled,
          'recruit.volunteer.interview.exception.1.exceptionDate': '2026-10-03T00:00:00.000Z',
          'recruit.volunteer.interview.exception.1.selectedSlotKeys': ['10:00'],
        },
        { shouldDirty: true }
      )
    })
    expect(listIncompleteGeneralProgramRecruitmentRequiredFields(volunteerCtx)).not.toContain(
      'recruit.volunteer.interview.exceptionDate'
    )
    expect(listIncompleteGeneralProgramRecruitmentRequiredFields(volunteerCtx)).not.toContain(
      'recruit.volunteer.interview.exception.1.exceptionDate'
    )
  })

  it('Rich Text flush는 일반 위저드 RHF kv에 최신 HTML을 남긴다', () => {
    render(<GeneralRegistrationWizardFormProvider>ok</GeneralRegistrationWizardFormProvider>)
    registerRecruitDetailRichTextHtml(
      'recruit.detailInfo.programDescription',
      () => '<p>최신 설명</p>'
    )
    act(() => {
      flushRecruitDetailRichTextIntoGeneralRecruitOverlay()
    })
    expect(
      peekGeneralRegistrationWizardRhf()?.getValues().recruitmentKv[
        'recruit.detailInfo.programDescription'
      ]
    ).toBe('<p>최신 설명</p>')
    registerRecruitDetailRichTextHtml('recruit.detailInfo.programDescription', null)
  })

  it('fetch 를 호출하지 않는다', () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    buildGeneralProgramCreateFromWizardRhf({
      id: 'recruit-rhf-2',
      uiValues: createDefaultRegistrationWizardUiValues(),
    })
    expect(fetchSpy).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('모집 탭 스코프가 비어도 persistMissing·슬롯 remap이 RHF 면접 일정을 비우지 않는다', () => {
    render(<GeneralRegistrationWizardFormProvider>ok</GeneralRegistrationWizardFormProvider>)
    const filled = filledVolunteerKv()
    act(() => {
      seedVolunteerWizard(filled)
      setGeneralRecruitOverlayScope('recruitment-instructor')
    })

    expect(getGeneralRecruitOverlayRecord()['recruit.volunteer.interview.selectedSlotKeys']).toBeUndefined()
    expect(readLiveGeneralRecruitOverlayRecord()['recruit.volunteer.interview.selectedSlotKeys']).toEqual(
      filled['recruit.volunteer.interview.selectedSlotKeys']
    )

    act(() => {
      persistMissingVolunteerInterviewOverlayDefaults({
        store: 'recruit',
        values: {
          timeUnit: '30',
          interviewTimeRange: null,
          selectedSlotKeys: [],
        },
      })
      updateVolunteerInterviewOverlayKey<string[]>(
        'recruit',
        'selectedSlotKeys',
        prev => prev ?? []
      )
    })

    const kv = peekGeneralRegistrationWizardRhf()?.getValues().recruitmentKv ?? {}
    expect(kv['recruit.volunteer.interview.selectedSlotKeys']).toEqual(
      filled['recruit.volunteer.interview.selectedSlotKeys']
    )
    expect(kv['recruit.volunteer.interview.timeUnit']).toBe('30')
    expect(kv['recruit.volunteer.interview.interviewTimeRange']).toEqual(
      filled['recruit.volunteer.interview.interviewTimeRange']
    )
    expect(
      listIncompleteGeneralProgramRecruitmentRequiredFields({
        ...VOLUNTEER_REQUIRED_CTX,
        volunteerExceptionScheduleCount: 1,
      })
    ).toEqual([])
  })

  it('면접 없음은 빈 overlay store여도 RHF 값으로 면접 일정 단락을 숨긴다', () => {
    render(<GeneralRegistrationWizardFormProvider>ok</GeneralRegistrationWizardFormProvider>)
    act(() => {
      seedVolunteerWizard({
        'recruit.volunteer.interviewRequired': 'no',
      })
      setGeneralRecruitOverlayScope('recruitment-instructor')
    })
    expect(getRecruitVolunteerHiddenParagraphIds()).toEqual(
      new Set([RECRUIT_FORM_VOLUNTEER_IDS.interviewSchedule])
    )
  })

  it('면접 없음 boolean false도 면접 일정 단락을 숨긴다', () => {
    render(<GeneralRegistrationWizardFormProvider>ok</GeneralRegistrationWizardFormProvider>)
    act(() => {
      seedVolunteerWizard({
        'recruit.volunteer.interviewRequired': false,
      })
      setGeneralRecruitOverlayScope('recruitment-instructor')
    })
    expect(getRecruitVolunteerHiddenParagraphIds()).toEqual(
      new Set([RECRUIT_FORM_VOLUNTEER_IDS.interviewSchedule])
    )
  })

  it('예외 일정 삭제는 merge patch가 아니라 RHF 키를 제거한다', () => {
    render(<GeneralRegistrationWizardFormProvider>ok</GeneralRegistrationWizardFormProvider>)
    const filled = filledVolunteerKv()
    act(() => {
      seedVolunteerWizard(filled)
      setGeneralRecruitOverlayScope('recruitment-volunteer')
    })
    act(() => {
      removeVolunteerInterviewExceptionBlock({
        store: 'recruit',
        blockKey: 10,
      })
    })
    const kv = peekGeneralRegistrationWizardRhf()?.getValues().recruitmentKv ?? {}
    expect(kv['recruit.volunteer.interview.exception.10.exceptionDate']).toBeUndefined()
    expect(kv['recruit.volunteer.interview.exception.10.selectedSlotKeys']).toBeUndefined()
    expect(kv['recruit.volunteer.interview.selectedSlotKeys']).toEqual(
      filled['recruit.volunteer.interview.selectedSlotKeys']
    )
  })
})
