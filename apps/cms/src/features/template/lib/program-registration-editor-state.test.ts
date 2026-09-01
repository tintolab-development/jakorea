import { describe, expect, it } from 'vitest'
import {
  applyProgramRegistrationEditorState,
  type ProgramRegistrationEditorState,
} from '@/features/template/lib/program-registration-editor-state'

const defaults: ProgramRegistrationEditorState = {
  participant: {
    individual: false,
    organization: true,
    teacherInstructor: false,
    volunteer: false,
  },
  programType: 'curriculum',
  sessionRoundType: 'single',
  educationFormScheduleDetail: 'common',
  participationScheduleDetail: 'common',
  ipsScheduleDetail: 'common',
  curriculumSessionCount: 1,
  curriculumChartSessionCount: 1,
  scheduleCurriculumDetailCount: 1,
  scheduleCurriculumGroupCount: 1,
  scheduleCurriculumPreEducation: false,
  trainedTeachersTeacherTrainingEnabled: true,
  educationScheduleMode: 'date',
  sponsorId: '',
  sponsorContactId: '',
  programTitleKo: '',
  activeParagraphId: null,
}

describe('applyProgramRegistrationEditorState', () => {
  it('string sponsorId를 복원한다', () => {
    const restored = applyProgramRegistrationEditorState(
      { sponsorId: 'sponsor-42', sponsorContactId: 'contact-1' },
      defaults
    )
    expect(restored.sponsorId).toBe('sponsor-42')
    expect(restored.sponsorContactId).toBe('contact-1')
  })

  it('number sponsorId를 string으로 복원한다', () => {
    const restored = applyProgramRegistrationEditorState(
      { sponsorId: 42, sponsorContactId: 7 },
      defaults
    )
    expect(restored.sponsorId).toBe('42')
    expect(restored.sponsorContactId).toBe('7')
  })
})
