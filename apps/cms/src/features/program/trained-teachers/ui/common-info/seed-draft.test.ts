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
    expect(draft.kpiFinalParticipants).toBeUndefined()
    expect(draft.kpiFinalSchools).toBeUndefined()
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
  it('교사 연수 ON — 연수 행은 블록 draft로, 나머지 행·진행 그룹은 화면 순서로 시드한다', () => {
    const draft = seedDraft(
      {
        educationJournalEnabled: false,
        teacherTrainingEnabled: true,
        teacherTrainingScheduleName: '교육 연수',
        teacherTrainingEducationFormat: 'OFFLINE',
        scheduleDetails: [
          {
            scheduleLabel: '교육 연수',
            name: '교육 연수',
            scheduleDateLabel: '2026.04.01(수) 10:00 ~ 12:00',
          },
          { scheduleLabel: '세부 일정 02', name: '일정 A', progressTimeSummary: '13:00 ~ 14:00' },
        ],
      },
      undefined,
      undefined,
      { educationStructure: 'schedule', sessionRound: 'single' }
    )
    expect(draft.teacherTrainingScheduleLine).toBe('2026.04.01(수) 10:00 ~ 12:00')
    expect(draft.teacherTrainingEducationFormat).toBe('OFFLINE')
    expect(draft.teacherTrainingScheduleName).toBe('교육 연수')
    expect(draft.scheduleDetails.map(row => [row.scheduleLabel, row.name])).toEqual([
      ['세부 일정 01', '일정 A'],
    ])
    expect(draft.progressGroupsByDetail).toEqual([['13:00 ~ 14:00']])
  })
})
