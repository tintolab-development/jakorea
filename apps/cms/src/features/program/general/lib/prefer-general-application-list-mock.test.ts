import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { shouldPreferGeneralApplicationListMock } from './prefer-general-application-list-mock'

function individualProgram(id: string): Program {
  return {
    id,
    generalProgramAudience: 'individual',
    generalParticipantInterviewEnabled: true,
  } as Program
}

describe('shouldPreferGeneralApplicationListMock', () => {
  it('숫자형 API 프로그램은 면접 활성화 여부와 무관하게 remote를 사용한다', () => {
    expect(shouldPreferGeneralApplicationListMock(individualProgram('168006'))).toBe(false)
  })

  it('general-prog FE 시드는 mock을 유지한다', () => {
    expect(
      shouldPreferGeneralApplicationListMock(individualProgram('general-prog-interview'))
    ).toBe(true)
  })
})
