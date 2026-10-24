import { describe, expect, it } from 'vitest'
import {
  generalApplicationsQueryKeys,
  organizationApplicationDetailCacheKeys,
} from './general-applications-query-keys'

describe('organizationApplicationDetailCacheKeys', () => {
  it('진행 현황 상세가 읽는 programId 포함 키를 함께 반환한다', () => {
    expect(organizationApplicationDetailCacheKeys('1691443', '186301')).toEqual([
      generalApplicationsQueryKeys.organizationDetail('1691443'),
      generalApplicationsQueryKeys.organizationDetailInProgram('186301', '1691443'),
    ])
  })

  it('programId가 없으면 신청 id 키만 반환한다', () => {
    expect(organizationApplicationDetailCacheKeys('1691443')).toEqual([
      generalApplicationsQueryKeys.organizationDetail('1691443'),
    ])
  })
})
