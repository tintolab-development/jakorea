import { describe, expect, it } from 'vitest'
import { buildProgramListSearchParamsAfterRegistrationComplete } from './post-registration-search-params'

describe('buildProgramListSearchParamsAfterRegistrationComplete', () => {
  it('등록 쿼리를 제거하고 programId 상세로 이동한다', () => {
    const prev = new URLSearchParams(
      'new=1&generalStep=application&ujatStep=program&registrationDraft=continue&userPreview=1'
    )
    const next = buildProgramListSearchParamsAfterRegistrationComplete(prev, '186342')
    expect(next.get('new')).toBeNull()
    expect(next.get('generalStep')).toBeNull()
    expect(next.get('ujatStep')).toBeNull()
    expect(next.get('registrationDraft')).toBeNull()
    expect(next.get('userPreview')).toBeNull()
    expect(next.get('programId')).toBe('186342')
    expect(next.get('lnb')).toBe('info')
    expect(next.get('tab')).toBe('info')
  })

  it('program id 가 없으면 등록 쿼리만 제거한다', () => {
    const prev = new URLSearchParams('new=1&generalStep=program')
    const next = buildProgramListSearchParamsAfterRegistrationComplete(prev, undefined)
    expect(next.get('new')).toBeNull()
    expect(next.get('programId')).toBeNull()
  })
})
