import { AxiosError } from 'axios'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/api/axios-instance', () => ({
  axiosClient: {
    get: vi.fn(),
  },
}))

import { axiosClient } from '@/shared/api/axios-instance'
import { fetchAssignedInstructors } from '../src/features/mypage/education/applications/api/assigned-instructors'

const PATH = (applicationType: 'INDIVIDUAL' | 'ORGANIZATION', applicationId: number) =>
  `/api/portal/me/program-applications/${applicationType}/${applicationId}/assigned-instructors`

describe('fetchAssignedInstructors', () => {
  it('INDIVIDUAL DOCUMENT_PASSED 빈 배정도 200 instructors=[] 로 받는다', async () => {
    const get = vi.mocked(axiosClient.get)
    get.mockResolvedValueOnce({ data: { instructors: [] } })

    await expect(fetchAssignedInstructors('INDIVIDUAL', 1694736)).resolves.toEqual({
      instructors: [],
    })
    expect(get).toHaveBeenCalledWith(PATH('INDIVIDUAL', 1694736), expect.anything())
  })

  it('404 APPLICATION_NOT_FOUND 는 빈 목록으로 바꾸지 않는다', async () => {
    const get = vi.mocked(axiosClient.get)
    const notFound = new AxiosError('신청정보를 찾을 수 없습니다.')
    notFound.response = {
      status: 404,
      data: {
        error: { code: 'APPLICATION_NOT_FOUND', message: '신청정보를 찾을 수 없습니다.' },
      },
      statusText: 'Not Found',
      headers: {},
      config: {} as never,
    }
    get.mockRejectedValueOnce(notFound)

    await expect(fetchAssignedInstructors('INDIVIDUAL', 1)).rejects.toMatchObject({
      response: {
        status: 404,
        data: { error: { code: 'APPLICATION_NOT_FOUND' } },
      },
    })
  })
})
