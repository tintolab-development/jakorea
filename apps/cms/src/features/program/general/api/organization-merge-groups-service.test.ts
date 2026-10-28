import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  cancel: vi.fn(),
  create: vi.fn(),
  fetch: vi.fn(),
  patch: vi.fn(),
}))

vi.mock('@/features/program/general/api/organization-merge-groups-api-client', () => ({
  cancelOrganizationMergeGroupRemote: mocks.cancel,
  createOrganizationMergeGroupRemote: mocks.create,
  fetchOrganizationMergeGroupsRemote: mocks.fetch,
  patchOrganizationMergeGroupRemote: mocks.patch,
}))
vi.mock('@/features/program/general/api/organization-merge-groups-remote-capabilities', () => ({
  shouldUseOrganizationMergeGroupsRemoteApi: () => true,
}))

import { COMBINED_CLASS_MEMBER_CHANGE_NOT_ALLOWED_MESSAGE } from '@/features/program/general/lib/combined-class-copy'
import { saveOrganizationCombinedClassRemote } from './organization-merge-groups-service'

const leadRow = { id: 'p-100', organizationApplicationId: '100', educationGrade: '5학년' }
const partnerRow = { id: 'p-101', organizationApplicationId: '101', educationGrade: '6학년' }
const otherRow = { id: 'p-102', organizationApplicationId: '102', educationGrade: '4학년' }

const activeGroup = {
  id: 10,
  leadApplicationId: 100,
  leadTeacherMemberId: 1,
  status: 'ACTIVE',
  members: [
    { organizationApplicationId: 100, grade: '5학년', lead: true },
    { organizationApplicationId: 101, grade: '6학년', lead: false },
  ],
}

const base = {
  programId: '168001',
  programType: 'GENERAL_ORGANIZATION',
  leadRow,
  allRows: [leadRow, partnerRow, otherRow],
  combinedClassApplication: '신청' as const,
  existingMergeGroups: [activeGroup],
}

describe('saveOrganizationCombinedClassRemote (ACTIVE merge group)', () => {
  beforeEach(() => {
    Object.values(mocks).forEach(fn => fn.mockReset())
  })

  it('담당 교사만 바뀌면 PATCH만 호출하고 DELETE/POST는 호출하지 않는다', async () => {
    mocks.patch.mockResolvedValue({ ...activeGroup, leadTeacherMemberId: 2 })
    await saveOrganizationCombinedClassRemote({
      ...base,
      partnerRowIds: ['p-101'],
      leadTeacherMemberId: 2,
    })
    expect(mocks.patch).toHaveBeenCalledWith('168001', 10, { leadTeacherMemberId: 2 })
    expect(mocks.cancel).not.toHaveBeenCalled()
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('변경 사항이 없으면 아무 API도 호출하지 않는다', async () => {
    const result = await saveOrganizationCombinedClassRemote({
      ...base,
      partnerRowIds: ['p-101'],
      leadTeacherMemberId: 1,
    })
    expect(result).toBe(activeGroup)
    expect(mocks.patch).not.toHaveBeenCalled()
    expect(mocks.cancel).not.toHaveBeenCalled()
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('구성(파트너) 변경은 DELETE+POST로 우회하지 않고 거부한다', async () => {
    await expect(
      saveOrganizationCombinedClassRemote({
        ...base,
        partnerRowIds: ['p-102'],
        leadTeacherMemberId: 2,
      })
    ).rejects.toThrow(COMBINED_CLASS_MEMBER_CHANGE_NOT_ALLOWED_MESSAGE)
    expect(mocks.patch).not.toHaveBeenCalled()
    expect(mocks.cancel).not.toHaveBeenCalled()
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('기존 합반이 없으면 POST로 생성한다', async () => {
    mocks.create.mockResolvedValue({ id: 11, status: 'ACTIVE' })
    await saveOrganizationCombinedClassRemote({
      ...base,
      existingMergeGroups: [],
      partnerRowIds: ['p-101'],
    })
    expect(mocks.create).toHaveBeenCalledTimes(1)
    expect(mocks.cancel).not.toHaveBeenCalled()
  })
})
