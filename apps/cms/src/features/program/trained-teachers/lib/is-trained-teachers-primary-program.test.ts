import { describe, expect, it } from 'vitest'
import {
  isTrainedTeacherPrimaryProgramId,
  looksLikeTrainedTeacherProgramId,
  resolveTrainedTeacherPrimaryCaseMeta,
  TRAINED_TEACHER_PRIMARY_PROGRAM_IDS,
  TRAINED_TEACHER_TRAINING_SCHEDULE_NAME,
} from './is-trained-teachers-primary-program'

describe('is-trained-teachers-primary-program', () => {
  it('recognizes Primary numeric ids 186001–186008', () => {
    for (const id of TRAINED_TEACHER_PRIMARY_PROGRAM_IDS) {
      expect(isTrainedTeacherPrimaryProgramId(id)).toBe(true)
      expect(looksLikeTrainedTeacherProgramId(id)).toBe(true)
    }
    expect(isTrainedTeacherPrimaryProgramId('169201')).toBe(false)
    expect(isTrainedTeacherPrimaryProgramId('186009')).toBe(false)
  })

  it('exposes TCH case meta for QA matrix', () => {
    expect(resolveTrainedTeacherPrimaryCaseMeta('186001')?.caseCode).toBe('TCH-01')
    expect(resolveTrainedTeacherPrimaryCaseMeta('186006')?.teacherTrainingEnabled).toBe(true)
    expect(resolveTrainedTeacherPrimaryCaseMeta('186005')?.periodStatus).toBe('SCHEDULED')
  })

  it('uses 교사 연수 schedule name SoT', () => {
    expect(TRAINED_TEACHER_TRAINING_SCHEDULE_NAME).toBe('교사 연수')
  })
})
