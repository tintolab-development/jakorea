import { describe, expect, it } from 'vitest'
import {
  buildUnifiedProgramRows,
  canUnselectWidgetProgramGroup,
  getAllProgramIdsForWidget,
  isWidgetProgramFilterAll,
  isWidgetProgramGroupIndeterminate,
  isWidgetProgramGroupSelected,
  remainingIdsAfterUnselectingGroup,
  setWidgetProgramGroupSelected,
} from './widget-program-filter'

const ALL = ['a', 'b', 'c']
const GROUP_A = ['a']
const GROUP_BC = ['b', 'c']
const GROUP_ALL = ['a', 'b', 'c']

describe('isWidgetProgramFilterAll', () => {
  it('키 없음과 빈 배열은 전체 선택', () => {
    expect(isWidgetProgramFilterAll(undefined)).toBe(true)
    expect(isWidgetProgramFilterAll([])).toBe(true)
    expect(isWidgetProgramFilterAll(['a'])).toBe(false)
  })
})

describe('isWidgetProgramGroupSelected', () => {
  it('전체 선택이면 모든 그룹이 켜진 것으로 본다', () => {
    expect(isWidgetProgramGroupSelected([], GROUP_A)).toBe(true)
    expect(isWidgetProgramGroupSelected(undefined, GROUP_BC)).toBe(true)
  })

  it('명시 목록이면 그룹 id가 모두 포함될 때만 켜진 것', () => {
    expect(isWidgetProgramGroupSelected(['a', 'b'], GROUP_A)).toBe(true)
    expect(isWidgetProgramGroupSelected(['a'], GROUP_BC)).toBe(false)
    expect(isWidgetProgramGroupSelected(['b'], GROUP_BC)).toBe(false)
  })
})

describe('isWidgetProgramGroupIndeterminate', () => {
  it('전체 선택이거나 전부/전무면 indeterminate 아님', () => {
    expect(isWidgetProgramGroupIndeterminate([], GROUP_BC)).toBe(false)
    expect(isWidgetProgramGroupIndeterminate(['b', 'c'], GROUP_BC)).toBe(false)
    expect(isWidgetProgramGroupIndeterminate(['a'], GROUP_BC)).toBe(false)
  })

  it('그룹 id 일부만 포함되면 indeterminate', () => {
    expect(isWidgetProgramGroupIndeterminate(['b'], GROUP_BC)).toBe(true)
  })
})

describe('setWidgetProgramGroupSelected', () => {
  it('전체에서 한 그룹을 끄면 나머지 id만 남긴다', () => {
    expect(setWidgetProgramGroupSelected([], GROUP_A, ALL, false)).toEqual(['b', 'c'])
    expect(setWidgetProgramGroupSelected(undefined, GROUP_A, ALL, false)).toEqual(['b', 'c'])
  })

  it('마지막 그룹을 꺼도 []로 돌아가지 않는다 (wrap-around 방지)', () => {
    expect(setWidgetProgramGroupSelected(['a'], GROUP_A, ALL, false)).toEqual(['a'])
  })

  it('그룹이 위젯 전체 id이면 전체에서 꺼도 []를 유지한다', () => {
    expect(setWidgetProgramGroupSelected([], GROUP_ALL, ALL, false)).toEqual([])
  })

  it('나머지 그룹을 켜 전체가 되면 []로 접는다', () => {
    expect(setWidgetProgramGroupSelected(['a'], GROUP_BC, ALL, true)).toEqual([])
  })

  it('전체에서 켜는 요청은 []를 유지한다', () => {
    expect(setWidgetProgramGroupSelected([], GROUP_A, ALL, true)).toEqual([])
  })

  it('체크박스 checked 의도를 따른다 (빈 배열을 꺼진 그룹으로 오해하지 않음)', () => {
    expect(setWidgetProgramGroupSelected([], GROUP_A, ALL, false)).toEqual(['b', 'c'])
    expect(setWidgetProgramGroupSelected([], GROUP_A, ALL, true)).toEqual([])
  })
})

describe('canUnselectWidgetProgramGroup', () => {
  it('전체에서 일부 그룹은 끌 수 있다', () => {
    expect(canUnselectWidgetProgramGroup([], GROUP_A, ALL)).toBe(true)
  })

  it('마지막 그룹·전체 커버 그룹은 끌 수 없다', () => {
    expect(canUnselectWidgetProgramGroup(['a'], GROUP_A, ALL)).toBe(false)
    expect(canUnselectWidgetProgramGroup([], GROUP_ALL, ALL)).toBe(false)
  })

  it('이미 꺼진 그룹은 canUnselect=false', () => {
    expect(canUnselectWidgetProgramGroup(['a'], GROUP_BC, ALL)).toBe(false)
  })
})

describe('remainingIdsAfterUnselectingGroup', () => {
  it('전체에서 끄면 카탈로그 차집합', () => {
    expect(remainingIdsAfterUnselectingGroup([], GROUP_A, ALL)).toEqual(['b', 'c'])
  })
})

describe('buildUnifiedProgramRows', () => {
  it('행마다 해당 제목의 id만 넣고 위젯 전체를 공유하지 않는다', () => {
    const rows = buildUnifiedProgramRows(
      ['schedule', 'recruitment'],
      {
        schedule: [
          { id: '1', title: '프로그램 A' },
          { id: '2', title: '프로그램 B' },
        ],
        recruitment: [
          { id: '1', title: '프로그램 A' },
          { id: '2', title: '프로그램 B' },
          { id: '3', title: '프로그램 C' },
        ],
      }
    )
    expect(rows).toHaveLength(3)
    expect(rows[0]).toEqual({
      title: '프로그램 A',
      idsByWidget: { schedule: ['1'], recruitment: ['1'] },
    })
    expect(rows[1]).toEqual({
      title: '프로그램 B',
      idsByWidget: { schedule: ['2'], recruitment: ['2'] },
    })
    expect(rows[2]).toEqual({
      title: '프로그램 C',
      idsByWidget: { recruitment: ['3'] },
    })
  })

  it('한 행의 그룹을 꺼도 다른 행 id는 남는다', () => {
    const rows = buildUnifiedProgramRows(['w'], {
      w: [
        { id: '1', title: 'A' },
        { id: '2', title: 'B' },
      ],
    })
    const allIds = getAllProgramIdsForWidget({ w: rows.flatMap(r => (r.idsByWidget.w ?? []).map(id => ({ id, title: r.title }))) }, 'w')
    expect(
      setWidgetProgramGroupSelected([], rows[0]!.idsByWidget.w!, ['1', '2'], false)
    ).toEqual(['2'])
    expect(allIds).toEqual(['1', '2'])
  })
})
