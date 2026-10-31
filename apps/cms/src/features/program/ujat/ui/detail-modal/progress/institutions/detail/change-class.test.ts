import { describe, expect, it } from 'vitest'
import {
  buildEducationClassRemappingRequest,
  buildExistingClassOptionsFromEducationClasses,
  remapTemporaryScheduleSlotsForClassChange,
  type ChangeClassConfirmPayload,
} from './change-class'

describe('buildExistingClassOptionsFromEducationClasses', () => {
  it('maps education-classes catalog into grade/class selects', () => {
    const options = buildExistingClassOptionsFromEducationClasses([
      { grade: '1', className: '1반' },
      { grade: '1학년', className: '2' },
      { grade: '3', classLabel: '1반' },
    ])

    expect(options.gradeOptions).toEqual([
      { value: '1', label: '1학년' },
      { value: '3', label: '3학년' },
    ])
    expect(options.classOptionsByGrade['1']).toEqual([
      { value: '1', label: '1반' },
      { value: '2', label: '2반' },
    ])
    expect(options.classOptionsByGrade['3']).toEqual([{ value: '1', label: '1반' }])
  })
})

describe('buildEducationClassRemappingRequest', () => {
  const payload: ChangeClassConfirmPayload = {
    applyScheduleRowId: 'inst-2026-05-15',
    applyFromScheduleId: 184201,
    applyIsoDate: '2026-05-15',
    expectedRevision: 3,
    mappings: [
      {
        existingGradeLabel: '1학년',
        existingClassNo: 1,
        newGradeLabel: '2학년',
        newClassNo: 3,
      },
      {
        existingGradeLabel: '3학년',
        existingClassNo: 2,
        newGradeLabel: null,
        newClassNo: null,
      },
    ],
  }

  it('maps ChangeClassConfirmPayload to remapping request body', () => {
    expect(buildEducationClassRemappingRequest(payload)).toEqual({
      expectedRevision: 3,
      applyFromScheduleId: 184201,
      applyFromDate: '2026-05-15',
      mappings: [
        {
          fromGrade: '1',
          fromClassName: '1반',
          toGrade: '2',
          toClassName: '3반',
          unassign: false,
        },
        {
          fromGrade: '3',
          fromClassName: '2반',
          toGrade: null,
          toClassName: null,
          unassign: true,
        },
      ],
    })
  })

  it('returns null when expectedRevision is missing', () => {
    expect(
      buildEducationClassRemappingRequest({
        ...payload,
        expectedRevision: null,
      })
    ).toBeNull()
  })
})

describe('remapTemporaryScheduleSlotsForClassChange', () => {
  const payload: ChangeClassConfirmPayload = {
    applyScheduleRowId: 'inst-2026-05-15',
    applyFromScheduleId: 184201,
    applyIsoDate: '2026-05-15',
    expectedRevision: 3,
    mappings: [
      {
        existingGradeLabel: '1학년',
        existingClassNo: 1,
        newGradeLabel: '2학년',
        newClassNo: 3,
      },
      {
        existingGradeLabel: '3학년',
        existingClassNo: 2,
        newGradeLabel: null,
        newClassNo: null,
      },
    ],
  }

  it('remaps and drops slots from apply date forward', () => {
    const remapped = remapTemporaryScheduleSlotsForClassChange(
      [
        {
          scheduleId: 10,
          grade: '1',
          className: '1반',
          studentCount: 28,
          scheduleStartAt: '2026-05-08T00:00:00+09:00',
        },
        {
          scheduleId: 11,
          grade: '1',
          className: '1반',
          studentCount: 28,
          scheduleStartAt: '2026-05-15T00:00:00+09:00',
        },
        {
          scheduleId: 11,
          grade: '3',
          className: '2반',
          studentCount: 30,
          scheduleStartAt: '2026-05-15T00:00:00+09:00',
        },
        {
          scheduleId: 12,
          grade: '1학년',
          className: '1반',
          studentCount: 28,
          scheduleStartAt: '2026-05-22T00:00:00+09:00',
        },
      ],
      payload
    )

    expect(remapped).toEqual([
      { scheduleId: 10, grade: '1', className: '1반', studentCount: 28 },
      { scheduleId: 11, grade: '2', className: '3반', studentCount: 28 },
      { scheduleId: 12, grade: '2', className: '3반', studentCount: 28 },
    ])
  })
})
