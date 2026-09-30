import { describe, expect, it } from 'vitest'
import { stampTrainedTeachersSessionFields } from './stamp-session-fields'

describe('stampTrainedTeachersSessionFields', () => {
  it('일정 공통이면 교육형태·IPS를 행에 덮고 참여방식은 유지한다', () => {
    const next = stampTrainedTeachersSessionFields(
      [
        {
          title: '1차시',
          educationFormLabel: '온라인',
          ipsTypeSummary: '일정 공통 | Prepare | 해당없음',
          participationMethodLabel: '팀',
        },
      ],
      {
        educationFormScheduleDetail: 'common',
        ipsScheduleDetail: 'common',
        educationFormLabel: '오프라인',
        ipsTypeSummary: '일정 공통 | Inspire | 학교',
      }
    )
    expect(next?.[0]).toMatchObject({
      educationFormLabel: '오프라인',
      ipsTypeSummary: '일정 공통 | Inspire | 학교',
      participationMethodLabel: '팀',
    })
  })

  it('일정별 상이이면 행에 있는 교육형태·IPS·참여방식을 유지한다', () => {
    const rows = [
      {
        educationFormLabel: '온라인',
        ipsTypeSummary: '일정 별 상이 | Succeed | 경제',
        participationMethodLabel: '개인',
      },
    ]
    expect(
      stampTrainedTeachersSessionFields(rows, {
        educationFormScheduleDetail: 'perSchedule',
        ipsScheduleDetail: 'perSchedule',
        educationFormLabel: '오프라인',
        ipsTypeSummary: '일정 공통 | Prepare | 해당없음',
      })
    ).toEqual(rows)
  })
})