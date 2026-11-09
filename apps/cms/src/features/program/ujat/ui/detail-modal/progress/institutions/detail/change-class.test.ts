import { describe, expect, it } from 'vitest'
import {
  buildEducationClassRemappingRequest,
  buildExistingClassOptionsFromEducationClasses,
  buildMappingFromRowFields,
  collectBlockedTargetClassKeys,
  collectCatalogClassKeys,
  collectUsedExistingClassKeys,
  countAvailableExistingClasses,
  getChangeClassAddRowBlockReason,
  isChangeClassRowComplete,
  mappingToRemappingItem,
  normalizedClassKey,
  remapTemporaryScheduleSlotsForClassChange,
  resolveEducationClassWireClassName,
  validateChangeClassRows,
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

describe('change-class target guards', () => {
  const catalogKeys = collectCatalogClassKeys(
    buildExistingClassOptionsFromEducationClasses([
      { grade: '1학년', className: '1반' },
      { grade: '1', className: '2반' },
      { grade: '2', className: '1반' },
    ])
  )

  it('normalizes catalog wire grade/class into comparable keys', () => {
    expect(normalizedClassKey('1학년', '1반')).toBe('1:1')
    expect(normalizedClassKey('1', '1')).toBe('1:1')
    expect(normalizedClassKey('__unassigned__', '')).toBeNull()
    expect([...catalogKeys].sort()).toEqual(['1:1', '1:2', '2:1'])
  })

  it('builds mapping labels without doubling the grade suffix', () => {
    expect(buildMappingFromRowFields('1학년', '1반', '3', '4')).toMatchObject({
      existingGradeLabel: '1학년',
      existingClassNo: 1,
      newGradeLabel: '3학년',
      newClassNo: 4,
    })
  })

  it('rejects same class even when the existing value is catalog wire', () => {
    expect(
      validateChangeClassRows(
        [{ existingGrade: '1학년', existingClassNo: '1반', newGrade: '1', newClassNo: '1' }],
        catalogKeys
      )
    ).toBe('1번째 행의 기존 학급과 변경 학급이 동일합니다.')
  })

  it('rejects a target that stays in the catalog', () => {
    expect(
      validateChangeClassRows(
        [{ existingGrade: '1학년', existingClassNo: '1반', newGrade: '2', newClassNo: '1' }],
        catalogKeys
      )
    ).toBe(
      '1번째 행의 변경 학급은 이미 진행 중인 학급입니다. 해당 학급도 함께 변경하면 저장할 수 있습니다.'
    )
  })

  it('rejects duplicate targets across rows', () => {
    expect(
      validateChangeClassRows(
        [
          { existingGrade: '1학년', existingClassNo: '1반', newGrade: '3', newClassNo: '1' },
          { existingGrade: '1', existingClassNo: '2반', newGrade: '3', newClassNo: '1' },
        ],
        catalogKeys
      )
    ).toBe('2번째 행의 변경 학급이 다른 행과 중복됩니다.')
  })

  it('allows moving into a class that another row moves away', () => {
    expect(
      validateChangeClassRows(
        [
          { existingGrade: '1학년', existingClassNo: '1반', newGrade: '1', newClassNo: '2' },
          { existingGrade: '1', existingClassNo: '2반', newGrade: '__unassigned__', newClassNo: '' },
        ],
        catalogKeys
      )
    ).toBeNull()
  })

  it('allows swapping two catalog classes in one request', () => {
    const rows = [
      { existingGrade: '1학년', existingClassNo: '1반', newGrade: '1', newClassNo: '2' },
      { existingGrade: '1', existingClassNo: '2반', newGrade: '1', newClassNo: '1' },
    ]
    expect(validateChangeClassRows(rows, catalogKeys)).toBeNull()
    expect(collectBlockedTargetClassKeys(rows, 0).has('1:2')).toBe(false)
    expect(collectBlockedTargetClassKeys(rows, 1).has('1:1')).toBe(false)
  })

  it('allows rotating three catalog classes in one request', () => {
    const rows = [
      { existingGrade: '1학년', existingClassNo: '1반', newGrade: '1', newClassNo: '2' },
      { existingGrade: '1', existingClassNo: '2반', newGrade: '2', newClassNo: '1' },
      { existingGrade: '2', existingClassNo: '1반', newGrade: '1', newClassNo: '1' },
    ]
    expect(validateChangeClassRows(rows, catalogKeys)).toBeNull()
  })

  it('blocks only other-row targets so catalog classes stay selectable for swaps', () => {
    const blocked = collectBlockedTargetClassKeys(
      [
        { existingGrade: '1학년', existingClassNo: '1반', newGrade: undefined, newClassNo: '' },
        { existingGrade: '1', existingClassNo: '2반', newGrade: '4', newClassNo: '5' },
      ],
      0
    )
    expect([...blocked]).toEqual(['4:5'])
  })
})
