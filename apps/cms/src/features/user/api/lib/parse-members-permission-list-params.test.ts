import { describe, expect, it } from 'vitest'
import {
  parseAdminApprovalRequestListParams,
  parseInstructorRoleRequestListParams,
} from './parse-members-permission-list-params'

describe('parseInstructorRoleRequestListParams', () => {
  it('keyword·status만 API로 보내고 회원유형·신청시기는 생략한다', () => {
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
      memberType: undefined,
      requestedAtFrom: undefined,
      requestedAtTo: undefined,
      page: 0,
      size: 50,
    })
  })

  it('회원 유형 UI 필터는 API memberType으로 보내지 않는다', () => {
    expect(
      parseInstructorRoleRequestListParams(new URLSearchParams({ permI_role: 'INDIVIDUAL' }))
        .memberType
    ).toBeUndefined()
    expect(
      parseInstructorRoleRequestListParams(new URLSearchParams({ permI_role: 'SCHOOL' }))
        .memberType
    ).toBeUndefined()
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
  it('keyword·status만 API로 보내고 신청시기는 생략한다', () => {
    const params = new URLSearchParams({
      permA_search: '관리자',
      permA_approval: 'APPROVED',
      permA_from: '2026-01-01',
      permA_to: '2026-01-31',
    })

    expect(parseAdminApprovalRequestListParams(params)).toEqual({
      keyword: '관리자',
      status: 'APPROVED',
      requestedAtFrom: undefined,
      requestedAtTo: undefined,
      page: 0,
      size: 50,
    })
  })
})
