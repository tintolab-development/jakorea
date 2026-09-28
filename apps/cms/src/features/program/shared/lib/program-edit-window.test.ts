import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  isCommonInfoEditPeriodOpen,
  isProgramFormBindingWriteLocked,
  isProgramRecruitmentTypeLocked,
  isRecruitmentStartLocked,
  resolveRecruitmentTypeForFormBinding,
} from './program-edit-window'

function programWith(recruitments: Program['programRecruitments']): Program {
  return {
    id: '1',
    sponsorId: 'sponsor-1',
    title: 't',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    rounds: [],
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'active',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    programRecruitments: recruitments,
  } as Program
}

describe('isCommonInfoEditPeriodOpen', () => {
  it('사업 종료일 당일 한국 시간은 저장 가능하고 다음 날 00:00부터 불가하다', () => {
    const end = '2026-11-07'
    expect(isCommonInfoEditPeriodOpen(end, new Date('2026-11-07T14:59:00+09:00'))).toBe(true)
    expect(isCommonInfoEditPeriodOpen(end, new Date('2026-11-08T00:00:00+09:00'))).toBe(false)
  })

  it('종료일이 없으면 막지 않는다', () => {
    expect(isCommonInfoEditPeriodOpen(undefined, new Date('2026-11-08T00:00:00+09:00'))).toBe(
      true
    )
  })
})

describe('isRecruitmentStartLocked', () => {
  it('startAt이 속한 분부터 잠그고, 1분 전과 null은 열어둡니다', () => {
    const startAt = '2026-10-01T10:15:40+09:00'
    expect(isRecruitmentStartLocked(startAt, new Date('2026-10-01T10:14:59+09:00'))).toBe(false)
    expect(isRecruitmentStartLocked(startAt, new Date('2026-10-01T10:15:00+09:00'))).toBe(true)
    expect(isRecruitmentStartLocked(startAt, new Date('2026-10-01T10:16:00+09:00'))).toBe(true)
    expect(isRecruitmentStartLocked(null, new Date('2026-10-01T10:16:00+09:00'))).toBe(false)
    expect(isRecruitmentStartLocked(undefined, new Date('2026-10-01T10:16:00+09:00'))).toBe(false)
  })
})

describe('isProgramRecruitmentTypeLocked', () => {
  it('지난 유형만 잠그고 다른 유형은 연다', () => {
    const program = programWith([
      { recruitmentType: 'PARTICIPANT', startAt: '2020-01-01T00:00:00+09:00' },
      { recruitmentType: 'INSTRUCTOR', startAt: '2099-01-01T00:00:00+09:00' },
      { recruitmentType: 'VOLUNTEER', startAt: null },
    ])
    const now = new Date('2026-09-28T12:00:00+09:00')
    expect(isProgramRecruitmentTypeLocked(program, 'PARTICIPANT', now)).toBe(true)
    expect(isProgramRecruitmentTypeLocked(program, 'INSTRUCTOR', now)).toBe(false)
    expect(isProgramRecruitmentTypeLocked(program, 'VOLUNTEER', now)).toBe(false)
  })
})

describe('resolveRecruitmentTypeForFormBinding', () => {
  it('바인딩 값을 모집 유형으로 맞춘다', () => {
    expect(resolveRecruitmentTypeForFormBinding('SCHOOL', null)).toBe('PARTICIPANT')
    expect(resolveRecruitmentTypeForFormBinding(null, 'TEACHER')).toBe('INSTRUCTOR')
    expect(resolveRecruitmentTypeForFormBinding('STUDENT', null)).toBe('VOLUNTEER')
    expect(resolveRecruitmentTypeForFormBinding('SURVEY', null)).toBeNull()
  })

  it('모집이 시작된 바인딩만 쓰기를 막는다', () => {
    const program = programWith([
      { recruitmentType: 'INSTRUCTOR', startAt: '2020-01-01T00:00:00+09:00' },
    ])
    const now = new Date('2026-09-28T12:00:00+09:00')
    expect(isProgramFormBindingWriteLocked(program, 'TEACHER', null, now)).toBe(true)
    expect(isProgramFormBindingWriteLocked(program, 'ORGANIZATION', null, now)).toBe(false)
  })
})
