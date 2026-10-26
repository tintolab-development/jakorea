import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { buildTrainedTeachersSearchParamsAfterRegistrationComplete } from './post-registration-search-params'

function minimalProgram(id: string): Program {
  return {
    id,
    sponsorId: '1',
    title: 'TT',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '',
    rounds: [],
    startDate: '2026-04-01',
    endDate: '2026-12-31',
    status: 'pending',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('buildTrainedTeachersSearchParamsAfterRegistrationComplete', () => {
  it('등록 쿼리를 제거하고 programId 상세로 이동한다', () => {
    const prev = new URLSearchParams(
      'new=1&generalStep=application&registrationDraft=continue&userPreview=1'
    )
    const next = buildTrainedTeachersSearchParamsAfterRegistrationComplete(
      prev,
      minimalProgram('186342')
    )
    expect(next.get('new')).toBeNull()
    expect(next.get('generalStep')).toBeNull()
    expect(next.get('registrationDraft')).toBeNull()
    expect(next.get('userPreview')).toBeNull()
    expect(next.get('programId')).toBe('186342')
    expect(next.get('lnb')).toBe('info')
    expect(next.get('tab')).toBe('info')
  })

  it('program id 가 없으면 등록 쿼리만 제거한다', () => {
    const prev = new URLSearchParams('new=1&generalStep=program')
    const next = buildTrainedTeachersSearchParamsAfterRegistrationComplete(prev, undefined)
    expect(next.get('new')).toBeNull()
    expect(next.get('programId')).toBeNull()
  })
})
