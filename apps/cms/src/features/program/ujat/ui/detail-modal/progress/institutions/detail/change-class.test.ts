import { describe, expect, it } from 'vitest'
import {
  buildEducationClassRemappingRequest,
  buildExistingClassOptionsFromEducationClasses,
  collectUsedExistingClassKeys,
  countAvailableExistingClasses,
  getChangeClassAddRowBlockReason,
  isChangeClassRowComplete,
  mappingToRemappingItem,
  remapTemporaryScheduleSlotsForClassChange,
  resolveEducationClassWireClassName,
  type ChangeClassConfirmPayload,
} from './change-class'

describe('buildExistingClassOptionsFromEducationClasses', () => {
  it('uses GET grade/className as select values and does not send classLabel as fromClassName', () => {
    const options = buildExistingClassOptionsFromEducationClasses([
      {
        grade: '2',
        className: '1반',
        classLabel: '2학년 1반',
        studentCount: 1,
      },
      {
        grade: '2',
        className: '2반',
        classLabel: '2학년 2반',
        studentCount: 1,
      },
      { grade: '1학년', className: '2' },
      { grade: '3', classLabel: '1반' },
    ])

    expect(options.gradeOptions).toEqual([
      { value: '1학년', label: '1학년' },
      { value: '2', label: '2학년' },
      { value: '3', label: '3학년' },
    ])
    expect(options.classOptionsByGrade['2']).toEqual([
      { value: '1반', label: '1반' },
      { value: '2반', label: '2반' },
    ])
    expect(options.classOptionsByGrade['1학년']).toEqual([{ value: '2', label: '2반' }])
    expect(options.classOptionsByGrade['3']).toEqual([{ value: '1반', label: '1반' }])
    expect(countAvailableExistingClasses(options)).toBe(4)
    expect(options.wireBySelectKey['2:1반']).toEqual({ grade: '2', className: '1반' })
    expect(options.wireBySelectKey['2:2반']).toEqual({ grade: '2', className: '2반' })
    expect(options.wireBySelectKey['1학년:2']).toEqual({ grade: '1학년', className: '2' })
    expect(options.wireBySelectKey['3:1반']).toEqual({ grade: '3', className: '1반' })
  })

  it('does not invent options from empty classes array', () => {
    expect(buildExistingClassOptionsFromEducationClasses([])).toEqual({
      gradeOptions: [],
      classOptionsByGrade: {},
      wireBySelectKey: {},
    })
  })
})

describe('resolveEducationClassWireClassName', () => {
  it('prefers className and never sends full classLabel as wire', () => {
    expect(
      resolveEducationClassWireClassName({
        className: '1반',
        classLabel: '2학년 1반',
      })
    ).toBe('1반')
    expect(
      resolveEducationClassWireClassName({
        classLabel: '2학년 1반',
      })
    ).toBe('1반')
    expect(resolveEducationClassWireClassName({ classLabel: '1반' })).toBe('1반')
  })
})

describe('mappingToRemappingItem wire echo', () => {
  it('prefers catalog wire strings for fromGrade/fromClassName', () => {
    expect(
      mappingToRemappingItem({
        existingGradeLabel: '1학년',
        existingClassNo: 1,
        newGradeLabel: '2학년',
        newClassNo: 3,
        existingWireGrade: '1학년',
        existingWireClassName: '1',
      })
    ).toEqual({
      fromGrade: '1학년',
      fromClassName: '1',
      toGrade: '2',
      toClassName: '3반',
      unassign: false,
    })
  })
})

describe('change-class add-row guards', () => {
  const completeRow = {
    existingGrade: '2',
    existingClassNo: '1',
    newGrade: '3',
    newClassNo: '2',
  }

  it('treats unassigned target as complete without class', () => {
    expect(
      isChangeClassRowComplete({
        existingGrade: '2',
        existingClassNo: '1',
        newGrade: '__unassigned__',
        newClassNo: '',
      })
    ).toBe(true)
  })

  it('blocks add while a row is incomplete', () => {
    expect(
      getChangeClassAddRowBlockReason(
        [{ existingGrade: '2', existingClassNo: undefined, newGrade: undefined, newClassNo: '' }],
        3
      )
    ).toBe('입력 중인 행의 학급 정보를 모두 선택한 뒤 추가해 주세요.')
  })

  it('blocks add beyond available existing class count', () => {
    expect(getChangeClassAddRowBlockReason([completeRow, { ...completeRow, existingClassNo: '2' }], 2)).toBe(
      '변경 가능한 기존 학급 수만큼만 추가할 수 있습니다.'
    )
  })

  it('allows add when rows are complete and under the cap', () => {
    expect(getChangeClassAddRowBlockReason([completeRow], 2)).toBeNull()
  })

  it('excludes the current row when collecting used existing class keys', () => {
    const keys = collectUsedExistingClassKeys(
      [
        completeRow,
        { existingGrade: '3', existingClassNo: '1', newGrade: '1', newClassNo: '1' },
      ],
      0
    )
    expect([...keys]).toEqual(['3:1'])
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
