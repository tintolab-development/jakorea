import { describe, expect, it } from 'vitest'
import { clearTeacherTrainingScheduleIfOff } from './teacher-training-schedule'

describe('clearTeacherTrainingScheduleIfOff', () => {
  it('keeps 교육 연수 when training is on', () => {
    const next = clearTeacherTrainingScheduleIfOff(
      {
        teacherTrainingEnabled: true,
        scheduleDetails: [{ scheduleLabel: '행사 일정 01', name: '교육 연수' }],
      },
      { teacherTrainingEnabled: true, teacherTrainingScheduleName: '교육 연수' }
    )
    expect(next.teacherTrainingEnabled).toBe(true)
    expect(next.teacherTrainingScheduleName).toBe('교육 연수')
    expect(next.scheduleDetails?.[0]?.name).toBe('교육 연수')
  })

  it('clears leftover 교육 연수 when GET schedule name is empty', () => {
    const next = clearTeacherTrainingScheduleIfOff(
      {
        teacherTrainingEnabled: false,
        teacherTrainingScheduleName: '교육 연수',
        curriculumSessions: [{ sessionLabel: '1차시', title: '교육 연수', description: '' }],
        scheduleDetails: [{ scheduleLabel: '행사 일정 01', name: '교육 연수' }],
      },
      { teacherTrainingEnabled: false, teacherTrainingScheduleName: '' }
    )
    expect(next.teacherTrainingEnabled).toBe(false)
    expect(next.teacherTrainingScheduleName).toBe('')
    expect(next.curriculumSessions?.[0]?.title).toBe('')
    expect(next.scheduleDetails?.[0]?.name).toBe('')
  })

  it('OFF 토글에서 회차 라벨 「교육 연수」를 1회차로 되돌린다', () => {
    const next = clearTeacherTrainingScheduleIfOff(
      {
        teacherTrainingEnabled: true,
        curriculumSessions: [
          { sessionLabel: '교육 연수', title: '사전교육', description: '' },
          { sessionLabel: '2회차', title: '본교육', description: '' },
        ],
      },
      { teacherTrainingEnabled: false, teacherTrainingScheduleName: '교육 연수' }
    )
    expect(next.curriculumSessions?.[0]?.sessionLabel).toBe('1회차')
    expect(next.curriculumSessions?.[0]?.title).toBe('사전교육')
  })

  it('does not strip other first-session titles when schedule name is empty', () => {
    const next = clearTeacherTrainingScheduleIfOff(
      {
        teacherTrainingEnabled: false,
        curriculumSessions: [{ sessionLabel: '1차시', title: '오리엔테이션', description: '' }],
      },
      { teacherTrainingEnabled: false, teacherTrainingScheduleName: '' }
    )
    expect(next.curriculumSessions?.[0]?.title).toBe('오리엔테이션')
  })
})
