import { describe, expect, it } from 'vitest'
import { collectRegistrationWizardApplicationPhaseIncompleteKeys } from '@/features/program/shared/lib/collect-registration-wizard-incomplete-keys'
import { createDefaultTrainedTeachersRegistrationRhfValues } from './registration-rhf-values'
import { listIncompleteTrainedTeachersApplicationRequiredFields } from './trained-teachers-application-required-fields'

describe('TT 신청 검증 가드 정책', () => {
  it('등록 완료 신청 단계 검사는 제3자 동의만 보고 RHF basicInfo를 요구하지 않는다', () => {
    const keys = collectRegistrationWizardApplicationPhaseIncompleteKeys({
      program: {
        id: 'tt-guard',
        sponsorId: '',
        title: 'guard',
        type: 'offline',
        format: 'workshop',
        category: 'school',
        description: '',
        startDate: '2026-04-01',
        endDate: '2026-12-31',
        applicationStartDate: '2026-03-01',
        applicationEndDate: '2026-03-31',
        status: 'pending',
        lifecycleStatus: 'recruiting_students',
        rounds: [],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    })
    expect(keys.every(key => key.includes('thirdParty') || key.includes('ThirdParty') || key.includes('recipient'))).toBe(
      true
    )
    expect(keys.some(key => key.includes('application.trainedTeachers.basicInfo'))).toBe(false)
  })

  it('RHF application validator는 제한 초과만 보고 숨김 희망 일정을 필수로 만들지 않는다', () => {
    const values = createDefaultTrainedTeachersRegistrationRhfValues({
      educationStructure: 'schedule',
      sessionRound: 'multi',
    })
    expect(listIncompleteTrainedTeachersApplicationRequiredFields(values)).toEqual([])
    values.educationStructure = 'curriculum'
    values.sessionRound = 'single'
    values.recruitment.maxClassCount = 1
    values.application.basicInfo.classCount = '4'
    expect(listIncompleteTrainedTeachersApplicationRequiredFields(values)).toContain(
      'application.trainedTeachers.basicInfo.classCount'
    )
  })
})
