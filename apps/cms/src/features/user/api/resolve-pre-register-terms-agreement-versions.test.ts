import { describe, expect, it, vi, beforeEach } from 'vitest'
import { resolvePreRegisterTermsAgreementVersions } from './resolve-pre-register-terms-agreement-versions'

vi.mock('@/features/user/api/fetch-current-terms-document', () => ({
  fetchCurrentTermsDocumentsMetaMap: vi.fn(),
}))

import { fetchCurrentTermsDocumentsMetaMap } from '@/features/user/api/fetch-current-terms-document'

describe('resolvePreRegisterTermsAgreementVersions', () => {
  beforeEach(() => {
    vi.mocked(fetchCurrentTermsDocumentsMetaMap).mockReset()
  })

  it('현재 게시 약관 version으로 termsAgreements를 갱신한다', async () => {
    vi.mocked(fetchCurrentTermsDocumentsMetaMap).mockResolvedValue(
      new Map([
        ['SERVICE_TERMS', { version: '2026-01', required: true }],
        ['MARKETING', { version: '2026-02', required: false }],
      ])
    )

    const rows = await resolvePreRegisterTermsAgreementVersions([
      {
        termsType: 'SERVICE_TERMS',
        version: '1.0',
        required: true,
        agreed: true,
      },
      {
        termsType: 'MARKETING',
        version: '1.0',
        required: false,
        agreed: true,
      },
    ])

    expect(rows).toEqual([
      {
        termsType: 'SERVICE_TERMS',
        version: '2026-01',
        required: true,
        agreed: true,
      },
      {
        termsType: 'MARKETING',
        version: '2026-02',
        required: false,
        agreed: true,
      },
    ])
  })

  it('약관 version 조회 실패 시 에러를 던진다', async () => {
    vi.mocked(fetchCurrentTermsDocumentsMetaMap).mockResolvedValue(
      new Map([['SERVICE_TERMS', { version: '2026-01', required: true }]])
    )

    await expect(
      resolvePreRegisterTermsAgreementVersions([
        {
          termsType: 'SERVICE_TERMS',
          version: '1.0',
          required: true,
          agreed: true,
        },
        {
          termsType: 'PRIVACY_COLLECTION',
          version: '1.0',
          required: true,
          agreed: true,
        },
      ])
    ).rejects.toThrow('PRIVACY_COLLECTION')
  })
})
