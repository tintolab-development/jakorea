import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  buildPostWriteAudienceOptions,
  buildPostWriteVisibilityType,
  defaultPostWriteAudience,
  resolveParticipantAudienceApiKey,
} from './post-write-audience'

function programStub(partial: Partial<Program>): Program {
  return {
    id: 'prog-1',
    title: '테스트',
    ...partial,
  } as Program
}

describe('post-write-audience', () => {
  it('UI 라벨은 항상 참여자이고, 기관 프로그램 API 키는 teacher', () => {
    const program = programStub({
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution'],
    })
    expect(resolveParticipantAudienceApiKey(program)).toBe('teacher')
    expect(buildPostWriteAudienceOptions(program)).toEqual([
      { label: '전체', value: 'all' },
      { label: '참여자', value: 'teacher' },
      { label: '강사', value: 'instructor' },
      { label: '봉사자', value: 'volunteer' },
    ])
  })

  it('개인 프로그램 참여자 API 키는 student', () => {
    const program = programStub({
      generalProgramAudience: 'individual',
      generalParticipantTypes: ['individual'],
    })
    expect(resolveParticipantAudienceApiKey(program)).toBe('student')
    expect(buildPostWriteAudienceOptions(program).find(o => o.label === '참여자')?.value).toBe(
      'student'
    )
  })

  it('visibilityType — 전체 포함 시 ALL, 참여자만이면 TEACHER/STUDENT', () => {
    expect(buildPostWriteVisibilityType(['all', 'teacher', 'instructor'])).toBe('ALL')
    expect(buildPostWriteVisibilityType(['teacher'])).toBe('TEACHER')
    expect(buildPostWriteVisibilityType(['student', 'instructor'])).toBe('STUDENT,INSTRUCTOR')
  })

  it('기본 선택은 프로그램 유형에 맞는 참여자 API 키를 포함한다', () => {
    expect(defaultPostWriteAudience(programStub({ generalProgramAudience: 'organization' }))).toEqual([
      'all',
      'teacher',
      'instructor',
      'volunteer',
    ])
    expect(defaultPostWriteAudience(programStub({ generalProgramAudience: 'individual' }))).toEqual([
      'all',
      'student',
      'instructor',
      'volunteer',
    ])
  })
})
