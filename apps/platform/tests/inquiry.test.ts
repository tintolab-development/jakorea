import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError } from 'axios'

const { post, deleteRequest } = vi.hoisted(() => ({
  post: vi.fn(),
  deleteRequest: vi.fn(),
}))

vi.mock('../src/shared/api/axios-instance', () => ({
  axiosClient: { post, delete: deleteRequest },
}))

import { createMyInquiry, deleteMyInquiry } from '../src/features/inquiry/api/client'
import { mapInquiryDetail, mapInquiryListItem } from '../src/features/inquiry/api/mappers'
import { getInquiryApiErrorCode, getInquiryApiErrorMessage } from '../src/features/inquiry/lib/inquiry-errors'
import { createInquiryIdempotencyKey } from '../src/features/inquiry/lib/idempotency'

describe('platform inquiry', () => {
  beforeEach(() => {
    post.mockReset()
    deleteRequest.mockReset()
  })

  it('maps inquiry and answer timestamps independently without inventing inquiry date', () => {
    const pending = mapInquiryListItem({ inquiryId: 1, answeredAt: '2026-10-26T02:45:00+09:00' }, 0)
    expect(pending).toMatchObject({
      createdAt: '',
      answeredAt: '2026년 10월 26일(월) 02:45',
      status: 'pending',
    })

    const detail = mapInquiryDetail({
      inquiryId: 1,
      inquiredAt: '2026-10-25T10:30:00+09:00',
      answeredAt: '2026-10-26T02:00:00+09:00',
      answers: [
        { content: '첫 답변', answeredAt: '2026-10-26T02:30:00+09:00' },
        { content: '최신 답변', answeredAt: '2026-10-26T02:45:00+09:00' },
      ],
    })
    expect(detail).toMatchObject({
      createdAt: '2026년 10월 25일(일) 10:30',
      answeredAt: '2026년 10월 26일(월) 02:45',
      answer: '첫 답변\n\n최신 답변',
    })
  })

  it('accepts a successful response envelope', async () => {
    post.mockResolvedValueOnce({ data: { success: true, data: { inquiryId: 10 } } })
    await expect(
      createMyInquiry({ category: '프로그램', title: '제목', content: '내용' }, '11111111-1111-4111-8111-111111111111')
    ).resolves.toBeUndefined()
    expect(post).toHaveBeenCalledWith(
      '/api/portal/me/inquiries',
      { category: '프로그램', title: '제목', content: '내용' },
      { headers: { 'Idempotency-Key': '11111111-1111-4111-8111-111111111111' } },
    )
  })

  it('accepts the backend raw inquiry detail response', async () => {
    post.mockResolvedValueOnce({ data: { inquiryId: 12, title: '제목', inquiryStatus: 'RECEIVED' } })

    await expect(
      createMyInquiry({ category: '프로그램', title: '제목', content: '내용' }, '44444444-4444-4444-8444-444444444444')
    ).resolves.toBeUndefined()
  })

  it('rejects a 2xx failure envelope and preserves the server message', async () => {
    post.mockResolvedValueOnce({
      data: { success: false, error: { message: '제목이 중복되었습니다.' } },
    })
    await expect(
      createMyInquiry({ category: '프로그램', title: '제목', content: '내용' }, '22222222-2222-4222-8222-222222222222')
    ).rejects.toThrow('제목이 중복되었습니다.')
  })

  it('can retry a timed-out submission with the same idempotency key', async () => {
    const body = { category: '프로그램', title: '제목', content: '내용' }
    const key = '33333333-3333-4333-8333-333333333333'
    post.mockRejectedValueOnce(new Error('timeout')).mockResolvedValueOnce({
      data: { success: true, data: { inquiryId: 11 } },
    })

    await expect(createMyInquiry(body, key)).rejects.toThrow('timeout')
    await expect(createMyInquiry(body, key)).resolves.toBeUndefined()
    expect(post.mock.calls[0]?.[2]).toEqual(post.mock.calls[1]?.[2])
  })

  it('does not treat a 2xx delete failure envelope as a successful delete', async () => {
    deleteRequest.mockResolvedValueOnce({
      data: { success: false, message: '답변이 완료된 문의는 삭제할 수 없습니다.' },
    })
    await expect(deleteMyInquiry('7')).rejects.toThrow('답변이 완료된 문의는 삭제할 수 없습니다.')
  })

  it('generates UUID keys and maps portal inquiry error codes', () => {
    expect(createInquiryIdempotencyKey()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )

    const error = new AxiosError('conflict')
    error.response = {
      data: { error: { code: 'PORTAL_INQUIRY_DELETE_CONFLICT' } },
    } as never
    expect(getInquiryApiErrorCode(error)).toBe('PORTAL_INQUIRY_DELETE_CONFLICT')
    expect(getInquiryApiErrorMessage(error, 'fallback')).toContain('문의 상태가 변경')
  })

  it('maps the portal idempotency and delete error codes from ApiResponse', () => {
    const cases = [
      ['IDEMPOTENCY_KEY_CONFLICT', '등록 키와 충돌'],
      ['IDEMPOTENCY_KEY_INVALID', '올바르지 않습니다'],
      ['INQUIRY_ALREADY_ANSWERED', '삭제할 수 없습니다'],
      ['PORTAL_INQUIRY_NOT_FOUND', '찾을 수 없습니다'],
      ['PORTAL_INQUIRY_DELETE_CONFLICT', '문의 상태가 변경'],
    ] as const

    for (const [code, expectedMessage] of cases) {
      const error = new AxiosError(code)
      error.response = {
        status: code === 'PORTAL_INQUIRY_NOT_FOUND' ? 404 : 409,
        data: { success: false, data: null, error: { code } },
      } as never
      expect(getInquiryApiErrorCode(error)).toBe(code)
      expect(getInquiryApiErrorMessage(error, 'fallback')).toContain(expectedMessage)
    }
  })
})
