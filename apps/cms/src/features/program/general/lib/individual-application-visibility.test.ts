import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  individualApplicationDecisionButtonLabels,
  isIndividualInterviewDocumentDecisionStage,
} from './individual-application-visibility'

function programWithInterview(interviewEnabled: boolean): Program {
  return {
    id: 'p-1',
    generalProgramAudience: 'individual',
    generalParticipantInterviewEnabled: interviewEnabled,
  } as Program
}

describe('individual application detail header CTAs', () => {
  it('면접 없는 개인 신청 상세 버튼은 참여 반려/승인', () => {
    expect(individualApplicationDecisionButtonLabels(false)).toEqual({
      reject: '참여 반려',
      approve: '참여 승인',
    })
    expect(isIndividualInterviewDocumentDecisionStage(programWithInterview(false), 'main')).toBe(
      false
    )
    expect(isIndividualInterviewDocumentDecisionStage(programWithInterview(false), 'doc1')).toBe(
      false
    )
  })

  it('면접 있음 1차 서류 상세만 서류 반려/승인', () => {
    expect(individualApplicationDecisionButtonLabels(true)).toEqual({
      reject: '서류 반려',
      approve: '서류 승인',
    })
    expect(isIndividualInterviewDocumentDecisionStage(programWithInterview(true), 'doc1')).toBe(true)
    expect(isIndividualInterviewDocumentDecisionStage(programWithInterview(true), 'main')).toBe(
      false
    )
  })
})
