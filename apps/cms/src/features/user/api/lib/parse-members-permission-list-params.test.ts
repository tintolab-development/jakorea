import { describe, expect, it } from 'vitest'
import {
  parseAdminApprovalRequestListParams,
  parseInstructorRoleRequestListParams,
} from './parse-members-permission-list-params'

describe('parseInstructorRoleRequestListParams', () => {
  it('keyword·status·memberType·신청시기를 API params로 넣는다', () => {
    const params = new URLSearchParams({
      permI_search: '홍길동',
      permI_approval: 'PENDING',
      permI_role: 'SCHOOL',
      permI_from: '2026-03-01',
      permI_to: '2026-03-31',
    })

    expect(parseInstructorRoleRequestListParams(params)).toEqual({
      keyword: '홍길동',
      status: 'PENDING',
      memberType: 'SCHOOL_TEACHER',
      requestedAtFrom: '2026-03-01',
      requestedAtTo: '2026-03-31',
      page: 0,
      size: 50,
    })
  })

  it('비어 있으면 optional 필터를 생략한다', () => {
    expect(parseInstructorRoleRequestListParams(new URLSearchParams())).toEqual({
      keyword: undefined,
      status: undefined,
      memberType: undefined,
      requestedAtFrom: undefined,
      requestedAtTo: undefined,
      page: 0,
      size: 50,
    })
  })
})

describe('parseAdminApprovalRequestListParams', () => {
  it('keyword·status·신청시기를 API params로 넣는다', () => {
    const params = new URLSearchParams({
      permA_search: '관리자',
      permA_approval: 'APPROVED',
      permA_from: '2026-01-01',
      permA_to: '2026-01-31',
    })

    expect(parseAdminApprovalRequestListParams(params)).toEqual({
      keyword: '관리자',
      status: 'APPROVED',
      requestedAtFrom: '2026-01-01',
      requestedAtTo: '2026-01-31',
      page: 0,
      size: 50,
    })
  })
})
