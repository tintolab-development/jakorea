import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { programToDetailEditValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { resolvePersistedProgramTargetLevels } from '@/features/program/shared/lib/program-detail-info-constants'
import {
  parseDisplayPeriodLabelToIsoRange,
  parseTargetLevelsFromDisplayLabel,
  programToRecruitmentTabEditValues,
  resolveGeneralProgramForRecruitmentEdit,
} from './general-program-recruitment-edit-seed'

describe('resolveGeneralProgramForRecruitmentEdit', () => {
  it('participantRecruitmentInfo 라벨만 있을 때 targetLevels·기간을 폼 시드용 program에 채운다', () => {
    const program = {
      id: 'general-prog-1',
      title: '테스트',
      type: 'offline',
      format: 'workshop',
      category: 'school',
      description: '공통 설명',
      generalCommonInfo: {
        participantRecruitmentInfo: {
          educationTarget: '고등학교',
          educationTargetDetail: '모집 상세',
          recruitmentPeriodLabel: '2025-12-08 ~ 2026-01-16',
          operationPeriodLabel: '2026-04-01 ~ 2026-12-31',
          inquiryTel: '02-6085-6028',
          inquiryEmail: 'recruit@jakorea.org',
          contactOrganizationName: '모집 문의처',
          programDescription: '모집 전용 설명',
        },
      },
    } as Program

    const merged = resolveGeneralProgramForRecruitmentEdit(program)
    expect(merged.targetLevels).toEqual(['high'])
    expect(merged.educationTargetDetail).toBe('모집 상세')
    expect(merged.applicationStartDate).toBeTruthy()
    expect(merged.applicationEndDate).toBeTruthy()
    expect(merged.startDate).toBeTruthy()
    expect(merged.endDate).toBeTruthy()

    const values = programToRecruitmentTabEditValues(program, 'participant')
    expect(values.targetLevels).toEqual(['high'])
    expect(values.educationTargetDetail).toBe('모집 상세')
    expect(values.description).toBe('모집 전용 설명')
    expect(values.recruitmentContactOrganizationName).toBe('모집 문의처')
    expect(values.contactPhone).toBe('02-6085-6028')
  })

  it('강사 모집 대상 라벨을 instructorTargets로 복원한다', () => {
    const program = {
      id: 'general-prog-2',
      title: '강사',
      type: 'offline',
      format: 'workshop',
      category: 'school',
      description: '',
      generalCommonInfo: {
        instructorRecruitmentInfo: {
          recruitmentTarget: '성인, 대학생',
          recruitmentTargetDetail: '상세',
          recruitmentPeriodLabel: '2026-01-01 ~ 2026-01-31',
          programDescription: '강사 모집 설명',
        },
      },
    } as Program

    const values = programToRecruitmentTabEditValues(program, 'instructor')
    expect(values.instructorTargets).toEqual(['성인', '대학생'])
    expect(values.instructorTargetDetail).toBe('상세')
    expect(values.description).toBe('강사 모집 설명')
    expect(values.instructorApplicationStartDate).toBeTruthy()
  })

  it('1사1교 저장된 registrationOverlay 모집 대상을 edit 시드에 반영한다', () => {
    const program = {
      id: 'company-school-prog-1',
      title: '1사1교',
      type: 'offline',
      format: 'workshop',
      category: 'school',
      description: '',
      registrationOverlay: {
        'recruit.targetLevels': ['middle', 'high'],
        'recruit.targetLevelDetail': '중고등 상세',
      },
    } as unknown as Program

    const values = programToRecruitmentTabEditValues(program, 'participant')
    expect(values.targetLevels).toEqual(['middle', 'high'])
    expect(values.educationTargetDetail).toBe('중고등 상세')
  })

  it('조회 라벨이 더 많은 교육 대상이면 수정 시드는 컬럼 1개를 덮는다', () => {
    const program = {
      id: 'general-prog-multi-target',
      title: '복수 대상',
      type: 'offline',
      format: 'workshop',
      category: 'school',
      description: '',
      targetLevel: 'middle',
      targetLevels: ['middle'],
      generalCommonInfo: {
        participantRecruitmentInfo: {
          educationTarget: '중학교 1~3학년, 대학교 1~2학년',
        },
      },
      registrationOverlay: {
        'recruit.individual.targetLevels': ['middle', 'university'],
      },
    } as unknown as Program

    const values = programToRecruitmentTabEditValues(program, 'participant')
    expect(values.targetLevels).toEqual(['middle', 'university'])
  })

  it('기존 program 컬럼이 있으면 nested 라벨로 덮어쓰지 않는다', () => {
    const program = {
      id: 'general-prog-3',
      title: '유지',
      type: 'offline',
      format: 'workshop',
      category: 'school',
      description: '',
      targetLevels: ['middle'],
      applicationStartDate: '2026-02-01T00:00:00.000Z',
      generalCommonInfo: {
        participantRecruitmentInfo: {
          educationTarget: '고등학교',
          recruitmentPeriodLabel: '2025-01-01 ~ 2025-01-31',
        },
      },
    } as Program

    const merged = resolveGeneralProgramForRecruitmentEdit(program)
    expect(merged.targetLevels).toEqual(['middle'])
    expect(merged.applicationStartDate).toBe('2026-02-01T00:00:00.000Z')

    const values = programToDetailEditValues(merged)
    expect(values.targetLevels).toEqual(['middle'])
  })
})

describe('resolvePersistedProgramTargetLevels', () => {
  it('컬럼 1개여도 모집 라벨 복수를 컬럼 배열로 올린다', () => {
    expect(
      resolvePersistedProgramTargetLevels({
        targetLevel: 'elementary',
        targetLevels: ['elementary'],
        generalCommonInfo: {
          participantRecruitmentInfo: {
            educationTarget: '초등학교, 중학교, 대학(원)생',
          },
        },
      })
    ).toEqual(['elementary', 'middle', 'university'])
  })
})

describe('parse helpers', () => {
  it('parseTargetLevelsFromDisplayLabel', () => {
    expect(parseTargetLevelsFromDisplayLabel('초등, 중학교')).toEqual(['elementary', 'middle'])
    expect(parseTargetLevelsFromDisplayLabel('중학교 1~3학년, 대학교 1~2학년')).toEqual([
      'middle',
      'university',
    ])
  })

  it('parseDisplayPeriodLabelToIsoRange', () => {
    const range = parseDisplayPeriodLabelToIsoRange('2026. 04. 03(금) ~ 2026. 11. 20(금)')
    expect(range.start).toBeTruthy()
    expect(range.end).toBeTruthy()
  })
})
