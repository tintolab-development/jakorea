/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import { mapGeneralProgramToCreateRequest } from '@/features/program/general/api/adapters/general-program-adapters'
import { applyGeneralRecruitOverlayToProgram } from '@/features/program/general/lib/general-recruit-overlay-to-program'
import { OVERLAY_PHASE0_KNOWN_DIFFS } from '@/features/program/general/lib/overlay-phase0/overlay-phase0-known-diff'
import { buildGeneralProgramCreateFromWizardRhf } from './build-registration-create-from-rhf'
import { createDefaultRegistrationWizardUiValues } from './registration-wizard-ui-values'

const RANGE = { start: '2026-05-01T00:00:00.000Z', end: '2026-05-31T00:00:00.000Z' }
const PROGRAM_RANGE = { start: '2026-06-01T00:00:00.000Z', end: '2026-08-31T00:00:00.000Z' }

const institutionKv = {
  'recruit.maxAssignableInstructors': 3,
  'recruit.maxClassCount': 4,
  'recruit.announcementPublished': 'published',
  'recruit.recruitRangeSeal': RANGE,
  'recruit.programRangeSeal': PROGRAM_RANGE,
  'recruit.targetLevels': ['elementary'],
  'recruit.targetLevelDetail': '초등',
  'recruit.inquiryTel': '02-111-1111',
  'recruit.inquiryEmail': 'org@example.com',
  'recruit.inquiryContact': '기관담당',
  'recruit.detailInfo.programDescription': '<p>기관 설명</p>',
}

const individualKv = {
  'recruit.individual.announcementPublished': 'published',
  'recruit.individual.recruitRangeSeal': RANGE,
  'recruit.individual.programRangeSeal': PROGRAM_RANGE,
  'recruit.individual.targetLevels': ['high'],
  'recruit.individual.targetLevelDetail': '고등',
  'recruit.individual.inquiryTel': '010-0000-0000',
  'recruit.individual.inquiryEmail': 'ind@example.com',
  'recruit.individual.inquiryContact': '개인담당',
  'recruit.detailInfo.programDescription': '<p>개인 설명</p>',
}

const instructorKv = {
  'recruit.instructor.announcementPublished': 'published',
  'recruit.instructor.recruitRangeSeal': RANGE,
  'recruit.instructor.programRangeSeal': PROGRAM_RANGE,
  'recruit.instructor.recruitTargets': ['teacher'],
  'recruit.instructor.recruitTargetDetail': '교사',
  'recruit.instructor.inquiryTel': '02-222-2222',
  'recruit.instructor.inquiryEmail': 'ins@example.com',
  'recruit.instructor.inquiryContact': '강사담당',
  'recruitInstructor.detailInfo.programDescription': '<p>강사 설명</p>',
}

const volunteerKv = {
  'recruit.volunteer.announcementPublished': 'published',
  'recruit.volunteer.interviewRequired': 'yes',
  'recruit.volunteer.recruitRangeSeal': RANGE,
  'recruit.volunteer.programRangeSeal': PROGRAM_RANGE,
  'recruit.volunteer.volunteerTargets': ['university'],
  'recruit.volunteer.volunteerTargetDetail': '대학생',
  'recruit.volunteer.inquiryTel': '02-333-3333',
  'recruit.volunteer.inquiryEmail': 'vol@example.com',
  'recruit.volunteer.inquiryContact': '봉사담당',
  'recruit.volunteer.docDeadlineIso': '2026-05-10T00:00:00.000Z',
  'recruit.volunteer.interviewRangeSeal': RANGE,
  'recruit.volunteer.interview.selectedSlotKeys': ['1-2'],
  'recruitVolunteer.detailInfo.programDescription': '<p>봉사 설명</p>',
}

