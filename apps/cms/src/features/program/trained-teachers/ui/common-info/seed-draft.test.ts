import { describe, expect, it } from 'vitest'
import { seedDraft } from './common-info-view'

describe('seedDraft', () => {
  it('수정 모드 draft에 저장된 일정명과 진행 시간을 남긴다', () => {
    const draft = seedDraft(
      {
        educationJournalEnabled: false,
        teacherTrainingEnabled: false,
        scheduleDetails: [
          {
            scheduleLabel: '세부 일정 01',
            name: '교육받은교사(수정3)',
            progressTimeSummary: '15:43 ~ 16:43',
            ipsTypeSummary: 'Inspire | Kick-Off event (킥오프 행사)',
          },
        ],
      },
      12,
      { totalParticipants: 10, participatingSchoolCount: 1 },
      { educationStructure: 'schedule', sessionRound: 'single' }
    )

    expect(draft.scheduleDetails[0]).toMatchObject({
      scheduleLabel: '세부 일정 01',
      name: '교육받은교사(수정3)',
      progressTimeSummary: '15:43 ~ 16:43',
    })
    expect(draft.progressGroupsByDetail).toEqual([['15:43 ~ 16:43']])
    expect(draft.educationJournalEnabled).toBe(false)
    expect(draft.teacherTrainingEnabled).toBe(false)
    expect(draft.kpiEducatedTeachers).toBe(12)
    expect(draft.kpiFinalParticipants).toBe(10)
  })

  it('canonical false 는 overlay yes 가 있어도 교육일지를 켜지 않는다', () => {
    const draft = seedDraft(
      { educationJournalEnabled: false, teacherTrainingEnabled: true },
      undefined,
      undefined,
      { educationStructure: 'curriculum', sessionRound: 'multi' }
    )
    expect(draft.educationJournalEnabled).toBe(false)
    expect(draft.teacherTrainingEnabled).toBe(true)
  })

  it('저장된 일정이 없으면 빈 배열을 유지하고 임시 행을 만들지 않는다', () => {
    const draft = seedDraft(
      { educationJournalEnabled: true, teacherTrainingEnabled: false },
      undefined,
      undefined,
      { educationStructure: 'schedule', sessionRound: 'single' }
    )

    expect(draft.scheduleDetails).toEqual([])
    expect(draft.curriculumSessions).toEqual([])
  })
})
