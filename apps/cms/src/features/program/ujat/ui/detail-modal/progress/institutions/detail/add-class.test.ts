import { describe, expect, it } from 'vitest'
import {
  buildEducationClassAddRequest,
  gradeBlocksFromEducationClasses,
  isDuplicateInEducationClasses,
  pendingRowToEducationClassAddItem,
  resolveEducationClassCountDisplay,
} from './add-class'

describe('pendingRowToEducationClassAddItem', () => {
  it('maps to digit grade and N반 className', () => {
    expect(
      pendingRowToEducationClassAddItem({
        id: '1',
        gradeLabel: '3학년',
        classNo: 2,
        studentCount: 28,
      })
    ).toEqual({ grade: '3', className: '2반', studentCount: 28 })
  })
})

describe('buildEducationClassAddRequest', () => {
  it('includes expectedRevision when finite', () => {
    expect(
      buildEducationClassAddRequest(
        [{ id: '1', gradeLabel: '1학년', classNo: 1, studentCount: 20 }],
        0
      )
    ).toEqual({
      expectedRevision: 0,
      classes: [{ grade: '1', className: '1반', studentCount: 20 }],
    })
  })

  it('returns null for empty pending', () => {
    expect(buildEducationClassAddRequest([], 0)).toBeNull()
  })
})

describe('gradeBlocksFromEducationClasses', () => {
  it('builds grade blocks from catalog rows', () => {
    expect(
      gradeBlocksFromEducationClasses([
        { grade: '2', className: '1반', studentCount: 21 },
        { grade: '2학년', className: '2', studentCount: 20 },
        { grade: '3', classLabel: '1반', studentCount: 18 },
      ])
    ).toEqual([
      {
        gradeLabel: '2학년',
        classCount: 2,
        classes: [
          { classNo: 1, studentCount: 21 },
          { classNo: 2, studentCount: 20 },
        ],
      },
      {
        gradeLabel: '3학년',
        classCount: 1,
        classes: [{ classNo: 1, studentCount: 18 }],
      },
    ])
  })

  it('returns empty when classes array is empty (does not invent from counts)', () => {
    expect(gradeBlocksFromEducationClasses([])).toEqual([])
  })
})

describe('isDuplicateInEducationClasses', () => {
  it('detects catalog duplicates with mixed wire forms', () => {
    expect(
      isDuplicateInEducationClasses(
        [{ grade: '3학년', className: '2' }],
        '3학년',
        2
      )
    ).toBe(true)
    expect(
      isDuplicateInEducationClasses([{ grade: '3', className: '1반' }], '3학년', 2)
    ).toBe(false)
  })
})

describe('resolveEducationClassCountDisplay', () => {
  it('prefers classes length when present', () => {
    expect(
      resolveEducationClassCountDisplay({
        currentClassCount: 99,
        classes: [{ grade: '1', className: '1반' }],
      })
    ).toBe(1)
  })

  it('uses classes.length when empty (does not invent from currentClassCount)', () => {
    expect(
      resolveEducationClassCountDisplay({
        currentClassCount: 2,
        classes: [],
      })
    ).toBe(0)
  })

  it('falls back to currentClassCount only when classes is omitted', () => {
    expect(
      resolveEducationClassCountDisplay({
        currentClassCount: 2,
      })
    ).toBe(2)
  })
})
