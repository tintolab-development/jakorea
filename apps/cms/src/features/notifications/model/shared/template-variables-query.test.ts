import { describe, expect, it } from 'vitest'
import {
  buildNotificationTemplateVariablesQuery,
  inferUniqueRecipientTypeValue,
} from './template-variables-query'

const toParticipant = (value: string) =>
  value === 'participant' ? 'PARTICIPANT' : value === 'instructor' ? 'INSTRUCTOR' : undefined

const toMember = (value: string) =>
  value === 'general' ? 'GENERAL' : value === 'school_teacher' ? 'SCHOOL_TEACHER' : undefined

describe('buildNotificationTemplateVariablesQuery', () => {
  it('FE-VAR-01 프로그램 + 참여 유형을 넘긴다', () => {
    expect(
      buildNotificationTemplateVariablesQuery({
        programId: 162371,
        participantTypeValue: 'participant',
        toParticipantTypeApi: toParticipant,
        toMemberTypeApi: toMember,
      })
    ).toEqual({ programId: 162371, participantType: 'PARTICIPANT' })
  })

  it('FE-VAR-03 유일 참여·회원 유형을 함께 넘긴다', () => {
    expect(
      buildNotificationTemplateVariablesQuery({
        programId: 162371,
        participantTypeValue: 'participant',
        memberTypeValue: 'school_teacher',
        toParticipantTypeApi: toParticipant,
        toMemberTypeApi: toMember,
      })
    ).toEqual({
      programId: 162371,
      participantType: 'PARTICIPANT',
      memberType: 'SCHOOL_TEACHER',
    })
  })

  it('FE-VAR-05 교사 회원만 확정되면 memberType을 넘긴다', () => {
    expect(
      buildNotificationTemplateVariablesQuery({
        programId: 10,
        memberTypeValue: 'school_teacher',
        toParticipantTypeApi: toParticipant,
        toMemberTypeApi: toMember,
      })
    ).toEqual({ programId: 10, memberType: 'SCHOOL_TEACHER' })
  })

  it('프로그램 미선택이면 memberType만 넘긴다', () => {
    expect(
      buildNotificationTemplateVariablesQuery({
        programId: undefined,
        memberTypeValue: 'general',
        toParticipantTypeApi: toParticipant,
        toMemberTypeApi: toMember,
      })
    ).toEqual({ memberType: 'GENERAL' })
  })

  it('유형 필터가 없으면 programId만 넘긴다', () => {
    expect(
      buildNotificationTemplateVariablesQuery({
        programId: 10,
        toParticipantTypeApi: toParticipant,
        toMemberTypeApi: toMember,
      })
    ).toEqual({ programId: 10 })
  })

  it('FE-VAR-11 혼합 유형이면 해당 필터를 생략한다', () => {
    expect(
      buildNotificationTemplateVariablesQuery({
        programId: 10,
        participantTypeValue: inferUniqueRecipientTypeValue(['participant', 'instructor']),
        memberTypeValue: inferUniqueRecipientTypeValue(['general', 'school_teacher']),
        toParticipantTypeApi: toParticipant,
        toMemberTypeApi: toMember,
      })
    ).toEqual({ programId: 10 })
  })
})

describe('inferUniqueRecipientTypeValue', () => {
  it('단일 유형만 반환한다', () => {
    expect(inferUniqueRecipientTypeValue(['participant', 'participant'])).toBe('participant')
    expect(inferUniqueRecipientTypeValue(['participant', 'instructor'])).toBeUndefined()
    expect(inferUniqueRecipientTypeValue(['', undefined])).toBeUndefined()
  })
})
