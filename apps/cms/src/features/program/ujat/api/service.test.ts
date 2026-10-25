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
  fetchProgram: vi.fn(),
  updateProgram: vi.fn(),
  fetchSponsors: vi.fn(),
  fetchTypedDetail: vi.fn(),
  replaceTypedDetail: vi.fn(),
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
  fetchAdminProgramByIdRemote: (...args: unknown[]) => mocks.fetchProgram(...args),
  fetchAdminProgramsRemote: vi.fn(),
  fetchAdminProgramSponsorsRemote: (...args: unknown[]) => mocks.fetchSponsors(...args),
  updateAdminProgramRemote: (...args: unknown[]) => mocks.updateProgram(...args),
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
  regionCapacityStateFromRows: vi.fn(() => ({ h1: {}, h2: {} })),
  replaceUjatRegionCapacitiesRemote: vi.fn(async () => []),
}))

vi.mock('@/features/program/ujat/api/typed-detail-client', async () => {
  const actual = await vi.importActual<typeof import('./typed-detail-client')>(
    './typed-detail-client'
  )
  return {
    ...actual,
    fetchUjatTypedDetailRemote: (...args: unknown[]) => mocks.fetchTypedDetail(...args),
    replaceUjatTypedDetailRemote: (...args: unknown[]) => mocks.replaceTypedDetail(...args),
  }
})

vi.mock('@/features/program/shared/lib/merge-program-sponsor-assignments', () => ({
  withFetchedProgramSponsorAssignments: async (program: Program) => program,
}))

vi.mock('@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-media', () => ({
  awaitRecruitDetailMediaUploads: (...args: unknown[]) => mocks.awaitMediaUploads(...args),
  bindUjatRecruitDetailMediaToRows: (...args: unknown[]) => mocks.bindMedia(...args),
}))

import { create, update } from './service'

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
    mocks.fetchProgram.mockResolvedValue({ id: '186300', title: 'server detail' })
    mocks.updateProgram.mockResolvedValue({ id: '186300', title: 'patch echo' })
    mocks.fetchSponsors.mockResolvedValue([])
    mocks.fetchTypedDetail.mockResolvedValue({ schemaVersion: 1, halfPlans: [], common: null })
    mocks.replaceTypedDetail.mockResolvedValue({ schemaVersion: 1, halfPlans: [], common: null })
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

  it('Typed common-info input removes stale basic-info and schedule overlay keys', async () => {
    const collected = {
      'ujat.basicInfo.repKo': 'stale overlay value',
      'ujat.basicInfo.surveyItems': { survey: false },
      'ujat.h1.event.name': '상반기 본교육',
      'ujat.recruit.institution.publicTitle': '기관 모집',
    }
    mocks.collectOverlay.mockReturnValue(collected)

    await expect(
      create({
        ...input(),
        basicInfo: {
          mainTitle: 'RHF 대표명',
          surveySurvey: true,
          generalParticipantTypes: ['school_institution', 'volunteer'],
        },
      })
    ).resolves.toBe(created)

    expect(mocks.buildPendingProgram).toHaveBeenCalledWith(
      expect.objectContaining({
        overlay: {
          'ujat.recruit.institution.publicTitle': '기관 모집',
        },
      })
    )
    expect(mocks.bindMedia).toHaveBeenCalledWith(created, {
      'ujat.recruit.institution.publicTitle': '기관 모집',
    })
  })
})

describe('ujat API policy', () => {
  beforeEach(() => {
    mocks.fetchProgram.mockReset()
    mocks.updateProgram.mockReset()
    mocks.fetchTypedDetail.mockReset()
    mocks.replaceTypedDetail.mockReset()
    mocks.fromDetail.mockReset()
    mocks.shouldUseRemoteApi.mockReturnValue(true)
    mocks.fetchTypedDetail.mockResolvedValue({ schemaVersion: 1, halfPlans: [], common: null })
    mocks.replaceTypedDetail.mockResolvedValue({ schemaVersion: 1, halfPlans: [], common: null })
  })

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

  it('저장 결과는 PATCH echo가 아니라 저장 후 canonical GET을 반환한다', async () => {
    const baseline = { id: '186300', title: '기존' } as Program
    const canonical = { id: '186300', title: 'GET 정본' } as Program
    mocks.fromDetail.mockReturnValue(canonical)
    mocks.fetchProgram
      .mockResolvedValueOnce({ id: '186300', title: '저장 전' })
      .mockResolvedValueOnce({ id: '186300', title: '저장 후' })

    await expect(update('186300', baseline, { title: '수정' })).resolves.toBe(canonical)
    expect(mocks.updateProgram).toHaveBeenCalledOnce()
    expect(mocks.fetchProgram).toHaveBeenCalledTimes(2)
  })

  it('공통정보 설문·참여자 저장만 Typed Detail을 갱신하고 일정 overlay는 쓰지 않는다', async () => {
    const baseline = {
      id: '186300',
      title: '기존',
      ujatRegistrationOverlay: {
        'ujat.h1.event.name': '상반기 본교육',
        'ujat.recruit.institution.publicTitle': '기관 모집',
      },
    } as unknown as Program
    mocks.fetchProgram
      .mockResolvedValueOnce({ id: '186300', serviceDetailJson: '{}' })
      .mockResolvedValueOnce({ id: '186300', serviceDetailJson: '{}' })
    mocks.fetchTypedDetail.mockResolvedValue({
      schemaVersion: 1,
      halfPlans: [],
      common: null,
    })

    await update('186300', baseline, {
      generalSurveyMenuKeys: ['survey'],
      generalParticipantTypes: ['school_institution'],
    })

    expect(mocks.replaceTypedDetail).toHaveBeenCalledWith(
      '186300',
      expect.objectContaining({
        schemaVersion: 1,
        common: expect.objectContaining({
          surveySettings: expect.any(Array),
          participantSettings: expect.any(Object),
        }),
      })
    )
  })
})
