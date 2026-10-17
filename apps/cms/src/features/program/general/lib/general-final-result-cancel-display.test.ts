import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import { mapApiFinalResultToSecondInterviewStatus } from '@/features/program/general/api/adapters/general-applications-adapters'
import { resolveGeneralEffectiveSecondInterviewStatus } from '@/features/program/general/lib/general-volunteer-interview2-display'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'

describe('final fail cancel — list/display state', () => {
  it('null finalResultStatus는 저장된 2차 결과 없음(불합격 아님)으로 매핑한다', () => {
    expect(mapApiFinalResultToSecondInterviewStatus(null)).toBeUndefined()
    expect(mapApiFinalResultToSecondInterviewStatus(undefined)).toBeUndefined()
    expect(mapApiFinalResultToSecondInterviewStatus('FAIL')).toBe('fail')
  })

  it('서류 PASS·final null이면 자동 계산 상태(면접 진행 대기 등)로 표시한다', () => {
    const row = {
      documentScreeningStatus: 'pass',
      interviewAssignmentStatus: 'assigned',
      secondInterviewScreeningStatus: undefined,
      assignedInterviewDateLabel: '2026.12.01',
      assignedInterviewTime: '10:00 ~ 11:00',
    } as GeneralVolunteerApplicantRow

    const now = dayjs('2026-11-01T09:00:00')
    expect(resolveGeneralEffectiveSecondInterviewStatus(row, now)).toBe('waiting')
  })
})
