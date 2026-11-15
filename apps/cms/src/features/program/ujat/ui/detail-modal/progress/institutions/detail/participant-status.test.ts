import { describe, expect, it } from 'vitest'
import {
  canRequestUjatInstitutionGiveUp,
  isUjatInstitutionParticipantGivenUp,
  readUjatInstitutionParticipantState,
} from './participant-status'

describe('UJAT 참여 기관 participant 상태', () => {
  it('상세 응답의 두 필드를 읽고, 없으면 null로 둔다', () => {
    expect(
      readUjatInstitutionParticipantState({
        participantStatus: ' ACTIVE ',
        participantAvailableActions: ['VIEW', 'GIVE_UP'],
      })
    ).toEqual({
      participantStatus: 'ACTIVE',
      participantAvailableActions: ['VIEW', 'GIVE_UP'],
      participantAvailableActionsProvided: true,
    })
    expect(readUjatInstitutionParticipantState({})).toEqual({
      participantStatus: null,
      participantAvailableActions: null,
      participantAvailableActionsProvided: false,
    })
    expect(
      readUjatInstitutionParticipantState({ participantStatus: null, participantAvailableActions: null })
    ).toEqual({
      participantStatus: null,
      participantAvailableActions: null,
      participantAvailableActionsProvided: true,
    })
  })

  it('서버 isAlreadyGivenUp 값만 포기로 본다', () => {
    for (const status of ['GIVE_UP', 'gave_up', 'WITHDRAWN', 'WITHDRAWN_AFTER_START']) {
      expect(isUjatInstitutionParticipantGivenUp(status)).toBe(true)
    }
    for (const status of ['APPROVED', 'ACTIVE', 'COMPLETED', null]) {
      expect(isUjatInstitutionParticipantGivenUp(status)).toBe(false)
    }
  })

  it('participantAvailableActions에 GIVE_UP이 있을 때만 활동 포기를 허용한다', () => {
    expect(
      canRequestUjatInstitutionGiveUp({
        participantStatus: 'ACTIVE',
        participantAvailableActions: ['VIEW', 'GIVE_UP'],
        participantAvailableActionsProvided: true,
      })
    ).toBe(true)
    expect(
      canRequestUjatInstitutionGiveUp({
        participantStatus: 'GIVE_UP',
        participantAvailableActions: ['VIEW'],
        participantAvailableActionsProvided: true,
      })
    ).toBe(false)
    expect(
      canRequestUjatInstitutionGiveUp({
        participantStatus: null,
        participantAvailableActions: null,
        participantAvailableActionsProvided: true,
      })
    ).toBe(false)
  })

  it('필드 추가 전 서버 응답(키 없음)이면 막지 않고 서버 검증에 맡긴다', () => {
    expect(
      canRequestUjatInstitutionGiveUp(readUjatInstitutionParticipantState({ participantId: 1 }))
    ).toBe(true)
  })
})
