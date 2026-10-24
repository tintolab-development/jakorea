import { describe, expect, it } from 'vitest'
import {
  ASSISTANT_UNCHECKED_PERMISSION_IDS,
  PROGRAM_MANAGER_PERMISSION_CATEGORIES,
  createInitialProgramManagerPermissionsByRole,
  countChecked,
} from './program-manager-permission-settings-ui-data'

const ALL_ITEMS = PROGRAM_MANAGER_PERMISSION_CATEGORIES.flatMap(c => c.items)

describe('program-manager-permission-settings-ui-data', () => {
  it('카테고리 5개, 항목 수 17+11+26+22+21=97', () => {
    expect(PROGRAM_MANAGER_PERMISSION_CATEGORIES).toHaveLength(5)
    expect(PROGRAM_MANAGER_PERMISSION_CATEGORIES.map(c => c.title)).toEqual([
      '등록·수정·삭제',
      '개인정보 열람',
      '화면 열람',
      '파일 다운로드',
      '설정·처리',
    ])
    const counts = PROGRAM_MANAGER_PERMISSION_CATEGORIES.map(c => c.items.length)
    expect(counts).toEqual([17, 11, 26, 22, 21])
    expect(ALL_ITEMS).toHaveLength(97)
  })

  it('항목 id는 카탈로그 내 유일', () => {
    const ids = ALL_ITEMS.map(i => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('Owner — 전 항목 CHECKED', () => {
    const byRole = createInitialProgramManagerPermissionsByRole()
    expect(countChecked(byRole.owner)).toBe(97)
    for (const item of ALL_ITEMS) {
      expect(byRole.owner[item.id]).toBe(true)
    }
  })

  it('Assistant — 미체크 3개만 false', () => {
    const byRole = createInitialProgramManagerPermissionsByRole()
    expect(ASSISTANT_UNCHECKED_PERMISSION_IDS).toHaveLength(3)
    for (const id of ASSISTANT_UNCHECKED_PERMISSION_IDS) {
      expect(byRole.assistant[id]).toBe(false)
    }
    expect(countChecked(byRole.assistant)).toBe(97 - 3)
    const unchecked = ALL_ITEMS.filter(i => !byRole.assistant[i.id]).map(i => i.id)
    expect(unchecked.sort()).toEqual([...ASSISTANT_UNCHECKED_PERMISSION_IDS].sort())
  })

  it('Viewer — 화면 열람만 true, 나머지(crud·pii·download·settings) 전부 false', () => {
    const byRole = createInitialProgramManagerPermissionsByRole()
    const crud = PROGRAM_MANAGER_PERMISSION_CATEGORIES.find(c => c.id === 'crud')!
    const pii = PROGRAM_MANAGER_PERMISSION_CATEGORIES.find(c => c.id === 'pii')!
    const screen = PROGRAM_MANAGER_PERMISSION_CATEGORIES.find(c => c.id === 'screen_view')!
    const download = PROGRAM_MANAGER_PERMISSION_CATEGORIES.find(c => c.id === 'file_download')!
    const settings = PROGRAM_MANAGER_PERMISSION_CATEGORIES.find(c => c.id === 'settings_process')!

    for (const item of [...crud.items, ...pii.items, ...download.items, ...settings.items]) {
      expect(byRole.viewer[item.id]).toBe(false)
    }
    for (const item of screen.items) {
      expect(byRole.viewer[item.id]).toBe(true)
    }
    expect(countChecked(byRole.viewer)).toBe(26)
  })
})
