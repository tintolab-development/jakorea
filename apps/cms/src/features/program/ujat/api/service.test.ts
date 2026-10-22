import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Program } from '@/types/domain'
import type { CreateInput } from './service'
import { shouldRetryQuery } from './errors'
import { toRemoteListParams } from './list-params'

const mocks = vi.hoisted(() => ({
  createWithForms: vi.fn(),
  deleteProgram: vi.fn(),
  fromDetail: vi.fn(),
  toCreateRequest: vi.fn(),
  buildPendingProgram: vi.fn(),
  collectOverlay: vi.fn(),
  shouldUseRemoteApi: vi.fn(),
  awaitMediaUploads: vi.fn(),
  bindMedia: vi.fn(),
}))

vi.mock(
  '@/features/program/general/api/create-admin-program-remote-with-registration-forms',
  () => ({
    createAdminProgramRemoteWithRegistrationForms: (...args: unknown[]) =>
      mocks.createWithForms(...args),
  })
)

vi.mock('@/features/program/general/api/programs-api-client', () => ({
  bulkDeleteAdminProgramsRemote: vi.fn(),
  deleteAdminProgramRemote: (...args: unknown[]) => mocks.deleteProgram(...args),
  fetchAdminProgramByIdRemote: vi.fn(),
  fetchAdminProgramsRemote: vi.fn(),
  updateAdminProgramRemote: vi.fn(),
}))

vi.mock('@/features/program/ujat/lib/ujat-registration-local-save', () => ({
  buildUjatProgramListRowFromRegistrationSnapshot: (...args: unknown[]) =>
    mocks.buildPendingProgram(...args),
  collectUjatRegistrationCreateOverlay: (...args: unknown[]) => mocks.collectOverlay(...args),
}))

vi.mock('@/features/program/ujat/api/adapters', () => ({
  fromDetail: (...args: unknown[]) => mocks.fromDetail(...args),
  fromListItem: vi.fn(),
  toCreateRequest: (...args: unknown[]) => mocks.toCreateRequest(...args),
  toUpdateRequest: vi.fn(),
}))

vi.mock('@/features/program/ujat/api/capabilities', () => ({
  shouldUseRemoteApi: () => mocks.shouldUseRemoteApi(),
}))

vi.mock('@/features/program/ujat/api/region-capacities-client', () => ({
  buildUjatRegionCapacityOverlay: vi.fn(),
  fetchUjatRegionCapacitiesRemote: vi.fn(),
}))

vi.mock('@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-media', () => ({
  awaitRecruitDetailMediaUploads: (...args: unknown[]) => mocks.awaitMediaUploads(...args),
  bindUjatRecruitDetailMediaToRows: (...args: unknown[]) => mocks.bindMedia(...args),
}))

import { create } from './service'

const pending = { id: 'ujat-pending', title: 'pending' } as Program
const created = {
  id: '186300',
  title: 'created',
  programRecruitments: [
    { id: 31, recruitmentType: 'PARTICIPANT' },
    { id: 32, recruitmentType: 'VOLUNTEER', recruitTerm: 'FIRST_HALF' },
  ],
} as Program
const overlay = {
  'ujatRecruit.detailInfo.thumbFileObjectId': 501,
}

function input(): CreateInput {
  return {
    idempotencyKey: 'completion-ujat-media',
    draft: {} as CreateInput['draft'],
    overlay: {},
  }
}

describe('UJAT create media binding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.shouldUseRemoteApi.mockReturnValue(true)
    mocks.collectOverlay.mockReturnValue(overlay)
    mocks.buildPendingProgram.mockReturnValue(pending)
    mocks.toCreateRequest.mockReturnValue({ serviceDetailJson: '{}' })
    mocks.createWithForms.mockResolvedValue({ id: created.id })
    mocks.fromDetail.mockReturnValue(created)
    mocks.awaitMediaUploads.mockResolvedValue(undefined)
    mocks.bindMedia.mockResolvedValue(undefined)
    mocks.deleteProgram.mockResolvedValue(undefined)
  })

  it('업로드 완료를 기다린 뒤 생성하고 UJAT 모집 row 미디어를 연결한다', async () => {
    await expect(create(input())).resolves.toBe(created)

    expect(mocks.awaitMediaUploads).toHaveBeenCalledOnce()
    expect(mocks.createWithForms).toHaveBeenCalledOnce()
    expect(mocks.bindMedia).toHaveBeenCalledWith(created, overlay)
    expect(mocks.awaitMediaUploads.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.createWithForms.mock.invocationCallOrder[0]
    )
    expect(mocks.createWithForms.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.bindMedia.mock.invocationCallOrder[0]
    )
    expect(mocks.deleteProgram).not.toHaveBeenCalled()
  })

  it('row 미디어 연결이 실패하면 방금 생성한 프로그램을 삭제하고 원래 오류를 전달한다', async () => {
    const error = new Error('row media binding failed')
    mocks.bindMedia.mockRejectedValue(error)

    await expect(create(input())).rejects.toBe(error)
    expect(mocks.deleteProgram).toHaveBeenCalledWith(created.id)
  })
})

describe('ujat API policy', () => {
  it('always scopes list requests to UJAT with default page size 500', () => {
    expect(toRemoteListParams({ keyword: ' 서울 ', businessYear: 2026 })).toEqual({
      keyword: ' 서울 ',
      businessYear: 2026,
      programType: 'UJAT',
      page: 0,
      size: 20,
    })
  })

  it('does not retry 4xx queries', () => {
    expect(shouldRetryQuery(0, { response: { status: 404 } })).toBe(false)
    expect(shouldRetryQuery(0, { response: { status: 500 } })).toBe(true)
    expect(shouldRetryQuery(2, { response: { status: 500 } })).toBe(false)
  })
})
