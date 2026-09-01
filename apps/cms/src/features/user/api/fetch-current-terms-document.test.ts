import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fetchCurrentTermsDocumentMeta } from './fetch-current-terms-document'

vi.mock('@/shared/api/orval-mutator', () => ({
  customInstance: vi.fn(),
}))

import { customInstance } from '@/shared/api/orval-mutator'

describe('fetchCurrentTermsDocumentMeta', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('CONSENT current 404 후 PRE_CONSENT current 200이면 meta를 반환한다', async () => {
    vi.mocked(customInstance)
      .mockRejectedValueOnce({ response: { status: 404 } })
      .mockResolvedValueOnce({
        success: true,
        data: { version: '2026-08', requiredYn: false, id: 1 },
      })

    const meta = await fetchCurrentTermsDocumentMeta('PAYMENT_STATEMENT_CONSENT')

    expect(meta).toEqual({ version: '2026-08', required: false })
    expect(customInstance).toHaveBeenCalledTimes(2)
    expect(vi.mocked(customInstance).mock.calls[0]?.[0]?.url).toContain(
      'PAYMENT_STATEMENT_CONSENT'
    )
    expect(vi.mocked(customInstance).mock.calls[1]?.[0]?.url).toContain(
      'PAYMENT_STATEMENT_PRE_CONSENT'
    )
  })

  it('모든 alias가 실패하면 null을 반환한다', async () => {
    vi.mocked(customInstance).mockRejectedValue({ response: { status: 404 } })

    const meta = await fetchCurrentTermsDocumentMeta('PAYMENT_STATEMENT_CONSENT')

    expect(meta).toBeNull()
    expect(customInstance).toHaveBeenCalledTimes(3)
  })
})
