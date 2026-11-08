import { describe, expect, it } from 'vitest'
import { resolveApplicantListAccessLog } from './applicant-list-menu'

describe('resolveApplicantListAccessLog', () => {
  it.each([
    ['institutions', 'PROGRAM_INSTITUTION_APPLICATION_EXPORT'],
    ['instructors', 'PROGRAM_INSTRUCTOR_APPLICATION_EXPORT'],
    ['individual-applications', 'PROGRAM_INDIVIDUAL_APPLICATION_EXPORT'],
  ] as const)('%s 메뉴는 %s + NAME', (menu, kind) => {
    expect(resolveApplicantListAccessLog(menu)).toEqual({
      downloadKind: kind,
      containedPiiTypes: ['NAME'],
    })
  })

  it('그 밖의 메뉴는 종류를 보내지 않는다', () => {
    expect(resolveApplicantListAccessLog('')).toBeUndefined()
  })
})
