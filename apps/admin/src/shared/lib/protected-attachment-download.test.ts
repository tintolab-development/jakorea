import { describe, expect, it } from 'vitest'
import {
  homepageCorporateConsultationAttachmentUrl,
  homepageRecruitAttachmentUrl,
  homepageTalentDonationAttachmentUrl,
} from './protected-attachment-download'

describe('homepage protected attachment urls', () => {
  it('uses asset path when assetId is present', () => {
    expect(homepageRecruitAttachmentUrl(12, 88)).toBe(
      '/api/admin/careers/talent-applications/12/attachments/88/download'
    )
    expect(homepageTalentDonationAttachmentUrl(3, 9)).toBe(
      '/api/admin/sponsorship/talent-applications/3/attachments/9/download'
    )
    expect(homepageCorporateConsultationAttachmentUrl(4, 5)).toBe(
      '/api/admin/sponsorship/corporate-consultations/4/attachments/5/download'
    )
  })

  it('falls back to attachment-download when assetId is missing', () => {
    expect(homepageRecruitAttachmentUrl(12)).toBe(
      '/api/admin/careers/talent-applications/12/attachment-download'
    )
    expect(homepageTalentDonationAttachmentUrl(3, null)).toBe(
      '/api/admin/sponsorship/talent-applications/3/attachment-download'
    )
    expect(homepageCorporateConsultationAttachmentUrl(4)).toBe(
      '/api/admin/sponsorship/corporate-consultations/4/attachment-download'
    )
  })
})
