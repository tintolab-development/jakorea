import { describe, expect, it } from 'vitest'
import {
  getProgramAttendanceTextPresentation,
  getProgramCompletionTextPresentation,
} from './attendance-status-presentation'

describe('attendance / completion Text presentation (Figma 14804:19647 · 19658)', () => {
  it.each([
    ['present', 'var(--Netural-black, #3d3d3d)'],
    ['late', 'var(--Status-red-main, #c32f4a)'],
    ['absent', 'var(--Status-red-main, #c32f4a)'],
    ['excused_absence', 'var(--Status-blue-main, #017eaf)'],
    ['withdrawn', 'var(--Status-red-main, #c32f4a)'],
  ] as const)('%s keeps the caller label with the design color', (kind, color) => {
    expect(getProgramAttendanceTextPresentation(kind, '라벨')).toEqual({ label: '라벨', accentColor: color })
  })

  it('renders unrecorded attendance as a neutral dash', () => {
    expect(getProgramAttendanceTextPresentation('pending', '출석')).toEqual({
      label: '-', accentColor: 'var(--Netural-black, #3d3d3d)',
    })
  })

  it('preserves the existing late-time label override', () => {
    expect(getProgramAttendanceTextPresentation('late', '10분 지각 (09:10)', '09:10').label).toBe('지각 (09:10)')
  })

  it.each([
    ['수료 불가', 'var(--Status-red-main, #c32f4a)'],
    ['수료 불가(활동 포기)', 'var(--Status-red-main, #c32f4a)'],
    ['수료 완료', 'var(--Status-blue-main, #017eaf)'],
    ['교육 진행 중', 'var(--Netural-black, #3d3d3d)'],
    ['교육 진행 전', 'var(--Netural-black, #3d3d3d)'],
  ])('colors completion %s', (label, color) => {
    expect(getProgramCompletionTextPresentation(label).accentColor).toBe(color)
  })
})
