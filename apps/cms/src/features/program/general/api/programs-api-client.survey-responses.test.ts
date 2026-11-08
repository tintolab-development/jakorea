import { beforeEach, describe, expect, it, vi } from 'vitest'

const request = vi.fn()

vi.mock('@/shared/api/orval-mutator', () => ({
  default: vi.fn(),
}))

vi.mock('@/shared/instance/axios-instance', () => ({
  axiosClient: { request: (...args: unknown[]) => request(...args) },
}))

import { fetchAdminProgramSurveyResponsesRemote } from './programs-api-client'

describe('fetchAdminProgramSurveyResponsesRemote', () => {
  beforeEach(() => {
    request.mockReset()
    request.mockResolvedValue({
      data: [{ formResponseId: 1, answers: [{ questionKey: 'comment', answerDisplayText: '전문' }] }],
      headers: { 'x-total-count': '1' },
    })
  })

  it('includeAnswers=true를 목록 query에 붙여 1회만 조회한다', async () => {
    const items = await fetchAdminProgramSurveyResponsesRemote('10', '20', '30', {
      includeAnswers: true,
    })
    expect(request).toHaveBeenCalledTimes(1)
    expect(request.mock.calls[0]![0]).toMatchObject({
      url: '/api/admin/programs/10/surveys/20/responses',
      method: 'GET',
      params: { page: 0, size: 20, bindingId: '30', includeAnswers: true },
    })
    expect(items[0]?.answers?.[0]?.answerDisplayText).toBe('전문')
  })

  it('includeAnswers 미지정이면 query에 넣지 않는다', async () => {
    await fetchAdminProgramSurveyResponsesRemote('10', '20', '30')
    expect(request.mock.calls[0]![0].params).not.toHaveProperty('includeAnswers')
  })
})
