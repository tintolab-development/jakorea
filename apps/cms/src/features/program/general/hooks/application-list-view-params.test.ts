import { describe, expect, it } from 'vitest'
import {
  INSTITUTION_APPLICATION_VIEW_PARAM,
  PARTICIPANT_APPLICATION_VIEW_PARAM,
  applyApplicationListViewMode,
  canonicalizeParticipantApplicationListViewParams,
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

  it('accepts participantApplicationView as alias for institution calendar', () => {
    const params = new URLSearchParams(`${PARTICIPANT_APPLICATION_VIEW_PARAM}=calendar`)
    expect(parseApplicationListViewMode(params, INSTITUTION_APPLICATION_VIEW_PARAM)).toBe(
      'calendar'
    )
  })

  it('canonicalizes participantApplicationView to institutionApplicationView for org programs', () => {
    const next = new URLSearchParams(`${PARTICIPANT_APPLICATION_VIEW_PARAM}=calendar`)
    expect(
      canonicalizeParticipantApplicationListViewParams(next, {
        isIndividualParticipantProgram: false,
      })
    ).toBe(true)
    expect(next.get(INSTITUTION_APPLICATION_VIEW_PARAM)).toBe('calendar')
    expect(next.get(PARTICIPANT_APPLICATION_VIEW_PARAM)).toBeNull()
  })
})
