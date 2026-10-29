import { beforeEach, describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  buildEconomyRegistrationOverlayFromProgram,
  readEconomyRegistrationOverlayForSave,
  seedEconomyRegistrationOverlayFromProgram,
  writeEconomyRegistrationOverlayFromProgramDraft,
} from './registration-overlay-sync'
import { companySchoolCompatibilityOverlayFromDetailEditValues } from './detail-form-compatibility-overlay'
import { resolveCompanySchoolDetailSaveLiveFormValues } from './registration-overlay-sync'
import {
  detailEditValuesToProgramPatch,
  narrowProgramDetailPatchForCommonInfoSave,
  programToDetailEditValues,
  type ProgramDetailEditFormValues,
} from '@/features/program/shared/model/program-detail-edit-schema'
import {
  patchProgramRegistrationOverlay,
  resetProgramRegistrationOverlay,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'

const B = 'economyRegistration.basicInfo'

function baseProgram(): Program {
  const program = {
    id: 'cs-live',
    sponsorId: '163388',
    title: '1사1교',
    mainTitle: '1사1교',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '',
    startDate: '2026-04-01T00:00:00.000Z',
    endDate: '2026-10-31T00:00:00.000Z',
    status: 'pending',
    generalVolunteers: 0,
    businessArea: '경제금융',
    ipOwned: 'JA',
    courseDeliveredBy: 'JA',
    ips: 'Prepare',
    partnerInvolvement: true,
    detailedProgramId: '11',
    rounds: [],
    generalSurveyMenuKeys: ['survey'],
    generalCommonInfo: {
      detailedProgramName: 'OLD세부',
      announcementTitle: '공고',
      educationScheduleMode: 'period',
      educationScheduleLines: ['2026.04.01 ~ 2026.10.31'],
      wageGradeRows: [{ grade: '1급 강사비', pricing: '1시간 당 | 기본 : 100,000원' }],
      kpi: { finalParticipants: 10, instructorCount: 1, volunteerCount: 0, finalSchools: 1, finalClasses: 1 },
      curriculumSessions: [{ sessionLabel: '1차시', title: 'OLD단원', description: 'OLD내용' }],
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  } as unknown as Program
  return { ...program, registrationOverlay: buildEconomyRegistrationOverlayFromProgram(program) }
}

const LIVE_EDITS: Record<string, unknown> = {
  [`${B}.detailedProgramId`]: '22',
  [`${B}.detailedProgramName`]: 'NEW세부',
  [`${B}.businessField`]: 'career_employment',
  [`${B}.ipOwned`]: 'partner',
  [`${B}.courseDeliveredBy`]: 'jointly',
  [`${B}.ipsCategory`]: 'succeed',
  [`${B}.partnerInvolvement`]: 'no',
  [`${B}.educationCourse`]: 'digital_computer',
  [`${B}.sponsorId`]: '999',
  [`${B}.managerContactIds`]: ['777'],
  [`${B}.managerContactId`]: '777',
  [`${B}.surveyItems`]: { survey: false, satisfaction: true, lecture_evaluation: true },
  'economyRegistration.kpi.participantCount': 99,
  'economyRegistration.wageInfo.grade1Fee': 123456,
  'economyRegistration.educationCurriculum.session1.title': 'NEW단원',
  'economyRegistration.educationCurriculum.session1.description': 'NEW내용',
  'economyRegistration.educationScheduleSettings.dateRangeSeal': {
    start: '2026-06-01T00:00:00.000Z',
    end: '2026-06-30T00:00:00.000Z',
  },
}

/** program-detail-fullpage-modal handleInfoSave 의 overlay 재작성 순서를 그대로 재현 */
function runDetailInfoSave(program: Program, liftLive: boolean) {
  const values = programToDetailEditValues(program) as ProgramDetailEditFormValues
  if (liftLive) {
    Object.assign(
      values,
      resolveCompanySchoolDetailSaveLiveFormValues(readEconomyRegistrationOverlayForSave(), program)
    )
  }
  const patch = narrowProgramDetailPatchForCommonInfoSave(
    detailEditValuesToProgramPatch(values, program)
  )
  const formCompat = companySchoolCompatibilityOverlayFromDetailEditValues(values)
  writeEconomyRegistrationOverlayFromProgramDraft({
    ...program,
    ...patch,
    generalCommonInfo: { ...program.generalCommonInfo, ...patch.generalCommonInfo },
    registrationOverlay: { ...(program.registrationOverlay ?? {}), ...formCompat },
  })
  return { patch, overlay: readEconomyRegistrationOverlayForSave() }
}

describe('1사1교 상세 공통정보 저장 — 등록 단락 overlay 수정값 보존', () => {
  beforeEach(() => {
    resetProgramRegistrationOverlay()
  })

  it('수정 전: 단락 수정값이 폼 기준 재작성에 덮여 이전 값으로 회귀한다(재현)', () => {
    const program = baseProgram()
    seedEconomyRegistrationOverlayFromProgram(program)
    patchProgramRegistrationOverlay(LIVE_EDITS)
    const { overlay } = runDetailInfoSave(program, false)
    expect(overlay[`${B}.detailedProgramName`]).toBe('OLD세부')
    expect(overlay['economyRegistration.kpi.participantCount']).toBe(10)
  })

  it('단락 수정값이 overlay와 PATCH 필드에 모두 남는다', () => {
    const program = baseProgram()
    seedEconomyRegistrationOverlayFromProgram(program)
    patchProgramRegistrationOverlay(LIVE_EDITS)
    const { patch, overlay } = runDetailInfoSave(program, true)
    for (const [key, value] of Object.entries(LIVE_EDITS)) {
      expect(overlay[key], key).toEqual(value)
    }
    expect(patch.detailedProgramId).toBe('22')
    expect(patch.generalCommonInfo?.detailedProgramName).toBe('NEW세부')
    expect(patch.sponsorId).toBe('999')
    expect(patch.ipOwned).toBe('Partner')
    expect(patch.courseDeliveredBy).toBe('Jointly')
    expect(patch.ips).toBe('Succeed')
    expect(patch.partnerInvolvement).toBe(false)
    expect(patch.generalSurveyMenuKeys).toEqual(
      expect.arrayContaining(['satisfaction', 'lecture_evaluation'])
    )
    expect(patch.generalSurveyMenuKeys).not.toContain('survey')
    expect(patch.generalCommonInfo?.kpi?.finalParticipants).toBe(99)
    expect(patch.generalCommonInfo?.curriculumSessions?.[0]?.title).toBe('NEW단원')
  })

  it('단락을 안 건드리면 폼에 올릴 값이 없다(폼 경로 저장 유지)', () => {
    const program = baseProgram()
    seedEconomyRegistrationOverlayFromProgram(program)
    expect(
      resolveCompanySchoolDetailSaveLiveFormValues(readEconomyRegistrationOverlayForSave(), program)
    ).toEqual({})
  })
})
