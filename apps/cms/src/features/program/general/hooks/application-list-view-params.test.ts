import { describe, expect, it } from 'vitest'
import {
  INSTITUTION_APPLICATION_VIEW_PARAM,
  applyApplicationListViewMode,
  parseApplicationListViewMode,
} from './application-list-view-params'

describe('application-list-view-params', () => {
  it('parses calendar only when param is calendar', () => {
    const params = new URLSearchParams(`${INSTITUTION_APPLICATION_VIEW_PARAM}=calendar`)
    expect(parseApplicationListViewMode(params, INSTITUTION_APPLICATION_VIEW_PARAM)).toBe('calendar')
    expect(parseApplicationListViewMode(new URLSearchParams(), INSTITUTION_APPLICATION_VIEW_PARAM)).toBe(
      'table'
    )
  })

  it('writes and clears calendar param', () => {
    const next = new URLSearchParams()
    applyApplicationListViewMode(next, INSTITUTION_APPLICATION_VIEW_PARAM, 'calendar')
    expect(next.get(INSTITUTION_APPLICATION_VIEW_PARAM)).toBe('calendar')
    applyApplicationListViewMode(next, INSTITUTION_APPLICATION_VIEW_PARAM, 'table')
    expect(next.get(INSTITUTION_APPLICATION_VIEW_PARAM)).toBeNull()
  })

  it('clears sibling application view params when setting calendar mode', () => {
    const next = new URLSearchParams(
      'institutionApplicationView=calendar&instructorApplicationView=calendar'
    )
    applyApplicationListViewMode(next, INSTITUTION_APPLICATION_VIEW_PARAM, 'calendar')
    expect(next.get(INSTITUTION_APPLICATION_VIEW_PARAM)).toBe('calendar')
    expect(next.get('instructorApplicationView')).toBeNull()
  })
})
