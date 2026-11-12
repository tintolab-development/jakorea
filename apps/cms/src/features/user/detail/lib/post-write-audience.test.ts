import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  buildPostWriteAudienceOptions,
  buildPostWriteVisibilityType,
  defaultPostWriteAudience,
  isPostWriteAudienceChanged,
  postWriteAudienceFromStored,
  postWriteAudienceLabel,
  reconcilePostWriteAudienceSelection,
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

  it('저장값 ALL(all)이면 수정 폼에서 전체·참여자·강사·봉사자 모두 체크', () => {
    const program = programStub({ generalProgramAudience: 'organization' })
    expect(postWriteAudienceFromStored(['all'], program)).toEqual([
      'all',
      'teacher',
      'instructor',
      'volunteer',
    ])
  })

  it('전체 체크 시 나머지 옵션도 함께 선택된다', () => {
    const program = programStub({ generalProgramAudience: 'organization' })
    expect(reconcilePostWriteAudienceSelection(['all'], program)).toEqual(
      defaultPostWriteAudience(program)
    )
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

describe('isPostWriteAudienceChanged / postWriteAudienceLabel (QA-0093)', () => {
  it('저장값과 같으면(순서 무관) 변경 아님', () => {
    expect(isPostWriteAudienceChanged(['INSTRUCTOR', 'TEACHER'], ['teacher', 'instructor'])).toBe(
      false
    )
    expect(isPostWriteAudienceChanged(['ALL'], defaultPostWriteAudience())).toBe(false)
  })

  it('항목을 빼거나 더하면 변경', () => {
    expect(isPostWriteAudienceChanged(['ALL'], ['teacher', 'instructor'])).toBe(true)
    expect(isPostWriteAudienceChanged(['TEACHER'], ['teacher', 'volunteer'])).toBe(true)
  })

  it('확인창 라벨', () => {
    expect(postWriteAudienceLabel(defaultPostWriteAudience())).toBe('전체')
    expect(postWriteAudienceLabel(['volunteer', 'teacher'])).toBe('참여자, 봉사자')
  })
})
