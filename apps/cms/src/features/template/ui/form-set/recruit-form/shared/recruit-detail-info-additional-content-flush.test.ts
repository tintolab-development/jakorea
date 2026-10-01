import { afterEach, describe, expect, it } from 'vitest'
import {
  flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay,
  flushRecruitDetailRichTextIntoGeneralRecruitOverlay,
  registerRecruitDetailAdditionalContentHtml,
  registerRecruitDetailRichTextHtml,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-additional-content-flush'
import {
  getGeneralRecruitOverlayRecord,
  resetGeneralRecruitOverlay,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'

describe('recruit-detail-info-additional-content-flush', () => {
  afterEach(() => {
    registerRecruitDetailAdditionalContentHtml('recruit.detailInfo.additionalContentHtml', null)
    registerRecruitDetailRichTextHtml('recruit.detailInfo.recruitmentGuide', null)
    registerRecruitDetailAdditionalContentHtml(
      'recruitVolunteer.detailInfo.additionalContentHtml',
      null
    )
    resetGeneralRecruitOverlay()
  })

  it('flushes registered editor HTML into general recruit overlay', () => {
    registerRecruitDetailAdditionalContentHtml(
      'recruit.detailInfo.additionalContentHtml',
      () => '<p>기관 추가</p>'
    )
    registerRecruitDetailAdditionalContentHtml(
      'recruitVolunteer.detailInfo.additionalContentHtml',
      () => '<p>봉사자 추가</p>'
    )

    flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay()

    const overlay = getGeneralRecruitOverlayRecord()
    expect(overlay['recruit.detailInfo.additionalContentHtml']).toBe('<p>기관 추가</p>')
    expect(overlay['recruitVolunteer.detailInfo.additionalContentHtml']).toBe('<p>봉사자 추가</p>')
  })

  it('flushes non-additional rich text fields into general recruit overlay', () => {
    registerRecruitDetailRichTextHtml(
      'recruit.detailInfo.recruitmentGuide',
      () => '<p>모집 안내</p>'
    )

    flushRecruitDetailRichTextIntoGeneralRecruitOverlay()

    expect(getGeneralRecruitOverlayRecord()['recruit.detailInfo.recruitmentGuide']).toBe(
      '<p>모집 안내</p>'
    )
  })
})
