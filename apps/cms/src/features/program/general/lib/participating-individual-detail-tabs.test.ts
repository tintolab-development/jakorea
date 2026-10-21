import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  getParticipantDetailTabKeys,
  normalizeParticipantDetailTab,
} from './participating-individual-detail-tabs'

function program(overrides: Partial<Program> = {}): Program {
  return {
    id: 'program-1',
    sponsorId: 'sponsor-1',
    title: '테스트 프로그램',
    type: 'offline',
    format: 'workshop',
    category: 'individual',
    rounds: [],
    startDate: '',
    endDate: '',
    status: 'active',
    generalProgramAudience: 'individual',
    generalParticipantTypes: ['individual'],
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

describe('참여자 상세 탭 capability', () => {
  it('단일 회차에서는 과제 관리 탭을 숨기고 과제 딥링크를 신청 정보로 정규화한다', () => {
    const single = program({ generalProgramSessionRound: 'single' })

    expect(getParticipantDetailTabKeys(single)).toEqual(['application', 'attendance', 'settlement'])
    expect(normalizeParticipantDetailTab('assignments', single)).toBe('application')
  })

  it('복수 회차에서는 과제 관리 탭과 딥링크를 허용한다', () => {
    const multi = program({ generalProgramSessionRound: 'multi' })

    expect(getParticipantDetailTabKeys(multi)).toContain('assignments')
    expect(normalizeParticipantDetailTab('assignments', multi)).toBe('assignments')
  })

  it('프로그램을 아직 로드하지 않은 동안에는 기존 탭 목록을 보존한다', () => {
    expect(getParticipantDetailTabKeys()).toContain('assignments')
    expect(normalizeParticipantDetailTab('assignments')).toBe('assignments')
  })
})
