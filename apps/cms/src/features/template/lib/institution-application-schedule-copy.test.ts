import { describe, expect, it } from 'vitest'
import type { InstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import {
  resolveInstitutionFixedScheduleDescription,
  resolveInstitutionPreferredScheduleDescription,
  resolveInstitutionPreferredScheduleInitialBlockCount,
  resolveInstitutionPreferredScheduleMaxBlocks,
  shouldUseInstitutionFixedScheduleCardCopy,
  shouldUseInstitutionPreferredScheduleCardCopy,
} from './institution-application-schedule-copy'

const CURRICULUM_MULTI_PERIOD: InstitutionApplicationProgramBridge = {
  preEducationNoticeRequired: true,
  educationStructure: 'curriculum',
  sessionRound: 'multi',
  educationScheduleMode: 'period',
}

describe('institution preferred schedule card copy', () => {
  it('커리큘럼형 + 복수 회차 + 기간 지정은 시안 설명과 기본 2지망을 쓴다', () => {
    expect(shouldUseInstitutionPreferredScheduleCardCopy(CURRICULUM_MULTI_PERIOD)).toBe(true)
    expect(resolveInstitutionPreferredScheduleDescription(CURRICULUM_MULTI_PERIOD)).toBe(
      '교육을 희망하는 날짜와 수업 시간을 모두 작성해 주세요. 수업은 1일, N차시 운영됩니다. (최대 N개까지 희망 일정 신청이 가능합니다.)'
    )
    expect(resolveInstitutionPreferredScheduleMaxBlocks(CURRICULUM_MULTI_PERIOD)).toBe(10)
    expect(resolveInstitutionPreferredScheduleInitialBlockCount(CURRICULUM_MULTI_PERIOD)).toBe(2)
  })

  it('모집 상한이 있으면 설명·지망 수에 반영한다', () => {
    const bridge: InstitutionApplicationProgramBridge = {
      ...CURRICULUM_MULTI_PERIOD,
      maxSessionsPerDay: 3,
      maxScheduleCount: 4,
    }
    expect(resolveInstitutionPreferredScheduleDescription(bridge)).toBe(
      '교육을 희망하는 날짜와 수업 시간을 모두 작성해 주세요. 수업은 1일, 3차시 운영됩니다. (최대 4개까지 희망 일정 신청이 가능합니다.)'
    )
    expect(resolveInstitutionPreferredScheduleMaxBlocks(bridge)).toBe(4)
    expect(resolveInstitutionPreferredScheduleInitialBlockCount(bridge)).toBe(2)
  })

  it('날짜 지정(고정 일정)이면 희망 일정 카드 카피를 쓰지 않는다', () => {
    const bridge: InstitutionApplicationProgramBridge = {
      ...CURRICULUM_MULTI_PERIOD,
      educationScheduleMode: 'date',
      educationScheduleLines: ['26년 4월 20일(월) 9:30 ~ 12:20', '26년 4월 27일(월) 13:00 ~ 15:50'],
    }
    expect(shouldUseInstitutionPreferredScheduleCardCopy(bridge)).toBe(false)
    expect(shouldUseInstitutionFixedScheduleCardCopy(bridge)).toBe(true)
    expect(resolveInstitutionFixedScheduleDescription(bridge)).toBe(
      'N차시*N회로 구성된 프로그램입니다. 진행 가능한 일정을 모두 선택해 주세요.'
    )
    expect(resolveInstitutionPreferredScheduleInitialBlockCount(bridge)).toBe(1)
  })

  it('날짜 지정 + 단일 회차는 1타임 배정 안내를 카드 설명으로 쓴다', () => {
    const bridge: InstitutionApplicationProgramBridge = {
      preEducationNoticeRequired: true,
      educationStructure: 'curriculum',
      sessionRound: 'single',
      educationScheduleMode: 'date',
      educationScheduleLines: [
        '26년 10월 13일(화) 13:30 ~ 15:30',
        '26년 10월 13일(화) 9:30 ~ 11:30',
        '26년 10월 20일(화) 13:30 ~ 15:30',
      ],
    }
    expect(shouldUseInstitutionFixedScheduleCardCopy(bridge)).toBe(true)
    expect(resolveInstitutionFixedScheduleDescription(bridge)).toBe(
      '진행 가능한 일정을 모두 선택해 주세요. 모두 동일한 커리큘럼이며, 선택한 일정 중 1타임에 배정됩니다.'
    )
  })
})
