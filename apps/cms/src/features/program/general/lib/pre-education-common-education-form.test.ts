import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { resolveGeneralProgramCommonInfo } from './detail-common-info-display'
import {
  generalCommonInfoEditValuesToProgramPatch,
  programToGeneralCommonInfoEditValues,
} from '@/features/program/general/model/common-info-edit-schema'

const SCHEDULE_FORM_KEY = 'generalRegistration.educationScheduleCurriculum.educationFormByDetail'
const CURRICULUM_FORM_KEY = 'generalRegistration.educationCurriculum.educationFormBySession'
const MULTI_COMMON_KEY = 'generalRegistration.typeSettings.multiCommonEducationForm'
const SINGLE_KEY = 'generalRegistration.typeSettings.singleEducationForm'

function baseProgram(overrides: Partial<Program> = {}): Program {
  return {
    id: 'pre-edu-common-1',
    sponsorId: 's1',
    title: '테스트',
    mainTitle: '테스트',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    startDate: '2026-03-01T00:00:00.000Z',
    endDate: '2026-12-31T00:00:00.000Z',
    status: 'pending',
    partnerInvolvement: false,
    generalProgramAudience: 'organization',
    generalParticipantTypes: ['school_institution'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as Program
}

/** BE COMMON 정규화 후 재조회: 교육 형태 맵은 {"0": ...}만 남는다. */
function scheduleCommonRefetch(): Program {
  return baseProgram({
    generalProgramEducationStructure: 'schedule',
    generalProgramSessionRound: 'multi',
    generalCommonInfo: {
      educationFormScheduleDetail: 'common',
      scheduleCurriculumPreEducation: true,
      scheduleDetails: [
        { scheduleLabel: '사전 교육', name: '사전 교육', educationFormLabel: '오프라인' },
        { scheduleLabel: '세부 일정 01', name: '일정 A', progressTimeSummary: '10:00 ~ 11:00' },
      ],
    },
    registrationOverlay: {
      [SCHEDULE_FORM_KEY]: { '0': 'offline' },
      [MULTI_COMMON_KEY]: 'hybrid',
    },
  })
}

describe('COMMON 재조회 overlay {"0":"offline"} 수화', () => {
  it('일정형: 사전 교육은 오프라인, 본 교육은 typeSettings 값', () => {
    const common = resolveGeneralProgramCommonInfo(scheduleCommonRefetch())
    expect(common.educationFormLabel).toBe('온/오프라인')
    expect(common.scheduleDetails?.[0]?.educationFormLabel).toBe('오프라인')
  })

  it('커리큘럼형: 사전 교육은 오프라인, 본 교육은 typeSettings 값', () => {
    const common = resolveGeneralProgramCommonInfo(
      baseProgram({
        generalProgramEducationStructure: 'curriculum',
        generalProgramSessionRound: 'single',
        generalCommonInfo: {
          educationFormScheduleDetail: 'common',
          curriculumSessions: [
            {
              sessionLabel: '사전 교육',
              title: '사전 교육',
              description: '',
              isPreEducation: true,
              educationFormLabel: '오프라인',
            },
            { sessionLabel: '1차시', title: '단원 1', description: '내용' },
          ],
        },
        registrationOverlay: {
          [CURRICULUM_FORM_KEY]: { '0': 'offline' },
          [SINGLE_KEY]: 'online',
        },
      })
    )
    expect(common.educationFormLabel).toBe('온라인')
    expect(common.curriculumSessions?.[0]?.educationFormLabel).toBe('오프라인')
  })

  it('수정 폼: 본 교육 형태는 typeSettings, 사전 교육은 0 값. 저장 시 0만 행 라벨로 나간다', () => {
    const program = scheduleCommonRefetch()
    const values = programToGeneralCommonInfoEditValues(program)
    expect(values.educationFormScheduleDetail).toBe('common')
    expect(values.educationForm).toBe('hybrid')
    const pre = values.scheduleDetails.find(d => d.blockKind === 'preEducation')
    expect(pre?.educationForm).toBe('offline')

    const patch = generalCommonInfoEditValuesToProgramPatch(values, program)
    const details = patch.generalCommonInfo?.scheduleDetails ?? []
    expect(patch.generalCommonInfo?.educationFormLabel).toBe('온/오프라인')
    expect(details[0]).toEqual(
      expect.objectContaining({ scheduleLabel: '사전 교육', educationFormLabel: '오프라인' })
    )
    expect(details.slice(1).every(d => d.educationFormLabel == null)).toBe(true)
  })
})
