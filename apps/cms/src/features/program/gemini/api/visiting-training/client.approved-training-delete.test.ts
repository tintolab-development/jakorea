import { beforeEach, describe, expect, it, vi } from 'vitest'

const { customInstanceMock } = vi.hoisted(() => ({
  customInstanceMock: vi.fn(),
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  default: customInstanceMock,
  customInstance: customInstanceMock,
}))

import {
  bulkDeleteGeminiApprovedTrainingsRemote,
  deleteGeminiApprovedTrainingRemote,
} from './client'

describe('Gemini 승인 연수 삭제 remote client', () => {
  beforeEach(() => {
    customInstanceMock.mockReset()
    customInstanceMock.mockResolvedValue({})
  })

  it('단건 삭제에 선택적 reason 쿼리를 null로 전달한다', async () => {
    await deleteGeminiApprovedTrainingRemote('1691498')

    expect(customInstanceMock).toHaveBeenCalledWith({
      url: '/api/admin/gemini/trainings/approved/1691498?reason=',
      method: 'DELETE',
    })
  })

  it('일괄 삭제에 reason null과 서버 부분 성공 응답을 사용한다', async () => {
    customInstanceMock.mockResolvedValue({
      requestedCount: 2,
      successCount: 1,
      failureCount: 1,
      successIds: [1691498],
      failures: [
        {
          id: 1691499,
          code: 'GEMINI_APPROVED_TRAINING_HAS_BUSINESS_HISTORY',
          message: '신청 강사 또는 교육 진행 이력이 있는 연수는 삭제할 수 없습니다.',
        },
      ],
    })

    await expect(bulkDeleteGeminiApprovedTrainingsRemote([1691498, 1691499])).resolves.toEqual({
      requestedCount: 2,
      successCount: 1,
      failureCount: 1,
      successIds: [1691498],
      failures: [
        {
          id: 1691499,
          code: 'GEMINI_APPROVED_TRAINING_HAS_BUSINESS_HISTORY',
          message: '신청 강사 또는 교육 진행 이력이 있는 연수는 삭제할 수 없습니다.',
        },
      ],
    })
    expect(customInstanceMock).toHaveBeenCalledWith({
      url: '/api/admin/gemini/trainings/approved/bulk-delete',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: { ids: [1691498, 1691499], reason: null },
    })
  })
})
