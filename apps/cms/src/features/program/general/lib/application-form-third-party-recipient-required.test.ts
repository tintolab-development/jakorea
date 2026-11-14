import { beforeEach, describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  createProgramParticipantApplicationDraft,
  PROGRAM_PARTICIPANT_APPLICATION_IDS,
} from '@/features/template/model/program-application-form-individual-draft'
import {
  createProgramApplicationFormInstitutionDraft,
  PROGRAM_APPLICATION_FORM_INSTITUTION_IDS,
} from '@/features/template/model/program-application-form-institution-draft'
import {
  createProgramApplicationFormEconomyDraft,
  PROGRAM_APPLICATION_FORM_ECONOMY_IDS,
} from '@/features/template/model/program-application-form-economy-draft'
import {
  APPLICATION_FORM_THIRD_PARTY_RECIPIENT_INSTITUTION_NAME_PLACEHOLDER,
  APPLICATION_FORM_THIRD_PARTY_RECIPIENT_SEED_BY_PARAGRAPH_ID,
  hasIncompleteApplicationFormThirdPartyRecipient,
  isApplicationFormThirdPartyRecipientColumn,
  isBlankApplicationFormThirdPartyRecipientValue,
  readApplicationFormThirdPartyRecipientValue,
  resolveThirdPartyRecipientFromFormAnswer,
} from '@/features/template/model/application-form-third-party-recipient'
import {
  createProgramApplicationFormInstructorDraft,
  PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS,
} from '@/features/template/model/program-application-form-instructor-draft'
import {
  createProgramApplicationFormVolunteerDraft,
  PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS,
} from '@/features/template/model/program-application-form-volunteer-draft'
import {
  createProgramApplicationFormTrainedTeachersDraft,
  PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS,
} from '@/features/template/model/program-application-form-trained-teachers-draft'
import {
  createGeminiVisitingTrainingApplicationFormInstitutionDraft,
  GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS,
} from '@/features/template/model/gemini-visiting-training-application-form-institution-draft'
import {
  createUjatProgramApplicationFormInstitutionDraft,
  UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS,
} from '@/features/template/model/ujat-program-application-form-institution-draft'
import {
  createUjatProgramApplicationFormVolunteerDraft,
  UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS,
} from '@/features/template/model/ujat-program-application-form-volunteer-draft'
import {
  horizontalTableSetFieldCellValue,
  resolveHorizontalTableCellPlainText,
  type HorizontalTableParagraph,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import {
  clearRegistrationWizardSessionDrafts,
  rememberRegistrationWizardSessionDraft,
} from './registration-wizard-session-drafts'
import {
  describeIncompleteApplicationFormThirdPartyRecipient,
  hasIncompleteApplicationFormThirdPartyRecipientForProgram,
} from './application-form-third-party-recipient-required'
import { seedDevAutofillApplicationThirdPartyRecipients } from './fill-application-form-third-party-recipient'

function individualProgram(): Program {
  return {
    id: '100001',
    generalParticipantTypes: ['individual'],
  } as Program
}

function fillRecipient(draft: ReturnType<typeof createProgramParticipantApplicationDraft>, value: string) {
  const paragraph = draft.paragraphs.find(
    item => item.id === PROGRAM_PARTICIPANT_APPLICATION_IDS.thirdPartyConsent
  ) as HorizontalTableParagraph | undefined
  if (paragraph == null) throw new Error('third party paragraph missing')
  const next = horizontalTableSetFieldCellValue(paragraph, 0, 0, { kind: 'text', value })
  return {
    ...draft,
    paragraphs: draft.paragraphs.map(item => (item.id === paragraph.id ? next : item)),
  }
}

describe('application form third-party recipient required', () => {
  beforeEach(() => {
    clearRegistrationWizardSessionDrafts()
  })

  it('시드 빈 「제공받는 곳」은 미입력이고, 값을 넣으면 완료한다', () => {
    const seed = createProgramParticipantApplicationDraft()
    expect(hasIncompleteApplicationFormThirdPartyRecipient(seed)).toBe(true)
    expect(hasIncompleteApplicationFormThirdPartyRecipient(fillRecipient(seed, 'JA Korea'))).toBe(
      false
    )
  })

  it('placeholder 문구가 셀 값으로 남아 있으면 미입력이다', () => {
    const seed = createProgramParticipantApplicationDraft()
    expect(
      hasIncompleteApplicationFormThirdPartyRecipient(
        fillRecipient(seed, '제공받는 곳을 입력해 주세요')
      )
    ).toBe(true)
  })

  it('제공받는 곳 열만 필수 칸으로 본다', () => {
    const paragraphId = PROGRAM_PARTICIPANT_APPLICATION_IDS.thirdPartyConsent
    const headers = ['제공받는 곳', '수집 항목', '수집·이용 목적', '제공받는 자의 보유기간']
    expect(isApplicationFormThirdPartyRecipientColumn(paragraphId, 0, headers)).toBe(true)
    expect(isApplicationFormThirdPartyRecipientColumn(paragraphId, 1, headers)).toBe(false)
  })

  it('등록 위저드 — 개인 신청 시드가 비어 있으면 막는다', () => {
    const program = individualProgram()
    expect(hasIncompleteApplicationFormThirdPartyRecipientForProgram({ program })).toBe(true)
    expect(describeIncompleteApplicationFormThirdPartyRecipient({ program })).toBe(
      'application.application-participant-individual.thirdPartyRecipient'
    )
  })

  it('현재 탭 draft가 채워져 있으면 통과한다', () => {
    const program = individualProgram()
    const filled = fillRecipient(createProgramParticipantApplicationDraft(), '황유정')
    expect(
      hasIncompleteApplicationFormThirdPartyRecipientForProgram({
        program,
        current: { templateCode: 'application-participant-individual', draft: filled },
      })
    ).toBe(false)
  })

  it('교육받은 교사 pending id는 일반 기관 신청이 아니라 교육받은 교사 신청을 본다', () => {
    const program = {
      id: 'trained-teachers-local-pending',
      generalParticipantTypes: ['school_institution'],
    } as Program
    expect(describeIncompleteApplicationFormThirdPartyRecipient({ program })).toBe(
      'application.application-trained-teachers.thirdPartyRecipient'
    )
  })

  it('미리보기용 id면 교육받은 교사도 일반 기관 신청으로 오인한다', () => {
    const program = {
      id: 'registration-preview',
      generalParticipantTypes: ['school_institution'],
    } as Program
    expect(describeIncompleteApplicationFormThirdPartyRecipient({ program })).toBe(
      'application.application-participant-school.thirdPartyRecipient'
    )
  })

  it('개발용 자동입력은 교육받은 교사 신청의 제공받는 곳을 채운다', () => {
    seedDevAutofillApplicationThirdPartyRecipients('trainedTeachers', {
      participantOrganization: true,
    })
    const program = {
      id: 'trained-teachers-local-pending',
      generalParticipantTypes: ['school_institution'],
    } as Program
    expect(hasIncompleteApplicationFormThirdPartyRecipientForProgram({ program })).toBe(false)
  })

  it('기관·1사1교 신청 시드도 제공받는 곳이 비면 미입력이다', () => {
    expect(
      hasIncompleteApplicationFormThirdPartyRecipient(createProgramApplicationFormInstitutionDraft())
    ).toBe(true)
    expect(
      hasIncompleteApplicationFormThirdPartyRecipient(createProgramApplicationFormEconomyDraft())
    ).toBe(true)
  })

  it('UJAT 고정 신청 양식도 등록 완료 시 제공받는 곳을 검사한다', () => {
    const program = {
      id: 'ujat-registration-validation',
      ujatProgressStatus: 'EDUCATION_SCHEDULED',
    } as Program
    expect(describeIncompleteApplicationFormThirdPartyRecipient({ program })).toBe(
      'application.application-ujat-school.thirdPartyRecipient'
    )
  })

  it('모든 신청 폼 시드의 「제공받는 곳」 기본값이 정책 표와 같다', () => {
    const seeds: Array<[string, ReturnType<typeof createProgramParticipantApplicationDraft>]> = [
      [PROGRAM_PARTICIPANT_APPLICATION_IDS.thirdPartyConsent, createProgramParticipantApplicationDraft()],
      [PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent, createProgramApplicationFormInstitutionDraft()],
      [PROGRAM_APPLICATION_FORM_ECONOMY_IDS.thirdPartyConsent, createProgramApplicationFormEconomyDraft()],
      [
        PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.thirdPartyConsent,
        createProgramApplicationFormTrainedTeachersDraft(),
      ],
      [
        UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent,
        createUjatProgramApplicationFormInstitutionDraft(),
      ],
      [
        GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent,
        createGeminiVisitingTrainingApplicationFormInstitutionDraft(),
      ],
      [PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.thirdPartyConsent, createProgramApplicationFormInstructorDraft()],
      [PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.thirdPartyConsent, createProgramApplicationFormVolunteerDraft()],
      [
        UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.thirdPartyConsent,
        createUjatProgramApplicationFormVolunteerDraft(),
      ],
    ]
    for (const [paragraphId, draft] of seeds) {
      expect(readApplicationFormThirdPartyRecipientValue(draft)).toBe(
        APPLICATION_FORM_THIRD_PARTY_RECIPIENT_SEED_BY_PARAGRAPH_ID[paragraphId]
      )
    }
  })

  it('resolveThirdPartyRecipientFromFormAnswer prioritizes thirdPartyRecipient then rows', () => {
    expect(
      resolveThirdPartyRecipientFromFormAnswer({
        bottomConsent: 'agree',
        thirdPartyRecipient: '서울○○중학교',
        dataRows: [['다른값']],
      })
    ).toBe('서울○○중학교')
    expect(
      resolveThirdPartyRecipientFromFormAnswer({
        bottomConsent: 'agree',
        dataRows: [['데이터행기관']],
        fieldDataRows: [[{ kind: 'text', value: '필드행기관' }]],
      })
    ).toBe('데이터행기관')
    expect(
      resolveThirdPartyRecipientFromFormAnswer({
        bottomConsent: 'agree',
        fieldDataRows: [[{ kind: 'text', value: '필드행기관' }]],
      })
    ).toBe('필드행기관')
    expect(resolveThirdPartyRecipientFromFormAnswer('agree')).toBeNull()
    expect(resolveThirdPartyRecipientFromFormAnswer({ bottomConsent: 'agree' })).toBeNull()
  })

  it('tableFlavor가 text이고 dataRows가 비어도 fieldDataRows의 제공받는 곳을 읽는다', () => {
    const draft = createProgramApplicationFormInstructorDraft()
    const paragraph = draft.paragraphs.find(
      item => item.id === PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.thirdPartyConsent
    ) as HorizontalTableParagraph | undefined
    expect(paragraph).toBeDefined()
    // 시안대로 시드는 빈칸 — 서버 저장본처럼 값이 채워진 표로 검사한다
    const saved = horizontalTableSetFieldCellValue(paragraph!, 0, 0, {
      kind: 'text',
      value: '배정된 교육 대상 학교',
    })
    const lostFlavor = {
      ...saved,
      tableFlavor: 'text' as const,
      dataRows: [['', '', '', '']],
    }
    expect(resolveHorizontalTableCellPlainText(lostFlavor, 0, 0)).toBe('배정된 교육 대상 학교')
  })

  it('강사·봉사자·UJAT 봉사자 시드는 시안대로 「제공받는 곳」이 빈칸이고 기관명 placeholder를 쓴다', () => {
    const seeds: Array<[string, WritingFormDraft]> = [
      [
        PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.thirdPartyConsent,
        createProgramApplicationFormInstructorDraft(),
      ],
      [
        PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.thirdPartyConsent,
        createProgramApplicationFormVolunteerDraft(),
      ],
      [
        UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.thirdPartyConsent,
        createUjatProgramApplicationFormVolunteerDraft(),
      ],
    ]
    for (const [paragraphId, draft] of seeds) {
      const table = draft.paragraphs.find(item => item.id === paragraphId) as
        | HorizontalTableParagraph
        | undefined
      expect(table).toBeDefined()
      expect(table!.columnFields?.[0]).toMatchObject({
        placeholder: APPLICATION_FORM_THIRD_PARTY_RECIPIENT_INSTITUTION_NAME_PLACEHOLDER,
      })
      expect(hasIncompleteApplicationFormThirdPartyRecipient(draft)).toBe(true)
    }
    expect(
      isBlankApplicationFormThirdPartyRecipientValue(
        APPLICATION_FORM_THIRD_PARTY_RECIPIENT_INSTITUTION_NAME_PLACEHOLDER
      )
    ).toBe(true)
  })

  it('1사1교 pending — 기관 신청 시드가 비면 강사 시드가 있어도 막는다', () => {
    const program = {
      id: 'company-school-local-pending',
      generalParticipantTypes: ['school_institution', 'teacher_instructor'],
    } as Program
    expect(describeIncompleteApplicationFormThirdPartyRecipient({ program })).toBe(
      'application.application-economy.thirdPartyRecipient'
    )
  })

  it('1사1교 — 기관·강사 신청 session draft의 제공받는 곳이 모두 채워져야 통과한다', () => {
    const program = {
      id: 'company-school-local-pending',
      generalParticipantTypes: ['school_institution', 'teacher_instructor'],
    } as Program
    const economy = createProgramApplicationFormEconomyDraft()
    const paragraph = economy.paragraphs.find(
      item => item.id === PROGRAM_APPLICATION_FORM_ECONOMY_IDS.thirdPartyConsent
    ) as HorizontalTableParagraph | undefined
    expect(paragraph).toBeDefined()
    const filledParagraph = horizontalTableSetFieldCellValue(paragraph!, 0, 0, {
      kind: 'text',
      value: 'JA코리아',
    })
    rememberRegistrationWizardSessionDraft({
      templateCode: 'application-economy',
      draft: {
        ...economy,
        paragraphs: economy.paragraphs.map(item =>
          item.id === filledParagraph.id ? filledParagraph : item
        ),
      },
    })
    // 강사 신청 시드도 시안대로 빈칸이라 아직 막는다
    expect(describeIncompleteApplicationFormThirdPartyRecipient({ program })).toBe(
      'application.application-instructor.thirdPartyRecipient'
    )

    const instructor = createProgramApplicationFormInstructorDraft()
    const instructorParagraph = instructor.paragraphs.find(
      item => item.id === PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.thirdPartyConsent
    ) as HorizontalTableParagraph | undefined
    expect(instructorParagraph).toBeDefined()
    const filledInstructorParagraph = horizontalTableSetFieldCellValue(instructorParagraph!, 0, 0, {
      kind: 'text',
      value: '배정된 교육 대상 학교',
    })
    rememberRegistrationWizardSessionDraft({
      templateCode: 'application-instructor',
      draft: {
        ...instructor,
        paragraphs: instructor.paragraphs.map(item =>
          item.id === filledInstructorParagraph.id ? filledInstructorParagraph : item
        ),
      },
    })
    expect(hasIncompleteApplicationFormThirdPartyRecipientForProgram({ program })).toBe(false)
  })
})
