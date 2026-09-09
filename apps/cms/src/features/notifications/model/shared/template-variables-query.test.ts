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
  it('프로그램 + 참여 유형을 넘긴다', () => {
    expect(
      buildNotificationTemplateVariablesQuery({
        programId: 162371,
        recipientTypeMode: 'participation',
        typeValue: 'participant',
        toParticipantTypeApi: toParticipant,
        toMemberTypeApi: toMember,
      })
    ).toEqual({ programId: 162371, participantType: 'PARTICIPANT' })
  })

  it('프로그램 미선택이면 memberType만 넘긴다', () => {
    expect(
      buildNotificationTemplateVariablesQuery({
        programId: undefined,
        recipientTypeMode: 'member',
        typeValue: 'general',
        toParticipantTypeApi: toParticipant,
        toMemberTypeApi: toMember,
      })
    ).toEqual({ memberType: 'GENERAL' })
  })

  it('유형 필터가 없으면 programId만 넘긴다', () => {
    expect(
      buildNotificationTemplateVariablesQuery({
        programId: 10,
        recipientTypeMode: 'participation',
        typeValue: '',
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
