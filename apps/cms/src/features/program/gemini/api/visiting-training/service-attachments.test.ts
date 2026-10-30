import { beforeEach, describe, expect, it, vi } from 'vitest'

const putProgramAttachments = vi.fn(async () => [])
const fetchProgramAttachments = vi.fn(async () => [] as Array<Record<string, unknown>>)
const updateGeminiRecruitmentRemote = vi.fn(async () => undefined)
const fetchGeminiRecruitmentDetailRemote = vi.fn(async () => ({ id: 5 }))

vi.mock('@/features/program/shared/api/program-attachments', () => ({
  putProgramAttachments: (...a: unknown[]) => putProgramAttachments(...(a as [])),
  fetchProgramAttachments: (...a: unknown[]) => fetchProgramAttachments(...(a as [])),
}))
vi.mock('@/features/program/shared/api/program-thumbnail', () => ({ putProgramThumbnail: vi.fn() }))
vi.mock('./capabilities', () => ({ shouldUseGeminiVisitingTrainingRemoteApi: () => true }))
vi.mock('./client', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  updateGeminiRecruitmentRemote: (...a: unknown[]) => updateGeminiRecruitmentRemote(...(a as [])),
  fetchGeminiRecruitmentDetailRemote: (...a: unknown[]) =>
    fetchGeminiRecruitmentDetailRemote(...(a as [])),
}))
vi.mock('./adapters', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  mapGeminiRecruitmentDetailToUpdateRequest: () => ({}),
  mapGeminiRecruitmentDetailDtoToDetail: () => null,
}))

import { updateGeminiRecruitment } from './service'
import type { GeminiRecruitmentInfoEditDraft } from '../../model/recruitment/info-edit-draft'

function draft(patch: Partial<GeminiRecruitmentInfoEditDraft>): GeminiRecruitmentInfoEditDraft {
  return { applicationPeriodStart: '2099-01-01', attachmentFileNames: [], ...patch } as GeminiRecruitmentInfoEditDraft
}

describe('updateGeminiRecruitment 첨부 연결 (QA C-23)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('첨부 변경이 없으면 attachments API를 부르지 않는다', async () => {
    await updateGeminiRecruitment('5', draft({ attachmentFileNames: ['a.pdf'] })).catch(() => undefined)
    expect(fetchProgramAttachments).not.toHaveBeenCalled()
    expect(putProgramAttachments).not.toHaveBeenCalled()
  })

  it('새 업로드는 기존 연결 첨부와 합쳐 PUT 한다', async () => {
    fetchProgramAttachments.mockResolvedValueOnce([{ fileObjectId: 100, originalFileName: 'old.pdf' }])
    await updateGeminiRecruitment(
      '5',
      draft({ attachmentFileNames: ['old.pdf', 'new.pdf'], attachmentFileObjectIds: [null, 7] })
    ).catch(() => undefined)
    expect(putProgramAttachments).toHaveBeenCalledWith(5, [100, 7])
  })
})