describe('모집 CREATE RHF Independent vs Legacy overlay apply', () => {
  it('recruit-detailinfo-reseed-gap 은 상세 GET 시드 수정 후 keep_current 이다', () => {
    const item = OVERLAY_PHASE0_KNOWN_DIFFS.find(row => row.id === 'recruit-detailinfo-reseed-gap')
    expect(item?.change).toBe('keep_current')
  })

  it('기관 모집 nested·persist 는 RHF kv 를 따른다', () => {
    const ui = createDefaultRegistrationWizardUiValues({
      participant: { organization: true, individual: false, teacherInstructor: false, volunteer: false },
    })
    ui.programTitleKo = '기관모집'
    ui.recruitmentKv = institutionKv
    const rhf = buildGeneralProgramCreateFromWizardRhf({ id: 'r-org', uiValues: ui })
    const legacy = applyGeneralRecruitOverlayToProgram(rhf.program, { 'recruit.inquiryTel': 'STALE' }, {
      preferOverlay: true,
    })
    expect(rhf.persistOverlay['recruit.inquiryTel']).toBe('02-111-1111')
    expect(rhf.program.generalCommonInfo?.participantRecruitmentInfo?.inquiryTel).toBe('02-111-1111')
    expect(rhf.program.generalCommonInfo?.participantRecruitmentInfo?.programDescription).toBe(
      '<p>기관 설명</p>'
    )
    expect(legacy.generalCommonInfo?.participantRecruitmentInfo?.inquiryTel).toBe('STALE')
    const request = mapGeneralProgramToCreateRequest(rhf.program)
    expect(request.autoApplyDefaultFormBindings).toBe(true)
    expect(JSON.stringify(rhf.persistOverlay).includes('application.')).toBe(false)
  })

  it('개인·강사·봉사자·복수 유형 persist 가 섞이지 않는다', () => {
    const ui = createDefaultRegistrationWizardUiValues({
      participant: {
        organization: true,
        individual: true,
        teacherInstructor: true,
        volunteer: true,
      },
    })
    ui.programTitleKo = '복수모집'
    ui.recruitmentKv = { ...institutionKv, ...individualKv, ...instructorKv, ...volunteerKv }
    const rhf = buildGeneralProgramCreateFromWizardRhf({ id: 'r-multi', uiValues: ui })
    expect(rhf.persistOverlay['recruit.inquiryTel']).toBe('02-111-1111')
    expect(rhf.persistOverlay['recruit.individual.inquiryTel']).toBe('010-0000-0000')
    expect(rhf.persistOverlay['recruit.instructor.inquiryTel']).toBe('02-222-2222')
    expect(rhf.persistOverlay['recruit.volunteer.inquiryTel']).toBe('02-333-3333')
    expect(rhf.program.generalCommonInfo?.instructorRecruitmentInfo?.inquiryTel).toBe('02-222-2222')
    expect(rhf.program.generalCommonInfo?.volunteerRecruitmentInfo?.inquiryTel).toBe('02-333-3333')
    expect(rhf.program.generalVolunteerInterviewEnabled).toBe(true)
  })

  it('커리큘럼/일정 단일·복수 CREATE에 기관 한도·application 키가 섞이지 않는다', () => {
    for (const programType of ['curriculum', 'schedule'] as const) {
      for (const sessionRoundType of ['single', 'multi'] as const) {
        const ui = createDefaultRegistrationWizardUiValues({
          programType,
          sessionRoundType,
          participant: {
            organization: true,
            individual: false,
            teacherInstructor: false,
            volunteer: false,
          },
        })
        ui.programTitleKo = `${programType}-${sessionRoundType}`
        ui.recruitmentKv = {
          ...institutionKv,
          'recruit.maxScheduleCount': 2,
          'recruit.maxSessionsPerDay': 1,
        }
        const rhf = buildGeneralProgramCreateFromWizardRhf({
          id: `r-${programType}-${sessionRoundType}`,
          uiValues: ui,
        })
        expect(rhf.persistOverlay['recruit.maxAssignableInstructors']).toBe(3)
        expect(rhf.program.generalCommonInfo?.participantRecruitmentInfo?.maxAssignableInstructors).toBe(
          3
        )
        expect(JSON.stringify(rhf.persistOverlay).includes('application.')).toBe(false)
        expect(rhf.createRequest.formBindings).toBeUndefined()
        expect(rhf.createRequest.autoApplyDefaultFormBindings).toBe(true)
      }
    }
  })

  it('봉사자 면접 no 이면 면접 슬롯을 nested schedule 에 넣지 않는다', () => {
    const ui = createDefaultRegistrationWizardUiValues({
      participant: {
        organization: false,
        individual: false,
        teacherInstructor: false,
        volunteer: true,
      },
    })
    ui.programTitleKo = '면접없음'
    ui.recruitmentKv = {
      ...volunteerKv,
      'recruit.volunteer.interviewRequired': 'no',
    }
    const rhf = buildGeneralProgramCreateFromWizardRhf({ id: 'r-vol-no', uiValues: ui })
    expect(rhf.program.generalVolunteerInterviewEnabled).toBe(false)
    expect(rhf.program.generalCommonInfo?.volunteerInterviewScheduleInfo).toBeUndefined()
  })
})
